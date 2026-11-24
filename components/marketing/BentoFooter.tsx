"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Globe, ShieldCheck } from "lucide-react";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { toast } from "@/components/ui/Toast";
import { APPLE_SPRING } from "@/lib/motion";

const LOCALE_OPTIONS = [
  { code: "global-en", country: "Global Edge", language: "English", regionNode: "Cloudflare R2 Auto" },
  { code: "us-en", country: "North America", language: "English (US)", regionNode: "US-East / West" },
  { code: "eu-en", country: "Europe", language: "English / EU", regionNode: "EU-Central" },
  { code: "ap-en", country: "Asia-Pacific", language: "English / APAC", regionNode: "AP-South / East" },
] as const;

interface BentoFooterProps {
  onOpenSpotlight: () => void;
}

export function BentoFooter({ onOpenSpotlight }: BentoFooterProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState<(typeof LOCALE_OPTIONS)[number]>(
    LOCALE_OPTIONS[0]
  );
  const [telemetryExpanded, setTelemetryExpanded] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setEmailError(true);
      window.setTimeout(() => setEmailError(false), 600);
      return;
    }
    setSubscribed(true);
    toast.success(`Release & storage tier alerts enabled for ${email.trim()}`);
  };

  const SITEMAP_COLUMNS = [
    {
      title: "Product & Routes",
      links: [
        { label: "Cloud Drive (/drive)", action: () => router.push("/drive") },
        { label: "Zero-Knowledge Vault (/vault)", action: () => router.push("/vault") },
        { label: "Command Search (Ctrl+K / ⌘K)", action: onOpenSpotlight },
        { label: "2 GB Testing Quota & Plans", href: "#pricing-bento" },
      ],
    },
    {
      title: "Universal Access",
      links: [
        {
          label: "Windows & Windows Hello PIN",
          action: () =>
            toast.info("Full Web & PWA support with FIDO2 Windows Hello PIN."),
        },
        {
          label: "Android & Fingerprint PWA",
          action: () =>
            toast.info("Installable PWA with native WebAuthn Android Fingerprint."),
        },
        {
          label: "macOS, iOS & Linux Browsers",
          action: () =>
            toast.info("Works identically across Chrome, Edge, Firefox & Safari."),
        },
        {
          label: "6-Digit Quick Transfer (/t/[code])",
          href: "#parallax-stage-3",
        },
      ],
    },
    {
      title: "Security & Cryptography",
      links: [
        { label: "AES-256-GCM + PBKDF2 Spec", href: "#bento-security" },
        {
          label: "FIDO2 / WebAuthn Passkeys",
          action: () => toast.info("Passwordless FIDO2 + Argon2 + TOTP 2FA."),
        },
        {
          label: "Protected Shares & Drop Zones",
          href: "#parallax-stage-3",
        },
        {
          label: "TOTP 2FA & Session Control",
          action: () => router.push("/security"),
        },
      ],
    },
    {
      title: "Account & Access",
      links: [
        { label: "Sign In (/login)", action: () => router.push("/login") },
        { label: "Claim 2 GB Free (/signup)", action: () => router.push("/signup") },
        {
          label: "Zero-Knowledge Privacy",
          action: () =>
            toast.info("Passphrases and encryption keys never leave your device."),
        },
        {
          label: "Edge Route Protection",
          action: () =>
            toast.info("Strict JWT Edge Guard protects all management routes & APIs."),
        },
      ],
    },
  ];

  return (
    <footer className="relative mx-auto max-w-6xl px-4 pb-12 sm:px-6">
      <LiquidGlassCard strong allowOverflow className="p-6 sm:p-10">
        <div className="grid grid-cols-1 gap-6 border-b border-sky-200/[0.12] pb-9 lg:grid-cols-12">
          {/* Left Module */}
          <div className="flex flex-col justify-between rounded-2xl border border-sky-200/[0.14] bg-[#061026]/65 p-5 shadow-[inset_0_1px_0_rgba(186,230,253,0.14)] lg:col-span-7">
            <div>
              <BrandLogo size="md" tone="dark" />
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
                Universal zero-knowledge personal cloud storage OS with client-side Web Crypto,
                biometric passkeys, anonymous drop zones, and 6-digit quick transfers.
              </p>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setTelemetryExpanded((v) => !v)}
                className="inline-flex flex-wrap items-center gap-2.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3.5 py-1.5 text-left text-xs font-medium text-emerald-200 transition-colors hover:bg-emerald-500/22"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="font-semibold tabular-nums">
                  Public Testing Phase Live • 2 GB Free Quota Operational
                </span>
              </button>

              <AnimatePresence>
                {telemetryExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={APPLE_SPRING}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-sky-200/15 bg-[#040B1C]/80 p-3 text-[11px] tabular-nums">
                      <div>
                        <p className="font-semibold text-white">Cloudflare R2</p>
                        <p className="text-emerald-400">Presigned • Operational</p>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Serverless DB</p>
                        <p className="text-emerald-400">PostgreSQL • Operational</p>
                      </div>
                      <div>
                        <p className="font-semibold text-white">FIDO2 &amp; OTP</p>
                        <p className="text-emerald-400">WebAuthn • Operational</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Module: Changelog & Larger Quota Notification Subscribe */}
          <div className="flex flex-col justify-between rounded-2xl border border-sky-200/[0.14] bg-[#061026]/65 p-5 shadow-[inset_0_1px_0_rgba(186,230,253,0.14)] lg:col-span-5">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300">
                <ShieldCheck className="h-3.5 w-3.5 stroke-[1.8]" />
                Testing Phase &amp; Quota Updates
              </span>
              <h3 className="mt-1.5 font-display text-lg font-bold text-white">
                Get notified when larger storage launches
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-300/85">
                Receive changelog notes and an alert as soon as expanded storage pricing is updated.
              </p>
            </div>

            <div className="mt-5">
              <AnimatePresence mode="wait">
                {subscribed ? (
                  <motion.div
                    key="subscribed-badge"
                    initial={{ opacity: 0, scale: 0.95, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={APPLE_SPRING}
                    className="flex items-center gap-2.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-4 py-2.5 text-xs font-semibold text-emerald-200"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-3 w-3 stroke-[2.5]" />
                    </span>
                    <span>Subscribed to Orbitr Release Notes</span>
                  </motion.div>
                ) : (
                  <motion.form
                    key="subscribe-form"
                    onSubmit={handleSubscribe}
                    animate={emailError ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-center gap-2 rounded-full border border-sky-200/20 bg-[#040B1C]/85 p-1.5 pl-4 focus-within:border-sky-400 focus-within:ring-3 focus-within:ring-sky-500/20"
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      aria-label="Email for release notes"
                      className="min-w-0 flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none sm:text-[13px]"
                    />
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.96 }}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-sky-300/40 bg-gradient-to-b from-sky-400 to-blue-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110"
                    >
                      <span>Notify Me</span>
                      <ArrowRight className="h-3.5 w-3.5 stroke-[2]" />
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 4-COLUMN SITEMAP MATRIX */}
        <div className="grid grid-cols-2 gap-8 border-b border-sky-200/[0.12] py-9 sm:grid-cols-4">
          {SITEMAP_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-xs font-bold tracking-wider text-sky-300/70 uppercase">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((item) => (
                  <li key={item.label}>
                    {"href" in item && item.href ? (
                      <a
                        href={item.href}
                        className="group inline-flex items-center text-[13.5px] font-medium text-slate-300/85 transition-colors hover:text-white"
                      >
                        <span className="border-b border-transparent transition-colors group-hover:border-sky-400/60">
                          {item.label}
                        </span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={item.action}
                        className="group inline-flex items-center text-left text-[13.5px] font-medium text-slate-300/85 transition-colors hover:text-white"
                      >
                        <span className="border-b border-transparent transition-colors group-hover:border-sky-400/60">
                          {item.label}
                        </span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* BOTTOM LEGAL & LOCALE BAR */}
        <div className="flex flex-col items-start justify-between gap-4 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Orbitr Cloud+ Storage. Universal Zero-Knowledge Personal
            Cloud OS.
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <button
                type="button"
                onClick={() => setLocaleOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-sky-200/20 bg-sky-950/55 px-3.5 py-1.5 text-xs font-medium text-sky-100 transition-colors hover:border-sky-300/40 hover:bg-sky-900/65 hover:text-white"
              >
                <Globe className="h-3.5 w-3.5 stroke-[1.75] text-sky-400" />
                <span>
                  {selectedLocale.country} • {selectedLocale.language}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${localeOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {localeOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={APPLE_SPRING}
                    className="absolute right-0 bottom-11 z-40 w-64 rounded-2xl border border-sky-200/25 bg-[#091530]/95 p-1.5 shadow-[0_24px_54px_-12px_rgba(1,4,16,0.85)] backdrop-blur-3xl"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-sky-300/70 uppercase">
                      Storage Routing &amp; Locale
                    </div>
                    {LOCALE_OPTIONS.map((loc) => {
                      const isSelected = loc.code === selectedLocale.code;
                      return (
                        <button
                          key={loc.code}
                          type="button"
                          onClick={() => {
                            setSelectedLocale(loc);
                            setLocaleOpen(false);
                            toast.info(`Region set to ${loc.country} (${loc.regionNode})`);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                            isSelected
                              ? "bg-gradient-to-r from-sky-500 to-blue-600 font-semibold text-white"
                              : "text-slate-200 hover:bg-sky-400/12"
                          }`}
                        >
                          <span>
                            {loc.country} — {loc.language}
                          </span>
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.2]" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </LiquidGlassCard>
    </footer>
  );
}
