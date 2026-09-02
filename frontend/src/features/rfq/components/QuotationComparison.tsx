"use client";

import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  FileCheck,
  Send,
} from "lucide-react";
import { QuotationResponse } from "../api/submitQuotation";
import { acceptQuotation } from "../api/acceptQuotation";
import { rejectQuotation } from "../api/rejectQuotation";

interface QuotationComparisonProps {
  quotations: QuotationResponse[];
  rfqStatus: string;
  rfqId: string;
  onDecisionSuccess?: () => void;
  onOpenCounterOffer?: () => void;
}

export function QuotationComparison({
  quotations,
  rfqStatus,
  rfqId,
  onDecisionSuccess,
  onOpenCounterOffer,
}: QuotationComparisonProps) {
  const [modalMode, setModalMode] = useState<"accept" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  if (!quotations || quotations.length === 0) {
    return (
      <div className="bg-white border border-[#DFE1E6] rounded-2xl p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-[#F4F5F7] text-[#5E6C84] flex items-center justify-center mx-auto mb-3 font-bold">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[#091E42]">
          Awaiting Commercial Quotation
        </h3>
        <p className="text-xs text-[#5E6C84] max-w-md mx-auto mt-1">
          The verified manufacturer has received your inquiry and is preparing a formal commercial quotation with pricing and lead times.
        </p>
      </div>
    );
  }

  const latestQuotation = quotations[0];
  const previousQuotation = quotations.length > 1 ? quotations[1] : null;
  const canBuyerAct = (rfqStatus === "QUOTED" || rfqStatus === "COUNTERED") && latestQuotation.actorType !== "BUYER";

  async function handleConfirmDecision() {
    if (!modalMode) return;
    try {
      setSubmitting(true);
      setDecisionError(null);

      if (modalMode === "accept") {
        await acceptQuotation(rfqId, latestQuotation.id, notes.trim() || undefined);
      } else {
        await rejectQuotation(rfqId, latestQuotation.id, notes.trim() || undefined);
      }

      setModalMode(null);
      setNotes("");
      if (onDecisionSuccess) {
        onDecisionSuccess();
      }
    } catch (err) {
      setDecisionError(
        err instanceof Error ? err.message : "Failed to submit quotation decision"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const formatActionLabel = (action?: string | null) => {
    switch (action) {
      case "COUNTER_OFFER":
        return "Counter Offer";
      case "REVISED_QUOTATION":
        return "Revised Quotation";
      case "INITIAL_QUOTATION":
      default:
        return "Initial Proposal";
    }
  };

  // Price delta helper
  const getPriceDelta = (current: number, prev: number | null | undefined) => {
    if (prev == null || prev === 0) return null;
    const diff = current - prev;
    const pct = ((diff / prev) * 100).toFixed(1);
    return { diff, pct, isLower: diff < 0, isHigher: diff > 0 };
  };

  // Turn ownership determination
  const turnIndicator = useMemo(() => {
    if (rfqStatus === "ACCEPTED") {
      return {
        label: "Quotation Accepted & Finalized",
        variant: "success",
        subtext: "Commercial terms agreed. Ready to generate Purchase Order.",
      };
    }
    if (rfqStatus === "REJECTED") {
      return {
        label: "Quotation Declined",
        variant: "danger",
        subtext: "Commercial proposal was declined.",
      };
    }
    if (rfqStatus === "CLOSED" || rfqStatus === "CANCELLED") {
      return {
        label: "Inquiry Closed",
        variant: "neutral",
        subtext: "This procurement inquiry is no longer active.",
      };
    }
    if (latestQuotation.actorType === "SUPPLIER") {
      return {
        label: "Your Turn to Respond",
        variant: "warning",
        subtext: "Supplier submitted proposal. You may Accept, Reject, or propose a Counter-Offer.",
      };
    }
    if (latestQuotation.actorType === "BUYER") {
      return {
        label: "Awaiting Supplier Response",
        variant: "brand",
        subtext: "Your counter-offer was dispatched. Awaiting manufacturer response.",
      };
    }
    return {
      label: "Negotiation in Progress",
      variant: "neutral",
      subtext: "Multi-round commercial proposal exchange in progress.",
    };
  }, [rfqStatus, latestQuotation]);

  const delta = previousQuotation ? getPriceDelta(latestQuotation.unitPrice, previousQuotation.unitPrice) : null;

  return (
    <div className="space-y-6">
      {/* Turn Ownership Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          turnIndicator.variant === "warning"
            ? "bg-amber-50 border-amber-200 text-amber-900"
            : turnIndicator.variant === "success"
            ? "bg-[#E3FCEF] border-[#ABF5D1] text-[#006644]"
            : turnIndicator.variant === "danger"
            ? "bg-rose-50 border-rose-200 text-rose-800"
            : turnIndicator.variant === "brand"
            ? "bg-[#DEEBFF] border-[#B3D4FF] text-[#0747A6]"
            : "bg-[#FAFBFC] border-[#DFE1E6] text-[#5E6C84]"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              turnIndicator.variant === "warning"
                ? "bg-amber-200/60 text-amber-900 font-extrabold"
                : turnIndicator.variant === "success"
                ? "bg-[#ABF5D1] text-[#006644]"
                : turnIndicator.variant === "danger"
                ? "bg-rose-200 text-rose-800"
                : turnIndicator.variant === "brand"
                ? "bg-[#B3D4FF] text-[#0747A6]"
                : "bg-[#DFE1E6] text-[#5E6C84]"
            }`}
          >
            {turnIndicator.label}
          </span>
          <span className="text-xs font-semibold">{turnIndicator.subtext}</span>
        </div>
      </div>

      {/* 1. LATEST / CURRENT ACTIVE QUOTATION CARD */}
      <div className="bg-white border-2 border-[#0052CC] rounded-2xl shadow-xs overflow-hidden">
        {/* Header Ribbon */}
        <div className="px-6 py-4 bg-[#091E42] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-[#0052CC] text-white px-2.5 py-0.5 rounded">
              CURRENT QUOTATION — VERSION {latestQuotation.quotationVersion}
            </span>
            <span className="text-xs text-[#DEEBFF] font-medium">
              {formatActionLabel(latestQuotation.actionType)} by {latestQuotation.actorType === "BUYER" ? "Buyer (You)" : "Supplier"}
            </span>
          </div>

          <span className="text-xs font-mono text-[#8993A4]">
            {new Date(latestQuotation.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Commercial Figures */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b border-[#DFE1E6]">
            {/* Unit Price */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block mb-1">
                Agreed Unit Price
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-extrabold text-[#091E42]">
                  {latestQuotation.currency} {latestQuotation.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
                {delta && (
                  <span
                    className={`inline-flex items-center text-xs font-bold font-mono px-1.5 py-0.2 rounded ${
                      delta.isLower
                        ? "bg-[#E3FCEF] text-[#006644]"
                        : delta.isHigher
                        ? "bg-[#FFEBE6] text-[#BF2600]"
                        : "bg-[#F4F5F7] text-[#5E6C84]"
                    }`}
                  >
                    {delta.isLower ? "↓" : "↑"} {Math.abs(Number(delta.pct))}%
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#5E6C84]">per standard unit</span>
            </div>

            {/* Minimum Order Quantity */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block mb-1">
                Minimum Order Quantity (MOQ)
              </span>
              <span className="font-mono text-xl font-bold text-[#091E42] block">
                {latestQuotation.minimumOrderQuantity != null
                  ? `${latestQuotation.minimumOrderQuantity.toLocaleString()} Units`
                  : "Standard"}
              </span>
              <span className="text-[11px] text-[#5E6C84]">Production threshold</span>
            </div>

            {/* Fulfillment Lead Time */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block mb-1">
                Fulfillment Lead Time
              </span>
              <span className="font-mono text-xl font-bold text-[#091E42] block">
                {latestQuotation.leadTimeDays != null ? `${latestQuotation.leadTimeDays} Days` : "Standard"}
              </span>
              <span className="text-[11px] text-[#5E6C84]">Upon order confirmation</span>
            </div>

            {/* Validity Date */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block mb-1">
                Quotation Validity
              </span>
              <span className="font-mono text-base font-bold text-[#091E42] block">
                {latestQuotation.validityDate
                  ? new Date(latestQuotation.validityDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "30 Days"}
              </span>
              <span className="text-[11px] text-[#006644] font-medium">Valid Commercial Offer</span>
            </div>
          </div>

          {/* Secondary Details & Commercial Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block mb-1">
                Packaging & Presentation
              </span>
              <p className="font-medium text-[#172B4D]">
                {latestQuotation.packagingDetails || "Standard industrial protective drums / containers"}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block mb-1">
                Commercial Terms & Notes
              </span>
              <p className="font-medium text-[#172B4D] italic bg-[#FAFBFC] p-2.5 rounded-lg border border-[#DFE1E6]">
                {latestQuotation.commercialNotes || "Standard B2B commercial terms and quality warranty apply."}
              </p>
            </div>
          </div>

          {/* Commercial Message (if Counter-Offer) */}
          {latestQuotation.commercialMessage && (
            <div className="p-4 bg-[#DEEBFF]/40 border border-[#B3D4FF] rounded-xl text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0747A6] block mb-1">
                Commercial Counter Rationale
              </span>
              <p className="text-[#091E42] font-medium leading-relaxed">
                "{latestQuotation.commercialMessage}"
              </p>
            </div>
          )}

          {/* Action Bar for Buyer Decisioning */}
          {canBuyerAct && (
            <div className="pt-4 border-t border-[#DFE1E6] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FAFBFC] -mx-6 -mb-6 p-6">
              <div className="text-xs text-[#5E6C84]">
                <strong className="text-[#091E42] block">Action Required</strong>
                Review the supplier's commercial proposal and select your decision.
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalMode("reject")}
                  className="px-4 py-2.5 rounded-xl border border-[#DFE1E6] hover:border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Decline Proposal
                </button>

                {onOpenCounterOffer && (
                  <button
                    type="button"
                    onClick={onOpenCounterOffer}
                    className="px-5 py-2.5 rounded-xl border border-[#0052CC] text-[#0052CC] hover:bg-[#DEEBFF]/50 text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Counter Offer
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setModalMode("accept")}
                  className="px-6 py-2.5 rounded-xl bg-[#00875A] hover:bg-[#006644] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Quotation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. QUOTATION REVISION & NEGOTIATION TIMELINE */}
      {quotations.length > 1 && (
        <div className="bg-white border border-[#DFE1E6] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#DFE1E6] pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#091E42]">
                Commercial Negotiation History
              </h3>
              <p className="text-[11px] text-[#5E6C84]">Previous versions and proposal progression</p>
            </div>
            <span className="font-mono text-xs font-bold text-[#5E6C84] bg-[#F4F5F7] px-2 py-0.5 rounded">
              {quotations.length} Versions Logged
            </span>
          </div>

          <div className="divide-y divide-[#DFE1E6]">
            {quotations.map((quote, idx) => {
              const isCurrent = idx === 0;
              const isBuyer = quote.actorType === "BUYER";

              return (
                <div key={quote.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          isBuyer ? "bg-[#DEEBFF] text-[#0747A6]" : "bg-[#EAE6FF] text-[#403294]"
                        }`}
                      >
                        {isBuyer ? "Buyer" : "Supplier"}
                      </span>
                      <strong className="text-xs font-bold text-[#091E42]">
                        V{quote.quotationVersion} · {formatActionLabel(quote.actionType)}
                      </strong>
                      {isCurrent && (
                        <span className="text-[9px] font-bold bg-[#E3FCEF] text-[#006644] px-2 py-0.2 rounded uppercase">
                          Latest
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#5E6C84] block">
                      {new Date(quote.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-[#5E6C84] block font-sans">Price</span>
                      <span className="font-bold text-[#091E42]">
                        {quote.currency} {quote.unitPrice.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#5E6C84] block font-sans">MOQ</span>
                      <span className="font-bold text-[#091E42]">
                        {quote.minimumOrderQuantity != null ? `${quote.minimumOrderQuantity} U` : "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#5E6C84] block font-sans">Lead Time</span>
                      <span className="font-bold text-[#091E42]">
                        {quote.leadTimeDays != null ? `${quote.leadTimeDays}d` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ACCEPT / REJECT CONFIRMATION MODAL */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#DFE1E6] max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 bg-[#091E42] text-white flex items-center justify-between">
              <h3 className="text-base font-bold">
                {modalMode === "accept" ? "Accept Commercial Quotation" : "Decline Quotation"}
              </h3>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {decisionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                  {decisionError}
                </div>
              )}

              <p className="text-[#172B4D] leading-relaxed">
                {modalMode === "accept"
                  ? `You are accepting Version ${latestQuotation.quotationVersion} at ${latestQuotation.currency} ${latestQuotation.unitPrice.toFixed(2)} / unit. Once accepted, you will be able to issue the binding Purchase Order.`
                  : `Are you sure you want to decline this quotation? You may optionally include a message explaining why.`}
              </p>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] mb-1">
                  Optional Remarks / Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Terms accepted. Ready for standard delivery schedule."
                  className="w-full text-xs rounded-xl border border-[#DFE1E6] p-3 text-[#091E42] placeholder:text-[#8993A4] focus:outline-none focus:border-[#0052CC]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DFE1E6]">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-[#5E6C84]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDecision}
                  disabled={submitting}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold uppercase tracking-wider ${
                    modalMode === "accept"
                      ? "bg-[#00875A] hover:bg-[#006644]"
                      : "bg-[#DE350B] hover:bg-[#BF2600]"
                  }`}
                >
                  {submitting ? "Processing..." : modalMode === "accept" ? "Confirm Acceptance" : "Decline"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
