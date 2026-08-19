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
  Flag,
  AlertTriangle,
  Lock,
  MessageSquare,
  Award
} from "lucide-react";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

export default function SupplierDeepVerificationDetailPage() {
  const params = useParams();
  const supplierId = params.supplierId as string;
  const router = useRouter();

  const [workspace, setWorkspace] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoRequestNotes, setInfoRequestNotes] = useState("");

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authenticatedFetch(`/api/v1/admin/suppliers/${supplierId}/verification`);
      if (!res.ok) {
        throw new Error("Failed to load supplier due-diligence workspace");
      }
      const data = await res.json();
      setWorkspace(data);
    } catch (e: any) {
      setError(e.message || "Failed to load supplier due-diligence workspace");
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    if (supplierId) loadWorkspace();
  }, [supplierId, loadWorkspace]);

  const handleStartReview = async () => {
    try {
      setActionLoading(true);
      const res = await authenticatedFetch(`/api/v1/admin/suppliers/${supplierId}/verification/start-review`, {
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
      if (action === "flag") body = { notes: notesOrReason || "Flagged for investigation" };
      if (action === "reject") body = { reason: notesOrReason || "Document invalid" };

      const res = await authenticatedFetch(`/api/v1/admin/suppliers/${supplierId}/verification/items/${type}/${action}`, {
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
      const res = await authenticatedFetch(`/api/v1/admin/suppliers/${supplierId}/verification/request-info`, {
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

  const handleFinalizeVerification = async () => {
    try {
      setActionLoading(true);
      const res = await authenticatedFetch(`/api/v1/admin/suppliers/${supplierId}/verification/finalize`, {
        method: "POST",
        body: JSON.stringify({ overrideReason: overrideReason.trim() || undefined }),
      });
      if (!res.ok) {
        let err = "Failed to finalize verification";
        try { err = (await res.json()).message || err; } catch {}
        throw new Error(err);
      }
      setOverrideReason("");
      await loadWorkspace();
      alert("Supplier officially VERIFIED!");
    } catch (e: any) {
      alert("Verification Guard Alert: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSupplier = async () => {
    const reason = prompt("Enter rejection reason for this supplier:");
    if (!reason) return;
    try {
      setActionLoading(true);
      const res = await authenticatedFetch(`/api/v1/admin/suppliers/${supplierId}/verification/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) throw new Error("Failed to reject supplier");
      await loadWorkspace();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendSupplier = async () => {
    const reason = prompt("Enter suspension reason for this supplier account:");
    if (!reason) return;
    try {
      setActionLoading(true);
      const res = await authenticatedFetch(`/api/v1/admin/suppliers/${supplierId}/verification/suspend`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) throw new Error("Failed to suspend supplier");
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
        Loading Due-Diligence Workspace...
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="max-w-7xl mx-auto p-8 space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium">
          {error || "Supplier profile not found"}
        </div>
        <Link href="/dashboard/admin/catalog" className="text-xs font-bold text-blue-600 underline">
          &larr; Return to Admin Catalog Dashboard
        </Link>
      </div>
    );
  }

  const vStatus = workspace.verificationStatus;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/catalog"
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{workspace.companyName}</h1>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                vStatus === "VERIFIED" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                vStatus === "UNDER_REVIEW" ? "bg-blue-50 text-blue-800 border border-blue-200" :
                vStatus === "INFORMATION_REQUIRED" ? "bg-purple-50 text-purple-800 border border-purple-200" :
                vStatus === "SUSPENDED" ? "bg-rose-50 text-rose-800 border border-rose-200" :
                "bg-amber-50 text-amber-800 border border-amber-200"
              }`}>
                {vStatus}
              </span>
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-extrabold uppercase">
                {workspace.businessType}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Legal Due-Diligence & Evidence Verification Workspace
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

      {/* Onboarding Completeness Score Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold tracking-widest text-blue-400 uppercase block">Onboarding Completeness Score</span>
            <strong className="text-3xl font-black">{workspace.completenessPercentage}% Complete</strong>
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-xl text-xs font-bold ${workspace.completenessDetails?.companyIdentity ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-white/10 text-white/50"}`}>
              Identity
            </span>
            <span className={`px-3 py-1 rounded-xl text-xs font-bold ${workspace.completenessDetails?.taxInformation ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-white/10 text-white/50"}`}>
              Tax
            </span>
            <span className={`px-3 py-1 rounded-xl text-xs font-bold ${workspace.completenessDetails?.businessDocuments ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-white/10 text-white/50"}`}>
              Docs
            </span>
            <span className={`px-3 py-1 rounded-xl text-xs font-bold ${workspace.completenessDetails?.catalogInformation ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-white/10 text-white/50"}`}>
              Catalog
            </span>
          </div>
        </div>
        <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-blue-400 to-emerald-400 h-full transition-all duration-500" style={{ width: `${workspace.completenessPercentage}%` }} />
        </div>
      </div>

      {/* Main Grid: Checklist & State Machine Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: 9-Dimension Field Level Verification Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> FIELD-LEVEL EVIDENCE CHECKLIST
            </h3>

            <div className="space-y-3">
              {workspace.checklist?.map((item: any, idx: number) => {
                const isVerified = item.status === "VERIFIED";
                const isFlagged = item.status === "FLAGGED";
                const isRejected = item.status === "REJECTED";
                const isExpired = item.status === "EXPIRED";

                return (
                  <div key={idx} className={`p-4 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isVerified ? "bg-emerald-50/50 border-emerald-200" :
                    isFlagged ? "bg-amber-50/50 border-amber-200" :
                    isRejected ? "bg-rose-50/50 border-rose-200" :
                    isExpired ? "bg-purple-50/50 border-purple-200" :
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
                          isExpired ? "bg-purple-200 text-purple-900" :
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

          {/* Audit History Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-4 h-4 text-slate-600" /> VERIFICATION DECISION AUDIT TRAIL
            </h3>

            {workspace.auditHistory && workspace.auditHistory.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {workspace.auditHistory.map((audit: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{audit.adminName}</span>
                      <span className="text-slate-400 ml-2">({audit.previousStatus} &rarr; {audit.newStatus})</span>
                      <p className="text-slate-600 text-[11px] mt-0.5">{audit.notes}</p>
                    </div>
                    <span className="text-slate-400 text-[10px] font-mono shrink-0">
                      {new Date(audit.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No verification decision audits recorded yet.</p>
            )}
          </div>
        </div>

        {/* Right 1 Col: Guarded Final Actions */}
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
                  placeholder="Record justification if overriding incomplete items..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleFinalizeVerification}
                  className="w-full py-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-extrabold transition-colors shadow-sm"
                >
                  Finalize Verification (VERIFIED)
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleRejectSupplier}
                  className="w-full py-2 bg-rose-50 text-rose-800 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors"
                >
                  Reject Application (REJECTED)
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleSuspendSupplier}
                  className="w-full py-2 bg-slate-900 text-white hover:bg-black rounded-xl text-xs font-bold transition-colors"
                >
                  Suspend Account (SUSPENDED)
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
              Specify what additional documents, certificates, or details the supplier must provide to proceed with due-diligence.
            </p>
            <textarea
              rows={4}
              value={infoRequestNotes}
              onChange={(e) => setInfoRequestNotes(e.target.value)}
              placeholder="e.g. Please upload updated GMP certificate valid for 2026..."
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
