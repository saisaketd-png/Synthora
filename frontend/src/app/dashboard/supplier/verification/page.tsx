"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Upload,
  RefreshCw,
  HelpCircle,
  FileCheck
} from "lucide-react";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { useToast } from "@/shared/context/ToastContext";

export default function SupplierVerificationSelfServicePage() {
  const toast = useToast();
  const [workspace, setWorkspace] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadVerification = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authenticatedFetch("/api/v1/supplier/verification");
      if (!res.ok) throw new Error("Failed to load verification workspace");
      const data = await res.json();
      setWorkspace(data);
    } catch (e: any) {
      setError(e.message || "Failed to load verification status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVerification();
  }, [loadVerification]);

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseNotes.trim()) {
      toast.error("Please enter details regarding your verification submission.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await authenticatedFetch("/api/v1/supplier/verification/respond", {
        method: "POST",
        body: JSON.stringify({ responseNotes: responseNotes.trim() }),
      });
      if (!res.ok) throw new Error("Failed to submit verification response");
      setResponseNotes("");
      toast.success("Response submitted successfully! Your account is now UNDER REVIEW.");
      await loadVerification();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center text-xs font-bold text-slate-500">
        Loading Supplier Verification Workspace...
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="max-w-5xl mx-auto p-8 space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium">
          {error || "Verification profile not found"}
        </div>
        <button
          onClick={loadVerification}
          className="text-xs font-bold text-blue-600 underline"
        >
          Try Reloading
        </button>
      </div>
    );
  }

  const vStatus = workspace.verificationStatus;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#0B1F3A] text-white rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4 border border-[#0B1F3A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold tracking-widest text-[#0F9F9A] uppercase">Supplier Trust & Compliance</span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                vStatus === "VERIFIED" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" :
                vStatus === "UNDER_REVIEW" ? "bg-blue-500/20 text-blue-300 border border-blue-500/40" :
                vStatus === "INFORMATION_REQUIRED" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                vStatus === "SUSPENDED" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" :
                "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}>
                {vStatus}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">{workspace.companyName} Verification Status</h1>
          </div>

          <button
            onClick={loadVerification}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto border border-white/10"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
          </button>
        </div>

        {/* Onboarding Completeness Bar */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-300">Onboarding Completeness Score</span>
            <span className="text-[#0F9F9A] font-extrabold font-mono">{workspace.completenessPercentage}% Complete</span>
          </div>
          <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
            <div className="bg-[#0F9F9A] h-full transition-all duration-500" style={{ width: `${workspace.completenessPercentage}%` }} />
          </div>
        </div>
      </div>

      {/* Admin Information Request Alert when INFORMATION_REQUIRED */}
      {vStatus === "INFORMATION_REQUIRED" && workspace.adminRequestNotes && (
        <div className="p-6 bg-purple-50 border-2 border-purple-200 rounded-3xl space-y-3">
          <div className="flex items-center gap-2 text-purple-900 font-extrabold text-sm">
            <AlertCircle className="w-5 h-5 text-purple-600 shrink-0" />
            Action Required: Admin Requested Additional Information
          </div>
          <p className="text-xs text-purple-950 bg-white/60 p-3 rounded-xl border border-purple-200">
            {workspace.adminRequestNotes}
          </p>
        </div>
      )}

      {/* Suspended Alert */}
      {vStatus === "SUSPENDED" && (
        <div className="p-6 bg-rose-50 border-2 border-rose-200 rounded-3xl space-y-2 text-rose-900">
          <div className="flex items-center gap-2 font-extrabold text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" /> Account Suspended
          </div>
          <p className="text-xs text-rose-800">
            {workspace.verificationNotes || "Your supplier account has been suspended following a compliance review. Please contact compliance@synthora.com."}
          </p>
        </div>
      )}

      {/* Checklist Overview */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileCheck className="w-4 h-4 text-blue-600" /> COMPLIANCE CHECKLIST STATUS
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {workspace.checklist?.map((item: any, idx: number) => (
            <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <strong className="text-slate-900 font-bold block">{item.title}</strong>
                <span className="text-[10px] text-slate-500 uppercase">{item.mandatory ? "Mandatory" : "Optional"}</span>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${
                item.status === "VERIFIED" ? "bg-emerald-100 text-emerald-800" :
                item.status === "FLAGGED" ? "bg-amber-100 text-amber-800" :
                item.status === "REJECTED" ? "bg-rose-100 text-rose-800" :
                item.status === "EXPIRED" ? "bg-purple-100 text-purple-800" :
                "bg-slate-200 text-slate-700"
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Supplier Response & Document Upload Form */}
      {vStatus !== "SUSPENDED" && (
        <form onSubmit={handleSubmitResponse} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Send className="w-4 h-4 text-purple-600" /> SUBMIT VERIFICATION RESPONSE & DETAILS
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Response Details & Certificate Notes</label>
              <textarea
                rows={4}
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                placeholder="Explain uploaded certificates, updated registration numbers, or response to admin inquiry..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Link
                href="/dashboard/supplier/documents"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Manage Documents
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                {submitting ? "Submitting..." : "Submit Response"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
