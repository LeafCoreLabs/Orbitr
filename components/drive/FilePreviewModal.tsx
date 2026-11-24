"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ShieldAlert, FileText } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file?: {
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    isEncrypted?: boolean;
    previewUrl?: string;
  } | null;
  viewOnly?: boolean;
  watermark?: boolean;
  watermarkText?: string;
}

export function FilePreviewModal({
  isOpen,
  onClose,
  file,
  viewOnly = false,
  watermark = false,
  watermarkText = "Confidential - Orbitr Drive",
}: FilePreviewModalProps) {
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [textContent, setTextContent] = useState<string>("");
  const [loadingText, setLoadingText] = useState(false);

  useEffect(() => {
    if (!isOpen || !file) return;

    if (file.previewUrl) {
      setDownloadUrl(file.previewUrl);
    } else {
      // Fetch fresh 60-second presigned preview URL
      fetch(`/api/files/${file.id}/download?inline=true`)
        .then((res) => res.json())
        .then((data) => {
          if (data.downloadUrl) {
            setDownloadUrl(data.downloadUrl);
            if (file.mimeType.startsWith("text/") || file.mimeType.includes("json")) {
              setLoadingText(true);
              fetch(data.downloadUrl)
                .then((r) => r.text())
                .then((t) => setTextContent(t))
                .catch((e) => console.error(e))
                .finally(() => setLoadingText(false));
            }
          }
        })
        .catch((err) => console.error(err));
    }
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const isImage = file.mimeType.startsWith("image/");
  const isVideo = file.mimeType.startsWith("video/");
  const isAudio = file.mimeType.startsWith("audio/");
  const isPdf = file.mimeType === "application/pdf";
  const isText = file.mimeType.startsWith("text/") || file.mimeType.includes("json");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onContextMenu={(e) => viewOnly && e.preventDefault()}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-between p-4 md:p-6"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 z-20">
        <div>
          <h2 className="text-sm md:text-base font-semibold text-slate-100 truncate max-w-sm md:max-w-xl">
            {file.name}
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {formatBytes(file.sizeBytes)} &bull; {file.mimeType}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!viewOnly && downloadUrl && (
            <a
              href={downloadUrl}
              download={file.name}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </a>
          )}
          {viewOnly && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>View-Only Mode</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Canvas */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden my-4 z-10">
        {/* Dynamic Watermark Overlay */}
        {watermark && (
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden flex items-center justify-center opacity-25 select-none">
            <div className="transform -rotate-30 space-y-12 text-center">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="text-sm md:text-base font-mono font-bold text-slate-300 tracking-wider">
                  {watermarkText} &bull; {new Date().toLocaleTimeString()}
                </div>
              ))}
            </div>
          </div>
        )}

        {isImage && downloadUrl && (
          <img
            src={downloadUrl}
            alt={file.name}
            className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl select-none"
            draggable={false}
          />
        )}

        {isVideo && downloadUrl && (
          <video
            controls
            controlsList={viewOnly ? "nodownload" : undefined}
            src={downloadUrl}
            className="max-h-[75vh] max-w-full rounded-lg shadow-2xl"
          />
        )}

        {isAudio && downloadUrl && (
          <div className="p-8 rounded-2xl bg-[#111624] border border-white/10 shadow-2xl space-y-4">
            <div className="text-center font-medium text-slate-200">{file.name}</div>
            <audio controls controlsList={viewOnly ? "nodownload" : undefined} src={downloadUrl} />
          </div>
        )}

        {isPdf && downloadUrl && (
          <iframe
            src={downloadUrl}
            title={file.name}
            className="w-full h-full max-w-5xl rounded-lg border border-white/10 bg-slate-900"
          />
        )}

        {isText && (
          <div className="w-full h-full max-w-4xl bg-[#111317] border border-white/[0.08] rounded-xl p-4 overflow-auto font-mono text-xs text-slate-200 whitespace-pre shadow-lg">
            {loadingText ? "Loading file preview..." : textContent || "Empty file."}
          </div>
        )}

        {!isImage && !isVideo && !isAudio && !isPdf && !isText && (
          <div className="p-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-200 font-medium">No inline preview available</p>
            <p className="text-xs text-slate-400">Download the file to view on your device.</p>
          </div>
        )}
      </div>

      {/* Footer warning for viewOnly */}
      {viewOnly && (
        <div className="text-center text-[11px] text-slate-300 z-20">
          This document is protected under Orbitr Secure View-Only Policy. Downloads and copying are restricted.
        </div>
      )}
    </motion.div>
  );
}
