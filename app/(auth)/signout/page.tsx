"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { LogOut, ArrowRight, ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function SignOutPage() {
  const sessionResult = useSession?.();
  const session = sessionResult?.data;
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      if (typeof window !== "undefined") {
        sessionStorage.clear();
      }
      await signOut({
        redirect: true,
        callbackUrl: "/login",
      });
    } catch (err) {
      console.error("[SignOut Error]", err);
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0e1015]">
      {/* Animated Opening Prompt Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 340 }}
        className="relative w-full max-w-md bg-[#15171c] border border-[#262a34] rounded-2xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden"
      >
        {/* Top subtle glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />

        <div className="flex items-center justify-between pb-4 border-b border-[#22252e]">
          <Logo size="sm" />
          <div className="w-9 h-9 rounded-xl bg-[#1c1f26] border border-[#262a34] flex items-center justify-center shadow-inner text-rose-400">
            <LogOut className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
            <span>Sign Out of Orbitr?</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Are you sure you want to end your current encrypted session? Your zero-knowledge vault keys will be purged from memory and all active drive streams will be securely closed.
          </p>
        </div>

        {/* User Session Pod */}
        {session?.user && (
          <div className="mt-4 p-3 rounded-xl bg-[#111317] border border-[#22252e] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#1f232b] border border-[#2b303c] flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
                {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "O"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">
                  {session.user.name || "Orbitr User"}
                </p>
                <p className="text-[11px] text-slate-500 truncate font-mono">
                  {session.user.email || ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 px-2 py-0.5 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active</span>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-950/20 border border-amber-900/30 text-[11px] text-amber-300/90">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Unsaved uploads or transfers in progress will be aborted.</span>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Link
            href="/drive"
            className="px-4 py-2 rounded-xl neu-btn text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Drive</span>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-semibold shadow-[0_0_16px_rgba(244,63,94,0.35)] flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Signing Out...</span>
              </>
            ) : (
              <>
                <span>Sign Out</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
