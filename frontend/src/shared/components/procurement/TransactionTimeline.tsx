"use client";

import React, { useMemo } from "react";
import {
  FileText,
  FileCheck,
  RefreshCw,
  CheckCircle2,
  ClipboardList,
  CheckCircle,
  Factory,
  Truck,
  PackageCheck,
  Sparkles,
  AlertCircle,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";
import { QuotationResponse } from "@/features/rfq/api/submitQuotation";
import { ShipmentResponse } from "@/features/order/api/fulfillment";

export interface TransactionTimelineProps {
  rfq?: {
    id: string;
    rfqReference?: string | null;
    status: string;
    createdAt: string;
    quantity: number;
    unit: string;
    productName?: string | null;
  } | null;
  quotations?: QuotationResponse[];
  order?: PurchaseOrderResponse | null;
  shipment?: ShipmentResponse | null;
  userRole?: "BUYER" | "SUPPLIER" | "ADMIN";
  className?: string;
}

type TimelineStepStatus = "COMPLETED" | "CURRENT" | "PENDING" | "REJECTED" | "CANCELLED" | "SKIPPED";

interface TimelineStep {
  key: string;
  title: string;
  subtitle: string;
  status: TimelineStepStatus;
  timestamp?: string | null;
  actorLabel?: string | null;
  icon: React.ReactNode;
}

export function TransactionTimeline({
  rfq,
  quotations = [],
  order,
  shipment,
  userRole = "BUYER",
  className = "",
}: TransactionTimelineProps) {
  const steps: TimelineStep[] = useMemo(() => {
    const list: TimelineStep[] = [];

    // 1. RFQ Creation
    const rfqCreatedAt = rfq?.createdAt || order?.createdAt || null;
    const isRfqCancelled = rfq?.status === "CANCELLED" || rfq?.status === "CLOSED";
    list.push({
      key: "RFQ_CREATED",
      title: "RFQ Inquiry Issued",
      subtitle: rfq
        ? `Inquiry for ${rfq.quantity} ${rfq.unit.toUpperCase()} submitted`
        : "Formal commercial inquiry opened",
      status: isRfqCancelled ? "CANCELLED" : "COMPLETED",
      timestamp: rfqCreatedAt,
      actorLabel: "Buyer",
      icon: <FileText className="w-4 h-4" />,
    });

    // 2. Initial Quotation
    const sortedQuotes = [...quotations].sort(
      (a, b) => (a.quotationVersion || 1) - (b.quotationVersion || 1)
    );
    const quoteV1 = sortedQuotes.find((q) => q.quotationVersion === 1) || sortedQuotes[0] || null;
    const hasQuotes = sortedQuotes.length > 0 || !!order;
    const isRfqPending = rfq?.status === "PENDING" || rfq?.status === "CONTACTED";

    let quoteStatus: TimelineStepStatus = "PENDING";
    if (sortedQuotes.length > 0 || order) {
      quoteStatus = "COMPLETED";
    } else if (isRfqPending) {
      quoteStatus = "CURRENT";
    }

    list.push({
      key: "QUOTATION_SUBMITTED",
      title: "Commercial Quotation Proposed",
      subtitle: quoteV1
        ? `${quoteV1.currency} ${quoteV1.unitPrice}/${rfq?.unit || "KG"} (${quoteV1.leadTimeDays || 1}d lead time)`
        : "Manufacturer proposes pricing & delivery terms",
      status: quoteStatus,
      timestamp: quoteV1?.createdAt || null,
      actorLabel: "Supplier",
      icon: <FileCheck className="w-4 h-4" />,
    });

    // 3. Negotiation / Counter-Offers (Shown if multiple rounds exist or currently countering)
    const hasMultipleQuotes = sortedQuotes.length > 1;
    const isCountered = rfq?.status === "COUNTERED";
    if (hasMultipleQuotes || isCountered) {
      const latestCounter = sortedQuotes.find((q) => q.actorType === "BUYER" || q.quotationVersion > 1);
      list.push({
        key: "NEGOTIATION",
        title: "Terms Counter-Offer & Negotiation",
        subtitle: hasMultipleQuotes
          ? `${sortedQuotes.length} proposal revision${sortedQuotes.length > 1 ? "s" : ""} exchanged`
          : "Counter-offer submitted with modified specifications",
        status: isCountered ? "CURRENT" : "COMPLETED",
        timestamp: latestCounter?.createdAt || null,
        actorLabel: latestCounter?.actorType === "BUYER" ? "Buyer" : "Counterpart",
        icon: <RefreshCw className="w-4 h-4" />,
      });
    }

    // 4. Quotation Accepted
    const isRfqAccepted = rfq?.status === "ACCEPTED" || !!order;
    const isRfqRejected = rfq?.status === "REJECTED";
    let acceptStatus: TimelineStepStatus = "PENDING";
    if (isRfqAccepted) {
      acceptStatus = "COMPLETED";
    } else if (isRfqRejected) {
      acceptStatus = "REJECTED";
    } else if (rfq?.status === "QUOTED" || isCountered) {
      acceptStatus = "CURRENT";
    }

    list.push({
      key: "QUOTATION_ACCEPTED",
      title: isRfqRejected ? "Quotation Declined" : "Quotation Agreed & Accepted",
      subtitle: isRfqRejected
        ? "Commercial proposal declined by party"
        : "Final pricing, MOQ, and delivery schedule mutually locked",
      status: acceptStatus,
      timestamp: null,
      actorLabel: "Mutual",
      icon: isRfqRejected ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />,
    });

    // 5. Purchase Order Issued
    const hasPo = !!order;
    const isPoPlaced = order?.status === "PLACED";
    const isPoCancelled = order?.status === "CANCELLED";
    const isPoRejected = order?.status === "REJECTED";

    let poStatus: TimelineStepStatus = "PENDING";
    if (hasPo) {
      if (isPoCancelled) poStatus = "CANCELLED";
      else if (isPoRejected) poStatus = "REJECTED";
      else if (isPoPlaced) poStatus = "CURRENT";
      else poStatus = "COMPLETED";
    } else if (isRfqAccepted) {
      poStatus = "CURRENT";
    }

    list.push({
      key: "PO_ISSUED",
      title: "Purchase Order Issued",
      subtitle: order
        ? `PO Reference: ${order.poNumber} (${order.currency} ${order.totalAmount.toLocaleString()})`
        : "Buyer generates binding commercial purchase order",
      status: poStatus,
      timestamp: order?.placedAt || null,
      actorLabel: "Buyer",
      icon: <ClipboardList className="w-4 h-4" />,
    });

    // 6. PO Confirmed by Supplier
    const isConfirmedOrBeyond =
      order &&
      ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(
        order.status
      );
    let confirmStatus: TimelineStepStatus = "PENDING";
    if (isConfirmedOrBeyond) {
      confirmStatus = order.status === "CONFIRMED" ? "CURRENT" : "COMPLETED";
    }

    list.push({
      key: "PO_CONFIRMED",
      title: "PO Confirmed by Supplier",
      subtitle: order?.confirmedAt
        ? "Manufacturer accepted order and confirmed batch production"
        : "Supplier verifies synthesis capacity and schedules fulfillment",
      status: confirmStatus,
      timestamp: order?.confirmedAt || null,
      actorLabel: "Supplier",
      icon: <CheckCircle className="w-4 h-4" />,
    });

    // 7. Processing Started
    const isProcessingOrBeyond =
      order &&
      ["PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(order.status);
    let processStatus: TimelineStepStatus = "PENDING";
    if (isProcessingOrBeyond) {
      processStatus = order.status === "PROCESSING" ? "CURRENT" : "COMPLETED";
    }

    list.push({
      key: "PROCESSING_STARTED",
      title: "Manufacturing & Batch Synthesis",
      subtitle: order?.processingAt
        ? "Material synthesized, analyzed, and packaged for dispatch"
        : "Chemical production and quality testing in progress",
      status: processStatus,
      timestamp: order?.processingAt || null,
      actorLabel: "Supplier",
      icon: <Factory className="w-4 h-4" />,
    });

    // 8. Consignment Dispatched
    const isShippedOrBeyond =
      order && ["SHIPPED", "DELIVERED", "COMPLETED"].includes(order.status);
    let shipStatus: TimelineStepStatus = "PENDING";
    if (isShippedOrBeyond) {
      shipStatus = order.status === "SHIPPED" ? "CURRENT" : "COMPLETED";
    }

    const carrierText = shipment?.carrier
      ? `Carrier: ${shipment.carrier} (AWB #${shipment.trackingNumber})`
      : "Consignment handed over to verified freight carrier";

    list.push({
      key: "SHIPMENT_DISPATCHED",
      title: "Consignment Dispatched",
      subtitle: carrierText,
      status: shipStatus,
      timestamp: shipment?.shippedAt || order?.shippedAt || null,
      actorLabel: "Logistics",
      icon: <Truck className="w-4 h-4" />,
    });

    // 9. Delivery Acknowledged
    const isDeliveredOrBeyond =
      order && ["DELIVERED", "COMPLETED"].includes(order.status);
    let deliverStatus: TimelineStepStatus = "PENDING";
    if (isDeliveredOrBeyond) {
      deliverStatus = order.status === "DELIVERED" ? "CURRENT" : "COMPLETED";
    }

    list.push({
      key: "DELIVERED",
      title: "Physical Delivery Acknowledged",
      subtitle: order?.deliveredAt
        ? "Consignment arrived and physical receipt verified"
        : "Consignment delivered to buyer destination warehouse",
      status: deliverStatus,
      timestamp: order?.deliveredAt || null,
      actorLabel: "Buyer / Supplier",
      icon: <PackageCheck className="w-4 h-4" />,
    });

    // 10. Completed & Settled
    const isCompleted = order?.status === "COMPLETED";
    list.push({
      key: "COMPLETED",
      title: "Transaction Closed & Settled",
      subtitle: isCompleted
        ? "Procurement lifecycle concluded; archival settlement finalized"
        : "Final commercial closure following verified delivery",
      status: isCompleted ? "COMPLETED" : "PENDING",
      timestamp: order?.completedAt || null,
      actorLabel: "Platform",
      icon: <Sparkles className="w-4 h-4" />,
    });

    return list;
  }, [rfq, quotations, order, shipment]);

  const completedCount = steps.filter((s) => s.status === "COMPLETED").length;

  const formatDate = (iso?: string | null) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  return (
    <div className={`bg-white border border-[#DFE1E6] rounded-2xl p-5 sm:p-7 shadow-xs ${className}`}>
      {/* Timeline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#DFE1E6] mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#0052CC] bg-[#DEEBFF] px-2 py-0.5 rounded">
              COMMERCIAL AUDIT TRAIL
            </span>
            <span className="text-xs font-bold text-[#5E6C84]">
              {completedCount} of {steps.length} Milestones Reached
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#091E42] mt-1">
            Unified Transaction Lifecycle Timeline
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#5E6C84]">
          <ShieldCheck className="w-4 h-4 text-[#00875A]" />
          <span>Immutable Platform Audit Verification</span>
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="relative">
        {/* Continuous Connecting Line for Desktop */}
        <div className="hidden lg:block absolute top-[22px] left-6 right-6 h-0.5 bg-[#DFE1E6] -z-0" />

        {/* Steps Grid: Responsive List on Mobile, Horizontal Flow on Desktop */}
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-5 xl:grid-cols-5 gap-y-6 gap-x-4 relative z-10">
          {steps.map((step, idx) => {
            const isDone = step.status === "COMPLETED";
            const isCurrent = step.status === "CURRENT";
            const isCancelled = step.status === "CANCELLED" || step.status === "REJECTED";
            const formattedTime = formatDate(step.timestamp);

            return (
              <div
                key={step.key}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                  isDone
                    ? "bg-[#E3FCEF]/40 border-[#ABF5D1]"
                    : isCurrent
                    ? "bg-[#DEEBFF]/40 border-[#0052CC] ring-1 ring-[#0052CC]/30 shadow-xs"
                    : isCancelled
                    ? "bg-rose-50/50 border-rose-200"
                    : "bg-[#FAFBFC] border-[#DFE1E6] opacity-65"
                }`}
              >
                {/* Header with Icon & State */}
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                      isDone
                        ? "bg-[#E3FCEF] text-[#006644]"
                        : isCurrent
                        ? "bg-[#0052CC] text-white animate-pulse"
                        : isCancelled
                        ? "bg-rose-100 text-rose-700"
                        : "bg-[#F4F5F7] text-[#5E6C84]"
                    }`}
                  >
                    {step.icon}
                  </div>

                  <span
                    className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      isDone
                        ? "bg-[#E3FCEF] text-[#006644]"
                        : isCurrent
                        ? "bg-[#DEEBFF] text-[#0052CC]"
                        : isCancelled
                        ? "bg-rose-100 text-rose-700"
                        : "bg-[#F4F5F7] text-[#5E6C84]"
                    }`}
                  >
                    {step.status}
                  </span>
                </div>

                {/* Title & Actor */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[#091E42] leading-tight line-clamp-1">
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-[#5E6C84] leading-normal line-clamp-2">
                    {step.subtitle}
                  </p>
                </div>

                {/* Timestamp */}
                {formattedTime && (
                  <div className="mt-2.5 pt-2 border-t border-[#DFE1E6]/60 flex items-center gap-1.5 text-[10px] font-mono text-[#5E6C84]">
                    <Clock className="w-3 h-3 text-[#8993A4] shrink-0" />
                    <span className="truncate">{formattedTime}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
