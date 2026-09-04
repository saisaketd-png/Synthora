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
    <div className="bg-white border border-[#E4E4E7] border-l-4 border-l-[#0052CC] rounded-[8px] shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 bg-[#FAFAFA] border-b border-[#E4E4E7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0052CC]">
              {isRevision ? `COMMERCIAL REVISION · V${revisionNumber}` : "COMMERCIAL PROPOSAL ENGINE"}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[#0F172A] mt-0.5">
            {isRevision ? "Revise Commercial Terms" : "Submit Commercial Quotation"}
          </h3>
          <p className="text-xs text-[#64748B]">
            {isRevision
              ? "Update the terms you want to propose back to the buyer."
              : "Specify your pricing, MOQ, fulfillment lead time, and dispatch terms."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[#0F172A] bg-white border border-[#E4E4E7] px-2.5 py-1 rounded-[4px]">
            Target Volume: {formatQuantity(targetQuantity, unit)}
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-[#64748B] hover:text-[#0F172A] font-medium transition-colors cursor-pointer px-2 py-1"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handlePreSubmit} className="p-5">
        {error && (
          <div className="mb-4 p-3 bg-[#FEF2F2] border border-[rgba(220,38,38,0.2)] text-[#DC2626] text-xs rounded-[6px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono mb-1">
                  Unit Price <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="number"
                  name="unitPrice"
                  step="0.01"
                  required
                  value={formData.unitPrice ?? ""}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs font-mono font-bold text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono mb-1">
                  Currency <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  name="currency"
                  required
                  value={formData.currency || "INR"}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs font-mono text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono mb-1">
                  Minimum Order Quantity (MOQ)
                </label>
                <input
                  type="number"
                  name="minimumOrderQuantity"
                  step="1"
                  value={formData.minimumOrderQuantity ?? ""}
                  onChange={handleChange}
                  placeholder={`e.g. 50`}
                  className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs font-mono text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono mb-1">
                  Fulfillment Lead Time (Days)
                </label>
                <input
                  type="number"
                  name="leadTimeDays"
                  min="1"
                  value={formData.leadTimeDays ?? ""}
                  onChange={handleChange}
                  placeholder="e.g. 7"
                  className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs font-mono text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono mb-1">
                  Proposal Commercial Validity
                </label>
                <input
                  type="date"
                  name="validityDate"
                  value={formData.validityDate || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs font-mono text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono mb-1">
                  Packaging Specification
                </label>
                <input
                  type="text"
                  name="packagingDetails"
                  value={formData.packagingDetails || ""}
                  onChange={handleChange}
                  placeholder="e.g. 25kg UN-rated HDPE drums"
                  className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono mb-1">
                Commercial & Technical Notes
              </label>
              <textarea
                name="commercialNotes"
                rows={3}
                value={formData.commercialNotes || ""}
                onChange={handleChange}
                placeholder="Include payment terms, shelf-life warranties, lot inspection terms, or export compliance notes..."
                className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC] resize-y"
              />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-[8px] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-2">
                <div className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-[#0052CC]" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] font-mono">
                    {isRevision ? "REVISED COMMERCIAL TERMS" : "COMMERCIAL SUMMARY"}
                  </h4>
                </div>
                <span className="text-[10px] font-mono font-medium text-[#0052CC] bg-[#EFF6FF] px-1.5 py-0.5 rounded-[4px] border border-[#BFDBFE]">
                  Live Calc
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[#E4E4E7] font-mono">
                  <span className="text-[#64748B]">Target Volume</span>
                  <span className="font-semibold text-[#0F172A]">
                    {formatQuantity(targetQuantity, unit)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#E4E4E7] font-mono">
                  <span className="text-[#64748B]">Proposing Price</span>
                  <strong className="text-[#0052CC]">
                    {formatCurrency(formData.unitPrice, formData.currency)} / {unit.toUpperCase()}
                  </strong>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#E4E4E7] font-mono">
                  <span className="text-[#64748B]">Lead Time</span>
                  <span className="text-[#0F172A]">
                    {formData.leadTimeDays ? `${formData.leadTimeDays} business days` : "Standard"}
                  </span>
                </div>

                <div className="p-3 bg-white border border-[#E4E4E7] rounded-[6px] text-center mt-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block font-mono">
                    Estimated Gross Consignment Value
                  </span>
                  <strong className="text-lg font-bold text-[#059669] block mt-0.5 font-mono">
                    {formatCurrency(estimatedTotal, formData.currency)}
                  </strong>
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">Excluding statutory GST / freight</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-8 bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-white font-medium text-xs rounded-[6px] transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {loading
                      ? isRevision
                        ? `Sending Revision V${revisionNumber}...`
                        : "Transmitting..."
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

      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/50 backdrop-blur-[2px]">
          <div className="bg-white rounded-[8px] shadow-lg border border-[#E4E4E7] max-w-md w-full overflow-hidden">
            <div className="px-5 py-3.5 bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#0F172A] flex items-center justify-between">
              <h3 className="text-sm font-bold">
                Send Revision V{revisionNumber} to Buyer?
              </h3>
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-[4px] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <p className="text-[#0F172A] leading-relaxed">
                You are sending <strong className="text-[#0F172A]">Revision V{revisionNumber}</strong> to the buyer in response to their counter-offer.
              </p>

              <div className="grid grid-cols-2 gap-2.5 p-3 bg-[#FAFAFA] rounded-[6px] border border-[#E4E4E7]">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-[#64748B] block mb-0.5 font-mono">
                    Buyer Counter
                  </span>
                  <span className="text-xs font-mono font-medium text-[#0F172A] block">
                    {buyerProposal?.unitPrice ? `${buyerProposal.currency || "INR"} ${buyerProposal.unitPrice.toFixed(2)}` : "—"}
                  </span>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    {buyerProposal?.leadTimeDays ? `${buyerProposal.leadTimeDays}d lead` : ""}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase text-[#0052CC] block mb-0.5 font-mono">
                    Your Revision V{revisionNumber}
                  </span>
                  <strong className="text-xs font-mono font-bold text-[#0052CC] block">
                    {formData.currency} {formData.unitPrice ? Number(formData.unitPrice).toFixed(2) : "0.00"}
                  </strong>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    {formData.leadTimeDays ? `${formData.leadTimeDays}d lead` : "Standard"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E4E4E7]">
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  disabled={loading}
                  className="h-8 px-3 text-xs font-medium text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={executeSubmission}
                  disabled={loading}
                  className="h-8 px-4 bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-white text-xs font-medium rounded-[6px] shadow-sm transition-colors disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                >
                  {loading ? "Transmitting..." : "Confirm & Transmit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
