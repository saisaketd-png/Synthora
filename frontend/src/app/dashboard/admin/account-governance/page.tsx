"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  accountGovernanceApi,
  AccountSuspension,
  AdminAppeal,
  PageResponse,
} from "@/features/admin/api/accountGovernanceApi";
import { PageHeader } from "@/shared/components/ui/KemkendraUI";
import {
  ShieldAlert,
  Users,
  Search,
  Filter,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
  UserCheck,
  UserX,
  FileText,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export default function AdminAccountGovernancePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"suspensions" | "appeals">("suspensions");

  // Suspensions state
  const [suspensionsData, setSuspensionsData] = useState<PageResponse<AccountSuspension>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
  });
  const [suspensionsLoading, setSuspensionsLoading] = useState(true);
  const [suspensionQuery, setSuspensionQuery] = useState("");
  const [suspensionRole, setSuspensionRole] = useState<string>("");
  const [activeOnly, setActiveOnly] = useState<boolean>(true);
  const [suspensionPage, setSuspensionPage] = useState(0);

  // Appeals state
  const [appealsData, setAppealsData] = useState<PageResponse<AdminAppeal>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
  });
  const [appealsLoading, setAppealsLoading] = useState(true);
  const [appealQuery, setAppealQuery] = useState("");
  const [appealStatusFilter, setAppealStatusFilter] = useState<string>("");
  const [appealPage, setAppealPage] = useState(0);

  // Modals state
  const [selectedAppeal, setSelectedAppeal] = useState<AdminAppeal | null>(null);
  const [appealActionModal, setAppealActionModal] = useState<"review" | "info" | "approve" | "reject" | null>(null);
  const [actionInput, setActionInput] = useState("");
  const [internalNotesInput, setInternalNotesInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Reinstate Modal
  const [reinstateUserModal, setReinstateUserModal] = useState<AccountSuspension | null>(null);
  const [reinstateNotes, setReinstateNotes] = useState("");

  const fetchSuspensions = useCallback(async () => {
    try {
      setSuspensionsLoading(true);
      const res = await accountGovernanceApi.getSuspensions({
        page: suspensionPage,
        size: 20,
        query: suspensionQuery.trim() || undefined,
        role: suspensionRole || undefined,
        activeOnly: activeOnly ? true : undefined,
      });
      setSuspensionsData(res);
    } catch (err) {
      console.error("Error fetching suspensions:", err);
    } finally {
      setSuspensionsLoading(false);
    }
  }, [suspensionPage, suspensionQuery, suspensionRole, activeOnly]);

  const fetchAppeals = useCallback(async () => {
    try {
      setAppealsLoading(true);
      const res = await accountGovernanceApi.getAppeals({
        page: appealPage,
        size: 20,
        status: appealStatusFilter || undefined,
        query: appealQuery.trim() || undefined,
      });
      setAppealsData(res);
    } catch (err) {
      console.error("Error fetching appeals:", err);
    } finally {
      setAppealsLoading(false);
    }
  }, [appealPage, appealStatusFilter, appealQuery]);

  useEffect(() => {
    if (activeTab === "suspensions") {
      fetchSuspensions();
    } else {
      fetchAppeals();
    }
  }, [activeTab, fetchSuspensions, fetchAppeals]);

  const handleStartReview = async (appealId: string) => {
    try {
      setIsProcessing(true);
      setActionError(null);
      await accountGovernanceApi.startReview(appealId, {
        internalNotes: internalNotesInput.trim() || undefined,
      });
      setAppealActionModal(null);
      setSelectedAppeal(null);
      fetchAppeals();
    } catch (err: any) {
      setActionError(err?.message || "Failed to start review");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestInfo = async (appealId: string) => {
    if (!actionInput.trim()) {
      setActionError("Please provide an information request message for the user.");
      return;
    }
    try {
      setIsProcessing(true);
      setActionError(null);
      await accountGovernanceApi.requestInformation(appealId, {
        message: actionInput.trim(),
        internalNotes: internalNotesInput.trim() || undefined,
      });
      setAppealActionModal(null);
      setSelectedAppeal(null);
      fetchAppeals();
    } catch (err: any) {
      setActionError(err?.message || "Failed to request information");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveAppeal = async (appealId: string) => {
    try {
      setIsProcessing(true);
      setActionError(null);
      await accountGovernanceApi.approveAppeal(appealId, {
        reason: actionInput.trim() || undefined,
        internalNotes: internalNotesInput.trim() || undefined,
      });
      setAppealActionModal(null);
      setSelectedAppeal(null);
      fetchAppeals();
      fetchSuspensions();
    } catch (err: any) {
      setActionError(err?.message || "Failed to approve appeal");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectAppeal = async (appealId: string) => {
    try {
      setIsProcessing(true);
      setActionError(null);
      await accountGovernanceApi.rejectAppeal(appealId, {
        reason: actionInput.trim() || undefined,
        internalNotes: internalNotesInput.trim() || undefined,
      });
      setAppealActionModal(null);
      setSelectedAppeal(null);
      fetchAppeals();
    } catch (err: any) {
      setActionError(err?.message || "Failed to reject appeal");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReinstateUser = async () => {
    if (!reinstateUserModal) return;
    try {
      setIsProcessing(true);
      setActionError(null);
      await accountGovernanceApi.reinstateUser(reinstateUserModal.userId, {
        notes: reinstateNotes.trim() || undefined,
      });
      setReinstateUserModal(null);
      setReinstateNotes("");
      fetchSuspensions();
    } catch (err: any) {
      setActionError(err?.message || "Failed to reinstate user");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 text-[#0F172A] pb-12">
      {/* 1. Calm Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#E4E4E7] pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#0052CC] block mb-1">
            Trust & Safety
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A]">
            Account Governance & Appeals
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-xl">
            Account disciplinary enforcement, suspension audits, and formal review queue for reinstatement appeals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => (activeTab === "suspensions" ? fetchSuspensions() : fetchAppeals())}
          className="h-8 px-3 text-xs font-medium text-[#475569] bg-white hover:bg-[#FAFAFA] border border-[#E4E4E7] rounded-[4px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              (activeTab === "suspensions" ? suspensionsLoading : appealsLoading)
                ? "animate-spin text-[#0052CC]"
                : "text-[#64748B]"
            }`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center p-0.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px] w-fit">
        <button
          onClick={() => setActiveTab("suspensions")}
          className={`flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
            activeTab === "suspensions"
              ? "bg-[#0052CC] text-white shadow-xs"
              : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4F4F5]"
          }`}
        >
          <UserX className="w-3.5 h-3.5" />
          <span>Account Suspensions ({suspensionsData.totalElements})</span>
        </button>
        <button
          onClick={() => setActiveTab("appeals")}
          className={`flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
            activeTab === "appeals"
              ? "bg-[#0052CC] text-white shadow-xs"
              : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4F4F5]"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Formal Appeals Queue ({appealsData.totalElements})</span>
        </button>
      </div>

      {/* TAB 1: SUSPENSIONS */}
      {activeTab === "suspensions" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={suspensionQuery}
                onChange={(e) => setSuspensionQuery(e.target.value)}
                placeholder="Search user name, email, or reason..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <select
                value={suspensionRole}
                onChange={(e) => setSuspensionRole(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">All Roles</option>
                <option value="USER">Buyers (USER)</option>
                <option value="SUPPLIER">Suppliers (SUPPLIER)</option>
              </select>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                Active Only
              </label>

              <button
                onClick={() => {
                  setSuspensionPage(0);
                  fetchSuspensions();
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Suspensions Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            {suspensionsLoading ? (
              <div className="p-12 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-600 mb-2" />
                <p className="text-xs">Loading suspensions...</p>
              </div>
            ) : suspensionsData.content.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-bold text-slate-800">No matching account suspensions found</p>
                <p className="text-xs text-slate-400 mt-1">All accounts are in good standing or filters matched 0 results.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-5">User</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Suspension Reason</th>
                      <th className="py-3.5 px-4">Suspended By</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suspensionsData.content.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900">{item.userName || "Unnamed User"}</div>
                          <div className="text-slate-500 font-mono text-[11px]">{item.userEmail}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                              item.userRole === "SUPPLIER"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {item.userRole}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {item.active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" /> Active Suspension
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Reinstated
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 max-w-xs">
                          <p className="text-slate-800 font-medium truncate" title={item.reason}>
                            {item.reason}
                          </p>
                          {item.internalNotes && (
                            <p className="text-[10px] text-amber-700 truncate" title={`Internal Note: ${item.internalNotes}`}>
                              🔒 {item.internalNotes}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-slate-700 font-medium">{item.suspendedByAdminName}</span>
                        </td>
                        <td className="py-4 px-4 text-slate-500 text-[11px]">
                          {new Date(item.suspendedAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-5 text-right space-x-2">
                          {item.active && (
                            <button
                              onClick={() => {
                                setReinstateUserModal(item);
                                setReinstateNotes("");
                                setActionError(null);
                              }}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 transition-colors"
                            >
                              Reinstate
                            </button>
                          )}
                          <Link
                            href={`/dashboard/admin/account-governance/${item.userId}`}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
                          >
                            <Eye className="w-3 h-3" /> Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: APPEALS QUEUE */}
      {activeTab === "appeals" && (
        <div className="space-y-6">
          {/* Appeals Filter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={appealQuery}
                onChange={(e) => setAppealQuery(e.target.value)}
                placeholder="Search user name, email, or submitted reason..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <select
                value={appealStatusFilter}
                onChange={(e) => setAppealStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted (New)</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="INFORMATION_REQUIRED">Information Required</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <button
                onClick={() => {
                  setAppealPage(0);
                  fetchAppeals();
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Appeals Queue List */}
          <div className="space-y-4">
            {appealsLoading ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-600 mb-2" />
                <p className="text-xs">Loading formal appeals queue...</p>
              </div>
            ) : appealsData.content.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-bold text-slate-800">No appeals match current criteria</p>
                <p className="text-xs text-slate-400 mt-1">All submitted appeals have been processed.</p>
              </div>
            ) : (
              appealsData.content.map((appeal) => (
                <div
                  key={appeal.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                        {appeal.userRole === "SUPPLIER" ? <Building2 className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{appeal.userName}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {appeal.userRole}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{appeal.userEmail}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          appeal.status === "SUBMITTED"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : appeal.status === "UNDER_REVIEW"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : appeal.status === "INFORMATION_REQUIRED"
                            ? "bg-orange-50 text-orange-700 border border-orange-200"
                            : appeal.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {appeal.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Submitted Reason */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Submitted Statement</span>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed">{appeal.submittedReason}</p>
                  </div>

                  {/* User Response if any */}
                  {appeal.userResponse && (
                    <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-cyan-800">User Clarification / Response</span>
                      <p className="text-xs text-slate-800 font-medium leading-relaxed">{appeal.userResponse}</p>
                    </div>
                  )}

                  {/* Admin Internal Notes if any */}
                  {appeal.adminInternalNotes && (
                    <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-xs text-amber-900 space-y-0.5">
                      <span className="font-bold">🔒 Admin Notes:</span> {appeal.adminInternalNotes}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="text-[11px] text-slate-400">
                      Submitted: {new Date(appeal.createdAt).toLocaleString()}
                      {appeal.reviewedByAdminName && ` • Reviewer: ${appeal.reviewedByAdminName}`}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/admin/account-governance/${appeal.userId}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                      >
                        User History
                      </Link>

                      {appeal.status === "SUBMITTED" && (
                        <button
                          onClick={() => {
                            setSelectedAppeal(appeal);
                            setAppealActionModal("review");
                            setInternalNotesInput("");
                            setActionError(null);
                          }}
                          className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                        >
                          Start Review
                        </button>
                      )}

                      {(appeal.status === "UNDER_REVIEW" || appeal.status === "INFORMATION_REQUIRED") && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedAppeal(appeal);
                              setAppealActionModal("info");
                              setActionInput("");
                              setInternalNotesInput("");
                              setActionError(null);
                            }}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-colors"
                          >
                            Request Info
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAppeal(appeal);
                              setAppealActionModal("approve");
                              setActionInput("");
                              setInternalNotesInput("");
                              setActionError(null);
                            }}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                          >
                            Approve & Reinstate
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAppeal(appeal);
                              setAppealActionModal("reject");
                              setActionInput("");
                              setInternalNotesInput("");
                              setActionError(null);
                            }}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* APPEAL ACTION MODAL */}
      {appealActionModal && selectedAppeal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">
                {appealActionModal === "review" && "Begin Appeal Review"}
                {appealActionModal === "info" && "Request Information from User"}
                {appealActionModal === "approve" && "Approve Appeal & Reinstate Account"}
                {appealActionModal === "reject" && "Reject Suspension Appeal"}
              </h2>
              <button
                onClick={() => setAppealActionModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
                {actionError}
              </div>
            )}

            <div className="space-y-4">
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <span className="font-bold text-slate-800">User:</span> {selectedAppeal.userName} (
                  {selectedAppeal.userEmail})
                </p>
                <p>
                  <span className="font-bold text-slate-800">Statement:</span> {selectedAppeal.submittedReason}
                </p>
              </div>

              {appealActionModal === "info" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    User Clarification Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    placeholder="Specify the additional documents or details required from the user..."
                    className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              )}

              {(appealActionModal === "approve" || appealActionModal === "reject") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Decision Statement {appealActionModal === "reject" && <span className="text-rose-500">*</span>}
                  </label>
                  <textarea
                    rows={3}
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    placeholder={
                      appealActionModal === "approve"
                        ? "Enter approval note sent to the user (optional)..."
                        : "Enter rejection reason sent to the user..."
                    }
                    className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Internal Governance Notes (Admin Eyes Only)
                </label>
                <textarea
                  rows={2}
                  value={internalNotesInput}
                  onChange={(e) => setInternalNotesInput(e.target.value)}
                  placeholder="Record internal compliance notes (never exposed to user)..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setAppealActionModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>

              {appealActionModal === "review" && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleStartReview(selectedAppeal.id)}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                >
                  {isProcessing ? "Starting..." : "Begin Review"}
                </button>
              )}

              {appealActionModal === "info" && (
                <button
                  type="button"
                  disabled={isProcessing || !actionInput.trim()}
                  onClick={() => handleRequestInfo(selectedAppeal.id)}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                >
                  {isProcessing ? "Sending..." : "Send Request"}
                </button>
              )}

              {appealActionModal === "approve" && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleApproveAppeal(selectedAppeal.id)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                >
                  {isProcessing ? "Approving..." : "Confirm Reinstatement"}
                </button>
              )}

              {appealActionModal === "reject" && (
                <button
                  type="button"
                  disabled={isProcessing || !actionInput.trim()}
                  onClick={() => handleRejectAppeal(selectedAppeal.id)}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                >
                  {isProcessing ? "Rejecting..." : "Confirm Rejection"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REINSTATE USER MODAL */}
      {reinstateUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                Reinstate User Account
              </h2>
              <button
                onClick={() => setReinstateUserModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
                {actionError}
              </div>
            )}

            <div className="space-y-4 text-xs text-slate-600">
              <p>
                You are about to reinstate{" "}
                <span className="font-bold text-slate-900">{reinstateUserModal.userName}</span> (
                {reinstateUserModal.userEmail}). This will restore full marketplace access and mark the active
                suspension as closed.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Reinstatement Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={reinstateNotes}
                  onChange={(e) => setReinstateNotes(e.target.value)}
                  placeholder="Record justification or compliance verification reference..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setReinstateUserModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleReinstateUser}
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
