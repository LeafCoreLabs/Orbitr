"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { UploadModal } from "@/components/drive/UploadModal";
import { QuickTransferModal } from "@/components/drive/QuickTransferModal";
import { SmartStorageCleanerModal } from "@/components/drive/SmartStorageCleanerModal";
import { useQueryClient } from "@tanstack/react-query";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [quickTransferOpen, setQuickTransferOpen] = useState(false);
  const [cleanerOpen, setCleanerOpen] = useState(false);
  const queryClient = useQueryClient();

  // Listen for custom open cleaner event
  React.useEffect(() => {
    const handleOpenCleaner = () => setCleanerOpen(true);
    window.addEventListener("orbitr-open-cleaner", handleOpenCleaner);
    return () => window.removeEventListener("orbitr-open-cleaner", handleOpenCleaner);
  }, []);

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["files"] });
  };

  return (
    <div className="flex min-h-screen bg-[#15171c] text-slate-100">
      <AppSidebar
        onOpenUpload={() => setUploadOpen(true)}
        onOpenQuickTransfer={() => setQuickTransferOpen(true)}
        onOpenCleaner={() => setCleanerOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <TopNavbar onOpenQuickTransfer={() => setQuickTransferOpen(true)} />
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

      <CommandPalette onOpenCleaner={() => setCleanerOpen(true)} />

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
