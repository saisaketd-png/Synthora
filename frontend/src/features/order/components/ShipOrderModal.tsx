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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="border-b-[3px] border-[#0A192F] p-6 bg-slate-50 flex items-start justify-between">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-1">
              FULFILLMENT OPERATION
            </span>
            <h2 className="text-xl font-bold text-[#0A192F] tracking-tight">
              Ship Order
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-mono">
              PO REFERENCE: {poNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-600 p-1"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-[3px] border-red-600">
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
          )}

          <form id="shipOrderForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label htmlFor="carrier" className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
                CARRIER <span className="text-red-500">*</span>
              </label>
              <input
                id="carrier"
                type="text"
                required
                disabled={submitting}
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="e.g. FedEx, DHL, Maersk"
                className="w-full border-b border-slate-300 focus:border-[#0A192F] bg-transparent py-2 text-sm text-[#0A192F] placeholder:text-slate-400 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="trackingNumber" className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
                TRACKING NUMBER <span className="text-red-500">*</span>
              </label>
              <input
                id="trackingNumber"
                type="text"
                required
                disabled={submitting}
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Tracking / Waybill Number"
                className="w-full border-b border-slate-300 focus:border-[#0A192F] bg-transparent py-2 text-sm font-mono text-[#0A192F] placeholder:text-slate-400 placeholder:font-sans focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="estimatedDeliveryDate" className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
                ESTIMATED DELIVERY DATE (OPTIONAL)
              </label>
              <input
                id="estimatedDeliveryDate"
                type="date"
                disabled={submitting}
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                className="w-full border-b border-slate-300 focus:border-[#0A192F] bg-transparent py-2 text-sm font-mono text-[#0A192F] focus:outline-none transition-colors"
              />
            </div>

          </form>
        </div>

        {/* FOOTER */}
        <div className="border-t border-slate-200 p-6 bg-slate-50 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            type="submit"
            form="shipOrderForm"
            disabled={submitting || !carrier.trim() || !trackingNumber.trim()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {submitting ? "PROCESSING..." : "CONFIRM SHIPMENT"}
          </button>
        </div>

      </div>
    </div>
  );
}
