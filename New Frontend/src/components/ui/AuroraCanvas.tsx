import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

interface AuroraCanvasProps {
  intensity?: 'normal' | 'calm';
}

/**
 * Vibrant Purple-Indigo-Sapphire-Cyan 3D Cloud Mesh & Tech Topology Backdrop:
 * Combines the high-contrast 3D glowing purple/blue cloud sculpture with crisp architectural
 * grid lines and floating luminous orbs so every Liquid Glass card visibly blurs and refracts
 * sharp neon-cyan and violet geometry underneath it.
 */
export function AuroraCanvas({ intensity = 'normal' }: AuroraCanvasProps) {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const meshY = useTransform(scrollYProgress, [0, 1], ['0%', prefersReducedMotion ? '0%' : '-6%']);
  const meshScale = useTransform(scrollYProgress, [0, 1], [1.05, prefersReducedMotion ? 1.05 : 1.13]);
  const orbY1 = useTransform(scrollYProgress, [0, 1], ['0%', prefersReducedMotion ? '0%' : '26%']);
  const orbY2 = useTransform(scrollYProgress, [0, 1], ['0%', prefersReducedMotion ? '0%' : '-24%']);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#140F38]"
    >
      {/* Layer 1: Vibrant 3D Purple-Blue Sculptural Cloud & Silk Light Waves */}
      <motion.div
        style={{ y: meshY, scale: meshScale }}
        className="absolute -inset-6 will-change-transform"
      >
        <img
          src="/bg/purple-blue-cloud-mesh.png"
          alt=""
          className="h-full w-full object-cover object-center select-none"
        />
      </motion.div>

      {/* Layer 2: Subtle Left-Column Contrast Veil (keeps right 60% cloud ribbons super vivid for glass refraction!) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            intensity === 'calm'
              ? 'linear-gradient(105deg, rgba(14, 10, 44, 0.56) 0%, rgba(24, 18, 68, 0.30) 50%, rgba(14, 18, 56, 0.24) 100%)'
              : 'linear-gradient(100deg, rgba(14, 10, 44, 0.54) 0%, rgba(24, 18, 68, 0.20) 48%, rgba(10, 22, 58, 0.12) 100%)',
        }}
      />

      {/* Layer 3: Floating High-Contrast Cyan & Electric Violet Light Spheres behind Cards */}
      <motion.div
        style={{ y: orbY1 }}
        animate={
          prefersReducedMotion
            ? undefined
            : {
                x: [0, 28, -16, 0],
                scale: [1, 1.1, 1],
              }
        }
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[14%] right-[18%] h-72 w-72 rounded-full bg-cyan-400/35 blur-[80px]"
      />

      <motion.div
        style={{ y: orbY2 }}
        animate={
          prefersReducedMotion
            ? undefined
            : {
                x: [0, -24, 18, 0],
                scale: [1, 1.12, 1],
              }
        }
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[10%] right-[8%] h-80 w-80 rounded-full bg-purple-500/40 blur-[90px]"
      />

      {/* Layer 4: Crisp Cloud-Storage Architectural Coordinate Grid (makes card blur boundary unmistakably visible!) */}
      <div
        className="absolute inset-0 opacity-[0.11]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(186, 230, 253, 0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(196, 181, 253, 0.45) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 90% 85% at 62% 50%, #000 35%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 90% 85% at 62% 50%, #000 35%, transparent 100%)',
        }}
      />
    </div>
  );
}
