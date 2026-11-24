import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { authenticators, passkeyChallenges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getRpId } from "@/lib/passkey";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email || "user@vaulta.local";
    const userName = session.user.name || userEmail;

    // Fetch existing authenticators to exclude
    const userAuthenticators = await db
      .select()
      .from(authenticators)
      .where(eq(authenticators.userId, userId));

    const rpID = getRpId(req);

    const options = await generateRegistrationOptions({
      rpName: "Orbitr",
      rpID,
      userID: userId,
      userName: userEmail,
      userDisplayName: userName,
      attestationType: "none",
      supportedAlgorithmIDs: [-7, -257], // -7 is ES256 (Android/Chrome/iOS), -257 is RS256 (Windows Hello PIN & TPM)
      excludeCredentials: userAuthenticators.map((a) => ({
        id: Buffer.from(a.id, "base64url"),
        type: "public-key" as const,
        transports: a.transports ? JSON.parse(a.transports) : undefined,
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    const challengeId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.insert(passkeyChallenges).values({
      id: challengeId,
      challenge: options.challenge,
      userId,
      expiresAt,
    });

    return NextResponse.json({ options, challengeId });
  } catch (err) {
    console.error("[Passkey Registration Options Error]", err);
    return NextResponse.json(
      { error: "Failed to generate passkey registration challenge" },
      { status: 500 }
    );
  }
}
