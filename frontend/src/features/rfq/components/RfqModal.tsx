"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Send } from "lucide-react";
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
  const [quantity, setQuantity] = useState<number | string>(defaultQuantity || "");
  const [unit, setUnit] = useState("kg");
  const [deliveryLocation, setDeliveryLocation] = useState("Mumbai, India");
  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRfq, setSubmittedRfq] = useState<any | null>(null);

  const handleClose = () => {
    setStep("fill");
    setQuantity(defaultQuantity || "");
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
    if (!quantity || !Number.isFinite(numericQuantity) || numericQuantity <= 0 || numericQuantity > 1000000) {
      setError("Please enter a valid quantity between 1 and 1,000,000.");
      return;
    }
    setError(null);
    setStep("review");
  };

  const handleFinalSubmit = async () => {
    if (submittingRef.current) return;

    const numericQuantity = Number(quantity);
    const fullMessage = deliveryLocation ? `Delivery Location: ${deliveryLocation}\n${messageText}`.trim() : messageText;

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-[640px] flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            {step === "review" && (
              <button
                type="button"
                onClick={() => setStep("fill")}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold text-slate-900">
              {step === "fill" ? "Request Quote" : step === "review" ? "Confirm RFQ Sourcing Request" : "RFQ Submitted"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-800 font-medium">{error}</p>
            </div>
          )}

          {/* Step 1: Form Fill */}
          {step === "fill" && (
            <form onSubmit={handleProceedToReview} className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase">Chemical</span>
                  <span className="font-extrabold text-slate-900">{productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase">Target Supplier</span>
                  <span className="font-bold text-slate-900">{supplierName} ({supplierCountry})</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="quantity" className="text-xs font-bold text-slate-700">
                    Required Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    autoFocus
                    required
                    min="1"
                    max="1000000"
                    step="any"
                    disabled={loading}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="unit" className="text-xs font-bold text-slate-700">
                    Unit <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="unit"
                    required
                    disabled={loading}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="mg">mg</option>
                    <option value="L">L</option>
                    <option value="mL">mL</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="location" className="text-xs font-bold text-slate-700">
                  Delivery Location / Destination Port
                </label>
                <input
                  type="text"
                  id="location"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder="City, Country or Destination Port"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label htmlFor="message" className="text-xs font-bold text-slate-700">
                    Commercial & Technical Requirements
                  </label>
                  <span className="text-[11px] text-slate-400">{messageText.length}/1000</span>
                </div>
                <textarea
                  id="message"
                  rows={3}
                  maxLength={1000}
                  disabled={loading}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Specify purity target, grade, lead time constraints, shipping terms..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                ></textarea>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-2xs"
                >
                  Review Request
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Pre-Submission Review */}
          {step === "review" && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-xs">
                <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">Sourcing Summary</h3>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Chemical Compound</span>
                    <span className="font-extrabold text-slate-900 text-sm">{productName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Target Supplier</span>
                    <span className="font-bold text-slate-900 text-sm">{supplierName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Requested Sourcing Quantity</span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">{quantity} {unit}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Delivery Destination</span>
                    <span className="font-bold text-slate-900 text-sm">{deliveryLocation || "Not specified"}</span>
                  </div>
                </div>
              </div>

              {messageText && (
                <div className="bg-white border border-slate-200 p-4 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Notes & Specifications</span>
                  <p className="text-slate-800 whitespace-pre-wrap">{messageText}</p>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep("fill")}
                  disabled={loading}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  [ BACK ]
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-2xs flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {loading ? "Submitting..." : "[ SUBMIT RFQ ]"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success Confirmation */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">RFQ Created Successfully</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your sourcing request has been transmitted directly to {supplierName}.
                </p>
              </div>

              {submittedRfq && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 w-full text-xs space-y-2 text-left mt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">RFQ Reference:</span>
                    <span className="font-mono font-extrabold text-slate-900">{submittedRfq.rfqReference || submittedRfq.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Chemical:</span>
                    <span className="font-bold text-slate-900">{productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Target Quantity:</span>
                    <span className="font-mono font-bold text-slate-900">{submittedRfq.quantity} {submittedRfq.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Status:</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-extrabold rounded text-[10px] uppercase">
                      {submittedRfq.status || "SUBMITTED"}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors mt-4"
              >
                Close & Return to Catalog
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
