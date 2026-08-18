"use client";

import React, { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { AdminPurchaseOrderResponse, CancelAdminPurchaseOrderRequest } from "../../types";

interface AdminOrderCancelModalProps {
  order: AdminPurchaseOrderResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: string, data: CancelAdminPurchaseOrderRequest) => Promise<void>;
}

export function AdminOrderCancelModal({
  order,
  isOpen,
  onClose,
  onConfirm,
}: AdminOrderCancelModalProps) {
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("A cancellation reason is required for administrative purchase order cancellation.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await onConfirm(order.id, { reason: reason.trim() });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to cancel purchase order");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-title"
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="cancel-order-title" className="text-base font-extrabold text-slate-900">
                Cancel Purchase Order
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                PO Number: {order.poNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              Cancelling this purchase order marks the procurement order as CANCELLED. Orders already marked SHIPPED or DELIVERED cannot be cancelled. All financial and shipment records remain preserved in the audit log.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Administrative Cancellation Reason *
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this purchase order is being administratively cancelled..."
                className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Cancel Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
