"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, Laptop, Smartphone, ShieldCheck, X, Loader2, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { Logo } from "@/components/ui/Logo";

interface PasskeyPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PasskeyPromptModal({
  isOpen,
  onClose,
  onSuccess,
}: PasskeyPromptModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSetupPasskey = async () => {
    try {
      setLoading(true);

      // 1. Fetch registration options from server
      const optRes = await fetch("/api/auth/passkey/generate-registration-options", {
        method: "POST",
      });

      const { options, challengeId, error } = await optRes.json();
      if (!optRes.ok || error) {
        throw new Error(error || "Could not initialize passkey registration.");
      }

      // 2. Launch native browser/device prompt (Windows Hello PIN, Android Fingerprint, Touch ID)
      const regResp = await startRegistration(options);

      // 3. Verify on server
      const verifyRes = await fetch("/api/auth/passkey/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, response: regResp }),
      });

      const data = await verifyRes.json();
      if (!verifyRes.ok || !data.success) {
        throw new Error(data.error || "Passkey registration verification failed.");
      }

      toast.success("Passkey registered! Windows PIN / Android Fingerprint enabled.");
      // Mark as configured in localStorage
      localStorage.setItem("orbitr_passkey_configured", "true");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("[Passkey Setup Error]", err);
      const msg = err instanceof Error ? err.message : "Passkey registration failed.";
      if (
        msg.includes("cancelled") ||
        msg.includes("timed out") ||
        msg.includes("The operation was aborted") ||
        msg.includes("not allowed")
      ) {
        toast.info("Passkey prompt was closed. You can enable it anytime in Settings.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    // Record dismissal for 7 days
    try {
      localStorage.setItem("orbitr_passkey_prompt_dismissed", String(Date.now()));
    } catch {}
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          {/* Backdrop Click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="absolute inset-0"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 360 }}
            className="relative w-full max-w-lg bg-[#15171c]/95 backdrop-blur-2xl rounded-2xl shader-card p-6 sm:p-7 space-y-5 shadow-2xl border border-[#262a34] z-10 text-left"
          >
            {/* Top Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl neu-btn flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Fingerprint className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Logo size="sm" />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 font-semibold">
                    FIDO2 / WebAuthn
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight mt-0.5">
                  Enable Passkey Sign-in
                </h2>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Upgrade your login with your device’s built-in authenticators. Sign in in one tap without typing passwords.
            </p>

            {/* Supported Devices Pods */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Windows PIN */}
              <div className="p-3.5 rounded-xl neu-inset space-y-1.5 border border-white/[0.04]">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                  <Laptop className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Windows PIN</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Windows Hello PIN, Facial recognition, or Fingerprint reader.
                </p>
              </div>

              {/* Android Fingerprint */}
              <div className="p-3.5 rounded-xl neu-inset space-y-1.5 border border-white/[0.04]">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Android Biometrics</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Android Fingerprint sensor or Screen Lock passkey sync.
                </p>
              </div>
            </div>

            {/* Security Highlights */}
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-2.5 text-[11px] text-slate-300">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-semibold text-slate-100">Cryptographically Phishing-Proof:</span>{" "}
                Passkey private keys stay sealed inside your device hardware and never travel over the network.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handleSetupPasskey}
                disabled={loading}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl neu-btn-primary font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Contacting Device Authenticator...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    <span>Setup Passkey Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                disabled={loading}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl neu-btn text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer active:scale-[0.98] transition-colors"
              >
                Maybe Later
              </button>
            </div>

            {/* Note */}
            <div className="text-center pt-0.5">
              <span className="text-[10px] text-slate-400">
                You can also configure or manage passkeys anytime in{" "}
                <span className="text-indigo-400 font-medium">Settings &rarr; Passkeys</span>
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
