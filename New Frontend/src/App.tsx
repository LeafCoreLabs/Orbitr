import { useEffect } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { CloudStoreProvider, useCloudStore } from '@/context/CloudStore';
import { AuroraCanvas } from '@/components/ui/AuroraCanvas';
import { LandingPage } from '@/components/LandingPage';
import { AuthView } from '@/components/AuthView';
import { SpotlightSearch } from '@/components/SpotlightSearch';
import { APPLE_EASE, APPLE_SPRING } from '@/lib/motion';

function StageViewport() {
  const { stage, toasts } = useCloudStore();

  useEffect(() => {
    const titles: Record<typeof stage, string> = {
      landing: 'Aether Cloud+ — Universal Zero-Knowledge Cloud Storage (2 GB Free Testing Phase)',
      login: 'Sign In — Aether Cloud+',
      signup: 'Create Account (2 GB Free) — Aether Cloud+',
    };
    document.title = titles[stage];
  }, [stage]);

  const viewGroupKey = stage === 'login' || stage === 'signup' ? 'auth-stage' : 'landing-stage';

  return (
    <>
      <AuroraCanvas intensity="normal" />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={viewGroupKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.36, ease: APPLE_EASE }}
        >
          {stage === 'landing' ? <LandingPage /> : <AuthView mode={stage} />}
        </motion.div>
      </AnimatePresence>

      <SpotlightSearch />

      {/* Subtle Liquid Glass Toast Layer (Top-Right) */}
      <div className="pointer-events-none fixed top-16 right-4 z-[95] flex flex-col gap-2 sm:top-5">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={APPLE_SPRING}
              className="liquid-glass-rim pointer-events-auto flex max-w-xs items-start gap-2.5 rounded-3xl bg-indigo-950/70 px-4 py-3 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.8),0_22px_48px_-12px_rgba(8,5,28,0.72)] backdrop-blur-2xl"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 stroke-[2.2] text-cyan-300" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">{toast.title}</p>
                {toast.subtitle && (
                  <p className="mt-0.5 text-[11px] leading-snug text-white/85">{toast.subtitle}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <CloudStoreProvider>
        <StageViewport />
      </CloudStoreProvider>
    </MotionConfig>
  );
}
