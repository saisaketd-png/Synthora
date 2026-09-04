"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  Award,
  ExternalLink,
  Download,
  Eye,
  CheckSquare,
  History,
} from "lucide-react";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

export default function SupplierDeepVerificationWorkspacePage() {
  const params = useParams();
  const supplierId = params.supplierId as string;
  const router = useRouter();

  const [workspace, setWorkspace] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab: 1 = Identity, 2 = Tax & Reg, 3 = Business, 4 = Address & Contact, 5 = Documents, 6 = Checklist, 7 = Audit
  const [activeTab, setActiveTab] = useState<number>(1);

  // Action / Modal States
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Item Action Modal (Verify / Flag / Reject a field or document)
  const [itemModal, setItemModal] = useState<{
    open: boolean;
    type: string;
    action: "verify" | "flag" | "reject";
    title: string;
    value?: string;
    notes: string;
    docId?: string;
  }>({
    open: false,
    type: "",
    action: "verify",
    title: "",
    value: "",
    notes: "",
  });

  // Request Information Modal
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoReason, setInfoReason] = useState("");
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [infoCustomNote, setInfoCustomNote] = useState("");

  // Final Decision Confirmation Modals
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  const parseBackendError = async (res: Response, fallback: string) => {
    try {
      const errData = await res.json();
      return errData.message || errData.error || fallback;
    } catch {
      return `${fallback} (HTTP ${res.status})`;
    }
  };

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setActionError(null);
      const res = await authenticatedFetch(`/api/v1/admin/suppliers/${supplierId}/verification`);
      if (!res.ok) {
        throw new Error(await parseBackendError(res, "Failed to load supplier due-diligence workspace"));
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

  // Handle Start Review
  const handleStartReview = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      const res = await authenticatedFetch(`/api/v1/admin/suppliers/${supplierId}/verification/start-review`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(await parseBackendError(res, "Failed to start review"));
      }
      await loadWorkspace();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Item-level Action (Verify, Flag, Reject)
  const submitItemAction = async () => {
    if (!itemModal.type) return;
    try {
      setActionLoading(true);
      setActionError(null);
      let body: any = {};
      if (itemModal.action === "verify") {
        body = {
          notes: itemModal.notes.trim() || "Verified by System Admin",
          documentId: itemModal.docId || undefined,
        };
      } else if (itemModal.action === "flag") {
        if (!itemModal.notes.trim()) {
          setActionError("Please provide a reason for flagging this item.");
          setActionLoading(false);
          return;
        }
        body = { notes: itemModal.notes.trim() };
      } else if (itemModal.action === "reject") {
        if (!itemModal.notes.trim()) {
          setActionError("Please provide a reason for rejecting this item.");
          setActionLoading(false);
          return;
        }
        body = { reason: itemModal.notes.trim() };
      }

      const res = await authenticatedFetch(
        `/api/v1/admin/suppliers/${supplierId}/verification/items/${itemModal.type}/${itemModal.action}`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        throw new Error(await parseBackendError(res, `Failed to ${itemModal.action} ${itemModal.title}`));
      }

      setItemModal({ open: false, type: "", action: "verify", title: "", value: "", notes: "" });
      await loadWorkspace();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Request Information
  const submitRequestInfo = async () => {
    const combinedMessage = [
      infoReason.trim() ? `Reason: ${infoReason.trim()}` : "",
      missingItems.length > 0 ? `Required Items: ${missingItems.join(", ")}` : "",
      infoCustomNote.trim() ? `Notes: ${infoCustomNote.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (!combinedMessage) {
      setActionError("Please specify the required information details or reason.");
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);
      const res = await authenticatedFetch(`/api/v1/admin/suppliers/${supplierId}/verification/request-info`, {
        method: "POST",
        body: JSON.stringify({ requestedNotes: combinedMessage }),
      });
      if (!res.ok) {
        throw new Error(await parseBackendError(res, "Failed to send information request"));
      }
      setInfoModalOpen(false);
      setInfoReason("");
      setMissingItems([]);
      setInfoCustomNote("");
      await loadWorkspace();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Final Verify Supplier
  const submitFinalVerify = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      const res = await authenticatedFetch(`/api/v1/admin/suppliers/${supplierId}/verification/finalize`, {
        method: "POST",
        body: JSON.stringify({
          overrideReason: overrideReason.trim() || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(await parseBackendError(res, "Failed to finalize supplier verification"));
      }
      setVerifyModalOpen(false);
      setVerifyNotes("");
      setOverrideReason("");
      await loadWorkspace();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Supplier
  const submitRejectSupplier = async () => {
    if (!rejectReason.trim()) {
      setActionError("Please enter a rejection reason.");
      return;
    }
    try {
      setActionLoading(true);
      setActionError(null);
      const res = await authenticatedFetch(`/api/v1/admin/suppliers/${supplierId}/verification/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      if (!res.ok) {
        throw new Error(await parseBackendError(res, "Failed to reject supplier application"));
      }
      setRejectModalOpen(false);
      setRejectReason("");
      await loadWorkspace();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Suspend Supplier
  const submitSuspendSupplier = async () => {
    if (!suspendReason.trim()) {
      setActionError("Please enter a suspension reason.");
      return;
    }
    try {
      setActionLoading(true);
      setActionError(null);
      const res = await authenticatedFetch(`/api/v1/admin/suppliers/${supplierId}/verification/suspend`, {
        method: "POST",
        body: JSON.stringify({ reason: suspendReason.trim() }),
      });
      if (!res.ok) {
        throw new Error(await parseBackendError(res, "Failed to suspend supplier account"));
      }
      setSuspendModalOpen(false);
      setSuspendReason("");
      await loadWorkspace();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-xs font-bold text-slate-500 min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <span>Loading Due-Diligence Workspace...</span>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="max-w-7xl mx-auto p-8 space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium">
          {error || "Supplier profile not found"}
        </div>
        <Link href="/dashboard/admin/suppliers/verification" className="text-xs font-bold text-purple-600 underline">
          &larr; Return to Supplier Verification Queue
        </Link>
      </div>
    );
  }

  const vStatus = workspace.verificationStatus || (workspace.verified ? "VERIFIED" : "PENDING");
  const isVerified = vStatus === "VERIFIED" || workspace.verified;
  const isUnderReview = vStatus === "UNDER_REVIEW";
  const isPending = vStatus === "PENDING";
  const isInfoReq = vStatus === "INFORMATION_REQUIRED";

  // Map checklist item helper
  const getChecklistItem = (type: string) => {
    return workspace.checklist?.find((c: any) => c.verificationType === type);
  };

  const getHumanTypeLabel = (type: string) => {
    switch (type) {
      case "LEGAL_IDENTITY":
        return "Legal Company Identity";
      case "TAX_IDENTITY":
        return "Tax / GST Identity";
      case "BUSINESS_ADDRESS":
        return "Registered Business Address";
      case "BUSINESS_TYPE":
        return "Business Type";
      case "CONTACT_INFORMATION":
        return "Authorized Contact Information";
      case "WEBSITE":
        return "Company Website";
      case "COMPLIANCE_CERTIFICATION":
        return "Compliance Certifications";
      case "EXPORT_CAPABILITY":
        return "Export Capability";
      case "BUSINESS_OPERATION":
        return "Business Operations";
      default:
        return type.replace(/_/g, " ");
    }
  };

  // Check mandatory requirements completeness
  const mandatoryItems = workspace.checklist?.filter((c: any) => c.mandatory) || [];
  const incompleteMandatory = mandatoryItems.filter((c: any) => c.status !== "VERIFIED");
  const canFinalVerify = incompleteMandatory.length === 0;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/suppliers/verification"
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {workspace.companyName || workspace.legalName || workspace.tradeName || `Supplier #${supplierId}`}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                  isVerified
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : isUnderReview
                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                    : isInfoReq
                    ? "bg-purple-50 text-purple-800 border border-purple-200"
                    : isPending
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-slate-100 text-slate-800 border border-slate-200"
                }`}
              >
                {vStatus}
              </span>
              <span className="text-xs font-bold text-purple-700 font-mono">
                Supplier ID: #{workspace.supplierId}
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
          disabled={loading}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-600" : ""}`} /> Refresh Workspace
        </button>
      </div>

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs font-bold text-rose-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Onboarding Completeness Score Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold tracking-widest text-purple-400 uppercase block">
              Application Completeness Score
            </span>
            <strong className="text-3xl font-black">{workspace.completenessPercentage}% Complete</strong>
          </div>
          <div className="flex gap-2">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                workspace.completenessDetails?.companyIdentity
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-white/10 text-white/50"
              }`}
            >
              Identity
            </span>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                workspace.completenessDetails?.taxInformation
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-white/10 text-white/50"
              }`}
            >
              Tax
            </span>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                workspace.completenessDetails?.businessDocuments
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-white/10 text-white/50"
              }`}
            >
              Docs
            </span>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                workspace.completenessDetails?.catalogInformation
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-white/10 text-white/50"
              }`}
            >
              Catalog
            </span>
          </div>
        </div>
        <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-400 to-emerald-400 h-full transition-all duration-500"
            style={{ width: `${workspace.completenessPercentage}%` }}
          />
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold">
        {[
          { id: 1, label: "Company Identity" },
          { id: 2, label: "Tax & Registration" },
          { id: 3, label: "Business Information" },
          { id: 4, label: "Address & Contact" },
          { id: 5, label: "Documents & Evidence" },
          { id: 6, label: "Verification Checklist" },
          { id: 7, label: "Audit History" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-2xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Workspace Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active Tab Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* TAB 1: COMPANY IDENTITY */}
          {activeTab === 1 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" /> TAB 1 / LEGAL ENTITY IDENTITY & BRANDING
                </h3>
                {getChecklistItem("LEGAL_IDENTITY") && (
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                      getChecklistItem("LEGAL_IDENTITY").status === "VERIFIED"
                        ? "bg-emerald-100 text-emerald-800"
                        : getChecklistItem("LEGAL_IDENTITY").status === "FLAGGED"
                        ? "bg-amber-100 text-amber-800"
                        : getChecklistItem("LEGAL_IDENTITY").status === "REJECTED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {getChecklistItem("LEGAL_IDENTITY").status}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="w-24 h-24 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 p-1">
                  {workspace.logoUrl ? (
                    <img src={workspace.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-10 h-10 text-slate-300" />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Legal Corporate Name</span>
                    <strong className="text-slate-900 font-extrabold text-sm block">
                      {workspace.legalName || workspace.companyName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Trading / Brand Name</span>
                    <strong className="text-slate-900 font-bold block">
                      {workspace.tradeName || workspace.companyName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Business Classification</span>
                    <strong className="text-slate-900 block">{workspace.businessType || "Manufacturer"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Year Established</span>
                    <strong className="text-slate-900 block">{workspace.yearsInBusiness ? `${workspace.yearsInBusiness} Years` : "N/A"}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Website</span>
                    {workspace.website ? (
                      <a
                        href={workspace.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:underline font-medium inline-flex items-center gap-1"
                      >
                        {workspace.website} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">Not Provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons for Legal Identity */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">
                  Requirement: <span className="text-rose-600 font-black">MANDATORY</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setItemModal({
                        open: true,
                        type: "LEGAL_IDENTITY",
                        action: "verify",
                        title: "Legal Company Identity",
                        value: workspace.legalName || workspace.companyName,
                        notes: "",
                      })
                    }
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Verify Identity
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setItemModal({
                        open: true,
                        type: "LEGAL_IDENTITY",
                        action: "flag",
                        title: "Legal Company Identity",
                        value: workspace.legalName || workspace.companyName,
                        notes: "",
                      })
                    }
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Flag
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setItemModal({
                        open: true,
                        type: "LEGAL_IDENTITY",
                        action: "reject",
                        title: "Legal Company Identity",
                        value: workspace.legalName || workspace.companyName,
                        notes: "",
                      })
                    }
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TAX & REGISTRATION */}
          {activeTab === 2 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" /> TAB 2 / TAX & STATUTORY REGISTRATION
                </h3>
              </div>

              {/* GST / Tax Identity Item */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">GST / Tax Identification</span>
                    <strong className="text-sm font-black text-slate-900 font-mono">
                      {workspace.taxVatNumber || "Not Provided"}
                    </strong>
                  </div>
                  {getChecklistItem("TAX_IDENTITY") && (
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                        getChecklistItem("TAX_IDENTITY").status === "VERIFIED"
                          ? "bg-emerald-100 text-emerald-800"
                          : getChecklistItem("TAX_IDENTITY").status === "FLAGGED"
                          ? "bg-amber-100 text-amber-800"
                          : getChecklistItem("TAX_IDENTITY").status === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {getChecklistItem("TAX_IDENTITY").status}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-500 font-medium">Requirement: MANDATORY</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setItemModal({
                          open: true,
                          type: "TAX_IDENTITY",
                          action: "verify",
                          title: "Tax / GST Identity",
                          value: workspace.taxVatNumber,
                          notes: "",
                        })
                      }
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Verify GST
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setItemModal({
                          open: true,
                          type: "TAX_IDENTITY",
                          action: "flag",
                          title: "Tax / GST Identity",
                          value: workspace.taxVatNumber,
                          notes: "",
                        })
                      }
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Flag
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setItemModal({
                          open: true,
                          type: "TAX_IDENTITY",
                          action: "reject",
                          title: "Tax / GST Identity",
                          value: workspace.taxVatNumber,
                          notes: "",
                        })
                      }
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>

              {/* Company Registration / CIN Item */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">CIN / Company Incorporation Number</span>
                    <strong className="text-sm font-black text-slate-900 font-mono">
                      {workspace.companyRegistrationNumber || "Not Provided"}
                    </strong>
                  </div>
                  {getChecklistItem("BUSINESS_OPERATION") && (
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                        getChecklistItem("BUSINESS_OPERATION").status === "VERIFIED"
                          ? "bg-emerald-100 text-emerald-800"
                          : getChecklistItem("BUSINESS_OPERATION").status === "FLAGGED"
                          ? "bg-amber-100 text-amber-800"
                          : getChecklistItem("BUSINESS_OPERATION").status === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {getChecklistItem("BUSINESS_OPERATION").status}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-500 font-medium">Requirement: MANDATORY</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setItemModal({
                          open: true,
                          type: "BUSINESS_OPERATION",
                          action: "verify",
                          title: "Company Registration / CIN",
                          value: workspace.companyRegistrationNumber,
                          notes: "",
                        })
                      }
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Verify CIN
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setItemModal({
                          open: true,
                          type: "BUSINESS_OPERATION",
                          action: "flag",
                          title: "Company Registration / CIN",
                          value: workspace.companyRegistrationNumber,
                          notes: "",
                        })
                      }
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Flag
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setItemModal({
                          open: true,
                          type: "BUSINESS_OPERATION",
                          action: "reject",
                          title: "Company Registration / CIN",
                          value: workspace.companyRegistrationNumber,
                          notes: "",
                        })
                      }
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BUSINESS INFORMATION */}
          {activeTab === 3 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" /> TAB 3 / COMMERCIAL & OPERATIONS PROFILE
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Business Type</span>
                  <strong className="text-slate-900 block font-extrabold">{workspace.businessType || "N/A"}</strong>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Export Readiness</span>
                  <strong className="text-slate-900 block font-extrabold">
                    {workspace.exportReady ? "Export Ready (International)" : "Domestic Supply Only"}
                  </strong>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Primary Categories</span>
                  <span className="text-slate-800 font-medium block">{workspace.primaryCategories || "APIs, Intermediates"}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Export Markets Served</span>
                  <span className="text-slate-800 font-medium block">{workspace.countriesServed || "Global Markets"}</span>
                </div>
                <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Business Description</span>
                  <p className="text-slate-700 font-medium mt-1 leading-relaxed">
                    {workspace.businessDescription || "No detailed business description provided."}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Business Type Verification</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setItemModal({
                        open: true,
                        type: "BUSINESS_TYPE",
                        action: "verify",
                        title: "Business Type",
                        value: workspace.businessType,
                        notes: "",
                      })
                    }
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Verify Type
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setItemModal({
                        open: true,
                        type: "BUSINESS_TYPE",
                        action: "flag",
                        title: "Business Type",
                        value: workspace.businessType,
                        notes: "",
                      })
                    }
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Flag
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ADDRESS & CONTACT */}
          {activeTab === 4 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600" /> TAB 4 / HEADQUARTERS & AUTHORIZED CONTACTS
                </h3>
              </div>

              {/* Registered Address */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Registered Physical Address</span>
                  {getChecklistItem("BUSINESS_ADDRESS") && (
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                        getChecklistItem("BUSINESS_ADDRESS").status === "VERIFIED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {getChecklistItem("BUSINESS_ADDRESS").status}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-800 leading-relaxed">
                  {workspace.registeredAddress || "Midc Industrial Area"}, {workspace.city || "Mumbai"},{" "}
                  {workspace.stateProvince || "Maharashtra"} - {workspace.postalCode || "400001"},{" "}
                  {workspace.countryName || "India"}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-500 font-medium">Requirement: MANDATORY</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setItemModal({
                          open: true,
                          type: "BUSINESS_ADDRESS",
                          action: "verify",
                          title: "Registered Business Address",
                          value: workspace.registeredAddress,
                          notes: "",
                        })
                      }
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Verify Address
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setItemModal({
                          open: true,
                          type: "BUSINESS_ADDRESS",
                          action: "flag",
                          title: "Registered Business Address",
                          value: workspace.registeredAddress,
                          notes: "",
                        })
                      }
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Flag
                    </button>
                  </div>
                </div>
              </div>

              {/* Authorized Representative & Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Authorized Contact</span>
                  <strong className="text-slate-900 block font-bold text-xs">
                    {workspace.authorizedRepresentativeName || "Not Provided"}
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    {workspace.authorizedRepresentativeDesignation || "Official Representative"}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Business Email</span>
                  <strong className="text-slate-900 block truncate font-medium text-xs">
                    {workspace.businessEmail || "N/A"}
                  </strong>
                  {workspace.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Email Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-rose-500">Email Unverified</span>
                  )}
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Business Phone</span>
                  <strong className="text-slate-900 block font-mono font-medium text-xs">
                    {workspace.businessPhone || "N/A"}
                  </strong>
                  {workspace.phoneVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Phone Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-rose-500">Phone Unverified</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DOCUMENTS & EVIDENCE */}
          {activeTab === 5 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-purple-600" /> TAB 5 / KYC EVIDENCE & STATUTORY DOCUMENTS
                </h3>
              </div>

              <div className="space-y-4">
                {workspace.checklist
                  ?.filter((c: any) => c.evidenceDocumentId || c.mandatory)
                  .map((item: any, idx: number) => {
                    const isDocVerified = item.status === "VERIFIED";
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border bg-slate-50 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900 font-bold text-sm">
                              {getHumanTypeLabel(item.verificationType)}
                            </strong>
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                item.mandatory ? "bg-rose-100 text-rose-800" : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {item.mandatory ? "MANDATORY" : "OPTIONAL"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                isDocVerified
                                  ? "bg-emerald-200 text-emerald-900"
                                  : item.status === "FLAGGED"
                                  ? "bg-amber-200 text-amber-900"
                                  : item.status === "REJECTED"
                                  ? "bg-rose-200 text-rose-900"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
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
                          {item.evidenceDocumentId && (
                            <a
                              href={`/api/v1/documents/${item.evidenceDocumentId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Document
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setItemModal({
                                open: true,
                                type: item.verificationType,
                                action: "verify",
                                title: getHumanTypeLabel(item.verificationType),
                                docId: item.evidenceDocumentId,
                                notes: "",
                              })
                            }
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                          >
                            Verify
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setItemModal({
                                open: true,
                                type: item.verificationType,
                                action: "flag",
                                title: getHumanTypeLabel(item.verificationType),
                                docId: item.evidenceDocumentId,
                                notes: "",
                              })
                            }
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors"
                          >
                            Flag
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setItemModal({
                                open: true,
                                type: item.verificationType,
                                action: "reject",
                                title: getHumanTypeLabel(item.verificationType),
                                docId: item.evidenceDocumentId,
                                notes: "",
                              })
                            }
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
          )}

          {/* TAB 6: VERIFICATION CHECKLIST */}
          {activeTab === 6 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-purple-600" /> TAB 6 / DATA-DRIVEN VERIFICATION CHECKLIST
                </h3>
              </div>

              <div className="space-y-3">
                {workspace.checklist?.map((item: any, idx: number) => {
                  const isVerifiedItem = item.status === "VERIFIED";
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (item.verificationType === "LEGAL_IDENTITY") setActiveTab(1);
                        else if (item.verificationType === "TAX_IDENTITY" || item.verificationType === "BUSINESS_OPERATION") setActiveTab(2);
                        else if (item.verificationType === "BUSINESS_TYPE" || item.verificationType === "EXPORT_CAPABILITY") setActiveTab(3);
                        else if (item.verificationType === "BUSINESS_ADDRESS" || item.verificationType === "CONTACT_INFORMATION") setActiveTab(4);
                        else setActiveTab(5);
                      }}
                      className="cursor-pointer p-4 rounded-2xl border bg-slate-50 hover:bg-slate-100 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isVerifiedItem
                              ? "bg-emerald-600 text-white"
                              : item.status === "FLAGGED"
                              ? "bg-amber-500 text-white"
                              : item.status === "REJECTED"
                              ? "bg-rose-600 text-white"
                              : "bg-slate-300 text-slate-700"
                          }`}
                        >
                          {isVerifiedItem ? "✓" : item.status === "FLAGGED" ? "⚠" : item.status === "REJECTED" ? "✕" : "○"}
                        </div>
                        <div>
                          <strong className="text-slate-900 font-bold text-xs block">
                            {getHumanTypeLabel(item.verificationType)}
                          </strong>
                          <span className="text-[11px] text-slate-500">
                            {item.mandatory ? "Mandatory requirement" : "Optional verification parameter"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                          isVerifiedItem
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "FLAGGED"
                            ? "bg-amber-100 text-amber-800"
                            : item.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 7: AUDIT HISTORY */}
          {activeTab === 7 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-600" /> TAB 7 / IMMUTABLE VERIFICATION DECISION AUDIT TRAIL
                </h3>
              </div>

              {workspace.auditHistory && workspace.auditHistory.length > 0 ? (
                <div className="divide-y divide-slate-100 text-xs">
                  {workspace.auditHistory.map((audit: any, idx: number) => (
                    <div key={idx} className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{audit.adminName}</span>
                        <span className="text-slate-400 ml-2">
                          ({audit.previousStatus} &rarr; {audit.newStatus})
                        </span>
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
          )}
        </div>

        {/* Right 1 Col: Guarded Decisions Panel */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-5">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lock className="w-4 h-4 text-purple-600" /> GUARDED DECISION ENGINE
            </h3>

            {/* Step 1: Start Review Action */}
            {isPending && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-amber-900 block">Pending Due Diligence</span>
                <p className="text-[11px] text-amber-800">
                  Begin administrative investigation and transition application state to UNDER REVIEW.
                </p>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleStartReview}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-2xs"
                >
                  Start Review
                </button>
              </div>
            )}

            {isUnderReview && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
                <span className="text-xs font-black text-blue-900 block">Active Review in Progress</span>
                <p className="text-[11px] text-blue-800">
                  Application is under active administrative moderation. Inspect all tabs and complete verification checklist.
                </p>
              </div>
            )}

            {/* Request Information Button */}
            <button
              type="button"
              disabled={actionLoading || isVerified}
              onClick={() => setInfoModalOpen(true)}
              className="w-full py-2.5 bg-purple-50 text-purple-800 hover:bg-purple-100 rounded-xl text-xs font-bold transition-colors border border-purple-200/60 disabled:opacity-50"
            >
              Request Information (INFO REQUIRED)
            </button>

            {/* Final Verify Decision Gate */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {isVerified ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                  <span className="text-emerald-900 font-extrabold text-xs flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> SUPPLIER OFFICIALLY VERIFIED ✓
                  </span>
                  <p className="text-[10px] text-emerald-700 font-medium">
                    All legal identity and regulatory compliance criteria have been verified and recorded.
                  </p>
                </div>
              ) : (
                <>
                  {!canFinalVerify && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                      <strong>Verification Blocked:</strong> {incompleteMandatory.length} mandatory requirement(s) remain unverified.
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={actionLoading || (!canFinalVerify && !overrideReason.trim())}
                    onClick={() => setVerifyModalOpen(true)}
                    className="w-full py-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Verify Supplier (VERIFIED)
                  </button>
                </>
              )}
            </div>

            {/* Reject & Suspend Buttons */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {!isVerified && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setRejectModalOpen(true)}
                  className="w-full py-2 bg-rose-50 text-rose-800 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors"
                >
                  Reject Application (REJECTED)
                </button>
              )}
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setSuspendModalOpen(true)}
                className="w-full py-2 bg-slate-900 text-white hover:bg-black rounded-xl text-xs font-bold transition-colors"
              >
                Suspend Account (SUSPENDED)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ITEM-LEVEL VERIFICATION / FLAG / REJECT MODAL */}
      {itemModal.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">
              {itemModal.action === "verify"
                ? `Verify ${itemModal.title}`
                : itemModal.action === "flag"
                ? `Flag ${itemModal.title}`
                : `Reject ${itemModal.title}`}
            </h3>

            {itemModal.value && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Submitted Information</span>
                <strong className="text-slate-800">{itemModal.value}</strong>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {itemModal.action === "verify" ? "Admin Audit Notes (Optional)" : "Reason / Justification (Required)"}
              </label>
              <textarea
                rows={3}
                value={itemModal.notes}
                onChange={(e) => setItemModal({ ...itemModal, notes: e.target.value })}
                placeholder={
                  itemModal.action === "verify"
                    ? "Record certificate inspection notes or evidence verification remarks..."
                    : "Specify the discrepancy, missing detail, or justification..."
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemModal({ ...itemModal, open: false })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitItemAction}
                className={`px-4 py-2 text-white text-xs font-bold rounded-xl ${
                  itemModal.action === "verify"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : itemModal.action === "flag"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                Confirm {itemModal.action}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST INFORMATION MODAL */}
      {infoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">Request Information from Supplier</h3>
            <p className="text-xs text-slate-600">
              Select missing or deficient items and provide clear instructions for the supplier to address before resubmitting.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Select Deficient Items</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {["GST Certificate", "CIN / Incorporation", "Address Proof", "Drug License", "ISO Certificate", "Logo Replacement"].map((item) => (
                  <label key={item} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={missingItems.includes(item)}
                      onChange={(e) => {
                        if (e.target.checked) setMissingItems([...missingItems, item]);
                        else setMissingItems(missingItems.filter((i) => i !== item));
                      }}
                      className="rounded text-purple-600"
                    />
                    <span className="font-medium text-slate-800">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Message to Supplier</label>
              <textarea
                rows={3}
                value={infoCustomNote}
                onChange={(e) => setInfoCustomNote(e.target.value)}
                placeholder="e.g. Please upload updated GST-3B certificate valid for 2026..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInfoModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRequestInfo}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL VERIFY SUPPLIER MODAL */}
      {verifyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">Confirm Supplier Verification</h3>
            <p className="text-xs text-slate-600">
              You are officially verifying <strong className="text-slate-900">{workspace.companyName}</strong>. This grants verified supplier standing and public Chemical Catalog eligibility.
            </p>

            {!canFinalVerify && (
              <div>
                <label className="block text-xs font-bold text-amber-800 mb-1">
                  Admin Override Reason (Mandatory requirements incomplete)
                </label>
                <textarea
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Record justification for administrative override..."
                  className="w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-xl text-xs font-medium"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVerifyModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitFinalVerify}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Confirm Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT SUPPLIER MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">Reject Supplier Application</h3>
            <p className="text-xs text-slate-600">
              Specify the legal or compliance reason for rejecting this supplier's application.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Fraudulent tax identification documentation provided..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRejectSupplier}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUSPEND SUPPLIER MODAL */}
      {suspendModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">Suspend Supplier Account</h3>
            <p className="text-xs text-slate-600">
              This immediately revokes marketplace trading permissions and hides commercial offerings from the Chemical Catalog.
            </p>
            <textarea
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Critical quality non-conformance reported by buyer..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSuspendModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitSuspendSupplier}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
