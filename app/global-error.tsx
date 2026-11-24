"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#15171c] text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#1c1f26] border border-white/[0.08] shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">System Anomaly Detected</h1>
            <p className="text-xs text-slate-400">
              Orbitr encountered a fatal application runtime error. All encrypted vault assets remain secure.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#111317] text-left font-mono text-[11px] text-slate-400 border border-white/[0.04]">
            <p className="truncate">Digest: {error.digest || "SYS_CRITICAL_HALT"}</p>
          </div>

          <button
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md transition-all text-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Restart Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
