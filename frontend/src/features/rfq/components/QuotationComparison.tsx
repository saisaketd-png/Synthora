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
}

export function QuotationComparison({
  quotations,
  rfqStatus,
  rfqId,
  onDecisionSuccess,
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
            03 / Commercial Quotation
          </h2>
        </div>
        <div className="py-6 border-b border-slate-200">
          <p className="text-xs font-mono text-slate-500 uppercase">NO QUOTATIONS RECEIVED YET.</p>
        </div>
      </section>
    );
  }

  const latestQuotation = quotations[0];

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

  return (
    <section className="mb-16 relative">
      <div className="border-b-[2px] border-[#0A192F] pb-2 mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#0A192F]">
          03 / Commercial Quotation
        </h2>
      </div>

      <div className="flex flex-col">
        {/* Table Header */}
        <div className="hidden md:flex items-center py-2 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <div className="w-[10%]">Revision</div>
          <div className="w-[15%]">Unit Price</div>
          <div className="w-[15%]">MOQ</div>
          <div className="w-[15%]">Lead Time</div>
          <div className="w-[15%]">Validity</div>
          <div className="w-[15%]">Status</div>
          <div className="w-[15%] text-right">Action</div>
        </div>

        {/* Rows */}
        {quotations.map((q, idx) => {
          const isLatest = idx === 0;
          return (
            <div 
              key={q.id} 
              className={`group flex flex-col md:flex-row md:items-center py-4 border-b ${isLatest ? 'border-slate-300 bg-slate-50/50' : 'border-slate-100'} hover:bg-slate-50 transition-colors`}
            >
              <div className="w-full md:w-[10%] mb-2 md:mb-0">
                <span className="md:hidden text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Revision</span>
                <span className={`font-mono text-xs ${isLatest ? 'font-bold text-[#0A192F]' : 'text-slate-500'}`}>
                  REV-{q.quotationVersion.toString().padStart(2, '0')}
                </span>
              </div>
              
              <div className="w-full md:w-[15%] mb-2 md:mb-0">
                <span className="md:hidden text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Unit Price</span>
                <span className={`font-mono text-[13px] ${isLatest ? 'font-bold text-[#0A192F]' : 'text-slate-600'}`}>
                  {q.currency} {q.unitPrice.toFixed(2)}
                </span>
              </div>
              
              <div className="w-full md:w-[15%] mb-2 md:mb-0">
                <span className="md:hidden text-[10px] uppercase font-bold text-slate-400 block mb-0.5">MOQ</span>
                <span className="font-mono text-xs text-slate-700">
                  {q.minimumOrderQuantity != null ? `${q.minimumOrderQuantity.toLocaleString()} units` : "—"}
                </span>
              </div>

              <div className="w-full md:w-[15%] mb-2 md:mb-0">
                <span className="md:hidden text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Lead Time</span>
                <span className="font-mono text-xs text-slate-700">
                  {q.leadTimeDays != null ? `${q.leadTimeDays} DAYS` : "—"}
                </span>
              </div>

              <div className="w-full md:w-[15%] mb-2 md:mb-0">
                <span className="md:hidden text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Validity</span>
                <span className="font-mono text-xs text-slate-700">
                  {q.validityDate}
                </span>
              </div>
              
              <div className="w-full md:w-[15%] mb-3 md:mb-0">
                <span className="md:hidden text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Status</span>
                {isLatest ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#0A192F]">CURRENT</span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SUPERSEDED</span>
                )}
              </div>

              <div className="w-full md:w-[15%] md:text-right">
                {isLatest && rfqStatus === "QUOTED" && (
                  <div className="flex items-center md:justify-end gap-4">
                    <button
                      onClick={() => {
                        setDecisionError(null);
                        setModalMode("accept");
                      }}
                      className="text-[10px] font-bold uppercase tracking-widest text-teal-600 hover:text-teal-800 transition-colors"
                    >
                      ACCEPT →
                    </button>
                    <button
                      onClick={() => {
                        setDecisionError(null);
                        setModalMode("reject");
                      }}
                      className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      REJECT
                    </button>
                  </div>
                )}
                
                {isLatest && rfqStatus === "ACCEPTED" && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600">ACCEPTED</span>
                )}
                {isLatest && rfqStatus === "REJECTED" && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">REJECTED</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {latestQuotation.commercialNotes && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Commercial Notes (Latest Rev)</span>
          <p className="text-xs text-slate-700 leading-relaxed font-mono">
            {latestQuotation.commercialNotes}
          </p>
        </div>
      )}

      {/* QUOTATION DOCUMENTS */}
      <div className="mt-8 border-t border-slate-200 pt-8">
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
          <div className="bg-white max-w-md w-full p-8 border border-slate-300 shadow-2xl">
            <div className="border-b-[2px] border-[#0A192F] pb-2 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#0A192F]">
                {modalMode === "accept"
                  ? `Accept Revision ${latestQuotation.quotationVersion}`
                  : `Reject Revision ${latestQuotation.quotationVersion}`}
              </h3>
            </div>
            
            <p className="text-sm font-medium text-slate-600 leading-relaxed mb-6">
              {modalMode === "accept"
                ? `You are accepting commercial terms of ${latestQuotation.currency} ${latestQuotation.unitPrice.toFixed(2)}/unit. This transitions the RFQ to ACCEPTED and permits PO generation.`
                : `You are permanently rejecting this quotation. The RFQ will be transitioned to REJECTED.`}
            </p>

            {decisionError && (
              <div className="mb-6 border-l-2 border-orange-500 pl-3">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-orange-600">Error</span>
                <span className="text-xs font-mono text-slate-700 mt-1 block">{decisionError}</span>
              </div>
            )}

            <div className="mb-8">
              <label htmlFor="decision-notes" className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                {modalMode === "accept" ? "Internal Acceptance Notes" : "Rejection Rationale"}
              </label>
              <textarea
                id="decision-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional documentation..."
                rows={3}
                className="w-full text-xs font-mono border border-slate-300 p-3 outline-none focus:border-[#0A192F] bg-slate-50"
              />
            </div>

            <div className="flex items-center justify-end gap-6">
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setModalMode(null);
                  setDecisionError(null);
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDecision}
                className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  modalMode === "accept"
                    ? "text-teal-600 hover:text-teal-800"
                    : "text-[#0A192F] hover:text-slate-700"
                }`}
              >
                {submitting ? "PROCESSING..." : modalMode === "accept" ? "CONFIRM ACCEPTANCE →" : "CONFIRM REJECTION →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
