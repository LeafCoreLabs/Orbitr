"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import {
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your account email.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process request.");
      }

      toast.success("If an account exists, a 6-digit verification code has been sent.");
      setStep("reset");
      setCooldown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error sending code.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmNewPassword;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !newPassword) {
      toast.error("Please provide both the 6-digit code and new password.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    if (!passwordsMatch) {
      toast.error("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword,
          confirmNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Password reset failed.");
      }

      toast.success("Password reset successfully! Please sign in with your new password.");
      router.push("/login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Reset failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
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
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00a2ff] group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Sign In</span>
        </Link>
      </div>
      <div className="relative w-full max-w-md shader-card p-7 sm:p-8 space-y-5 shadow-2xl">
        <div className="text-center space-y-1.5">
          <div className="flex justify-center mb-1">
            <Logo size="md" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">
            {step === "request" ? "Reset Your Password" : "Enter Verification Code"}
          </h1>
          <p className="text-xs text-slate-400">
            {step === "request"
              ? "We will email a 6-digit one-time code to verify your identity"
              : `Enter the code sent to ${email} and choose a strong new password`}
          </p>
        </div>

        {step === "request" ? (
          <form onSubmit={handleRequestOtp} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Account Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full neu-inset rounded-xl p-3 text-slate-100 text-xs focus:outline-none pl-10 transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 neu-btn-primary text-white font-semibold py-3 rounded-xl shadow-md transition-all text-sm cursor-pointer mt-2"
            >
              <span>{loading ? "Sending Code..." : "Send Verification Code"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-3.5 text-left">
            {/* 6-Digit OTP */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">6-Digit Code</label>
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={cooldown > 0 || loading}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 disabled:text-slate-500 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                  <span>{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}</span>
                </button>
              </div>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full neu-inset rounded-xl p-2.5 text-slate-100 font-mono text-center tracking-[6px] text-xl font-bold focus:outline-none transition-colors"
              />
            </div>

            {/* New Password with Eye */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Min 8 chars, uppercase, lowercase, number"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full neu-inset rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none pl-9 pr-10 transition-colors"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password with Eye */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Confirm New Password</label>
                {newPassword && confirmNewPassword && (
                  <span
                    className={`text-[11px] font-semibold flex items-center gap-1 ${
                      passwordsMatch ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Match
                      </>
                    ) : (
                      "Do not match"
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className={`w-full neu-inset rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none pl-9 pr-10 transition-colors ${
                    confirmNewPassword && !passwordsMatch
                      ? "border-rose-400"
                      : ""
                  }`}
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 neu-btn-primary text-white font-semibold py-3 rounded-xl shadow-md transition-all text-sm cursor-pointer mt-2"
            >
              <span>{loading ? "Updating Password..." : "Update Password & Secure Account"}</span>
              <KeyRound className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-[#262a34] text-center text-xs text-slate-500">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
