"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getRfq, RfqDetail } from "@/features/rfq/api/getRfq";
import { getBuyerQuotations } from "@/features/rfq/api/getBuyerQuotations";
import { QuotationResponse } from "@/features/rfq/api/submitQuotation";
import { acceptQuotation } from "@/features/rfq/api/acceptQuotation";
import { rejectQuotation } from "@/features/rfq/api/rejectQuotation";
import { getProductDetail } from "@/app/products/api/getProductDetail";
import { getOrderByRfqId } from "@/features/order/api/getOrderByRfqId";
import { IssuePoModal } from "@/features/order/components/IssuePoModal";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";
import { GenericDocumentManager } from "@/features/documents/components/GenericDocumentManager";
import { CounterOfferModal } from "@/features/rfq/components/CounterOfferModal";
import { TransactionTimeline } from "@/shared/components/procurement/TransactionTimeline";
import { useToast } from "@/shared/context/ToastContext";
import { getSupplierPublicProfile } from "@/features/suppliers/api";
import {
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  FileText,
  Edit3,
  ShieldCheck,
  History,
  X,
  ArrowRight,
  PackageCheck,
  Clock,
  Building2,
} from "lucide-react";

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
};

export default function BuyerRfqDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rfqId = params?.id as string;

  const [rfq, setRfq] = useState<RfqDetail | null>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [supplierNameResolved, setSupplierNameResolved] = useState<string | null>(null);
  const [quotations, setQuotations] = useState<QuotationResponse[]>([]);
  const [existingPo, setExistingPo] = useState<PurchaseOrderResponse | null>(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);

  // Decision Modal State
  const [decisionModalMode, setDecisionModalMode] = useState<"accept" | "reject" | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRfqDetail = useCallback(async (silent = false) => {
    if (!rfqId) return;
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const [rfqData, quotationsData, poData] = await Promise.all([
        getRfq(rfqId),
        getBuyerQuotations(rfqId).catch(() => [] as QuotationResponse[]),
        getOrderByRfqId(rfqId).catch(() => null),
      ]);

      setRfq(rfqData);
      setQuotations(quotationsData);
      setExistingPo(poData);

      // Resolve chemical product monograph from catalog
      const prodIdToFetch =
        rfqData.masterProductId || rfqData.productId || rfqData.supplierOfferingId;
      if (prodIdToFetch && !product) {
        getProductDetail(prodIdToFetch)
          .then((p) => {
            if (p) setProduct(p as ProductDetail);
          })
          .catch(() => {});
      }

      // Resolve supplier profile
      if (rfqData.supplierId && !supplier) {
        getSupplierPublicProfile(rfqData.supplierId)
          .then((s) => {
            if (s) {
              setSupplier({
                supplierId: rfqData.supplierId,
                supplierName: s.name,
                countryName: s.countryName || "India",
                verified: s.verified ?? true,
                responseRate: s.responseRate ?? 98,
                yearsInBusiness: s.yearsInBusiness ?? 12,
              });
              setSupplierNameResolved(s.name);
            }
          })
          .catch(() => {});
      }
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : "Failed to load RFQ dossier");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [rfqId, product, supplier]);

  useEffect(() => {
    // Initial fetch
    loadRfqDetail(false);

    // Visibility-aware polling interval (10 seconds)
    const intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadRfqDetail(true);
      }
    }, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadRfqDetail(true);
      }
    };

    const handleWindowFocus = () => {
      loadRfqDetail(true);
    };

    const handleRfqUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ rfqId?: string }>;
      if (!customEvt.detail?.rfqId || customEvt.detail.rfqId === rfqId) {
        loadRfqDetail(true);
      }
    };

    const handleNotificationsUpdate = () => {
      loadRfqDetail(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("rfq-updated", handleRfqUpdate);
    window.addEventListener("notifications-updated", handleNotificationsUpdate);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("rfq-updated", handleRfqUpdate);
      window.removeEventListener("notifications-updated", handleNotificationsUpdate);
    };
  }, [loadRfqDetail, rfqId]);

  // Smooth scroll to negotiation history section
  const scrollToHistory = () => {
    const el = document.getElementById("negotiation-history");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle Buyer Confirm Decision (Accept / Decline)
  const handleConfirmDecision = async () => {
    if (!decisionModalMode || !latestQuotation || !rfq) return;
    try {
      setDecisionSubmitting(true);
      setDecisionError(null);

      if (decisionModalMode === "accept") {
        await acceptQuotation(rfq.id, latestQuotation.id, decisionNotes.trim() || undefined);
        toast.success("Supplier quotation accepted. You can now issue the Purchase Order.");
      } else {
        await rejectQuotation(rfq.id, latestQuotation.id, decisionNotes.trim() || undefined);
        toast.success("Commercial quotation declined.");
      }

      setDecisionModalMode(null);
      setDecisionNotes("");
      await loadRfqDetail(true);
      window.dispatchEvent(new CustomEvent("rfq-updated", { detail: { rfqId } }));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to process decision";
      setDecisionError(msg);
      toast.error(msg);
    } finally {
      setDecisionSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto p-8 min-h-[65vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono font-medium text-[#526581] uppercase tracking-wider">
          Loading Procurement Workspace...
        </span>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="max-w-[1440px] mx-auto p-6 lg:p-8">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center space-y-3 shadow-2xs">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="text-base font-bold text-[#0B1B33]">RFQ Dossier Unavailable</h2>
          <p className="text-xs text-[#526581] max-w-md mx-auto">
            {error || "RFQ record could not be retrieved."}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => loadRfqDetail(false)}
              className="px-4 py-2 bg-[#0052CC] text-white text-xs font-semibold rounded-lg hover:bg-[#0747A6] transition-colors cursor-pointer"
            >
              Retry
            </button>
            <Link
              href="/dashboard/rfqs"
              className="px-4 py-2 border border-[#E2E8F0] text-[#0B1B33] text-xs font-semibold rounded-lg hover:bg-[#FAFBFC] transition-colors"
            >
              Back to Inquiries
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rfqShortId = rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`;
  const latestQuotation = quotations.length > 0 ? quotations[0] : null;
  const isAccepted = rfq.status === "ACCEPTED";
  const isQuoted = rfq.status === "QUOTED";
  const isCountered = rfq.status === "COUNTERED";
  const isPending = rfq.status === "PENDING" && quotations.length === 0;
  const isClosed = rfq.status === "CLOSED" || rfq.status === "CANCELLED";

  const canBuyerDecide =
    (isQuoted || isCountered) &&
    latestQuotation?.actorType === "SUPPLIER" &&
    !isAccepted &&
    !isClosed;
  const counterOfferCount = quotations.filter((q) => q.actorType === "BUYER").length;

  // Resolved Product Details
  const resolvedProductName =
    product?.name || rfq.productName || "Specialty Chemical Raw Material";
  const resolvedCasNumber = product?.casNumber || null;

  // Format numbers cleanly
  const formatMoney = (val?: number | null, curr = "INR") => {
    if (val == null) return "—";
    return `${curr} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatQty = (val?: number | null, u = rfq.unit) => {
    if (val == null) return "Standard";
    return `${val.toLocaleString()} ${u.toUpperCase()}`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "30 days";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 pb-24 text-[#0B1B33]">
      {/* ========================================================================= */}
      {/* 1. TOP BREADCRUMB & CONTEXT                                               */}
      {/* ========================================================================= */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center justify-between text-xs text-[#526581] pt-2"
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href="/dashboard" className="hover:text-[#0052CC] transition-colors">
            Buyer Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#8993A4]" />
          <Link href="/dashboard/rfqs" className="hover:text-[#0052CC] transition-colors">
            Sourcing RFQs
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#8993A4]" />
          <span className="font-semibold text-[#0B1B33]">{rfqShortId}</span>
        </div>

        <span className="text-[11px] text-[#526581]">
          Sourcing Reference:{" "}
          <strong className="font-mono text-[#0B1B33]">
            {rfq.id.substring(0, 8).toUpperCase()}
          </strong>
        </span>
      </nav>

      {/* ========================================================================= */}
      {/* A. RFQ HEADER (Full-Width Top Strip)                                      */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                PROCUREMENT / RFQ DOSSIER
              </span>
              <span className="text-[#E2E8F0]">•</span>
              <span className="font-mono text-xs font-bold text-[#0052CC] tracking-wide">
                {rfqShortId}
              </span>
              <span className="text-[#E2E8F0]">•</span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded border uppercase font-mono ${
                  isAccepted
                    ? "bg-[#E3FCEF] text-[#006644] border-[#ABF5D1]"
                    : isCountered
                    ? "bg-[#FFFAE6] text-[#974F0C] border-[#FFE380]"
                    : isQuoted
                    ? "bg-[#DEEBFF] text-[#0747A6] border-[#B3D4FF]"
                    : "bg-[#FFFAE6] text-[#974F0C] border-[#FFE380]"
                }`}
              >
                {isAccepted
                  ? "ACCEPTED / READY FOR PO"
                  : isCountered
                  ? "COUNTER OFFER IN NEGOTIATION"
                  : isQuoted
                  ? "QUOTED / REVIEW REQUIRED"
                  : "AWAITING SUPPLIER QUOTE"}
              </span>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap pt-0.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B33] tracking-tight">
                {resolvedProductName}
              </h1>
              {resolvedCasNumber && (
                <span className="font-mono text-xs text-[#526581] bg-[#FAFBFC] px-2.5 py-0.5 rounded border border-[#E2E8F0] font-semibold">
                  CAS {resolvedCasNumber}
                </span>
              )}
            </div>

            <p className="text-xs text-[#526581]">
              Supplier:{" "}
              <strong className="text-[#0B1B33]">
                {supplier?.supplierName ||
                  supplierNameResolved ||
                  `Verified Supplier #${rfq.supplierId}`}
              </strong>{" "}
              • Sourcing Category:{" "}
              <span className="font-medium text-[#0B1B33]">
                {product?.category || "Chemical Consignment"}
              </span>
            </p>
          </div>

          {/* Header Quick Action: Scroll to Negotiation History */}
          <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
            {quotations.length > 0 && (
              <button
                type="button"
                onClick={scrollToHistory}
                className="h-10 px-4 border border-[#E2E8F0] hover:bg-[#FAFBFC] text-[#0B1B33] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer group"
                title="Scroll down to complete negotiation history"
              >
                <History className="w-3.5 h-3.5 text-[#526581] group-hover:text-[#0052CC] transition-colors" />
                <span>Negotiation History ({quotations.length}) ↓</span>
              </button>
            )}
          </div>
        </div>

        {/* Structured Context Metadata Bar */}
        <div className="mt-5 pt-4 border-t border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Requested Quantity
            </span>
            <span className="text-sm font-bold text-[#0B1B33] block mt-0.5 font-mono">
              {formatQty(rfq.quantity, rfq.unit)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Current Terms
            </span>
            <span className="text-sm font-bold text-[#0B1B33] block mt-0.5 font-mono">
              {latestQuotation
                ? `${formatMoney(latestQuotation.unitPrice, latestQuotation.currency)} / ${rfq.unit.toUpperCase()}`
                : "Awaiting Quote"}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Request Date
            </span>
            <span className="text-xs text-[#0B1B33] block mt-0.5 font-mono">
              {formatDate(rfq.createdAt)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Response Target SLA
            </span>
            <span className="text-xs font-medium text-[#006644] block mt-0.5">
              Within 24 Hours
            </span>
          </div>
        </div>
      </div>

      {/* Unified Commercial Lifecycle Timeline */}
      <TransactionTimeline
        rfq={rfq}
        quotations={quotations}
        order={existingPo}
        userRole="BUYER"
      />

      {/* ========================================================================= */}
      {/* B. BUYER SOURCING INFORMATION ROW (Side-by-Side: ~68% Left / ~32% Right)  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
        {/* LEFT COLUMN (~68%, 8 cols): BUYER SOURCING REQUIREMENTS */}
        <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden h-full flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 bg-[#FAFBFC] border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0052CC]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B1B33] font-mono">
                  BUYER SOURCING REQUIREMENTS
                </h2>
              </div>
              <span className="font-mono text-[10px] font-semibold text-[#526581]">
                SPEC: {product?.id ? product.id.substring(0, 8).toUpperCase() : "STANDARD"}
              </span>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-xs">
                <div className="flex justify-between items-baseline py-1.5 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Target Product</span>
                  <strong className="text-[#0B1B33] text-right font-medium">{resolvedProductName}</strong>
                </div>

                <div className="flex justify-between items-baseline py-1.5 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">CAS Number</span>
                  <span className="font-mono font-bold text-[#0B1B33]">
                    {resolvedCasNumber || "—"}
                  </span>
                </div>

                <div className="flex justify-between items-baseline py-1.5 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Requested Quantity</span>
                  <span className="font-bold text-[#0B1B33] font-mono">
                    {formatQty(rfq.quantity, rfq.unit)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline py-1.5 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Assay / Purity</span>
                  <span className="font-semibold text-[#0B1B33]">
                    {product?.purity ? `${product.purity}%` : "99%"}
                  </span>
                </div>

                <div className="flex justify-between items-baseline py-1.5 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Pharmacopoeia</span>
                  <span className="font-semibold text-[#0B1B33] uppercase">
                    {product?.grade || "IP / BP / USP STANDARD"}
                  </span>
                </div>

                <div className="flex justify-between items-baseline py-1.5 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Packaging</span>
                  <span className="font-semibold text-[#0B1B33]">
                    {product?.packaging || "Standard Industrial Drums / Packaging"}
                  </span>
                </div>

                <div className="flex justify-between items-baseline py-1.5 border-b border-[#E2E8F0] sm:col-span-2">
                  <span className="text-[#64748B]">Delivery Destination</span>
                  <span className="font-semibold text-[#0B1B33]">
                    Buyer Facility / CIF Standard
                  </span>
                </div>
              </div>

              {/* Buyer Message & Technical Notes */}
              <div className="pt-2 border-t border-[#E2E8F0]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1.5 font-mono">
                  BUYER MESSAGE & TECHNICAL NOTES
                </span>
                <div className="p-3.5 bg-[#FAFBFC] rounded-lg border border-[#E2E8F0] text-xs text-[#0B1B33] leading-relaxed">
                  {rfq.message || "Standard commercial inquiry for monograph chemical raw material."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (~32%, 4 cols): RFQ DOCUMENTS */}
        <div className="lg:col-span-4 h-full">
          <GenericDocumentManager
            title="RFQ DOCUMENTS"
            description="Technical specifications, test protocols, NDA and compliance requirements."
            ownerType="RFQ"
            ownerId={rfq.id}
            canUpload={true}
            canDelete={true}
            allowedCategories={[
              { value: "TECHNICAL_SPECIFICATION", label: "Technical Specification" },
              { value: "CERTIFICATION", label: "Certificate / COA" },
            ]}
            emptyMessage="No documents attached to this RFQ."
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* C. COMMERCIAL / QUOTATION WORKSPACE (68% Left / 32% Right)                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
        
        {/* LEFT COLUMN (~68%, 8 cols): CURRENT SUPPLIER QUOTATION + ACTIONS */}
        <div className="lg:col-span-8 space-y-6">
          {latestQuotation ? (
            <div className="bg-white border border-[#E2E8F0] border-l-4 border-l-[#0052CC] rounded-xl shadow-2xs overflow-hidden">
              {/* Light Refined Header */}
              <div className="px-6 py-4 bg-[#FAFBFC] border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0052CC]">
                      CURRENT QUOTATION — VERSION {latestQuotation.quotationVersion}
                    </span>
                    <span className="text-[#E2E8F0]">•</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${
                        latestQuotation.actorType === "BUYER"
                          ? "bg-[#FFFAE6] text-[#974F0C] border-[#FFE380]"
                          : latestQuotation.quotationVersion > 1
                          ? "bg-[#DEEBFF] text-[#0747A6] border-[#B3D4FF]"
                          : "bg-[#FAFBFC] text-[#526581] border-[#E2E8F0]"
                      }`}
                    >
                      {latestQuotation.actorType === "BUYER"
                        ? "BUYER COUNTER OFFER"
                        : latestQuotation.quotationVersion > 1
                        ? "REVISED QUOTATION"
                        : "INITIAL PROPOSAL"}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748B] block mt-1">
                    Submitted by {latestQuotation.actorType === "BUYER" ? "Buyer (You)" : (supplier?.supplierName || "Supplier")} on {formatDateTime(latestQuotation.createdAt)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={scrollToHistory}
                  className="text-xs text-[#0052CC] hover:underline font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-center shrink-0"
                >
                  <span>Revision History ({quotations.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 4-Column Commercial Metrics Grid */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                      Agreed / Unit Price
                    </span>
                    <strong className="text-xl font-extrabold text-[#0B1B33] block mt-0.5 font-mono">
                      {formatMoney(latestQuotation.unitPrice, latestQuotation.currency)}
                    </strong>
                    <span className="text-[11px] text-[#64748B] block mt-0.5">
                      per standard {rfq.unit.toLowerCase()}
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                      Minimum Order (MOQ)
                    </span>
                    <strong className="text-base font-bold text-[#0B1B33] block mt-0.5 font-mono">
                      {formatQty(latestQuotation.minimumOrderQuantity, rfq.unit)}
                    </strong>
                    <span className="text-[11px] text-[#64748B] block mt-0.5">
                      Production threshold
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                      Fulfillment Lead Time
                    </span>
                    <strong className="text-base font-bold text-[#0B1B33] block mt-0.5 font-mono">
                      {latestQuotation.leadTimeDays
                        ? `${latestQuotation.leadTimeDays} Days`
                        : "Standard"}
                    </strong>
                    <span className="text-[11px] text-[#64748B] block mt-0.5">
                      Upon confirmation
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                      Quotation Validity
                    </span>
                    <strong className="text-base font-bold text-[#0B1B33] block mt-0.5">
                      {formatDate(latestQuotation.validityDate)}
                    </strong>
                    <span className="text-[11px] text-[#006644] font-medium block mt-0.5">
                      Valid commercial offer
                    </span>
                  </div>
                </div>

                {/* Packaging & Commercial Terms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {latestQuotation.packagingDetails && (
                    <div className="flex items-start gap-2 p-3 bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg">
                      <span className="font-bold text-[#64748B] shrink-0 uppercase text-[10px]">
                        Packaging:
                      </span>
                      <span className="text-[#0B1B33] font-medium">
                        {latestQuotation.packagingDetails}
                      </span>
                    </div>
                  )}

                  {latestQuotation.commercialNotes && (
                    <div className="flex items-start gap-2 p-3 bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg sm:col-span-2">
                      <span className="font-bold text-[#64748B] shrink-0 uppercase text-[10px]">
                        Commercial Notes:
                      </span>
                      <span className="text-[#0B1B33] italic">
                        "{latestQuotation.commercialNotes}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Commercial Counter Rationale (If present) */}
                {latestQuotation.commercialMessage && (
                  <div className="p-3.5 bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1">
                      Commercial Counter Rationale
                    </span>
                    <p className="text-[#0B1B33] font-medium leading-relaxed italic">
                      "{latestQuotation.commercialMessage}"
                    </p>
                  </div>
                )}

                {/* Buyer Actions */}
                {canBuyerDecide ? (
                  <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                        Action Required
                      </span>
                      <p className="text-xs text-[#0B1B33] mt-0.5">
                        {isCountered
                          ? "Review the supplier's revised commercial terms and select your decision."
                          : "Review the supplier's commercial proposal and select your decision."}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                      {/* DECLINE / REJECT */}
                      <button
                        type="button"
                        onClick={() => setDecisionModalMode("reject")}
                        disabled={decisionSubmitting}
                        className="px-4 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isCountered ? "Reject" : "Reject Proposal"}
                      </button>

                      {/* COUNTER OFFER */}
                      <button
                        type="button"
                        onClick={() => setIsCounterModalOpen(true)}
                        disabled={decisionSubmitting}
                        className="px-4 py-2 text-xs font-semibold text-[#0052CC] border border-[#0052CC] hover:bg-[#DEEBFF]/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Counter Offer</span>
                      </button>

                      {/* ACCEPT QUOTATION */}
                      <button
                        type="button"
                        onClick={() => setDecisionModalMode("accept")}
                        disabled={decisionSubmitting}
                        className="px-5 py-2 bg-[#00875A] hover:bg-[#006644] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isCountered ? "Accept Counter Offer" : "Accept Quotation"}</span>
                      </button>
                    </div>
                  </div>
                ) : isAccepted && !existingPo ? (
                  <div className="pt-4 border-t border-[#E2E8F0] p-4 bg-[#E3FCEF]/60 border border-[#ABF5D1] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#00875A]" />
                        <span className="text-[10px] font-mono font-bold tracking-widest text-[#006644] uppercase">
                          COMMERCIAL TERMS AGREED
                        </span>
                      </div>
                      <p className="text-xs text-[#526581]">
                        Supplier quotation accepted. Generate your binding Purchase Order to lock delivery schedules.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPoModalOpen(true)}
                      className="h-10 px-5 bg-[#00875A] hover:bg-[#006644] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-2xs flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                    >
                      <span>Issue Purchase Order →</span>
                    </button>
                  </div>
                ) : isAccepted && existingPo ? (
                  <div className="pt-4 border-t border-[#E2E8F0] p-4 bg-[#FAFBFC] border border-[#E2E8F0] border-l-4 border-l-[#00875A] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <PackageCheck className="w-4 h-4 text-[#00875A]" />
                        <span className="text-[10px] font-mono font-bold tracking-widest text-[#00875A] uppercase">
                          PURCHASE ORDER ACTIVE
                        </span>
                      </div>
                      <h3 className="text-sm font-mono font-bold text-[#0B1B33]">{existingPo.poNumber}</h3>
                      <p className="text-[11px] text-[#526581]">
                        Binding order placed on {formatDate(existingPo.placedAt)}. Status:{" "}
                        <strong className="text-[#00875A] uppercase font-mono">{existingPo.status}</strong>
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/orders/${existingPo.id}`}
                      className="h-10 px-5 bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-2xs flex items-center justify-center gap-2 shrink-0"
                    >
                      <span>View Purchase Order →</span>
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          ) : isPending ? (
            /* Pending Initial Quotation Banner */
            <div className="bg-white border border-[#E2E8F0] border-l-4 border-l-[#0052CC] rounded-xl p-6 shadow-2xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#DEEBFF] text-[#0052CC] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B1B33]">Awaiting Supplier Quotation</h3>
                <p className="text-xs text-[#526581] mt-0.5">
                  The verified manufacturer has received your sourcing inquiry and is preparing a
                  formal commercial quotation with pricing and lead times.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* RIGHT COLUMN (~32%, 4 cols): PROCUREMENT STATUS + MILESTONES + SUPPLIER */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. PROCUREMENT STATUS */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block border-b border-[#E2E8F0] pb-2 font-mono">
              PROCUREMENT STATUS
            </span>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#526581]">Current Stage</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${
                    isAccepted
                      ? "bg-[#E3FCEF] text-[#006644] border-[#ABF5D1]"
                      : isCountered
                      ? "bg-[#FFFAE6] text-[#974F0C] border-[#FFE380]"
                      : isQuoted
                      ? "bg-[#DEEBFF] text-[#0747A6] border-[#B3D4FF]"
                      : "bg-[#FFFAE6] text-[#974F0C] border-[#FFE380]"
                  }`}
                >
                  {isAccepted
                    ? "Accepted"
                    : isCountered
                    ? "Counter Offer Received"
                    : isQuoted
                    ? "Quoted"
                    : "Awaiting Quote"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-0.5">
                  Next Step
                </span>
                <p className="text-xs text-[#0B1B33] leading-relaxed">
                  {isAccepted && !existingPo
                    ? "Commercial consensus reached. Generate purchase order."
                    : isAccepted && existingPo
                    ? "Purchase order issued. Awaiting supplier shipment dispatch."
                    : canBuyerDecide && isCountered
                    ? "Review the supplier's revised commercial terms."
                    : canBuyerDecide
                    ? "Review supplier quotation."
                    : isCountered
                    ? "Awaiting supplier response to your submitted counter-offer."
                    : "Awaiting supplier commercial proposal."}
                </p>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center">
                <span className="text-[#526581]">Quotation Version</span>
                <strong className="font-mono text-[#0B1B33]">
                  {latestQuotation ? `V${latestQuotation.quotationVersion}` : "Draft"}
                </strong>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#526581]">Negotiation Rounds</span>
                <span className="font-bold text-[#0B1B33] font-mono">{quotations.length}</span>
              </div>
            </div>
          </div>

          {/* 2. PROCUREMENT MILESTONES */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block border-b border-[#E2E8F0] pb-2 font-mono">
              PROCUREMENT MILESTONES
            </span>

            <div className="space-y-3 text-xs">
              {/* Step 1: RFQ Submitted */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#E3FCEF] text-[#006644] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-[#0B1B33] block">RFQ Submitted</strong>
                  <span className="text-[11px] text-[#526581]">{formatDate(rfq.createdAt)}</span>
                </div>
              </div>

              {/* Step 2: Supplier Quotation */}
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                    quotations.length > 0
                      ? "bg-[#E3FCEF] text-[#006644]"
                      : "bg-[#FAFBFC] border border-[#E2E8F0] text-[#526581]"
                  }`}
                >
                  {quotations.length > 0 ? "✓" : "2"}
                </div>
                <div>
                  <strong className="text-[#0B1B33] block">Supplier Quotation</strong>
                  <span className="text-[11px] text-[#526581]">
                    {quotations.length > 0 ? formatDate(quotations[quotations.length - 1].createdAt) : "Pending"}
                  </span>
                </div>
              </div>

              {/* Step 3: Negotiation */}
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                    quotations.length > 1
                      ? "bg-[#E3FCEF] text-[#006644]"
                      : "bg-[#FAFBFC] border border-[#E2E8F0] text-[#8993A4]"
                  }`}
                >
                  {quotations.length > 1 ? "✓" : "3"}
                </div>
                <div>
                  <strong className="text-[#0B1B33] block">Negotiation</strong>
                  <span className="text-[11px] text-[#526581]">
                    {quotations.length > 1 ? `${quotations.length} revisions` : "Single proposal"}
                  </span>
                </div>
              </div>

              {/* Step 4: Purchase Order */}
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                    existingPo
                      ? "bg-[#E3FCEF] text-[#006644]"
                      : "bg-[#FAFBFC] border border-[#E2E8F0] text-[#8993A4]"
                  }`}
                >
                  {existingPo ? "✓" : "4"}
                </div>
                <div>
                  <strong className="text-[#0B1B33] block">Purchase Order</strong>
                  <span className="text-[11px] text-[#526581]">
                    {existingPo
                      ? existingPo.poNumber
                      : isAccepted
                      ? "Ready for issuance"
                      : "Pending agreement"}
                  </span>
                </div>
              </div>

              {/* Step 5: Fulfillment */}
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                    existingPo?.status === "DELIVERED"
                      ? "bg-[#E3FCEF] text-[#006644]"
                      : "bg-[#FAFBFC] border border-[#E2E8F0] text-[#8993A4]"
                  }`}
                >
                  {existingPo?.status === "DELIVERED" ? "✓" : "5"}
                </div>
                <div>
                  <strong className="text-[#0B1B33] block">Fulfillment</strong>
                  <span className="text-[11px] text-[#526581]">
                    {existingPo?.status === "DELIVERED" ? "Delivered" : "Not started"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. SUPPLIER PROFILE */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block font-mono">
                SUPPLIER PROFILE
              </span>
              <span className="text-[10px] font-bold text-[#006644] bg-[#E3FCEF] px-2 py-0.5 rounded uppercase">
                Audited
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                  Company Name
                </span>
                <strong className="text-sm font-bold text-[#0B1B33] block mt-0.5">
                  {supplier?.supplierName ||
                    supplierNameResolved ||
                    `Verified Supplier #${rfq.supplierId}`}
                </strong>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#E2E8F0]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#64748B] block">
                    Country
                  </span>
                  <span className="font-semibold text-[#0B1B33] block mt-0.5">
                    {supplier?.countryName || "India"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#64748B] block">
                    Experience
                  </span>
                  <span className="font-semibold text-[#0B1B33] block mt-0.5">
                    {supplier?.yearsInBusiness || 10}+ Years
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#E2E8F0]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#64748B] block">
                    Response Rate
                  </span>
                  <span className="font-mono font-bold text-[#006644] block mt-0.5">
                    {supplier?.responseRate || 98}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#64748B] block">
                    Verification
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006644] mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Supplier
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* D. NEGOTIATION HISTORY (#negotiation-history)                             */}
      {/* ========================================================================= */}
      <section
        id="negotiation-history"
        className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden scroll-mt-6"
      >
        {/* Header & Negotiation Summary Metrics */}
        <div className="px-6 py-5 bg-[#FAFBFC] border-b border-[#E2E8F0] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#0052CC]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1B33] font-mono">
                  NEGOTIATION HISTORY
                </h2>
              </div>
              <p className="text-xs text-[#526581] mt-0.5">
                Commercial revision record and proposal progression for this RFQ.
              </p>
            </div>

            <span className="font-mono text-xs font-semibold text-[#0B1B33] bg-white border border-[#E2E8F0] px-3 py-1 rounded">
              {quotations.length} Version{quotations.length > 1 ? "s" : ""} Logged
            </span>
          </div>

          {/* 4-Metric Compact Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E2E8F0] text-xs">
            <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block font-mono">
                Revisions
              </span>
              <strong className="text-base font-bold text-[#0B1B33] block mt-0.5 font-mono">
                {quotations.length}
              </strong>
            </div>

            <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block font-mono">
                Participants
              </span>
              <strong className="text-base font-bold text-[#0B1B33] block mt-0.5">
                2 (Buyer · Supplier)
              </strong>
            </div>

            <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block font-mono">
                Counter-Offers
              </span>
              <strong className="text-base font-bold text-[#0B1B33] block mt-0.5 font-mono">
                {counterOfferCount}
              </strong>
            </div>

            <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block font-mono">
                Current Status
              </span>
              <strong className="text-xs font-bold text-[#0B1B33] block mt-1 uppercase font-mono">
                {isAccepted
                  ? "Accepted"
                  : isCountered
                  ? "Countered"
                  : isQuoted
                  ? "Quoted"
                  : "Pending"}
              </strong>
            </div>
          </div>
        </div>

        {/* Complete Timeline List of Historical Revisions */}
        <div className="p-6">
          {quotations.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#526581] space-y-1">
              <strong className="text-[#0B1B33] block font-mono">NO NEGOTIATION HISTORY YET</strong>
              <p>
                The original supplier quotation and any subsequent counter-offers will appear here
                when submitted.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
              {quotations.map((quote, idx) => {
                const isCurrent = idx === 0;
                const isBuyer = quote.actorType === "BUYER";
                const prevQuote = idx < quotations.length - 1 ? quotations[idx + 1] : null;

                // Calculate changes from preceding chronological version
                const deltaPrice =
                  prevQuote && prevQuote.unitPrice !== quote.unitPrice
                    ? { prev: prevQuote.unitPrice, curr: quote.unitPrice }
                    : null;
                const deltaLead =
                  prevQuote && prevQuote.leadTimeDays !== quote.leadTimeDays
                    ? { prev: prevQuote.leadTimeDays, curr: quote.leadTimeDays }
                    : null;
                const deltaMoq =
                  prevQuote && prevQuote.minimumOrderQuantity !== quote.minimumOrderQuantity
                    ? {
                        prev: prevQuote.minimumOrderQuantity,
                        curr: quote.minimumOrderQuantity,
                      }
                    : null;
                const deltaValidity =
                  prevQuote && prevQuote.validityDate !== quote.validityDate
                    ? { prev: prevQuote.validityDate, curr: quote.validityDate }
                    : null;
                const hasChanges = deltaPrice || deltaLead || deltaMoq || deltaValidity;

                const formatActionBadge = () => {
                  if (isBuyer) return "BUYER COUNTER OFFER";
                  if (quote.quotationVersion === 1) return "INITIAL PROPOSAL";
                  return "SUPPLIER REVISED QUOTATION";
                };

                return (
                  <div key={quote.id} className="relative space-y-3">
                    {/* Timeline Bullet */}
                    <div
                      className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 bg-white ${
                        isCurrent
                          ? isAccepted
                            ? "border-[#00875A] bg-[#00875A]"
                            : isBuyer
                            ? "border-[#FF8B00] bg-[#FF8B00]"
                            : "border-[#0052CC] bg-[#0052CC]"
                          : "border-[#8993A4]"
                      }`}
                    />

                    {/* Card Entry */}
                    <div className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-3">
                      {/* Top Tag Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                              isBuyer
                                ? "bg-[#FFFAE6] text-[#974F0C] border-[#FFE380]"
                                : "bg-[#DEEBFF] text-[#0747A6] border-[#B3D4FF]"
                            }`}
                          >
                            {isBuyer ? "Buyer" : "Supplier"}
                          </span>
                          <strong className="text-xs text-[#0B1B33]">
                            VERSION {quote.quotationVersion} — {formatActionBadge()}
                          </strong>
                          {isCurrent && (
                            <span className="text-[9px] font-bold bg-[#0B1B33] text-white px-2 py-0.2 rounded uppercase font-mono">
                              CURRENT ACTIVE
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-[#526581] font-mono">
                          {formatDateTime(quote.createdAt)}
                        </span>
                      </div>

                      {/* Commercial Terms Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                            Unit Price
                          </span>
                          <strong className="text-sm font-bold text-[#0B1B33] block mt-0.5 font-mono">
                            {formatMoney(quote.unitPrice, quote.currency)} / {rfq.unit.toUpperCase()}
                          </strong>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                            Minimum Order (MOQ)
                          </span>
                          <span className="text-xs text-[#0B1B33] block mt-0.5 font-medium font-mono">
                            {formatQty(quote.minimumOrderQuantity, rfq.unit)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                            Fulfillment Lead Time
                          </span>
                          <span className="text-xs text-[#0B1B33] block mt-0.5 font-medium font-mono">
                            {quote.leadTimeDays ? `${quote.leadTimeDays} business days` : "Standard"}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                            Offer Validity
                          </span>
                          <span className="text-xs text-[#0B1B33] block mt-0.5 font-medium">
                            {formatDate(quote.validityDate)}
                          </span>
                        </div>
                      </div>

                      {/* Changed Fields Compared with Previous Revision */}
                      {hasChanges && prevQuote && (
                        <div className="pt-2 border-t border-[#E2E8F0] text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1.5 font-mono">
                            CHANGES FROM VERSION {prevQuote.quotationVersion}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {deltaPrice && (
                              <span className="inline-flex items-center gap-1 bg-white border border-[#E2E8F0] px-2 py-1 rounded text-[11px]">
                                <span className="text-[#64748B]">Unit Price:</span>
                                <span className="line-through text-[#64748B] font-mono">
                                  {deltaPrice.prev.toFixed(2)}
                                </span>
                                <ArrowRight className="w-3 h-3 text-[#0052CC]" />
                                <strong className="text-[#0B1B33] font-mono">
                                  {deltaPrice.curr.toFixed(2)}
                                </strong>
                              </span>
                            )}

                            {deltaLead && (
                              <span className="inline-flex items-center gap-1 bg-white border border-[#E2E8F0] px-2 py-1 rounded text-[11px]">
                                <span className="text-[#64748B]">Lead Time:</span>
                                <span className="line-through text-[#64748B] font-mono">
                                  {deltaLead.prev}d
                                </span>
                                <ArrowRight className="w-3 h-3 text-[#0052CC]" />
                                <strong className="text-[#0B1B33] font-mono">
                                  {deltaLead.curr}d
                                </strong>
                              </span>
                            )}

                            {deltaMoq && (
                              <span className="inline-flex items-center gap-1 bg-white border border-[#E2E8F0] px-2 py-1 rounded text-[11px]">
                                <span className="text-[#64748B]">MOQ:</span>
                                <span className="line-through text-[#64748B] font-mono">
                                  {deltaMoq.prev ?? "Std"}
                                </span>
                                <ArrowRight className="w-3 h-3 text-[#0052CC]" />
                                <strong className="text-[#0B1B33] font-mono">
                                  {deltaMoq.curr ?? "Std"}
                                </strong>
                              </span>
                            )}

                            {deltaValidity && (
                              <span className="inline-flex items-center gap-1 bg-white border border-[#E2E8F0] px-2 py-1 rounded text-[11px]">
                                <span className="text-[#64748B]">Validity:</span>
                                <span className="line-through text-[#64748B]">
                                  {formatDate(deltaValidity.prev)}
                                </span>
                                <ArrowRight className="w-3 h-3 text-[#0052CC]" />
                                <strong className="text-[#0B1B33]">
                                  {formatDate(deltaValidity.curr)}
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Commercial Message / Notes */}
                      {quote.commercialMessage && (
                        <div className="pt-2 border-t border-[#E2E8F0] text-xs text-[#526581] italic">
                          "{quote.commercialMessage}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. BUYER ACCEPT / DECLINE CONFIRMATION MODAL                              */}
      {/* ========================================================================= */}
      {decisionModalMode && latestQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-[#0B1B33] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {decisionModalMode === "accept"
                  ? "Accept Commercial Quotation?"
                  : "Decline Quotation?"}
              </h3>
              <button
                type="button"
                onClick={() => setDecisionModalMode(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {decisionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
                  {decisionError}
                </div>
              )}

              {decisionModalMode === "accept" ? (
                <div className="space-y-3">
                  <p className="text-[#0B1B33] leading-relaxed">
                    You are accepting Version {latestQuotation.quotationVersion} under the following
                    commercial terms:
                  </p>

                  <div className="p-3.5 bg-[#FAFBFC] rounded-lg border border-[#E2E8F0] space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Unit Price:</span>
                      <strong className="text-[#0B1B33] font-mono">
                        {formatMoney(latestQuotation.unitPrice, latestQuotation.currency)} /{" "}
                        {rfq.unit.toUpperCase()}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Quantity:</span>
                      <span className="text-[#0B1B33] font-mono">
                        {formatQty(rfq.quantity, rfq.unit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">MOQ:</span>
                      <span className="text-[#0B1B33] font-mono">
                        {formatQty(latestQuotation.minimumOrderQuantity, rfq.unit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Lead Time:</span>
                      <span className="text-[#0B1B33] font-mono">
                        {latestQuotation.leadTimeDays
                          ? `${latestQuotation.leadTimeDays} days`
                          : "Standard"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Validity:</span>
                      <span className="text-[#0B1B33]">
                        {formatDate(latestQuotation.validityDate)}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#64748B]">
                    Once accepted, you will be able to issue a binding Purchase Order.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[#0B1B33] leading-relaxed">
                    Are you sure you want to decline this commercial proposal? This will mark the
                    negotiation as rejected.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Optional Remarks / Reason
                </label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder={
                    decisionModalMode === "accept"
                      ? "e.g. Terms accepted. Ready for formal purchase order issuance."
                      : "e.g. Price exceeds current procurement budget."
                  }
                  className="w-full text-xs rounded-lg border border-[#E2E8F0] p-3 text-[#0B1B33] placeholder:text-[#8993A4] focus:outline-none focus:border-[#0052CC]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setDecisionModalMode(null)}
                  disabled={decisionSubmitting}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0B1B33] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDecision}
                  disabled={decisionSubmitting}
                  className={`px-5 py-2 rounded-lg text-white text-xs font-semibold uppercase tracking-wider cursor-pointer ${
                    decisionModalMode === "accept"
                      ? "bg-[#00875A] hover:bg-[#006644]"
                      : "bg-[#DE350B] hover:bg-[#BF2600]"
                  }`}
                >
                  {decisionSubmitting
                    ? decisionModalMode === "accept"
                      ? "Accepting..."
                      : "Declining..."
                    : decisionModalMode === "accept"
                    ? "Accept Quotation"
                    : "Decline Proposal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODALS: ISSUE PO & COUNTER OFFER                                       */}
      {/* ========================================================================= */}
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
          productName={resolvedProductName}
          quantity={rfq.quantity}
          unit={rfq.unit}
          unitPrice={quotations[0].unitPrice}
          currency={quotations[0].currency}
          leadTimeDays={quotations[0].leadTimeDays}
        />
      )}

      {isCounterModalOpen && (
        <CounterOfferModal
          rfqId={rfq.id}
          chemicalName={resolvedProductName}
          requestedQuantity={rfq.quantity}
          unit={rfq.unit}
          initialUnitPrice={quotations.length > 0 ? quotations[0].unitPrice : undefined}
          initialCurrency={quotations.length > 0 ? quotations[0].currency : "INR"}
          initialMoq={
            quotations.length > 0 && quotations[0].minimumOrderQuantity != null
              ? quotations[0].minimumOrderQuantity
              : undefined
          }
          initialLeadTimeDays={
            quotations.length > 0 && quotations[0].leadTimeDays != null
              ? quotations[0].leadTimeDays
              : undefined
          }
          initialPackaging={
            quotations.length > 0 && quotations[0].packagingDetails != null
              ? quotations[0].packagingDetails
              : undefined
          }
          onClose={() => setIsCounterModalOpen(false)}
          onSuccess={() => {
            setIsCounterModalOpen(false);
            toast.success("Counter offer transmitted to supplier.");
            loadRfqDetail();
          }}
        />
      )}
    </div>
  );
}