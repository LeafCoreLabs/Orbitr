"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let globalToast: ToastContextType | null = null;

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const contextValue: ToastContextType = {
    toast: addToast,
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
  };

  globalToast = contextValue;

  return (
    <ToastContext.Provider value={contextValue}>
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-[inset_0_1px_1px_rgba(224,242,254,0.25),0_22px_48px_-12px_rgba(1,4,16,0.85)] border text-xs backdrop-blur-3xl",
                t.type === "success" &&
                  "bg-[#0A1838]/92 border-emerald-400/35 text-emerald-100",
                t.type === "error" &&
                  "bg-[#1F0B18]/92 border-rose-400/35 text-rose-100",
                t.type === "info" &&
                  "bg-[#0A1838]/92 border-sky-200/25 text-slate-100"
              )}
            >
              <div className="flex items-center gap-3">
                {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                {t.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                {t.type === "info" && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
                <span className="font-medium">{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="opacity-70 hover:opacity-100 transition-opacity p-1"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const toast = {
  success: (msg: string) => globalToast?.success(msg),
  error: (msg: string) => globalToast?.error(msg),
  info: (msg: string) => globalToast?.info(msg),
};
