"use client";

import React, { useCallback } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";
import { APPLE_SPRING } from "@/lib/motion";

export interface LiquidGlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  interactive?: boolean;
  iridescent?: boolean;
  strong?: boolean;
  allowOverflow?: boolean;
  glintRadius?: number;
}

/**
 * Smoked Frosted Liquid Glass Surface:
 * Balances translucent frosted blur (24px-28px) with a smoked obsidian-slate tint
 * so background cloud patterns visibly blur through while keeping text 100% crisp.
 */
export const LiquidGlassCard = React.forwardRef<HTMLDivElement, LiquidGlassCardProps>(
  (
    {
      children,
      className = "",
      interactive = false,
      iridescent = false,
      strong = false,
      allowOverflow = false,
      glintRadius = 420,
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

    const surfaceSheen = useMotionTemplate`radial-gradient(${glintRadius}px circle at ${mouseX}px ${mouseY}px, rgba(255, 255, 255, 0.14), rgba(148, 163, 184, 0.06) 45%, transparent 78%)`;
    const rimSheen = useMotionTemplate`radial-gradient(${Math.round(
      glintRadius * 0.65
    )}px circle at ${mouseX}px ${mouseY}px, rgba(255, 255, 255, 0.9), rgba(203, 213, 225, 0.45) 48%, transparent 78%)`;

    const baseSurface = strong
      ? "text-white bg-[linear-gradient(145deg,rgba(15,20,34,0.72)_0%,rgba(22,29,48,0.58)_100%)] backdrop-blur-[28px] backdrop-saturate-[150%] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.42),inset_1px_0_1px_rgba(255,255,255,0.18),0_26px_58px_-14px_rgba(4,6,12,0.68)]"
      : "text-white bg-[linear-gradient(145deg,rgba(15,20,34,0.62)_0%,rgba(22,29,48,0.48)_100%)] backdrop-blur-[24px] backdrop-saturate-[145%] shadow-[inset_0_1px_1px_rgba(255,255,255,0.34),inset_1px_0_1px_rgba(255,255,255,0.14),0_20px_46px_-14px_rgba(4,6,12,0.58)]";

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
          allowOverflow ? "overflow-visible" : "overflow-hidden"
        } rounded-[32px] ${baseSurface} ${iridescent ? "iridescent-ring" : ""} ${className}`}
        {...rest}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background:
              "linear-gradient(120deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 32%, transparent 55%, rgba(255,255,255,0.03) 100%)",
          }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/65 to-transparent"
        />

        {!prefersReducedMotion && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/glass:opacity-100"
            style={{ background: surfaceSheen }}
          />
        )}

        {!prefersReducedMotion && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] p-px opacity-0 transition-opacity duration-300 group-hover/glass:opacity-100"
            style={{
              background: rimSheen,
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
        )}

        <div className="relative z-10 h-full">{children}</div>
      </motion.div>
    );
  }
);

LiquidGlassCard.displayName = "LiquidGlassCard";
