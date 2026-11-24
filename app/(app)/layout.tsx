"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { SignOutModal } from "@/components/auth/SignOutModal";
import { PasskeyPromptModal } from "@/components/auth/PasskeyPromptModal";
import { UploadModal } from "@/components/drive/UploadModal";
import { QuickTransferModal } from "@/components/drive/QuickTransferModal";
import { SmartStorageCleanerModal } from "@/components/drive/SmartStorageCleanerModal";
import { Logo } from "@/components/ui/Logo";
import { useQueryClient } from "@tanstack/react-query";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [quickTransferOpen, setQuickTransferOpen] = useState(false);
  const [cleanerOpen, setCleanerOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [passkeyPromptOpen, setPasskeyPromptOpen] = useState(false);
  const queryClient = useQueryClient();

  // Defense-in-depth: Redirect to login immediately if session is unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      const targetUrl = pathname ? `/login?callbackUrl=${encodeURIComponent(pathname)}` : "/login";
      router.replace(targetUrl);
    }
  }, [status, pathname, router]);

  // Listen for custom events (cleaner, signout, passkey prompt)
  React.useEffect(() => {
    const handleOpenCleaner = () => setCleanerOpen(true);
    const handleOpenSignOut = () => setSignOutOpen(true);
    const handleOpenPasskeyPrompt = () => setPasskeyPromptOpen(true);

    window.addEventListener("orbitr-open-cleaner", handleOpenCleaner);
    window.addEventListener("orbitr-open-signout", handleOpenSignOut);
    window.addEventListener("orbitr-open-passkey-prompt", handleOpenPasskeyPrompt);

    // On login or visit: check if user should be prompted to set up Windows PIN / Android Fingerprint passkey
    const checkPasskeyPrompt = async () => {
      try {
        const justLoggedIn = typeof window !== "undefined" && sessionStorage.getItem("orbitr_just_logged_in") === "true";
        const dismissedTime = typeof window !== "undefined" ? localStorage.getItem("orbitr_passkey_prompt_dismissed") : null;
        const isConfigured = typeof window !== "undefined" ? localStorage.getItem("orbitr_passkey_configured") === "true" : false;

        // Skip if already known configured, or if dismissed recently unless just logged in
        if (isConfigured && !justLoggedIn) return;
        if (!justLoggedIn && dismissedTime && Date.now() - Number(dismissedTime) < 5 * 24 * 60 * 60 * 1000) {
          return;
        }

        const res = await fetch("/api/auth/passkey");
        if (!res.ok) return;
        const data = await res.json();
        if (data.authenticated && !data.hasPasskey) {
          // Open prompt after smooth entrance
          setTimeout(() => {
            setPasskeyPromptOpen(true);
          }, 800);
        } else if (data.hasPasskey) {
          localStorage.setItem("orbitr_passkey_configured", "true");
        }
      } catch (err) {
        console.error("[Passkey Check Error]", err);
      } finally {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("orbitr_just_logged_in");
        }
      }
    };

    checkPasskeyPrompt();

    return () => {
      window.removeEventListener("orbitr-open-cleaner", handleOpenCleaner);
      window.removeEventListener("orbitr-open-signout", handleOpenSignOut);
      window.removeEventListener("orbitr-open-passkey-prompt", handleOpenPasskeyPrompt);
    };
  }, []);

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["files"] });
  };

  // Prevent any unauthenticated content flash or layout leak
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#15171c] flex flex-col items-center justify-center p-4 select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <div className="absolute">
            <Logo size="sm" />
          </div>
        </div>
        <p className="mt-4 text-xs font-mono text-slate-400 tracking-wider animate-pulse">
          ESTABLISHING SECURE ORBIT...
        </p>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#15171c] text-slate-100">
      <AppSidebar
        onOpenUpload={() => setUploadOpen(true)}
        onOpenQuickTransfer={() => setQuickTransferOpen(true)}
        onOpenCleaner={() => setCleanerOpen(true)}
        onOpenSignOut={() => setSignOutOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <TopNavbar
          onOpenQuickTransfer={() => setQuickTransferOpen(true)}
          onOpenSignOut={() => setSignOutOpen(true)}
        />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      <MobileBottomNav
        onOpenUpload={() => setUploadOpen(true)}
        onOpenCameraUpload={() => setUploadOpen(true)}
        onOpenNewFolder={() => {
          // Open folder creation
          const event = new CustomEvent("orbitr-new-folder");
          window.dispatchEvent(event);
        }}
      />

      <CommandPalette
        onOpenCleaner={() => setCleanerOpen(true)}
        onOpenSignOut={() => setSignOutOpen(true)}
      />

      <SignOutModal
        isOpen={signOutOpen}
        onClose={() => setSignOutOpen(false)}
      />

      <PasskeyPromptModal
        isOpen={passkeyPromptOpen}
        onClose={() => setPasskeyPromptOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["passkeys"] });
        }}
      />

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
      />

      <QuickTransferModal
        isOpen={quickTransferOpen}
        onClose={() => setQuickTransferOpen(false)}
      />

      <SmartStorageCleanerModal
        isOpen={cleanerOpen}
        onClose={() => setCleanerOpen(false)}
        onCleaned={() => queryClient.invalidateQueries({ queryKey: ["files"] })}
      />
    </div>
  );
}
