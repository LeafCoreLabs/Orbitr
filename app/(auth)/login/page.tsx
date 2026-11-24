"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { motion } from "framer-motion";
import { ShaderMeshBackground } from "@/components/ui/ShaderMeshBackground";
import { MagneticButton } from "@/components/ui/MagneticButton";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { signIn } from "next-auth/react";
import { startAuthentication } from "@simplewebauthn/browser";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim() || !password) {
      toast.error("Please enter both Email/User ID and password.");
      return;
    }

    try {
      setLoading(true);

      const result = await signIn("credentials", {
        email: identifier.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("UNVERIFIED_EMAIL") || result.code === "UNVERIFIED_EMAIL") {
          toast.info("Account unverified. A fresh security code has been emailed to you.");
          router.push(`/verify-email?email=${encodeURIComponent(identifier.trim().toLowerCase())}`);
          return;
        }

        toast.error("Invalid credentials. Please verify your Email/User ID and password.");
        return;
      }

      toast.success("Welcome back! Loading your Orbitr drive...");
      router.push("/drive");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const res = await signIn("google", { callbackUrl: "/drive", redirect: false });
      if (res?.error) {
        toast.error("Google OAuth error. Please check your credentials in .env.local.");
        setGoogleLoading(false);
        return;
      }
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not initialize Google Sign In.");
      setGoogleLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    try {
      setPasskeyLoading(true);

      // 1. Get authentication challenge from server
      const optRes = await fetch("/api/auth/passkey/generate-authentication-options", {
        method: "POST",
      });

      const { options, challengeId, error } = await optRes.json();
      if (!optRes.ok || error) {
        throw new Error(error || "Could not initialize passkey options.");
      }

      // 2. Start biometric / security key prompt on device
      const authResp = await startAuthentication(options);

      // 3. Verify authentication response on server
      const verifyRes = await fetch("/api/auth/passkey/verify-authentication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, response: authResp }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success || !verifyData.passkeyToken) {
        throw new Error(verifyData.error || "Passkey verification was rejected.");
      }

      // 4. Log in via NextAuth using the authorized passkey token
      const result = await signIn("credentials", {
        passkeyToken: verifyData.passkeyToken,
        email: verifyData.email,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success("Biometric Passkey verified! Welcome to Orbitr.");
      router.push("/drive");
      router.refresh();
    } catch (err: unknown) {
      console.error("[Passkey Error]", err);
      const msg = err instanceof Error ? err.message : "Passkey authentication failed.";
      if (msg.includes("The operation either timed out or was not allowed") || msg.includes("cancelled")) {
        toast.info("Passkey prompt was closed.");
      } else {
        toast.error(msg);
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#15171c] text-slate-100 relative overflow-hidden">
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
        className="relative w-full max-w-md shader-card p-8 space-y-5 my-6 z-10"
      >
        <div className="text-center space-y-1.5">
          <div className="flex justify-center mb-1">
            <Logo size="md" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Sign in to Orbitr
          </h1>
          <p className="text-xs text-slate-400">
            Your files, in orbit &bull; Passkeys & Google supported
          </p>
        </div>

        {/* Option 1: Continue with Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading || passkeyLoading}
          className="w-full flex items-center justify-center gap-3 neu-btn py-2.5 rounded-xl transition-all text-xs text-slate-100 font-semibold cursor-pointer active:scale-[0.98]"
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
          <span className="text-slate-100 font-semibold">{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
        </button>

        {/* Option 2: Sign in with Passkey / Biometrics */}
        <button
          type="button"
          onClick={handlePasskeySignIn}
          disabled={passkeyLoading || loading || googleLoading}
          className="w-full flex items-center justify-center gap-2.5 neu-btn py-2.5 rounded-xl text-indigo-300 font-semibold transition-all text-xs cursor-pointer active:scale-[0.98]"
        >
          <Fingerprint className="w-4 h-4 text-indigo-400" />
          <span>{passkeyLoading ? "Verifying Passkey..." : "Sign in with Passkey"}</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#262a34] w-full" />
          <span className="bg-[#181b22] px-3 py-0.5 text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-semibold shrink-0 rounded-md border border-white/[0.04]">
            or sign in with password
          </span>
          <div className="border-t border-[#262a34] w-full" />
        </div>

        {/* Option 3: Sign in with Email / User ID & Password */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Address or User ID</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="alex@example.com or alex_orbitr"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full neu-inset rounded-xl p-3 text-slate-100 text-xs focus:outline-none pl-10 transition-colors"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full neu-inset rounded-xl p-3 text-slate-100 text-xs focus:outline-none pl-10 pr-10 transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading || passkeyLoading}
            className="w-full flex items-center justify-center gap-2 neu-btn-primary font-semibold py-3 rounded-xl shadow-md transition-all text-sm cursor-pointer mt-2 active:scale-[0.98]"
          >
            <span>{loading ? "Signing in..." : "Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-[#22252e] text-center text-xs text-slate-400 login-anim">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Create account
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center login-anim">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>FIDO2 WebAuthn &bull; Encrypted sessions</span>
        </div>
      </motion.div>
    </div>
  );
}
