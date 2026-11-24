"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

interface AuroraCanvasProps {
  intensity?: "normal" | "calm";
}

export function AuroraCanvas({ intensity = "normal" }: AuroraCanvasProps) {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const meshY = useTransform(scrollYProgress, [0, 1], ["0%", prefersReducedMotion ? "0%" : "-5%"]);
  const meshScale = useTransform(scrollYProgress, [0, 1], [1.03, prefersReducedMotion ? 1.03 : 1.08]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#090c14]"
    >
      <motion.div
        style={{ y: meshY, scale: meshScale }}
        className="absolute -inset-6 will-change-transform"
      >
        <img
          src="/bg/subtle-cloud-bg.png"
          alt=""
          className={`h-full w-full object-cover object-center select-none ${
            intensity === "calm" ? "opacity-85" : "opacity-100 brightness-110"
          }`}
        />
      </motion.div>

      <div
        className="absolute inset-0"
        style={{
          background:
            intensity === "calm"
              ? "radial-gradient(circle at 50% 50%, rgba(9, 12, 20, 0.1) 0%, rgba(9, 12, 20, 0.4) 100%)"
              : "linear-gradient(95deg, rgba(9, 12, 20, 0.48) 0%, rgba(9, 12, 20, 0.14) 38%, transparent 65%)",
        }}
      />
    </div>
  );
}
