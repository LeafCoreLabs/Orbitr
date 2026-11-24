"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sliders,
  Shield,
  Database,
  LogOut,
  Fingerprint,
  Laptop,
  Smartphone,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { startRegistration } from "@simplewebauthn/browser";
import { toast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [registering, setRegistering] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Storage query
  const { data: storageData } = useQuery({
    queryKey: ["files", "root"],
    queryFn: async () => {
      const res = await fetch("/api/files?folderId=root");
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Passkey status query
  const { data: passkeyData, isLoading: passkeyLoading } = useQuery({
    queryKey: ["passkeys"],
    queryFn: async () => {
      const res = await fetch("/api/auth/passkey");
      if (!res.ok) return { hasPasskey: false, count: 0, authenticators: [] };
      return res.json();
    },
  });

  const usedBytes = storageData?.storage?.usedBytes || 0;
  const quotaBytes = storageData?.storage?.quotaBytes || 2147483648;
  const percentage = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));

  // Handler to register a new passkey (Windows PIN, Android Fingerprint, etc.)
  const handleRegisterPasskey = async () => {
    try {
      setRegistering(true);

      const optRes = await fetch("/api/auth/passkey/generate-registration-options", {
        method: "POST",
      });

      const { options, challengeId, error } = await optRes.json();
      if (!optRes.ok || error) {
        throw new Error(error || "Failed to initialize passkey registration.");
      }

      const regResp = await startRegistration(options);

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
      localStorage.setItem("orbitr_passkey_configured", "true");
      queryClient.invalidateQueries({ queryKey: ["passkeys"] });
    } catch (err: unknown) {
      console.error("[Passkey Setup Error]", err);
      const msg = err instanceof Error ? err.message : "Passkey registration failed.";
      if (
        msg.includes("cancelled") ||
        msg.includes("timed out") ||
        msg.includes("The operation was aborted") ||
        msg.includes("not allowed")
      ) {
        toast.info("Passkey registration prompt was closed.");
      } else {
        toast.error(msg);
      }
    } finally {
      setRegistering(false);
    }
  };

  // Handler to remove a passkey
  const handleDeletePasskey = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/auth/passkey?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove passkey");
      }
      toast.success("Passkey removed successfully.");
      queryClient.invalidateQueries({ queryKey: ["passkeys"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not delete passkey.";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Header */}
      <div className="pb-4 border-b border-[#262a34]">
        <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <span>Account & Security Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your cloud storage quota, Windows PIN / Android passkeys, and account preferences.
        </p>
      </div>

      {/* Storage Breakdown Card */}
      <div className="p-6 rounded-2xl neu-flat space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-200">Storage Usage Breakdown</h2>
          </div>
          <span className="text-xs font-mono text-indigo-300 font-semibold">{percentage}% Allocated</span>
        </div>

        <div className="w-full h-3 neu-inset rounded-full overflow-hidden p-0.5 flex">
          <div
            className="h-full bg-gradient-to-r from-[#a5b4fc] via-[#818cf8] to-[#6366f1] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(129,140,248,0.5)]"
            style={{ width: `${Math.max(4, percentage)}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl neu-inset">
            <span className="text-slate-400">Total Quota</span>
            <p className="font-semibold text-slate-100 font-mono mt-0.5">
              {formatBytes(quotaBytes)}
            </p>
          </div>
          <div className="p-3 rounded-xl neu-inset">
            <span className="text-slate-400">Used Storage</span>
            <p className="font-semibold text-indigo-400 font-mono mt-0.5">
              {formatBytes(usedBytes)}
            </p>
          </div>
          <div className="p-3 rounded-xl neu-inset col-span-2 sm:col-span-1">
            <span className="text-slate-400">Remaining</span>
            <p className="font-semibold text-emerald-400 font-mono mt-0.5">
              {formatBytes(Math.max(0, quotaBytes - usedBytes))}
            </p>
          </div>
        </div>
      </div>

      {/* PASSKEYS & BIOMETRIC AUTHENTICATION CARD */}
      <div className="p-6 rounded-2xl neu-flat space-y-5 border border-[#262a34]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Fingerprint className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100">
                  Passkeys & Biometric Authentication
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 font-semibold">
                  FIDO2
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Unlock Orbitr without typing passwords using your device’s built-in authenticators: Windows Hello PIN, Android Fingerprint, or Touch ID.
              </p>
            </div>
          </div>

          <button
            onClick={handleRegisterPasskey}
            disabled={registering}
            className="neu-btn-primary flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md active:scale-[0.98] transition-all cursor-pointer shrink-0 disabled:opacity-50"
          >
            {registering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Set Up New Passkey</span>
              </>
            )}
          </button>
        </div>

        {/* Supported Hardware Devices Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-xl neu-inset space-y-1 border border-white/[0.04]">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
              <Laptop className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Windows PIN & Hello</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Hardware TPM passkeys secured with your Windows Hello PIN or facial recognition.
            </p>
          </div>

          <div className="p-3.5 rounded-xl neu-inset space-y-1 border border-white/[0.04]">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Android Fingerprint</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Biometric sensor and Android Screen Lock passkey synchronised via Google Credential Manager.
            </p>
          </div>
        </div>

        {/* Active Passkeys List */}
        <div className="pt-2 border-t border-[#262a34] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">Registered Authenticators</span>
            <span className="text-slate-400 font-mono text-[11px]">
              {passkeyData?.count || 0} active
            </span>
          </div>

          {passkeyLoading ? (
            <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Checking registered authenticators...</span>
            </div>
          ) : passkeyData?.authenticators && passkeyData.authenticators.length > 0 ? (
            <div className="space-y-2">
              {passkeyData.authenticators.map((authItem: any, index: number) => (
                <div
                  key={authItem.id}
                  className="p-3 rounded-xl neu-inset flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200">
                          Passkey #{index + 1}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-mono">
                          Active
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 font-mono truncate">
                        ID: {authItem.id.slice(0, 16)}... • Added{" "}
                        {new Date(authItem.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeletePasskey(authItem.id)}
                    disabled={deletingId === authItem.id}
                    className="p-2 rounded-lg neu-btn text-rose-400 hover:text-rose-300 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    title="Remove this passkey"
                  >
                    {deletingId === authItem.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#1b1930]/40 border border-indigo-500/20 text-center space-y-2">
              <p className="text-xs text-slate-300 font-medium">
                No passkey registered on this device yet.
              </p>
              <p className="text-[11px] text-slate-400">
                Click &ldquo;Set Up New Passkey&rdquo; above to link your Windows PIN or Android fingerprint for instant login.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Security Architecture Info */}
      <div className="p-6 rounded-2xl neu-flat space-y-3">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-100">Zero-Knowledge Architecture</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Orbitr employs zero-knowledge browser client cryptography (AES-256-GCM), private S3/R2 direct upload presigning, Argon2id password hashing, and FIDO2 WebAuthn passkey authentication.
        </p>
      </div>

      {/* Session Management & Sign Out */}
      <div className="p-6 rounded-2xl neu-flat flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <LogOut className="w-5 h-5 text-rose-400" />
            <h2 className="text-sm font-semibold text-slate-100">Active Session</h2>
          </div>
          <p className="text-xs text-slate-400">
            End your current session across this browser and clear all temporary zero-knowledge decryption keys.
          </p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("orbitr-open-signout"))}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500/20 to-red-600/20 hover:from-rose-500/30 hover:to-red-600/30 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Sign Out of Orbitr</span>
        </button>
      </div>
    </div>
  );
}
