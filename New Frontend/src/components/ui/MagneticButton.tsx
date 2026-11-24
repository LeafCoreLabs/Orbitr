import React, { useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { APPLE_SPRING } from '@/lib/motion';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'glass' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  strength?: number;
  children: React.ReactNode;
}

export function MagneticButton({
  variant = 'primary',
  size = 'md',
  strength = 0.24,
  className = '',
  children,
  onClick,
  disabled,
  type = 'button',
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
      'bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 text-white border border-white/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.75),0_12px_32px_-6px_rgba(99,102,241,0.65)] hover:brightness-110',
    accent:
      'bg-white text-indigo-950 border border-white shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_12px_28px_-6px_rgba(34,211,238,0.45)] hover:bg-cyan-50',
    glass:
      'bg-white/[0.14] text-white backdrop-blur-[18px] border border-white/50 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.7),0_10px_28px_-8px_rgba(8,5,28,0.5)] hover:bg-white/[0.22]',
  }[variant];

  const sizeStyles = {
    sm: 'px-4 py-2 text-[13px] font-semibold gap-1.5',
    md: 'px-5 py-2.5 text-sm font-semibold gap-2',
    lg: 'px-7 py-3.5 text-[15px] font-semibold gap-2.5',
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
