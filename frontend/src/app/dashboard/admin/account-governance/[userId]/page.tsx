"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  accountGovernanceApi,
  AdminGovernanceUserDetail,
} from "@/features/admin/api/accountGovernanceApi";
import {
  ShieldAlert,
  Users,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Mail,
  Building2,
  Calendar,
  Lock,
  FileText,
} from "lucide-react";

export default function AdminUserGovernanceDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;

  const [detail, setDetail] = useState<AdminGovernanceUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal actions
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [reinstateModalOpen, setReinstateModalOpen] = useState(false);
  const [reasonInput, setReasonInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await accountGovernanceApi.getUserGovernanceDetail(userId);
      setDetail(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load user governance detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleSuspend = async () => {
    if (!reasonInput.trim()) {
      setError("Please provide a mandatory suspension reason.");
      return;
    }
    try {
      setIsProcessing(true);
      setError(null);
      await accountGovernanceApi.suspendUser(userId, {
        reason: reasonInput.trim(),
        internalNotes: notesInput.trim() || undefined,
      });
      setSuspendModalOpen(false);
      setReasonInput("");
      setNotesInput("");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to suspend user");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReinstate = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      await accountGovernanceApi.reinstateUser(userId, {
        notes: notesInput.trim() || undefined,
      });
      setReinstateModalOpen(false);
      setNotesInput("");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to reinstate user");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/admin/account-governance"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Account Governance
        </Link>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600" : ""}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-600 mb-2" />
          <p className="text-xs font-medium text-slate-500">Loading user governance timeline...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      ) : detail ? (
        <div className="space-y-6">
          {/* User Overview Profile Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-lg">
                  {detail.user.role === "SUPPLIER" ? <Building2 className="w-7 h-7" /> : <Users className="w-7 h-7" />}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-xl font-bold text-slate-900">{detail.user.name || "Unnamed User"}</h1>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        detail.user.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {detail.user.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {detail.user.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Joined{" "}
                      {new Date(detail.user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {detail.user.status === "ACTIVE" ? (
                  <button
                    onClick={() => {
                      setSuspendModalOpen(true);
                      setReasonInput("");
                      setNotesInput("");
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors shadow-2xs"
                  >
                    Suspend Account
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setReinstateModalOpen(true);
                      setNotesInput("");
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                  >
                    Reinstate Account
                  </button>
                )}
              </div>
            </div>

            {/* Active Suspension Alert if Suspended */}
            {detail.currentSuspension && (
              <div className="p-5 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" /> Active Platform Suspension
                  </span>
                  <span className="text-[11px] text-rose-700">
                    Suspended on {new Date(detail.currentSuspension.suspendedAt).toLocaleString()} by{" "}
                    {detail.currentSuspension.suspendedByAdminName}
                  </span>
                </div>
                <p className="text-xs text-rose-900 font-medium bg-white/60 p-3 rounded-xl border border-rose-100">
                  <span className="font-bold">Reason:</span> {detail.currentSuspension.reason}
                </p>
                {detail.currentSuspension.internalNotes && (
                  <p className="text-[11px] text-amber-900 font-medium bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    🔒 <span className="font-bold">Internal Governance Notes:</span>{" "}
                    {detail.currentSuspension.internalNotes}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Governance Timelines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Suspensions Timeline */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Suspension Records ({detail.suspensionHistory.length})
              </h2>

              {detail.suspensionHistory.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No suspension history recorded.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {detail.suspensionHistory.map((s) => (
                    <div key={s.id} className="py-4 first:pt-0 last:pb-0 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          {new Date(s.suspendedAt).toLocaleDateString()}
                        </span>
                        {s.active ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Reinstated
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {s.reason}
                      </p>
                      {s.reinstatedAt && (
                        <p className="text-[11px] text-emerald-700">
                          ✓ Reinstated on {new Date(s.reinstatedAt).toLocaleString()} by {s.reinstatedByAdminName}
                          {s.reinstatementNotes && ` (${s.reinstatementNotes})`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Appeals Timeline */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Formal Appeals ({detail.appealsHistory.length})
              </h2>

              {detail.appealsHistory.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No formal appeals submitted.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {detail.appealsHistory.map((a) => (
                    <div key={a.id} className="py-4 first:pt-0 last:pb-0 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          Appeal #{a.id.slice(0, 8)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : a.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {a.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {a.submittedReason}
                      </p>
                      {a.adminResponse && (
                        <p className="text-[11px] text-cyan-800 bg-cyan-50/50 p-2 rounded-lg border border-cyan-100">
                          <span className="font-bold">Admin Decision:</span> {a.adminResponse}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* SUSPEND MODAL */}
      {suspendModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserX className="w-5 h-5 text-rose-600" />
              Suspend User Account
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Suspension Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="Mandatory justification shown to user upon login..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Internal Governance Notes (Admin Eyes Only)
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Record internal investigation details..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setSuspendModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing || !reasonInput.trim()}
                onClick={handleSuspend}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
              >
                {isProcessing ? "Suspending..." : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REINSTATE MODAL */}
      {reinstateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Reinstate User Account
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Reinstatement Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Record compliance validation reference or resolution details..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setReinstateModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleReinstate}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
              >
                {isProcessing ? "Reinstating..." : "Confirm Reinstatement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
