"use client";

import React, { useState, useEffect, use } from "react";
import { Inbox, UploadCloud, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { formatBytes } from "@/lib/utils";
import { calculateFileSha256 } from "@/lib/crypto-client";
import { toast } from "@/components/ui/Toast";
import confetti from "canvas-confetti";

interface DropZonePortalProps {
  params: Promise<{ token: string }>;
}

export default function DropZonePortal({ params }: DropZonePortalProps) {
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropZoneData, setDropZoneData] = useState<{
    folderName: string;
    maxFileSize: number;
    allowedTypes: string;
    expiresAt: string | null;
  } | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/drop-zones/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDropZoneData(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Drop zone is unavailable");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleUpload = async () => {
    if (!selectedFile || !dropZoneData) return;

    try {
      setIsUploading(true);
      setProgress(10);

      // Compute SHA-256
      const sha256 = await calculateFileSha256(selectedFile);
      setProgress(25);

      // 1. Request presigned upload URL
      const initRes = await fetch(`/api/drop-zones/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedFile.name,
          sizeBytes: selectedFile.size,
          mimeType: selectedFile.type || "application/octet-stream",
          sha256,
        }),
      });

      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error || "Upload initiation failed");

      // 2. Upload directly to Cloudflare R2
      setProgress(40);
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", initData.uploadUrl, true);
      xhr.setRequestHeader("Content-Type", selectedFile.type || "application/octet-stream");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(40 + Math.round((e.loaded / e.total) * 50));
        }
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Storage upload failed")));
        xhr.onerror = () => reject(new Error("Network upload error"));
        xhr.send(selectedFile);
      });

      // 3. Mark complete
      setProgress(95);
      const completeRes = await fetch(`/api/drop-zones/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          fileId: initData.fileId,
        }),
      });

      if (!completeRes.ok) throw new Error("Completion verification failed");

      setProgress(100);
      setUploadSuccess(true);
      confetti({ particleCount: 80, spread: 60 });
      toast.success("File delivered securely!");
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Upload failed.";
      toast.error(msg);
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#15171c] text-slate-100 relative overflow-hidden">
      <div className="relative w-full max-w-lg bg-[#15171c]/95 backdrop-blur-xl rounded-2xl shader-card shadow-2xl p-8 space-y-6 text-center">
        <div className="flex justify-center mb-2">
          <Logo size="md" />
        </div>

        {loading ? (
          <div className="py-16 text-xs text-slate-500">Loading Drop Zone...</div>
        ) : error ? (
          <div className="py-8 space-y-3">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
            <h2 className="text-base font-bold text-slate-100">Drop Zone Unavailable</h2>
            <p className="text-xs text-slate-400">{error}</p>
          </div>
        ) : uploadSuccess ? (
          <div className="py-8 space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
            <h2 className="text-lg font-bold text-slate-100">File Delivered!</h2>
            <p className="text-xs text-slate-400">
              Your file was uploaded directly to the recipient&apos;s folder.
            </p>
            <button
              onClick={() => {
                setSelectedFile(null);
                setUploadSuccess(false);
              }}
              className="mt-4 px-4 py-2 neu-btn text-slate-200 text-xs rounded-xl font-medium cursor-pointer"
            >
              Send Another File
            </button>
          </div>
        ) : dropZoneData ? (
          <div className="space-y-5 text-left">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400 mx-auto mb-2">
                <Inbox className="w-5 h-5" />
              </div>
              <h1 className="text-base font-bold text-slate-100">
                Send Files to: {dropZoneData.folderName}
              </h1>
              <p className="text-xs text-slate-400">
                Limit: up to {formatBytes(dropZoneData.maxFileSize)} per file
              </p>
            </div>

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#262a34] hover:border-amber-500/50 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors bg-[#111317]"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
                  className="hidden"
                />
                <UploadCloud className="w-8 h-8 text-amber-500" />
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-100">
                    Click to select a file from your device
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Allowed types: {dropZoneData.allowedTypes}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#111317] border border-[#262a34] flex items-center gap-3">
                  <FileText className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-medium text-slate-100 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {formatBytes(selectedFile.size)}
                    </p>
                  </div>
                </div>

                {isUploading && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-500 font-mono">
                      <span>Uploading directly to storage...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium py-3 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  <span>{isUploading ? "Delivering..." : "Upload Securely"}</span>
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
