"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Trash2,
  AlertTriangle,
  Copy,
  Clock,
  HardDrive,
  CheckCircle2,
  X,
  FileText,
  Filter,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatBytes, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import confetti from "canvas-confetti";

interface SmartStorageCleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCleaned?: () => void;
}

interface FileItem {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  sha256: string;
  createdAt: string;
}

export function SmartStorageCleanerModal({
  isOpen,
  onClose,
  onCleaned,
}: SmartStorageCleanerModalProps) {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<"duplicates" | "large" | "old">("duplicates");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch all user files
  const { data, isLoading } = useQuery({
    queryKey: ["files", "cleaner"],
    queryFn: async () => {
      const res = await fetch("/api/files");
      if (!res.ok) throw new Error("Could not load files");
      return res.json();
    },
    enabled: isOpen,
  });

  const files: FileItem[] = data?.files || [];

  // 1. Detect duplicates (group by sha256)
  const duplicates = useMemo(() => {
    const shaMap = new Map<string, FileItem[]>();
    for (const f of files) {
      const group = shaMap.get(f.sha256) || [];
      group.push(f);
      shaMap.set(f.sha256, group);
    }
    // Return files where sha256 appears more than once, excluding the original (first)
    const dupes: FileItem[] = [];
    for (const [, group] of shaMap) {
      if (group.length > 1) {
        // Leave the first one safe, flag the rest as duplicate copies
        dupes.push(...group.slice(1));
      }
    }
    return dupes;
  }, [files]);

  // 2. Detect large files (> 5MB or top largest)
  const largeFiles = useMemo(() => {
    return [...files]
      .filter((f) => f.sizeBytes > 5 * 1024 * 1024)
      .sort((a, b) => b.sizeBytes - a.sizeBytes);
  }, [files]);

  // 3. Detect old files (> 30 days)
  const oldFiles = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return files.filter((f) => new Date(f.createdAt).getTime() < thirtyDaysAgo);
  }, [files]);

  const currentList =
    activeCategory === "duplicates"
      ? duplicates
      : activeCategory === "large"
      ? largeFiles
      : oldFiles;

  // Calculate reclaimable space for selected files
  const selectedReclaimableBytes = useMemo(() => {
    const idSet = new Set(selectedIds);
    return files
      .filter((f) => idSet.has(f.id))
      .reduce((acc, f) => acc + f.sizeBytes, 0);
  }, [selectedIds, files]);

  // Total reclaimable space across all detected items
  const totalReclaimableBytes = useMemo(() => {
    const allDetected = new Set([
      ...duplicates.map((f) => f.id),
      ...oldFiles.map((f) => f.id),
    ]);
    return files
      .filter((f) => allDetected.has(f.id))
      .reduce((acc, f) => acc + f.sizeBytes, 0);
  }, [duplicates, oldFiles, files]);

  // Bulk Clean Mutation
  const cleanMutation = useMutation({
    mutationFn: async ({ fileIds, permanent }: { fileIds: string[]; permanent: boolean }) => {
      const res = await fetch("/api/files/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: permanent ? "permanent_delete" : "trash",
          fileIds,
        }),
      });
      if (!res.ok) throw new Error("Failed to clean selected files");
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast.success(
        variables.permanent
          ? `Freed ${formatBytes(selectedReclaimableBytes)} of storage!`
          : `Moved ${variables.fileIds.length} files to Trash.`
      );
      confetti({ particleCount: 60, spread: 55 });
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["files"] });
      onCleaned?.();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Cleaning failed");
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllCurrent = () => {
    const currentIds = currentList.map((f) => f.id);
    const allSelected = currentIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative w-full max-w-2xl bg-[#15171c]/95 backdrop-blur-xl rounded-2xl shader-card p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#22252e] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl neu-flat flex items-center justify-center text-[#00a2ff]">
              <Sparkles className="w-5 h-5 text-[#00a2ff]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Smart Storage Cleaner</h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Analyze wasted space, clean duplicates, and purge old files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg neu-btn flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metric Banner */}
        <div className="p-4 rounded-xl neu-flat flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <HardDrive className="w-6 h-6 text-[#00a2ff] shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Total Recoverable Space
              </p>
              <p className="text-lg font-extrabold text-slate-100 font-mono">
                {formatBytes(totalReclaimableBytes)}
              </p>
            </div>
          </div>
          {selectedIds.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-[#00a2ff] font-semibold">Selected for Cleaning</p>
              <p className="text-sm font-bold text-slate-100 font-mono">
                {formatBytes(selectedReclaimableBytes)} ({selectedIds.length} files)
              </p>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl neu-inset text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveCategory("duplicates")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              activeCategory === "duplicates" ? "neu-flat text-[#00a2ff] bg-[#1c1f26]" : "text-slate-400"
            }`}
          >
            <Copy className="w-4 h-4 text-[#00a2ff]" />
            <span>Duplicate Files ({duplicates.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("large")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              activeCategory === "large" ? "neu-flat text-[#00a2ff] bg-[#1c1f26]" : "text-slate-400"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-[#00a2ff]" />
            <span>Large Files ({largeFiles.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("old")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              activeCategory === "old" ? "neu-flat text-[#00a2ff] bg-[#1c1f26]" : "text-slate-400"
            }`}
          >
            <Clock className="w-4 h-4 text-[#00a2ff]" />
            <span>Old Files ({oldFiles.length})</span>
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between text-xs text-slate-600 px-1 shrink-0">
          <button
            type="button"
            onClick={selectAllCurrent}
            className="neu-btn px-3 py-1.5 rounded-lg font-semibold cursor-pointer text-slate-700"
          >
            {currentList.length > 0 &&
            currentList.every((f) => selectedIds.includes(f.id))
              ? "Deselect All in Category"
              : "Select All in Category"}
          </button>
          <span className="text-[11px] text-slate-500">
            {currentList.length} candidate(s) detected
          </span>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-500">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Scanning Drive storage...
            </div>
          ) : currentList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 neu-flat rounded-xl p-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-100">Clean & Optimized</p>
              <p className="mt-0.5 text-slate-500">
                No {activeCategory} found requiring cleanup.
              </p>
            </div>
          ) : (
            currentList.map((file) => {
              const isSelected = selectedIds.includes(file.id);
              return (
                <div
                  key={file.id}
                  onClick={() => toggleSelect(file.id)}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs cursor-pointer transition-all ${
                    isSelected ? "neu-inset bg-amber-500/10 border border-amber-500/20" : "neu-flat hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                    <div className="truncate">
                      <p className="font-bold text-slate-100 truncate">{file.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {formatBytes(file.sizeBytes)} &bull; Uploaded {formatDate(file.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-300 shrink-0">
                    {formatBytes(file.sizeBytes)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-[#262a34] shrink-0">
          <button
            onClick={onClose}
            className="neu-btn px-4 py-2 text-xs text-slate-400 hover:text-white font-medium rounded-xl cursor-pointer"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => cleanMutation.mutate({ fileIds: selectedIds, permanent: false })}
              disabled={selectedIds.length === 0 || cleanMutation.isPending}
              className="neu-btn flex items-center gap-1.5 px-4 py-2 text-xs text-amber-800 hover:text-amber-900 font-semibold rounded-xl disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-amber-600" />
              <span>Move to Trash ({selectedIds.length})</span>
            </button>
            <button
              onClick={() => cleanMutation.mutate({ fileIds: selectedIds, permanent: true })}
              disabled={selectedIds.length === 0 || cleanMutation.isPending}
              className="neu-btn flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Permanent Purge</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
