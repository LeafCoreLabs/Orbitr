"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, KeyRound, Lock, AlertCircle, Download, Check, X } from "lucide-react";
import {
  deriveKeyFromPassphrase,
  generateRandomBytes,
  generateRecoveryKey,
  bufferToBase64,
  base64ToBuffer,
} from "@/lib/crypto-client";
import { toast } from "@/components/ui/Toast";

interface VaultUnlockModalProps {
  isOpen: boolean;
  onUnlocked: (key: CryptoKey) => void;
}

export function VaultUnlockModal({ isOpen, onUnlocked }: VaultUnlockModalProps) {
  const [passphrase, setPassphrase] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [isNewVault, setIsNewVault] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [hasDownloadedRecovery, setHasDownloadedRecovery] = useState(false);

  // Check if this device has existing vault salt
  React.useEffect(() => {
    const existingSalt = localStorage.getItem("orbitr_salt") || localStorage.getItem("vaulta_salt");
    if (!existingSalt) {
      setIsNewVault(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleUnlock = async () => {
    if (!passphrase || passphrase.length < 8) {
      toast.error("Passphrase must be at least 8 characters");
      return;
    }

    try {
      setIsInitializing(true);

      let saltBytes: Uint8Array;
      const existingSalt = localStorage.getItem("orbitr_salt") || localStorage.getItem("vaulta_salt");

      if (existingSalt) {
        saltBytes = base64ToBuffer(existingSalt);
      } else {
        // First-time vault setup: create salt & generate recovery key
        saltBytes = generateRandomBytes(16);
        localStorage.setItem("orbitr_salt", bufferToBase64(saltBytes));
        const recKey = generateRecoveryKey();
        setRecoveryKey(recKey);
      }

      // Derive AES-256-GCM symmetric key entirely in the browser
      const derivedKey = await deriveKeyFromPassphrase(passphrase, saltBytes);

      if (isNewVault && !hasDownloadedRecovery && recoveryKey) {
        // Keep modal open so user can download recovery key
        setIsInitializing(false);
        return;
      }

      toast.success("Private Vault unlocked with Zero-Knowledge encryption.");
      onUnlocked(derivedKey);
    } catch (err) {
      console.error(err);
      toast.error("Failed to derive encryption key.");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDownloadRecovery = () => {
    if (!recoveryKey) return;
    const blob = new Blob(
      [
        `ORBITR PRIVATE VAULT - RECOVERY KEY\n` +
          `===================================\n` +
          `Date: ${new Date().toISOString()}\n\n` +
          `Recovery Key: ${recoveryKey}\n\n` +
          `IMPORTANT: Store this key in an offline password manager. If you lose your passphrase, Orbitr engineers CANNOT recover your encrypted files because encryption is zero-knowledge.\n`,
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orbitr-recovery-key-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setHasDownloadedRecovery(true);
    toast.success("Recovery key downloaded!");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative w-full max-w-md bg-[#15171c]/95 backdrop-blur-xl rounded-2xl shader-card p-6 space-y-5 shadow-2xl"
      >
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl neu-flat flex items-center justify-center mx-auto text-indigo-400">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            {isNewVault ? "Initialize Private Vault" : "Unlock Private Vault"}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Files in the vault are encrypted client-side using AES-256-GCM. Your passphrase never reaches our servers.
          </p>
        </div>

        {recoveryKey ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-left space-y-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Save Recovery Key
              </span>
              <p className="text-xs text-slate-300">
                Because Orbitr is Zero-Knowledge, we cannot reset your passphrase. Download your recovery key now.
              </p>
              <div className="p-3 neu-inset rounded-xl font-mono text-sm font-bold text-center text-indigo-400 tracking-wider">
                {recoveryKey}
              </div>
            </div>

            <button
              onClick={handleDownloadRecovery}
              className="w-full flex items-center justify-center gap-2 neu-btn text-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Download Recovery Key (.txt)</span>
            </button>

            <button
              onClick={() => {
                if (!hasDownloadedRecovery) {
                  toast.error("Please download your recovery key first!");
                  return;
                }
                handleUnlock();
              }}
              className="w-full flex items-center justify-center gap-2 neu-btn bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all text-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Continue to Vault</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-300">Vault Passphrase</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter your confidential passphrase"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  className="w-full neu-inset rounded-xl p-3 text-slate-100 text-xs focus:outline-none pl-10"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              onClick={handleUnlock}
              disabled={isInitializing}
              className="w-full flex items-center justify-center gap-2 neu-btn bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold py-3 rounded-xl shadow-md transition-all text-xs cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{isInitializing ? "Deriving AES-256 Key..." : "Unlock Vault"}</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
