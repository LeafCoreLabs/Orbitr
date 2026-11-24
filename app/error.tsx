"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, ShieldCheck } from "lucide-react";
import { AuroraCanvas } from "@/components/ui/AuroraCanvas";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Orbitr Telemetry Anomaly]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#090c14] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      <AuroraCanvas intensity="calm" />

      <div className="relative z-10 w-full max-w-xl shader-card p-8 sm:p-10 text-center space-y-6">
        <div className="flex justify-center">
          <BrandLogo size="sm" tone="dark" />
        </div>

        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-rose-500/20 animate-ping opacity-40" />
          <div className="absolute inset-3 rounded-full bg-rose-500/10 border border-rose-400/30 backdrop-blur-md flex items-center justify-center">
            <AlertTriangle className="w-9 h-9 text-rose-400" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-400/30 text-rose-300 text-xs font-mono">
            <span>500 // TELEMETRY ANOMALY</span>
          </div>

          <h1 className="glass-hero-gradient-text font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Orbital Signal Interrupted
          </h1>
          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            A temporary telemetry deviation occurred while communicating with the orbital network. Your zero-knowledge files remain secure and encrypted.
          </p>
        </div>

        <div className="p-4 rounded-2xl neu-inset font-mono text-left text-xs space-y-1.5 text-slate-400">
          <div className="flex justify-between">
            <span>ANOMALY DIGEST:</span>
            <span className="text-rose-400 font-semibold truncate max-w-[220px]">
              {error.digest || "SYS_ERR_TRANSIENT"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>SAFEGUARD STATUS:</span>
            <span className="text-emerald-400 font-semibold">ALL_FILES_ENCRYPTED</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 neu-btn-primary font-semibold px-6 py-3 rounded-full shadow-lg transition-all text-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Re-establish Orbital Link</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 neu-btn font-semibold px-6 py-3 rounded-full transition-all text-xs text-sky-100 hover:text-white cursor-pointer"
          >
            <Home className="w-4 h-4 text-sky-400" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="pt-2 border-t border-sky-200/12 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Orbitr Zero-Knowledge Defense Protocol</span>
        </div>
      </div>
    </div>
  );
}
