"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { APPLE_SPRING } from "@/lib/motion";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "glass" | "accent";
  size?: "sm" | "md" | "lg";
  strength?: number;
  children: React.ReactNode;
}

export function MagneticButton({
  variant = "primary",
  size = "md",
  strength = 0.24,
  className = "",
  children,
  onClick,
  disabled,
  type = "button",
  ...rest
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 380, damping: 28, mass: 0.6 });
  const y = useSpring(rawY, { stiffness: 380, damping: 28, mass: 0.6 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (prefersReducedMotion || disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    rawX.set((e.clientX - centerX) * strength);
    rawY.set((e.clientY - centerY) * strength);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  const variantStyles = {
    primary:
      "bg-gradient-to-b from-white to-slate-200 text-slate-950 border border-white shadow-[inset_0_1px_1.5px_rgba(255,255,255,1),0_10px_26px_-6px_rgba(4,6,12,0.5)] hover:bg-white",
    accent:
      "bg-slate-600/80 text-white border border-white/35 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_10px_24px_-6px_rgba(4,6,12,0.45)] hover:bg-slate-500/85",
    glass:
      "bg-white/[0.08] text-white backdrop-blur-[16px] border border-white/28 shadow-[inset_0_1px_1px_rgba(255,255,255,0.32),0_10px_24px_-8px_rgba(4,6,12,0.45)] hover:bg-white/[0.16]",
  }[variant];

  const sizeStyles = {
    sm: "px-4 py-2 text-[13px] font-semibold gap-1.5",
    md: "px-5 py-2.5 text-sm font-semibold gap-2",
    lg: "px-7 py-3.5 text-[15px] font-semibold gap-2.5",
  }[size];

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={APPLE_SPRING}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full tracking-[-0.01em] whitespace-nowrap transition-all select-none disabled:opacity-50 ${variantStyles} ${sizeStyles} ${className}`}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </motion.button>
  );
}
