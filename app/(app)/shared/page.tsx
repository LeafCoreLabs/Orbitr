"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Share2,
  Copy,
  Check,
  Trash2,
  Eye,
  Download,
  Flame,
  Clock,
  MailCheck,
  ShieldAlert,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface ShareItem {
  share: {
    id: string;
    fileId: string;
    tokenHash: string;
    recipientEmail: string | null;
    requireOtp: boolean;
    viewOnly: boolean;
    watermark: boolean;
    expiresAt: string | null;
    availableFrom: string | null;
    maxViews: number | null;
    maxDownloads: number | null;
    viewCount: number;
    downloadCount: number;
    burnAfterRead: boolean;
    revokedAt: string | null;
    createdAt: string;
  };
  file: {
    id: string;
    name: string;
    sizeBytes: number;
    mimeType: string;
  };
}

export default function SharedPage() {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["shares"],
    queryFn: async () => {
      const res = await fetch("/api/shares");
      if (!res.ok) throw new Error("Could not load shares");
      return res.json();
    },
  });

  const sharesList: ShareItem[] = data?.shares || [];

  const revokeMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const res = await fetch(`/api/shares?id=${shareId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke share");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Share link revoked.");
      queryClient.invalidateQueries({ queryKey: ["shares"] });
    },
  });

  const copyShareLink = (id: string, tokenHash: string) => {
    const url = `${window.location.origin}/s/${tokenHash}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Share link copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#262a34]">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-500" />
            <span>Shared Links & Portals</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Manage your recipient-verified shares, burn-after-read links, and view-only permissions.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-xs text-slate-500">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading shared links...
        </div>
      ) : sharesList.length === 0 ? (
        <div className="py-20 text-center rounded-2xl neu-flat p-8 space-y-3">
          <div className="w-16 h-16 rounded-2xl neu-inset flex items-center justify-center mx-auto text-slate-400">
            <Share2 className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-slate-200">No active share links</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            You can generate protected, self-destructing, or OTP-verified links for any file from your Drive.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sharesList.map(({ share, file }) => {
            const isRevoked = Boolean(share.revokedAt);
            const isExpired = share.expiresAt && new Date() > new Date(share.expiresAt);
            const isBurned = share.burnAfterRead && share.maxViews && share.viewCount >= share.maxViews;

            return (
              <div
                key={share.id}
                className="p-4 rounded-2xl neu-flat flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1.5 overflow-hidden">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-200 truncate">
                      {file.name}
                    </span>
                    {isRevoked ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                        Revoked
                      </span>
                    ) : isBurned ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                        Burned
                      </span>
                    ) : isExpired ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                        Expired
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        Active
                      </span>
                    )}

                    {share.burnAfterRead && (
                      <span className="flex items-center gap-1 text-[10px] font-mono bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-md font-medium">
                        <Flame className="w-3 h-3" /> Burn-After-Read
                      </span>
                    )}

                    {share.requireOtp && (
                      <span className="flex items-center gap-1 text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-md font-medium">
                        <MailCheck className="w-3 h-3" /> OTP Protected
                      </span>
                    )}

                    {share.viewOnly && (
                      <span className="flex items-center gap-1 text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-md font-medium">
                        <Eye className="w-3 h-3" /> View Only
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {share.viewCount} {share.maxViews ? `/ ${share.maxViews}` : ""} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" />
                      {share.downloadCount} {share.maxDownloads ? `/ ${share.maxDownloads}` : ""} downloads
                    </span>
                    {share.recipientEmail && (
                      <span className="text-slate-300 font-semibold">Recipient: {share.recipientEmail}</span>
                    )}
                    <span>Created {formatDate(share.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  {!isRevoked && (
                    <button
                      onClick={() => revokeMutation.mutate(share.id)}
                      className="neu-btn px-3.5 py-1.5 rounded-xl text-rose-600 hover:text-rose-700 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Revoke Link
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
