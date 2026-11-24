"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import gsap from "gsap";
import { MotionCard } from "@/components/ui/MotionCard";
import { MagneticButton } from "@/components/ui/MagneticButton";
import {
  Shield,
  Lock,
  Flame,
  MailCheck,
  Eye,
  Inbox,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Server,
  KeyRound,
  Fingerprint,
  ChevronDown,
  Layers,
  Radio,
  Sliders,
  Cpu,
  Compass,
  FileCode,
  HardDrive,
  Activity,
  ArrowUpRight,
  LockKeyhole,
  Check,
  Copy,
  Share2,
  FileCheck,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function MarketingLandingPage() {
  const router = useRouter();
  const [quickCode, setQuickCode] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [activeSection, setActiveSection] = useState("hero");
  const [selectedDialMode, setSelectedDialMode] = useState<"aes" | "otp" | "ttl" | "fido">("aes");
  const [vaultArmed, setVaultArmed] = useState(true);
  const [speedLevel, setSpeedLevel] = useState<number>(4); // 1 = 25k, 2 = 50k, 3 = 75k, 4 = 100k
  const [activeTab, setActiveTab] = useState<"auth" | "transfer">("auth");

  // Track page scroll for parallax transformations
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 26, restDelta: 0.001 });

  // Multi-layer parallax transform offsets
  const yHeroBadge = useTransform(smoothProgress, [0, 0.25], [0, -30]);
  const yHeroText = useTransform(smoothProgress, [0, 0.25], [0, -18]);
  const yArchCard = useTransform(smoothProgress, [0.05, 0.35], [25, -20]);
  const yFeatureOdd = useTransform(smoothProgress, [0.15, 0.65], [25, -20]);
  const yFeatureEven = useTransform(smoothProgress, [0.15, 0.65], [45, -10]);
  const yVaultBlock = useTransform(smoothProgress, [0.35, 0.75], [30, -25]);
  const yComparison = useTransform(smoothProgress, [0.55, 0.9], [25, -15]);

  const handleQuickTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickCode.trim().length === 6) {
      router.push(`/t/${quickCode.trim().toUpperCase()}`);
    }
  };

  // Section observer to update sticky HUD navigator
  useEffect(() => {
    const sectionIds = ["hero", "architecture", "features", "vault", "comparison", "faq"];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 240;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    gsap.from(".hero-anim", {
      y: 20,
      opacity: 0,
      duration: 0.7,
      stagger: 0.07,
      ease: "power3.out",
    });
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const dialModes = [
    { id: "aes", label: "AES-256", title: "AES-256-GCM", readout: "256b", sub: "GCM HARDWARE", detail: `${speedLevel * 25}k PBKDF2 Iterations` },
    { id: "otp", label: "OTP-Gate", title: "Email OTP Gate", readout: "6-DIG", sub: "SMTP VERIFIED", detail: "Cryptographic 6-digit token" },
    { id: "ttl", label: "Burn TTL", title: "Self-Destruct", readout: "10m", sub: "AUTO ERASE", detail: "Zero-trace link destruction" },
    { id: "fido", label: "Passkeys", title: "FIDO2 / WebAuthn", readout: "FIDO2", sub: "TOUCH / FACE ID", detail: "Hardware cryptographic keypair" },
  ];

  const currentModeInfo = dialModes.find((m) => m.id === selectedDialMode) || dialModes[0];

  const speedLabels = [
    { level: 1, label: "25k" },
    { level: 2, label: "50k" },
    { level: 3, label: "75k" },
    { level: 4, label: "100k" },
  ];

  const features = [
    {
      code: "CAP-01",
      title: "Zero-Knowledge Private Vault",
      subtitle: "AES-256-GCM Client-Side Encryption",
      description:
        "Encrypt files and confidential filenames in your browser before transmission. Keys are derived from your master passphrase via PBKDF2 with 100,000 iterations. Plaintext never touches our servers or cloud buckets.",
      icon: Shield,
      accent: "text-indigo-300 bg-[#181726] border-indigo-500/30",
      tag: "Zero-Knowledge",
      metric: "100k PBKDF2",
    },
    {
      code: "CAP-02",
      title: "Burn-After-Read Shares",
      subtitle: "Self-Destructing Ephemeral Links",
      description:
        "Share files that automatically purge after a configured view count, download limit, or expiration countdown. Once consumed, the cryptographic decryption key is permanently revoked with zero recovery possible.",
      icon: Flame,
      accent: "text-rose-400 bg-rose-950/60 border-rose-800/50",
      tag: "Self-Destruct",
      metric: "Zero Footprint",
    },
    {
      code: "CAP-03",
      title: "Recipient-Verified Sharing",
      subtitle: "Gmail SMTP One-Time Code Gate",
      description:
        "Lock sensitive documents to a specific recipient. Before accessing or downloading, the recipient must prove ownership of their email address by submitting a single-use 6-digit OTP code delivered via Gmail SMTP.",
      icon: MailCheck,
      accent: "text-indigo-300 bg-[#181726] border-indigo-500/30",
      tag: "Email OTP",
      metric: "6-Digit Gate",
    },
    {
      code: "CAP-04",
      title: "Anti-Copy Dynamic Watermarking",
      subtitle: "Secure Canvas Document Viewer",
      description:
        "Preview confidential PDFs, tax filings, and images inside a sandboxed viewer with a dynamic canvas watermark embedding the viewer's verified email, IP address, and timestamp to deter unauthorized screenshots.",
      icon: Eye,
      accent: "text-purple-400 bg-purple-950/60 border-purple-800/50",
      tag: "Dynamic Watermark",
      metric: "Canvas Watermark",
    },
    {
      code: "CAP-05",
      title: "Drop Zones (Request Files)",
      subtitle: "Anonymous Upload-Only Portal",
      description:
        "Generate a secure upload portal for clients or collaborators. Anyone with your link can deposit files directly into your designated folder without creating an account or viewing any existing folder contents.",
      icon: Inbox,
      accent: "text-amber-400 bg-amber-950/60 border-amber-800/50",
      tag: "Upload Portal",
      metric: "Client Dropbox",
    },
    {
      code: "CAP-06",
      title: "Quick Transfer (PC ↔ Phone)",
      subtitle: "6-Character Handoff Without Login",
      description:
        "Move files between your laptop and mobile device instantly. Generate a short 6-character code or QR scan. The receiver opens the link with zero login required. Files auto-destruct in 10 minutes.",
      icon: Zap,
      accent: "text-emerald-400 bg-emerald-950/60 border-emerald-800/50",
      tag: "10-Min TTL",
      metric: "Instant QR / Code",
    },
  ];

  const comparisonData = [
    { feature: "Client-Side Zero-Knowledge Encryption", orbitr: true, gdrive: false, dropbox: false, onedrive: false },
    { feature: "Recipient-Verified Email OTP Sharing", orbitr: true, gdrive: false, dropbox: false, onedrive: false },
    { feature: "Burn-After-Read (Self-Destructing Links)", orbitr: true, gdrive: false, dropbox: false, onedrive: false },
    { feature: "Direct Browser-to-R2 Presigned Uploads", orbitr: true, gdrive: false, dropbox: false, onedrive: false },
    { feature: "Passwordless Biometric Passkeys (FIDO2)", orbitr: true, gdrive: "Partial", dropbox: "Partial", onedrive: "Partial" },
    { feature: "PC-to-Phone Quick Transfer without Login", orbitr: true, gdrive: false, dropbox: false, onedrive: false },
    { feature: "Anonymous File Drop Zones", orbitr: true, gdrive: false, dropbox: true, onedrive: false },
    { feature: "Anti-Copy Canvas Dynamic Watermarking", orbitr: true, gdrive: false, dropbox: false, onedrive: false },
    { feature: "No 4.5 MB Serverless Memory Upload Limit", orbitr: true, gdrive: true, dropbox: true, onedrive: true },
    { feature: "Client-Side Deduplication (Instant Upload)", orbitr: true, gdrive: false, dropbox: false, onedrive: false },
  ];

  const faqs = [
    {
      q: "How does Orbitr's zero-knowledge Private Vault differ from standard cloud storage?",
      a: "Traditional cloud storage providers encrypt your files using keys they control, meaning their employees, automated scanners, and automated AI scrapers can inspect your plaintext data. Orbitr's Private Vault encrypts both file contents and filenames directly in your web browser with AES-256-GCM before transmission. The key never leaves your device memory, meaning even our servers and storage providers only ever see scrambled ciphertext.",
    },
    {
      q: "How can I sign up or sign in?",
      a: "Orbitr offers maximum flexibility and security: you can sign in with 1-click Google OAuth (100% free), use passwordless Passkeys (Touch ID, Face ID, Windows Hello), or register with a custom User ID, date of birth, and password. Whichever method you choose, you receive your credentials via email and access your 2.0 GB complimentary drive.",
    },
    {
      q: "How does the 6-character Quick Transfer work without requiring login?",
      a: "When you need to send a file from your laptop to your phone (or vice-versa), Orbitr generates a cryptographically secure 6-character alphanumeric code or QR code. The receiver navigates to /t/[code] on their mobile device or scans the QR code. The file is decrypted and downloaded instantly without forcing the receiving device to sign in. The transfer automatically self-destructs after 10 minutes or upon download.",
    },
    {
      q: "How do Recipient-Verified Shares protect confidential documents?",
      a: "When sharing sensitive tax documents, contracts, or credentials, you can check 'Require Email OTP'. The recipient will receive an email containing a one-time 6-digit code. They cannot view or download the file without verifying this code, ensuring that leaked share links cannot be accessed by unauthorized third parties.",
    },
    {
      q: "What is the maximum file size supported by Orbitr?",
      a: "Unlike traditional serverless web apps that suffer from 4.5 MB body limits, Orbitr negotiates direct presigned S3/R2 tunnels. Files upload directly from your browser to private object storage, comfortably supporting files up to 5.0 GB per upload with client-side SHA-256 integrity verification.",
    },
  ];

  const navSections = [
    { id: "hero", code: "01", label: "Home" },
    { id: "architecture", code: "02", label: "Arch" },
    { id: "features", code: "03", label: "Caps" },
    { id: "vault", code: "04", label: "Vault" },
    { id: "comparison", code: "05", label: "Matrix" },
    { id: "faq", code: "06", label: "FAQ" },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#15171c] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-clip font-sans">

      {/* =========================================================================
          SIMPLE, AESTHETIC TOP NAVIGATION BAR (Full-Screen Spanning)
         ========================================================================= */}
      <header className="sticky top-0 z-50 w-full bg-[#15171c]/85 backdrop-blur-md border-b border-white/[0.05]">
        <div className="w-full max-w-[1720px] mx-auto px-5 sm:px-10 h-16 flex items-center justify-between">
          {/* Logo & Name of Orbitr (Text-Only Two-Colour Wordmark) */}
          <Logo size="md" />

          {/* Quick Access Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl neu-btn transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-1.5 neu-btn-primary font-medium text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Sign Up</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Clean Dark Carbon Background Canvas */}

      {/* =========================================================================
          FULL-SCREEN RESPONSIVE WORKSPACE: EXPANSIVE CONTENT + NON-SCROLLABLE SIDEBAR
         ========================================================================= */}
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 xl:px-12 py-8 sm:py-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start">

          {/* =========================================================================
              LEFT SCROLLING COLUMN (lg:col-span-8):
              Expansive, Informative & Modern Architecture
             ========================================================================= */}
          <main className="lg:col-span-8 space-y-24 min-w-0">

            {/* SECTION 1: HERO OVERVIEW */}
            <section id="hero" className="space-y-8 pt-2 scroll-mt-24">
              {/* Mission Badge with Parallax Depth */}
              <motion.div style={{ y: yHeroBadge }} className="hero-anim">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181726] border border-indigo-500/30 text-xs text-indigo-300 font-semibold shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Orbitr 2.0 &bull; The Zero-Knowledge Cloud Storage OS</span>
                </div>
              </motion.div>

              {/* Big Powerful Headline */}
              <motion.div style={{ y: yHeroText }} className="space-y-4">
                <h1 className="hero-anim text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
                  Your files, <br />
                  <span className="bg-gradient-to-r from-[#c7d2fe] via-[#818cf8] to-[#6366f1] bg-clip-text text-transparent">
                    in orbit.
                  </span>
                </h1>

                <p className="hero-anim text-base sm:text-lg xl:text-xl text-slate-300 font-normal leading-relaxed max-w-3xl">
                  Orbitr is an aerospace-grade personal cloud drive engineered for complete privacy.
                  Store, share, and synchronize your digital assets with client-side zero-knowledge AES-256-GCM encryption,
                  self-destructing links, recipient email OTP gates, and biometric passkeys.
                </p>
              </motion.div>

              {/* CTA Action Row */}
              <div className="hero-anim flex flex-wrap items-center gap-4 pt-1">
                <Link href="/signup">
                  <MagneticButton className="flex items-center gap-2 neu-btn-primary text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-all active:scale-[0.98]">
                    <span>Create Free Orbitr Drive</span>
                    <ArrowRight className="w-4 h-4" />
                  </MagneticButton>
                </Link>
                <button
                  onClick={() => scrollToSection("architecture")}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-xl neu-btn text-slate-200 font-medium text-sm transition-all cursor-pointer hover:text-white"
                >
                  <Radio className="w-4 h-4 text-indigo-400" />
                  <span>View Architecture</span>
                </button>
                <button
                  onClick={() => scrollToSection("features")}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-xl neu-btn text-slate-200 font-medium text-sm transition-all cursor-pointer hover:text-white"
                >
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span>Explore Capabilities</span>
                </button>
              </div>

              {/* Trust Badges Row */}
              <div className="hero-anim grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 neu-pill px-3.5 py-2 rounded-xl bg-[#1c1f26] border border-[#262a34]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">2 GB Free Drive</span>
                </div>
                <div className="flex items-center gap-2 neu-pill px-3.5 py-2 rounded-xl bg-[#1c1f26] border border-[#262a34]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">Passkeys & Google</span>
                </div>
                <div className="flex items-center gap-2 neu-pill px-3.5 py-2 rounded-xl bg-[#1c1f26] border border-[#262a34]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">Zero Plaintext Leak</span>
                </div>
                <div className="flex items-center gap-2 neu-pill px-3.5 py-2 rounded-xl bg-[#1c1f26] border border-[#262a34]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">5 GB Upload Tunnel</span>
                </div>
              </div>

              {/* Live Telemetry Cockpit Strip */}
              <div className="hero-anim p-4 rounded-2xl neu-inset border border-white/[0.04] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase">CIPHER ENGINE</span>
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" /> AES-256-GCM
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase">SERVER LATENCY</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> 0ms Direct R2
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase">KEY HARDENING</span>
                  <span className="text-indigo-400 font-bold">100k PBKDF2</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase">HARDWARE AUTH</span>
                  <span className="text-purple-400 font-bold flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-purple-400" /> FIDO2 / Touch ID
                  </span>
                </div>
              </div>
            </section>

            {/* SECTION 2: HOW ORBITR WORKS (Presigned Architecture Spotlight) */}
            <section id="architecture" className="space-y-8 scroll-mt-24 pt-4 border-t border-[#22252e]">
              <div className="space-y-3">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest bg-[#181726] px-3 py-1 rounded-full border border-indigo-500/30">
                  Storage Plane Engineering
                </span>
                <h2 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-slate-100 tracking-tight">
                  Direct Browser-to-Storage Presigned Architecture
                </h2>
                <p className="text-xs sm:text-sm xl:text-base text-slate-400 max-w-3xl leading-relaxed">
                  Legacy cloud web applications route uploads through application server memory, hitting severe 4.5 MB serverless
                  payload ceilings and exposing unencrypted bytes to middleman proxies. Orbitr negotiates presigned tunnels to deliver
                  instant, high-throughput private storage.
                </p>
              </div>

              <motion.div style={{ y: yArchCard }}>
                <MotionCard className="p-6 sm:p-8 rounded-3xl neu-flat space-y-6 border border-white/[0.06]" tiltMaxAngle={2}>
                  {/* Visual 3-Stage Pipeline Diagram */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 sm:p-5 rounded-2xl neu-inset space-y-2.5">
                      <div className="flex items-center justify-between text-indigo-400">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-950/70 border border-indigo-800/50">
                          STAGE 01
                        </span>
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Client-Side Cipher</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Browser derives 256-bit encryption keys from your vault passphrase via 100,000 PBKDF2 iterations with SHA-256 and unique user salt.
                      </p>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl neu-inset space-y-2.5">
                      <div className="flex items-center justify-between text-indigo-400">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#181726] border border-indigo-500/40">
                          STAGE 02
                        </span>
                        <Radio className="w-4 h-4 animate-pulse text-indigo-400" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Presigned URL Gate</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Orbitr validates quota and authentication, then mints an authorized presigned PUT ticket directly targeting encrypted Cloudflare R2 / AWS S3 buckets.
                      </p>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl neu-inset space-y-2.5">
                      <div className="flex items-center justify-between text-emerald-400">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-800/50">
                          STAGE 03
                        </span>
                        <Server className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Direct Stream & Verification</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Scrambled ciphertext streams over high-speed HTTPS directly to storage with client-computed SHA-256 checksums verified upon completion.
                      </p>
                    </div>
                  </div>

                  {/* 4 Telemetry Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-2">
                    <div className="p-3.5 rounded-xl neu-inset">
                      <p className="text-xl sm:text-2xl font-light text-slate-100 font-mono">0.00ms</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase">Server Buffer</p>
                    </div>
                    <div className="p-3.5 rounded-xl neu-inset">
                      <p className="text-xl sm:text-2xl font-light text-indigo-400 font-mono">5.0 GB</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase">Max File Limit</p>
                    </div>
                    <div className="p-3.5 rounded-xl neu-inset">
                      <p className="text-xl sm:text-2xl font-light text-emerald-400 font-mono">100%</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase">Private Bucket</p>
                    </div>
                    <div className="p-3.5 rounded-xl neu-inset">
                      <p className="text-xl sm:text-2xl font-light text-purple-400 font-mono">SHA-256</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase">Integrity Check</p>
                    </div>
                  </div>
                </MotionCard>
              </motion.div>
            </section>

            {/* SECTION 3: ENGINEERED CAPABILITIES (6 Rich Interactive Cards) */}
            <section id="features" className="space-y-8 scroll-mt-24 pt-4 border-t border-[#22252e]">
              <div className="space-y-3">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest bg-[#181726] px-3 py-1 rounded-full border border-indigo-500/30">
                  Engineered Capabilities
                </span>
                <h2 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-slate-100 tracking-tight">
                  Advanced Security Features You Won&apos;t Find in Standard Drives
                </h2>
                <p className="text-xs sm:text-sm xl:text-base text-slate-400 max-w-3xl leading-relaxed">
                  From zero-knowledge encryption to recipient-verified transfers and self-destructing links,
                  Orbitr gives you absolute mathematical control over your digital footprint.
                </p>
              </div>

              {/* Responsive Staggered Parallax Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feat, idx) => {
                  const Icon = feat.icon;
                  const isOdd = idx % 2 === 1;
                  return (
                    <motion.div
                      key={idx}
                      style={{ y: isOdd ? yFeatureOdd : yFeatureEven }}
                    >
                      <MotionCard
                        className="p-6 rounded-3xl neu-convex space-y-4 text-left h-full flex flex-col justify-between group border border-white/[0.04] hover:border-indigo-400/40 transition-all"
                        tiltMaxAngle={4}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${feat.accent} shadow-2xs`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-[#111317] text-slate-400 border border-[#22252e]">
                                {feat.code}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#181726] text-indigo-300 border border-indigo-500/30 font-semibold">
                                {feat.tag}
                              </span>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                              {feat.title}
                            </h3>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                              {feat.subtitle}
                            </p>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                            {feat.description}
                          </p>
                        </div>

                        <div className="pt-3.5 border-t border-[#22252e]/60 flex items-center justify-between text-xs text-indigo-400 font-medium font-mono">
                          <span>{feat.metric}</span>
                          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                      </MotionCard>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* SECTION 4: PRIVATE VAULT CRYPTOGRAPHIC PIPELINE */}
            <section id="vault" className="space-y-6 scroll-mt-24 pt-4 border-t border-[#22252e]">
              <motion.div style={{ y: yVaultBlock }} className="space-y-6">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800/50">
                    Zero-Knowledge Guarantees
                  </span>
                  <h2 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-slate-100 tracking-tight">
                    The Orbitr Cryptographic Pipeline
                  </h2>
                  <p className="text-xs sm:text-sm xl:text-base text-slate-400 max-w-3xl leading-relaxed">
                    Here is exactly how your files and confidential metadata remain mathematically private from our servers,
                    storage backends, and ISP network observers.
                  </p>
                </div>

                <div className="p-6 sm:p-8 rounded-3xl neu-flat space-y-6 border border-white/[0.06]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
                    <div className="p-4 sm:p-5 rounded-2xl neu-inset space-y-2.5">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                        <KeyRound className="w-4 h-4" /> 1. Client Derivation
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Your master passphrase undergoes 100,000 iterations of PBKDF2 using SHA-256 and unique user salt inside your browser.
                      </p>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl neu-inset space-y-2.5">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                        <Shield className="w-4 h-4" /> 2. Local AES-GCM
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Browser encrypts bytes and filenames with authenticated AES-256-GCM. Plaintext is destroyed from memory immediately.
                      </p>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl neu-inset space-y-2.5">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                        <Server className="w-4 h-4" /> 3. Direct S3 Tunnel
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Scrambled ciphertext streams over presigned HTTPS channels to private storage. Servers only see unreadable noise.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-[#111317] border border-[#22252e] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
                    <div className="flex items-center gap-2.5 text-slate-300">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      <span>Web Crypto API &bull; Submarine Volatile Key Isolation</span>
                    </div>
                    <span className="text-emerald-400 font-bold px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
                      ZERO KNOWLEDGE CONFIRMED
                    </span>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* SECTION 5: SIDE-BY-SIDE BENCHMARK COMPARISON */}
            <section id="comparison" className="space-y-6 scroll-mt-24 pt-4 border-t border-[#22252e]">
              <motion.div style={{ y: yComparison }} className="space-y-6">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-widest bg-sky-950/60 px-3 py-1 rounded-full border border-sky-800/50">
                    Side-by-Side Comparison
                  </span>
                  <h2 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-slate-100 tracking-tight">
                    Why Orbitr Stands Apart
                  </h2>
                  <p className="text-xs sm:text-sm xl:text-base text-slate-400 max-w-3xl leading-relaxed">
                    See how Orbitr&apos;s privacy-first architecture stacks up against legacy cloud storage giants.
                  </p>
                </div>

                <div className="neu-flat border border-white/[0.06] rounded-3xl shadow-sm overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="bg-[#111317] border-b border-[#22252e] text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        <th className="py-4 px-6">Capability / Security Feature</th>
                        <th className="py-4 px-6 text-indigo-300 bg-[#181726]/70 font-extrabold">Orbitr Drive</th>
                        <th className="py-4 px-6 text-slate-400">Google Drive</th>
                        <th className="py-4 px-6 text-slate-400">Dropbox</th>
                        <th className="py-4 px-6 text-slate-400">OneDrive</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#22252e] text-xs">
                      {comparisonData.map((row, i) => (
                        <tr key={i} className="hover:bg-[#1a1d24]/50 transition-colors">
                          <td className="py-3.5 px-6 font-medium text-slate-200">{row.feature}</td>
                          <td className="py-3.5 px-6 font-bold text-emerald-400 bg-[#181726]/30">
                            <span className="inline-flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Yes (Native)
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-slate-400">
                            {row.gdrive === true ? (
                              <span className="text-emerald-400 font-semibold">Yes</span>
                            ) : row.gdrive === "Partial" ? (
                              <span className="text-amber-400 font-semibold">Partial</span>
                            ) : (
                              <span className="text-slate-500">No</span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-slate-400">
                            {row.dropbox === true ? (
                              <span className="text-emerald-400 font-semibold">Yes</span>
                            ) : row.dropbox === "Partial" ? (
                              <span className="text-amber-400 font-semibold">Partial</span>
                            ) : (
                              <span className="text-slate-500">No</span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-slate-400">
                            {row.onedrive === true ? (
                              <span className="text-emerald-400 font-semibold">Yes</span>
                            ) : row.onedrive === "Partial" ? (
                              <span className="text-amber-400 font-semibold">Partial</span>
                            ) : (
                              <span className="text-slate-500">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </section>

            {/* SECTION 6: FREQUENTLY ASKED QUESTIONS */}
            <section id="faq" className="space-y-6 scroll-mt-24 pt-4 border-t border-[#22252e]">
              <div className="space-y-3">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest bg-[#181726] px-3 py-1 rounded-full border border-indigo-500/30">
                  Got Questions?
                </span>
                <h2 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-slate-100 tracking-tight">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-3 text-left">
                {faqs.map((faq, i) => {
                  const isOpen = expandedFaq === i;
                  return (
                    <div
                      key={i}
                      className="rounded-2xl neu-flat border border-white/[0.06] overflow-hidden shadow-xs"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(isOpen ? null : i)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-semibold text-slate-200 text-xs sm:text-sm hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180 text-indigo-400" : ""}`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-[#22252e] bg-[#111317]/80">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SECTION 7: BOTTOM CONVERSION BANNER */}
            <section className="pt-6">
              <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#2e2b6e] via-[#4338ca] to-[#6366f1] text-white shadow-[0_12px_40px_rgba(99,102,241,0.35)] space-y-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <h3 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold tracking-tight">
                    Ready to put your files in orbit?
                  </h3>
                  <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
                    Get 2.0 GB of zero-knowledge encrypted storage. Sign up in seconds with Google or create an account with your custom User ID.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
                  <Link
                    href="/signup"
                    className="w-full sm:w-auto text-center px-7 py-3.5 bg-white text-slate-900 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto text-center px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs rounded-xl transition-all"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </section>

          </main>

          {/* =========================================================================
              RIGHT STICKY SIDEBAR (lg:col-span-4):
              PERFECTLY SIZED, NON-SCROLLABLE CHASSIS THAT REMAINS FIXED AS YOU SCROLL!
             ========================================================================= */}
          <aside className="lg:col-span-4 lg:sticky lg:top-20 self-start">

            {/* Unified Cyber Cockpit Console (Non-Scrollable, Single Chassis) */}
            <div className="p-4 sm:p-5 rounded-3xl neu-flat border border-white/[0.08] shadow-2xl space-y-4">

              {/* 1. Precision Mission Radar Navigation */}
              <div className="space-y-1.5 pb-2 border-b border-[#22252e]">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                    <Compass className="w-3.5 h-3.5 text-indigo-400" /> Mission Radar
                  </span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-[9px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE TRACK
                  </span>
                </div>

                {/* 6 Segmented Nav Tabs */}
                <div className="grid grid-cols-6 gap-1">
                  {navSections.map((sec) => {
                    const isActive = activeSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => scrollToSection(sec.id)}
                        className={`py-1.5 px-0.5 rounded-lg text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isActive
                            ? "bg-gradient-to-b from-[#1b1930] to-[#252244] border border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_rgba(129,140,248,0.25)]"
                            : "neu-inset text-slate-400 hover:text-slate-200"
                        }`}
                        title={sec.label}
                      >
                        <span className={`text-[8.5px] font-mono font-bold ${isActive ? "text-indigo-300" : "text-slate-400"}`}>
                          {sec.code}
                        </span>
                        <span className="text-[9px] font-semibold truncate max-w-full">
                          {sec.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Cyber Storage Engine (Tesla Cybertruck Radial Dial) */}
              <div className="space-y-3 pb-2 border-b border-[#22252e]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Cyber Storage Engine
                  </span>
                  <button
                    type="button"
                    onClick={() => setVaultArmed(!vaultArmed)}
                    className={`flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full border transition-all cursor-pointer ${vaultArmed
                      ? "text-emerald-400 border-emerald-500/40 bg-emerald-950/40"
                      : "text-amber-400 border-amber-500/40 bg-amber-950/40"
                      }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${vaultArmed ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                    {vaultArmed ? "ARMED" : "STANDBY"}
                  </button>
                </div>

                {/* Dial + Telemetry Twin Pods */}
                <div className="flex items-center justify-between gap-3">
                  <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#111317" strokeWidth="8" fill="none" />
                      {/* Calibrated Ticks */}
                      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                        <line
                          key={deg}
                          x1="50"
                          y1="6"
                          x2="50"
                          y2="9"
                          stroke="#2a2e3a"
                          strokeWidth="1.2"
                          transform={`rotate(${deg} 50 50)`}
                        />
                      ))}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="url(#cyberIndigoGradCockpit)"
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset={
                          selectedDialMode === "aes"
                            ? `${251.2 - (speedLevel / 4) * 188.4}`
                            : selectedDialMode === "otp"
                              ? "90.0"
                              : selectedDialMode === "ttl"
                                ? "130.0"
                                : "45.0"
                        }
                        strokeLinecap="round"
                        fill="none"
                        className="filter drop-shadow-[0_0_8px_rgba(129,140,248,0.5)] transition-all duration-500 ease-out"
                      />
                      <defs>
                        <linearGradient id="cyberIndigoGradCockpit" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#a5b4fc" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-3 rounded-full neu-inset flex flex-col items-center justify-center text-center">
                      <span className="text-base font-light tracking-tight text-white font-mono leading-none">
                        {currentModeInfo.readout}
                      </span>
                      <span className="text-[7px] uppercase tracking-wider text-indigo-400 font-bold mt-1 font-mono">
                        {currentModeInfo.sub}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-left flex-1 min-w-0">
                    <div className="p-1.5 rounded-lg neu-inset">
                      <span className="text-slate-400 block text-[8px] uppercase font-mono">CIPHER MODE</span>
                      <span className="font-mono text-white font-bold text-[11px] truncate block">{currentModeInfo.title}</span>
                    </div>
                    <div className="p-1.5 rounded-lg neu-inset">
                      <span className="text-slate-400 block text-[8px] uppercase font-mono">TELEMETRY</span>
                      <span className="font-mono text-indigo-300 font-semibold text-[11px] truncate block">{currentModeInfo.detail}</span>
                    </div>
                    <div className="p-1.5 rounded-lg neu-inset flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[8px] uppercase font-mono">BUFFER</span>
                        <span className="font-mono text-emerald-400 font-bold text-[11px]">0ms Direct R2</span>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Key Hardening Stepped Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400 uppercase tracking-wider">
                    <span>PBKDF2 Derivation:</span>
                    <span className="text-indigo-400 font-bold">{speedLevel * 25}k Cycles</span>
                  </div>
                  <div className="relative pt-0.5 pb-0.5">
                    <div className="h-1 w-full bg-[#111317] rounded-full overflow-hidden border border-white/[0.04]">
                      <div
                        className="h-full bg-gradient-to-r from-[#a5b4fc] to-[#6366f1] rounded-full transition-all duration-300 shadow-[0_0_6px_rgba(129,140,248,0.5)]"
                        style={{ width: `${(speedLevel / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {speedLabels.map((s) => {
                      const isSelected = speedLevel === s.level;
                      return (
                        <button
                          key={s.level}
                          type="button"
                          onClick={() => setSpeedLevel(s.level)}
                          className={`py-1 px-1 rounded-lg text-center text-[9.5px] font-mono font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#6366f1] text-white shadow-[0_0_10px_rgba(99,102,241,0.5)] border border-[#818cf8]"
                              : "neu-inset text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4 Mode Selectors */}
                <div className="grid grid-cols-4 gap-1 pt-0.5">
                  {dialModes.map((m) => {
                    const isSelected = selectedDialMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedDialMode(m.id as any)}
                        className={`py-1 px-1 rounded-lg text-center text-[9.5px] font-mono font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-b from-[#1b1930] to-[#252244] text-indigo-300 border border-indigo-500/50 shadow-[0_0_8px_rgba(129,140,248,0.25)]"
                            : "neu-inset text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Fast Interactive Access & Quick Transfer Tabs */}
              <div className="space-y-2.5">
                {/* Segmented Switcher: Access vs Quick Code */}
                <div className="grid grid-cols-2 p-1 rounded-xl neu-inset gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("auth")}
                    className={`py-1 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "auth"
                      ? "bg-[#20242e] text-white shadow-xs border border-white/[0.08]"
                      : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    Access Drive
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("transfer")}
                    className={`py-1 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${activeTab === "transfer"
                      ? "bg-[#20242e] text-emerald-400 shadow-xs border border-emerald-500/30"
                      : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span>Quick Code</span>
                  </button>
                </div>

                {activeTab === "auth" ? (
                  <div className="space-y-2">
                    {/* Google OAuth Button */}
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-center gap-2.5 neu-btn py-2 px-3 rounded-xl text-xs text-slate-200 font-semibold cursor-pointer active:scale-[0.98] hover:border-white/15"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
                      <span>Continue with Google</span>
                    </Link>

                    {/* Passkey Button */}
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-center gap-2 neu-btn py-2 px-3 rounded-xl text-xs text-indigo-300 font-semibold active:scale-[0.98] hover:border-indigo-500/40"
                    >
                      <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Biometric Passkey</span>
                    </Link>

                    <div className="pt-1 flex items-center justify-between text-[10.5px] text-slate-400">
                      <span>Complimentary 2 GB</span>
                      <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5">
                        <span>Sign Up</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleQuickTransferSubmit} className="space-y-2">
                    <p className="text-[10px] text-slate-400">Enter 6-char transfer code (no login required):</p>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 7X9K2P"
                        value={quickCode}
                        onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
                        className="w-full neu-inset rounded-xl px-2 py-2 text-center text-xs font-mono font-bold tracking-[0.2em] text-slate-100 uppercase focus:outline-none focus:border-indigo-500/50"
                      />
                      <button
                        type="submit"
                        disabled={quickCode.length !== 6}
                        className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-[#111317] disabled:to-[#111317] text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0 disabled:text-slate-500 active:scale-95 flex items-center gap-1"
                      >
                        <span>Retrieve</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>

          </aside>

        </div>
      </div>

      {/* =========================================================================
          FULL-SCREEN FOOTER (Clean & Aesthetic)
         ========================================================================= */}
      <footer className="border-t border-[#22252e] py-12 px-5 sm:px-10 text-xs text-slate-400 bg-[#15171c] relative z-20">
        <div className="w-full max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          <p className="text-slate-400">
            &copy; {new Date().getFullYear()} Orbitr. Your files, in orbit. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-slate-400 font-medium">
            <button onClick={() => scrollToSection("architecture")} className="hover:text-slate-200 cursor-pointer">
              Architecture
            </button>
            <button onClick={() => scrollToSection("features")} className="hover:text-slate-200 cursor-pointer">
              Capabilities
            </button>
            <button onClick={() => scrollToSection("vault")} className="hover:text-slate-200 cursor-pointer">
              Private Vault
            </button>
            <Link href="/login" className="hover:text-slate-200">
              Log In
            </Link>
            <Link href="/signup" className="hover:text-slate-200">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
