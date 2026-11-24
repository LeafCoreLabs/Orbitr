"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MotionCard } from "@/components/ui/MotionCard";
import {
  Folder,
  File as FileIcon,
  Search,
  Grid,
  List,
  FolderPlus,
  Trash2,
  Share2,
  Download,
  Eye,
  MoreVertical,
  ChevronRight,
  Upload,
  ArrowUpDown,
  Zap,
  Sparkles,
} from "lucide-react";
import { formatBytes, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import { ShareModal } from "@/components/drive/ShareModal";
import { QuickTransferModal } from "@/components/drive/QuickTransferModal";
import { FilePreviewModal } from "@/components/drive/FilePreviewModal";

interface FileItem {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
  folderId: string | null;
  sha256: string;
  isEncrypted: boolean;
}

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export default function DrivePage() {
  const queryClient = useQueryClient();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderBreadcrumbs, setFolderBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "Home" },
  ]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("date_desc");
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  // Modals state
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [quickTransferFile, setQuickTransferFile] = useState<FileItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Deletion state
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);
  const [fileToDelete, setFileToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  // Listen for mobile bottom nav custom event
  React.useEffect(() => {
    const handleEvent = () => setNewFolderOpen(true);
    window.addEventListener("orbitr-new-folder", handleEvent);
    window.addEventListener("vaulta-new-folder", handleEvent);
    return () => {
      window.removeEventListener("orbitr-new-folder", handleEvent);
      window.removeEventListener("vaulta-new-folder", handleEvent);
    };
  }, []);

  // Fetch drive files and folders
  const { data, isLoading } = useQuery({
    queryKey: ["files", currentFolderId, searchQuery, filterType, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentFolderId) params.set("folderId", currentFolderId);
      if (searchQuery) params.set("q", searchQuery);
      if (filterType) params.set("type", filterType);
      if (sortOrder) params.set("sort", sortOrder);

      const res = await fetch(`/api/files?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load files");
      return res.json();
    },
  });

  const filesList: FileItem[] = data?.files || [];
  const foldersList: FolderItem[] = data?.folders || [];

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          parentId: currentFolderId,
          isVault: false,
        }),
      });
      if (!res.ok) throw new Error("Failed to create folder");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Folder created!");
      setNewFolderOpen(false);
      setNewFolderName("");
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Error creating folder");
    },
  });

  // Bulk trash mutation
  const bulkTrashMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/files/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trash", fileIds: ids }),
      });
      if (!res.ok) throw new Error("Bulk action failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Files moved to trash");
      setSelectedFileIds([]);
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  const enterFolder = (f: FolderItem) => {
    setCurrentFolderId(f.id);
    setFolderBreadcrumbs((prev) => [...prev, { id: f.id, name: f.name }]);
  };

  const jumpToBreadcrumb = (index: number) => {
    const target = folderBreadcrumbs[index];
    setCurrentFolderId(target.id);
    setFolderBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  const toggleSelectFile = (id: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedFileIds.length === filesList.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(filesList.map((f) => f.id));
    }
  };

  const handleDownloadFile = async (f: FileItem) => {
    try {
      const res = await fetch(`/api/files/${f.id}/download`);
      const data = await res.json();
      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      } else {
        toast.error("Download URL generation failed");
      }
    } catch {
      toast.error("Download failed");
    }
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    try {
      setDeletingItem(true);
      const res = await fetch(`/api/folders/${folderToDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete folder");
      toast.success(`Folder "${folderToDelete.name}" moved to trash`);
      if (currentFolderId === folderToDelete.id) {
        jumpToBreadcrumb(0);
      }
      queryClient.invalidateQueries({ queryKey: ["files"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting folder";
      toast.error(msg);
    } finally {
      setDeletingItem(false);
      setFolderToDelete(null);
    }
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    try {
      setDeletingItem(true);
      const res = await fetch(`/api/files/${fileToDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete file");
      toast.success(`File "${fileToDelete.name}" moved to trash`);
      queryClient.invalidateQueries({ queryKey: ["files"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting file";
      toast.error(msg);
    } finally {
      setDeletingItem(false);
      setFileToDelete(null);
    }
  };

  const handleSoftDelete = (file: { id: string; name: string }) => {
    setFileToDelete(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Breadcrumbs & Search & Tools */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#262a34]">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-sm font-medium">
          {folderBreadcrumbs.map((b, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              <button
                onClick={() => jumpToBreadcrumb(idx)}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap text-xs font-semibold ${
                  idx === folderBreadcrumbs.length - 1
                    ? "text-indigo-300 bg-[#1b1930] border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {b.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neu-inset rounded-xl px-3 py-1.5 pl-8 text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none w-36 sm:w-48"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Sort Menu */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="neu-btn rounded-xl px-2.5 py-1.5 text-xs text-slate-200 bg-[#1c1f26] focus:outline-none cursor-pointer"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="size_desc">Largest Size</option>
          </select>

          {/* View switcher */}
          <div className="flex items-center neu-inset rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "grid" ? "neu-btn text-indigo-400 font-bold" : "text-slate-500"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "list" ? "neu-btn text-indigo-400 font-bold" : "text-slate-500"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Create Folder Button */}
          <button
            onClick={() => setNewFolderOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-btn text-xs font-semibold text-slate-200 cursor-pointer active:scale-95"
          >
            <FolderPlus className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">New Folder</span>
          </button>

          {/* Delete Current Subfolder Button */}
          {currentFolderId && (
            <button
              onClick={() => {
                const currentName = folderBreadcrumbs[folderBreadcrumbs.length - 1]?.name || "this folder";
                setFolderToDelete({ id: currentFolderId, name: currentName });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-btn text-xs font-semibold text-rose-400 hover:text-rose-300 cursor-pointer active:scale-95"
              title="Delete this folder"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Delete Folder</span>
            </button>
          )}
        </div>
      </div>

      {/* Smart Quick Filter & Cleaner Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
        <div className="flex items-center gap-1.5 p-1 rounded-xl neu-inset">
          <button
            onClick={() => setFilterType("")}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              filterType === "" ? "neu-flat text-indigo-300 bg-[#1c1f26]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Files
          </button>
          <button
            onClick={() => setFilterType("image")}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              filterType === "image" ? "neu-flat text-indigo-300 bg-[#1c1f26]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Images
          </button>
          <button
            onClick={() => setFilterType("pdf")}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              filterType === "pdf" ? "neu-flat text-indigo-300 bg-[#1c1f26]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setFilterType("video")}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              filterType === "video" ? "neu-flat text-indigo-300 bg-[#1c1f26]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Videos
          </button>
        </div>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent("orbitr-open-cleaner"))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-btn text-xs font-semibold text-amber-800 bg-amber-50/60 cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Clean Storage & Duplicates</span>
        </button>
      </div>

      {/* Multi-Selection Banner */}
      {selectedFileIds.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs shadow-md">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-300">
              {selectedFileIds.length} item(s) selected
            </span>
            <button onClick={selectAll} className="text-slate-400 hover:text-slate-200 underline ml-2 cursor-pointer">
              Select all
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => bulkTrashMutation.mutate(selectedFileIds)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Move Selected to Trash</span>
            </button>
          </div>
        </div>
      )}

      {/* Folders Section */}
      {foldersList.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Folders
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {foldersList.map((folder) => (
              <motion.div
                key={folder.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => enterFolder(folder)}
                className="flex items-center justify-between gap-2 p-3.5 rounded-xl neu-btn cursor-pointer transition-shadow select-none group relative"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Folder className="w-5 h-5 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {folder.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFolderToDelete({ id: folder.id, name: folder.name });
                  }}
                  title="Delete folder"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg neu-btn text-slate-400 hover:text-rose-400 transition-all cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Files ({filesList.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="py-24 text-center text-xs text-slate-500 space-y-2">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading files securely...</p>
          </div>
        ) : filesList.length === 0 ? (
          <div className="py-20 text-center rounded-2xl neu-inset p-8 space-y-3">
            <div className="w-12 h-12 rounded-full neu-flat flex items-center justify-center text-slate-400 mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-200">This folder is empty</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload files directly or drag and drop files onto the screen.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filesList.map((file) => {
              const isSelected = selectedFileIds.includes(file.id);
              return (
                <MotionCard
                  key={file.id}
                  tiltMaxAngle={6}
                  className={`group relative flex flex-col justify-between p-4 rounded-xl transition-all select-none ${
                    isSelected
                      ? "bg-blue-50/80 border border-blue-400 shadow-md"
                      : "neu-convex hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectFile(file.id)}
                      className="rounded border-slate-700 text-blue-500 focus:ring-0 w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPreviewFile(file)}
                        title="Preview file"
                        className="p-1 rounded text-slate-500 hover:text-blue-600"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setShareFile(file)}
                        title="Share file"
                        className="p-1 rounded text-slate-500 hover:text-emerald-600"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div
                    onClick={() => setPreviewFile(file)}
                    className="py-5 flex flex-col items-center justify-center cursor-pointer"
                  >
                    <FileIcon className="w-10 h-10 text-indigo-400 mb-2 group-hover:scale-110 transition-transform drop-shadow-xs" />
                    <span className="text-xs font-semibold text-slate-100 text-center line-clamp-2 max-w-full break-words">
                      {file.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    <span className="font-mono font-medium">{formatBytes(file.sizeBytes)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setQuickTransferFile(file)}
                        title="Quick Transfer to phone"
                        className="p-1 rounded hover:text-blue-600"
                      >
                        <Zap className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownloadFile(file)}
                        title="Download"
                        className="p-1 rounded hover:text-blue-600"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleSoftDelete({ id: file.id, name: file.name })}
                        title="Move to trash"
                        className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </MotionCard>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="neu-flat rounded-2xl overflow-hidden divide-y divide-slate-300/60">
            {filesList.map((file) => {
              const isSelected = selectedFileIds.includes(file.id);
              return (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-3.5 hover:bg-slate-300/30 transition-colors select-none ${
                    isSelected ? "bg-blue-100/40" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectFile(file.id)}
                      className="rounded border-slate-700 text-blue-500 focus:ring-0 w-4 h-4 accent-blue-600"
                    />
                    <FileIcon className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span
                      onClick={() => setPreviewFile(file)}
                      className="text-xs font-medium text-slate-100 truncate cursor-pointer hover:underline"
                    >
                      {file.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
                    <span className="hidden sm:inline">{formatDate(file.createdAt)}</span>
                    <span className="font-mono w-20 text-right">{formatBytes(file.sizeBytes)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewFile(file)}
                        title="Preview"
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShareFile(file)}
                        title="Share"
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadFile(file)}
                        title="Download"
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSoftDelete({ id: file.id, name: file.name })}
                        title="Move to trash"
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      {newFolderOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#15171c]/95 border border-[#22252e] rounded-2xl p-6 shader-card shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Create New Folder</h3>
            <input
              type="text"
              placeholder="Folder Name"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full neu-inset rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setNewFolderOpen(false)}
                className="neu-btn px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => createFolderMutation.mutate(newFolderName)}
                disabled={!newFolderName.trim()}
                className="neu-btn-primary px-4 py-1.5 text-xs text-white font-medium rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Folders and Files */}
      {(folderToDelete || fileToDelete) && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#15171c]/95 border border-[#262a34] rounded-2xl p-6 shader-card shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  {folderToDelete ? "Move Folder to Trash?" : "Move File to Trash?"}
                </h3>
                <p className="text-xs text-slate-400">
                  {folderToDelete
                    ? "Items inside this folder will also be moved to trash."
                    : "You can restore this file anytime from Trash."}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl neu-inset text-xs font-mono font-semibold text-slate-200 truncate border border-white/[0.04]">
              {folderToDelete ? folderToDelete.name : fileToDelete?.name}
            </div>

            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setFolderToDelete(null);
                  setFileToDelete(null);
                }}
                disabled={deletingItem}
                className="neu-btn px-4 py-2 text-xs text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={folderToDelete ? confirmDeleteFolder : confirmDeleteFile}
                disabled={deletingItem}
                className="px-4 py-2 text-xs bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                {deletingItem ? "Moving to Trash..." : "Move to Trash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={Boolean(shareFile)}
        onClose={() => setShareFile(null)}
        fileId={shareFile?.id}
        fileName={shareFile?.name}
      />

      {/* Quick Transfer Modal */}
      <QuickTransferModal
        isOpen={Boolean(quickTransferFile)}
        onClose={() => setQuickTransferFile(null)}
        fileId={quickTransferFile?.id}
        fileName={quickTransferFile?.name}
      />

      {/* Preview Modal */}
      <FilePreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
        onDelete={(f) => handleSoftDelete(f)}
      />
    </div>
  );
}
