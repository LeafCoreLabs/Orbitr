"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { ArrowUpRight, HardDrive, Menu, Search, X } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { APPLE_SPRING } from "@/lib/motion";

const NAV_LINKS = [
  { label: "Platform", href: "#showcase-stage" },
  { label: "Zero-Knowledge", href: "#bento-security" },
  { label: "Capabilities", href: "#bento-features" },
  { label: "Quota & Plans", href: "#pricing-bento" },
];

interface FloatingNavbarProps {
  onOpenSpotlight: () => void;
}

export function FloatingNavbar({ onOpenSpotlight }: FloatingNavbarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const shouldCompact = latest > 36;
    if (shouldCompact !== isCompact) {
      setIsCompact(shouldCompact);
    }
  });

  const smoothScrollY = useSpring(scrollY, {
    stiffness: 175,
    damping: 28,
    mass: 0.52,
    restDelta: 0.001,
  });

  const scrollVelocity = useVelocity(scrollY);
  const rawVelocityY = useTransform(scrollVelocity, [-1600, 0, 1600], [-2.5, 0, 2.5]);
  const velocityBuoyancyY = useSpring(rawVelocityY, {
    stiffness: 260,
    damping: 30,
    mass: 0.4,
  });

  const maxWidth = useTransform(smoothScrollY, [0, 220], [1220, 980]);
  const navTranslateY = useTransform(smoothScrollY, [0, 220], [18, 10]);
  const combinedY = useTransform(
    [navTranslateY, velocityBuoyancyY],
    ([baseY, velY]) => (baseY as number) + (velY as number)
  );
  const navScale = useTransform(smoothScrollY, [0, 220], [1, 0.988]);
  const horizontalPad = useTransform(smoothScrollY, [0, 220], [26, 18]);
  const verticalPad = useTransform(smoothScrollY, [0, 220], [13, 8.5]);
  const bgAlpha = useTransform(smoothScrollY, [0, 220], [0.58, 0.78]);
  const borderAlpha = useTransform(smoothScrollY, [0, 220], [0.24, 0.42]);
  const shadowAlpha = useTransform(smoothScrollY, [0, 220], [0.45, 0.68]);
  const specularOpacity = useTransform(smoothScrollY, [0, 220], [0.6, 0.9]);

  const backgroundColor = useTransform(bgAlpha, (v) => `rgba(14, 18, 30, ${v})`);
  const borderColor = useTransform(borderAlpha, (v) => `rgba(255, 255, 255, ${v})`);
  const boxShadow = useTransform(
    shadowAlpha,
    (s) =>
      `inset 0 1px 1.5px rgba(255, 255, 255, 0.32), 0 20px 48px -12px rgba(4, 6, 12, ${s})`
  );

  const scrollToAnchor = (href: string) => {
    setMobileMenuOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 sm:px-6">
      <motion.nav
        aria-label="Primary Navigation"
        style={
          prefersReducedMotion
            ? undefined
            : {
                maxWidth,
                y: combinedY,
                scale: navScale,
                paddingLeft: horizontalPad,
                paddingRight: horizontalPad,
                paddingTop: verticalPad,
                paddingBottom: verticalPad,
                backgroundColor,
                borderColor,
                boxShadow,
              }
        }
        className={`pointer-events-auto relative flex w-full items-center justify-between gap-4 rounded-full border whitespace-nowrap backdrop-blur-[22px] backdrop-saturate-[190%] will-change-transform ${
          prefersReducedMotion
            ? "mt-3 max-w-6xl border-white/60 bg-white/18 px-5 py-2.5 shadow-2xl"
            : ""
        }`}
      >
        <motion.div
          aria-hidden="true"
          style={prefersReducedMotion ? undefined : { opacity: specularOpacity }}
          className="pointer-events-none absolute inset-x-10 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/95 to-transparent"
        />

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="shrink-0 rounded-full whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
        >
          <BrandLogo size="sm" tone="dark" />
        </button>

        {/* Center Single-Line Links */}
        <div
          onMouseLeave={() => setHoveredHref(null)}
          className="hidden shrink-0 items-center gap-0.5 whitespace-nowrap lg:flex"
        >
          {NAV_LINKS.map((link) => {
            const isHovered = hoveredHref === link.href;
            return (
              <button
                key={link.href}
                type="button"
                onMouseEnter={() => setHoveredHref(link.href)}
                onClick={() => scrollToAnchor(link.href)}
                className="relative shrink-0 rounded-full px-3.5 py-1.5 text-[13.5px] font-medium whitespace-nowrap text-white/85 transition-colors hover:text-white"
              >
                {isHovered && (
                  <motion.span
                    layoutId="floatingNavHoverCapsule"
                    transition={APPLE_SPRING}
                    className="absolute inset-0 rounded-full border border-white/35 bg-white/14"
                  />
                )}
                <span className="relative z-10 whitespace-nowrap">{link.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Single-Line Actions */}
        <div className="hidden shrink-0 items-center gap-2 whitespace-nowrap lg:flex">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={onOpenSpotlight}
            title="Open Command Search (Ctrl+K / ⌘K)"
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              isCompact
                ? "border-white/40 bg-white/15 text-white hover:bg-white/25"
                : "border-white/30 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Search className="h-3.5 w-3.5 shrink-0 stroke-[1.8] text-slate-300" />
            <span className="font-mono text-[11px] whitespace-nowrap">Ctrl K</span>
          </motion.button>

          {session ? (
            <MagneticButton variant="primary" size="sm" onClick={() => router.push("/drive")}>
              <HardDrive className="h-3.5 w-3.5 shrink-0 stroke-[2]" />
              <span className="whitespace-nowrap">Open Drive</span>
            </MagneticButton>
          ) : (
            <>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="shrink-0 rounded-full px-3 py-1.5 text-[13.5px] font-semibold whitespace-nowrap text-white/90 transition-colors hover:text-white"
              >
                Sign In
              </button>

              <MagneticButton variant="primary" size="sm" onClick={() => router.push("/signup")}>
                <span className="whitespace-nowrap">Claim 2 GB Free</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 stroke-[2]" />
              </MagneticButton>
            </>
          )}
        </div>

        {/* Tablet & Mobile Controls */}
        <div className="flex shrink-0 items-center gap-2 whitespace-nowrap lg:hidden">
          <button
            type="button"
            onClick={onOpenSpotlight}
            aria-label="Command search"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/14 text-white"
          >
            <Search className="h-4 w-4 stroke-[1.75]" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/35 bg-white/18 text-white shadow-xs"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Dropdown Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={APPLE_SPRING}
            className="pointer-events-auto fixed inset-x-4 top-20 z-50 rounded-3xl border border-sky-200/20 bg-[#08132B]/92 p-4 shadow-2xl backdrop-blur-3xl lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => scrollToAnchor(link.href)}
                  className="rounded-2xl px-4 py-2.5 text-left text-sm font-medium text-slate-200 hover:bg-sky-400/12 hover:text-white"
                >
                  {link.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2 border-t border-sky-200/12 pt-3">
              {session ? (
                <MagneticButton
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/drive");
                  }}
                >
                  <span>Open Orbitr Drive</span>
                  <ArrowUpRight className="h-4 w-4" />
                </MagneticButton>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      router.push("/login");
                    }}
                    className="rounded-full border border-sky-200/20 bg-sky-950/55 py-2.5 text-sm font-semibold text-white"
                  >
                    Sign In
                  </button>
                  <MagneticButton
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      router.push("/signup");
                    }}
                  >
                    <span>Claim 2 GB Free</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </MagneticButton>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
