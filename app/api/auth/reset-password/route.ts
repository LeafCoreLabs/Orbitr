import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validators";
import { verifyOtp } from "@/lib/otp";
import { db } from "@/lib/db";
import { users, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { mailer } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "Web Browser";

  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { email, code, newPassword } = parsed.data;

    // Verify OTP for password_reset purpose
    const verifyResult = await verifyOtp({
      email,
      code,
      purpose: "password_reset",
    });

    if (!verifyResult.success) {
      return NextResponse.json(
        { error: verifyResult.error || "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    // Hash new password with argon2id
    const newPasswordHash = await hash(newPassword);

    const userList = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userList.length > 0) {
      await db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, userList[0].id));

      // Audit log
      await db.insert(activityLog).values({
        id: crypto.randomUUID(),
        userId: userList[0].id,
        action: "password_reset",
        ip,
        userAgent,
        createdAt: new Date(),
      });
    }

    // Send security alert email
    try {
      await mailer.sendSecurityAlert(email, {
        alertType: "Password Changed",
        details: "Your Vaulta account password was successfully reset. If you did not make this change, secure your account immediately.",
        ip,
        userAgent,
        time: new Date().toUTCString(),
      });
    } catch (err) {
      console.warn("[Reset Password] Failed to dispatch security alert email:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (err) {
    console.error("[Reset Password Error]", err);
    return NextResponse.json(
      { error: "Unable to complete password reset." },
      { status: 500 }
    );
  }
}
