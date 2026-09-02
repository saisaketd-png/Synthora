"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Loader2, ArrowLeft, Send, ShieldCheck, Building2, FlaskConical, ArrowRight } from "lucide-react";
import { createRfq } from "../api/createRfq";

export type RfqModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
  masterProductId?: string;
  supplierOfferingId?: string;
  productName: string;
  supplierId: number;
  supplierName: string;
  supplierCountry: string;
  defaultQuantity?: number;
};

export default function RfqModal({
  isOpen,
  onClose,
  productId,
  masterProductId,
  supplierOfferingId,
  productName,
  supplierId,
  supplierName,
  supplierCountry,
  defaultQuantity,
}: RfqModalProps) {
  const [step, setStep] = useState<"fill" | "review" | "success">("fill");
  const [quantity, setQuantity] = useState<number | string>(defaultQuantity || 50);
  const [unit, setUnit] = useState("kg");
  const [deliveryLocation, setDeliveryLocation] = useState("Mumbai, India");
  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRfq, setSubmittedRfq] = useState<any | null>(null);

  const handleClose = () => {
    setStep("fill");
    setQuantity(defaultQuantity || 50);
    setUnit("kg");
    setDeliveryLocation("Mumbai, India");
    setMessageText("");
    setError(null);
    setSubmittedRfq(null);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    const numericQuantity = Number(quantity);
    if (!quantity || !Number.isFinite(numericQuantity) || numericQuantity <= 0 || numericQuantity > 10000000) {
      setError("Please enter a valid quantity between 1 and 10,000,000.");
      return;
    }
    setError(null);
    setStep("review");
  };

  const handleFinalSubmit = async () => {
    if (submittingRef.current) return;

    const numericQuantity = Number(quantity);
    const fullMessage = deliveryLocation ? `Delivery Destination: ${deliveryLocation}\n\nRequirements:\n${messageText}`.trim() : messageText;

    const payload = {
      productId: productId || undefined,
      masterProductId: masterProductId || undefined,
      supplierOfferingId: supplierOfferingId || undefined,
      supplierId,
      quantity: numericQuantity,
      unit,
      message: fullMessage,
    };

    setError(null);
    setLoading(true);
    submittingRef.current = true;

    try {
      const res = await createRfq(payload);
      setSubmittedRfq(res);
      setStep("success");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to submit RFQ.");
      }
      setStep("fill");
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rfq-modal-title"
    >
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-lg sm:max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h2 id="rfq-modal-title" className="text-base sm:text-lg font-bold text-[#091E42] tracking-tight">
              Request a Direct Quotation
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#64748B] flex-wrap">
              <span className="font-bold text-[#091E42] truncate max-w-[180px] sm:max-w-xs">{productName}</span>
              <span>·</span>
              <span className="truncate">Supplier: <strong className="text-[#091E42]">{supplierName}</strong></span>
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#006644] bg-[#E3FCEF] border border-[#ABF5D1] px-1.5 py-0.2 rounded font-mono">
                <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-[#64748B] hover:text-[#091E42] hover:bg-[#F1F5F9] rounded-lg transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {error && (
            error.toLowerCase().includes("daily rfq limit") || error.toLowerCase().includes("limit reached") ? (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-bold block text-amber-950">Daily RFQ Limit Reached</strong>
                  <p className="leading-relaxed">{error}</p>
                  <p className="text-[11px] text-amber-800 pt-1 border-t border-amber-200/60">
                    To maintain marketplace quality, buyer accounts are subject to daily submission quotas. Please try again tomorrow or contact support to request a quota increase.
                  </p>
                </div>
              </div>
            ) : error.toLowerCase().includes("maintenance") ? (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-amber-950 mb-0.5">Platform Maintenance Notice</strong>
                  <p>{error}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#FFEBE6] border border-[#FFBDAD] rounded-xl text-xs text-[#BF2600] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )
          )}

          {/* STEP 1: Form Fill */}
          {step === "fill" && (
            <form id="rfq-form" onSubmit={handleProceedToReview} className="space-y-4">
              {/* Quantity & Unit Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                    Required Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full h-11 px-3.5 text-sm font-mono font-bold bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0052CC]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                    Unit *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full h-11 px-3 text-sm font-bold bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0052CC]"
                  >
                    <option value="kg">kg</option>
                    <option value="MT">Metric Ton (MT)</option>
                    <option value="g">Grams (g)</option>
                    <option value="L">Liters (L)</option>
                  </select>
                </div>
              </div>

              {/* Delivery Destination */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                  Delivery Destination / Port
                </label>
                <input
                  type="text"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder="e.g. Mumbai Port, India or Rotterdam, Netherlands"
                  className="w-full h-11 px-3.5 text-sm bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0052CC]"
                />
              </div>

              {/* Commercial & Technical Requirements */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                    Commercial & Technical Requirements
                  </label>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    {messageText.length}/2000
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Specify purity target, grade (USP/BP/EP), required lead time, packaging type (drums/IBC), target payment terms, or required export certificates..."
                  className="w-full p-3 text-sm bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0052CC] resize-none"
                />
                <p className="text-xs text-[#64748B]">
                  This inquiry will be routed directly to {supplierName} for quotation generation.
                </p>
              </div>
            </form>
          )}

          {/* STEP 2: Review */}
          {step === "review" && (
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="text-[#64748B] uppercase tracking-wider font-bold text-xs">Product</span>
                  <strong className="text-[#091E42]">{productName}</strong>
                </div>

                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="text-[#64748B] uppercase tracking-wider font-bold text-xs">Target Supplier</span>
                  <strong className="text-[#091E42]">{supplierName}</strong>
                </div>

                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="text-[#64748B] uppercase tracking-wider font-bold text-xs">Sourcing Quantity</span>
                  <strong className="text-[#091E42] font-mono">{quantity} {unit}</strong>
                </div>

                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="text-[#64748B] uppercase tracking-wider font-bold text-xs">Destination</span>
                  <strong className="text-[#091E42]">{deliveryLocation || "Not specified"}</strong>
                </div>

                {messageText && (
                  <div className="space-y-1">
                    <span className="text-[#64748B] uppercase tracking-wider font-bold text-xs block">Requirements Note</span>
                    <p className="text-[#172B4D] bg-white p-3 rounded-xl border border-[#E2E8F0] whitespace-pre-wrap text-xs sm:text-sm">
                      {messageText}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === "success" && (
            <div className="py-6 sm:py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#E3FCEF] border border-[#ABF5D1] text-[#00875A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#091E42]">
                  Quotation Request Dispatched
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] max-w-sm mx-auto leading-relaxed">
                  Your RFQ has been dispatched to <strong>{supplierName}</strong>. You can monitor quotation responses directly in your buyer operations desk.
                </p>
                {submittedRfq?.rfqReference && (
                  <p className="font-mono text-xs sm:text-sm font-bold text-[#0052CC] pt-2">
                    Reference: {submittedRfq.rfqReference}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          {step === "fill" && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto h-11 px-4 rounded-xl border border-[#CBD5E1] text-sm font-semibold text-[#091E42] hover:bg-[#F1F5F9] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="rfq-form"
                className="w-full sm:w-auto h-11 px-5 rounded-xl bg-[#0052CC] hover:bg-[#0747A6] text-white text-sm font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Review Request</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === "review" && (
            <>
              <button
                type="button"
                onClick={() => setStep("fill")}
                disabled={loading}
                className="w-full sm:w-auto h-11 px-4 rounded-xl border border-[#CBD5E1] text-sm font-semibold text-[#091E42] hover:bg-[#F1F5F9] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Edit</span>
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
                className="w-full sm:w-auto h-11 px-5 rounded-xl bg-[#0052CC] hover:bg-[#0747A6] text-white text-sm font-bold transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{loading ? "Submitting..." : "Submit Quotation Request"}</span>
              </button>
            </>
          )}

          {step === "success" && (
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#0052CC] hover:bg-[#0747A6] text-white text-sm font-bold transition-colors shadow-sm"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
