"use client";

import React, { useState, useEffect } from "react";
import { Send, AlertCircle, Calculator, X } from "lucide-react";
import { CreateQuotationRequest, QuotationResponse, submitQuotation } from "../api/submitQuotation";
import { useToast } from "@/shared/context/ToastContext";

interface QuotationFormProps {
  rfqId: string;
  targetQuantity?: number;
  unit?: string;
  initialData?: Partial<CreateQuotationRequest>;
  isRevision?: boolean;
  revisionNumber?: number;
  buyerProposal?: {
    unitPrice?: number;
    currency?: string;
    minimumOrderQuantity?: number | null;
    leadTimeDays?: number | null;
    validityDate?: string | null;
    packagingDetails?: string | null;
    commercialNotes?: string | null;
  };
  onSuccess: (quotation: QuotationResponse) => void;
  onCancel?: () => void;
}

export const QuotationForm: React.FC<QuotationFormProps> = ({
  rfqId,
  targetQuantity = 100,
  unit = "KG",
  initialData,
  isRevision = false,
  revisionNumber = 2,
  buyerProposal,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<CreateQuotationRequest>>({
    unitPrice: initialData?.unitPrice,
    currency: initialData?.currency || "INR",
    minimumOrderQuantity: initialData?.minimumOrderQuantity,
    leadTimeDays: initialData?.leadTimeDays,
    validityDate: initialData?.validityDate || "",
    packagingDetails: initialData?.packagingDetails || "",
    commercialNotes: initialData?.commercialNotes || "",
  });

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        unitPrice: initialData.unitPrice,
        currency: initialData.currency || "INR",
        minimumOrderQuantity: initialData.minimumOrderQuantity,
        leadTimeDays: initialData.leadTimeDays,
        validityDate: initialData.validityDate ? initialData.validityDate.split("T")[0] : "",
        packagingDetails: initialData.packagingDetails || "",
        commercialNotes: initialData.commercialNotes || "",
      });
    }
  }, [initialData]);

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

  const estimatedTotal = targetQuantity && formData.unitPrice ? targetQuantity * formData.unitPrice : 0;

  // Format currency
  const formatCurrency = (val?: number | null, curr = "INR") => {
    if (val == null) return "—";
    return `${curr} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format quantity
  const formatQuantity = (val?: number | null, u = unit) => {
    if (val == null) return "Standard";
    return `${val.toLocaleString()} ${u.toUpperCase()}`;
  };

  // Validate and open confirmation dialog
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.unitPrice || formData.unitPrice <= 0) {
      setError("Unit price must be greater than zero.");
      return;
    }
    if (!formData.currency) {
      setError("Currency is required.");
      return;
    }
    if (!formData.validityDate) {
      setError("Validity date is required.");
      return;
    }

    if (isRevision) {
      setConfirmModalOpen(true);
    } else {
      executeSubmission();
    }
  };

  const executeSubmission = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await submitQuotation(rfqId, formData as CreateQuotationRequest);
      toast.success(
        isRevision
          ? `Commercial revision V${revisionNumber} transmitted successfully.`
          : "Commercial quotation transmitted successfully."
      );
      setConfirmModalOpen(false);
      window.dispatchEvent(new CustomEvent("rfq-updated", { detail: { rfqId } }));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
      onSuccess(response);
    } catch (err: any) {
      const msg = err.message || "Failed to submit quotation. Please check your inputs.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] border-l-4 border-l-[#0052CC] rounded-xl shadow-2xs overflow-hidden">
      {/* Light Refined Header */}
      <div className="px-6 py-4 bg-[#FAFBFC] border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0052CC]">
              {isRevision ? `COMMERCIAL REVISION · V${revisionNumber}` : "COMMERCIAL PROPOSAL ENGINE"}
            </span>
          </div>
          <h3 className="text-base font-bold text-[#0B1B33] mt-0.5">
            {isRevision ? "Revise Commercial Terms" : "Submit Commercial Quotation"}
          </h3>
          <p className="text-xs text-[#526581]">
            {isRevision
              ? "Update the terms you want to propose back to the buyer."
              : "Specify your pricing, MOQ, fulfillment lead time, and dispatch terms."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-[#0B1B33] bg-white border border-[#E2E8F0] px-3 py-1 rounded">
            Target Volume: {formatQuantity(targetQuantity, unit)}
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-[#526581] hover:text-[#0B1B33] font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handlePreSubmit} className="p-6">
        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: FORM INPUTS (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0B1B33] mb-1.5">
                  Unit Price <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  name="unitPrice"
                  step="0.01"
                  required
                  value={formData.unitPrice ?? ""}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-bold text-[#0B1B33] bg-[#FAFBFC] focus:bg-white focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0B1B33] mb-1.5">
                  Currency <span className="text-rose-600">*</span>
                </label>
                <select
                  name="currency"
                  required
                  value={formData.currency || "INR"}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#0B1B33] bg-[#FAFBFC] focus:bg-white focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] transition-all"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0B1B33] mb-1.5">
                  Minimum Order Quantity (MOQ)
                </label>
                <input
                  type="number"
                  name="minimumOrderQuantity"
                  step="1"
                  value={formData.minimumOrderQuantity ?? ""}
                  onChange={handleChange}
                  placeholder={`e.g. 50`}
                  className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-xs text-[#0B1B33] bg-[#FAFBFC] focus:bg-white focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0B1B33] mb-1.5">
                  Fulfillment Lead Time (Days)
                </label>
                <input
                  type="number"
                  name="leadTimeDays"
                  min="1"
                  value={formData.leadTimeDays ?? ""}
                  onChange={handleChange}
                  placeholder="e.g. 7"
                  className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-xs text-[#0B1B33] bg-[#FAFBFC] focus:bg-white focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0B1B33] mb-1.5">
                  Offer Validity Date <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  name="validityDate"
                  required
                  value={formData.validityDate || ""}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-xs text-[#0B1B33] bg-[#FAFBFC] focus:bg-white focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0B1B33] mb-1.5">
                  Packaging Specification
                </label>
                <input
                  type="text"
                  name="packagingDetails"
                  value={formData.packagingDetails || ""}
                  onChange={handleChange}
                  placeholder="e.g. 25kg UN-certified fiber drums"
                  className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-xs text-[#0B1B33] bg-[#FAFBFC] focus:bg-white focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0B1B33] mb-1.5">
                Commercial Notes & Quality Remarks
              </label>
              <textarea
                name="commercialNotes"
                rows={3}
                value={formData.commercialNotes || ""}
                onChange={handleChange}
                placeholder="Include payment terms (e.g. Net 30), incoterms (e.g. FOB Mumbai), or test report availability..."
                className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-xs text-[#0B1B33] bg-[#FAFBFC] focus:bg-white focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] transition-all resize-y"
              />
            </div>
          </div>

          {/* RIGHT: PERSISTENT BUYER PROPOSAL VS REVISED TERMS (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Buyer's Latest Proposal Reference Card (if revision) */}
            {isRevision && buyerProposal && (
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    BUYER'S PROPOSAL
                  </span>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Counter-Offer
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Unit Price:</span>
                    <strong className="text-[#0B1B33]">
                      {formatCurrency(buyerProposal.unitPrice, buyerProposal.currency || "INR")} / {unit.toUpperCase()}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">MOQ:</span>
                    <span className="text-[#0B1B33]">{formatQuantity(buyerProposal.minimumOrderQuantity, unit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Lead Time:</span>
                    <span className="text-[#0B1B33]">{buyerProposal.leadTimeDays ? `${buyerProposal.leadTimeDays} days` : "Standard"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Valid Until:</span>
                    <span className="text-[#0B1B33]">
                      {buyerProposal.validityDate ? new Date(buyerProposal.validityDate).toLocaleDateString("en-GB") : "30 days"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Your Revised Commercial Summary */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#0052CC]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1B33]">
                    {isRevision ? "YOUR REVISED TERMS" : "COMMERCIAL SUMMARY"}
                  </h4>
                </div>
                <span className="text-[10px] font-semibold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  Live Calculation
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-dashed border-[#E2E8F0]">
                  <span className="text-[#64748B]">Target Volume</span>
                  <span className="font-semibold text-[#0B1B33]">
                    {formatQuantity(targetQuantity, unit)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-dashed border-[#E2E8F0]">
                  <span className="text-[#64748B]">Proposing Price</span>
                  <strong className="text-[#0B1B33]">
                    {formatCurrency(formData.unitPrice, formData.currency)} / {unit.toUpperCase()}
                  </strong>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-dashed border-[#E2E8F0]">
                  <span className="text-[#64748B]">Fulfillment Lead Time</span>
                  <span className="text-[#0B1B33]">
                    {formData.leadTimeDays ? `${formData.leadTimeDays} business days` : "Standard"}
                  </span>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-center mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                    Estimated Gross Consignment Value
                  </span>
                  <strong className="text-xl font-bold text-[#00875A] block mt-0.5">
                    {formatCurrency(estimatedTotal, formData.currency)}
                  </strong>
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">Excluding statutory GST / freight</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-2xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {loading
                      ? isRevision
                        ? `Sending Revision V${revisionNumber}...`
                        : "Transmitting Proposal..."
                      : isRevision
                      ? "Send Revised Quotation →"
                      : "Submit Commercial Proposal"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* CONFIRMATION SUMMARY MODAL BEFORE TRANSMITTING REVISION */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-[#0B1B33] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                Send Revision V{revisionNumber} to Buyer?
              </h3>
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-[#0B1B33] leading-relaxed">
                You are sending <strong className="text-[#0B1B33]">Revision V{revisionNumber}</strong> to the buyer in response to their counter-offer.
              </p>

              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">
                    Buyer Counter
                  </span>
                  <span className="text-xs text-[#0B1B33] block">
                    {buyerProposal?.unitPrice ? `${buyerProposal.currency || "INR"} ${buyerProposal.unitPrice.toFixed(2)}` : "—"}
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    {buyerProposal?.leadTimeDays ? `${buyerProposal.leadTimeDays}d lead` : ""}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-[#0052CC] block mb-1">
                    Your Revision V{revisionNumber}
                  </span>
                  <strong className="text-xs text-[#0052CC] block">
                    {formData.currency} {formData.unitPrice ? Number(formData.unitPrice).toFixed(2) : "0.00"}
                  </strong>
                  <span className="text-[11px] text-[#64748B]">
                    {formData.leadTimeDays ? `${formData.leadTimeDays}d lead` : "Standard"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0B1B33] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={executeSubmission}
                  disabled={loading}
                  className="px-5 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? `Sending Revision V${revisionNumber}...` : "Send Revised Quotation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
