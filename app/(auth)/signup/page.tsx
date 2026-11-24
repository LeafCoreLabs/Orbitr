"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { motion } from "framer-motion";
import { ShaderMeshBackground } from "@/components/ui/ShaderMeshBackground";
import {
  User,
  AtSign,
  Calendar,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Helper validation indicators
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !handle.trim() || !dateOfBirth || !email.trim() || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (handle.trim().length < 3) {
      toast.error("User ID must be at least 3 characters long.");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(handle.trim())) {
      toast.error("User ID can only contain letters, numbers, hyphens, and underscores.");
      return;
    }

    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber) {
      toast.error("Password must be 8+ chars and include uppercase, lowercase, and a number.");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          handle: handle.trim().toLowerCase(),
          dateOfBirth,
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account.");
      }

      toast.success(
        "Account created! Your User ID, password, and OTP code have been emailed to your inbox."
      );
      router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true);
      const res = await signIn("google", { callbackUrl: "/drive", redirect: false });
      if (res?.error) {
        toast.error("Google OAuth credentials missing. Add AUTH_GOOGLE_ID in .env.local, or sign up with email & OTP.");
        setGoogleLoading(false);
        return;
      }
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error(err);
      toast.error("Google OAuth requires AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in .env.local.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8 bg-[#15171c] text-slate-100 relative overflow-hidden">
      {/* Top Left Navigation Back Button */}
      <div className="absolute top-5 left-5 sm:top-8 sm:left-8 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl neu-btn transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg shader-card p-7 sm:p-8 space-y-5 my-6 z-10"
      >
        <div className="text-center space-y-1.5">
          <div className="flex justify-center mb-1">
            <Logo size="md" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Create your Orbitr Account
          </h1>
          <p className="text-xs text-slate-400">
            Zero-knowledge encrypted cloud &bull; Credentials emailed on signup
          </p>
        </div>

        {/* Option 1: Continue with Google */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 bg-[#1e222b] hover:bg-[#252a36] text-white border border-white/[0.08] shadow-md py-2.5 rounded-xl transition-all text-xs font-semibold cursor-pointer active:scale-[0.98]"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="text-white font-semibold">{googleLoading ? "Connecting to Google..." : "Continue with Google (Free & Instant)"}</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#262a34] w-full" />
          <span className="bg-[#181b22] px-3 py-0.5 text-[10px] sm:text-[11px] text-slate-300 uppercase tracking-wider font-semibold shrink-0 rounded-md border border-white/[0.08]">
            or complete direct registration
          </span>
          <div className="border-t border-[#262a34] w-full" />
        </div>

        {/* Option 2: Extensive Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          {/* Full Name & User ID (2 columns on tablet/desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-200">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full neu-inset rounded-xl p-2.5 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none pl-9 transition-colors"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-200">User ID / Username</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="alex_orbitr"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  className="w-full neu-inset rounded-xl p-2.5 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none pl-9 font-mono transition-colors"
                />
                <AtSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Email Address & Date of Birth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-200">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full neu-inset rounded-xl p-2.5 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none pl-9 transition-colors"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Date of Birth</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split("T")[0]}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full neu-inset rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none pl-9 transition-colors"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Password with Eye icon */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Min 8 chars, uppercase, lowercase, number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {/* Confirm Password with Eye icon */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
              {password && confirmPassword && (
                <span
                  className={`text-[11px] font-semibold flex items-center gap-1 ${
                    passwordsMatch ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> Passwords match
                    </>
                  ) : (
                    "Passwords do not match"
                  )}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="Re-type your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full neu-inset rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none pl-9 pr-10 transition-colors ${
                  confirmPassword && !passwordsMatch ? "border-rose-400" : ""
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

          {/* Password strength checks mini indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[10px] text-slate-500">
            <div className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-600 font-semibold" : ""}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span>8+ chars</span>
            </div>
            <div className={`flex items-center gap-1 ${hasUpper ? "text-emerald-600 font-semibold" : ""}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasUpper ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span>Uppercase</span>
            </div>
            <div className={`flex items-center gap-1 ${hasLower ? "text-emerald-600 font-semibold" : ""}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasLower ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span>Lowercase</span>
            </div>
            <div className={`flex items-center gap-1 ${hasNumber ? "text-emerald-600 font-semibold" : ""}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span>Number</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-2 neu-btn-primary font-semibold py-3 rounded-xl shadow-md transition-all text-sm cursor-pointer mt-3 active:scale-[0.98]"
          >
            <span>{loading ? "Registering & Emailing Credentials..." : "Sign Up & Verify via OTP"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-[#22252e] text-center text-xs text-slate-400 signup-anim">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Sign in
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center signup-anim">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>A copy of your User ID and credentials will be sent to your email</span>
        </div>
      </motion.div>
    </div>
  );
}
