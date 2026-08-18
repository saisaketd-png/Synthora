"use client";

import { useState } from "react";
import { createOrder, PurchaseOrderResponse } from "../api/createOrder";

interface IssuePoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: PurchaseOrderResponse) => void;
  rfqId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  currency: string;
  leadTimeDays?: number | null;
}

export function IssuePoModal({
  isOpen,
  onClose,
  onSuccess,
  rfqId,
  productName,
  quantity,
  unit,
  unitPrice,
  currency,
  leadTimeDays,
}: IssuePoModalProps) {
  const [shippingAddress, setShippingAddress] = useState("");
  const [billingContact, setBillingContact] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalAmount = quantity * unitPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim() || !billingContact.trim()) {
      setError("Please provide both shipping address and billing contact.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const order = await createOrder({
        rfqId,
        shippingAddress: shippingAddress.trim(),
        billingContact: billingContact.trim(),
        notes: notes.trim() || undefined,
      });

      onSuccess(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to issue purchase order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold tracking-wider text-teal-500 uppercase">
              Procurement Commitment
            </span>
            <h2 className="text-xl font-bold text-white mt-1">
              Issue Formal Purchase Order
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
              {error}
            </div>
          )}

          {/* Agreed Commercial Terms Summary (Read-Only Snapshot) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Commercial Agreement Snapshot
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                Accepted Quotation
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-medium">Product</p>
                <p className="font-semibold text-slate-900 truncate mt-0.5">{productName}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium">Order Quantity</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {quantity.toLocaleString()} {unit}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium">Agreed Unit Price</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {currency} {unitPrice.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium">Total Amount</p>
                <p className="font-bold text-teal-500 mt-0.5">
                  {currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {leadTimeDays && (
              <div className="text-xs text-slate-500 border-t border-slate-200 pt-2 flex items-center gap-1.5">
                <span>⏱ Agreed Lead Time:</span>
                <span className="font-semibold text-slate-700">{leadTimeDays} days upon confirmation</span>
              </div>
            )}
          </div>

          {/* Operational Input Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Delivery / Shipping Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="e.g. Warehouse 4B, 100 Industrial Parkway, Chicago, IL 60601"
                className="w-full text-sm rounded-xl border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Billing / Procurement Contact <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={billingContact}
                onChange={(e) => setBillingContact(e.target.value)}
                placeholder="e.g. procurement@buyercompany.com or +1 312 555 0199"
                className="w-full text-sm rounded-xl border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Special Logistics / Delivery Notes <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Receiving hours Mon-Fri 8am-4pm. Forklift available on site."
                className="w-full text-sm rounded-xl border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-teal-500 hover:bg-[#149f99] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Issuing PO...</span>
                </>
              ) : (
                <span>Confirm & Issue PO</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
