import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
} from 'lucide-react';
import { useCloudStore } from '@/context/CloudStore';
import { APPLE_SPRING } from '@/lib/motion';

interface CommandOption {
  id: string;
  title: string;
  meta: string;
  badge: string;
  icon: React.ElementType;
  action: () => void;
}

export function SpotlightSearch() {
  const { spotlightOpen, setSpotlightOpen, setStage } = useCloudStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const jumpToStageAnchor = (anchorId: string) => {
    setSpotlightOpen(false);
    setStage('landing');
    window.setTimeout(() => {
      document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const commands = useMemo<CommandOption[]>(
    () => [
      {
        id: 'cmd-signup',
        title: 'Claim 2 GB Free Storage',
        meta: 'Create your Aether Cloud+ account during the public testing phase',
        badge: '/signup',
        icon: UserPlus,
        action: () => {
          setSpotlightOpen(false);
          setStage('signup');
        },
      },
      {
        id: 'cmd-login',
        title: 'Sign In to Aether Cloud+',
        meta: 'Authenticate via Google OAuth, FIDO2 Passkey, or Email / @handle',
        badge: '/login',
        icon: KeyRound,
        action: () => {
          setSpotlightOpen(false);
          setStage('login');
        },
      },
      {
        id: 'cmd-ch1',
        title: 'Platform Overview & Modules',
        meta: 'Cloud Drive (/drive), Vault (/vault), Drop Zones (/d), and Quick Transfer (/t)',
        badge: '01',
        icon: HardDrive,
        action: () => jumpToStageAnchor('parallax-stage-0'),
      },
      {
        id: 'cmd-ch2',
        title: 'Zero-Knowledge W3C Web Crypto',
        meta: 'PBKDF2 (100,000 SHA-256 iterations) + 256-bit AES-GCM (96-bit IV)',
        badge: '02',
        icon: Lock,
        action: () => jumpToStageAnchor('parallax-stage-1'),
      },
      {
        id: 'cmd-ch3',
        title: 'Universal Cross-Platform Passkeys',
        meta: 'Windows Hello PIN, Android Fingerprint, macOS, iOS, Linux & PWA',
        badge: '03',
        icon: Fingerprint,
        action: () => jumpToStageAnchor('parallax-stage-2'),
      },
      {
        id: 'cmd-ch4',
        title: 'Protected Shares, Drop Zones & 6-Digit Codes',
        meta: 'Burn-After-Read, Time Capsule, Email OTP, Watermarking & 6-Digit Pickup',
        badge: '04',
        icon: Send,
        action: () => jumpToStageAnchor('parallax-stage-3'),
      },
      {
        id: 'cmd-ch5',
        title: '2 GB Testing Quota & Upcoming Storage Plans',
        meta: '2 GB free for everyone now • Larger storage pricing updating soon',
        badge: '05',
        icon: Sparkles,
        action: () => jumpToStageAnchor('parallax-stage-4'),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setSpotlightOpen, setStage]
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
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSpotlightOpen(!spotlightOpen);
      } else if (e.key === 'Escape' && spotlightOpen) {
        setSpotlightOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [spotlightOpen, setSpotlightOpen]);

  useEffect(() => {
    if (spotlightOpen) {
      setSelectedIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setQuery('');
    }
  }, [spotlightOpen]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0
      );
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    }
  };

  return (
    <AnimatePresence>
      {spotlightOpen && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSpotlightOpen(false)}
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command Palette"
            initial={{ opacity: 0, scale: 0.96, y: -14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={APPLE_SPRING}
            className="liquid-glass-rim relative z-10 w-full max-w-xl overflow-hidden rounded-[38px] bg-indigo-950/65 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.78),0_36px_80px_-16px_rgba(8,5,28,0.78)] backdrop-blur-[24px] backdrop-saturate-[190%]"
          >
            <div className="flex items-center gap-3 border-b border-white/30 px-5 py-4">
              <Search className="h-5 w-5 shrink-0 stroke-[1.9] text-white" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Jump to capabilities, encryption, plans, or sign in..."
                className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-white placeholder:text-white/65 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSpotlightOpen(false)}
                className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4 stroke-[1.9]" />
              </button>
            </div>

            <div className="max-h-[340px] overflow-y-auto p-2.5">
              {filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-white/80">No matching commands</p>
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
                              ? 'border border-white/55 bg-white/25 text-white'
                              : 'border border-transparent hover:bg-white/15'
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/50 bg-white/22 text-white">
                              <Icon className="h-4 w-4 stroke-[1.8]" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[13.5px] font-semibold text-white">
                                {cmd.title}
                              </p>
                              <p className="truncate text-[11.5px] text-white/80">{cmd.meta}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="rounded-full border border-white/45 bg-white/20 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                              {cmd.badge}
                            </span>
                            {active && <CornerDownLeft className="h-3.5 w-3.5 text-white" />}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/30 bg-white/12 px-5 py-2.5 text-[11px] text-white/85">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="rounded border border-white/45 bg-white/20 px-1.5 py-0.5 font-mono text-[10px] text-white">
                    ↑↓
                  </kbd>{' '}
                  Navigate
                </span>
                <span>
                  <kbd className="rounded border border-white/45 bg-white/20 px-1.5 py-0.5 font-mono text-[10px] text-white">
                    ↵
                  </kbd>{' '}
                  Select
                </span>
              </div>
              <span className="font-mono text-[10.5px] text-white/85">Ctrl+K / ⌘K</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
