"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { startAuthentication } from "@simplewebauthn/browser";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  AtSign,
  Calendar,
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { AuroraCanvas } from "@/components/ui/AuroraCanvas";
import { toast } from "@/components/ui/Toast";
import { APPLE_SPRING } from "@/lib/motion";

interface AuthViewProps {
  initialMode: "login" | "signup";
}

function computePasswordStrength(pw: string): {
  score: number;
  label: string;
  barColor: string;
  textColor: string;
} {
  if (!pw) {
    return {
      score: 0,
      label: "Enter password (min 8 chars, upper, lower & number)",
      barColor: "bg-sky-950",
      textColor: "text-slate-400",
    };
  }
  let pts = 0;
  if (pw.length >= 8) pts += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) pts += 1;
  if (/\d/.test(pw)) pts += 1;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) pts += 1;

  const map = [
    { score: 1, label: "Weak password strength", barColor: "bg-rose-500", textColor: "text-rose-400" },
    { score: 2, label: "Fair password strength", barColor: "bg-amber-400", textColor: "text-amber-300" },
    { score: 3, label: "Strong password", barColor: "bg-sky-400", textColor: "text-sky-300" },
    {
      score: 4,
      label: "High-entropy Argon2 + PBKDF2 ready",
      barColor: "bg-emerald-400",
      textColor: "text-emerald-300",
    },
  ];
  return map[Math.max(0, pts - 1)];
}

