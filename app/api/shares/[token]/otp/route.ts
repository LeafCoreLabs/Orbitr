import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { shares } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { createAndSendOtp, verifyOtp } from "@/lib/otp";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "Web Browser";

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const shareRes = await db
      .select()
      .from(shares)
      .where(or(eq(shares.tokenHash, tokenHash), eq(shares.tokenHash, token)))
      .limit(1);

    if (shareRes.length === 0) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    const share = shareRes[0];
    if (!share.recipientEmail) {
      return NextResponse.json({ error: "No recipient email set for this share" }, { status: 400 });
    }

    const body = await req.json();
    const { action, code } = body;

    if (action === "send") {
      const result = await createAndSendOtp({
        email: share.recipientEmail,
        purpose: "share_access",
        ip,
        userAgent,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Could not send verification code" },
          { status: 429 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Verification code sent to ${share.recipientEmail}`,
      });
    }

    if (action === "verify") {
      if (!code) {
        return NextResponse.json({ error: "Verification code required" }, { status: 400 });
      }

      const verifyRes = await verifyOtp({
        email: share.recipientEmail,
        code,
        purpose: "share_access",
      });

      if (!verifyRes.success) {
        return NextResponse.json(
          { error: verifyRes.error || "Invalid verification code" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        email: share.recipientEmail,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[Share OTP Error]", err);
    return NextResponse.json({ error: "Failed to handle share verification" }, { status: 500 });
  }
}
