"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Building2,
  ShieldCheck,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ExternalLink,
  Info,
  Layers,
  FlaskConical,
} from "lucide-react";

import { getRfq, RfqDetail } from "@/features/rfq/api/getRfq";
import { getBuyerQuotations } from "@/features/rfq/api/getBuyerQuotations";
import { QuotationResponse } from "@/features/rfq/api/submitQuotation";
import { QuotationComparison } from "@/features/rfq/components/QuotationComparison";
import { getProductDetail } from "@/app/products/api/getProductDetail";
import { getProductSuppliers } from "@/app/products/api/getProductSuppliers";
import { getOrderByRfqId } from "@/features/order/api/getOrderByRfqId";
import { IssuePoModal } from "@/features/order/components/IssuePoModal";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";

type ProductDetail = {
  id: string;
  name: string;
  description: string;
  category: string;
  casNumber: string;
  molecularFormula: string;
  purity: number;
  grade: string;
  price: number;
  stock: number;
  moqKg: number;
  packaging: string;
  availabilityStatus: string;
  leadTimeDays: number;
  exportReady: boolean;
  coaAvailable: boolean;
  msdsAvailable: boolean;
};

type Supplier = {
  supplierId: number;
  supplierName: string;
  countryName: string;
  verified: boolean;
  responseRate: number;
  yearsInBusiness: number;
  purity: number;
  grade: string;
  leadTimeDays: number;
  moqKg: number;
  packaging: string;
  coaAvailable: boolean;
  msdsAvailable: boolean;
};

