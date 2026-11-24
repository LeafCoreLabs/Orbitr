"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  QrCode,
  Copy,
  Check,
  Clock,
  Zap,
  Smartphone,
  Laptop,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  Download,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "@/components/ui/Toast";
import { formatBytes } from "@/lib/utils";

interface QuickTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId?: string;
  fileName?: string;
}

interface UserFileItem {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
}

export function QuickTransferModal({
  isOpen,
  onClose,
  fileId: initialFileId,
  fileName: initialFileName,
}: QuickTransferModalProps) {
  const [activeTab, setActiveTab] = useState<"send" | "receive">(
    initialFileId ? "send" : "send"
  );
  const [selectedFileId, setSelectedFileId] = useState<string>(initialFileId || "");
  const [activeFileName, setActiveFileName] = useState<string>(initialFileName || "");
  const [userFiles, setUserFiles] = useState<UserFileItem[]>([]);

  // Send state
  const [code, setCode] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [transferUrl, setTransferUrl] = useState<string>("");
  const [loadingSend, setLoadingSend] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(600); // 10 minutes

  // Receive state
  const [receiveCode, setReceiveCode] = useState("");
  const [loadingReceive, setLoadingReceive] = useState(false);

  // Sync initialFileId when passed from parent
  useEffect(() => {
    if (initialFileId) {
      setSelectedFileId(initialFileId);
      setActiveFileName(initialFileName || "");
      setActiveTab("send");
    }
  }, [initialFileId, initialFileName]);

  // Fetch ready files if opened without pre-selected fileId
  useEffect(() => {
    if (!isOpen) return;

    fetch("/api/files")
      .then((res) => res.json())
      .then((data) => {
        if (data.files && Array.isArray(data.files)) {
          setUserFiles(data.files);
          if (!selectedFileId && data.files.length > 0 && !initialFileId) {
            setSelectedFileId(data.files[0].id);
            setActiveFileName(data.files[0].name);
          }
        }
      })
      .catch((err) => console.error(err));
  }, [isOpen, initialFileId, selectedFileId]);

  // Generate transfer code whenever selectedFileId is active and on send tab
  const handleGenerateTransfer = (targetFileId: string) => {
    if (!targetFileId) return;

    setLoadingSend(true);
    fetch("/api/quick-transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: targetFileId }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data.success) {
          setCode(data.code);
          setTransferUrl(data.transferUrl);
          if (data.fileName) setActiveFileName(data.fileName);
          setTimeLeftSeconds(600);

          // Generate QR code
          const qr = await QRCode.toDataURL(data.transferUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: "#0f172a",
              light: "#ffffff",
            },
          });
          setQrDataUrl(qr);
        } else {
          toast.error(data.error || "Failed to initiate quick transfer.");
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Could not generate transfer code.");
      })
      .finally(() => setLoadingSend(false));
  };

  useEffect(() => {
    if (isOpen && activeTab === "send" && selectedFileId) {
      handleGenerateTransfer(selectedFileId);
    }
  }, [isOpen, selectedFileId, activeTab]);

  // Countdown timer for 10 minutes
  useEffect(() => {
    if (!isOpen || timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeLeftSeconds]);

  if (!isOpen) return null;

  const copyTransferLink = () => {
    navigator.clipboard.writeText(transferUrl);
    setCopied(true);
    toast.success("Transfer link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Claim and download file directly in modal
  const handleClaimReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = receiveCode.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      toast.error("Please enter a valid 6-character transfer code.");
      return;
    }

    try {
      setLoadingReceive(true);
      const res = await fetch(`/api/quick-transfer?code=${cleanCode}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid or expired transfer code.");
      }

      toast.success(`Claimed: ${data.fileName}`);

      // Trigger instant download
      const a = document.createElement("a");
      a.href = data.downloadUrl;
      a.download = data.fileName;
      a.click();

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to claim transfer.";
      toast.error(msg);
    } finally {
      setLoadingReceive(false);
    }
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative w-full max-w-md bg-[#15171c]/95 backdrop-blur-xl rounded-2xl shader-card p-6 space-y-4 text-center shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#22252e] text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl neu-flat flex items-center justify-center text-blue-400">
              <Zap className="w-5 h-5 text-[#00a2ff]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Quick Transfer</h2>
              <p className="text-[11px] text-slate-400 font-medium">Zero-login device handoff</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg neu-btn flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl neu-inset text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("send")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "send" ? "neu-flat text-[#00a2ff] bg-[#1c1f26]" : "text-slate-400"
            }`}
          >
            <ArrowUpCircle className="w-4 h-4 text-[#00a2ff]" />
            <span>Send (Share Code)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("receive")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "receive" ? "neu-flat text-[#00a2ff] bg-[#1c1f26]" : "text-slate-400"
            }`}
          >
            <ArrowDownCircle className="w-4 h-4 text-[#00a2ff]" />
            <span>Receive (Enter Code)</span>
          </button>
        </div>

        {activeTab === "send" ? (
          <div className="space-y-4">
            {/* File Picker if multiple files available */}
            {userFiles.length > 1 && !initialFileId && (
              <div className="text-left space-y-1">
                <label className="text-xs font-semibold text-slate-300">Select File to Transfer</label>
                <select
                  value={selectedFileId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedFileId(nextId);
                    const found = userFiles.find((f) => f.id === nextId);
                    if (found) setActiveFileName(found.name);
                    handleGenerateTransfer(nextId);
                  }}
                  className="w-full neu-inset rounded-xl p-2.5 text-xs text-slate-100 font-medium focus:outline-none cursor-pointer"
                >
                  {userFiles.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({formatBytes(f.sizeBytes)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {loadingSend ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-500">Generating secure transfer token...</p>
              </div>
            ) : !selectedFileId ? (
              <div className="py-12 text-center text-xs text-slate-500 neu-flat rounded-2xl p-6">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-300">No files in your Drive yet</p>
                <p className="mt-1">Upload a file first to transfer it to your phone.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* QR Code Container */}
                {qrDataUrl && (
                  <div className="flex justify-center p-3 neu-inset rounded-2xl inline-block mx-auto">
                    <img
                      src={qrDataUrl}
                      alt="Quick Transfer QR Code"
                      className="w-40 h-40 rounded-xl shadow-xs"
                    />
                  </div>
                )}

                {/* 6-Character Big Code */}
                <div className="neu-flat rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    6-Character Transfer Code
                  </span>
                  <div className="font-mono text-3xl font-extrabold tracking-widest text-emerald-600 select-all">
                    {code || "------"}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-[280px] mx-auto font-medium">
                    File: {activeFileName}
                  </p>
                </div>

                {/* Expiry Timer */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-700 neu-flat py-1.5 px-3 rounded-xl font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    Expires in {minutes}:{seconds.toString().padStart(2, "0")} (Single Use)
                  </span>
                </div>

                {/* Copy Button */}
                <button
                  type="button"
                  onClick={copyTransferLink}
                  className="w-full flex items-center justify-center gap-2 neu-btn text-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-emerald-600" />}
                  <span>{copied ? "Link Copied!" : "Copy Transfer Link"}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Receive Tab */
          <form onSubmit={handleClaimReceive} className="space-y-4 py-2">
            <div className="text-left space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Enter 6-Character Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. K9X2B4"
                value={receiveCode}
                onChange={(e) => setReceiveCode(e.target.value.toUpperCase())}
                className="w-full neu-inset rounded-xl p-3.5 text-slate-100 font-mono text-center tracking-widest text-2xl font-bold uppercase focus:outline-none placeholder:text-slate-500"
              />
              <p className="text-[11px] text-slate-400 text-center">
                Enter code shown on the sender device (no account or login required).
              </p>
            </div>

            <button
              type="submit"
              disabled={receiveCode.trim().length !== 6 || loadingReceive}
              className="w-full flex items-center justify-center gap-2 neu-btn bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{loadingReceive ? "Fetching File..." : "Claim & Download File"}</span>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
