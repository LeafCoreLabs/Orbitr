import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { authenticators, passkeyChallenges, activityLog } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { getRpId, getExpectedOrigin, getAllowedOrigins } from "@/lib/passkey";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
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
          eq(passkeyChallenges.userId, userId),
          gt(passkeyChallenges.expiresAt, new Date())
        )
      )
      .limit(1);

    if (challenges.length === 0) {
      return NextResponse.json({ error: "Invalid or expired challenge" }, { status: 400 });
    }

    const expectedChallenge = challenges[0].challenge;
    const rpID = getRpId(req);
    const expectedOrigin = getAllowedOrigins(req);

    // 2. Verify registration response
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Passkey registration verification failed" }, { status: 400 });
    }

    const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    // 3. Store new authenticator
    const credIdString =
      typeof credentialID === "string"
        ? credentialID
        : Buffer.from(credentialID).toString("base64url");

    await db.insert(authenticators).values({
      id: credIdString,
      userId,
      credentialPublicKey: Buffer.from(credentialPublicKey).toString("base64"),
      counter,
      credentialDeviceType,
      credentialBackedUp,
      transports: response.response.transports ? JSON.stringify(response.response.transports) : null,
      createdAt: new Date(),
    });

    // Delete used challenge
    await db.delete(passkeyChallenges).where(eq(passkeyChallenges.id, challengeId));

    // Audit log
    await db.insert(activityLog).values({
      id: crypto.randomUUID(),
      userId,
      action: "passkey_registered",
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "Unknown IP",
      userAgent: req.headers.get("user-agent") || "Web Browser",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, message: "Passkey registered successfully!" });
  } catch (err) {
    console.error("[Passkey Verify Reg Error]", err);
    return NextResponse.json(
      { error: "Could not register passkey" },
      { status: 500 }
    );
  }
}