export default function BuyerRfqDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rfqId = params?.id as string;

  const [rfq, setRfq] = useState<RfqDetail | null>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [quotations, setQuotations] = useState<QuotationResponse[]>([]);
  const [existingPo, setExistingPo] = useState<PurchaseOrderResponse | null>(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRfqDetail = useCallback(async () => {
    if (!rfqId) return;
    try {
      setLoading(true);
      setError(null);

      const [rfqData, quotationsData, poData] = await Promise.all([
        getRfq(rfqId),
        getBuyerQuotations(rfqId).catch(() => [] as QuotationResponse[]),
        getOrderByRfqId(rfqId).catch(() => null),
      ]);

      const [productData, suppliersData] = await Promise.all([
        getProductDetail(rfqData.productId).catch(() => null),
        getProductSuppliers(rfqData.productId).catch(() => [] as Supplier[]),
      ]);

      const matchingSupplier = suppliersData?.find(
        (item: Supplier) => item.supplierId === rfqData.supplierId
      );

      setRfq(rfqData);
      setQuotations(quotationsData);
      setExistingPo(poData);
      setProduct(productData);
      setSupplier(matchingSupplier ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load RFQ details");
    } finally {
      setLoading(false);
    }
  }, [rfqId]);

  useEffect(() => {
    loadRfqDetail();
  }, [loadRfqDetail]);

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

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 w-64 bg-slate-200 rounded-md" />

        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-60 bg-slate-200 rounded-lg" />
            <div className="h-4 w-96 bg-slate-200 rounded-md" />
          </div>
          <div className="h-8 w-28 bg-slate-200 rounded-full" />
        </div>

        {/* Two Column Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-white border border-slate-200 rounded-2xl p-6" />
          <div className="h-72 bg-white border border-slate-200 rounded-2xl p-6" />
        </div>

        {/* Quotation & Timeline Skeletons */}
        <div className="h-64 bg-white border border-slate-200 rounded-2xl p-6" />
        <div className="h-48 bg-white border border-slate-200 rounded-2xl p-6" />
      </div>
    );
  }

  // Error State View
  if (error || !rfq) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-rose-800 space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Unable to Load RFQ</h2>
              <p className="text-sm text-slate-600 mt-0.5">{error ?? "RFQ reference not found"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={loadRfqDetail}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
            <Link
              href="/dashboard/rfqs"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to My RFQs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
              Workspace
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/dashboard/rfqs" className="hover:text-slate-900 transition-colors">
              My RFQs
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-slate-900 font-bold">
              #{rfq.id.substring(0, 8)}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-3">
            Procurement Request
            <span className="font-mono text-xl sm:text-2xl text-slate-500 font-bold">
              #{rfq.id.substring(0, 8)}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/dashboard/rfqs"
            className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to RFQs
          </Link>
          <span
            className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold border ${getStatusBadge(
              rfq.status
            )}`}
          >
            {rfq.status}
          </span>
        </div>
      </div>

      {/* Commercial Consensus / Purchase Order Action Banner (When ACCEPTED) */}
      {rfq.status === "ACCEPTED" && (
        <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Commercial Consensus Reached
                </span>
                {existingPo && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#17B5AE]/20 text-[#17B5AE] border border-[#17B5AE]/30">
                    PO #{existingPo.poNumber} ({existingPo.status})
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                {existingPo ? "Official Purchase Order Issued" : "Ready to Issue Purchase Order"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {existingPo
                  ? `Purchase Order ${existingPo.poNumber} was placed on ${new Date(
                      existingPo.placedAt
                    ).toLocaleDateString()} for ${existingPo.currency} ${existingPo.totalAmount.toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2 }
                    )}. Supplier status: ${existingPo.status}.`
                  : "You have accepted the quotation terms. Specify shipping address and billing contact to transmit a binding Purchase Order to the supplier."}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {existingPo ? (
                <Link
                  href={`/dashboard/orders/${existingPo.id}`}
                  className="px-6 py-3 rounded-xl bg-[#17B5AE] hover:bg-[#149f99] text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  View Purchase Order ({existingPo.poNumber}) →
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsPoModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-[#17B5AE] hover:bg-[#149f99] text-white font-bold text-xs shadow-lg hover:shadow-[#17B5AE]/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  Issue Purchase Order (PO) →
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Two-Column Specification & Supplier Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Product & Buyer Requirements */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <FlaskConical className="w-3.5 h-3.5 text-[#17B5AE]" />
                Chemical Specification & Sourcing Target
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {product?.name ?? "Specialty Chemical Raw Material"}
              </h2>
              {product?.casNumber && (
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  CAS: <span className="font-bold text-slate-800">{product.casNumber}</span>
                </p>
              )}
            </div>

            {product?.category && (
              <span className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                {product.category}
              </span>
            )}
          </div>

          {/* Technical Chemical Specs */}
          {product && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-semibold">Molecular Formula</span>
                <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                  {product.molecularFormula || "—"}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-semibold">Assay / Purity</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {product.purity ? `${product.purity}%` : "Standard"}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-semibold">Grade</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {product.grade || "Industrial"}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-semibold">Packaging</span>
                <span className="font-bold text-slate-900 mt-0.5 block truncate">
                  {product.packaging || "Drum / Tote"}
                </span>
              </div>
            </div>
          )}

          {/* Requirement Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
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
                Inquiry Date
              </span>
              <p className="text-sm font-bold text-slate-800 mt-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(rfq.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                RFQ ID Reference
              </span>
              <p className="text-xs font-mono font-bold text-slate-800 mt-2 truncate">
                {rfq.id}
              </p>
            </div>
          </div>

          {/* Buyer Message */}
          {rfq.message && (
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-700">Buyer Remarks / Specific Instructions:</span>
              <div className="mt-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {rfq.message}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Assigned Supplier Dossier */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Assigned Supplier
              </span>
              {supplier?.verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {supplier?.supplierName ?? `Supplier #${rfq.supplierId}`}
              </h3>
              {supplier?.countryName && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Origin: {supplier.countryName}
                </p>
              )}
            </div>

            {supplier ? (
              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Response Rate:</span>
                  <span className="font-bold text-slate-900">{supplier.responseRate}%</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Years in Business:</span>
                  <span className="font-bold text-slate-900">{supplier.yearsInBusiness} Years</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Standard Lead Time:</span>
                  <span className="font-bold text-slate-900">{supplier.leadTimeDays} Days</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">CoA / MSDS Compliance:</span>
                  <span className="font-bold text-emerald-700">Verified Available</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-100">
                Supplier Profile registered under ID #{rfq.supplierId}.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Link
              href={`/products/${rfq.productId}`}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <span>View Product in Catalog</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quotations & Multi-Version Decision Workspace */}
      <QuotationComparison
        quotations={quotations}
        rfqStatus={rfq.status}
        rfqId={rfq.id}
        onDecisionSuccess={loadRfqDetail}
      />

      {/* Procurement Lifecycle Timeline */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Audit & Compliance
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-0.5">
            Procurement Lifecycle Timeline
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Milestone 1: RFQ Submitted */}
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#17B5AE]" />
              <span className="text-xs font-bold text-slate-900">1. RFQ Submitted</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {new Date(rfq.createdAt).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-600 leading-tight">
              Inquiry dispatched to supplier with specification requirements.
            </p>
          </div>

          {/* Milestone 2: Supplier Engagement */}
          <div
            className={`p-4 rounded-xl border space-y-1.5 ${
              quotations.length > 0 || rfq.status !== "PENDING"
                ? "border-slate-100 bg-slate-50/70"
                : "border-dashed border-slate-200 bg-white opacity-60"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  quotations.length > 0 || rfq.status !== "PENDING"
                    ? "bg-[#17B5AE]"
                    : "bg-slate-300"
                }`}
              />
              <span className="text-xs font-bold text-slate-900">2. Supplier Review</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {quotations.length > 0 ? "Review Complete" : "In Progress"}
            </p>
            <p className="text-[11px] text-slate-600 leading-tight">
              {quotations.length > 0
                ? "Supplier analyzed specifications and prepared commercial terms."
                : "Awaiting supplier pricing evaluation."}
            </p>
          </div>

          {/* Milestone 3: Quotation Received */}
          <div
            className={`p-4 rounded-xl border space-y-1.5 ${
              quotations.length > 0
                ? "border-slate-100 bg-slate-50/70"
                : "border-dashed border-slate-200 bg-white opacity-60"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  quotations.length > 0 ? "bg-[#17B5AE]" : "bg-slate-300"
                }`}
              />
              <span className="text-xs font-bold text-slate-900">3. Commercial Quotation</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {quotations.length > 0
                ? `Version ${quotations[0].quotationVersion} Active`
                : "Pending Quote"}
            </p>
            <p className="text-[11px] text-slate-600 leading-tight">
              {quotations.length > 0
                ? `${quotations.length} revision(s) received with binding unit price & MOQ.`
                : "No quotation received yet."}
            </p>
          </div>

          {/* Milestone 4: Order Consensus */}
          <div
            className={`p-4 rounded-xl border space-y-1.5 ${
              rfq.status === "ACCEPTED"
                ? "border-emerald-200 bg-emerald-50/40"
                : rfq.status === "REJECTED"
                ? "border-rose-200 bg-rose-50/40"
                : "border-dashed border-slate-200 bg-white opacity-60"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  rfq.status === "ACCEPTED"
                    ? "bg-emerald-500"
                    : rfq.status === "REJECTED"
                    ? "bg-rose-500"
                    : "bg-slate-300"
                }`}
              />
              <span className="text-xs font-bold text-slate-900">4. Decision & PO</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {rfq.status === "ACCEPTED"
                ? existingPo
                  ? "PO Transmitted"
                  : "Consensus Reached"
                : rfq.status === "REJECTED"
                ? "Declined"
                : "Awaiting Decision"}
            </p>
            <p className="text-[11px] text-slate-600 leading-tight">
              {rfq.status === "ACCEPTED"
                ? existingPo
                  ? `PO ${existingPo.poNumber} locked into fulfillment schedule.`
                  : "Terms accepted. PO issuance enabled."
                : rfq.status === "REJECTED"
                ? "Proposal declined. Inquiry concluded."
                : "Pending buyer quotation evaluation."}
            </p>
          </div>
        </div>
      </section>

      {/* Issue PO Modal Dialog */}
      {rfq.status === "ACCEPTED" && quotations.length > 0 && (
        <IssuePoModal
          isOpen={isPoModalOpen}
          onClose={() => setIsPoModalOpen(false)}
          onSuccess={(newPo) => {
            setIsPoModalOpen(false);
            setExistingPo(newPo);
            loadRfqDetail();
            router.push(`/dashboard/orders/${newPo.id}`);
          }}
          rfqId={rfq.id}
          productName={product?.name ?? "Specialty Chemical Raw Material"}
          quantity={rfq.quantity}
          unit={rfq.unit}
          unitPrice={quotations[0].unitPrice}
          currency={quotations[0].currency}
          leadTimeDays={quotations[0].leadTimeDays}
        />
      )}
    </div>
  );
}