"use client";

import React, { useState, useEffect, use } from "react";
import {
  Lock,
  MailCheck,
  ShieldAlert,
  Flame,
  Download,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { formatBytes } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface SharePortalProps {
  params: Promise<{ token: string }>;
}

export default function SharePortal({ params }: SharePortalProps) {
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<any>(null);

  // Password gate
  const [passwordInput, setPasswordInput] = useState("");
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  // Recipient OTP gate
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  const loadShareData = async (password?: string, verifiedOtpEmail?: string) => {
    try {
      setLoading(true);
      setError(null);

      const headers: Record<string, string> = {};
      if (password) headers["x-share-password"] = password;
      if (verifiedOtpEmail) headers["x-verified-otp-email"] = verifiedOtpEmail;

      const res = await fetch(`/api/shares/${token}`, { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unable to access share link.");
      }

      setShareData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Access error.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShareData();
  }, [token]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) return;
    loadShareData(passwordInput, verifiedEmail || undefined);
  };

  const handleSendRecipientOtp = async () => {
    try {
      setIsSendingOtp(true);
      const res = await fetch(`/api/shares/${token}/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");

      setOtpSent(true);
      toast.success(data.message || "Verification code dispatched to your email!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error sending code";
      toast.error(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyRecipientOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Please enter 6-digit verification code");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const res = await fetch(`/api/shares/${token}/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");

      toast.success("Identity verified!");
      setVerifiedEmail(data.email);
      loadShareData(passwordInput || undefined, data.email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification error";
      toast.error(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleDownload = async () => {
    try {
      const headers: Record<string, string> = {};
      if (passwordInput) headers["x-share-password"] = passwordInput;
      if (verifiedEmail) headers["x-verified-otp-email"] = verifiedEmail;

      const res = await fetch(`/api/shares/${token}?download=true`, { headers });
      const data = await res.json();
      if (!res.ok || !data.downloadUrl) {
        throw new Error(data.error || "Download unavailable.");
      }

      window.open(data.downloadUrl, "_blank");
      toast.success("Download started!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Download failed.";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#15171c] text-slate-100 relative overflow-hidden">
      <div className="relative w-full max-w-lg bg-[#15171c]/95 backdrop-blur-xl rounded-2xl shader-card shadow-2xl p-8 space-y-6">
        <div className="flex justify-center mb-2">
          <Logo size="md" />
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-2">
            <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Verifying secure link authorization...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
            <h2 className="text-base font-bold text-slate-100">Access Denied or Expired</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">{error}</p>
          </div>
        ) : shareData?.status === "time_capsule" ? (
          /* Time Capsule Scheduled */
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-100">Time Capsule Locked</h2>
            <p className="text-xs text-slate-400">
              The owner scheduled <strong className="text-blue-400">{shareData.fileName}</strong> to unlock on:
            </p>
            <div className="p-3 neu-inset rounded-xl font-mono text-sm font-semibold text-blue-400">
              {new Date(shareData.availableFrom).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400">
              Please revisit this link once the scheduled date has arrived.
            </p>
          </div>
        ) : shareData?.status === "requires_password" ? (
          /* Password Gate */
          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
            <div className="text-center space-y-1">
              <Lock className="w-8 h-8 text-amber-400 mx-auto mb-1" />
              <h2 className="text-base font-bold text-slate-100">Password Protected File</h2>
              <p className="text-xs text-slate-400">
                Please enter the share password to view <strong className="text-slate-200">{shareData.fileName}</strong>.
              </p>
            </div>

            <input
              type="password"
              placeholder="Enter password"
              autoFocus
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full neu-inset rounded-xl p-3 text-slate-100 text-xs focus:outline-none"
            />

            <button
              type="submit"
              className="w-full neu-btn-primary text-white font-medium py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Unlock Access
            </button>
          </form>
        ) : shareData?.status === "requires_otp" ? (
          /* Recipient OTP Gate (Module 1) */
          <div className="space-y-4 text-left">
            <div className="text-center space-y-1">
              <MailCheck className="w-8 h-8 text-blue-400 mx-auto mb-1" />
              <h2 className="text-base font-bold text-slate-100">Recipient Verification Required</h2>
              <p className="text-xs text-slate-400">
                This file is protected. A 6-digit one-time code must be sent to <strong className="text-blue-400">{shareData.recipientEmail}</strong> to verify your identity.
              </p>
            </div>

            {!otpSent ? (
              <button
                onClick={handleSendRecipientOtp}
                disabled={isSendingOtp}
                className="w-full neu-btn-primary text-white font-medium py-3 rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                {isSendingOtp ? "Sending code..." : "Send Verification Code to My Email"}
              </button>
            ) : (
              <form onSubmit={handleVerifyRecipientOtp} className="space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full neu-inset rounded-xl p-3 font-mono text-center tracking-widest text-lg font-bold text-slate-100 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="w-full neu-btn-primary text-white font-medium py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  {isVerifyingOtp ? "Verifying..." : "Confirm Code & Open File"}
                </button>
              </form>
            )}
          </div>
        ) : shareData?.status === "ready" ? (
          /* Share Ready: File View & Download */
          <div className="space-y-5 text-left">
            <div className="p-4 rounded-xl neu-inset space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                <span className="font-semibold text-sm text-slate-100 truncate">
                  {shareData.file.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {formatBytes(shareData.file.sizeBytes)} &bull; {shareData.file.mimeType}
              </p>

              {shareData.burnAfterRead && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 pt-1">
                  <Flame className="w-4 h-4 shrink-0" />
                  <span>Burn-After-Read Active: This link self-destructs after consumption.</span>
                </div>
              )}
            </div>

            {/* Dynamic Watermark View-Only Viewer for images/PDFs (Module D) */}
            {shareData.viewOnly ? (
              <div className="space-y-3">
                <div className="relative border border-slate-200 rounded-xl bg-slate-950 overflow-hidden p-2 min-h-[240px] flex items-center justify-center">
                  {/* Dynamic Watermark Overlay */}
                  {shareData.watermark && (
                    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center opacity-30 select-none overflow-hidden">
                      <div className="transform -rotate-30 space-y-6 text-center">
                        <div className="text-xs font-mono font-bold text-slate-200">
                          {shareData.recipientEmail || "Protected Document"} &bull; {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {shareData.file.mimeType.startsWith("image/") ? (
                    <img
                      src={shareData.previewUrl}
                      alt={shareData.file.name}
                      onContextMenu={(e) => e.preventDefault()}
                      className="max-h-[300px] object-contain select-none"
                    />
                  ) : (
                    <iframe
                      src={shareData.previewUrl}
                      title={shareData.file.name}
                      className="w-full h-80 rounded border-0"
                    />
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Downloads are disabled. Dynamic watermark is applied.</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-medium py-3 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Secure File</span>
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
