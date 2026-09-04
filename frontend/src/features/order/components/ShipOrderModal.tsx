"use client";

import { useState } from "react";
import { ShipOrderRequest } from "@/features/order/api/fulfillment";

interface ShipOrderModalProps {
  orderId: string;
  poNumber: string;
  onClose: () => void;
  onSubmit: (data: ShipOrderRequest) => Promise<void>;
}

export function ShipOrderModal({
  orderId,
  poNumber,
  onClose,
  onSubmit,
}: ShipOrderModalProps) {
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!carrier.trim() || !trackingNumber.trim()) {
      setError("Carrier and tracking number are required.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        carrier: carrier.trim(),
        trackingNumber: trackingNumber.trim(),
        estimatedDeliveryDate: estimatedDeliveryDate ? estimatedDeliveryDate : undefined,
      });
      // Component unmounts on success via parent, or closes
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ship order");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/50 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div className="bg-white rounded-[8px] border border-[#E4E4E7] shadow-tactile-modal w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-[#E4E4E7] bg-[#FAFAFA] flex items-start justify-between">
          <div>
            <span className="block text-[10px] font-mono font-medium uppercase tracking-wider text-[#0052CC] mb-0.5">
              FULFILLMENT OPERATION
            </span>
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
              Dispatch Consignment Shipment
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5 font-mono">
              PO Reference: <strong className="text-[#0F172A]">{poNumber}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-[4px] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[rgba(220,38,38,0.2)] rounded-[6px] text-[#DC2626]">
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}

          <form id="shipOrderForm" onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label htmlFor="carrier" className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">
                Logistics Carrier <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="carrier"
                type="text"
                required
                disabled={submitting}
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="e.g. Blue Dart, DHL Express, V-Trans, FedEx"
                className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="trackingNumber" className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">
                AWB / Waybill Tracking Number <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="trackingNumber"
                type="text"
                required
                disabled={submitting}
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Consignment Tracking Code"
                className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs font-mono text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="estimatedDeliveryDate" className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">
                Estimated Delivery Date (Optional)
              </label>
              <input
                id="estimatedDeliveryDate"
                type="date"
                disabled={submitting}
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs font-mono text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
              />
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="border-t border-[#E4E4E7] p-4 bg-[#FAFAFA] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-8 px-4 text-xs font-medium text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="shipOrderForm"
            disabled={submitting || !carrier.trim() || !trackingNumber.trim()}
            className="h-8 px-4 bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-white text-xs font-medium rounded-[6px] shadow-xs transition-colors cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            {submitting ? "Transmitting..." : "Confirm & Ship Consignment"}
          </button>
        </div>
      </div>
    </div>
  );
}
