"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  Fingerprint,
  Flame,
  Folder,
  FolderPlus,
  Globe,
  HardDrive,
  Inbox,
  KeyRound,
  Laptop,
  Lock,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Stamp,
  Upload,
} from "lucide-react";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { LiveWeatherGlassCard } from "@/components/marketing/LiveWeatherGlassCard";
import { toast } from "@/components/ui/Toast";
import { APPLE_EASE, APPLE_SPRING } from "@/lib/motion";

const UNIVERSAL_PLATFORMS = [
  "Windows (Hello PIN)",
  "Android (Fingerprint)",
  "macOS & iOS",
  "Linux",
  "Any Browser & PWA",
] as const;

const PRICING_PLANS = [
  {
    id: "testing-free",
    name: "Testing Phase",
    storageBadge: "2 GB Free for Everyone",
    tagline:
      "Orbitr Cloud+ is currently in public testing—every account receives 2 GB of zero-knowledge cloud storage free.",
    ctaLabel: "Claim 2 GB Free Storage",
    highlights: [
      "2 GB (2,147,483,648 bytes) encrypted cloud storage",
      "Universal Web & installable PWA (Windows, Android, macOS, iOS, Linux)",
      "Client-side AES-256-GCM Vault (PBKDF2 100,000 iterations)",
      "WebAuthn / FIDO2 Passkeys (Windows Hello PIN & Android Fingerprint)",
      "Protected Shares (Burn-After-Read, Time Capsule, Email OTP, Watermark)",
      "Anonymous Drop Zones & 6-Digit Ephemeral Quick Transfers",
    ],
  },
  {
    id: "plus-upcoming",
    name: "Expanded Personal",
    storageBadge: "Larger Quota",
    tagline:
      "Higher personal storage limits for large media libraries, encrypted archives, and extended transfer retention.",
    ctaLabel: "Available After Testing Phase",
  },
  {
    id: "pro-upcoming",
    name: "Pro & Power Vault",
    storageBadge: "High-Capacity Tier",
    tagline:
      "Maximum zero-knowledge storage capacity with advanced audit retention and custom sharing policies.",
    ctaLabel: "Pricing Updated Soon",
  },
] as const;

interface ChapterDefinition {
  index: string;
  id: string;
  anchorId?: string;
  pill: string;
  headlineTop: string;
  headlineAccent: string;
  description: string;
  telemetryLabel: string;
  telemetryValue: string;
  telemetrySub: string;
}

const CHAPTERS: ChapterDefinition[] = [
  {
    index: "01",
    id: "chapter-overview",
    anchorId: "showcase-stage",
    pill: "Public Testing Phase • 2 GB Free for Everyone",
    headlineTop: "Zero-knowledge cloud,",
    headlineAccent: "universal on every device.",
    description:
      "Orbitr Cloud+ pairs effortless cross-platform access like Google Drive with client-side AES-256-GCM encryption across Windows, Android, macOS, iOS, Linux, and PWA.",
    telemetryLabel: "Testing Phase Allocation",
    telemetryValue: "2.00 GB Free",
    telemetrySub: "2,147,483,648 bytes • Cloudflare R2 & Client AES-256-GCM",
  },
  {
    index: "02",
    id: "chapter-crypto",
    anchorId: "bento-security",
    pill: "W3C Web Crypto • Zero-Knowledge Custody",
    headlineTop: "Encrypted in your browser,",
    headlineAccent: "invisible to our servers.",
    description:
      "Passphrases never leave your client. PBKDF2 (100,000 SHA-256 iterations) derives a 256-bit AES-GCM key with a fresh 96-bit IV for every file buffer and filename.",
    telemetryLabel: "Client Cipher Pipeline",
    telemetryValue: "AES-256-GCM",
    telemetrySub: "PBKDF2 100k iter • 96-bit IV • SHA-256 integrity",
  },
  {
    index: "03",
    id: "chapter-universal",
    anchorId: "bento-features",
    pill: "WebAuthn FIDO2 • Universal Ecosystem",
    headlineTop: "One biometric touch across",
    headlineAccent: "Windows, Android, Mac & Web.",
    description:
      "Sign in with Windows Hello PIN, Android Fingerprint, platform passkeys, Google OAuth, or your unique @handle—protected by Argon2 hashing, TOTP 2FA, and Upstash rate limits.",
    telemetryLabel: "Identity & Edge Guard",
    telemetryValue: "FIDO2 + Argon2",
    telemetrySub: "Windows Hello • Android Fingerprint • JWT Edge",
  },
  {
    index: "04",
    id: "chapter-transfers",
    pill: "Programmable Portals • /s • /d • /t",
    headlineTop: "Time Capsules, Drop Zones",
    headlineAccent: "& 6-digit quick handoffs.",
    description:
      "Create Burn-After-Read or Time Capsule links with watermarks and Email OTP, collect public uploads safely via Anonymous Drop Zones, or beam files with a 6-digit code.",
    telemetryLabel: "Transfer Endpoints",
    telemetryValue: "/s • /d • /t",
    telemetrySub: "Burn-After-Read • Time Capsule • 6-Digit Pickup",
  },
  {
    index: "05",
    id: "chapter-pricing",
    anchorId: "pricing-bento",
    pill: "Transparent Storage • Testing Phase Open",
    headlineTop: "2 GB free right now.",
    headlineAccent: "Larger tiers updating soon.",
    description:
      "Every account receives 2 GB of zero-knowledge Cloudflare R2 storage free during testing. Pricing and capacities for expanded personal and pro plans will be updated soon.",
    telemetryLabel: "Expanded Storage Roadmap",
    telemetryValue: "Updating Soon",
    telemetrySub: "2 GB active free tier • Instant upgrade path later",
  },
];

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function deriveAndSealMetadata(filename: string) {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  try {
    const baseKey = await window.crypto.subtle.importKey(
      "raw",
      enc.encode("orbitr-client-vault-session"),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    const aesKey = await window.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );
    const cipherName = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      enc.encode(filename)
    );
    return {
      ivHex: bufferToHex(iv),
      saltHex: bufferToHex(salt),
      cipherHex: bufferToHex(cipherName).slice(0, 32),
    };
  } catch {
    return {
      ivHex: bufferToHex(iv),
      saltHex: bufferToHex(salt),
      cipherHex: bufferToHex(iv),
    };
  }
}

