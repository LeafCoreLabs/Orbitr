import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validators";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createAndSendOtp } from "@/lib/otp";
import { authLimiter } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "Web Browser";

  const limitRes = await authLimiter.limit(`forgot:${ip}`);
  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid email" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Lookup user
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Constant response to prevent user enumeration
    if (userRecords.length > 0 && userRecords[0].emailVerifiedAt) {
      await createAndSendOtp({
        email,
        userId: userRecords[0].id,
        purpose: "password_reset",
        ip,
        userAgent,
      });
    }

    return NextResponse.json({
      success: true,
      message: "If an account matches that email address, an OTP has been sent.",
    });
  } catch (err) {
    console.error("[Forgot Password Error]", err);
    return NextResponse.json(
      { error: "Unable to process password reset request." },
      { status: 500 }
    );
  }
}
