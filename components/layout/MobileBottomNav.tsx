"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HardDrive,
  Shield,
  Plus,
  Share2,
  Lock,
  Camera,
  Upload,
  FolderPlus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MobileBottomNavProps {
  onOpenUpload?: () => void;
  onOpenCameraUpload?: () => void;
  onOpenNewFolder?: () => void;
}

export function MobileBottomNav({
  onOpenUpload,
  onOpenCameraUpload,
  onOpenNewFolder,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const navItems = [
    { label: "Drive", href: "/drive", icon: HardDrive },
    { label: "Vault", href: "/vault", icon: Shield },
    { label: "Shared", href: "/shared", icon: Share2 },
    { label: "Security", href: "/security", icon: Lock },
  ];

  return (
    <>
      {/* Bottom Sheet for Mobile Upload Actions */}
      <AnimatePresence>
        {sheetOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-[#15171c] border-t border-[#22252e] rounded-t-2xl p-6 space-y-4 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#22252e]">
                <span className="font-bold text-slate-200">Add to Orbitr</span>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setSheetOpen(false);
                    onOpenUpload?.();
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl neu-btn border border-slate-800 hover:border-blue-500/50 text-slate-200 transition-colors"
                >
                  <Upload className="w-6 h-6 text-blue-400" />
                  <span className="text-xs font-semibold">Upload File</span>
                </button>

                <button
                  onClick={() => {
                    setSheetOpen(false);
                    onOpenCameraUpload?.();
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl neu-btn border border-slate-800 hover:border-blue-500/50 text-slate-200 transition-colors"
                >
                  <Camera className="w-6 h-6 text-blue-400" />
                  <span className="text-xs font-semibold">Take Photo</span>
                </button>

                <button
                  onClick={() => {
                    setSheetOpen(false);
                    onOpenNewFolder?.();
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl neu-btn border border-slate-800 hover:border-blue-500/50 text-slate-200 transition-colors"
                >
                  <FolderPlus className="w-6 h-6 text-blue-400" />
                  <span className="text-xs font-semibold">New Folder</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#15171c]/95 backdrop-blur-lg border-t border-[#22252e] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors min-h-[44px]",
                isActive ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}

        {/* Center Floating Action Button */}
        <button
          onClick={() => setSheetOpen(true)}
          className="relative -top-3 w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-95 transition-transform shrink-0"
          aria-label="Upload file or take photo"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {navItems.slice(2).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors min-h-[44px]",
                isActive ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
