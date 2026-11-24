"use client";

import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HardDrive,
  Shield,
  Share2,
  Inbox,
  Trash2,
  Lock,
  Upload,
  FolderPlus,
  Send,
  Sliders,
  LogOut,
  Sparkles,
  Zap,
  FileText,
  Search,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface CommandPaletteProps {
  onOpenCleaner?: () => void;
}

interface SearchFileResult {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
}

export function CommandPalette({ onOpenCleaner }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [matchingFiles, setMatchingFiles] = useState<SearchFileResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Live file search when query has 2+ characters
  useEffect(() => {
    if (query.trim().length < 2) {
      setMatchingFiles([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/files?q=${encodeURIComponent(query.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.files && Array.isArray(data.files)) {
            setMatchingFiles(data.files.slice(0, 5));
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setIsSearching(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-md flex items-start justify-center pt-20 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative w-full max-w-xl bg-[#15171c]/95 backdrop-blur-xl rounded-2xl shader-card overflow-hidden shadow-2xl"
      >
        <Command className="w-full">
          <div className="flex items-center px-4 py-3 border-b border-slate-800 gap-2.5">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search files or jump to section (e.g. Vault, Clean)..."
              className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none font-medium"
              autoFocus
            />
            <span className="text-[10px] font-mono text-slate-400 neu-inset px-2 py-0.5 rounded-md font-semibold">
              ESC
            </span>
          </div>

          <Command.List className="max-h-96 overflow-y-auto p-2 text-sm text-slate-300">
            <Command.Empty className="p-4 text-center text-xs text-slate-500 font-medium">
              {isSearching ? "Searching Drive files..." : "No matching commands or files found."}
            </Command.Empty>

            {/* Live Search Matching Files */}
            {matchingFiles.length > 0 && (
              <Command.Group
                heading="Files in Drive"
                className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider"
              >
                {matchingFiles.map((file) => (
                  <Command.Item
                    key={file.id}
                    onSelect={() => runCommand(() => router.push(`/drive?fileId=${file.id}`))}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/60 cursor-pointer text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="font-semibold text-xs truncate">{file.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      {formatBytes(file.sizeBytes)}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group
              heading="Quick Actions"
              className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider"
            >
              {onOpenCleaner && (
                <Command.Item
                  onSelect={() => runCommand(onOpenCleaner)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 cursor-pointer text-slate-200 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-xs text-amber-400">
                    Smart Storage Cleaner (Free Up Space)
                  </span>
                </Command.Item>
              )}
              <Command.Item
                onSelect={() => runCommand(() => router.push("/drive?action=upload"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 cursor-pointer text-slate-200 transition-colors"
              >
                <Upload className="w-4 h-4 text-blue-400" />
                <span className="font-medium text-xs">Upload New File</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/drive?action=quick-transfer"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 cursor-pointer text-slate-100 transition-colors"
              >
                <Zap className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-xs">Quick Transfer (PC &harr; Phone)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/drive?action=new-folder"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 cursor-pointer text-slate-100 transition-colors"
              >
                <FolderPlus className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-xs">Create New Folder</span>
              </Command.Item>
            </Command.Group>

            <Command.Group
              heading="Navigation"
              className="px-2 py-1 mt-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider"
            >
              <Command.Item
                onSelect={() => runCommand(() => router.push("/drive"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 cursor-pointer text-slate-100 transition-colors"
              >
                <HardDrive className="w-4 h-4 text-sky-600" />
                <span className="font-medium text-xs">Drive Storage</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/vault"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 cursor-pointer text-slate-100 transition-colors"
              >
                <Shield className="w-4 h-4 text-indigo-600" />
                <span className="font-medium text-xs">Private Vault (Zero-Knowledge AES-256)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/shared"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 cursor-pointer text-slate-100 transition-colors"
              >
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-xs">Shared Links & Portals</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/drop-zones"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 cursor-pointer text-slate-100 transition-colors"
              >
                <Inbox className="w-4 h-4 text-amber-600" />
                <span className="font-medium text-xs">Drop Zones (Request Files)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/trash"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 cursor-pointer text-slate-100 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span className="font-medium text-xs">Trash</span>
              </Command.Item>
            </Command.Group>

            <Command.Group
              heading="Security & Account"
              className="px-2 py-1 mt-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider"
            >
              <Command.Item
                onSelect={() => runCommand(() => router.push("/security"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 cursor-pointer text-slate-100 transition-colors"
              >
                <Lock className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-xs">Security Center & Active Sessions</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/settings"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 cursor-pointer text-slate-100 transition-colors"
              >
                <Sliders className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-xs">Account Settings</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/api/auth/signout"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 cursor-pointer text-rose-600 transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span className="font-semibold text-xs">Sign Out</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </motion.div>
    </div>
  );
}
