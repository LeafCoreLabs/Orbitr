import React from "react";
import Link from "next/link";
import { Compass, HardDrive, Home, ArrowLeft, Radio, ArrowRight, ShieldCheck } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#15171c] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background ambient glow */}
      <div className="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -top-24 -left-24" />
      <div className="absolute w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none -bottom-24 -right-24" />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-xl shader-card p-8 sm:p-10 text-center space-y-6">
        {/* Orbital Radar Visual */}
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-ping opacity-40" />
          <div className="absolute inset-2 rounded-full border border-dashed border-indigo-400/30 animate-spin [animation-duration:15s]" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-white/[0.08] backdrop-blur-md flex items-center justify-center">
            <Compass className="w-10 h-10 text-indigo-400 animate-pulse" />
          </div>
        </div>

        {/* Orbitr Logo & Sector Badge */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>404 // ORBITAL DEVIATION DETECTED</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Coordinates Lost in Orbit
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            The trajectory or resource coordinates you navigated to do not exist, have expired, or have been safely moved to another orbital sector.
          </p>
        </div>

        {/* Telemetry info card */}
        <div className="p-4 rounded-xl neu-inset font-mono text-left text-xs space-y-1.5 border border-white/[0.04]">
          <div className="flex justify-between text-slate-400">
            <span>SECTOR VECTOR:</span>
            <span className="text-rose-400 font-semibold">DEEP_SPACE_NULL</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>SIGNAL STATUS:</span>
            <span className="text-amber-400 font-semibold">COORDINATE_UNRESOLVED</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>ENCRYPTION SHIELD:</span>
            <span className="text-emerald-400 font-semibold">ENGAGED (ZERO_KNOWLEDGE)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/drive"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 neu-btn-primary font-semibold px-6 py-3 rounded-xl shadow-lg transition-all text-xs cursor-pointer active:scale-[0.98]"
          >
            <HardDrive className="w-4 h-4" />
            <span>Return to Orbitr Drive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 neu-btn font-semibold px-6 py-3 rounded-xl transition-all text-xs text-slate-200 hover:text-white cursor-pointer active:scale-[0.98]"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>Back to Home Base</span>
          </Link>
        </div>

        {/* Footer badge */}
        <div className="pt-2 border-t border-[#22252e] flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Orbitr Zero-Knowledge Personal Cloud Storage</span>
        </div>
      </div>
    </div>
  );
}
