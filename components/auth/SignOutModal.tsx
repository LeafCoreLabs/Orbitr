"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, X, ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignOutModal({ isOpen, onClose }: SignOutModalProps) {
  const sessionResult = useSession?.();
  const session = sessionResult?.data;
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);

      // Clean local zero-knowledge temporary caches from memory
      if (typeof window !== "undefined") {
        sessionStorage.clear();
      }

      // Execute NextAuth client signout with clean redirect to /login
      await signOut({
        redirect: true,
        callbackUrl: "/login",
      });
    } catch (err) {
      console.error("[SignOut Error]", err);
      // Fallback direct navigation if network interrupted
      window.location.href = "/login";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with soft blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={!isSigningOut ? onClose : undefined}
            className="absolute inset-0 bg-black/65 backdrop-blur-md"
          />

          {/* Animated Opening Prompt Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: "spring", damping: 26, stiffness: 340 }}
            className="relative w-full max-w-md bg-[#15171c] border border-[#262a34] rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-10 overflow-hidden"
          >
            {/* Ambient top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />

            {/* Header / Close */}
            <div className="flex items-start justify-between">
              {/* Icon pod */}
              <div className="w-12 h-12 rounded-2xl bg-[#1c1f26] border border-[#262a34] flex items-center justify-center shadow-inner relative group">
                <div className="absolute inset-0 rounded-2xl bg-rose-500/10 blur-sm group-hover:bg-rose-500/20 transition-colors" />
                <LogOut className="w-5 h-5 text-rose-400 relative z-10" />
              </div>

              <button
                onClick={onClose}
                disabled={isSigningOut}
                aria-label="Close prompt"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Body */}
            <div className="mt-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Sign Out of</span>
                <span className="font-extrabold tracking-tight">
                  <span className="text-[#a78bfa]">Or</span>
                  <span className="text-white">bitr</span>
                </span>
                <span>?</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Are you sure you want to end your current session? Your zero-knowledge vault keys will be purged from memory and all encrypted drives will be locked.
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

            {/* Security Warning Chip */}
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-950/20 border border-amber-900/30 text-[11px] text-amber-300/90">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Unsaved uploads or transfers in progress will be aborted.</span>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSigningOut}
                className="px-4 py-2 rounded-xl neu-btn text-xs font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer active:scale-95"
              >
                Cancel
              </button>

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
      )}
    </AnimatePresence>
  );
}
