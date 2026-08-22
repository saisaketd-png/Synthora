"use client";

import { useState } from "react";
import { X, ShieldCheck, FileCheck2, Clock, Send, RefreshCw, AlertCircle, Building2, MapPin, Phone } from "lucide-react";
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
      setError("Please provide both shipping address and billing/procurement contact details.");
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

      window.dispatchEvent(new CustomEvent("rfq-updated", { detail: { rfqId } }));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
      onSuccess(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate purchase order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#DFE1E6] w-full max-w-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#091E42] text-white flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#4C9AFF] uppercase">
                PROCUREMENT COMMITMENT
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white mt-0.5 tracking-tight">
              Issue Formal Purchase Order
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Agreed Commercial Terms Summary (Read-Only Snapshot) */}
          <div className="bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#DFE1E6] pb-2">
              <span className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">
                ACCEPTED QUOTATION SNAPSHOT
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#E3FCEF] text-[#006644] uppercase">
                <ShieldCheck className="w-3 h-3" />
                Agreed Terms
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-[#5E6C84] font-bold uppercase block">Product</span>
                <strong className="font-bold text-[#091E42] truncate block mt-0.5">{productName}</strong>
              </div>

              <div>
                <span className="text-[10px] text-[#5E6C84] font-bold uppercase block">Quantity</span>
                <span className="font-mono font-bold text-[#091E42] block mt-0.5">
                  {quantity.toLocaleString()} {unit.toUpperCase()}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#5E6C84] font-bold uppercase block">Unit Price</span>
                <span className="font-mono font-bold text-[#091E42] block mt-0.5">
                  {currency} {unitPrice.toFixed(2)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#5E6C84] font-bold uppercase block">Total Amount</span>
                <strong className="font-mono font-extrabold text-sm text-[#006644] block mt-0.5">
                  {currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            {leadTimeDays && (
              <div className="text-[11px] text-[#5E6C84] border-t border-[#DFE1E6] pt-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0052CC]" />
                <span>Agreed Fulfillment Lead Time:</span>
                <strong className="text-[#091E42]">{leadTimeDays} business days upon supplier acceptance</strong>
              </div>
            )}
          </div>

          {/* Operational Input Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#172B4D] mb-1">
                Delivery / Shipping Address <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="e.g. Warehouse 4B, 100 Industrial Chemical Logistics Hub, Navi Mumbai, MH 400705"
                className="w-full text-xs rounded-xl border border-[#DFE1E6] p-3 text-[#091E42] bg-[#FAFBFC] focus:bg-white placeholder:text-[#97A0AF] focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#172B4D] mb-1">
                Billing / Procurement Contact <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={billingContact}
                onChange={(e) => setBillingContact(e.target.value)}
                placeholder="e.g. procurement@pharmaholdings.com / +91 98765 43210 (Accounts Dept)"
                className="w-full text-xs rounded-xl border border-[#DFE1E6] p-2.5 text-[#091E42] bg-[#FAFBFC] focus:bg-white placeholder:text-[#97A0AF] focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#172B4D] mb-1">
                Special Logistics / Delivery Notes <span className="text-[#5E6C84] font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Temperature sensitive batch. Receiving dock 8am-4pm. Forklift available on site."
                className="w-full text-xs rounded-xl border border-[#DFE1E6] p-3 text-[#091E42] bg-[#FAFBFC] focus:bg-white placeholder:text-[#97A0AF] focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#DFE1E6]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-[#5E6C84] hover:text-[#091E42] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Purchase Order...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm & Issue Purchase Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
