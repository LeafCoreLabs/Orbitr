import React from "react";
import Link from "next/link";
import { Compass, HardDrive, Home, Radio, ArrowRight, ShieldCheck } from "lucide-react";
import { AuroraCanvas } from "@/components/ui/AuroraCanvas";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#090c14] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      <AuroraCanvas intensity="calm" />

      <div className="relative z-10 w-full max-w-xl shader-card p-8 sm:p-10 text-center space-y-6">
        <div className="flex justify-center">
          <BrandLogo size="sm" tone="dark" />
        </div>

        {/* Orbital Radar Visual */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-sky-400/25 animate-ping opacity-40" />
          <div className="absolute inset-2 rounded-full border border-dashed border-sky-300/35 animate-spin [animation-duration:15s]" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-200/20 backdrop-blur-md flex items-center justify-center">
            <Compass className="w-9 h-9 text-sky-300 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/60 border border-sky-400/30 text-sky-200 text-xs font-mono">
            <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>404 // ORBITAL DEVIATION DETECTED</span>
          </div>

          <h1 className="glass-hero-gradient-text font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Coordinates Lost in Orbit
          </h1>
          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            The trajectory or resource coordinates you navigated to do not exist, have expired, or have been safely moved to another orbital sector.
          </p>
        </div>

        <div className="p-4 rounded-2xl neu-inset font-mono text-left text-xs space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>SECTOR VECTOR:</span>
            <span className="text-rose-400 font-semibold">DEEP_SPACE_NULL</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>SIGNAL STATUS:</span>
            <span className="text-amber-300 font-semibold">COORDINATE_UNRESOLVED</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>ENCRYPTION SHIELD:</span>
            <span className="text-emerald-400 font-semibold">ENGAGED (ZERO_KNOWLEDGE)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/drive"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 neu-btn-primary font-semibold px-6 py-3 rounded-full shadow-lg transition-all text-xs cursor-pointer"
          >
            <HardDrive className="w-4 h-4" />
            <span>Return to Orbitr Drive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 neu-btn font-semibold px-6 py-3 rounded-full transition-all text-xs text-sky-100 hover:text-white cursor-pointer"
          >
            <Home className="w-4 h-4 text-sky-400" />
            <span>Back to Home Base</span>
          </Link>
        </div>

        <div className="pt-2 border-t border-sky-200/12 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Orbitr Zero-Knowledge Personal Cloud Storage</span>
        </div>
      </div>
    </div>
  );
}
