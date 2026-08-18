"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShoppingCart,
  Building2,
  Calendar,
  AlertCircle,
  Truck,
  User,
  MapPin,
  FileText,
  DollarSign,
  PackageCheck,
  Lock,
} from "lucide-react";
import { AdminPurchaseOrderDetailResponse } from "../../types";
import { getAdminOrder } from "../../api/adminApi";
import { AdminBadge } from "../AdminBadge";

interface AdminPurchaseOrderDetailModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPurchaseOrderDetailModal({
  orderId,
  isOpen,
  onClose,
}: AdminPurchaseOrderDetailModalProps) {
  const [detail, setDetail] = useState<AdminPurchaseOrderDetailResponse | null>(null);
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
    if (isOpen && orderId) {
      setIsLoading(true);
      setError(null);
      getAdminOrder(orderId)
        .then((res) => setDetail(res))
        .catch((err) => setError(err.message || "Failed to load purchase order details"))
        .finally(() => setIsLoading(false));
    } else {
      setDetail(null);
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold text-base">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 id="order-detail-title" className="text-base sm:text-lg font-extrabold text-slate-900">
                Purchase Order Details
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {detail ? `PO Number: ${detail.poNumber}` : "Loading..."}
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
              {/* Order Status & Financials */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Fulfillment Status
                  </span>
                  <div className="flex items-center gap-2">
                    <AdminBadge type={detail.status} />
                    {detail.confirmedAt && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                        Confirmed by Supplier
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Total Contract Value
                  </span>
                  <p className="text-xl font-extrabold text-slate-900">
                    {detail.currency} ${detail.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {detail.quantity} {detail.unit} @ ${detail.unitPrice.toFixed(2)} / unit
                  </p>
                </div>
              </div>

              {/* Transactors & Product */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-100 bg-white space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5" />
                    Buyer Entity
                  </div>
                  <p className="text-sm font-bold text-slate-900">{detail.buyerName || "Buyer"}</p>
                  <p className="text-xs text-slate-500">{detail.buyerEmail || `ID: ${detail.buyerId}`}</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-100 bg-white space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5" />
                    Fulfilling Supplier
                  </div>
                  <p className="text-sm font-bold text-slate-900">{detail.supplierName || "Supplier"}</p>
                  <p className="text-xs text-slate-500">Supplier ID: {detail.supplierId}</p>
                </div>
              </div>

              {/* Shipping & Billing Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-100 bg-white space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    Shipping Destination Address
                  </div>
                  <p className="text-xs font-medium text-slate-700 leading-relaxed">
                    {detail.shippingAddress}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-100 bg-white space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <FileText className="w-3.5 h-3.5" />
                    Billing Contact & References
                  </div>
                  <p className="text-xs font-medium text-slate-700 leading-relaxed">
                    {detail.billingContact}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    RFQ: {detail.rfqId.substring(0, 8)}... | Quote: {detail.quotationId.substring(0, 8)}...
                  </p>
                </div>
              </div>

              {/* Notes */}
              {detail.notes && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Commercial / Shipping Notes
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                    {detail.notes}
                  </p>
                </div>
              )}

              {/* Read-Only Shipment Tracking Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Truck className="w-4 h-4 text-sky-600" />
                    Shipment & Logistics Record
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3" />
                    Read-Only Tracking Record
                  </span>
                </div>

                {!detail.shipment ? (
                  <div className="p-5 text-center rounded-2xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500">
                    No shipment registered yet by the fulfilling supplier.
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-sky-50/40 border border-sky-200/80 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Carrier</span>
                        <p className="font-bold text-slate-900 mt-0.5">{detail.shipment.carrier}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Tracking Number</span>
                        <p className="font-bold text-slate-900 font-mono mt-0.5">{detail.shipment.trackingNumber}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Dispatched At</span>
                        <p className="font-medium text-slate-700 mt-0.5">
                          {new Date(detail.shipment.shippedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Est. Delivery</span>
                        <p className="font-medium text-slate-700 mt-0.5">
                          {detail.shipment.estimatedDeliveryDate
                            ? new Date(detail.shipment.estimatedDeliveryDate).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Audit Timestamps */}
              <div className="text-[11px] text-slate-400 space-y-0.5 pt-2 border-t border-slate-100">
                <p>Order Placed: {new Date(detail.placedAt || detail.createdAt).toLocaleString()}</p>
                {detail.confirmedAt && (
                  <p>Order Confirmed: {new Date(detail.confirmedAt).toLocaleString()}</p>
                )}
                <p>Last Event: {new Date(detail.updatedAt).toLocaleString()}</p>
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
