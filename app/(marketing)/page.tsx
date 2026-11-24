"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AuroraCanvas } from "@/components/ui/AuroraCanvas";
import { FloatingNavbar } from "@/components/marketing/FloatingNavbar";
import { SplitParallaxShowcase } from "@/components/marketing/SplitParallaxShowcase";
import { BentoFooter } from "@/components/marketing/BentoFooter";
import { SpotlightSearch } from "@/components/marketing/SpotlightSearch";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { APPLE_EASE } from "@/lib/motion";

export default function MarketingLandingPage() {
  const router = useRouter();
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      <AuroraCanvas intensity="normal" />
      <FloatingNavbar onOpenSpotlight={() => setSpotlightOpen(true)} />

      <main className="relative z-10">
        <SplitParallaxShowcase onOpenSpotlight={() => setSpotlightOpen(true)} />

        {/* Pre-Footer Call-to-Action Sanctuary Stage */}
        <section className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: APPLE_EASE }}
          >
            <LiquidGlassCard
              iridescent
              strong
              className="relative overflow-hidden px-6 py-14 text-center sm:px-14 sm:py-18"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-500/30 via-blue-600/25 to-indigo-500/30 blur-3xl"
              />

              <div className="relative z-10 mx-auto max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/45 bg-white/18 px-3.5 py-1 text-xs font-semibold text-white">
                  Testing Phase Open • 2 GB Free per Account
                </span>
                <h2 className="glass-hero-gradient-text mt-5 font-display text-3xl font-extrabold tracking-[-0.035em] sm:text-5xl">
                  Your personal zero-knowledge cloud, everywhere you work.
                </h2>
                <p className="mt-4 text-[15.5px] leading-relaxed text-white/88 sm:text-base">
                  Start with 2 GB free during our testing phase on Windows, Android, macOS, iOS,
                  Linux, or any web browser. Larger storage tiers and pricing will be updated soon.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                  <MagneticButton variant="primary" size="lg" onClick={() => router.push("/signup")}>
                    <span>Create Your Orbitr Account</span>
                    <ArrowRight className="h-4 w-4 stroke-[2]" />
                  </MagneticButton>
                  <MagneticButton variant="glass" size="lg" onClick={() => router.push("/login")}>
                    <span>Sign In to Account</span>
                  </MagneticButton>
                </div>
              </div>
            </LiquidGlassCard>
          </motion.div>
        </section>
      </main>

      <div className="relative z-10">
        <BentoFooter onOpenSpotlight={() => setSpotlightOpen(true)} />
      </div>
      <SpotlightSearch open={spotlightOpen} onOpenChange={setSpotlightOpen} />
    </div>
  );
}
