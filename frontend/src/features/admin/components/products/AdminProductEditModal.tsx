"use client";

import React, { useState, useEffect } from "react";
import { X, Edit3, AlertTriangle } from "lucide-react";
import { AdminProductResponse, UpdateAdminProductRequest } from "../../types";

interface AdminProductEditModalProps {
  product: AdminProductResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: UpdateAdminProductRequest) => Promise<void>;
}

export function AdminProductEditModal({
  product,
  isOpen,
  onClose,
  onSave,
}: AdminProductEditModalProps) {
  const [formData, setFormData] = useState<UpdateAdminProductRequest>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price || 0,
        stock: product.stock || 0,
        category: product.category || "",
        casNumber: product.casNumber || "",
        molecularFormula: product.molecularFormula || "",
        purity: product.purity || "",
        grade: product.grade || "",
        packaging: product.packaging || "",
        moqKg: product.moqKg || 0,
        leadTimeDays: product.leadTimeDays || 0,
        coaAvailable: Boolean(product.coaAvailable),
        msdsAvailable: Boolean(product.msdsAvailable),
        exportReady: Boolean(product.exportReady),
        availabilityStatus: product.availabilityStatus,
      });
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
      await onSave(product.id, formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update product specifications");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-product-title"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="edit-product-title" className="text-base font-extrabold text-slate-900">
                Edit Product Metadata
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Product ID: {product.id}
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
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  value={formData.category || ""}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  CAS Number
                </label>
                <input
                  type="text"
                  value={formData.casNumber || ""}
                  onChange={(e) => setFormData({ ...formData, casNumber: e.target.value })}
                  placeholder="e.g. 50-00-0"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price ?? 0}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Stock (Units) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.stock ?? 0}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Molecular Formula
                </label>
                <input
                  type="text"
                  value={formData.molecularFormula || ""}
                  onChange={(e) => setFormData({ ...formData, molecularFormula: e.target.value })}
                  placeholder="e.g. CH2O"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Purity
                </label>
                <input
                  type="text"
                  value={formData.purity || ""}
                  onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                  placeholder="e.g. 99.5%"
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
                  placeholder="e.g. USP, ACS, Industrial"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Packaging
                </label>
                <input
                  type="text"
                  value={formData.packaging || ""}
                  onChange={(e) => setFormData({ ...formData, packaging: e.target.value })}
                  placeholder="e.g. 200L Drum"
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
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Compliance Checkboxes */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
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

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.exportReady)}
                  onChange={(e) => setFormData({ ...formData, exportReady: e.target.checked })}
                  className="rounded-sm text-teal-600 focus:ring-teal-500"
                />
                <span>Export Ready</span>
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
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Save Specifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
