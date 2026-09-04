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
    <div className={`bg-white rounded-[8px] border border-[#E4E4E7] p-5 sm:p-6 shadow-tactile-card ${className}`}>
      {/* Timeline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E4E7] mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#0052CC] bg-[#EFF6FF] px-2 py-0.5 rounded-[4px] border border-[#BFDBFE]">
              COMMERCIAL AUDIT TRAIL
            </span>
            <span className="text-xs font-medium text-[#64748B]">
              {completedCount} of {steps.length} Milestones Reached
            </span>
          </div>
          <h2 className="text-sm sm:text-[15px] font-bold text-[#0F172A] mt-1">
            Unified Transaction Lifecycle Timeline
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#64748B]">
          <ShieldCheck className="w-4 h-4 text-[#059669]" />
          <span>Immutable Platform Audit Trail</span>
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="relative">
        {/* Continuous Connecting Line for Desktop */}
        <div className="hidden lg:block absolute top-[20px] left-6 right-6 h-0.5 bg-[#E4E4E7] -z-0" />

        {/* Steps Grid: Responsive List on Mobile, Horizontal Flow on Desktop */}
        <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-5 xl:grid-cols-5 gap-y-4 gap-x-3 relative z-10">
          {steps.map((step) => {
            const isDone = step.status === "COMPLETED";
            const isCurrent = step.status === "CURRENT";
            const isCancelled = step.status === "CANCELLED" || step.status === "REJECTED";
            const formattedTime = formatDate(step.timestamp);

            return (
              <div
                key={step.key}
                className={`p-3 rounded-[6px] border transition-colors ${
                  isDone
                    ? "bg-[#ECFDF5]/50 border-[rgba(5,150,105,0.2)]"
                    : isCurrent
                    ? "bg-[#EFF6FF]/60 border-[#0052CC] shadow-xs"
                    : isCancelled
                    ? "bg-[#FEF2F2]/50 border-[rgba(220,38,38,0.2)]"
                    : "bg-[#FAFAFA] border-[#E4E4E7] opacity-65"
                }`}
              >
                {/* Header with Icon & State */}
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-[4px] flex items-center justify-center font-bold text-xs ${
                      isDone
                        ? "bg-[#ECFDF5] text-[#059669] border border-[rgba(5,150,105,0.2)]"
                        : isCurrent
                        ? "bg-[#0052CC] text-white"
                        : isCancelled
                        ? "bg-[#FEF2F2] text-[#DC2626]"
                        : "bg-[#F4F4F5] text-[#64748B]"
                    }`}
                  >
                    {step.icon}
                  </div>

                  <span
                    className={`text-[9px] font-mono font-medium uppercase tracking-wider px-1.5 py-0.2 rounded-[3px] ${
                      isDone
                        ? "bg-[#ECFDF5] text-[#059669] border border-[rgba(5,150,105,0.2)]"
                        : isCurrent
                        ? "bg-[#EFF6FF] text-[#0052CC] border border-[#BFDBFE]"
                        : isCancelled
                        ? "bg-[#FEF2F2] text-[#DC2626] border border-[rgba(220,38,38,0.2)]"
                        : "bg-[#F4F4F5] text-[#64748B] border border-[#E4E4E7]"
                    }`}
                  >
                    {step.status}
                  </span>
                </div>

                {/* Title & Actor */}
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-[#0F172A] leading-tight line-clamp-1">
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-[#64748B] leading-normal line-clamp-2">
                    {step.subtitle}
                  </p>
                </div>

                {/* Timestamp */}
                {formattedTime && (
                  <div className="mt-2 pt-1.5 border-t border-[#E4E4E7] flex items-center gap-1 text-[10px] font-mono text-[#64748B]">
                    <Clock className="w-3 h-3 text-[#94A3B8] shrink-0" />
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
