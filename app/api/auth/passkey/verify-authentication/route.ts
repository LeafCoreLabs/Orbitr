import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { authenticators, passkeyChallenges, users } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { getRpId, getExpectedOrigin } from "@/lib/passkey";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { challengeId, response } = body;

    if (!challengeId || !response) {
      return NextResponse.json({ error: "Missing challenge or response data" }, { status: 400 });
    }

    // 1. Fetch challenge
    const challenges = await db
      .select()
      .from(passkeyChallenges)
      .where(
        and(
          eq(passkeyChallenges.id, challengeId),
          gt(passkeyChallenges.expiresAt, new Date())
        )
      )
      .limit(1);

    if (challenges.length === 0) {
      return NextResponse.json({ error: "Invalid or expired challenge" }, { status: 400 });
    }

    const expectedChallenge = challenges[0].challenge;

    // 2. Fetch authenticator by credential ID (response.id)
    const credId = response.id;
    const authList = await db
      .select()
      .from(authenticators)
      .where(eq(authenticators.id, credId))
      .limit(1);

    if (authList.length === 0) {
      return NextResponse.json({ error: "Unrecognized passkey credential" }, { status: 404 });
    }

    const auth = authList[0];
    const rpID = getRpId(req);
    const expectedOrigin = getExpectedOrigin(req);

    // 3. Verify response
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(auth.id, "base64url"),
        credentialPublicKey: Buffer.from(auth.credentialPublicKey, "base64"),
        counter: Number(auth.counter),
        transports: auth.transports ? JSON.parse(auth.transports) : undefined,
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: "Passkey verification failed" }, { status: 400 });
    }

    // 4. Update counter in DB
    const { newCounter } = verification.authenticationInfo;
    await db
      .update(authenticators)
      .set({ counter: newCounter })
      .where(eq(authenticators.id, auth.id));

    // Delete used challenge
    await db.delete(passkeyChallenges).where(eq(passkeyChallenges.id, challengeId));

    // 5. Issue short-lived passkey authorization token (valid for 60s) for NextAuth
    const passkeyToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 1000);

    await db.insert(passkeyChallenges).values({
      id: passkeyToken,
      challenge: "PASSKEY_AUTH_TOKEN",
      userId: auth.userId,
      expiresAt,
    });

    // Lookup user email
    const userRes = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    return NextResponse.json({
      success: true,
      passkeyToken,
      email: userRes[0]?.email || "",
    });
  } catch (err) {
    console.error("[Passkey Verify Auth Error]", err);
    return NextResponse.json(
      { error: "Passkey verification could not be completed" },
      { status: 500 }
    );
  }
}
