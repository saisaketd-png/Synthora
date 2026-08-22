import React, { useState } from "react";
import { QuotationResponse } from "../api/submitQuotation";
import { acceptQuotation } from "../api/acceptQuotation";
import { rejectQuotation } from "../api/rejectQuotation";
import { GenericDocumentManager } from "@/features/documents/components/GenericDocumentManager";

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
      <section className="mb-16">
        <div className="border-b-[2px] border-[#0A192F] pb-2 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#0A192F]">
            03 / COMMERCIAL NEGOTIATION
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Quotation & Counter-Offer History</p>
        </div>
        <div className="py-8 border-b border-slate-200 text-center bg-slate-50/50 rounded-xl">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">
            NO QUOTATIONS OR COUNTER OFFERS TRANSMITTED YET.
          </p>
        </div>
      </section>
    );
  }

  const latestQuotation = quotations[0];
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
        return "COUNTER OFFER";
      case "REVISED_QUOTATION":
        return "REVISED QUOTATION";
      case "INITIAL_QUOTATION":
      default:
        return "INITIAL QUOTATION";
    }
  };

  const getStatusDisplayLabel = () => {
    switch (rfqStatus) {
      case "ACCEPTED":
        return "Quotation Accepted";
      case "REJECTED":
        return "Quotation Rejected";
      case "COUNTERED":
        return latestQuotation.actorType === "BUYER"
          ? "Awaiting Supplier Response"
          : "Counter Offer Transmitted";
      case "QUOTED":
        return latestQuotation.actorType === "BUYER"
          ? "Awaiting Supplier Response"
          : "Awaiting Buyer Decision";
      default:
        return rfqStatus;
    }
  };

  return (
    <section className="mb-16 relative">
      {/* Header */}
      <div className="border-b-[2px] border-[#0A192F] pb-3 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#0A192F]">
            03 / COMMERCIAL NEGOTIATION
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Quotation & Counter-Offer History</p>
        </div>
        <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
          {quotations.length} REVISION{quotations.length > 1 ? "S" : ""} LOGGED
        </span>
      </div>

      {/* NEGOTIATION STATUS SUMMARY CARD */}
      <div className="mb-10 bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-800 pb-2">
          NEGOTIATION SUMMARY
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              CURRENT OFFER
            </span>
            <span className="font-mono text-xl font-bold text-teal-400">
              {latestQuotation.currency} {latestQuotation.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              MOQ
            </span>
            <span className="font-mono text-sm font-bold text-slate-200">
              {latestQuotation.minimumOrderQuantity != null ? `${latestQuotation.minimumOrderQuantity.toLocaleString()} units` : "Standard"}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              LEAD TIME
            </span>
            <span className="font-mono text-sm font-bold text-slate-200">
              {latestQuotation.leadTimeDays != null ? `${latestQuotation.leadTimeDays} DAYS` : "Standard"}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              STATUS
            </span>
            <span className="inline-block text-xs font-bold px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
              {getStatusDisplayLabel()}
            </span>
          </div>
        </div>
      </div>

      {/* VERTICAL NEGOTIATION TIMELINE */}
      <div className="space-y-6 relative">
        {quotations.map((q, idx) => {
          const isLatest = idx === 0;
          const isBuyerActor = q.actorType === "BUYER";
          const isExpired = q.validityDate ? new Date(q.validityDate) < new Date(new Date().setHours(0, 0, 0, 0)) : false;

          return (
            <React.Fragment key={q.id}>
              {/* Connector Arrow between revisions */}
              {idx > 0 && (
                <div className="flex justify-center my-2">
                  <div className="flex flex-col items-center gap-0.5 text-slate-300">
                    <div className="w-0.5 h-4 bg-slate-300" />
                    <span className="text-xs font-bold">↓</span>
                  </div>
                </div>
              )}

              {/* Revision Timeline Card */}
              <div
                className={`rounded-2xl border transition-all p-6 ${
                  isLatest
                    ? isExpired
                      ? "border-rose-300 bg-rose-50/30 shadow-md ring-1 ring-rose-300"
                      : "border-teal-500/80 bg-white shadow-lg ring-1 ring-teal-500/30"
                    : "border-slate-200 bg-slate-50/60 opacity-85"
                }`}
              >
                {/* Revision Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    {/* Actor Badge */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider ${
                        isBuyerActor
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-purple-50 text-purple-700 border-purple-200"
                      }`}
                    >
                      {isBuyerActor ? "BUYER" : "SUPPLIER"}
                    </span>

                    {/* Version & Action */}
                    <span className="font-mono text-sm font-bold text-slate-900">
                      V{q.quotationVersion} · {formatActionLabel(q.actionType)}
                    </span>

                    {/* Latest Badge */}
                    {isLatest && !isExpired && (
                      <span className="text-[9px] font-bold bg-teal-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                        CURRENT / LATEST
                      </span>
                    )}

                    {/* Expired Badge */}
                    {isExpired && (
                      <span className="text-[9px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs animate-pulse">
                        QUOTATION EXPIRED
                      </span>
                    )}

                    {!isLatest && (
                      <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">
                        SUPERSEDED
                      </span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="font-mono text-xs text-slate-500">
                    {new Date(q.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).toUpperCase()}
                  </span>
                </div>

                {/* Commercial Content Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-4">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      UNIT PRICE
                    </span>
                    <span className={`font-mono text-lg ${isLatest ? "font-bold text-[#0A192F]" : "font-medium text-slate-700"}`}>
                      {q.currency} {q.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      MOQ
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-800">
                      {q.minimumOrderQuantity != null ? `${q.minimumOrderQuantity.toLocaleString()} units` : "Standard"}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      LEAD TIME
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-800">
                      {q.leadTimeDays != null ? `${q.leadTimeDays} DAYS` : "Standard"}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      VALID UNTIL
                    </span>
                    <span className={`font-mono text-xs font-bold ${isExpired ? "text-rose-600" : "text-slate-800"}`}>
                      {q.validityDate || "30 Days"}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      PACKAGING
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {q.packagingDetails || "Standard"}
                    </span>
                  </div>
                </div>

                {/* Commercial Message / Notes */}
                {(q.commercialMessage || q.commercialNotes) && (
                  <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 p-3 rounded-xl">
                    <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      {isBuyerActor ? "BUYER MESSAGE" : "COMMERCIAL NOTES"}
                    </span>
                    <p className="text-xs font-mono text-slate-700 italic">
                      "{q.commercialMessage || q.commercialNotes}"
                    </p>
                  </div>
                )}

                {/* Actions for Latest Revision */}
                {isLatest && canBuyerAct && (
                  <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    {isExpired ? (
                      <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>This quotation expired on {q.validityDate}. Acceptance is locked.</span>
                      </div>
                    ) : (
                      <div />
                    )}

                    <div className="flex flex-wrap items-center gap-3 ml-auto">
                      <button
                        type="button"
                        disabled={isExpired}
                        onClick={() => {
                          setDecisionError(null);
                          setModalMode("accept");
                        }}
                        className={`px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs ${
                          isExpired
                            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                            : "bg-teal-600 hover:bg-teal-700 text-white"
                        }`}
                      >
                        ACCEPT QUOTATION →
                      </button>
                      {onOpenCounterOffer && (
                        <button
                          type="button"
                          onClick={onOpenCounterOffer}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs"
                        >
                          COUNTER OFFER
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setDecisionError(null);
                          setModalMode("reject");
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                      >
                        REJECT QUOTATION
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* QUOTATION DOCUMENTS */}
      <div className="mt-12 border-t border-slate-200 pt-8">
        <GenericDocumentManager
          title="Quotation Documents"
          description="Technical specifications, certifications, and quotation attachments."
          ownerType="QUOTATION"
          ownerId={latestQuotation.id}
          canUpload={false}
          canDelete={false}
          allowedCategories={[]}
        />
      </div>

      {/* CONFIRMATION DECISION MODAL */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white max-w-md w-full p-8 rounded-2xl border border-slate-300 shadow-2xl">
            <div className="border-b-[2px] border-[#0A192F] pb-2 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#0A192F]">
                {modalMode === "accept"
                  ? `Accept Revision ${latestQuotation.quotationVersion}`
                  : `Reject Revision ${latestQuotation.quotationVersion}`}
              </h3>
            </div>

            {decisionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg">
                {decisionError}
              </div>
            )}

            <p className="text-xs text-slate-600 mb-4">
              {modalMode === "accept"
                ? "Are you sure you want to accept this quotation? This will lock commercial terms and enable Purchase Order creation."
                : "Are you sure you want to reject this quotation? The supplier will be notified."}
            </p>

            <div className="mb-6">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Optional Notes / Reason
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Enter any additional notes..."
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalMode(null);
                  setDecisionError(null);
                }}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                disabled={submitting}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-colors shadow-xs ${
                  modalMode === "accept"
                    ? "bg-teal-600 hover:bg-teal-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {submitting ? "PROCESSING..." : modalMode === "accept" ? "CONFIRM ACCEPTANCE" : "CONFIRM REJECTION"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
