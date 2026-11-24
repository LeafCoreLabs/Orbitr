"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, CheckCircle2, AlertCircle, File as FileIcon, Clock, Zap } from "lucide-react";
import { calculateFileSha256 } from "@/lib/crypto-client";
import { formatBytes } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId?: string | null;
  onUploadComplete?: () => void;
}

export function UploadModal({
  isOpen,
  onClose,
  folderId = null,
  onUploadComplete,
}: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [autoExpiry, setAutoExpiry] = useState<string>("none");
  const [isDuplicate, setIsDuplicate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setProgress(5);
      setStatusMessage("Calculating cryptographic SHA-256 hash...");

      // Client-side SHA-256 for instant deduplication (Feature F)
      const sha256 = await calculateFileSha256(selectedFile);
      setProgress(20);
      setStatusMessage("Requesting secure storage authorization...");

      // Compute expiry date if chosen
      let expiresAt: string | null = null;
      if (autoExpiry !== "none") {
        const days = parseInt(autoExpiry, 10);
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      }

      // Step 1: Request upload URL
      const urlRes = await fetch("/api/files/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedFile.name,
          sizeBytes: selectedFile.size,
          mimeType: selectedFile.type || "application/octet-stream",
          folderId,
          sha256,
          isEncrypted: false,
          expiresAt,
        }),
      });

      const urlData = await urlRes.json();
      if (!urlRes.ok) {
        throw new Error(urlData.error || "Failed to initialize upload.");
      }

      // Check if Smart Storage instant deduplication triggered
      if (urlData.isDuplicate) {
        setIsDuplicate(true);
        setProgress(100);
        setStatusMessage("Identical file detected! Instant upload completed.");
        toast.success("Instant upload: duplicate file deduplicated!");
        setTimeout(() => {
          onUploadComplete?.();
          onClose();
        }, 1200);
        return;
      }

      // Step 2: Upload file directly to Cloudflare R2 via presigned PUT
      setStatusMessage("Uploading directly to private Cloudflare R2...");
      setProgress(30);

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", urlData.uploadUrl, true);
      xhr.setRequestHeader("Content-Type", selectedFile.type || "application/octet-stream");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = 30 + Math.round((e.loaded / e.total) * 60);
          setProgress(percent);
        }
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Storage rejected upload with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during file upload to storage."));
        xhr.send(selectedFile);
      });

      // Step 3: Complete upload on server
      setProgress(95);
      setStatusMessage("Verifying storage object integrity...");

      const completeRes = await fetch(`/api/files/${urlData.fileId}/complete`, {
        method: "POST",
      });

      if (!completeRes.ok) {
        const cData = await completeRes.json();
        throw new Error(cData.error || "Integrity verification failed.");
      }

      setProgress(100);
      setStatusMessage("Upload verified and secured!");
      toast.success("File uploaded successfully!");

      setTimeout(() => {
        onUploadComplete?.();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      console.error("[Upload Failed]", err);
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setStatusMessage(`Error: ${msg}`);
      toast.error(msg);
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg bg-[#15171c]/95 backdrop-blur-xl rounded-2xl shader-card p-6 space-y-5 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#22252e]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl neu-flat flex items-center justify-center text-indigo-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-tight">Upload to Orbitr Drive</h2>
              <p className="text-[11px] text-slate-400">Fast, encrypted direct-to-cloud upload</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="w-8 h-8 rounded-lg neu-btn flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drag and Drop Box */}
        {!selectedFile ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="neu-inset rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-indigo-950/20 group border border-slate-800"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl neu-flat flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform duration-300">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-200">
                Click or drag & drop files here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Direct browser-to-R2 presigned upload (up to 5 GB)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl neu-flat">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-indigo-400 shrink-0">
                  <FileIcon className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-slate-200 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>
              {!isUploading && (
                <button
                  onClick={() => setSelectedFile(null)}
                  className="w-7 h-7 rounded-lg neu-btn flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Smart Storage: Per-file Auto-Expiry TTL */}
            {!isUploading && (
              <div className="flex items-center justify-between text-xs text-slate-300 p-3 rounded-xl neu-flat">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-slate-300">Auto-delete TTL:</span>
                </div>
                <select
                  value={autoExpiry}
                  onChange={(e) => setAutoExpiry(e.target.value)}
                  className="neu-inset rounded-lg px-3 py-1.5 text-xs text-slate-200 bg-[#1c1f26] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="none">Keep forever</option>
                  <option value="1">Delete after 1 day</option>
                  <option value="7">Delete after 7 days</option>
                  <option value="30">Delete after 30 days</option>
                </select>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2 p-3 rounded-xl neu-flat">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium">{statusMessage}</span>
                  <span className="text-indigo-400 font-mono font-bold">{progress}%</span>
                </div>
                <div className="w-full h-3 neu-inset rounded-full overflow-hidden p-0.5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeOut", duration: 0.3 }}
                  />
                </div>
                {isDuplicate && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-2">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Deduplicated: instant zero-network upload</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="neu-btn px-4 py-2 text-sm text-slate-400 hover:text-white font-medium rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleStartUpload}
            disabled={!selectedFile || isUploading}
            className="neu-btn flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-50 text-white text-sm font-semibold py-2 px-5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <span>{isUploading ? "Uploading..." : "Start Upload"}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
