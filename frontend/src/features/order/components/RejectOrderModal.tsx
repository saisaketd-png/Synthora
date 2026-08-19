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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white border-2 border-slate-900 shadow-2xl max-w-lg w-full p-6 md:p-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-red-600 mb-1">
            CRITICAL ACTION
          </span>
          <h2 className="text-xl font-bold font-mono text-slate-900 tracking-tight">
            REJECT PURCHASE ORDER
          </h2>
          <p className="text-xs font-mono text-slate-500 mt-1">
            Order Reference: <span className="font-bold text-slate-900">{poNumber}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-600 text-xs font-mono text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              rows={4}
              placeholder="Provide a clear, detailed commercial or operational justification (e.g. inability to meet requested lot specifications, regulatory restrictions, or material stock outage)..."
              className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
              disabled={loading}
              required
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-slate-400 font-mono">Minimum 5 characters</span>
              <span className={`text-[10px] font-mono ${reason.length > 1000 ? "text-red-600 font-bold" : "text-slate-400"}`}>
                {reason.length}/1000
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || reason.trim().length < 5}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Purchase Order"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
