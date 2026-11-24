import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { passkeyChallenges } from "@/lib/db/schema";
import { getRpId } from "@/lib/passkey";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const rpID = getRpId(req);

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
    });

    const challengeId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await db.insert(passkeyChallenges).values({
      id: challengeId,
      challenge: options.challenge,
      userId: null,
      expiresAt,
    });

    return NextResponse.json({ options, challengeId });
  } catch (err) {
    console.error("[Passkey Auth Options Error]", err);
    return NextResponse.json(
      { error: "Failed to generate passkey authentication challenge" },
      { status: 500 }
    );
  }
}
