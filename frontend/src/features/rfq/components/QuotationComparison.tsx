import React, { useState } from "react";
import { QuotationResponse } from "../api/submitQuotation";
import { acceptQuotation } from "../api/acceptQuotation";
import { rejectQuotation } from "../api/rejectQuotation";

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
  const [selectedVersion, setSelectedVersion] = useState<number | null>(
    quotations.length > 1 ? quotations[1].quotationVersion : null
  );

  const [modalMode, setModalMode] = useState<"accept" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  if (!quotations || quotations.length === 0) {
    return (
      <section className="bg-white border border-slate-200 rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Quotation Status
        </p>
        <div className="mt-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 p-8 text-center">
          <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            ⏱
          </div>
          <h3 className="text-base font-medium text-slate-800">
            Waiting for supplier quotation
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            The assigned supplier has received your RFQ and has not yet submitted a quotation. Once submitted, quotation details and revision history will appear here.
          </p>
        </div>
      </section>
    );
  }

  const latestQuotation = quotations[0];
  const comparedQuotation = quotations.find(
    (q) => q.quotationVersion === selectedVersion
  );

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
    <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Quotation Revisions & Commercial Terms
          </p>
          <h2 className="text-lg font-semibold text-slate-900 mt-1">
            Supplier Quotation (Version {latestQuotation.quotationVersion})
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {rfqStatus === "ACCEPTED" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Quotation Accepted
            </span>
          ) : rfqStatus === "REJECTED" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300">
              <svg className="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Quotation Rejected
            </span>
          ) : rfqStatus === "CLOSED" ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
              RFQ Closed
            </span>
          ) : rfqStatus === "CANCELLED" ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
              RFQ Cancelled
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● Active Quotation
            </span>
          )}
        </div>
      </div>

      {/* LATEST QUOTATION PROMINENT CARD */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-700 pb-4">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Latest Quotation (v{latestQuotation.quotationVersion})
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-white">
                {latestQuotation.currency} {latestQuotation.unitPrice.toFixed(2)}
              </span>
              <span className="text-sm text-slate-300">/ unit</span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">Submitted On</span>
            <span className="text-sm font-medium text-slate-200">
              {new Date(latestQuotation.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400">Min. Order Quantity</p>
            <p className="mt-1 font-semibold text-slate-100">
              {latestQuotation.minimumOrderQuantity != null
                ? `${latestQuotation.minimumOrderQuantity} units`
                : "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Lead Time</p>
            <p className="mt-1 font-semibold text-slate-100">
              {latestQuotation.leadTimeDays != null
                ? `${latestQuotation.leadTimeDays} days`
                : "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Valid Until</p>
            <p className="mt-1 font-semibold text-slate-100">
              {latestQuotation.validityDate}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Packaging</p>
            <p className="mt-1 font-semibold text-slate-100 truncate">
              {latestQuotation.packagingDetails || "Standard"}
            </p>
          </div>
        </div>

        {latestQuotation.commercialNotes && (
          <div className="mt-4 pt-3 border-t border-slate-700/60 text-xs text-slate-300">
            <span className="font-medium text-slate-400">Commercial Notes: </span>
            {latestQuotation.commercialNotes}
          </div>
        )}

        {/* DECISION ACTION BAR (Enabled only on Latest Quotation when RFQ is QUOTED) */}
        {rfqStatus === "QUOTED" && (
          <div className="mt-5 pt-4 border-t border-slate-700/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-300">
              Review commercial terms above. Accepting will confirm this quotation version for order fulfillment.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setDecisionError(null);
                  setModalMode("reject");
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-rose-300 hover:text-rose-200 transition-colors shadow-sm cursor-pointer"
              >
                Reject Quotation
              </button>
              <button
                type="button"
                onClick={() => {
                  setDecisionError(null);
                  setModalMode("accept");
                }}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#17B5AE] hover:bg-[#149e98] text-white transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Accept Quotation (v{latestQuotation.quotationVersion})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMATION DECISION MODAL */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  modalMode === "accept"
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-rose-100 text-rose-600"
                }`}
              >
                {modalMode === "accept" ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900">
                  {modalMode === "accept"
                    ? `Accept Quotation Version ${latestQuotation.quotationVersion}?`
                    : `Reject Quotation Version ${latestQuotation.quotationVersion}?`}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {modalMode === "accept"
                    ? `You are about to accept the commercial terms of ${latestQuotation.currency} ${latestQuotation.unitPrice.toFixed(2)} / unit with lead time of ${latestQuotation.leadTimeDays || "standard"} days. This action will transition the RFQ to ACCEPTED.`
                    : `You are about to reject this quotation. This action is final and will transition the RFQ to REJECTED.`}
                </p>
              </div>
            </div>

            {decisionError && (
              <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                {decisionError}
              </div>
            )}

            <div className="mt-4">
              <label htmlFor="decision-notes" className="block text-xs font-medium text-slate-700 mb-1">
                {modalMode === "accept" ? "Decision Notes (Optional)" : "Rejection Reason (Optional)"}
              </label>
              <textarea
                id="decision-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  modalMode === "accept"
                    ? "Add any internal procurement or agreement remarks..."
                    : "Specify reason for decline (e.g., target price exceeded)..."
                }
                rows={2}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-[#17B5AE] focus:ring-1 focus:ring-[#17B5AE] outline-none"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setModalMode(null);
                  setDecisionError(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDecision}
                className={`px-5 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 ${
                  modalMode === "accept"
                    ? "bg-[#17B5AE] hover:bg-[#149e98]"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {submitting ? "Processing..." : modalMode === "accept" ? "Confirm Acceptance" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERSION COMPARISON & REVISION HISTORY */}
      {quotations.length > 1 && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800">
              Quotation Revision History & Comparison ({quotations.length} Versions)
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="compare-select" className="text-slate-500 font-medium">
                Compare Latest (v{latestQuotation.quotationVersion}) with:
              </label>
              <select
                id="compare-select"
                value={selectedVersion ?? ""}
                onChange={(e) => setSelectedVersion(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {quotations.slice(1).map((q) => (
                  <option key={q.id} value={q.quotationVersion}>
                    Version {q.quotationVersion} ({new Date(q.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {comparedQuotation && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Commercial Term</th>
                    <th className="py-3 px-4 bg-emerald-50/50 text-emerald-800">
                      Latest (v{latestQuotation.quotationVersion})
                    </th>
                    <th className="py-3 px-4">
                      Previous (v{comparedQuotation.quotationVersion})
                    </th>
                    <th className="py-3 px-4">Variance / Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-800">Unit Price</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 bg-emerald-50/20">
                      {latestQuotation.currency} {latestQuotation.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {comparedQuotation.currency} {comparedQuotation.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {latestQuotation.unitPrice < comparedQuotation.unitPrice ? (
                        <span className="text-emerald-600 font-medium">
                          ↓ -{(comparedQuotation.unitPrice - latestQuotation.unitPrice).toFixed(2)} ({(( (comparedQuotation.unitPrice - latestQuotation.unitPrice) / comparedQuotation.unitPrice ) * 100).toFixed(1)}% reduction)
                        </span>
                      ) : latestQuotation.unitPrice > comparedQuotation.unitPrice ? (
                        <span className="text-amber-600 font-medium">
                          ↑ +{(latestQuotation.unitPrice - comparedQuotation.unitPrice).toFixed(2)} ({(( (latestQuotation.unitPrice - comparedQuotation.unitPrice) / comparedQuotation.unitPrice ) * 100).toFixed(1)}% increase)
                        </span>
                      ) : (
                        <span className="text-slate-400">No change</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-800">Lead Time</td>
                    <td className="py-3 px-4 text-slate-900 bg-emerald-50/20">
                      {latestQuotation.leadTimeDays != null ? `${latestQuotation.leadTimeDays} days` : "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {comparedQuotation.leadTimeDays != null ? `${comparedQuotation.leadTimeDays} days` : "—"}
                    </td>
                    <td className="py-3 px-4">
                      {latestQuotation.leadTimeDays != null && comparedQuotation.leadTimeDays != null ? (
                        latestQuotation.leadTimeDays < comparedQuotation.leadTimeDays ? (
                          <span className="text-emerald-600 font-medium">
                            {comparedQuotation.leadTimeDays - latestQuotation.leadTimeDays} days faster
                          </span>
                        ) : latestQuotation.leadTimeDays > comparedQuotation.leadTimeDays ? (
                          <span className="text-amber-600 font-medium">
                            +{latestQuotation.leadTimeDays - comparedQuotation.leadTimeDays} days longer
                          </span>
                        ) : (
                          <span className="text-slate-400">Unchanged</span>
                        )
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-800">Minimum Order Qty</td>
                    <td className="py-3 px-4 text-slate-900 bg-emerald-50/20">
                      {latestQuotation.minimumOrderQuantity != null ? `${latestQuotation.minimumOrderQuantity} units` : "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {comparedQuotation.minimumOrderQuantity != null ? `${comparedQuotation.minimumOrderQuantity} units` : "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {latestQuotation.minimumOrderQuantity != null && comparedQuotation.minimumOrderQuantity != null && latestQuotation.minimumOrderQuantity !== comparedQuotation.minimumOrderQuantity
                        ? `Changed from ${comparedQuotation.minimumOrderQuantity}`
                        : <span className="text-slate-400">Unchanged</span>}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-800">Validity Date</td>
                    <td className="py-3 px-4 text-slate-900 bg-emerald-50/20">{latestQuotation.validityDate}</td>
                    <td className="py-3 px-4 text-slate-700">{comparedQuotation.validityDate}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {latestQuotation.validityDate !== comparedQuotation.validityDate ? "Updated" : <span className="text-slate-400">Unchanged</span>}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-800">Packaging</td>
                    <td className="py-3 px-4 text-slate-900 bg-emerald-50/20">{latestQuotation.packagingDetails || "—"}</td>
                    <td className="py-3 px-4 text-slate-700">{comparedQuotation.packagingDetails || "—"}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {latestQuotation.packagingDetails !== comparedQuotation.packagingDetails ? "Updated" : <span className="text-slate-400">Unchanged</span>}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-800">Commercial Notes</td>
                    <td className="py-3 px-4 text-slate-900 bg-emerald-50/20">{latestQuotation.commercialNotes || "—"}</td>
                    <td className="py-3 px-4 text-slate-700">{comparedQuotation.commercialNotes || "—"}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {latestQuotation.commercialNotes !== comparedQuotation.commercialNotes ? "Updated" : <span className="text-slate-400">Unchanged</span>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
