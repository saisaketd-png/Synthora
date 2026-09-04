"use client";

import { useState } from "react";

interface RejectOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  poNumber: string;
}

export function RejectOrderModal({
  isOpen,
  onClose,
  onConfirm,
  poNumber,
}: RejectOrderModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setError("Rejection reason must be at least 5 characters.");
      return;
    }
    if (trimmed.length > 1000) {
      setError("Rejection reason cannot exceed 1000 characters.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 backdrop-blur-[2px] p-4">
      <div className="bg-white border border-[#E4E4E7] shadow-tactile-modal rounded-[8px] max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="border-b border-[#E4E4E7] bg-[#FAFAFA] p-4 sm:p-5">
          <span className="block text-[10px] font-mono font-medium uppercase tracking-wider text-[#DC2626] mb-0.5">
            CRITICAL COMMERCIAL ACTION
          </span>
          <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
            Decline Purchase Order
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5 font-mono">
            PO Reference: <strong className="text-[#0F172A]">{poNumber}</strong>
          </p>
        </div>

        {error && (
          <div className="m-4 p-3 bg-[#FEF2F2] border border-[rgba(220,38,38,0.2)] rounded-[6px] text-xs text-[#DC2626]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono mb-1.5">
              Operational Rejection Justification <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              rows={4}
              placeholder="Provide a clear, detailed commercial or operational justification (e.g. inability to meet requested lot specifications, regulatory restrictions, or material stock outage)..."
              className="w-full text-xs rounded-[6px] p-3 bg-white border border-[#E4E4E7] focus:border-[#0052CC] text-[#0F172A] focus:outline-none transition-colors resize-y"
              disabled={loading}
              required
            />
            <div className="flex justify-between items-center mt-1 text-[10px] text-[#64748B] font-mono">
              <span>Minimum 5 characters</span>
              <span className={reason.length > 1000 ? "text-[#DC2626] font-bold" : ""}>
                {reason.length}/1000
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E4E4E7]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-8 px-4 text-xs font-medium text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || reason.trim().length < 5}
              className="h-8 px-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-medium rounded-[6px] shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Confirm Rejection</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
