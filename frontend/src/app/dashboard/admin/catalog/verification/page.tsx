"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Building2, AlertCircle, RefreshCw, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

export default function DeepSupplierVerificationWorkspacePage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transition form state
  const [actionNotes, setActionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authenticatedFetch("/api/v1/admin/suppliers");
      if (!res.ok) throw new Error("Failed to load suppliers");
      const data = await res.json();
      setSuppliers(data);
      if (data.length > 0 && !selectedSupplier) {
        setSelectedSupplier(data[0]);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, [selectedSupplier]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const handleTransition = async (endpoint: string, statusLabel: string) => {
    if (!selectedSupplier) return;
    try {
      setActionLoading(true);
      const res = await authenticatedFetch(`/api/v1/admin/suppliers/${selectedSupplier.id}/verification/${endpoint}`, {
        method: "POST",
        body: JSON.stringify({ notes: actionNotes.trim() || undefined }),
      });
      if (!res.ok) {
        let err = "Transition failed";
        try { err = (await res.json()).message || err; } catch {}
        throw new Error(err);
      }
      setActionNotes("");
      await loadSuppliers();
      alert(`Supplier verification status transitioned to ${statusLabel}`);
    } catch (e: any) {
      alert("Error: " + e.message);
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
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              DEEP SUPPLIER VERIFICATION QUEUE & WORKSPACE
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Evidence-based compliance review, identity verification state machine, and document inspection.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadSuppliers()}
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

      {/* Main Grid: Left Supplier List, Right Selected Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Supplier List Selector */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs space-y-3">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-2">Suppliers Queue ({suppliers.length})</h3>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {suppliers.map((sup) => (
              <button
                key={sup.id}
                type="button"
                onClick={() => setSelectedSupplier(sup)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                  selectedSupplier?.id === sup.id
                    ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 font-bold text-xs">{sup.name}</strong>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    sup.verificationStatus === "VERIFIED" ? "bg-emerald-100 text-emerald-800" :
                    sup.verificationStatus === "UNDER_REVIEW" ? "bg-blue-100 text-blue-800" :
                    sup.verificationStatus === "INFORMATION_REQUIRED" ? "bg-purple-100 text-purple-800" :
                    sup.verificationStatus === "SUSPENDED" ? "bg-rose-100 text-rose-800" :
                    "bg-amber-100 text-amber-800"
                  }`}>
                    {sup.verificationStatus || (sup.verified ? "VERIFIED" : "PENDING")}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Slug: {sup.slug}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Supplier Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSupplier ? (
            <div className="space-y-6">
              {/* SECTION 01: COMPANY IDENTITY & STATUS */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" /> 01 / COMPANY IDENTITY & VERIFICATION STATUS
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl uppercase">
                      {selectedSupplier.verificationStatus || (selectedSupplier.verified ? "VERIFIED" : "PENDING")}
                    </span>
                    <Link
                      href={`/dashboard/admin/catalog/verification/${selectedSupplier.id}`}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Full Workspace
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Company Name</span>
                    <strong className="text-slate-900 text-sm font-extrabold">{selectedSupplier.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Slug</span>
                    <strong className="text-slate-900 font-mono">{selectedSupplier.slug}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Years in Business</span>
                    <strong className="text-slate-900">{selectedSupplier.yearsInBusiness || "N/A"} years</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Export Readiness</span>
                    <strong className="text-slate-900">{selectedSupplier.exportReady ? "Export Ready" : "Domestic Only"}</strong>
                  </div>
                </div>
              </div>

              {/* SECTION 05: VERIFICATION CHECKLIST & ACTIONS */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> STATE MACHINE TRANSITIONS & AUDIT NOTES
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Transition Notes</label>
                  <textarea
                    rows={3}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Record evidence notes, certificate numbers, or required information request details..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleTransition("start-review", "UNDER REVIEW")}
                    className="px-3.5 py-2 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors"
                  >
                    Start Review
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleTransition("request-info", "INFORMATION REQUIRED")}
                    className="px-3.5 py-2 bg-purple-50 text-purple-800 hover:bg-purple-100 rounded-xl text-xs font-bold transition-colors"
                  >
                    Request Information
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleTransition("verify", "VERIFIED")}
                    className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                  >
                    Verify Supplier
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleTransition("reject", "REJECTED")}
                    className="px-3.5 py-2 bg-rose-50 text-rose-800 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleTransition("suspend", "SUSPENDED")}
                    className="px-3.5 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-xl text-xs font-bold transition-colors"
                  >
                    Suspend
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 text-xs">
              Select a supplier from the list to initiate deep verification review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
