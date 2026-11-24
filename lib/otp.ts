import crypto from "crypto";
import { db } from "./db";
import { otpCodes, users, type OtpPurpose } from "./db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { mailer } from "./mailer";
import { otpSendLimiter, otpVerifyLimiter } from "./rate-limit";

const OTP_PEPPER = process.env.OTP_PEPPER || "orbitr-default-development-pepper-32-chars";

/**
 * Generate a cryptographically secure 6-digit numeric OTP code.
 */
export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Compute HMAC-SHA256 of the OTP code with server secret pepper.
 */
export function hashOtp(code: string): string {
  return crypto.createHmac("sha256", OTP_PEPPER).update(code).digest("hex");
}

/**
 * Constant-time comparison between input OTP and stored HMAC hash.
 */
export function verifyOtpHash(inputCode: string, storedHash: string): boolean {
  const computedHash = hashOtp(inputCode);
  const hashBuf = Buffer.from(computedHash, "utf-8");
  const storedBuf = Buffer.from(storedHash, "utf-8");

  if (hashBuf.length !== storedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(hashBuf, storedBuf);
}

export interface CreateOtpParams {
  email: string;
  userId?: string;
  purpose: OtpPurpose;
  ip?: string;
  userAgent?: string;
}

export interface OtpResult {
  success: boolean;
  message?: string;
  cooldownSeconds?: number;
  error?: string;
}

/**
 * Generate, persist, and dispatch a secure OTP via Mailer.
 * Enforces:
 * - 60s resend cooldown
 * - 5 sends per hour per email/IP
 * - Invalidates any previous unused codes for this email and purpose
 */
export async function createAndSendOtp(params: CreateOtpParams): Promise<OtpResult> {
  const normalizedEmail = params.email.trim().toLowerCase();

  // 1. Rate Limiting: Max 5 sends per hour per email
  const limitRes = await otpSendLimiter.limit(`otp_send:${normalizedEmail}`);
  if (!limitRes.success) {
    return {
      success: false,
      error: "Too many verification requests. Please try again in an hour.",
    };
  }

  // 2. Cooldown check: Check if an active code was issued within the last 60 seconds
  try {
    const recentOtps = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, normalizedEmail),
          eq(otpCodes.purpose, params.purpose),
          isNull(otpCodes.consumedAt)
        )
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (recentOtps.length > 0) {
      const lastOtp = recentOtps[0];
      const elapsedMs = Date.now() - new Date(lastOtp.createdAt).getTime();
      const cooldownMs = 60 * 1000;

      if (elapsedMs < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
        return {
          success: false,
          error: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
          cooldownSeconds: remainingSeconds,
        };
      }

      // 3. Invalidate earlier unused OTPs for the same purpose
      await db
        .update(otpCodes)
        .set({ consumedAt: new Date() })
        .where(
          and(
            eq(otpCodes.email, normalizedEmail),
            eq(otpCodes.purpose, params.purpose),
            isNull(otpCodes.consumedAt)
          )
        );
    }
  } catch (err) {
    console.error("[OTP] Error checking cooldown / previous OTPs:", err);
  }

  // 4. Generate fresh 6-digit code & HMAC-SHA256 hash
  const code = generateOtp();
  const codeHash = hashOtp(code);
  const otpId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // 5. Store in database
  try {
    await db.insert(otpCodes).values({
      id: otpId,
      email: normalizedEmail,
      userId: params.userId || null,
      purpose: params.purpose,
      codeHash,
      expiresAt,
      attempts: 0,
      createdAt: new Date(),
      ip: params.ip || null,
      userAgent: params.userAgent || null,
    });
  } catch (err) {
    console.error("[OTP] Failed to insert OTP into database:", err);
    return {
      success: false,
      error: "Unable to process verification request. Please try again later.",
    };
  }

  // 6. Send email via mailer
  const sent = await mailer.sendOtp(normalizedEmail, {
    code,
    purpose: params.purpose,
    ip: params.ip,
    userAgent: params.userAgent,
    time: new Date().toUTCString(),
  });

  if (!sent) {
    return {
      success: false,
      error: "Failed to dispatch verification email. Please try again.",
    };
  }

  return {
    success: true,
    message: "Verification code sent to your email.",
  };
}

