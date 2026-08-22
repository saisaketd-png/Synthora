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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#DFE1E6] rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-[#091E42] text-white flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#4C9AFF] uppercase block">
              COMMERCIAL NEGOTIATION WORKSPACE
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-white mt-0.5 tracking-tight">
              Propose Counter Offer — {chemicalName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Supplier Terms vs Counter Terms Summary */}
          <div className="bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#DFE1E6] pb-2">
              <span className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">
                COMMERCIAL DELTA COMPARISON
              </span>
              <span className="font-mono text-[10px] text-[#5E6C84]">
                Target Quantity: {requestedQuantity.toLocaleString()} {unit.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white border border-[#DFE1E6] rounded-lg">
                <span className="text-[10px] font-bold text-[#5E6C84] uppercase block">
                  Current Supplier Price
                </span>
                <span className="font-mono text-lg font-bold text-[#091E42] block mt-0.5">
                  {initialCurrency} {initialUnitPrice ? initialUnitPrice.toFixed(2) : "—"}
                </span>
                <span className="text-[10px] text-[#5E6C84]">
                  Est. Total: {initialCurrency} {previousEstimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 bg-[#DEEBFF]/30 border border-[#B3D4FF] rounded-lg">
                <span className="text-[10px] font-bold text-[#0747A6] uppercase block">
                  Your Proposed Counter Price
                </span>
                <span className="font-mono text-lg font-extrabold text-[#0052CC] block mt-0.5">
                  {formData.currency} {formData.unitPrice ? Number(formData.unitPrice).toFixed(2) : "0.00"}
                </span>
                <span className="text-[10px] text-[#0747A6]">
                  Est. Total: {formData.currency} {currentEstimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#172B4D] mb-1">
                Counter Unit Price <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                name="unitPrice"
                step="0.0001"
                required
                value={formData.unitPrice || ""}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 border border-[#DFE1E6] rounded-xl font-mono text-sm font-bold text-[#091E42] bg-[#FAFBFC] focus:bg-white focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#172B4D] mb-1">
                Currency <span className="text-rose-600">*</span>
              </label>
              <select
                name="currency"
                required
                value={formData.currency || "INR"}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-[#DFE1E6] rounded-xl font-mono text-sm font-bold text-[#091E42] bg-[#FAFBFC] focus:bg-white focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-all"
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
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#172B4D] mb-1">
                Proposed MOQ
              </label>
              <input
                type="number"
                name="minimumOrderQuantity"
                step="0.0001"
                value={formData.minimumOrderQuantity || ""}
                onChange={handleChange}
                placeholder="e.g. 25"
                className="w-full px-3.5 py-2.5 border border-[#DFE1E6] rounded-xl font-mono text-xs text-[#091E42] bg-[#FAFBFC] focus:bg-white focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#172B4D] mb-1">
                Required Lead Time (Days)
              </label>
              <input
                type="number"
                name="leadTimeDays"
                min="1"
                value={formData.leadTimeDays || ""}
                onChange={handleChange}
                placeholder="e.g. 10"
                className="w-full px-3.5 py-2.5 border border-[#DFE1E6] rounded-xl font-mono text-xs text-[#091E42] bg-[#FAFBFC] focus:bg-white focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#172B4D] mb-1">
              Packaging Requirements
            </label>
            <input
              type="text"
              name="packagingDetails"
              value={formData.packagingDetails || ""}
              onChange={handleChange}
              placeholder="e.g. 25kg HDPE drums with tamper-evident seal"
              className="w-full px-3.5 py-2.5 border border-[#DFE1E6] rounded-xl text-xs text-[#091E42] bg-[#FAFBFC] focus:bg-white focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#172B4D] mb-1">
              Commercial Rationale / Volume Commitment <span className="text-rose-600">*</span>
            </label>
            <textarea
              name="commercialMessage"
              required
              rows={3}
              value={formData.commercialMessage || ""}
              onChange={handleChange}
              placeholder="e.g. Proposing ₹98/KG based on our quarterly commitment of 500KG. Ready to issue PO immediately upon acceptance."
              className="w-full px-3.5 py-2.5 border border-[#DFE1E6] rounded-xl text-xs text-[#091E42] bg-[#FAFBFC] focus:bg-white focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-all resize-y"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#DFE1E6]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-[#5E6C84] hover:text-[#091E42] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Transmitting Counter..." : "Send Commercial Counter Offer"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
