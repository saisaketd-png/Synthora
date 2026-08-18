"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Boxes,
  Building2,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
} from "lucide-react";
import { AdminProductSupplierResponse, ProductSupplierRequest } from "../../types";
import {
  getAdminProductSuppliers,
  updateAdminProductSupplier,
  deleteAdminProductSupplier,
} from "../../api/adminApi";
import { AdminBadge } from "../AdminBadge";
import { AdminConfirmModal } from "../AdminConfirmModal";
import { AdminProductSupplierEditModal } from "./AdminProductSupplierEditModal";

interface AdminProductSupplierModalProps {
  productId: string | null;
  productName?: string;
  isOpen: boolean;
  onClose: () => void;
  onOfferingsChanged?: () => void;
}

export function AdminProductSupplierModal({
  productId,
  productName,
  isOpen,
  onClose,
  onOfferingsChanged,
}: AdminProductSupplierModalProps) {
  const [offerings, setOfferings] = useState<AdminProductSupplierResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal
  const [editingOffering, setEditingOffering] = useState<AdminProductSupplierResponse | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Delete Confirm Modal
  const [deletingOffering, setDeletingOffering] = useState<AdminProductSupplierResponse | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Toast feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchOfferings = async () => {
    if (!productId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminProductSuppliers(productId);
      setOfferings(res);
    } catch (err: any) {
      setError(err.message || "Failed to load supplier offerings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && productId) {
      fetchOfferings();
    } else {
      setOfferings([]);
    }
  }, [isOpen, productId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isEditOpen && !isDeleteOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isEditOpen, isDeleteOpen, onClose]);

  if (!isOpen || !productId) return null;

  const handleSaveOffering = async (
    pId: string,
    sId: number,
    data: ProductSupplierRequest
  ) => {
    await updateAdminProductSupplier(pId, sId, data);
    showFeedback("success", "Supplier offering terms updated. Recorded in audit log.");
    fetchOfferings();
    if (onOfferingsChanged) onOfferingsChanged();
  };

  const handleConfirmDelete = async () => {
    if (!deletingOffering || !productId) return;
    setIsDeleteLoading(true);
    try {
      await deleteAdminProductSupplier(productId, deletingOffering.supplierId);
      showFeedback("success", "Supplier offering removed from product. Recorded in audit log.");
      setIsDeleteOpen(false);
      fetchOfferings();
      if (onOfferingsChanged) onOfferingsChanged();
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to remove supplier offering");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-offerings-title"
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-base">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 id="supplier-offerings-title" className="text-base sm:text-lg font-extrabold text-slate-900">
                Supplier Offerings & Commercial Terms
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[400px]">
                Product: {productName || productId}
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

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Toast */}
          {feedback && (
            <div
              className={`flex items-center gap-3 p-3.5 rounded-2xl border text-xs font-bold shadow-xs ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3 py-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          ) : offerings.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Supplier Offerings Found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No verified or active suppliers have registered commercial terms for this catalog product.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {offerings.map((offering) => (
                <div
                  key={offering.supplierId}
                  className="bg-white p-4.5 rounded-2xl border border-slate-200 hover:border-purple-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {offering.supplierName}
                      </span>
                      <AdminBadge
                        type={offering.supplierVerified ? "VERIFIED" : "UNVERIFIED"}
                        label={offering.supplierVerified ? "Verified" : "Unverified"}
                      />
                      {offering.supplierUserStatus && (
                        <AdminBadge
                          type={offering.supplierUserStatus}
                          label={`Account: ${offering.supplierUserStatus}`}
                        />
                      )}
                      {offering.supplierCountry && (
                        <span className="text-xs font-semibold text-slate-500">
                          📍 {offering.supplierCountry}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 font-medium">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Purity:</span>{" "}
                        {offering.purity || "Standard"}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Grade:</span>{" "}
                        {offering.grade || "Industrial"}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">MOQ:</span>{" "}
                        {offering.moqKg ? `${offering.moqKg} kg` : "N/A"}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Lead Time:</span>{" "}
                        {offering.leadTimeDays ? `${offering.leadTimeDays}d` : "N/A"}
                      </div>
                    </div>

                    {offering.packaging && (
                      <p className="text-[11px] text-slate-500 font-medium">
                        Packaging: {offering.packaging}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOffering(offering);
                        setIsEditOpen(true);
                      }}
                      className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-xl transition-colors border border-purple-200"
                      title="Edit Supplier Terms"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingOffering(offering);
                        setIsDeleteOpen(true);
                      }}
                      className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
                      title="Remove Supplier Offering"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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

      {/* Edit Offering Modal */}
      <AdminProductSupplierEditModal
        productId={productId}
        offering={editingOffering}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingOffering(null);
        }}
        onSave={handleSaveOffering}
      />

      {/* Delete Offering Confirm Modal */}
      <AdminConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingOffering(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleteLoading}
        isDestructive={true}
        title="Remove Supplier Offering"
        message={`Are you sure you want to remove the offering from ${deletingOffering?.supplierName}? This dissociates the supplier from this product but does NOT delete the product or the supplier account.`}
        confirmText="Remove Offering"
      />
    </div>
  );
}
