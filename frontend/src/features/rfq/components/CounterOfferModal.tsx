"use client";

import React, { useState } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import { CreateCounterOfferRequest, submitCounterOffer } from "../api/submitCounterOffer";
import { QuotationResponse } from "../api/submitQuotation";

interface CounterOfferModalProps {
  rfqId: string;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.unitPrice || formData.unitPrice <= 0) {
      setError("Unit price must be greater than zero.");
      return;
    }

    if (!formData.commercialMessage || !formData.commercialMessage.trim()) {
      setError("Commercial message is required for a counter offer.");
      return;
    }

    try {
      setLoading(true);
      const res = await submitCounterOffer(rfqId, formData as CreateCounterOfferRequest);
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit counter offer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-serif">Commercial Counter Offer</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Propose revised commercial pricing or terms to the supplier.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                COUNTER UNIT PRICE *
              </label>
              <input
                type="number"
                name="unitPrice"
                step="0.0001"
                required
                value={formData.unitPrice || ""}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                CURRENCY *
              </label>
              <select
                name="currency"
                required
                value={formData.currency || "INR"}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
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
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                PROPOSED MOQ
              </label>
              <input
                type="number"
                name="minimumOrderQuantity"
                step="0.0001"
                value={formData.minimumOrderQuantity || ""}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                REQUIRED LEAD TIME (DAYS)
              </label>
              <input
                type="number"
                name="leadTimeDays"
                min="1"
                value={formData.leadTimeDays || ""}
                onChange={handleChange}
                placeholder="e.g. 10"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              PACKAGING REQUIREMENT
            </label>
            <input
              type="text"
              name="packagingDetails"
              value={formData.packagingDetails || ""}
              onChange={handleChange}
              placeholder="e.g. 25kg fiber drums"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              COMMERCIAL MESSAGE *
            </label>
            <textarea
              name="commercialMessage"
              required
              rows={3}
              value={formData.commercialMessage || ""}
              onChange={handleChange}
              placeholder="Explain rationale or proposed volume commitment for this counter offer..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? "TRANSMITTING..." : "SEND COUNTER OFFER →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
