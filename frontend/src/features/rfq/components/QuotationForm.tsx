"use client";

import React, { useState } from "react";
import { CreateQuotationRequest, QuotationResponse, submitQuotation } from "../api/submitQuotation";
import { useToast } from "@/shared/context/ToastContext";

interface QuotationFormProps {
  rfqId: string;
  onSuccess: (quotation: QuotationResponse) => void;
}

export const QuotationForm: React.FC<QuotationFormProps> = ({ rfqId, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<CreateQuotationRequest>>({
    unitPrice: undefined,
    currency: "INR",
    minimumOrderQuantity: undefined,
    leadTimeDays: undefined,
    validityDate: "",
    packagingDetails: "",
    commercialNotes: "",
  });

  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "unitPrice" || name === "minimumOrderQuantity" || name === "leadTimeDays"
          ? value === "" ? undefined : Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.unitPrice || formData.unitPrice <= 0) {
        throw new Error("Unit price must be greater than zero.");
      }
      if (!formData.currency) {
        throw new Error("Currency is required.");
      }
      if (!formData.validityDate) {
        throw new Error("Validity date is required.");
      }

      const response = await submitQuotation(rfqId, formData as CreateQuotationRequest);
      toast.success("Quotation submitted successfully.");
      onSuccess(response);
    } catch (err: any) {
      const msg = err.message || "Failed to submit quotation. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
        <span className="text-slate-300">03 /</span> COMMERCIAL QUOTATION
        <div className="h-px bg-slate-200 flex-1 ml-4" />
      </h2>

      {error && (
        <div className="mb-8 border-l-[3px] border-orange-500 pl-4 py-1">
          <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">Submission Error</p>
          <p className="text-sm font-mono text-slate-700 mt-2">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-0">
        <div className="border-t border-slate-200">
          
          <div className="flex flex-col sm:flex-row border-b border-slate-200">
            <div className="w-full sm:w-1/3 py-4 sm:pr-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                UNIT PRICE *
              </label>
              <input
                type="number"
                name="unitPrice"
                step="0.0001"
                required
                value={formData.unitPrice || ""}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full bg-transparent font-mono text-xl font-bold text-[#0A192F] placeholder:text-slate-300 focus:outline-none focus:border-b focus:border-blue-600 transition-colors py-1"
              />
            </div>
            <div className="hidden sm:block w-px bg-slate-200" />
            <div className="w-full sm:w-2/3 py-4 sm:pl-6">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                CURRENCY *
              </label>
              <select
                name="currency"
                required
                value={formData.currency || "INR"}
                onChange={handleChange}
                className="w-full bg-transparent font-mono text-xl font-bold text-[#0A192F] focus:outline-none focus:border-b focus:border-blue-600 transition-colors py-1 cursor-pointer"
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
          </div>

          <div className="flex flex-col sm:flex-row border-b border-slate-200">
            <div className="w-full sm:w-1/2 py-4 sm:pr-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                MINIMUM ORDER QUANTITY (MOQ)
              </label>
              <input
                type="number"
                name="minimumOrderQuantity"
                step="0.0001"
                value={formData.minimumOrderQuantity || ""}
                onChange={handleChange}
                placeholder="0"
                className="w-full bg-transparent font-mono text-sm font-semibold text-[#0A192F] placeholder:text-slate-300 focus:outline-none focus:border-b focus:border-blue-600 transition-colors py-1"
              />
            </div>
            <div className="hidden sm:block w-px bg-slate-200" />
            <div className="w-full sm:w-1/2 py-4 sm:pl-6">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                LEAD TIME (DAYS)
              </label>
              <input
                type="number"
                name="leadTimeDays"
                min="1"
                step="1"
                value={formData.leadTimeDays || ""}
                onChange={handleChange}
                placeholder="e.g. 14"
                className="w-full bg-transparent font-mono text-sm font-semibold text-[#0A192F] placeholder:text-slate-300 focus:outline-none focus:border-b focus:border-blue-600 transition-colors py-1"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row border-b border-slate-200">
            <div className="w-full sm:w-1/2 py-4 sm:pr-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                VALIDITY DATE *
              </label>
              <input
                type="date"
                name="validityDate"
                required
                value={formData.validityDate || ""}
                onChange={handleChange}
                className="w-full bg-transparent font-mono text-sm font-semibold text-[#0A192F] focus:outline-none focus:border-b focus:border-blue-600 transition-colors py-1"
              />
            </div>
            <div className="hidden sm:block w-px bg-slate-200" />
            <div className="w-full sm:w-1/2 py-4 sm:pl-6">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                PACKAGING DETAILS
              </label>
              <input
                type="text"
                name="packagingDetails"
                value={formData.packagingDetails || ""}
                onChange={handleChange}
                placeholder="e.g. 25kg drums"
                className="w-full bg-transparent font-sans text-sm font-semibold text-[#0A192F] placeholder:text-slate-300 focus:outline-none focus:border-b focus:border-blue-600 transition-colors py-1"
              />
            </div>
          </div>

          <div className="py-4 border-b border-slate-200">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              COMMERCIAL NOTES
            </label>
            <textarea
              name="commercialNotes"
              value={formData.commercialNotes || ""}
              onChange={handleChange}
              placeholder="Any additional terms, conditions, or remarks for the buyer..."
              className="w-full bg-transparent font-sans text-sm font-medium text-[#0A192F] placeholder:text-slate-300 focus:outline-none focus:border-b focus:border-blue-600 transition-colors py-1 resize-y"
              rows={3}
            />
          </div>

        </div>

        <div className="pt-8 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "TRANSMITTING..." : "SUBMIT QUOTATION →"}
          </button>
        </div>
      </form>
    </section>
  );
};
