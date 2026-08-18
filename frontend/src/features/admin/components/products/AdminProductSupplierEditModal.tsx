"use client";

import React, { useState, useEffect } from "react";
import { X, Edit2, AlertTriangle } from "lucide-react";
import { AdminProductSupplierResponse, ProductSupplierRequest } from "../../types";

interface AdminProductSupplierEditModalProps {
  productId: string | null;
  offering: AdminProductSupplierResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (productId: string, supplierId: number, data: ProductSupplierRequest) => Promise<void>;
}

export function AdminProductSupplierEditModal({
  productId,
  offering,
  isOpen,
  onClose,
  onSave,
}: AdminProductSupplierEditModalProps) {
  const [formData, setFormData] = useState<ProductSupplierRequest>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (offering) {
      setFormData({
        purity: offering.purity || "",
        grade: offering.grade || "",
        moqKg: offering.moqKg || 0,
        packaging: offering.packaging || "",
        leadTimeDays: offering.leadTimeDays || 0,
        coaAvailable: Boolean(offering.coaAvailable),
        msdsAvailable: Boolean(offering.msdsAvailable),
      });
      setError(null);
    }
  }, [offering]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !offering || !productId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onSave(productId, offering.supplierId, formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update supplier offering");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-offering-title"
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="edit-offering-title" className="text-base font-extrabold text-slate-900">
                Edit Supplier Offering
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Supplier: {offering.supplierName} (ID: {offering.supplierId})
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
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Purity Specification
                </label>
                <input
                  type="text"
                  value={formData.purity || ""}
                  onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                  placeholder="e.g. >= 99.8%"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Grade
                </label>
                <input
                  type="text"
                  value={formData.grade || ""}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="e.g. Pharmaceutical"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  MOQ (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.moqKg ?? 0}
                  onChange={(e) => setFormData({ ...formData, moqKg: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lead Time (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.leadTimeDays ?? 0}
                  onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Packaging Options
                </label>
                <input
                  type="text"
                  value={formData.packaging || ""}
                  onChange={(e) => setFormData({ ...formData, packaging: e.target.value })}
                  placeholder="e.g. 25kg Bags, 1000L IBC"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.coaAvailable)}
                  onChange={(e) => setFormData({ ...formData, coaAvailable: e.target.checked })}
                  className="rounded-sm text-teal-600 focus:ring-teal-500"
                />
                <span>COA Available</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.msdsAvailable)}
                  onChange={(e) => setFormData({ ...formData, msdsAvailable: e.target.checked })}
                  className="rounded-sm text-teal-600 focus:ring-teal-500"
                />
                <span>MSDS Available</span>
              </label>
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
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Save Offering
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
