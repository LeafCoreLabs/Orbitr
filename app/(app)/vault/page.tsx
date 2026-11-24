"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Unlock,
  Upload,
  Download,
  Trash2,
  KeyRound,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { VaultUnlockModal } from "@/components/vault/VaultUnlockModal";
import { MotionCard } from "@/components/ui/MotionCard";
import {
  encryptText,
  decryptText,
  encryptFileBuffer,
  decryptFileBuffer,
  base64ToBuffer,
  bufferToBase64,
  calculateFileSha256,
} from "@/lib/crypto-client";
import { formatBytes } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface EncryptedFileItem {
  id: string;
  name: string; // Stored as ciphertext string
  sizeBytes: number;
  mimeType: string;
  isEncrypted: boolean;
  encMeta: {
    iv?: string;
    originalNameIv?: string;
    salt?: string;
  } | null;
  createdAt: string;
  decryptedName?: string;
}

export default function VaultPage() {
  const queryClient = useQueryClient();
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [decryptedFiles, setDecryptedFiles] = useState<EncryptedFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch encrypted vault files
  const { data, isLoading } = useQuery({
    queryKey: ["files", "vault"],
    queryFn: async () => {
      const res = await fetch("/api/files?vault=true");
      if (!res.ok) throw new Error("Could not load vault files");
      return res.json();
    },
    enabled: Boolean(vaultKey),
  });

  // Decrypt filenames client-side when vaultKey or files change
  useEffect(() => {
    if (!vaultKey || !data?.files) return;

    let active = true;

    async function decryptAllNames() {
      const rawFiles: EncryptedFileItem[] = data.files;
      const results: EncryptedFileItem[] = [];

      for (const f of rawFiles) {
        let decName = f.name;
        if (f.encMeta?.originalNameIv) {
          try {
            decName = await decryptText(f.name, vaultKey!, f.encMeta.originalNameIv);
          } catch (e) {
            console.error("Could not decrypt filename", e);
            decName = "[Decryption Error]";
          }
        }
        results.push({ ...f, decryptedName: decName });
      }

      if (active) {
        setDecryptedFiles(results);
      }
    }

    decryptAllNames();

    return () => {
      active = false;
    };
  }, [vaultKey, data?.files]);

  // Client-Side Zero-Knowledge Upload
  const handleVaultUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vaultKey) return;

    try {
      setIsUploading(true);
      setUploadStatus("Encrypting filename with AES-256-GCM...");

      // 1. Encrypt confidential filename
      const { ciphertext: encName, iv: nameIv } = await encryptText(file.name, vaultKey);

      // 2. Read and Encrypt binary buffer in browser
      setUploadStatus("Encrypting file binary payload client-side...");
      const fileBuffer = await file.arrayBuffer();
      const { encryptedBuffer, iv: fileIv } = await encryptFileBuffer(fileBuffer, vaultKey);

      // 3. Compute SHA-256 of encrypted blob
      const encryptedBlob = new Blob([encryptedBuffer]);
      const encSha256 = await calculateFileSha256(encryptedBlob);

      // 4. Request presigned upload URL (server sees ONLY ciphertext)
      setUploadStatus("Authorizing zero-knowledge upload...");
      const urlRes = await fetch("/api/files/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: encName, // Server only ever stores ciphertext string
          sizeBytes: encryptedBlob.size,
          mimeType: file.type || "application/octet-stream",
          sha256: encSha256,
          isEncrypted: true,
          encMeta: {
            iv: bufferToBase64(fileIv),
            originalNameIv: nameIv,
          },
        }),
      });

      const urlData = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlData.error || "Upload init failed");

      // 5. Upload ciphertext directly to Cloudflare R2
      setUploadStatus("Uploading ciphertext directly to R2...");
      const uploadRes = await fetch(urlData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: encryptedBlob,
      });

      if (!uploadRes.ok) throw new Error("Storage rejected encrypted payload.");

      // 6. Complete on server
      await fetch(`/api/files/${urlData.fileId}/complete`, { method: "POST" });

      toast.success("File encrypted and secured in your Private Vault!");
      queryClient.invalidateQueries({ queryKey: ["files", "vault"] });
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Vault upload failed.";
      toast.error(msg);
    } finally {
      setIsUploading(false);
      setUploadStatus("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Client-Side Zero-Knowledge Decryption & Download
  const handleDownloadAndDecrypt = async (f: EncryptedFileItem) => {
    if (!vaultKey) return;

    try {
      toast.info("Downloading encrypted ciphertext from storage...");

      const res = await fetch(`/api/files/${f.id}/download`);
      const data = await res.json();
      if (!data.downloadUrl) throw new Error("Could not get download link.");

      const fileRes = await fetch(data.downloadUrl);
      const encryptedBuf = await fileRes.arrayBuffer();

      toast.info("Decrypting with your client AES-256 key...");
      const iv = base64ToBuffer(f.encMeta?.iv || "");
      const decryptedBuf = await decryptFileBuffer(encryptedBuf, vaultKey, iv);

      // Create download anchor
      const blob = new Blob([decryptedBuf], { type: f.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.decryptedName || "decrypted-file";
      a.click();
      URL.revokeObjectURL(url);

      toast.success("File decrypted and saved to your device!");
    } catch (err) {
      console.error(err);
      toast.error("Decryption failed. Please verify your passphrase.");
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/files/${id}?permanent=true`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Vault file permanently erased");
        queryClient.invalidateQueries({ queryKey: ["files", "vault"] });
      }
    } catch {
      toast.error("Failed to delete file.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl shader-card shadow-lg bg-white/90 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl neu-flat flex items-center justify-center text-indigo-600 shrink-0">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Private Vault</span>
              <span className="text-[10px] font-mono uppercase bg-indigo-950/70 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-bold tracking-wide">
                Zero-Knowledge
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Encrypted in your browser before upload using AES-256-GCM. The server never holds keys or plaintext.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {vaultKey ? (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleVaultUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="neu-btn flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all text-xs cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploading ? "Encrypting..." : "Encrypt & Upload"}</span>
              </button>

              <button
                onClick={() => {
                  setVaultKey(null);
                  toast.info("Vault locked. Cryptographic keys purged from memory.");
                }}
                className="neu-btn flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs text-slate-200 font-semibold transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Lock Vault</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {}}
              className="neu-btn flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 px-5 rounded-xl text-xs shadow-md cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Vault</span>
            </button>
          )}
        </div>
      </div>

      {isUploading && (
        <div className="p-4 rounded-xl neu-flat text-xs text-indigo-900 flex items-center gap-3 animate-pulse">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold">{uploadStatus}</span>
        </div>
      )}

      {/* Files List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Encrypted Artifacts ({decryptedFiles.length})
        </h3>

        {!vaultKey ? (
          <div className="py-24 text-center rounded-2xl neu-flat p-8 space-y-3">
            <div className="w-16 h-16 rounded-2xl neu-inset flex items-center justify-center mx-auto text-indigo-600">
              <Lock className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-100">Vault is Locked</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              Please provide your confidential vault passphrase to decrypt files.
            </p>
          </div>
        ) : isLoading ? (
          <div className="py-24 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Decrypting vault directory...
          </div>
        ) : decryptedFiles.length === 0 ? (
          <div className="py-20 text-center rounded-2xl neu-flat p-8 space-y-3">
            <div className="w-16 h-16 rounded-2xl neu-inset flex items-center justify-center mx-auto text-indigo-600">
              <Shield className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-100">Your Private Vault is empty</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              Upload sensitive contracts, financial statements, and recovery keys here for zero-knowledge storage.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {decryptedFiles.map((file) => (
              <MotionCard
                key={file.id}
                className="neu-convex p-4 rounded-2xl space-y-3 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/70 px-2 py-0.5 rounded-md border border-indigo-500/30 font-semibold">
                    AES-256-GCM
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadAndDecrypt(file);
                      }}
                      title="Decrypt and Download"
                      className="w-7 h-7 rounded-lg neu-btn flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePermanentDelete(file.id);
                      }}
                      title="Permanently erase"
                      className="w-7 h-7 rounded-lg neu-btn flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="py-1">
                  <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform duration-300">
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-100 truncate">
                    {file.decryptedName || file.name}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {formatBytes(file.sizeBytes)}
                  </p>
                </div>
              </MotionCard>
            ))}
          </div>
        )}
      </div>

      {/* Vault Unlock Modal */}
      <VaultUnlockModal
        isOpen={!vaultKey}
        onUnlocked={(key) => setVaultKey(key)}
      />
    </div>
  );
}
