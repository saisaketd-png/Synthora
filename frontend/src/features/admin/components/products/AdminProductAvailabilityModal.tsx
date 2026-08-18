"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldCheck, AlertTriangle } from "lucide-react";
import { AdminProductResponse, ProductAvailability } from "../../types";

interface AdminProductAvailabilityModalProps {
  product: AdminProductResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (productId: string, status: ProductAvailability, reason?: string) => Promise<void>;
}

export function AdminProductAvailabilityModal({
  product,
  isOpen,
  onClose,
  onConfirm,
}: AdminProductAvailabilityModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ProductAvailability>("AVAILABLE");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setSelectedStatus(product.availabilityStatus);
      setReason("");
      setError(null);
    }
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm(product.id, selectedStatus, reason.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to moderate product availability");
    } finally {
      setIsLoading(false);
    }
  };

  const statuses: { status: ProductAvailability; label: string; desc: string; color: string }[] = [
    {
      status: "AVAILABLE",
      label: "AVAILABLE",
      desc: "Product is active and publicly discoverable in the chemical marketplace catalog.",
      color: "border-emerald-300 bg-emerald-50/50",
    },
    {
      status: "OUT_OF_STOCK",
      label: "OUT OF STOCK",
      desc: "Product remains catalog-visible for historical reference, but ordering is temporarily blocked.",
      color: "border-amber-300 bg-amber-50/50",
    },
    {
      status: "HIDDEN",
      label: "HIDDEN",
      desc: "Product is removed from public catalog discovery. Direct links or pending transactions remain accessible.",
      color: "border-slate-300 bg-slate-50/50",
    },
    {
      status: "DISCONTINUED",
      label: "DISCONTINUED",
      desc: "Permanently deactivated from public catalog. Historical transactions and compliance records remain fully preserved.",
      color: "border-rose-300 bg-rose-50/50",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="availability-modal-title"
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="availability-modal-title" className="text-base font-extrabold text-slate-900">
                Moderate Catalog Availability
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[280px]">
                {product.name} (CAS: {product.casNumber || "N/A"})
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

            <div className="space-y-2.5">
              {statuses.map((s) => {
                const isSelected = selectedStatus === s.status;
                return (
                  <label
                    key={s.status}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? `${s.color} ring-2 ring-teal-500/20`
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="availability"
                      value={s.status}
                      checked={isSelected}
                      onChange={() => setSelectedStatus(s.status)}
                      className="mt-1 text-teal-600 focus:ring-teal-500"
                    />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">{s.label}</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Optional Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Moderation Reason (Optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Supplier requested delisting, quality audit pending..."
                className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
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
              disabled={isLoading || selectedStatus === product.availabilityStatus}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Update Availability
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
