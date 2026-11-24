import { NextRequest, NextResponse } from "next/server";
import { verifyOtpSchema } from "@/lib/validators";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { email, code, purpose } = parsed.data;

    const result = await verifyOtp({
      email,
      code,
      purpose,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Verification failed." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email successfully verified. You can now sign in.",
    });
  } catch (err) {
    console.error("[Verify OTP Error]", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while verifying code." },
      { status: 500 }
    );
  }
}
