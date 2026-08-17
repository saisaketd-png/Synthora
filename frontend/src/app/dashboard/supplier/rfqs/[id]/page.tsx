"use client";

import { useEffect, useState } from "react";
import { getSupplierRfq } from "@/features/rfq/api/getSupplierRfq";
import { SupplierRfq } from "@/features/rfq/api/getSupplierRfqs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QuotationForm } from "@/features/rfq/components/QuotationForm";
import { QuotationResponse } from "@/features/rfq/api/submitQuotation";
import {
  ChevronLeft,
  FileText,
  Building2,
  Package,
  Calendar,
  AlertCircle,
  RefreshCw,
  FlaskConical,
} from "lucide-react";

export default function SupplierRfqDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [rfq, setRfq] = useState<SupplierRfq | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quotation, setQuotation] = useState<QuotationResponse | null>(null);

  const loadRfq = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getSupplierRfq(id);
      setRfq(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load supplier RFQ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRfq();
  }, [id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "QUOTED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "PENDING":
      case "CONTACTED":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "CLOSED":
      case "CANCELLED":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded-md" />
        <div className="h-8 w-60 bg-slate-200 rounded-lg" />
        <div className="h-64 bg-white border border-slate-200 rounded-2xl p-6" />
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-rose-800 space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Unable to Load RFQ</h2>
              <p className="text-sm text-slate-600 mt-0.5">{error || "RFQ reference not found"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={loadRfq}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
            <Link
              href="/dashboard/supplier/rfqs"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Inbox
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const effectiveStatus = quotation ? "QUOTED" : rfq.status;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/dashboard/supplier" className="hover:text-slate-900 transition-colors">
              Workspace
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/dashboard/supplier/rfqs" className="hover:text-slate-900 transition-colors">
              RFQ Inbox
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-slate-900 font-bold">
              {rfq.rfqReference || `#${rfq.id.substring(0, 8).toUpperCase()}`}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-3">
            Inquiry Dossier
            <span className="font-mono text-xl sm:text-2xl text-slate-500 font-bold">
              {rfq.rfqReference || `#${rfq.id.substring(0, 8).toUpperCase()}`}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/dashboard/supplier/rfqs"
            className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Inbox
          </Link>
          <span
            className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold border ${getStatusBadge(
              effectiveStatus
            )}`}
          >
            {effectiveStatus}
          </span>
        </div>
      </div>

      {/* Inquiry Specification Sheet */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <FlaskConical className="w-3.5 h-3.5 text-[#17B5AE]" />
              Buyer Procurement Requirement
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {rfq.productName || "Specialty Chemical Raw Material"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Buyer Organization: <strong className="text-slate-800">{rfq.buyerName || "Buyer Organization"}</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Submitted</span>
            <span className="text-xs font-medium text-slate-700 mt-0.5 block">
              {new Date(rfq.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Specification Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Requested Quantity
            </span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">
              {rfq.quantity.toLocaleString()} {rfq.unit}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              RFQ Reference
            </span>
            <p className="text-sm font-mono font-bold text-slate-800 mt-2">
              {rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Target Product
            </span>
            <p className="text-xs font-semibold text-slate-800 mt-2 truncate">
              {rfq.productName || "Chemical Material"}
            </p>
          </div>
        </div>

        {/* Buyer Remarks / Message */}
        <div className="pt-2">
          <span className="text-xs font-bold text-slate-700">Buyer Remarks & Specific Delivery Terms:</span>
          <div className="mt-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {rfq.message || <span className="italic text-slate-400">No additional message provided with inquiry.</span>}
          </div>
        </div>
      </div>

      {/* Quotation Workspace / Result */}
      {quotation ? (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Official Submission Active
              </span>
              <h3 className="text-lg font-bold text-emerald-950 mt-0.5">
                Quotation Version {quotation.quotationVersion} Transmitted
              </h3>
            </div>
            <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-xs">
              Quoted
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 block font-semibold">Unit Price</span>
              <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                {quotation.currency} {quotation.unitPrice.toFixed(2)}
              </span>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 block font-semibold">Validity Date</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {quotation.validityDate}
              </span>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 block font-semibold">Min. Order Quantity</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {quotation.minimumOrderQuantity != null
                  ? `${quotation.minimumOrderQuantity} units`
                  : "Standard"}
              </span>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 block font-semibold">Lead Time</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {quotation.leadTimeDays != null ? `${quotation.leadTimeDays} days` : "Standard"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        rfq.status !== "CLOSED" &&
        rfq.status !== "CANCELLED" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-3 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Commercial Submission
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Submit Quotation to Buyer
              </h3>
            </div>
            <QuotationForm rfqId={rfq.id} onSuccess={(q) => setQuotation(q)} />
          </div>
        )
      )}
    </div>
  );
}
