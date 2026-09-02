"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertCircle, X, ShieldCheck, FileCheck, PackageCheck, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/KemkendraUI";

interface CompleteOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  poNumber: string;
  counterpartLabel: string;
  counterpartName?: string | null;
  productName: string;
  quantity: number | string;
  unit: string;
  totalAmount?: number;
  currency?: string;
}

export function CompleteOrderModal({
  isOpen,
  onClose,
  onConfirm,
  poNumber,
  counterpartLabel,
  counterpartName,
  productName,
  quantity,
  unit,
  totalAmount,
  currency = "INR",
}: CompleteOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete purchase order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-[#DFE1E6] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#DFE1E6] bg-[#FAFBFC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E3FCEF] text-[#006644] flex items-center justify-center font-bold">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#006644] bg-[#E3FCEF] px-2 py-0.5 rounded">
                TRANSACTION SETTLEMENT
              </span>
              <h2 className="text-base font-bold text-[#091E42] mt-0.5">
                Complete Purchase Order
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[#5E6C84] hover:text-[#091E42] p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-[#5E6C84] leading-relaxed">
            You are about to mark this purchase order as <strong className="text-[#091E42]">COMPLETED</strong>. This confirms that all ordered chemical materials have been delivered, verified, and commercial obligations are fulfilled.
          </p>

          {/* Order Summary Card */}
          <div className="bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#DFE1E6]">
              <span className="text-[#5E6C84] font-medium">Order Number:</span>
              <span className="font-mono font-bold text-[#091E42]">{poNumber}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#DFE1E6]">
              <span className="text-[#5E6C84] font-medium">{counterpartLabel}:</span>
              <span className="font-bold text-[#091E42]">{counterpartName || "Verified Enterprise"}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#DFE1E6]">
              <span className="text-[#5E6C84] font-medium">Chemical Compound:</span>
              <span className="font-bold text-[#091E42]">{productName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#DFE1E6]">
              <span className="text-[#5E6C84] font-medium">Delivered Volume:</span>
              <span className="font-mono font-bold text-[#091E42]">{quantity} {unit}</span>
            </div>
            {totalAmount !== undefined && (
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#5E6C84] font-bold">Total Commercial Value:</span>
                <span className="font-mono font-bold text-sm text-[#006644]">
                  {currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2.5 p-3.5 bg-[#EBF3FC] border border-[#B3D4FF] rounded-xl text-xs text-[#0747A6]">
            <ShieldCheck className="w-4 h-4 text-[#0052CC] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-[#091E42] font-bold">Commercial & Archival Settlement</strong>
              <p className="leading-relaxed text-[#0747A6]">
                Completing this order locks the commercial ledger, informs the counterparty via instant notification, and permanently archives the transaction record in the platform audit vault.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#DFE1E6] bg-[#FAFBFC] flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={loading}
            className="bg-[#006644] hover:bg-[#005236] text-white"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Completing...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Confirm Completion
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
