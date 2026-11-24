import { NextRequest, NextResponse } from "next/server";
import { resendOtpSchema } from "@/lib/validators";
import { createAndSendOtp } from "@/lib/otp";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "Web Browser";

  try {
    const body = await req.json();
    const parsed = resendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { email, purpose } = parsed.data;

    // Optional user ID lookup
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const result = await createAndSendOtp({
      email,
      userId: user[0]?.id,
      purpose,
      ip,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Unable to resend verification code.",
          cooldownSeconds: result.cooldownSeconds,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "A fresh verification code has been dispatched to your email.",
    });
  } catch (err) {
    console.error("[Resend OTP Error]", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while resending code." },
      { status: 500 }
    );
  }
}
