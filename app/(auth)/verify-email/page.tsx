"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Mail, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/Toast";
import confetti from "canvas-confetti";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60-second cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Update email if query param changes
  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  // Focus first input box on load
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    const char = cleaned.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    // Auto-advance to next box
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    const cleaned = pastedData.replace(/\D/g, "").slice(0, 6);

    if (!cleaned) return;

    const newDigits = [...digits];
    for (let i = 0; i < cleaned.length; i++) {
      newDigits[i] = cleaned[i];
    }
    setDigits(newDigits);

    const nextIndex = Math.min(cleaned.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const code = digits.join("");
  const isComplete = code.length === 6;

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isComplete || isVerifying) return;

    if (!email) {
      toast.error("Please enter the email address you registered with.");
      return;
    }

    try {
      setIsVerifying(true);
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code,
          purpose: "signup",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed.");
      }

      setVerifiedSuccess(true);
      toast.success("Email verified! Setting up your encrypted drive...");

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        router.push("/drive");
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      toast.error(msg);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    if (!email) {
      toast.error("Email required to resend verification code.");
      return;
    }

    try {
      setIsResending(true);
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "signup" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not resend code.");
      }

      toast.success("Fresh verification code sent to your email!");
      setCooldown(60);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Resend failed.";
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#15171c] text-slate-100 relative overflow-hidden">
      {/* Top Left Navigation Back Button */}
      <div className="absolute top-5 left-5 sm:top-8 sm:left-8 z-20">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl neu-btn transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Sign In</span>
        </Link>
      </div>
      <div className="relative w-full max-w-md shader-card p-8 space-y-6 text-center shadow-2xl">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>

        {verifiedSuccess ? (
          <div className="py-8 space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
            <h2 className="text-xl font-bold text-slate-100">Email Verified!</h2>
            <p className="text-xs text-slate-400">Launching your personal Orbitr drive...</p>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-slate-100">Verify your email</h1>
              <p className="text-xs text-slate-400">
                We sent a 6-digit security code to:
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-indigo-300 bg-[#181726] border border-indigo-500/30 px-3 py-1 rounded-full">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>{email || "your email address"}</span>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              {/* 6-box input */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="w-11 h-14 sm:w-12 sm:h-14 neu-inset rounded-xl text-center text-xl font-bold font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-xs"
                  />
                ))}
              </div>

              {/* Verify button */}
              <button
                type="submit"
                disabled={!isComplete || isVerifying}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-md shadow-sky-500/20 transition-all text-sm cursor-pointer disabled:cursor-not-allowed"
              >
                <span>{isVerifying ? "Verifying Code..." : "Verify & Access Drive"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Cooldown & Resend button */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <span>Didn&apos;t receive code?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isResending}
                  className="font-semibold text-indigo-400 hover:text-indigo-300 disabled:text-slate-400 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isResending ? "animate-spin" : ""}`} />
                  <span>{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}</span>
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-[#262a34] flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>HMAC-SHA256 &bull; Single-use security token</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#15171c]" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
