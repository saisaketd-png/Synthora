"use client";

import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface AdminConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function AdminConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
  children,
}: AdminConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/50 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-lg bg-white rounded-[8px] shadow-tactile-modal border border-[#E4E4E7] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#FAFAFA] border-b border-[#E4E4E7]">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-1.5 rounded-[4px] border ${
                isDestructive
                  ? "bg-[#FEF2F2] text-[#DC2626] border-[rgba(220,38,38,0.2)]"
                  : "bg-[#FFFBEB] text-[#D97706] border-[rgba(217,119,6,0.2)]"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 id="modal-title" className="text-sm font-bold text-[#0F172A]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-[4px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4F4F5] transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3.5 text-xs">
          <p className="text-[#475569] leading-relaxed">{message}</p>
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3 bg-[#FAFAFA] border-t border-[#E4E4E7]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-8 px-3 text-xs font-medium text-[#475569] hover:text-[#0F172A] bg-white border border-[#E4E4E7] rounded-[6px] hover:bg-[#FAFAFA] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center gap-1.5 h-8 px-4 text-xs font-medium text-white rounded-[6px] shadow-xs transition-colors disabled:opacity-50 cursor-pointer active:scale-[0.99] ${
              isDestructive
                ? "bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B]"
                : "bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884]"
            }`}
          >
            {isLoading && (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
