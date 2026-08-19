"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  ShieldCheck,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Globe,
  MapPin,
  FileCheck,
  UserCheck,
  Lock,
  MessageSquare,
  FlaskConical,
  Award
} from "lucide-react";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

export default function SupplierOfferingDetailGovernancePage() {
  const params = useParams();
  const offeringId = params.id as string;
  const router = useRouter();

  const [workspace, setWorkspace] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoRequestNotes, setInfoRequestNotes] = useState("");

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authenticatedFetch(`/api/v1/admin/offerings/${offeringId}/verification`);
      if (!res.ok) throw new Error("Failed to load offering governance workspace");
      const data = await res.json();
      setWorkspace(data);
    } catch (e: any) {
      setError(e.message || "Failed to load offering workspace");
    } finally {
      setLoading(false);
    }
  }, [offeringId]);

  useEffect(() => {
    if (offeringId) loadWorkspace();
  }, [offeringId, loadWorkspace]);

  const handleStartReview = async () => {
    try {
      setActionLoading(true);
      const res = await authenticatedFetch(`/api/v1/admin/offerings/${offeringId}/verification/start-review`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to start review");
      await loadWorkspace();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleItemAction = async (type: string, action: "verify" | "flag" | "reject", notesOrReason?: string) => {
    try {
      setActionLoading(true);
      let body: any = {};
      if (action === "verify") body = { notes: notesOrReason || "Verified by admin" };
      if (action === "flag") body = { notes: notesOrReason || "Flagged for review" };
      if (action === "reject") body = { reason: notesOrReason || "Specification mismatch" };

      const res = await authenticatedFetch(`/api/v1/admin/offerings/${offeringId}/verification/items/${type}/${action}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to ${action} item`);
      await loadWorkspace();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!infoRequestNotes.trim()) {
      alert("Please specify what information or document is required.");
      return;
    }
    try {
      setActionLoading(true);
      const res = await authenticatedFetch(`/api/v1/admin/offerings/${offeringId}/verification/request-info`, {
        method: "POST",
        body: JSON.stringify({ requestedNotes: infoRequestNotes.trim() }),
      });
      if (!res.ok) throw new Error("Failed to send information request");
      setShowInfoModal(false);
      setInfoRequestNotes("");
      await loadWorkspace();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveOffering = async () => {
    try {
      setActionLoading(true);
      const res = await authenticatedFetch(`/api/v1/admin/offerings/${offeringId}/verification/approve`, {
        method: "POST",
        body: JSON.stringify({ overrideReason: overrideReason.trim() || undefined }),
      });
      if (!res.ok) {
        let err = "Failed to approve offering";
        try { err = (await res.json()).message || err; } catch {}
        throw new Error(err);
      }
      setOverrideReason("");
      await loadWorkspace();
      alert("Offering officially APPROVED and live on marketplace!");
    } catch (e: any) {
      alert("Approval Guard Alert: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOffering = async () => {
    const reason = prompt("Enter rejection reason for this offering:");
    if (!reason) return;
    try {
      setActionLoading(true);
      const res = await authenticatedFetch(`/api/v1/admin/offerings/${offeringId}/verification/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) throw new Error("Failed to reject offering");
      await loadWorkspace();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendOffering = async () => {
    const reason = prompt("Enter suspension reason for this offering:");
    if (!reason) return;
    try {
      setActionLoading(true);
      const res = await authenticatedFetch(`/api/v1/admin/offerings/${offeringId}/verification/suspend`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) throw new Error("Failed to suspend offering");
      await loadWorkspace();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-xs font-bold text-slate-500">
        Loading Offering Due-Diligence Workspace...
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="max-w-7xl mx-auto p-8 space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium">
          {error || "Offering record not found"}
        </div>
        <Link href="/dashboard/admin/catalog/offerings" className="text-xs font-bold text-blue-600 underline">
          &larr; Return to Offering Governance Queue
        </Link>
      </div>
    );
  }

  const modStatus = workspace.moderationStatus;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/catalog/offerings"
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{workspace.masterProductName}</h1>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                modStatus === "APPROVED" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                modStatus === "UNDER_REVIEW" ? "bg-blue-50 text-blue-800 border border-blue-200" :
                modStatus === "INFORMATION_REQUIRED" ? "bg-purple-50 text-purple-800 border border-purple-200" :
                modStatus === "SUSPENDED" ? "bg-rose-50 text-rose-800 border border-rose-200" :
                "bg-amber-50 text-amber-800 border border-amber-200"
              }`}>
                {modStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Offered by {workspace.supplierName} ({workspace.supplierLegalName}) &bull; Master Code: {workspace.masterProductCode}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadWorkspace()}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Evidence
        </button>
      </div>

      {/* Completeness Score Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold tracking-widest text-blue-400 uppercase block">Offering Completeness Score</span>
            <strong className="text-3xl font-black">{workspace.completenessPercentage}% Complete</strong>
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-xl text-xs font-bold ${workspace.completenessDetails?.commercialTerms ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-white/10 text-white/50"}`}>
              Commercials
            </span>
            <span className={`px-3 py-1 rounded-xl text-xs font-bold ${workspace.completenessDetails?.purityAndGrade ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-white/10 text-white/50"}`}>
              Specs
            </span>
            <span className={`px-3 py-1 rounded-xl text-xs font-bold ${workspace.completenessDetails?.coa ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-white/10 text-white/50"}`}>
              COA
            </span>
            <span className={`px-3 py-1 rounded-xl text-xs font-bold ${workspace.completenessDetails?.msds ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-white/10 text-white/50"}`}>
              MSDS
            </span>
          </div>
        </div>
        <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-blue-400 to-emerald-400 h-full transition-all duration-500" style={{ width: `${workspace.completenessPercentage}%` }} />
        </div>
      </div>

      {/* Main Grid: Details, Checklist, Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Master Identity, Commercial Specs, Verification Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION A: MASTER PRODUCT IDENTITY (READ-ONLY) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <FlaskConical className="w-4 h-4 text-blue-600" /> A / CANONICAL MASTER PRODUCT IDENTITY (READ-ONLY)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-medium">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Canonical Chemical Name</span>
                <strong className="text-slate-900 text-sm font-extrabold">{workspace.masterProductName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">CAS Number</span>
                <strong className="text-slate-900 font-mono font-bold">{workspace.casNumber || "N/A"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Molecular Formula</span>
                <strong className="text-slate-900 font-mono font-bold">{workspace.molecularFormula || "N/A"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                <strong className="text-slate-900 font-bold">{workspace.masterProductCategory}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Master Code</span>
                <strong className="text-slate-900 font-mono font-bold">{workspace.masterProductCode}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Master Product Status</span>
                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded uppercase ${workspace.masterProductStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
                  {workspace.masterProductStatus}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION B & C: COMMERCIAL TERMS & SPECIFICATIONS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-4 h-4 text-purple-600" /> B & C / OFFERING COMMERCIAL TERMS & TECHNICAL SPECS
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-medium">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Unit Price</span>
                <strong className="text-slate-900 text-sm font-extrabold font-mono">{workspace.currency} {workspace.price?.toLocaleString()} / kg</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Purity</span>
                <strong className="text-slate-900 font-bold">{workspace.purity ? `${workspace.purity}%` : "N/A"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Grade Specification</span>
                <strong className="text-slate-900 font-bold">{workspace.grade || "N/A"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Minimum Order Quantity (MOQ)</span>
                <strong className="text-slate-900 font-bold font-mono">{workspace.moqKg} KG</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Packaging Specification</span>
                <strong className="text-slate-900 font-bold">{workspace.packaging || "N/A"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Available Stock</span>
                <strong className="text-slate-900 font-bold font-mono">{workspace.stock} KG</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Lead Time</span>
                <strong className="text-slate-900 font-bold">{workspace.leadTimeDays} Days</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Export Readiness</span>
                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded ${workspace.exportReady ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                  {workspace.exportReady ? "Export Ready" : "Domestic Only"}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION E: 15-DIMENSION FIELD LEVEL VERIFICATION CHECKLIST */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> 15-DIMENSION OFFERING VERIFICATION CHECKLIST
            </h3>

            <div className="space-y-3">
              {workspace.checklist?.map((item: any, idx: number) => {
                const isVerified = item.status === "VERIFIED";
                const isFlagged = item.status === "FLAGGED";
                const isRejected = item.status === "REJECTED";

                return (
                  <div key={idx} className={`p-4 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isVerified ? "bg-emerald-50/50 border-emerald-200" :
                    isFlagged ? "bg-amber-50/50 border-amber-200" :
                    isRejected ? "bg-rose-50/50 border-rose-200" :
                    "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold text-sm">{item.verificationType}</strong>
                        {item.mandatory ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[9px] font-black uppercase">
                            MANDATORY
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-bold uppercase">
                            OPTIONAL
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          isVerified ? "bg-emerald-200 text-emerald-900" :
                          isFlagged ? "bg-amber-200 text-amber-900" :
                          isRejected ? "bg-rose-200 text-rose-900" :
                          "bg-slate-200 text-slate-800"
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      {item.adminNotes && (
                        <p className="text-xs text-slate-600 italic">Notes: {item.adminNotes}</p>
                      )}
                      {item.rejectionReason && (
                        <p className="text-xs text-rose-600 font-bold">Reason: {item.rejectionReason}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleItemAction(item.verificationType, "verify")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Verify
                      </button>
                      <button
                        type="button"
                        onClick={() => handleItemAction(item.verificationType, "flag", prompt("Flag reason:") || undefined)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Flag
                      </button>
                      <button
                        type="button"
                        onClick={() => handleItemAction(item.verificationType, "reject", prompt("Rejection reason:") || undefined)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION F: AUDIT TRAIL */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-4 h-4 text-slate-600" /> IMMUTABLE AUDIT TRAIL
            </h3>

            {workspace.auditHistory && workspace.auditHistory.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {workspace.auditHistory.map((audit: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{audit.adminName}</span>
                      <span className="text-slate-400 ml-2">({audit.previousStatus} &rarr; {audit.newStatus})</span>
                      <p className="text-slate-600 text-[11px] mt-0.5">{audit.reason || audit.action}</p>
                    </div>
                    <span className="text-slate-400 text-[10px] font-mono shrink-0">
                      {new Date(audit.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No governance decision audits recorded yet.</p>
            )}
          </div>
        </div>

        {/* Right 1 Col: Guarded Final Decision Actions */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lock className="w-4 h-4 text-blue-600" /> GUARDED DECISION ACTIONS
            </h3>

            <div className="space-y-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleStartReview}
                className="w-full py-2 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors"
              >
                Start Review (UNDER_REVIEW)
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowInfoModal(true)}
                className="w-full py-2 bg-purple-50 text-purple-800 hover:bg-purple-100 rounded-xl text-xs font-bold transition-colors"
              >
                Request Information (INFO_REQUIRED)
              </button>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">Admin Override Reason (Optional)</label>
                <input
                  type="text"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Justification if overriding unverified optional items..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleApproveOffering}
                  className="w-full py-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-extrabold transition-colors shadow-sm"
                >
                  Approve Offering (APPROVED)
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleRejectOffering}
                  className="w-full py-2 bg-rose-50 text-rose-800 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors"
                >
                  Reject Offering (REJECTED)
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleSuspendOffering}
                  className="w-full py-2 bg-slate-900 text-white hover:bg-black rounded-xl text-xs font-bold transition-colors"
                >
                  Suspend Offering (SUSPENDED)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Information Request Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">Request Information from Supplier</h3>
            <p className="text-xs text-slate-600">
              Specify what commercial details, purity clarifications, or COA documents the supplier must update.
            </p>
            <textarea
              rows={4}
              value={infoRequestNotes}
              onChange={(e) => setInfoRequestNotes(e.target.value)}
              placeholder="e.g. Please clarify purity testing method and upload updated COA..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestInfo}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl"
              >
                Send Info Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
