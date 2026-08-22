"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, GitMerge, AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";
import { DuplicateCandidate, MergePayload, getDuplicateCandidates, mergeMasterProducts } from "@/features/admin/api/adminCatalogApi";
import { MasterProductMergeModal } from "@/features/admin/components/MasterProductMergeModal";
import { useToast } from "@/shared/context/ToastContext";

export default function DuplicateDetectionPage() {
  const toast = useToast();
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCandidate, setSelectedCandidate] = useState<DuplicateCandidate | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDuplicates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDuplicateCandidates();
      setCandidates(data);
    } catch (e: any) {
      setError(e.message || "Failed to load duplicate candidates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDuplicates();
  }, [fetchDuplicates]);

  const handleMerge = async (payload: MergePayload) => {
    try {
      setActionLoading(true);
      await mergeMasterProducts(payload);
      toast.success("Master Chemicals merged successfully");
      setSelectedCandidate(null);
      await fetchDuplicates();
    } catch (e: any) {
      toast.error("Failed to merge products: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/catalog"
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <GitMerge className="w-6 h-6 text-purple-600" />
              DUPLICATE DETECTION & RESOLUTION WORKSPACE
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review candidate Master Product duplicate pairs and perform controlled, non-destructive merges.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchDuplicates()}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Candidates List */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-500">Scanning catalog for duplicate signals...</div>
        ) : candidates.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {candidates.map((dupe, idx) => (
              <div key={idx} className="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-extrabold rounded-lg uppercase">
                      {dupe.confidenceLevel} CONFIDENCE MATCH
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{dupe.reason}</span>
                  </div>

                  <div className="flex items-center gap-6 text-xs">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 min-w-[200px]">
                      <span className="font-mono text-[10px] text-slate-400 block font-bold">{dupe.codeA}</span>
                      <strong className="text-slate-900 font-bold block">{dupe.nameA}</strong>
                      <span className="text-slate-500 block text-[10px]">CAS: {dupe.casA || "N/A"}</span>
                    </div>

                    <GitMerge className="w-5 h-5 text-purple-500 shrink-0" />

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 min-w-[200px]">
                      <span className="font-mono text-[10px] text-slate-400 block font-bold">{dupe.codeB}</span>
                      <strong className="text-slate-900 font-bold block">{dupe.nameB}</strong>
                      <span className="text-slate-500 block text-[10px]">CAS: {dupe.casB || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCandidate(dupe)}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                >
                  <GitMerge className="w-4 h-4" />
                  Merge Products
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            No potential duplicate Master Product pairs detected.
          </div>
        )}
      </div>

      {selectedCandidate && (
        <MasterProductMergeModal
          candidate={selectedCandidate}
          onMerge={handleMerge}
          onClose={() => setSelectedCandidate(null)}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
}
