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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0F172A]/50 backdrop-blur-[2px] overflow-y-auto">
      <div className="bg-white rounded-[8px] shadow-tactile-modal border border-[#E4E4E7] w-full max-w-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#0F172A] flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-medium tracking-wider text-[#0052CC] uppercase">
                PROCUREMENT COMMITMENT
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-[#0F172A] mt-0.5 tracking-tight">
              Issue Formal Purchase Order
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-[#64748B] hover:text-[#0F172A] transition-colors p-1.5 rounded-[4px] hover:bg-[#F4F4F5]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[rgba(220,38,38,0.2)] text-[#DC2626] text-xs rounded-[6px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
              <span>{error}</span>
            </div>
          )}

          {/* Agreed Commercial Terms Summary (Read-Only Snapshot) */}
          <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-1.5">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider font-mono">
                ACCEPTED QUOTATION SNAPSHOT
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-[4px] text-[10px] font-mono font-semibold bg-[#ECFDF5] text-[#059669] uppercase border border-[rgba(5,150,105,0.2)]">
                <ShieldCheck className="w-3 h-3" />
                Agreed Terms
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-[#64748B] font-semibold uppercase block font-mono">Product</span>
                <strong className="font-semibold text-[#0F172A] truncate block mt-0.5">{productName}</strong>
              </div>

              <div>
                <span className="text-[10px] text-[#64748B] font-semibold uppercase block font-mono">Quantity</span>
                <span className="font-mono font-semibold text-[#0F172A] block mt-0.5">
                  {quantity.toLocaleString()} {unit.toUpperCase()}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#64748B] font-semibold uppercase block font-mono">Unit Price</span>
                <span className="font-mono font-semibold text-[#0F172A] block mt-0.5">
                  {currency} {unitPrice.toFixed(2)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#64748B] font-semibold uppercase block font-mono">Total Amount</span>
                <strong className="font-mono font-bold text-sm text-[#059669] block mt-0.5">
                  {currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            {leadTimeDays && (
              <div className="text-[11px] text-[#64748B] border-t border-[#E4E4E7] pt-2 flex items-center gap-1.5 font-mono">
                <Clock className="w-3 h-3 text-[#0052CC]" />
                <span>Agreed Fulfillment Lead Time:</span>
                <strong className="text-[#0F172A]">{leadTimeDays} business days upon supplier acceptance</strong>
              </div>
            )}
          </div>

          {/* Operational Input Fields */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1 font-mono">
                Delivery / Shipping Address <span className="text-[#DC2626]">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="e.g. Warehouse 4B, 100 Industrial Chemical Logistics Hub, Navi Mumbai, MH 400705"
                className="w-full text-xs rounded-[6px] border border-[#E4E4E7] p-2.5 text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1 font-mono">
                Billing / Procurement Contact <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                value={billingContact}
                onChange={(e) => setBillingContact(e.target.value)}
                placeholder="e.g. procurement@pharmaholdings.com / +91 98765 43210 (Accounts Dept)"
                className="w-full text-xs rounded-[6px] border border-[#E4E4E7] px-3 py-2 text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1 font-mono">
                Special Logistics / Delivery Notes <span className="text-[#64748B] font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Temperature sensitive batch. Receiving dock 8am-4pm. Forklift available on site."
                className="w-full text-xs rounded-[6px] border border-[#E4E4E7] p-2.5 text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-[#E4E4E7]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto h-8 px-4 text-xs font-medium text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto h-8 px-4 rounded-[6px] bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-white font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm & Issue PO</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