export interface VerifyOtpParams {
  email: string;
  code: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpResult {
  success: boolean;
  userId?: string | null;
  error?: string;
}

/**
 * Verify a submitted 6-digit OTP.
 * Enforces:
 * - Rate limiting on verification attempts
 * - Expiry within 10 minutes
 * - Single-use consumption
 * - Max 5 failed attempts before code is destroyed
 * - Constant-time comparison
 * - Generic error messages to prevent email harvesting
 */
export async function verifyOtp(params: VerifyOtpParams): Promise<VerifyOtpResult> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const cleanCode = params.code.trim();

  // Basic sanity check
  if (!/^\d{6}$/.test(cleanCode)) {
    return {
      success: false,
      error: "Invalid code format. Please provide a 6-digit number.",
    };
  }

  // Rate limit verification attempts
  const limit = await otpVerifyLimiter.limit(`otp_verify:${normalizedEmail}`);
  if (!limit.success) {
    return {
      success: false,
      error: "Too many failed attempts. Please wait a few minutes before trying again.",
    };
  }

  try {
    // Find the latest active OTP for this email and purpose
    const records = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, normalizedEmail),
          eq(otpCodes.purpose, params.purpose),
          isNull(otpCodes.consumedAt)
        )
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (records.length === 0) {
      return {
        success: false,
        error: "Invalid or expired verification code.",
      };
    }

    const record = records[0];

    // Check expiry (10 minutes)
    if (new Date() > new Date(record.expiresAt)) {
      // Mark as consumed/expired
      await db
        .update(otpCodes)
        .set({ consumedAt: new Date() })
        .where(eq(otpCodes.id, record.id));

      return {
        success: false,
        error: "Verification code has expired. Please request a new one.",
      };
    }

    // Check max attempts (5 wrong attempts)
    if (record.attempts >= 5) {
      await db
        .update(otpCodes)
        .set({ consumedAt: new Date() })
        .where(eq(otpCodes.id, record.id));

      return {
        success: false,
        error: "Maximum attempts exceeded. This code is now invalid. Please request a new one.",
      };
    }

    // Constant-time comparison
    const isValid = verifyOtpHash(cleanCode, record.codeHash);

    if (!isValid) {
      const nextAttempts = record.attempts + 1;
      await db
        .update(otpCodes)
        .set({
          attempts: nextAttempts,
          ...(nextAttempts >= 5 ? { consumedAt: new Date() } : {}),
        })
        .where(eq(otpCodes.id, record.id));

      if (nextAttempts >= 5) {
        return {
          success: false,
          error: "Maximum attempts exceeded. This code is now invalid. Please request a new one.",
        };
      }

      return {
        success: false,
        error: `Invalid verification code. ${5 - nextAttempts} attempt(s) remaining.`,
      };
    }

    // Code is valid: Mark as consumed (single use)
    await db
      .update(otpCodes)
      .set({ consumedAt: new Date() })
      .where(eq(otpCodes.id, record.id));

    // If this was an account signup, update email_verified_at
    if (params.purpose === "signup") {
      if (record.userId) {
        await db
          .update(users)
          .set({ emailVerifiedAt: new Date() })
          .where(eq(users.id, record.userId));
      } else {
        await db
          .update(users)
          .set({ emailVerifiedAt: new Date() })
          .where(eq(users.email, normalizedEmail));
      }
    }

    return {
      success: true,
      userId: record.userId,
    };
  } catch (err) {
    console.error("[OTP] Error verifying code:", err);
    return {
      success: false,
      error: "Unable to verify code. Please try again.",
    };
  }
}
