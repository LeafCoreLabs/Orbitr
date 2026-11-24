"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, RotateCcw, AlertTriangle, File as FileIcon } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface TrashFileItem {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  deletedAt: string;
}

export default function TrashPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["files", "trash"],
    queryFn: async () => {
      const res = await fetch("/api/files?trash=true");
      if (!res.ok) throw new Error("Failed to load trash");
      return res.json();
    },
  });

  const trashFiles: TrashFileItem[] = data?.files || [];

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/files/${id}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to restore");
      return res.json();
    },
    onSuccess: () => {
      toast.success("File restored to your drive!");
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/files/${id}?permanent=true`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to permanently delete");
      return res.json();
    },
    onSuccess: () => {
      toast.success("File permanently erased from storage.");
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  const handleEmptyTrash = async () => {
    if (trashFiles.length === 0) return;
    if (!confirm("Are you sure you want to permanently delete all items in trash? This cannot be undone.")) return;

    try {
      const res = await fetch("/api/files/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "permanent_delete",
          fileIds: trashFiles.map((f) => f.id),
        }),
      });

      if (res.ok) {
        toast.success("Trash emptied. Storage quota updated.");
        queryClient.invalidateQueries({ queryKey: ["files"] });
      }
    } catch {
      toast.error("Failed to empty trash.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-500" />
            <span>Trash</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deleted files are kept for 30 days before being purged permanently.
          </p>
        </div>

        {trashFiles.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition-colors shadow-2xs"
          >
            Empty Trash
          </button>
        )}
      </div>

      {/* 30-Day Purge Notice */}
      <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 shadow-2xs">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          Files placed in Trash older than 30 days are automatically destroyed by the cron maintenance job.
        </span>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-xs text-slate-500">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading trash...
        </div>
      ) : trashFiles.length === 0 ? (
        <div className="py-20 text-center rounded-2xl neu-flat border border-white/[0.05] p-8 space-y-3">
          <Trash2 className="w-12 h-12 text-slate-400 mx-auto" />
          <p className="text-sm font-medium text-slate-200">Trash is empty</p>
          <p className="text-xs text-slate-500">No deleted files found.</p>
        </div>
      ) : (
        <div className="neu-flat border border-white/[0.05] rounded-2xl overflow-hidden divide-y divide-[#262a34] shadow-xs">
          {trashFiles.map((file) => (
            <div
              key={file.id}
              className="p-3.5 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <FileIcon className="w-5 h-5 text-rose-500 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-medium text-slate-200 truncate">{file.name}</p>
                  <p className="text-[11px] text-slate-500">
                    Deleted {formatDate(file.deletedAt)} &bull; {formatBytes(file.sizeBytes)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => restoreMutation.mutate(file.id)}
                  title="Restore"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
                <button
                  onClick={() => permanentDeleteMutation.mutate(file.id)}
                  title="Permanently erase"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
