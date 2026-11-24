"use client";

import React, { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { Zap, Download, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { formatBytes } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import { ShaderMeshBackground } from "@/components/ui/ShaderMeshBackground";

interface QuickTransferPortalProps {
  params: Promise<{ code: string }>;
}

export default function QuickTransferPortal({ params }: QuickTransferPortalProps) {
  const { code } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileData, setFileData] = useState<{
    fileName: string;
    sizeBytes: number;
    mimeType: string;
    downloadUrl: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/quick-transfer?code=${code.toUpperCase()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error || "Transfer failed.");
        setFileData(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Transfer code invalid or expired.");
      })
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#15171c] text-slate-100 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative z-10 w-full max-w-md bg-[#15171c]/95 backdrop-blur-xl rounded-2xl shader-card p-8 space-y-6 text-center shadow-2xl"
      >
        <div className="flex justify-center mb-2">
          <Logo size="md" />
        </div>

        {loading ? (
          <div className="py-16 text-xs text-slate-500 space-y-3">
            <div className="w-9 h-9 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-semibold text-slate-200">Claiming Quick Transfer ({code.toUpperCase()})...</p>
          </div>
        ) : error ? (
          <div className="py-8 space-y-3">
            <div className="w-14 h-14 rounded-2xl neu-flat flex items-center justify-center mx-auto text-rose-500">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-slate-100">Transfer Expired or Claimed</h2>
            <p className="text-xs text-slate-400 font-medium">{error}</p>
          </div>
        ) : fileData ? (
          <div className="space-y-5 text-left">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl neu-flat flex items-center justify-center text-emerald-400 mx-auto mb-2">
                <Zap className="w-6 h-6" />
              </div>
              <h1 className="text-base font-bold text-slate-100">Ready for Download</h1>
              <p className="text-xs text-slate-400 font-medium">Single-use direct transfer</p>
            </div>

            <div className="p-4 rounded-xl neu-flat flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-emerald-600 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-100 truncate">
                  {fileData.fileName}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {formatBytes(fileData.sizeBytes)} &bull; {fileData.mimeType}
                </p>
              </div>
            </div>

            <a
              href={fileData.downloadUrl}
              download={fileData.fileName}
              className="w-full flex items-center justify-center gap-2 neu-btn bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download to This Device</span>
            </a>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
