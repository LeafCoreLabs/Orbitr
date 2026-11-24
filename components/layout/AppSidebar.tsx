"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HardDrive,
  Shield,
  Share2,
  Inbox,
  Trash2,
  Lock,
  Sliders,
  Plus,
  Zap,
  Sparkles,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn, formatBytes } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface AppSidebarProps {
  onOpenUpload?: () => void;
  onOpenQuickTransfer?: () => void;
  onOpenCleaner?: () => void;
  onOpenSignOut?: () => void;
}

export function AppSidebar({
  onOpenUpload,
  onOpenQuickTransfer,
  onOpenCleaner,
  onOpenSignOut,
}: AppSidebarProps) {
  const pathname = usePathname();
  const sessionResult = useSession?.();
  const session = sessionResult?.data;

  // Query storage quota
  const { data } = useQuery({
    queryKey: ["files", "root"],
    queryFn: async () => {
      const res = await fetch("/api/files?folderId=root");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const usedBytes = data?.storage?.usedBytes || 0;
  const quotaBytes = data?.storage?.quotaBytes || 2147483648; // 2 GB
  const percentage = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));

  const navLinks = [
    { label: "My Drive", href: "/drive", icon: HardDrive },
    { label: "Private Vault", href: "/vault", icon: Shield, badge: "Zero-Knowledge" },
    { label: "Shared Files", href: "/shared", icon: Share2 },
    { label: "Drop Zones", href: "/drop-zones", icon: Inbox },
    { label: "Trash", href: "/trash", icon: Trash2 },
    { label: "Security Center", href: "/security", icon: Lock },
    { label: "Settings", href: "/settings", icon: Sliders },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#15171c] border-r border-[#22252e] shadow-[4px_0_24px_rgba(0,0,0,0.8)] h-screen sticky top-0 p-5 shrink-0 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[#22252e]">
        <Logo size="md" />
      </div>

      {/* Primary Action Button */}
      <div className="pt-6 pb-4">
        <button
          onClick={onOpenUpload}
          className="w-full flex items-center justify-center gap-2.5 neu-btn-primary font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.2]" />
          <span>Upload File</span>
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pt-2">
        {navLinks.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "neu-inset text-indigo-400 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1d24]"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-indigo-400" : "text-slate-500"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1b1930] text-indigo-300 border border-indigo-500/30 font-mono">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Transfer Fast Button */}
      {onOpenQuickTransfer && (
        <div className="pt-2 pb-4">
          <button
            onClick={onOpenQuickTransfer}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl neu-btn text-indigo-300 text-xs font-semibold cursor-pointer active:scale-98"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Quick Transfer (PC &harr; Phone)</span>
          </button>
        </div>
      )}

      {/* Storage Meter */}
      <div className="p-4 rounded-xl neu-flat space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-semibold">Storage Quota</span>
          <span className="text-slate-400 font-mono">{percentage}%</span>
        </div>
        <div className="w-full h-2 neu-inset rounded-full overflow-hidden p-0.5">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              percentage > 90
                ? "bg-rose-500"
                : percentage > 75
                ? "bg-amber-500"
                : "bg-gradient-to-r from-blue-600 to-indigo-600"
            )}
            style={{ width: `${Math.max(4, percentage)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span>{formatBytes(usedBytes)} of {formatBytes(quotaBytes)}</span>
          {onOpenCleaner && (
            <button
              onClick={onOpenCleaner}
              className="flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>Clean</span>
            </button>
          )}
        </div>
      </div>

      {/* User Session & Sign Out Pod */}
      <div className="pt-3 border-t border-[#22252e] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl neu-btn flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "O"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {session?.user?.name || "Orbitr User"}
            </p>
            <p className="text-[10px] text-slate-500 font-mono truncate">
              {session?.user?.email || "Encrypted Session"}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSignOut || (() => window.dispatchEvent(new CustomEvent("orbitr-open-signout")))}
          title="Sign out of Orbitr"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
