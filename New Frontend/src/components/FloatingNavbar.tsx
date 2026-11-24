import { useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion';
import { ArrowUpRight, Menu, Search, X } from 'lucide-react';
import { useCloudStore } from '@/context/CloudStore';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { APPLE_SPRING } from '@/lib/motion';

const NAV_LINKS = [
  { label: 'Platform', href: '#showcase-stage' },
  { label: 'Capabilities', href: '#bento-features' },
  { label: 'Zero-Knowledge', href: '#bento-security' },
  { label: 'Quota & Plans', href: '#pricing-bento' },
];

export function FloatingNavbar() {
  const { setStage, setSpotlightOpen } = useCloudStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
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
  const bgAlpha = useTransform(smoothScrollY, [0, 220], [0.14, 0.24]);
  const borderAlpha = useTransform(smoothScrollY, [0, 220], [0.46, 0.72]);
  const shadowAlpha = useTransform(smoothScrollY, [0, 220], [0.35, 0.65]);
  const specularOpacity = useTransform(smoothScrollY, [0, 220], [0.7, 1]);

  const backgroundColor = useTransform(bgAlpha, (v) => `rgba(255, 255, 255, ${v})`);
  const borderColor = useTransform(borderAlpha, (v) => `rgba(255, 255, 255, ${v})`);
  const boxShadow = useTransform(
    shadowAlpha,
    (s) =>
      `inset 0 1.5px 2px rgba(255, 255, 255, 0.8), inset 0 -1.5px 4px rgba(56, 189, 248, 0.25), 0 22px 52px -12px rgba(8, 5, 28, ${s})`
  );

  const scrollToAnchor = (href: string) => {
    setMobileMenuOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            ? 'mt-3 max-w-6xl border-white/60 bg-white/18 px-5 py-2.5 shadow-2xl'
            : ''
        }`}
      >
        <motion.div
          aria-hidden="true"
          style={prefersReducedMotion ? undefined : { opacity: specularOpacity }}
          className="pointer-events-none absolute inset-x-10 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/95 to-transparent"
        />

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="shrink-0 rounded-full whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
        >
          <BrandLogo size="sm" />
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
                className="optical-text-shadow relative shrink-0 rounded-full px-3.5 py-1.5 text-[13.5px] font-semibold whitespace-nowrap text-white/95 transition-colors hover:text-white"
              >
                {isHovered && (
                  <motion.span
                    layoutId="floatingNavHoverCapsule"
                    transition={APPLE_SPRING}
                    className="absolute inset-0 rounded-full border border-white/55 bg-white/20 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.75)]"
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
            onClick={() => setSpotlightOpen(true)}
            title="Open Command Search (Ctrl+K / ⌘K)"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/45 bg-white/14 px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition-colors hover:bg-white/24"
          >
            <Search className="h-3.5 w-3.5 shrink-0 stroke-[1.9] text-cyan-200" />
            <span className="font-mono text-[11px] whitespace-nowrap">Ctrl K</span>
          </motion.button>

          <button
            type="button"
            onClick={() => setStage('login')}
            className="optical-text-shadow shrink-0 rounded-full px-3 py-1.5 text-[13.5px] font-semibold whitespace-nowrap text-white transition-colors hover:text-cyan-200"
          >
            Sign In
          </button>

          <MagneticButton variant="primary" size="sm" onClick={() => setStage('signup')}>
            <span className="whitespace-nowrap">Claim 2 GB Free</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 stroke-[2.2]" />
          </MagneticButton>
        </div>

        {/* Tablet & Mobile Controls */}
        <div className="flex shrink-0 items-center gap-2 whitespace-nowrap lg:hidden">
          <button
            type="button"
            onClick={() => setSpotlightOpen(true)}
            aria-label="Command search"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/18 text-white"
          >
            <Search className="h-4 w-4 stroke-[1.8]" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/55 bg-white/22 text-white shadow-xs"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4 stroke-[1.8]" />
            ) : (
              <Menu className="h-4 w-4 stroke-[1.8]" />
            )}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={APPLE_SPRING}
            className="liquid-glass-rim pointer-events-auto fixed inset-x-4 top-20 z-50 mx-auto max-w-md overflow-hidden rounded-[36px] bg-indigo-950/65 p-5 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.75),0_28px_60px_-15px_rgba(8,5,28,0.75)] backdrop-blur-2xl backdrop-saturate-190 lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => scrollToAnchor(link.href)}
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-left text-[15px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-white/15"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-cyan-300" />
                </button>
              ))}
            </div>

            <div className="my-3 h-px bg-white/25" />

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setStage('login');
                }}
                className="rounded-full border border-white/50 bg-white/15 py-2.5 text-sm font-semibold whitespace-nowrap text-white"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setStage('signup');
                }}
                className="rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 py-2.5 text-sm font-semibold whitespace-nowrap text-white"
              >
                Get 2 GB Free
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
