"use client";

import React, { useRef, useState } from "react";
import { motion, useSpring, useMotionValue, type HTMLMotionProps } from "framer-motion";

interface MotionCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  enableGlare?: boolean;
  tiltMaxAngle?: number;
}

/**
 * 3D Neumorphic Tilt Card powered by Framer Motion springs.
 * Creates physical depth, realistic specular shine tracking the cursor,
 * and seamless spring recovery on release.
 */
export function MotionCard({
  children,
  className = "",
  enableGlare = true,
  tiltMaxAngle = 8,
  ...props
}: MotionCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Springs for silky 60fps micro-physics
  const rotateX = useSpring(useMotionValue(0), { stiffness: 350, damping: 28 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 350, damping: 28 });
  const glareX = useSpring(useMotionValue(50), { stiffness: 300, damping: 25 });
  const glareY = useSpring(useMotionValue(50), { stiffness: 300, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const xPct = (clientX / rect.width - 0.5) * 2;
    const yPct = (clientY / rect.height - 0.5) * 2;

    rotateX.set(-yPct * tiltMaxAngle);
    rotateY.set(xPct * tiltMaxAngle);

    glareX.set((clientX / rect.width) * 100);
    glareY.set((clientY / rect.height) * 100);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative transform-gpu transition-shadow duration-300 ${className}`}
      {...props}
    >
      {/* Specular Glare Overlay */}
      {enableGlare && isHovered && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-30 rounded-[inherit] overflow-hidden opacity-40 mix-blend-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          style={{
            background: `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 65%)`,
          }}
        />
      )}

      {children}
    </motion.div>
  );
}
