"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, Plus, Copy, Check, Trash2, Folder, ExternalLink, X } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface DropZoneItem {
  dropZone: {
    id: string;
    folderId: string;
    tokenHash: string;
    maxFileSize: number;
    allowedTypes: string;
    expiresAt: string | null;
    revokedAt: string | null;
    createdAt: string;
  };
  folder: {
    id: string;
    name: string;
  };
}

export default function DropZonesPage() {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [maxSizeMb, setMaxSizeMb] = useState(100);
  const [allowedTypes, setAllowedTypes] = useState("*/*");

  // Fetch folders for dropdown
  const { data: folderData } = useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const res = await fetch("/api/folders");
      if (!res.ok) throw new Error("Failed to load folders");
      return res.json();
    },
  });

  // Fetch Drop Zones
  const { data, isLoading } = useQuery({
    queryKey: ["dropZones"],
    queryFn: async () => {
      const res = await fetch("/api/drop-zones");
      if (!res.ok) throw new Error("Failed to load drop zones");
      return res.json();
    },
  });

  const dropZonesList: DropZoneItem[] = data?.dropZones || [];
  const folders = folderData?.folders || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/drop-zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId: selectedFolderId,
          maxFileSize: maxSizeMb * 1024 * 1024,
          allowedTypes,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create drop zone");
      }
      return res.json();
    },
    onSuccess: (resData) => {
      toast.success("Drop Zone created! Public link is active.");
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["dropZones"] });
      if (resData.dropZoneUrl) {
        navigator.clipboard.writeText(resData.dropZoneUrl);
        toast.info("Drop zone URL copied to clipboard!");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Creation failed");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/drop-zones?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke drop zone");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Drop Zone closed.");
      queryClient.invalidateQueries({ queryKey: ["dropZones"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#262a34]">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Inbox className="w-5 h-5 text-amber-500" />
            <span>Drop Zones (Request Files)</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Public upload-only portals. Anyone can send files directly into your folder without seeing your existing contents.
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="neu-btn flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Drop Zone</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-xs text-slate-500">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading drop zones...
        </div>
      ) : dropZonesList.length === 0 ? (
        <div className="py-20 text-center rounded-2xl neu-flat p-8 space-y-3">
          <div className="w-16 h-16 rounded-2xl neu-inset flex items-center justify-center mx-auto text-slate-400">
            <Inbox className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-slate-200">No active Drop Zones</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            Create an upload-only link for clients, colleagues, or friends to send files safely into your drive.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dropZonesList.map(({ dropZone, folder }) => {
            const isClosed = Boolean(dropZone.revokedAt);
            const isExpired = dropZone.expiresAt && new Date() > new Date(dropZone.expiresAt);

            return (
              <div
                key={dropZone.id}
                className="p-4 rounded-2xl neu-flat flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1.5 overflow-hidden">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-200">
                      Destination Folder: {folder.name}
                    </span>
                    {isClosed ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                        Closed
                      </span>
                    ) : isExpired ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                        Expired
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        Open for Uploads
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                    <span>Limit: {formatBytes(dropZone.maxFileSize)} per file</span>
                    <span>Types: {dropZone.allowedTypes}</span>
                    <span>Created {formatDate(dropZone.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  {!isClosed && (
                    <button
                      onClick={() => revokeMutation.mutate(dropZone.id)}
                      className="neu-btn px-3.5 py-1.5 rounded-xl text-rose-600 hover:text-rose-700 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Close Drop Zone
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-full max-w-md rounded-2xl shader-card p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#262a34]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl neu-flat flex items-center justify-center text-amber-500">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create Drop Zone</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Request files directly into a folder</p>
                </div>
              </div>
              <button
                onClick={() => setCreateOpen(false)}
                className="w-8 h-8 rounded-lg neu-btn flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Target Folder in Your Drive</label>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full neu-inset rounded-xl p-2.5 text-slate-100 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="">Select a folder...</option>
                  {folders.map((f: { id: string; name: string }) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Max File Size (MB)</label>
                <input
                  type="number"
                  min="1"
                  max="1024"
                  value={maxSizeMb}
                  onChange={(e) => setMaxSizeMb(Number(e.target.value))}
                  className="w-full neu-inset rounded-xl p-2.5 text-slate-100 font-medium focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Allowed File Types</label>
                <input
                  type="text"
                  placeholder="*/* or image/*,application/pdf"
                  value={allowedTypes}
                  onChange={(e) => setAllowedTypes(e.target.value)}
                  className="w-full neu-inset rounded-xl p-2.5 text-slate-100 font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setCreateOpen(false)}
                className="neu-btn px-4 py-2 text-xs text-slate-400 hover:text-slate-200 font-medium rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!selectedFolderId || createMutation.isPending}
                className="neu-btn px-5 py-2 text-xs bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-xl disabled:opacity-50 shadow-md cursor-pointer"
              >
                {createMutation.isPending ? "Creating..." : "Create Drop Zone"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
