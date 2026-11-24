import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { signupSchema } from "@/lib/validators";
import { createAndSendOtp } from "@/lib/otp";
import { mailer } from "@/lib/mailer";
import { authLimiter } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "Web Browser";

  // Rate limit signups
  const limitRes = await authLimiter.limit(`signup:${ip}`);
  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { name, handle, dateOfBirth, email, password } = parsed.data;

    // Check if email or handle is already registered
    const existingUsers = await db
      .select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.handle, handle)))
      .limit(1);

    const passwordHash = await hash(password);

    let userId: string;

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.emailVerifiedAt) {
        if (existingUser.handle === handle && existingUser.email !== email) {
          return NextResponse.json(
            { error: "This User ID is already taken. Please choose another." },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }

      // Existing unverified account: update credentials and re-issue OTP
      userId = existingUser.id;
      await db
        .update(users)
        .set({
          name,
          handle,
          dateOfBirth,
          passwordHash,
        })
        .where(eq(users.id, userId));
    } else {
      userId = crypto.randomUUID();
      await db.insert(users).values({
        id: userId,
        email,
        handle,
        name,
        dateOfBirth,
        passwordHash,
        emailVerifiedAt: null, // Unusable until verified
        quotaBytes: 2147483648, // 2 GB
        usedBytes: 0,
        createdAt: new Date(),
      });
    }

    // Send 6-digit verification OTP
    const otpRes = await createAndSendOtp({
      email,
      userId,
      purpose: "signup",
      ip,
      userAgent,
    });

    if (!otpRes.success) {
      return NextResponse.json(
        { error: otpRes.error || "Failed to dispatch verification code" },
        { status: 400 }
      );
    }

    // Dispatch welcome email containing User ID and Password
    try {
      await mailer.sendAccountCredentials(email, {
        name,
        userId: handle,
        email,
        password,
        dateOfBirth,
        signupMethod: "form",
      });
    } catch (err) {
      console.warn("[Signup] Failed to send credentials email:", err);
    }

    return NextResponse.json({
      success: true,
      email,
      handle,
      message: "Account created! A verification code and your login credentials have been emailed to you.",
    });
  } catch (err) {
    console.error("[Signup Error]", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during signup." },
      { status: 500 }
    );
  }
}
