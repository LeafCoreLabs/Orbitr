"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Share2,
  Lock,
  MailCheck,
  Eye,
  Flame,
  Clock,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId?: string;
  fileName?: string;
}

export function ShareModal({
  isOpen,
  onClose,
  fileId,
  fileName,
}: ShareModalProps) {
  const [createdShareUrl, setCreatedShareUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form options
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [enableRecipientOtp, setEnableRecipientOtp] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [viewOnly, setViewOnly] = useState(false);
  const [watermark, setWatermark] = useState(false);
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [maxViews, setMaxViews] = useState<number | "">(1);
  const [enableTimeCapsule, setEnableTimeCapsule] = useState(false);
  const [availableFromDate, setAvailableFromDate] = useState("");
  const [expiresAtDate, setExpiresAtDate] = useState("");

  if (!isOpen) return null;

  const handleCreateShare = async () => {
    if (!fileId) return;

    try {
      setIsSubmitting(true);

      const payload: Record<string, unknown> = {
        fileId,
        password: enablePassword && password.trim() ? password.trim() : null,
        recipientEmail: enableRecipientOtp && recipientEmail.trim() ? recipientEmail.trim() : null,
        requireOtp: enableRecipientOtp,
        viewOnly,
        watermark,
        burnAfterRead,
        maxViews: burnAfterRead ? Number(maxViews) || 1 : null,
        availableFrom: enableTimeCapsule && availableFromDate ? new Date(availableFromDate).toISOString() : null,
        expiresAt: expiresAtDate ? new Date(expiresAtDate).toISOString() : null,
      };

      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create share link");
      }

      setCreatedShareUrl(data.shareUrl);
      toast.success("Secure share link generated!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating share.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(createdShareUrl);
    setCopied(true);
    toast.success("Share link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg bg-[#15171c]/95 backdrop-blur-xl rounded-2xl shader-card p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#22252e]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl neu-flat flex items-center justify-center text-[#00a2ff]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Secure Share</h2>
              <p className="text-xs text-slate-400 truncate max-w-[280px] font-medium">{fileName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg neu-btn flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {createdShareUrl ? (
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-center space-y-1">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Protected Share Link Active
              </span>
              <p className="text-xs text-slate-600 font-medium">
                Only recipients meeting your security rules can access this file.
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl neu-inset">
              <input
                type="text"
                readOnly
                value={createdShareUrl}
                className="bg-transparent text-xs text-slate-100 w-full focus:outline-none font-mono"
              />
              <button
                onClick={copyLink}
                className="shrink-0 p-2 rounded-lg neu-btn text-sky-600 hover:text-sky-700 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="neu-btn px-5 py-2 text-sm text-slate-200 font-semibold rounded-xl transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 text-xs">
            {/* Feature B: Burn-After-Read */}
            <div className="p-3.5 rounded-xl neu-flat space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span className="font-semibold text-slate-100">Burn-After-Read (Self-Destruct)</span>
                </div>
                <input
                  type="checkbox"
                  checked={burnAfterRead}
                  onChange={(e) => setBurnAfterRead(e.target.checked)}
                  className="rounded border-slate-700 text-rose-500 focus:ring-0 w-4 h-4 accent-rose-600 cursor-pointer"
                />
              </div>
              {burnAfterRead && (
                <div className="flex items-center justify-between text-slate-400 pt-1">
                  <span className="font-medium">Self-destruct after views:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxViews}
                    onChange={(e) => setMaxViews(Number(e.target.value))}
                    className="w-16 neu-inset rounded-lg px-2 py-1 text-slate-100 text-center font-mono text-xs focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Feature C: Recipient-Verified Email OTP */}
            <div className="p-3.5 rounded-xl neu-flat space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MailCheck className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-slate-200">Recipient Email OTP Verification</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableRecipientOtp}
                  onChange={(e) => setEnableRecipientOtp(e.target.checked)}
                  className="rounded border-slate-700 text-blue-500 focus:ring-0 w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>
              {enableRecipientOtp && (
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full neu-inset rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none"
                />
              )}
            </div>

            {/* Feature D: Secure View-Only & Watermark */}
            <div className="p-3.5 rounded-xl neu-flat space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-slate-200">Secure View-Only Mode</span>
                </div>
                <input
                  type="checkbox"
                  checked={viewOnly}
                  onChange={(e) => setViewOnly(e.target.checked)}
                  className="rounded border-slate-700 text-purple-500 focus:ring-0 w-4 h-4 accent-purple-600 cursor-pointer"
                />
              </div>

              {viewOnly && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Dynamic Watermark (email + timestamp)</span>
                    <input
                      type="checkbox"
                      checked={watermark}
                      onChange={(e) => setWatermark(e.target.checked)}
                      className="rounded border-slate-700 text-purple-500 focus:ring-0 w-4 h-4 accent-purple-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-400">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                    <span>Deters copying but cannot prevent physical photography.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Password Protection */}
            <div className="p-3.5 rounded-xl neu-flat space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-slate-200">Password Protection</span>
                </div>
                <input
                  type="checkbox"
                  checked={enablePassword}
                  onChange={(e) => setEnablePassword(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0 w-4 h-4 accent-amber-600 cursor-pointer"
                />
              </div>
              {enablePassword && (
                <input
                  type="password"
                  placeholder="Set share password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full neu-inset rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none"
                />
              )}
            </div>

            {/* Feature G: Time Capsule Future Schedule */}
            <div className="p-3.5 rounded-xl neu-flat space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-slate-200">Time Capsule (Future Unlock)</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableTimeCapsule}
                  onChange={(e) => setEnableTimeCapsule(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-500 focus:ring-0 w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>
              {enableTimeCapsule && (
                <input
                  type="datetime-local"
                  value={availableFromDate}
                  onChange={(e) => setAvailableFromDate(e.target.value)}
                  className="w-full neu-inset rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none"
                />
              )}
            </div>

            {/* General Expiry */}
            <div className="flex items-center justify-between p-3 rounded-xl neu-flat">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="font-medium">Link Expiration Date:</span>
              </div>
              <input
                type="date"
                value={expiresAtDate}
                onChange={(e) => setExpiresAtDate(e.target.value)}
                className="neu-inset rounded-lg px-2.5 py-1 text-slate-100 text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={onClose}
                className="neu-btn px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors font-medium rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateShare}
                disabled={isSubmitting}
                className="neu-btn flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2 px-5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <span>{isSubmitting ? "Generating..." : "Create Protected Link"}</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
