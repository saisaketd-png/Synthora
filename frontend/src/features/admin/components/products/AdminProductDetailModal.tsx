"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Package,
  Atom,
  Building2,
  Calendar,
  AlertCircle,
  FileCheck,
  Globe2,
  Boxes,
  Users,
} from "lucide-react";
import { AdminProductDetailResponse } from "../../types";
import { getAdminProduct } from "../../api/adminApi";
import { AdminBadge } from "../AdminBadge";

interface AdminProductDetailModalProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSuppliers?: (productId: string) => void;
}

export function AdminProductDetailModal({
  productId,
  isOpen,
  onClose,
  onOpenSuppliers,
}: AdminProductDetailModalProps) {
  const [detail, setDetail] = useState<AdminProductDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && productId) {
      setIsLoading(true);
      setError(null);
      getAdminProduct(productId)
        .then((res) => setDetail(res))
        .catch((err) => setError(err.message || "Failed to load product specifications"))
        .finally(() => setIsLoading(false));
    } else {
      setDetail(null);
    }
  }, [isOpen, productId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-base">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 id="product-detail-title" className="text-lg font-extrabold text-slate-900">
                {detail?.name || "Product Inspection"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {detail ? `Category: ${detail.category} | CAS: ${detail.casNumber || "N/A"}` : "Loading..."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {isLoading && (
            <div className="space-y-4 py-8">
              <div className="h-6 bg-slate-100 rounded-lg w-1/3 animate-pulse mx-auto" />
              <div className="h-28 bg-slate-50 rounded-2xl animate-pulse" />
              <div className="h-40 bg-slate-50 rounded-2xl animate-pulse" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {detail && !isLoading && (
            <>
              {/* Status Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Catalog Availability & Compliance
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminBadge type={detail.availabilityStatus} />
                    {detail.exportReady && (
                      <AdminBadge type="EXPORT_READY" label="Export Ready" />
                    )}
                    {detail.coaAvailable && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        COA Available
                      </span>
                    )}
                    {detail.msdsAvailable && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                        MSDS Available
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500 font-medium">
                  <p>Base Price: <span className="font-bold text-slate-900">${detail.price.toFixed(2)}</span></p>
                  <p>Stock: <span className="font-bold text-slate-900">{detail.stock} units</span></p>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Atom className="w-4 h-4 text-teal-600" />
                  Chemical & Technical Specifications
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">CAS Number</span>
                    <p className="text-xs font-bold text-slate-900 font-mono mt-0.5">{detail.casNumber || "N/A"}</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Formula</span>
                    <p className="text-xs font-bold text-slate-900 font-mono mt-0.5">{detail.molecularFormula || "N/A"}</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Purity</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{detail.purity || "Standard"}</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Grade</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{detail.grade || "Industrial"}</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Packaging</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{detail.packaging || "Standard Drum"}</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">MOQ (kg)</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{detail.moqKg ? `${detail.moqKg} kg` : "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {detail.description && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Product Description
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                    {detail.description}
                  </p>
                </div>
              )}

              {/* Catalog Ownership & Offerings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5" />
                    Catalog Creator / Seller
                  </div>
                  <p className="text-sm font-bold text-slate-900">{detail.sellerName || "Direct / Synthora Catalog"}</p>
                  <p className="text-xs text-slate-500">{detail.sellerEmail || `Seller ID: ${detail.sellerId}`}</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Users className="w-3.5 h-3.5" />
                      Supplier Offerings
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {detail.supplierCount} offerings
                    </span>
                  </div>
                  {onOpenSuppliers && (
                    <button
                      type="button"
                      onClick={() => onOpenSuppliers(detail.id)}
                      className="w-full mt-1 py-1.5 px-3 bg-white border border-purple-200 text-purple-700 rounded-xl text-xs font-bold hover:bg-purple-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      Manage Supplier Offerings
                    </button>
                  )}
                </div>
              </div>

              {/* Audit Timestamps */}
              <div className="text-[11px] text-slate-400 space-y-0.5 pt-2 border-t border-slate-100">
                <p>Created: {new Date(detail.createdAt).toLocaleString()}</p>
                <p>Last Modified: {new Date(detail.updatedAt).toLocaleString()}</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
