"use client";

import React from "react";
import { Search, Command, QrCode, LogOut, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

interface TopNavbarProps {
  onOpenQuickTransfer?: () => void;
}

export function TopNavbar({ onOpenQuickTransfer }: TopNavbarProps) {
  const triggerCmdK = () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    );
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-[#15171c]/85 backdrop-blur-md border-b border-[#22252e] shadow-sm">
      {/* Mobile Logo */}
      <div className="flex items-center gap-3 md:hidden">
        <Logo size="sm" />
      </div>

      {/* Global Search Bar (Cmd+K) */}
      <div className="hidden sm:flex items-center flex-1 max-w-md mx-4">
        <button
          onClick={triggerCmdK}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl neu-inset text-slate-400 hover:text-slate-200 text-sm transition-all text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search files, tags, or jump to...</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 neu-btn px-2 py-0.5 rounded shadow-2xs">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Action shortcuts */}
      <div className="flex items-center gap-2 md:gap-3">
        {onOpenQuickTransfer && (
          <button
            onClick={onOpenQuickTransfer}
            title="Quick Transfer (PC to Phone)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-btn text-xs font-semibold text-slate-300 cursor-pointer active:scale-95"
          >
            <QrCode className="w-4 h-4 text-blue-400" />
            <span className="hidden lg:inline">Quick Transfer</span>
          </button>
        )}

        <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full neu-pill text-blue-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Orbitr Guard</span>
          </div>

          <a
            href="/api/auth/signout"
            title="Sign out"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
