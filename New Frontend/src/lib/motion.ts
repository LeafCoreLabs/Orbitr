import type { Transition, Variants } from 'framer-motion';

/** Apple signature quintic ease-out */
export const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Critically damped physical spring for morphing pills, modals, and interactive cards */
export const APPLE_SPRING: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
  mass: 0.8,
};

/** Softer spatial spring for larger stage and layout projections */
export const APPLE_SPATIAL_SPRING: Transition = {
  type: 'spring',
  stiffness: 270,
  damping: 30,
  mass: 0.9,
};

/** Standard Apple quintic transition */
export const APPLE_TRANSITION: Transition = {
  duration: 0.65,
  ease: APPLE_EASE,
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.075,
      delayChildren: 0.05,
    },
  },
};

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: APPLE_EASE,
    },
  },
};

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val >= 100 ? val.toFixed(0) : val.toFixed(val >= 10 ? 1 : 2)} ${units[i]}`;
}
