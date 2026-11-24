"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  Smartphone,
  Laptop,
  LogOut,
  Clock,
  Key,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Activity,
  History,
  Fingerprint,
  Plus,
} from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import { startRegistration } from "@simplewebauthn/browser";

interface SessionItem {
  id: string;
  deviceLabel: string;
  ip: string | null;
  lastSeenAt: string;
}

interface ActivityLogItem {
  log: {
    id: string;
    action: string;
    ip: string | null;
    userAgent: string | null;
    createdAt: string;
  };
  fileName: string | null;
}

export default function SecurityPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"sessions" | "activity" | "totp" | "passkeys">("sessions");

  // Passkey registration state
  const [registeringPasskey, setRegisteringPasskey] = useState(false);

  // TOTP setup state
  const [totpQr, setTotpQr] = useState<string>("");
  const [totpSecret, setTotpSecret] = useState<string>("");
  const [totpCode, setTotpCode] = useState<string>("");
  const [isSettingUpTotp, setIsSettingUpTotp] = useState(false);

  // 1. Fetch Sessions
  const { data: sessionData, isLoading: loadingSessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await fetch("/api/security/sessions");
      if (!res.ok) throw new Error("Could not load sessions");
      return res.json();
    },
  });

  // 2. Fetch Activity Logs
  const { data: activityData, isLoading: loadingActivity } = useQuery({
    queryKey: ["activity"],
    queryFn: async () => {
      const res = await fetch("/api/security/activity");
      if (!res.ok) throw new Error("Could not load activity log");
      return res.json();
    },
  });

  // 3. Fetch 2FA Status
  const { data: totpStatus, refetch: refetchTotp } = useQuery({
    queryKey: ["totpStatus"],
    queryFn: async () => {
      const res = await fetch("/api/security/totp");
      if (!res.ok) throw new Error("Could not load 2FA status");
      return res.json();
    },
  });

  const sessions: SessionItem[] = sessionData?.sessions || [];
  const logs: ActivityLogItem[] = activityData?.logs || [];
  const is2FaEnabled = Boolean(totpStatus?.enabled);

  // Revoke session mutation
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch("/api/security/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", sessionId }),
      });
      if (!res.ok) throw new Error("Failed to revoke session");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Session terminated.");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  // Sign out everywhere mutation
  const revokeAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/security/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_all" }),
      });
      if (!res.ok) throw new Error("Failed to revoke all sessions");
      return res.json();
    },
    onSuccess: () => {
      toast.success("All other sessions terminated.");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  // Start 2FA Setup
  const handleStartTotpSetup = async () => {
    try {
      const res = await fetch("/api/security/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const data = await res.json();
      if (data.secret && data.qrCode) {
        setTotpSecret(data.secret);
        setTotpQr(data.qrCode);
        setIsSettingUpTotp(true);
      }
    } catch {
      toast.error("Could not initialize 2FA setup");
    }
  };

  // Verify and Enable 2FA
  const handleVerifyTotp = async () => {
    if (!totpCode || totpCode.length !== 6) {
      toast.error("Please enter a 6-digit authenticator code");
      return;
    }

    try {
      const res = await fetch("/api/security/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_and_enable",
          secret: totpSecret,
          code: totpCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      toast.success("Two-Factor Authentication is now active!");
      setIsSettingUpTotp(false);
      refetchTotp();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "2FA verification failed";
      toast.error(msg);
    }
  };

  // Disable 2FA
  const handleDisableTotp = async () => {
    try {
      await fetch("/api/security/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable" }),
      });
      toast.info("Two-Factor Authentication disabled.");
      refetchTotp();
    } catch {
      toast.error("Could not disable 2FA");
    }
  };

  // Register Passkey (WebAuthn / Biometrics)
  const handleRegisterPasskey = async () => {
    try {
      setRegisteringPasskey(true);
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

      toast.success("Passkey registered! You can now sign in using biometrics or your security key.");
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    } catch (err: unknown) {
      console.error("[Passkey Reg Error]", err);
      const msg = err instanceof Error ? err.message : "Registration failed.";
      if (msg.includes("cancelled") || msg.includes("timed out")) {
        toast.info("Passkey setup cancelled.");
      } else {
        toast.error(msg);
      }
    } finally {
      setRegisteringPasskey(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Security Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor active device sessions, audit security access logs, and configure two-factor authentication.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl neu-inset text-xs max-w-fit">
        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex items-center gap-2 py-2 px-3.5 rounded-xl font-semibold transition-all cursor-pointer ${
            activeTab === "sessions"
              ? "neu-flat text-indigo-300 bg-[#1c1f26]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Active Sessions ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("activity")}
          className={`flex items-center gap-2 py-2 px-3.5 rounded-xl font-semibold transition-all cursor-pointer ${
            activeTab === "activity"
              ? "neu-flat text-indigo-300 bg-[#1c1f26]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Activity Audit Log</span>
        </button>

        <button
          onClick={() => setActiveTab("totp")}
          className={`flex items-center gap-2 py-2 px-3.5 rounded-xl font-semibold transition-all cursor-pointer ${
            activeTab === "totp"
              ? "neu-flat text-indigo-300 bg-[#1c1f26]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Two-Factor Authentication</span>
        </button>

        <button
          onClick={() => setActiveTab("passkeys")}
          className={`flex items-center gap-2 py-2 px-3.5 rounded-xl font-semibold transition-all cursor-pointer ${
            activeTab === "passkeys"
              ? "neu-flat text-indigo-300 bg-[#1c1f26]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Fingerprint className="w-4 h-4" />
          <span>Passkeys & Biometrics</span>
        </button>
      </div>

      {/* Tab 1: Sessions */}
      {activeTab === "sessions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Connected Devices
            </span>
            {sessions.length > 1 && (
              <button
                onClick={() => revokeAllMutation.mutate()}
                className="neu-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 text-xs font-semibold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out Everywhere</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {sessions.map((s, idx) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl neu-flat flex items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div className="w-11 h-11 rounded-xl neu-inset flex items-center justify-center text-slate-500 shrink-0">
                    {s.deviceLabel.toLowerCase().includes("mobile") ||
                    s.deviceLabel.toLowerCase().includes("android") ||
                    s.deviceLabel.toLowerCase().includes("iphone") ? (
                      <Smartphone className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Laptop className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-100 truncate">{s.deviceLabel}</p>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                          Current Device
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      IP: {s.ip || "Unknown"} &bull; Last seen {formatRelativeTime(s.lastSeenAt)}
                    </p>
                  </div>
                </div>

                {idx !== 0 && (
                  <button
                    onClick={() => revokeSessionMutation.mutate(s.id)}
                    className="w-8 h-8 rounded-lg neu-btn flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Terminate session"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Activity Audit Log */}
      {activeTab === "activity" && (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 neu-flat rounded-2xl">No activity logged yet.</div>
          ) : (
            logs.map(({ log, fileName }) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl neu-flat flex items-center justify-between text-xs transition-all"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg neu-inset flex items-center justify-center text-indigo-400 shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 capitalize">
                        {log.action.replace(/_/g, " ")}
                      </span>
                      {fileName && (
                        <span className="text-slate-500 font-mono truncate">&bull; {fileName}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      IP: {log.ip || "127.0.0.1"} &bull; {log.userAgent?.slice(0, 60)}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                  {formatRelativeTime(log.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Two-Factor Authentication (TOTP) */}
      {activeTab === "totp" && (
        <div className="p-6 rounded-2xl shader-card max-w-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#262a34]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl neu-flat flex items-center justify-center text-amber-500">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">TOTP Authenticator (2FA)</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Add an extra layer of security using Google Authenticator, Authy, or 1Password.
                </p>
              </div>
            </div>
            {is2FaEnabled ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Enabled
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                Disabled
              </span>
            )}
          </div>

          {is2FaEnabled ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 font-semibold">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Your account is protected with Two-Factor Authentication.</span>
              </div>
              <button
                onClick={handleDisableTotp}
                className="neu-btn px-4 py-2 rounded-xl text-rose-600 hover:text-rose-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Disable 2FA
              </button>
            </div>
          ) : isSettingUpTotp ? (
            <div className="space-y-4 text-xs">
              <p className="text-slate-200 font-semibold">
                1. Scan this QR code with your authenticator app:
              </p>
              {totpQr && (
                <div className="p-3 neu-inset rounded-2xl inline-block">
                  <img src={totpQr} alt="TOTP QR Code" className="w-40 h-40 rounded-xl" />
                </div>
              )}
              <div className="p-3 neu-inset rounded-xl font-mono text-indigo-400 text-xs break-all font-semibold">
                Manual Key: {totpSecret}
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-200 font-semibold">
                  2. Enter 6-digit confirmation code from your app:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className="w-full neu-inset rounded-xl p-3 text-slate-100 font-mono text-center tracking-widest text-base focus:outline-none"
                />
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setIsSettingUpTotp(false)}
                  className="neu-btn px-4 py-2 rounded-xl text-slate-600 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyTotp}
                  className="neu-btn px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Confirm & Enable 2FA
                </button>
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={handleStartTotpSetup}
                className="neu-btn px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                Setup Two-Factor Authentication
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Passkeys & Biometrics */}
      {activeTab === "passkeys" && (
        <div className="shader-card rounded-2xl p-6 shadow-md space-y-6 bg-[#15171c]/95 border border-[#22252e]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-2xl neu-flat flex items-center justify-center text-indigo-400 shrink-0">
                <Fingerprint className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Passwordless Passkeys & Biometrics
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed font-medium">
                  Sign in instantly with Windows Hello PIN, Android biometrics & fingerprint, Apple Touch ID / Face ID, or hardware security keys (FIDO2 / WebAuthn). Passkeys are cryptographically resistant to phishing and server breaches.
                </p>
              </div>
            </div>

            <button
              onClick={handleRegisterPasskey}
              disabled={registeringPasskey}
              className="neu-btn-primary flex items-center gap-1.5 px-4 py-2.5 text-white font-semibold rounded-xl text-xs shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{registeringPasskey ? "Registering..." : "Add This Device Passkey"}</span>
            </button>
          </div>

          <div className="border-t border-[#262a34] pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl neu-flat space-y-1">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Fast & Frictionless</span>
              <p className="text-xs text-slate-400">Unlock your Orbitr drive with your Windows Hello PIN or Android fingerprint in less than a second.</p>
            </div>
            <div className="p-4 rounded-xl neu-flat space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Phishing-Proof</span>
              <p className="text-xs text-slate-400">Private keys never leave your secure enclave; signatures are cryptographically bound to your domain.</p>
            </div>
            <div className="p-4 rounded-xl neu-flat space-y-1">
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Universal</span>
              <p className="text-xs text-slate-400">Works seamlessly across Windows Hello, Android, macOS, iOS, and USB FIDO2 keys.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