export function AuthView({ initialMode }: AuthViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/drive";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const isSignup = mode === "signup";

  const [fullName, setFullName] = useState("");
  const [handle, setHandle] = useState("");
  const [dob, setDob] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    handle?: string;
    dob?: string;
    identifier?: string;
    password?: string;
  }>({});
  const [shakeTrigger, setShakeTrigger] = useState(0);

  const strength = useMemo(() => computePasswordStrength(password), [password]);

  const switchMode = (nextMode: "login" | "signup") => {
    setErrors({});
    setMode(nextMode);
    router.replace(nextMode === "signup" ? "/signup" : "/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};

    if (isSignup) {
      if (fullName.trim().length < 2) {
        nextErrors.name = "Enter your full name.";
      }
      const cleanHandle = handle.trim().replace(/^@/, "");
      if (cleanHandle.length < 3 || !/^[a-zA-Z0-9_-]+$/.test(cleanHandle)) {
        nextErrors.handle = "Use 3+ letters, numbers, hyphens, or underscores.";
      }
      if (!identifier.trim() || !identifier.includes("@")) {
        nextErrors.identifier = "Enter a valid email address for OTP verification.";
      }
      if (!dob) {
        nextErrors.dob = "Select your date of birth.";
      }
      if (
        password.length < 8 ||
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/[0-9]/.test(password)
      ) {
        nextErrors.password = "Must be 8+ chars with uppercase, lowercase, and a number.";
      }
    } else {
      if (!identifier.trim() || identifier.trim().length < 3) {
        nextErrors.identifier = "Enter your email address or unique User ID (@handle).";
      }
      if (!password) {
        nextErrors.password = "Enter your account password.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setShakeTrigger((prev) => prev + 1);
      return;
    }

    setErrors({});

    if (isSignup) {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fullName.trim(),
            handle: handle.trim().replace(/^@/, "").toLowerCase(),
            dateOfBirth: dob,
            email: identifier.trim().toLowerCase(),
            password,
            confirmPassword: password,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to create account.");
        }
        toast.success("Account created! Your User ID and OTP code have been emailed.");
        router.push(`/verify-email?email=${encodeURIComponent(identifier.trim().toLowerCase())}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Signup failed.";
        toast.error(msg);
        setShakeTrigger((prev) => prev + 1);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      const cleanIdentifier = identifier.trim().replace(/^@/, "").toLowerCase();
      const result = await signIn("credentials", {
        email: cleanIdentifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("UNVERIFIED_EMAIL") || result.code === "UNVERIFIED_EMAIL") {
          toast.info("Account unverified. A fresh security code has been emailed to you.");
          router.push(`/verify-email?email=${encodeURIComponent(cleanIdentifier)}`);
          return;
        }
        toast.error("Invalid credentials. Please check your Email/User ID and password.");
        setShakeTrigger((prev) => prev + 1);
        return;
      }

      toast.success("Welcome back! Loading your Orbitr drive...");
      sessionStorage.setItem("orbitr_just_logged_in", "true");
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    try {
      setGoogleLoading(true);
      const res = await signIn("google", { callbackUrl, redirect: false });
      if (res?.error) {
        toast.error("Google OAuth error. Please check your credentials.");
        setGoogleLoading(false);
        return;
      }
      if (res?.url) {
        sessionStorage.setItem("orbitr_just_logged_in", "true");
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
      const optRes = await fetch("/api/auth/passkey/generate-authentication-options", {
        method: "POST",
      });
      const { options, challengeId, error } = await optRes.json();
      if (!optRes.ok || error) {
        throw new Error(error || "Could not initialize passkey options.");
      }

      const authResp = await startAuthentication(options);

      const verifyRes = await fetch("/api/auth/passkey/verify-authentication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, response: authResp }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success || !verifyData.passkeyToken) {
        throw new Error(verifyData.error || "Passkey verification was rejected.");
      }

      const result = await signIn("credentials", {
        passkeyToken: verifyData.passkeyToken,
        email: verifyData.email,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success("Biometric Passkey verified! Welcome to Orbitr.");
      router.push(callbackUrl);
      router.refresh();
    } catch (err: unknown) {
      console.error("[Passkey Error]", err);
      const msg = err instanceof Error ? err.message : "Passkey authentication failed.";
      if (msg.includes("timed out") || msg.includes("not allowed") || msg.includes("cancelled")) {
        toast.info("Passkey prompt was closed.");
      } else {
        toast.error(msg);
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  const inputBoxClass = (hasError?: string) =>
    `flex items-center gap-2.5 rounded-2xl border bg-[#0b0e18]/65 px-3.5 py-2.5 backdrop-blur-xl transition-all focus-within:bg-[#0b0e18]/80 focus-within:ring-3 ${hasError
      ? "border-rose-300/70 focus-within:ring-rose-300/20"
      : "border-white/25 focus-within:border-white/55 focus-within:ring-white/15"
    }`;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-20">
      <AuroraCanvas intensity="calm" />

      <div className="fixed top-5 left-5 z-40">
        <motion.button
          type="button"
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={APPLE_SPRING}
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-4 py-2 text-xs font-semibold text-white shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.5),0_12px_28px_-10px_rgba(5,3,16,0.5)] backdrop-blur-2xl hover:bg-white/25"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[2]" />
          <span>Back to Home</span>
        </motion.button>
      </div>

      <motion.div
        key={`shake-${shakeTrigger}`}
        animate={shakeTrigger > 0 ? { x: [0, -10, 10, -7, 7, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.42 }}
        className="relative z-10 w-full max-w-[460px]"
      >
        <LiquidGlassCard layout strong iridescent className="p-7 sm:p-9">
          <div className="text-center">
            <div className="inline-flex justify-center">
              <BrandLogo size="md" tone="dark" />
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={APPLE_SPRING}
              >
                <h1 className="glass-hero-gradient-text mt-5 font-display text-2xl font-extrabold tracking-[-0.035em] sm:text-[26px]">
                  {isSignup ? "Create your Orbitr account" : "Sign in to Orbitr Cloud+"}
                </h1>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300 sm:text-[13.5px]">
                  {isSignup
                    ? "Public Testing Phase: includes 2 GB of zero-knowledge cloud storage free."
                    : "Use Google OAuth, a FIDO2 Passkey, or your Email / User ID."}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mode Morphing Segmented Pill */}
          <div className="mt-6 grid grid-cols-2 rounded-full border border-white/45 bg-white/16 p-1 backdrop-blur-md">
            {(
              [
                { id: "login", label: "Sign In" },
                { id: "signup", label: "Create Account" },
              ] as const
            ).map((tab) => {
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => switchMode(tab.id)}
                  className={`relative rounded-full py-2 text-xs font-bold transition-colors sm:text-[13px] ${active ? "text-slate-900" : "text-white/85 hover:text-white"
                    }`}
                >
                  {active && (
                    <motion.span
                      layoutId="authSegmentedCapsule"
                      transition={APPLE_SPRING}
                      className="absolute inset-0 rounded-full border border-white bg-white shadow-xs"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Universal OAuth & WebAuthn Passkey Buttons */}
          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              disabled={googleLoading || loading || passkeyLoading}
              onClick={handleGoogleOAuth}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/55 bg-white/88 px-3.5 py-2.5 text-xs font-bold text-slate-900 shadow-xs transition-colors hover:bg-white disabled:opacity-50"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.98h3.86c2.26-2.09 3.56-5.17 3.56-8.8z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31V6.6H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.4l3.99-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.6l3.99 3.09c.95-2.85 3.6-4.94 6.72-4.94z"
                />
              </svg>
              <span>{googleLoading ? "Connecting..." : "Continue with Google"}</span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              disabled={passkeyLoading || loading || googleLoading}
              onClick={handlePasskeySignIn}
              title="Windows Hello PIN, Android Fingerprint, or FIDO2 Security Key"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/[0.08] px-3.5 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/[0.16] disabled:opacity-50"
            >
              <Fingerprint className="h-4 w-4 shrink-0 stroke-[1.8] text-slate-200" />
              <span>{passkeyLoading ? "Verifying..." : "Passkey (PIN / Biometric)"}</span>
            </motion.button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/35" />
            <span className="text-[11px] font-semibold text-white/85">or credentials</span>
            <div className="h-px flex-1 bg-white/35" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            <AnimatePresence initial={false}>
              {isSignup && (
                <motion.div
                  key="signup-extra-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={APPLE_SPRING}
                  className="space-y-3.5 overflow-hidden"
                >
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-sky-100/90">
                      Full Name
                    </label>
                    <div className={inputBoxClass(errors.name)}>
                      <User className="h-4 w-4 shrink-0 stroke-[1.75] text-sky-400/80" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                        }}
                        placeholder="Alex Mercer"
                        className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 flex items-center gap-1 text-[11.5px] font-medium text-rose-400">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-sky-100/90">
                        User ID (Handle)
                      </label>
                      <div className={inputBoxClass(errors.handle)}>
                        <AtSign className="h-4 w-4 shrink-0 stroke-[1.75] text-sky-400/80" />
                        <input
                          type="text"
                          value={handle}
                          onChange={(e) => {
                            setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""));
                            if (errors.handle)
                              setErrors((prev) => ({ ...prev, handle: undefined }));
                          }}
                          placeholder="alex_orbitr"
                          className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                        />
                      </div>
                      {errors.handle && (
                        <p className="mt-1 text-[11px] font-medium text-rose-400">
                          {errors.handle}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-sky-100/90">
                        Date of Birth
                      </label>
                      <div className={inputBoxClass(errors.dob)}>
                        <Calendar className="h-4 w-4 shrink-0 stroke-[1.75] text-sky-400/80" />
                        <input
                          type="date"
                          value={dob}
                          onChange={(e) => {
                            setDob(e.target.value);
                            if (errors.dob) setErrors((prev) => ({ ...prev, dob: undefined }));
                          }}
                          className="w-full bg-transparent text-xs text-white focus:outline-none"
                        />
                      </div>
                      {errors.dob && (
                        <p className="mt-1 text-[11px] font-medium text-rose-400">{errors.dob}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white">
                {isSignup ? "Email Address (OTP Verified)" : "Email or User ID (@handle)"}
              </label>
              <div className={inputBoxClass(errors.identifier)}>
                <Mail className="h-4 w-4 shrink-0 stroke-[1.75] text-slate-300" />
                <input
                  type={isSignup ? "email" : "text"}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errors.identifier)
                      setErrors((prev) => ({ ...prev, identifier: undefined }));
                  }}
                  placeholder={isSignup ? "you@example.com" : "you@example.com or alex_orbitr"}
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
                />
              </div>
              {errors.identifier && (
                <p className="mt-1 flex items-center gap-1 text-[11.5px] font-medium text-rose-200">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.identifier}
                </p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-white">Password</label>
                {!isSignup && (
                  <Link
                    href="/forgot-password"
                    className="text-[11.5px] font-medium text-slate-300 hover:text-white"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className={inputBoxClass(errors.password)}>
                <Lock className="h-4 w-4 shrink-0 stroke-[1.75] text-slate-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Enter password"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/55 focus:outline-none"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="rounded-lg p-1 text-white/75 transition-colors hover:bg-white/15 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 stroke-[1.75]" />
                  ) : (
                    <Eye className="h-4 w-4 stroke-[1.75]" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 flex items-center gap-1 text-[11.5px] font-medium text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.password}
                </p>
              )}

              <AnimatePresence initial={false}>
                {isSignup && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={APPLE_SPRING}
                    className="overflow-hidden pt-2.5"
                  >
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((seg) => (
                        <div
                          key={seg}
                          className="h-1.5 overflow-hidden rounded-full bg-sky-950/80 ring-1 ring-sky-200/10"
                        >
                          <motion.div
                            initial={false}
                            animate={{ width: strength.score >= seg ? "100%" : "0%" }}
                            transition={APPLE_SPRING}
                            className={`h-full rounded-full ${strength.barColor}`}
                          />
                        </div>
                      ))}
                    </div>
                    <p className={`mt-1.5 text-[11px] font-medium ${strength.textColor}`}>
                      {strength.label}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              type="submit"
              disabled={loading || googleLoading || passkeyLoading}
              whileTap={{ scale: 0.98 }}
              transition={APPLE_SPRING}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-white bg-gradient-to-b from-white to-slate-200 py-3 text-sm font-semibold text-slate-950 shadow-[inset_0_1px_1.5px_rgba(255,255,255,1),0_12px_28px_-8px_rgba(4,6,12,0.5)] transition-all hover:bg-white disabled:opacity-50"
            >
              <span>
                {loading
                  ? isSignup
                    ? "Creating Account..."
                    : "Signing In..."
                  : isSignup
                    ? "Create 2 GB Free Account"
                    : "Sign In"}
              </span>
              <ArrowRight className="h-4 w-4 stroke-[2]" />
            </motion.button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-white/85">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            <span>Argon2 password hashing • WebAuthn FIDO2 • Zero-knowledge vault</span>
          </div>
        </LiquidGlassCard>
      </motion.div>
    </div>
  );
}