function ParallaxChapterStage({
  chapterIndex,
  isFirst = false,
  anchorId,
  onEnter,
  children,
  floatingBadgeTop,
  floatingBadgeBottom,
}: {
  chapterIndex: number;
  isFirst?: boolean;
  anchorId?: string;
  onEnter: (idx: number) => void;
  children: React.ReactNode;
  floatingBadgeTop?: React.ReactNode;
  floatingBadgeBottom?: React.ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(stageRef, {
    margin: "-38% 0px -38% 0px",
  });

  useEffect(() => {
    if (isInView) {
      onEnter(chapterIndex);
    }
  }, [chapterIndex, isInView, onEnter]);

  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start end", "end start"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    mass: 0.55,
  });

  const cardY = useTransform(smooth, [0, 0.5, 1], [38, 0, -38]);
  const cardScale = useTransform(smooth, [0, 0.5, 1], [0.965, 1, 0.975]);
  const cardRotateX = useTransform(smooth, [0, 0.45, 1], [5, 0, -3]);
  const fastFloatY = useTransform(smooth, [0, 1], [68, -68]);
  const reverseFloatY = useTransform(smooth, [0, 1], [-44, 44]);
  const auraY = useTransform(smooth, [0, 1], [-30, 50]);

  return (
    <div
      id={anchorId}
      ref={stageRef}
      className={`relative flex flex-col justify-center [perspective:1300px] ${
        isFirst
          ? "py-6 sm:py-10 lg:min-h-[calc(100vh-7.5rem)] lg:py-4"
          : "min-h-[74vh] py-12 sm:py-16 lg:min-h-[84vh]"
      }`}
    >
      <motion.div
        aria-hidden="true"
        style={prefersReducedMotion ? undefined : { y: auraY }}
        className="pointer-events-none absolute inset-x-8 top-1/2 -z-10 h-72 -translate-y-1/2 rounded-full bg-gradient-to-r from-sky-500/22 via-blue-600/20 to-indigo-500/22 blur-3xl"
      />

      {floatingBadgeTop && !prefersReducedMotion && (
        <motion.div
          style={{ y: fastFloatY }}
          className="pointer-events-none absolute top-2 right-3 z-20 hidden sm:block"
        >
          {floatingBadgeTop}
        </motion.div>
      )}

      <motion.div
        style={
          prefersReducedMotion
            ? undefined
            : {
                y: cardY,
                scale: cardScale,
                rotateX: cardRotateX,
                transformStyle: "preserve-3d",
              }
        }
        className="relative z-10 will-change-transform"
      >
        {children}
      </motion.div>

      {floatingBadgeBottom && !prefersReducedMotion && (
        <motion.div
          style={{ y: reverseFloatY }}
          className="pointer-events-none absolute bottom-2 left-4 z-20 hidden sm:block"
        >
          {floatingBadgeBottom}
        </motion.div>
      )}
    </div>
  );
}

interface SplitParallaxShowcaseProps {
  onOpenSpotlight: () => void;
}

