"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CornerDownLeft,
  Fingerprint,
  HardDrive,
  KeyRound,
  Lock,
  Search,
  Send,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { APPLE_SPRING } from "@/lib/motion";

interface CommandOption {
  id: string;
  title: string;
  meta: string;
  badge: string;
  icon: React.ElementType;
  action: () => void;
}

interface SpotlightSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpotlightSearch({ open, onOpenChange }: SpotlightSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const jumpToStageAnchor = (anchorId: string) => {
    onOpenChange(false);
    window.setTimeout(() => {
      document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  };

  const commands = useMemo<CommandOption[]>(
    () => [
      {
        id: "cmd-signup",
        title: "Claim 2 GB Free Storage",
        meta: "Create your Orbitr Cloud+ account during the public testing phase",
        badge: "/signup",
        icon: UserPlus,
        action: () => {
          onOpenChange(false);
          router.push("/signup");
        },
      },
      {
        id: "cmd-login",
        title: "Sign In to Orbitr Cloud+",
        meta: "Authenticate via Google OAuth, FIDO2 Passkey, or Email / @handle",
        badge: "/login",
        icon: KeyRound,
        action: () => {
          onOpenChange(false);
          router.push("/login");
        },
      },
      {
        id: "cmd-drive",
        title: "Open Cloud Drive Workspace",
        meta: "Access folders, R2 multipart uploads, and file previews",
        badge: "/drive",
        icon: HardDrive,
        action: () => {
          onOpenChange(false);
          router.push("/drive");
        },
      },
      {
        id: "cmd-vault",
        title: "Zero-Knowledge Encrypted Vault",
        meta: "PBKDF2 (100,000 SHA-256 iterations) + 256-bit AES-GCM (96-bit IV)",
        badge: "/vault",
        icon: Lock,
        action: () => {
          onOpenChange(false);
          router.push("/vault");
        },
      },
      {
        id: "cmd-ch2",
        title: "Interactive W3C Web Crypto Inspector",
        meta: "Test client-side PBKDF2 + AES-256-GCM sealing live in your browser",
        badge: "02",
        icon: Lock,
        action: () => jumpToStageAnchor("parallax-stage-1"),
      },
      {
        id: "cmd-ch3",
        title: "Universal Cross-Platform Passkeys",
        meta: "Windows Hello PIN, Android Fingerprint, macOS, iOS, Linux & PWA",
        badge: "03",
        icon: Fingerprint,
        action: () => jumpToStageAnchor("parallax-stage-2"),
      },
      {
        id: "cmd-ch4",
        title: "Protected Shares, Drop Zones & 6-Digit Codes",
        meta: "Burn-After-Read, Time Capsule, Email OTP, Watermarking & 6-Digit Pickup",
        badge: "04",
        icon: Send,
        action: () => jumpToStageAnchor("parallax-stage-3"),
      },
      {
        id: "cmd-ch5",
        title: "2 GB Testing Quota & Upcoming Storage Plans",
        meta: "2 GB free for everyone now • Larger storage pricing updating soon",
        badge: "05",
        icon: Sparkles,
        action: () => jumpToStageAnchor("parallax-stage-4"),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onOpenChange, router]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.meta.toLowerCase().includes(q) ||
        c.badge.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setQuery("");
    }
  }, [open]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0
      );
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-[#020617]/65 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command Palette"
            initial={{ opacity: 0, scale: 0.96, y: -14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={APPLE_SPRING}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-[26px] border border-sky-200/24 bg-[linear-gradient(155deg,rgba(16,33,68,0.92)_0%,rgba(7,15,34,0.94)_100%)] shadow-[inset_0_1px_1.5px_rgba(224,242,254,0.3),0_36px_80px_-16px_rgba(1,4,16,0.9)] backdrop-blur-3xl backdrop-saturate-180"
          >
            <div className="flex items-center gap-3 border-b border-sky-200/14 px-5 py-4">
              <Search className="h-5 w-5 shrink-0 stroke-[1.8] text-sky-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Jump to capabilities, encryption, drive, or sign in..."
                className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-white placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-sky-400/15 hover:text-white"
              >
                <X className="h-4 w-4 stroke-[1.8]" />
              </button>
            </div>

            <div className="max-h-[340px] overflow-y-auto p-2.5">
              {filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">No matching commands</p>
              ) : (
                <ul className="space-y-1">
                  {filtered.map((cmd, idx) => {
                    const active = idx === selectedIndex;
                    const Icon = cmd.icon;
                    return (
                      <li key={cmd.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onClick={cmd.action}
                          className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors ${
                            active
                              ? "border border-sky-400/25 bg-sky-500/20 text-white"
                              : "border border-transparent hover:bg-sky-400/10"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-300/25 bg-sky-950/75 text-sky-300">
                              <Icon className="h-4 w-4 stroke-[1.8]" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[13.5px] font-semibold text-white">
                                {cmd.title}
                              </p>
                              <p className="truncate text-[11.5px] text-slate-300/80">{cmd.meta}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="rounded-md border border-sky-200/15 bg-sky-950/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-200">
                              {cmd.badge}
                            </span>
                            {active && <CornerDownLeft className="h-3.5 w-3.5 text-sky-300" />}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-sky-200/14 bg-[#050C1F]/70 px-5 py-2.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>Esc Close</span>
              </div>
              <span className="font-mono text-[10px] text-sky-300/80">Orbitr Spotlight</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
