"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Sliders, HardDrive, Shield, User, Database } from "lucide-react";
import { formatBytes } from "@/lib/utils";

export default function SettingsPage() {
  const { data } = useQuery({
    queryKey: ["files", "root"],
    queryFn: async () => {
      const res = await fetch("/api/files?folderId=root");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const usedBytes = data?.storage?.usedBytes || 0;
  const quotaBytes = data?.storage?.quotaBytes || 2147483648;
  const percentage = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-400" />
          <span>Account & Storage Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your cloud drive quota, security policies, and account preferences.
        </p>
      </div>

      {/* Storage Breakdown Card */}
      <div className="p-6 rounded-2xl neu-flat space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200">Storage Usage Breakdown</h2>
          </div>
          <span className="text-xs font-mono text-blue-400 font-semibold">{percentage}% Allocated</span>
        </div>

        <div className="w-full h-3 neu-inset rounded-full overflow-hidden p-0.5 flex">
          <div
            className="h-full bg-gradient-to-r from-[#00b4ff] via-[#0077ff] to-[#004ecc] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(0,162,255,0.6)]"
            style={{ width: `${Math.max(4, percentage)}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl neu-inset">
            <span className="text-slate-400">Total Quota</span>
            <p className="font-semibold text-slate-100 font-mono mt-0.5">
              {formatBytes(quotaBytes)}
            </p>
          </div>
          <div className="p-3 rounded-xl neu-inset">
            <span className="text-slate-400">Used Storage</span>
            <p className="font-semibold text-[#00a2ff] font-mono mt-0.5">
              {formatBytes(usedBytes)}
            </p>
          </div>
          <div className="p-3 rounded-xl neu-inset col-span-2 sm:col-span-1">
            <span className="text-slate-400">Remaining</span>
            <p className="font-semibold text-emerald-400 font-mono mt-0.5">
              {formatBytes(Math.max(0, quotaBytes - usedBytes))}
            </p>
          </div>
        </div>
      </div>

      {/* Security Architecture Info */}
      <div className="p-6 rounded-2xl neu-flat space-y-3">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-[#00a2ff]" />
          <h2 className="text-sm font-semibold text-slate-100">Security Architecture</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Orbitr employs zero-knowledge browser client cryptography (AES-256-GCM), private S3/R2 direct upload presigning, Argon2id password hashing, and email HMAC-SHA256 one-time code verification.
        </p>
      </div>
    </div>
  );
}
