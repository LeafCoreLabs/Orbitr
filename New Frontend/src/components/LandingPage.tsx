import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { FloatingNavbar } from '@/components/FloatingNavbar';
import { SplitParallaxShowcase } from '@/components/SplitParallaxShowcase';
import { BentoFooter } from '@/components/BentoFooter';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { useCloudStore } from '@/context/CloudStore';
import { APPLE_EASE } from '@/lib/motion';

export function LandingPage() {
  const { setStage } = useCloudStore();

  return (
    <div className="relative min-h-screen">
      <FloatingNavbar />

      <main>
        <SplitParallaxShowcase />

        {/* Pre-Footer Call-to-Action Sanctuary Stage */}
        <section className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: APPLE_EASE }}
          >
            <LiquidGlassCard
              iridescent
              strong
              className="relative overflow-hidden px-6 py-14 text-center sm:px-14 sm:py-18"
            >
              <div className="relative z-10 mx-auto max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/22 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                  Testing Phase Open • 2 GB Free per Account
                </span>
                <h2 className="hero-gradient-text mt-5 font-display text-3xl font-extrabold tracking-[-0.035em] sm:text-5xl">
                  Your personal zero-knowledge cloud, everywhere you work.
                </h2>
                <p className="optical-text-shadow mt-4 text-[15.5px] leading-relaxed font-medium text-white/90 sm:text-base">
                  Start with 2 GB free during our testing phase on Windows, Android, macOS, iOS,
                  Linux, or any web browser. Larger storage tiers and pricing will be updated soon.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                  <MagneticButton variant="primary" size="lg" onClick={() => setStage('signup')}>
                    <span>Create Your Aether Cloud+ Account</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.2]" />
                  </MagneticButton>
                  <MagneticButton variant="glass" size="lg" onClick={() => setStage('login')}>
                    <span>Sign In to Account</span>
                  </MagneticButton>
                </div>
              </div>
            </LiquidGlassCard>
          </motion.div>
        </section>
      </main>

      <BentoFooter />
    </div>
  );
}