export function SplitParallaxShowcase({ onOpenSpotlight }: SplitParallaxShowcaseProps) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const [activeChapter, setActiveChapter] = useState(0);

  // Stage 02: Live Client Web Crypto Interactive Sandbox
  const [plainFilename, setPlainFilename] = useState("vault-document.pdf");
  const [cryptoPreview, setCryptoPreview] = useState({
    ivHex: "9f4c12a87e03b149d208fa11",
    saltHex: "41e09bc72a18f365c9d1847a00b31e2c",
    cipherHex: "7c8910fe4a92d11b83c4e05a9f7218d0",
  });
  const [reSealing, setReSealing] = useState(false);

  // Stage 03: Universal Platform selector
  const [selectedOs, setSelectedOs] = useState<"windows" | "android" | "mac-ios" | "linux">(
    "windows"
  );

  // Stage 04: Share & 6-Digit Transfer interactive state
  const [burnAfterRead, setBurnAfterRead] = useState(true);
  const [timeCapsule, setTimeCapsule] = useState(true);
  const [otpGate, setOtpGate] = useState(true);
  const [watermarkMode, setWatermarkMode] = useState(true);
  const [copiedPolicy, setCopiedPolicy] = useState(false);
  const [quickCodeInput, setQuickCodeInput] = useState("");

  // Stage 05: Billing toggle
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const railProgress = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 32,
    mass: 0.5,
  });
  const railFillHeight = useTransform(railProgress, [0, 1], ["12%", "100%"]);

  const runLiveWebCryptoSeal = async (inputName: string) => {
    setReSealing(true);
    const sealed = await deriveAndSealMetadata(inputName || "untitled.bin");
    setCryptoPreview(sealed);
    setReSealing(false);
  };

  const jumpToChapter = (idx: number) => {
    setActiveChapter(idx);
    const el = document.getElementById(`parallax-stage-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleQuickPickup = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickCodeInput.replace(/\D/g, "").slice(0, 6);
    if (clean.length === 6) {
      router.push(`/t/${clean}`);
    } else {
      toast.info("Enter a valid 6-digit Quick Transfer code to receive files.");
    }
  };

  const currentChapter = CHAPTERS[activeChapter] || CHAPTERS[0];

  const OS_DETAILS = {
    windows: {
      title: "Windows 11 / 10 + Windows Hello PIN",
      auth: "WebAuthn FIDO2 Platform Authenticator via TPM 2.0",
      experience: "Installable Desktop PWA + Ctrl+K Command Palette + Drag & Drop",
    },
    android: {
      title: "Android + Biometric Fingerprint",
      auth: "Native Passkey Fingerprint / Face Unlock via Credential Manager",
      experience: "Home-screen PWA + 6-Digit Quick Transfer camera/clipboard handoff",
    },
    "mac-ios": {
      title: "macOS & iOS + Touch ID / Face ID",
      auth: "Secure Enclave WebAuthn Passkeys & Safari / Chrome Web Crypto",
      experience: "Full Liquid Glass interface + ⌘K Instant Search + Share Portals",
    },
    linux: {
      title: "Linux Workstations + Hardware Keys",
      auth: "YubiKey / FIDO2 USB-C Security Keys + Argon2 + TOTP 2FA",
      experience: "Zero-dependency Chromium / Firefox Web Crypto vault custody",
    },
  }[selectedOs];

  return (
    <section
      ref={sectionRef}
      aria-label="Orbitr Cloud+ Interactive Architecture"
      className="relative mx-auto max-w-[1420px] px-4 pt-24 pb-10 sm:px-6 lg:px-10 lg:pt-24"
    >
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-10 xl:gap-14">
        {/* LEFT 40% STICKY DYNAMICALLY CHANGING NARRATIVE RAIL */}
        <div className="w-full lg:sticky lg:top-24 lg:flex lg:h-[calc(100vh-7rem)] lg:w-[40%] lg:shrink-0 lg:flex-col lg:justify-between lg:py-3 lg:pb-6">
          <div>
            {/* Chapter Stepper + Warm Plum-Amber Scroll Progress Track */}
            <div className="flex items-center gap-2">
              {CHAPTERS.map((chap, idx) => {
                const isActive = idx === activeChapter;
                return (
                  <button
                    key={chap.id}
                    type="button"
                    onClick={() => jumpToChapter(idx)}
                    aria-label={`Jump to chapter ${chap.index}`}
                    className={`relative rounded-full px-2.5 py-1 font-mono text-[11px] font-bold transition-colors ${
                      isActive
                        ? "text-slate-950"
                        : idx < activeChapter
                          ? "border border-white/25 bg-white/12 text-slate-200 hover:bg-white/20"
                          : "border border-white/15 bg-white/[0.05] text-slate-400 hover:bg-white/12 hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="stickyLeftChapterPill"
                        transition={APPLE_SPRING}
                        className="absolute inset-0 rounded-full border border-white bg-white shadow-[0_4px_14px_rgba(4,6,12,0.35)]"
                      />
                    )}
                    <span className="relative z-10">{chap.index}</span>
                  </button>
                );
              })}

              <div className="ml-1 hidden h-1.5 flex-1 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/15 sm:block">
                <motion.div
                  style={
                    prefersReducedMotion
                      ? { width: `${((activeChapter + 1) / CHAPTERS.length) * 100}%` }
                      : { width: railFillHeight }
                  }
                  className="h-full rounded-full bg-gradient-to-r from-slate-300 via-white to-slate-400"
                />
              </div>
            </div>

            {/* Dynamically Morphing Chapter Pill, Headline & Story */}
            <div className="mt-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentChapter.id}
                  initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
                  transition={{ duration: 0.42, ease: APPLE_EASE }}
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.07] px-3.5 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-2xl">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 stroke-[1.8] text-slate-300" />
                    <span>{currentChapter.pill}</span>
                  </span>

                  <h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-5xl lg:text-[40px] lg:leading-[1.08] xl:text-[46px]">
                    <span className="hero-gradient-text block">{currentChapter.headlineTop}</span>
                    <span className="accent-gradient-text mt-1 block pb-1">
                      {currentChapter.headlineAccent}
                    </span>
                  </h1>

                  <p className="optical-text-shadow mt-3.5 max-w-lg text-sm leading-relaxed font-medium text-slate-300 sm:text-[15.5px]">
                    {currentChapter.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Dynamic Chapter Telemetry Card + Persistent Primary CTAs */}
          <div className="mt-6 space-y-4 lg:mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={`telemetry-${currentChapter.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={APPLE_SPRING}
              >
                <LiquidGlassCard className="px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10.5px] font-bold tracking-wider text-slate-300 uppercase">
                        {currentChapter.telemetryLabel}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-200">{currentChapter.telemetrySub}</p>
                    </div>
                    <span className="shrink-0 rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 font-mono text-xs font-bold text-white tabular-nums">
                      {currentChapter.telemetryValue}
                    </span>
                  </div>
                </LiquidGlassCard>
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-wrap items-center gap-3">
              <MagneticButton variant="primary" size="md" onClick={() => router.push("/signup")}>
                <span>Get 2 GB Free</span>
                <ArrowRight className="h-4 w-4 stroke-[2]" />
              </MagneticButton>

              <MagneticButton variant="glass" size="md" onClick={() => router.push("/drive")}>
                <HardDrive className="h-4 w-4 stroke-[1.8] text-slate-200" />
                <span>Open Drive</span>
              </MagneticButton>

              <button
                type="button"
                onClick={onOpenSpotlight}
                className="hidden items-center gap-1.5 rounded-full border border-white/25 bg-white/[0.07] px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/[0.15] hover:text-white xl:inline-flex"
              >
                <span>Ctrl+K</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT 60% MULTI-DEPTH PARALLAX SCROLLING SCREEN */}
        <div className="w-full lg:w-[60%] lg:border-l lg:border-white/15 lg:pl-8 xl:pl-10">
          {/* STAGE 01: UNIVERSAL CLOUD DRIVE & VAULT OS WINDOW */}
          <div id="parallax-stage-0">
            <ParallaxChapterStage
              chapterIndex={0}
              isFirst
              anchorId="showcase-stage"
              onEnter={setActiveChapter}
              floatingBadgeTop={
                <div className="flex items-center gap-2 rounded-full border border-white/55 bg-white/[0.16] px-4 py-1.5 text-xs font-semibold text-white shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.75),0_16px_38px_-10px_rgba(8,5,28,0.65)] backdrop-blur-xl">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                  <span>Testing Phase • 2.00 GB Free</span>
                </div>
              }
              floatingBadgeBottom={
                <div className="flex items-center gap-2 rounded-full border border-white/55 bg-white/[0.16] px-4 py-1.5 text-xs font-semibold text-white shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.75),0_16px_38px_-10px_rgba(8,5,28,0.65)] backdrop-blur-xl">
                  <Globe className="h-3.5 w-3.5 text-cyan-300" />
                  <span>Windows • Android • macOS • iOS • Linux • PWA</span>
                </div>
              }
            >
              <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-12">
                {/* Left: Iconic Dynamic Weather Forecast Liquid Glass Card */}
                <div className="md:col-span-5">
                  <LiveWeatherGlassCard />
                </div>

                {/* Right: Orbitr Cloud+ 2 GB Testing Quota & OS Modules Card */}
                <LiquidGlassCard strong className="flex flex-col justify-between p-5 sm:p-6 md:col-span-7">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/22 pb-3.5">
                      <span className="rounded-full border border-white/35 bg-white/[0.08] px-3 py-0.5 font-mono text-[11px] font-semibold text-white">
                        orbitr.cloud/drive
                      </span>
                      <button
                        type="button"
                        onClick={() => router.push("/login")}
                        className="inline-flex items-center gap-1 rounded-full border border-white bg-white/92 px-3 py-1 text-[11.5px] font-bold text-slate-900 shadow-xs transition-colors hover:bg-white"
                      >
                        <span>Sign In</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Quota Telemetry Strip */}
                    <div className="mt-4 rounded-2xl border border-white/20 bg-[#0b0f1b]/60 p-3.5 backdrop-blur-xl">
                      <div className="flex items-center justify-between text-xs">
                        <span className="optical-text-shadow font-bold text-white">
                          Testing-Phase Cloud Quota
                        </span>
                        <span className="font-mono font-bold text-slate-200 tabular-nums">
                          2.00 GB Free
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full border border-white/15 bg-white/10">
                        <div className="h-full w-full rounded-full bg-gradient-to-r from-slate-300 via-white to-slate-400" />
                      </div>
                      <p className="optical-text-shadow mt-1.5 text-[11px] font-medium text-slate-300">
                        2,147,483,648 bytes free for every user during public testing.
                      </p>
                    </div>

                    {/* 2x2 Spatial OS Modules */}
                    <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {[
                        {
                          icon: Upload,
                          badge: "/drive",
                          href: "/drive",
                          title: "Cloud Drive",
                          desc: "Folders, #tags & R2 multipart uploads.",
                        },
                        {
                          icon: Lock,
                          badge: "/vault",
                          href: "/vault",
                          title: "Encrypted Vault",
                          desc: "Client AES-256-GCM files & names.",
                        },
                        {
                          icon: Inbox,
                          badge: "/drop-zones",
                          href: "/drop-zones",
                          title: "Drop Zones",
                          desc: "Anonymous public upload portals.",
                        },
                        {
                          icon: Send,
                          badge: "/t/[code]",
                          href: "#parallax-stage-3",
                          title: "6-Digit Transfer",
                          desc: "Instant cross-device pickup codes.",
                        },
                      ].map((mod) => {
                        const Icon = mod.icon;
                        return (
                          <motion.button
                            key={mod.badge}
                            type="button"
                            whileHover={{ y: -2 }}
                            transition={APPLE_SPRING}
                            onClick={() => {
                              if (mod.href.startsWith("#")) {
                                jumpToChapter(3);
                              } else {
                                router.push(mod.href);
                              }
                            }}
                            className="flex flex-col items-start rounded-2xl border border-white/20 bg-[#0b0f1b]/55 p-3.5 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.22)] backdrop-blur-xl transition-colors hover:bg-[#111729]/70"
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-slate-200">
                                <Icon className="h-4 w-4 stroke-[1.8]" />
                              </span>
                              <span className="rounded-full border border-white/20 bg-white/[0.07] px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-200">
                                {mod.badge}
                              </span>
                            </div>
                            <p className="optical-text-shadow mt-2.5 font-display text-[13.5px] font-bold text-white">
                              {mod.title}
                            </p>
                            <p className="optical-text-shadow mt-0.5 text-[11.5px] leading-snug text-white/85">
                              {mod.desc}
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Universal Platform Chips */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-white/22 pt-3">
                    {UNIVERSAL_PLATFORMS.map((plat) => (
                      <span
                        key={plat}
                        className="rounded-full border border-white/30 bg-white/[0.08] px-2.5 py-0.5 text-[10.5px] font-semibold text-white"
                      >
                        {plat}
                      </span>
                    ))}
                  </div>
                </LiquidGlassCard>
              </div>
            </ParallaxChapterStage>
          </div>

          {/* STAGE 02: LIVE CLIENT-SIDE WEB CRYPTO PIPELINE */}
          <div id="parallax-stage-1">
            <ParallaxChapterStage
              chapterIndex={1}
              anchorId="bento-security"
              onEnter={setActiveChapter}
              floatingBadgeTop={
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-[#072227]/90 px-3.5 py-2 font-mono text-[11px] font-bold text-emerald-300 shadow-[0_18px_38px_-10px_rgba(1,4,16,0.8)] backdrop-blur-2xl">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Zero Plaintext Leaves Browser</span>
                </div>
              }
              floatingBadgeBottom={
                <div className="rounded-2xl border border-sky-300/25 bg-[#0A1838]/90 px-3.5 py-2 font-mono text-[11px] font-semibold text-sky-200 shadow-[0_18px_38px_-10px_rgba(1,4,16,0.8)] backdrop-blur-2xl">
                  window.crypto.subtle • PBKDF2 → AES-GCM
                </div>
              }
            >
              <LiquidGlassCard strong className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                      <KeyRound className="h-3.5 w-3.5" />
                      Interactive W3C Web Crypto Inspector
                    </span>
                    <h2 className="mt-2.5 font-display text-xl font-extrabold text-white sm:text-2xl">
                      Test Live Client-Side Filename &amp; Metadata Sealing
                    </h2>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-sky-200/[0.14] bg-[#061026]/70 p-4 shadow-[inset_0_1px_0_rgba(186,230,253,0.14)]">
                  <label className="block text-[11px] font-bold tracking-wider text-sky-300/75 uppercase">
                    Type any filename to derive a real PBKDF2 + AES-256-GCM seal in your browser
                  </label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={plainFilename}
                      onChange={(e) => setPlainFilename(e.target.value)}
                      placeholder="Enter filename..."
                      className="min-w-0 flex-1 rounded-xl border border-sky-200/20 bg-[#040B1C]/85 px-3.5 py-2.5 font-mono text-xs text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                    />
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => void runLiveWebCryptoSeal(plainFilename)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-300/40 bg-gradient-to-b from-sky-400 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_-6px_rgba(14,165,233,0.5)] hover:brightness-110"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${reSealing ? "animate-spin" : ""}`} />
                      <span>Derive &amp; Encrypt</span>
                    </motion.button>
                  </div>
                </div>

                {/* 3-Step Cryptographic Flow */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-sky-200/[0.14] bg-[#07132C]/65 p-4">
                    <p className="font-mono text-[10.5px] font-bold text-sky-300">
                      01 • SALT (128-BIT)
                    </p>
                    <p className="mt-1.5 break-all font-mono text-[11px] text-slate-200">
                      {cryptoPreview.saltHex}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-400">
                      100,000 SHA-256 PBKDF2 iterations
                    </p>
                  </div>

                  <div className="rounded-2xl border border-sky-200/[0.14] bg-[#07132C]/65 p-4">
                    <p className="font-mono text-[10.5px] font-bold text-indigo-300">
                      02 • RANDOM IV (96-BIT)
                    </p>
                    <p className="mt-1.5 break-all font-mono text-[11px] text-slate-200">
                      {cryptoPreview.ivHex}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Unique 12-byte IV per file &amp; name
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-950/40 p-4 shadow-[inset_0_1px_0_rgba(52,211,153,0.2)]">
                    <p className="font-mono text-[10.5px] font-bold text-emerald-300">
                      03 • AES-256-GCM OUTPUT
                    </p>
                    <p className="mt-1.5 break-all font-mono text-[11px] font-semibold text-emerald-100">
                      {cryptoPreview.cipherHex}
                    </p>
                    <p className="mt-2 text-[11px] text-emerald-300/80">
                      Stored in R2 • Decrypted client-only
                    </p>
                  </div>
                </div>
              </LiquidGlassCard>
            </ParallaxChapterStage>
          </div>

          {/* STAGE 03: UNIVERSAL CROSS-PLATFORM PASSKEYS & AUTH */}
          <div id="parallax-stage-2">
            <ParallaxChapterStage
              chapterIndex={2}
              anchorId="bento-features"
              onEnter={setActiveChapter}
              floatingBadgeTop={
                <div className="flex items-center gap-2 rounded-2xl border border-sky-300/28 bg-[#0A1838]/90 px-3.5 py-2 text-xs font-semibold text-sky-100 shadow-[0_18px_38px_-10px_rgba(1,4,16,0.8)] backdrop-blur-2xl">
                  <Fingerprint className="h-3.5 w-3.5 text-sky-400" />
                  <span>WebAuthn / FIDO2 Verified</span>
                </div>
              }
            >
              <LiquidGlassCard strong className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/25 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300">
                      <Globe className="h-3.5 w-3.5" />
                      Cross-Platform Passkeys &amp; PWA
                    </span>
                    <h2 className="mt-2.5 font-display text-xl font-extrabold text-white sm:text-2xl">
                      Built for Every Operating System—Not Just One
                    </h2>
                  </div>
                </div>

                {/* Interactive OS Switcher */}
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(
                    [
                      { id: "windows", label: "Windows", icon: Laptop },
                      { id: "android", label: "Android", icon: Smartphone },
                      { id: "mac-ios", label: "macOS & iOS", icon: Laptop },
                      { id: "linux", label: "Linux & Web", icon: Globe },
                    ] as const
                  ).map((os) => {
                    const Icon = os.icon;
                    const active = selectedOs === os.id;
                    return (
                      <button
                        key={os.id}
                        type="button"
                        onClick={() => setSelectedOs(os.id)}
                        className={`relative flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-bold transition-colors ${
                          active
                            ? "text-white"
                            : "border border-sky-200/12 bg-[#061026]/65 text-slate-300 hover:border-sky-300/25 hover:text-white"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="osMatrixActivePill"
                            transition={APPLE_SPRING}
                            className="absolute inset-0 rounded-2xl border border-sky-300/45 bg-gradient-to-b from-sky-400 to-blue-600 shadow-[0_8px_22px_-6px_rgba(14,165,233,0.5)]"
                          />
                        )}
                        <Icon className="relative z-10 h-4 w-4 stroke-[1.8]" />
                        <span className="relative z-10">{os.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected OS Biometric & Capability Card */}
                <div className="mt-4 grid grid-cols-1 items-center gap-4 rounded-2xl border border-sky-200/[0.14] bg-[#061026]/70 p-5 shadow-[inset_0_1px_0_rgba(186,230,253,0.14)] sm:grid-cols-12">
                  <div className="relative flex h-32 items-center justify-center sm:col-span-4">
                    {[1, 2, 3].map((ring) => (
                      <motion.span
                        key={ring}
                        animate={
                          prefersReducedMotion
                            ? undefined
                            : {
                                scale: [1, 1.14 + ring * 0.06, 1],
                                opacity: [0.5, 0.14, 0.5],
                              }
                        }
                        transition={{
                          duration: 2.6,
                          delay: ring * 0.25,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        style={{
                          width: `${46 + ring * 24}px`,
                          height: `${46 + ring * 24}px`,
                        }}
                        className="pointer-events-none absolute rounded-full border border-sky-400/40 bg-sky-400/[0.03]"
                      />
                    ))}
                    <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-300/40 bg-gradient-to-b from-sky-500/30 to-[#081634] text-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.35)]">
                      <Fingerprint className="h-7 w-7 stroke-[1.7]" />
                    </div>
                  </div>

                  <div className="sm:col-span-8">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedOs}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={APPLE_SPRING}
                      >
                        <h3 className="font-display text-base font-bold text-white">
                          {OS_DETAILS.title}
                        </h3>
                        <p className="mt-1.5 text-xs font-semibold text-sky-300">
                          {OS_DETAILS.auth}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-300">
                          {OS_DETAILS.experience}
                        </p>
                      </motion.div>
                    </AnimatePresence>

                    <div className="mt-4 flex flex-wrap gap-1.5 border-t border-sky-200/[0.12] pt-3 text-[11px] font-semibold text-sky-200/85">
                      <span className="rounded-md border border-sky-200/12 bg-sky-950/65 px-2 py-0.5">
                        Google OAuth
                      </span>
                      <span className="rounded-md border border-sky-200/12 bg-sky-950/65 px-2 py-0.5">
                        Argon2 Hashing
                      </span>
                      <span className="rounded-md border border-sky-200/12 bg-sky-950/65 px-2 py-0.5">
                        Email OTP
                      </span>
                      <span className="rounded-md border border-sky-200/12 bg-sky-950/65 px-2 py-0.5">
                        TOTP 2FA
                      </span>
                    </div>
                  </div>
                </div>
              </LiquidGlassCard>
            </ParallaxChapterStage>
          </div>

          {/* STAGE 04: PROTECTED SHARES, DROP ZONES & 6-DIGIT QUICK TRANSFERS */}
          <div id="parallax-stage-3">
            <ParallaxChapterStage
              chapterIndex={3}
              onEnter={setActiveChapter}
              floatingBadgeTop={
                <div className="flex items-center gap-2 rounded-2xl border border-indigo-400/30 bg-[#12163B]/90 px-3.5 py-2 font-mono text-[11px] font-bold text-indigo-200 shadow-[0_18px_38px_-10px_rgba(1,4,16,0.8)] backdrop-blur-2xl">
                  <Flame className="h-3.5 w-3.5 text-sky-400" />
                  <span>Burn-After-Read &amp; Time Capsule</span>
                </div>
              }
            >
              <div className="space-y-4">
                <LiquidGlassCard strong className="p-6 sm:p-7">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-sky-300">
                        /s/[token] • Protected Share Policies
                      </span>
                      <h2 className="mt-1 font-display text-xl font-extrabold text-white">
                        Self-Destructing &amp; Time-Locked Links
                      </h2>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {[
                      {
                        active: burnAfterRead,
                        toggle: () => setBurnAfterRead((v) => !v),
                        icon: Flame,
                        label: "Burn After Read",
                      },
                      {
                        active: timeCapsule,
                        toggle: () => setTimeCapsule((v) => !v),
                        icon: Clock,
                        label: "Time Capsule",
                      },
                      {
                        active: otpGate,
                        toggle: () => setOtpGate((v) => !v),
                        icon: KeyRound,
                        label: "Recipient OTP",
                      },
                      {
                        active: watermarkMode,
                        toggle: () => setWatermarkMode((v) => !v),
                        icon: Stamp,
                        label: "Watermark",
                      },
                    ].map((pol) => {
                      const Icon = pol.icon;
                      return (
                        <button
                          key={pol.label}
                          type="button"
                          onClick={pol.toggle}
                          className={`flex flex-col items-start gap-1.5 rounded-2xl border p-3 text-left transition-all ${
                            pol.active
                              ? "border-sky-300/45 bg-gradient-to-b from-sky-500/35 to-blue-700/45 text-white shadow-[inset_0_1px_0_rgba(224,242,254,0.3)]"
                              : "border-sky-200/12 bg-[#061026]/65 text-slate-300 hover:border-sky-300/25 hover:text-white"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 stroke-[1.8] ${
                              pol.active ? "text-sky-300" : "text-slate-400"
                            }`}
                          />
                          <span className="text-xs font-bold">{pol.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3.5 flex flex-col gap-2 sm:flex-row">
                    <div className="flex-1 truncate rounded-xl border border-sky-200/18 bg-[#040B1C]/85 px-3.5 py-2 font-mono text-xs text-sky-200">
                      /s/[token]?burn={String(burnAfterRead)}&amp;capsule={String(timeCapsule)}
                      &amp;otp={String(otpGate)}&amp;wm={String(watermarkMode)}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          `/s/[token]?burn=${burnAfterRead}&capsule=${timeCapsule}&otp=${otpGate}&wm=${watermarkMode}`
                        );
                        setCopiedPolicy(true);
                        window.setTimeout(() => setCopiedPolicy(false), 2000);
                      }}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-colors ${
                        copiedPolicy
                          ? "bg-emerald-600"
                          : "border border-sky-300/40 bg-gradient-to-b from-sky-400 to-blue-600 hover:brightness-110"
                      }`}
                    >
                      {copiedPolicy ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedPolicy ? "Copied" : "Copy Policy"}</span>
                    </button>
                  </div>
                </LiquidGlassCard>

                {/* Split Pair: Anonymous Drop Zone + Wired 6-Digit Quick Transfer */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <LiquidGlassCard className="p-5">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-sky-300">
                      <Inbox className="h-3.5 w-3.5" /> /d/[token] • Drop Zones
                    </span>
                    <h3 className="mt-2 font-display text-base font-bold text-white">
                      Anonymous Upload Portals
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">
                      Accept external files into a target folder with strict size &amp; MIME limits
                      without exposing existing contents.
                    </p>
                  </LiquidGlassCard>

                  <LiquidGlassCard className="flex flex-col justify-between p-5">
                    <div>
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-indigo-300">
                        <Send className="h-3.5 w-3.5" /> /t/[code] • Quick Transfer Pickup
                      </span>
                      <h3 className="mt-2 font-display text-base font-bold text-white">
                        Ephemeral 6-Digit Handoff
                      </h3>
                    </div>
                    <form onSubmit={handleQuickPickup} className="mt-3 flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={quickCodeInput}
                        onChange={(e) => setQuickCodeInput(e.target.value.replace(/\D/g, ""))}
                        placeholder="619408"
                        aria-label="Enter 6-digit quick transfer code"
                        className="min-w-0 flex-1 rounded-xl border border-sky-300/25 bg-[#040B1C]/85 px-3 py-1.5 font-mono text-sm font-extrabold tracking-[0.25em] text-sky-200 placeholder:text-slate-600 focus:border-sky-400 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="shrink-0 rounded-xl border border-sky-300/35 bg-sky-500/20 px-3 py-2 text-xs font-semibold text-sky-100 transition-colors hover:bg-sky-500/30"
                      >
                        Receive
                      </button>
                    </form>
                  </LiquidGlassCard>
                </div>
              </div>
            </ParallaxChapterStage>
          </div>

          {/* STAGE 05: 2 GB TESTING QUOTA & UPCOMING STORAGE PLANS */}
          <div id="parallax-stage-4">
            <ParallaxChapterStage
              chapterIndex={4}
              anchorId="pricing-bento"
              onEnter={setActiveChapter}
              floatingBadgeTop={
                <div className="pointer-events-auto inline-flex items-center rounded-full border border-sky-300/25 bg-[#0A1838]/90 p-1 shadow-[0_18px_38px_-10px_rgba(1,4,16,0.8)] backdrop-blur-2xl">
                  {(["monthly", "yearly"] as const).map((p) => {
                    const active = billing === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setBilling(p)}
                        className={`relative rounded-full px-3 py-1 text-[11px] font-bold capitalize transition-colors ${
                          active ? "text-white" : "text-slate-300 hover:text-white"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="parallaxPricingToggle"
                            transition={APPLE_SPRING}
                            className="absolute inset-0 rounded-full border border-sky-300/40 bg-gradient-to-b from-sky-400 to-blue-600"
                          />
                        )}
                        <span className="relative z-10">{p}</span>
                      </button>
                    );
                  })}
                </div>
              }
            >
              <div className="space-y-4">
                <LiquidGlassCard strong iridescent className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-gradient-to-r from-sky-400 to-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-[0_4px_14px_rgba(14,165,233,0.45)]">
                      Active Public Testing Tier
                    </span>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 font-mono text-xs font-bold text-emerald-300 tabular-nums">
                      2 GB Free for Everyone
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-sky-200/[0.12] pb-5">
                    <div>
                      <h2 className="font-display text-2xl font-extrabold text-white">
                        {PRICING_PLANS[0].name}
                      </h2>
                      <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-300">
                        {PRICING_PLANS[0].tagline}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-4xl font-extrabold text-white tabular-nums">
                        $0
                      </span>
                      <p className="text-[11px] font-medium text-sky-300/80">
                        free during testing phase
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {PRICING_PLANS[0].highlights.map((feat) => (
                      <div key={feat} className="flex items-start gap-2 text-xs text-slate-200">
                        <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-sky-400/30 bg-sky-500/20 text-sky-300">
                          <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                        </span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <MagneticButton variant="primary" size="md" onClick={() => router.push("/signup")}>
                      <span>Claim Your 2 GB Free Storage</span>
                      <ArrowRight className="h-4 w-4" />
                    </MagneticButton>
                    <button
                      type="button"
                      onClick={() => router.push("/login")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/20 bg-sky-950/55 px-4 py-2.5 text-xs font-semibold text-sky-100 transition-colors hover:border-sky-300/40 hover:bg-sky-900/65"
                    >
                      <Folder className="h-3.5 w-3.5 text-sky-400" />
                      <span>Sign In to Account</span>
                    </button>
                  </div>
                </LiquidGlassCard>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {PRICING_PLANS.slice(1).map((plan) => (
                    <LiquidGlassCard
                      key={plan.id}
                      interactive
                      className="flex flex-col justify-between p-6"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-full border border-sky-200/18 bg-sky-950/60 px-2.5 py-0.5 text-[11px] font-bold text-sky-200">
                            {plan.storageBadge}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-0.5 text-[10.5px] font-semibold text-amber-300">
                            <Clock className="h-3 w-3" />
                            Soon
                          </span>
                        </div>
                        <h3 className="mt-3 font-display text-lg font-bold text-white">
                          {plan.name}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-300/85">
                          {plan.tagline}
                        </p>
                        <p className="mt-3 font-display text-base font-extrabold text-sky-200">
                          Soon to be updated
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {billing === "yearly" ? "Annual" : "Monthly"} larger quota pricing will be
                          announced after testing
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          toast.info(
                            "Start with 2 GB free now—expanded storage pricing will be updated soon."
                          )
                        }
                        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-sky-200/18 bg-sky-950/55 py-2 text-xs font-semibold text-sky-100 transition-colors hover:border-sky-300/35 hover:bg-sky-900/65"
                      >
                        <FolderPlus className="h-3.5 w-3.5 text-sky-400" />
                        <span>{plan.ctaLabel}</span>
                      </button>
                    </LiquidGlassCard>
                  ))}
                </div>
              </div>
            </ParallaxChapterStage>
          </div>
        </div>
      </div>
    </section>
  );
}
