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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 backdrop-blur-[2px] p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-modal max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#ECFDF5] text-[#059669] flex items-center justify-center font-bold">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#059669] bg-[#ECFDF5] px-2 py-0.2 rounded-[4px] border border-[rgba(5,150,105,0.2)]">
                TRANSACTION SETTLEMENT
              </span>
              <h2 className="text-sm font-bold text-[#0F172A] mt-0.5">
                Complete Purchase Order
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-[4px] hover:bg-[#F4F4F5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[rgba(220,38,38,0.2)] rounded-[6px] text-xs text-[#DC2626] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-[#475569] leading-relaxed">
            You are about to mark this purchase order as <strong className="text-[#0F172A] font-semibold">COMPLETED</strong>. This confirms that all ordered chemical materials have been delivered, verified, and commercial obligations are fulfilled.
          </p>

          {/* Order Summary Card */}
          <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px] p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center pb-1.5 border-b border-[#E4E4E7]">
              <span className="text-[#64748B]">Order Number:</span>
              <span className="font-mono font-semibold text-[#0F172A]">{poNumber}</span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-[#E4E4E7]">
              <span className="text-[#64748B]">{counterpartLabel}:</span>
              <span className="font-semibold text-[#0F172A]">{counterpartName || "Verified Enterprise"}</span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-[#E4E4E7]">
              <span className="text-[#64748B]">Chemical Compound:</span>
              <span className="font-semibold text-[#0F172A]">{productName}</span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-[#E4E4E7]">
              <span className="text-[#64748B]">Delivered Volume:</span>
              <span className="font-mono font-semibold text-[#0F172A]">{quantity} {unit}</span>
            </div>
            {totalAmount !== undefined && (
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-[#64748B] font-semibold">Total Commercial Value:</span>
                <span className="font-mono font-bold text-sm text-[#059669]">
                  {currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[6px] text-xs text-[#0052CC]">
            <ShieldCheck className="w-4 h-4 text-[#0052CC] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block text-[#0F172A] font-semibold">Commercial & Archival Settlement</strong>
              <p className="leading-relaxed text-[11px] text-[#475569]">
                Completing this order locks the commercial ledger, informs the counterparty via instant notification, and permanently archives the transaction record in the platform audit vault.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-end gap-2.5">
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
            className="bg-[#059669] hover:bg-[#047857] text-white"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Completing...
              </span>
            ) : (
              "Confirm & Settle Order"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
