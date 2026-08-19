"use client";

import { useState } from "react";
import { X, GitMerge, AlertTriangle, CheckCircle2 } from "lucide-react";
import { DuplicateCandidate, MergePayload } from "../api/adminCatalogApi";

interface MasterProductMergeModalProps {
  candidate: DuplicateCandidate;
  onMerge: (payload: MergePayload) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export function MasterProductMergeModal({
  candidate,
  onMerge,
  onClose,
  isLoading = false,
}: MasterProductMergeModalProps) {
  const [targetId, setTargetId] = useState<string>(candidate.masterProductIdA);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sourceId = targetId === candidate.masterProductIdA ? candidate.masterProductIdB : candidate.masterProductIdA;
  const sourceCode = targetId === candidate.masterProductIdA ? candidate.codeB : candidate.codeA;
  const sourceName = targetId === candidate.masterProductIdA ? candidate.nameB : candidate.nameA;
  const targetCode = targetId === candidate.masterProductIdA ? candidate.codeA : candidate.codeB;
  const targetName = targetId === candidate.masterProductIdA ? candidate.nameA : candidate.nameB;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!confirmed) {
      setError("Please check the confirmation box to confirm non-destructive merging.");
      return;
    }
    try {
      await onMerge({
        sourceMasterProductId: sourceId,
        targetMasterProductId: targetId,
        adminNotes: adminNotes.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || "Failed to execute controlled merge.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">Controlled Master Product Merge</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-rose-800 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs font-medium">
          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Candidate A */}
            <div className={`p-4 rounded-xl border transition-all ${
              targetId === candidate.masterProductIdA
                ? "border-emerald-500 bg-emerald-50/30"
                : "border-slate-200 bg-slate-50/60"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold text-slate-500">{candidate.codeA}</span>
                {targetId === candidate.masterProductIdA && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase">
                    Canonical Target
                  </span>
                )}
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">{candidate.nameA}</h4>
              <p className="text-slate-600 text-[11px]">CAS: {candidate.casA || "N/A"}</p>
              <button
                type="button"
                onClick={() => setTargetId(candidate.masterProductIdA)}
                className="mt-3 w-full py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold hover:bg-emerald-50 transition-colors text-[11px]"
              >
                Set as Target
              </button>
            </div>

            {/* Candidate B */}
            <div className={`p-4 rounded-xl border transition-all ${
              targetId === candidate.masterProductIdB
                ? "border-emerald-500 bg-emerald-50/30"
                : "border-slate-200 bg-slate-50/60"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold text-slate-500">{candidate.codeB}</span>
                {targetId === candidate.masterProductIdB && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase">
                    Canonical Target
                  </span>
                )}
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">{candidate.nameB}</h4>
              <p className="text-slate-600 text-[11px]">CAS: {candidate.casB || "N/A"}</p>
              <button
                type="button"
                onClick={() => setTargetId(candidate.masterProductIdB)}
                className="mt-3 w-full py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold hover:bg-emerald-50 transition-colors text-[11px]"
              >
                Set as Target
              </button>
            </div>
          </div>

          {/* Merge Impact Warning */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
            <h5 className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Non-Destructive Controlled Merge Guarantee
            </h5>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Source MasterProduct <strong className="font-bold">{sourceCode}</strong> ({sourceName}) will be assigned status <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">MERGED</code> and linked to target <strong className="font-bold">{targetCode}</strong> ({targetName}). Commercial offerings will be reassigned. Historical RFQs and Purchase Orders remain 100% intact and auditable.
            </p>
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Audit Log Notes</label>
            <input
              type="text"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Merging duplicate CAS entries following chemical audit..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 mt-0.5"
            />
            <span className="text-slate-800 font-semibold leading-tight">
              I explicitly confirm merging <strong className="font-bold">{sourceCode}</strong> into <strong className="font-bold">{targetCode}</strong>.
            </span>
          </label>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !confirmed}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <GitMerge className="w-4 h-4" />
              {isLoading ? "Merging..." : "Confirm & Execute Merge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
