import React, { useCallback } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  type HTMLMotionProps,
} from 'framer-motion';
import { APPLE_SPRING } from '@/lib/motion';

export interface LiquidGlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  interactive?: boolean;
  iridescent?: boolean;
  strong?: boolean;
  allowOverflow?: boolean;
  glintRadius?: number;
  noPadding?: boolean;
}

/**
 * High-Visibility Tech Liquid Glass Surface:
 * - Translucent diagonal frosted glass body (backdrop-blur-2xl + 195% color saturation boost so purple/cyan ribbons glow vividly through the card)
 * - Angled physical glass reflection band across the slab
 * - 9px curved perimeter lens bevel + 1.25px specular rim + subtle chromatic bottom dispersion
 * - Cursor-tracked radial cyan-violet-white specular spotlight
 */
export const LiquidGlassCard = React.forwardRef<HTMLDivElement, LiquidGlassCardProps>(
  (
    {
      children,
      className = '',
      interactive = false,
      iridescent = false,
      strong = false,
      allowOverflow = false,
      glintRadius = 440,
      onMouseMove,
      ...rest
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const mouseX = useMotionValue(-1000);
    const mouseY = useMotionValue(-1000);

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!prefersReducedMotion) {
          const rect = e.currentTarget.getBoundingClientRect();
          mouseX.set(e.clientX - rect.left);
          mouseY.set(e.clientY - rect.top);
        }
        onMouseMove?.(e);
      },
      [mouseX, mouseY, onMouseMove, prefersReducedMotion]
    );

    const surfaceSheen = useMotionTemplate`radial-gradient(${glintRadius}px circle at ${mouseX}px ${mouseY}px, rgba(255, 255, 255, 0.22), rgba(56, 189, 248, 0.12) 38%, rgba(168, 85, 247, 0.08) 58%, transparent 76%)`;
    const rimSheen = useMotionTemplate`radial-gradient(${Math.round(
      glintRadius * 0.65
    )}px circle at ${mouseX}px ${mouseY}px, rgba(255, 255, 255, 1), rgba(34, 211, 238, 0.8) 45%, transparent 78%)`;

    const baseSurface = strong
      ? 'bg-[linear-gradient(135deg,rgba(255,255,255,0.20)_0%,rgba(165,180,252,0.09)_42%,rgba(34,211,238,0.07)_72%,rgba(255,255,255,0.15)_100%)] backdrop-blur-[22px] backdrop-saturate-[195%] backdrop-brightness-[1.06] shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.78),inset_1px_0_1.5px_rgba(255,255,255,0.32),inset_0_-2px_6px_rgba(56,189,248,0.26),0_28px_64px_-14px_rgba(8,5,28,0.65)]'
      : 'bg-[linear-gradient(135deg,rgba(255,255,255,0.16)_0%,rgba(165,180,252,0.07)_44%,rgba(34,211,238,0.05)_74%,rgba(255,255,255,0.12)_100%)] backdrop-blur-[18px] backdrop-saturate-[185%] backdrop-brightness-[1.05] shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.68),inset_1px_0_1px_rgba(255,255,255,0.26),inset_0_-2px_5px_rgba(139,92,246,0.24),0_22px_50px_-14px_rgba(8,5,28,0.55)]';

    return (
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        whileHover={
          interactive && !prefersReducedMotion
            ? {
                y: -3,
                transition: APPLE_SPRING,
              }
            : undefined
        }
        className={`group/glass liquid-glass-rim relative ${
          allowOverflow ? 'overflow-visible' : 'overflow-hidden'
        } rounded-[38px] ${baseSurface} ${iridescent ? 'iridescent-ring' : ''} ${className}`}
        {...rest}
      >
        {/* Angled Glossy Window Reflection Slash (makes glass plane unmistakably visible even at rest) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background:
              'linear-gradient(115deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.03) 28%, transparent 45%, transparent 74%, rgba(34,211,238,0.08) 100%)',
          }}
        />

        {/* Curved 9px Perimeter Lens Bevel */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] p-[9px] backdrop-blur-[28px] backdrop-brightness-115"
          style={{
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        {/* Top Specular Meniscus Hairline */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/95 to-transparent"
        />

        {/* Bottom Prismatic Cyan-Violet-White Dispersion Rim */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 bottom-[1.5px] h-[2.5px] rounded-full opacity-85 blur-[0.5px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 5%, rgba(192, 132, 252, 0.65) 26%, rgba(255, 255, 255, 0.9) 50%, rgba(34, 211, 238, 0.7) 74%, transparent 95%)',
          }}
        />

        {/* Mouse-Tracked Radial Lens Sheen */}
        {!prefersReducedMotion && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/glass:opacity-100"
            style={{ background: surfaceSheen }}
          />
        )}

        {/* Mouse-Tracked Specular Rim Glint */}
        {!prefersReducedMotion && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] p-[1.25px] opacity-0 transition-opacity duration-300 group-hover/glass:opacity-100"
            style={{
              background: rimSheen,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />
        )}

        <div className="relative z-10 h-full">{children}</div>
      </motion.div>
    );
  }
);

LiquidGlassCard.displayName = 'LiquidGlassCard';
