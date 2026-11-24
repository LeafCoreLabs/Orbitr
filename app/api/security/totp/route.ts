import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const userRes = await db
      .select({ totpSecretEnc: users.totpSecretEnc, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const isEnabled = Boolean(userRes[0]?.totpSecretEnc);

    return NextResponse.json({
      enabled: isEnabled,
    });
  } catch (err) {
    console.error("[TOTP Status Error]", err);
    return NextResponse.json({ error: "Failed to fetch 2FA status" }, { status: 500 });
  }
}

// POST: Generate new TOTP setup secret or verify code to enable
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { action, secret, code } = body;

    const userRes = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRes.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const email = userRes[0].email;

    if (action === "setup") {
      // Generate 20-byte base32 secret
      const randomBytes = crypto.randomBytes(20);
      const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      let base32Secret = "";
      for (let i = 0; i < randomBytes.length; i++) {
        base32Secret += base32Chars[randomBytes[i] % 32];
      }

      const otpauthUri = `otpauth://totp/Vaulta:${encodeURIComponent(email)}?secret=${base32Secret}&issuer=Vaulta`;
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
        margin: 2,
        color: {
          dark: "#38bdf8",
          light: "#0b0f19",
        },
      });

      return NextResponse.json({
        secret: base32Secret,
        qrCode: qrCodeDataUrl,
      });
    }

    if (action === "verify_and_enable") {
      if (!secret || !code) {
        return NextResponse.json({ error: "Secret and 6-digit code required" }, { status: 400 });
      }

      // For standard TOTP 6-digit verification
      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
      }

      // Save encrypted/encoded secret in database
      await db
        .update(users)
        .set({ totpSecretEnc: secret })
        .where(eq(users.id, userId));

      return NextResponse.json({
        success: true,
        message: "Two-factor authentication successfully enabled.",
      });
    }

    if (action === "disable") {
      await db
        .update(users)
        .set({ totpSecretEnc: null })
        .where(eq(users.id, userId));

      return NextResponse.json({
        success: true,
        message: "Two-factor authentication disabled.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[TOTP Action Error]", err);
    return NextResponse.json({ error: "Failed to configure 2FA" }, { status: 500 });
  }
}
