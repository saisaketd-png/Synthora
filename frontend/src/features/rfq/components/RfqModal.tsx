"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { createRfq } from "../api/createRfq";

export type RfqModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  supplierId: number;
  supplierName: string;
  supplierCountry: string;
  defaultQuantity?: number;
};

const DEMO_BUYER_ID = "59efa3ea-3329-43ff-9397-b20a00d6a0d7";

export default function RfqModal({
  isOpen,
  onClose,
  productId,
  productName,
  supplierId,
  supplierName,
  supplierCountry,
  defaultQuantity,
}: RfqModalProps) {
  const [quantity, setQuantity] = useState<number | "">(defaultQuantity || "");
  const [unit, setUnit] = useState("kg");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Re-enable message tracking properly
  const [messageText, setMessageText] = useState("");

  const handleClose = () => {
    setQuantity(defaultQuantity || "");
    setUnit("kg");
    setMessageText("");
    setError(null);
    setSuccess(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quantity || Number(quantity) <= 0 || Number(quantity) > 1000000) {
      setError("Please enter a valid quantity between 1 and 1,000,000.");
      return;
    }

    if (messageText.length > 1000) {
      setError("Message cannot exceed 1000 characters.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await createRfq({
        buyerId: DEMO_BUYER_ID, // TODO: Replace with authenticated user ID
        productId,
        supplierId,
        quantity: Number(quantity),
        unit,
        message: messageText,
      });

      setSuccess(res.id);
      
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
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
        className="bg-white rounded-xl shadow-xl w-full max-w-[640px] flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Request Quote</h2>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#17B5AE] rounded-full p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-2">RFQ Submitted Successfully</h3>
              <p className="text-slate-500">
                Your request has been sent to {supplierName}.
              </p>
              <p className="text-xs font-mono text-slate-400 mt-4">RFQ ID: {success}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Product</span>
                  <span className="text-sm font-semibold text-slate-900">{productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Supplier</span>
                  <span className="text-sm font-semibold text-slate-900">{supplierName} ({supplierCountry})</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="quantity" className="text-sm font-semibold text-slate-700">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    autoFocus
                    required
                    min="1"
                    max="1000000"
                    disabled={loading}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#17B5AE] focus:border-transparent disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="unit" className="text-sm font-semibold text-slate-700">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="unit"
                    required
                    disabled={loading}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#17B5AE] focus:border-transparent disabled:bg-slate-100 disabled:text-slate-500"
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
                <div className="flex justify-between">
                  <label htmlFor="message" className="text-sm font-semibold text-slate-700">
                    Message to Supplier
                  </label>
                  <span className="text-xs text-slate-400">{messageText.length}/1000</span>
                </div>
                <textarea
                  id="message"
                  rows={4}
                  maxLength={1000}
                  disabled={loading}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Include any specific requirements, certifications needed, or shipping details..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#17B5AE] focus:border-transparent resize-none disabled:bg-slate-100 disabled:text-slate-500"
                ></textarea>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-transparent rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#17B5AE] hover:bg-[#149d97] rounded-lg transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Submitting..." : "Submit RFQ"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
