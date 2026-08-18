"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  Building2,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Boxes,
  User,
  History,
  Lock,
} from "lucide-react";
import { AdminRfqDetailResponse, AdminQuotationSummary } from "../../types";
import { getAdminRfq } from "../../api/adminApi";
import { AdminBadge } from "../AdminBadge";

interface AdminRfqDetailModalProps {
  rfqId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminRfqDetailModal({
  rfqId,
  isOpen,
  onClose,
}: AdminRfqDetailModalProps) {
  const [detail, setDetail] = useState<AdminRfqDetailResponse | null>(null);
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
    if (isOpen && rfqId) {
      setIsLoading(true);
      setError(null);
      getAdminRfq(rfqId)
        .then((res) => setDetail(res))
        .catch((err) => setError(err.message || "Failed to load RFQ details"))
        .finally(() => setIsLoading(false));
    } else {
      setDetail(null);
    }
  }, [isOpen, rfqId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rfq-detail-title"
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-base">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 id="rfq-detail-title" className="text-base sm:text-lg font-extrabold text-slate-900">
                RFQ Operational Details
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {detail ? `RFQ ID: ${detail.id}` : "Loading..."}
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
              {/* Status and Summary Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Lifecycle Status
                  </span>
                  <div className="flex items-center gap-2">
                    <AdminBadge type={detail.status} />
                    {detail.acceptedQuotationId && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Quotation Accepted
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500 font-medium">
                  <p>
                    Requested Volume:{" "}
                    <span className="font-extrabold text-slate-900 text-sm">
                      {detail.quantity} {detail.unit}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Product: {detail.productName || detail.productId}
                  </p>
                </div>
              </div>

              {/* Parties / Transactors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-100 bg-white space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5" />
                    Buyer Identity
                  </div>
                  <p className="text-sm font-bold text-slate-900">{detail.buyerName || "Buyer"}</p>
                  <p className="text-xs text-slate-500">{detail.buyerEmail || `ID: ${detail.buyerId}`}</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-100 bg-white space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5" />
                    Target Supplier
                  </div>
                  <p className="text-sm font-bold text-slate-900">{detail.supplierName || "Supplier"}</p>
                  <p className="text-xs text-slate-500">Supplier ID: {detail.supplierId}</p>
                </div>
              </div>

              {/* Inquired Message */}
              {detail.message && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Buyer Requirement Message
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                    {detail.message}
                  </p>
                </div>
              )}

              {/* Immutable Quotation Revision History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <History className="w-4 h-4 text-amber-600" />
                    Quotation Revision History ({detail.quotations?.length || 0})
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3" />
                    Immutable Commercial Records
                  </span>
                </div>

                {!detail.quotations || detail.quotations.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500">
                    No supplier quotations submitted for this inquiry yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {detail.quotations.map((q: AdminQuotationSummary) => {
                      const isAccepted = detail.acceptedQuotationId === q.id;
                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isAccepted
                              ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-500/20"
                              : "bg-white border-slate-200"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                                Version {q.quotationVersion}
                              </span>
                              {isAccepted && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                  Accepted Revision
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-extrabold text-slate-900">
                              {q.currency} ${q.unitPrice.toFixed(2)} / unit
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 font-medium">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">MOQ:</span>{" "}
                              {q.minimumOrderQuantity ? `${q.minimumOrderQuantity} units` : "None"}
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Lead Time:</span>{" "}
                              {q.leadTimeDays ? `${q.leadTimeDays} days` : "Standard"}
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Validity:</span>{" "}
                              {new Date(q.validityDate).toLocaleDateString()}
                            </div>
                          </div>

                          {q.packagingDetails && (
                            <p className="text-[11px] text-slate-500 font-medium mt-1.5">
                              Packaging: {q.packagingDetails}
                            </p>
                          )}

                          {q.commercialNotes && (
                            <p className="text-[11px] text-slate-600 bg-slate-50/60 p-2 rounded-lg border border-slate-100 mt-2">
                              Notes: {q.commercialNotes}
                            </p>
                          )}

                          <p className="text-[10px] text-slate-400 font-mono mt-2">
                            Submitted: {new Date(q.createdAt).toLocaleString()} | ID: {q.id}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Audit Timestamps */}
              <div className="text-[11px] text-slate-400 space-y-0.5 pt-2 border-t border-slate-100">
                <p>Inquiry Initiated: {new Date(detail.createdAt).toLocaleString()}</p>
                <p>Last Lifecycle Event: {new Date(detail.updatedAt).toLocaleString()}</p>
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
