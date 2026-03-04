import React from "react";
import { AlertCircle, X } from "lucide-react";

export default function QuotaRequiredPopup({ open, onClose, title, message }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-[0_20px_60px_rgba(0,0,0,0.3)] ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 bg-gradient-to-r from-card via-card to-card/90 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 min-w-0">
            <span className="h-8 w-8 rounded-lg bg-[#FFAA00]/20 text-[#8a5a00] dark:text-[#FFCC66] inline-flex items-center justify-center">
              <AlertCircle className="h-4.5 w-4.5" />
            </span>
            <h3 className="text-base font-semibold text-[#232323] dark:text-white truncate">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-md inline-flex items-center justify-center text-[#232323]/60 dark:text-white/60 hover:bg-[#232323]/5 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm leading-relaxed text-[#232323]/75 dark:text-white/75">{message}</p>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 rounded-lg bg-[#FFAA00] hover:bg-[#F4A200] text-[#232323] text-sm font-semibold transition-all duration-200"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
