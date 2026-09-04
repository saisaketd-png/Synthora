"use client";

import React, { useState } from "react";
import { X, Send, AlertCircle, TrendingDown, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { CreateCounterOfferRequest, submitCounterOffer } from "../api/submitCounterOffer";
import { QuotationResponse } from "../api/submitQuotation";

interface CounterOfferModalProps {
  rfqId: string;
  chemicalName?: string;
  requestedQuantity?: number;
  unit?: string;
  initialUnitPrice?: number;
  initialCurrency?: string;
  initialMoq?: number;
  initialLeadTimeDays?: number;
  initialPackaging?: string;
  onClose: () => void;
  onSuccess: (quotation: QuotationResponse) => void;
}

export function CounterOfferModal({
  rfqId,
  chemicalName = "Chemical Raw Material",
  requestedQuantity = 100,
  unit = "KG",
  initialUnitPrice,
  initialCurrency = "INR",
  initialMoq,
  initialLeadTimeDays,
  initialPackaging,
  onClose,
  onSuccess,
}: CounterOfferModalProps) {
  const [formData, setFormData] = useState<Partial<CreateCounterOfferRequest>>({
    unitPrice: initialUnitPrice,
    currency: initialCurrency || "INR",
    minimumOrderQuantity: initialMoq,
    leadTimeDays: initialLeadTimeDays,
    packagingDetails: initialPackaging || "",
    commercialMessage: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "unitPrice" || name === "minimumOrderQuantity" || name === "leadTimeDays"
          ? value === ""
            ? undefined
            : Number(value)
          : value,
    }));
  };

  const currentEstimatedTotal = requestedQuantity && formData.unitPrice ? requestedQuantity * formData.unitPrice : 0;
  const previousEstimatedTotal = requestedQuantity && initialUnitPrice ? requestedQuantity * initialUnitPrice : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.unitPrice || formData.unitPrice <= 0) {
      setError("Counter unit price must be greater than zero.");
      return;
    }

    if (!formData.commercialMessage || !formData.commercialMessage.trim()) {
      setError("Please provide a commercial rationale or volume commitment for this counter offer.");
      return;
    }

    try {
      setLoading(true);
      const res = await submitCounterOffer(rfqId, formData as CreateCounterOfferRequest);
      window.dispatchEvent(new CustomEvent("rfq-updated", { detail: { rfqId } }));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit commercial counter offer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-modal max-w-2xl w-full overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-mono font-medium tracking-wider text-[#0052CC] uppercase block">
              COMMERCIAL NEGOTIATION WORKSPACE
            </span>
            <h2 className="text-sm sm:text-base font-bold text-[#0F172A] mt-0.5 tracking-tight">
              Propose Counter Offer — {chemicalName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-[4px] hover:bg-[#F4F4F5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[rgba(220,38,38,0.2)] text-[#DC2626] rounded-[6px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Supplier Terms vs Counter Terms Summary */}
          <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-1.5">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider font-mono">
                COMMERCIAL DELTA COMPARISON
              </span>
              <span className="font-mono text-[10px] text-[#64748B]">
                Target Quantity: {requestedQuantity.toLocaleString()} {unit.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-[#E4E4E7] rounded-[6px]">
                <span className="text-[10px] font-semibold text-[#64748B] uppercase block font-mono">
                  Current Supplier Price
                </span>
                <span className="font-mono text-base font-bold text-[#0F172A] block mt-0.5">
                  {initialCurrency} {initialUnitPrice ? initialUnitPrice.toFixed(2) : "—"}
                </span>
                <span className="text-[10px] text-[#64748B] font-mono">
                  Est. Total: {initialCurrency} {previousEstimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[6px]">
                <span className="text-[10px] font-semibold text-[#0052CC] uppercase block font-mono">
                  Your Proposed Counter Price
                </span>
                <span className="font-mono text-base font-bold text-[#0052CC] block mt-0.5">
                  {formData.currency} {formData.unitPrice ? Number(formData.unitPrice).toFixed(2) : "0.00"}
                </span>
                <span className="text-[10px] text-[#0052CC] font-mono">
                  Est. Total: {formData.currency} {currentEstimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1 font-mono">
                Counter Unit Price <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="number"
                name="unitPrice"
                step="0.0001"
                required
                value={formData.unitPrice || ""}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] font-mono text-xs font-semibold text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1 font-mono">
                Currency <span className="text-[#DC2626]">*</span>
              </label>
              <select
                name="currency"
                required
                value={formData.currency || "INR"}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] font-mono text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
              >
                <option value="INR">INR — Indian Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="AED">AED — UAE Dirham</option>
                <option value="SGD">SGD — Singapore Dollar</option>
                <option value="JPY">JPY — Japanese Yen</option>
                <option value="CNY">CNY — Chinese Yuan</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1 font-mono">
                Proposed MOQ
              </label>
              <input
                type="number"
                name="minimumOrderQuantity"
                step="0.0001"
                value={formData.minimumOrderQuantity || ""}
                onChange={handleChange}
                placeholder="e.g. 25"
                className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] font-mono text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1 font-mono">
                Required Lead Time (Days)
              </label>
              <input
                type="number"
                name="leadTimeDays"
                min="1"
                value={formData.leadTimeDays || ""}
                onChange={handleChange}
                placeholder="e.g. 10"
                className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] font-mono text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1 font-mono">
              Packaging Requirements
            </label>
            <input
              type="text"
              name="packagingDetails"
              value={formData.packagingDetails || ""}
              onChange={handleChange}
              placeholder="e.g. 25kg HDPE drums with tamper-evident seal"
              className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1 font-mono">
              Commercial Rationale / Volume Commitment <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              name="commercialMessage"
              required
              rows={3}
              value={formData.commercialMessage || ""}
              onChange={handleChange}
              placeholder="e.g. Proposing ₹98/KG based on our quarterly commitment of 500KG. Ready to issue PO immediately upon acceptance."
              className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC] resize-y"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-[#E4E4E7]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto h-8 px-4 text-xs font-medium text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto h-8 px-4 rounded-[6px] bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-white font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Transmitting..." : "Submit Counter Offer"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
