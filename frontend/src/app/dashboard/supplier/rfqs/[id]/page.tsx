"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSupplierRfqs, SupplierRfq } from "@/features/rfq/api/getSupplierRfqs";
import { getSupplierQuotations } from "@/features/rfq/api/getSupplierQuotations";
import { acceptSupplierCounterOffer } from "@/features/rfq/api/acceptSupplierCounterOffer";
import { rejectSupplierCounterOffer } from "@/features/rfq/api/rejectSupplierCounterOffer";
import { getProductDetail } from "@/app/products/api/getProductDetail";
import { QuotationForm } from "@/features/rfq/components/QuotationForm";
import { QuotationResponse } from "@/features/rfq/api/submitQuotation";
import { getOrderByRfqId } from "@/features/order/api/getOrderByRfqId";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";
import { GenericDocumentManager } from "@/features/documents/components/GenericDocumentManager";
import { useToast } from "@/shared/context/ToastContext";
import {
  ChevronRight,
  Send,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Edit3,
  ShieldCheck,
  History,
  X,
  ArrowRight,
  PackageCheck,
} from "lucide-react";

type ProductDetail = {
  id: string;
  name: string;
  category: string;
  casNumber: string;
  molecularFormula: string;
  purity: number;
  grade: string;
  price: number;
  moqKg: number;
  packaging: string;
  productCode?: string;
};

export default function SupplierRfqDetailPage() {
  const params = useParams();
  const rfqId = params?.id as string;

  const [rfq, setRfq] = useState<SupplierRfq | null>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [quotations, setQuotations] = useState<QuotationResponse[]>([]);
  const [existingPo, setExistingPo] = useState<PurchaseOrderResponse | null>(null);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Decision Modal State
  const [decisionModalMode, setDecisionModalMode] = useState<"accept" | "reject" | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const toast = useToast();

  const loadRfq = useCallback(async (silent = false) => {
    if (!rfqId) return;
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const [rfqs, quotes, poData] = await Promise.all([
        getSupplierRfqs(),
        getSupplierQuotations(rfqId).catch(() => [] as QuotationResponse[]),
        getOrderByRfqId(rfqId).catch(() => null),
      ]);

      const matching = rfqs.find((r) => r.id === rfqId);

      if (!matching) {
        throw new Error("Sourcing inquiry not found or unauthorized access.");
      }

      setRfq(matching);
      setQuotations(quotes || []);
      setExistingPo(poData);

      // Fetch product monograph details if not already loaded
      const prodId = matching.masterProductId || matching.productId;
      if (prodId && !product) {
        getProductDetail(prodId)
          .then((p) => {
            if (p) setProduct(p as ProductDetail);
          })
          .catch(() => {});
      }
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : "Failed to load RFQ");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [rfqId, product]);

  useEffect(() => {
    // Initial fetch
    loadRfq(false);

    // Visibility-aware polling interval (10 seconds)
    const intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadRfq(true);
      }
    }, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadRfq(true);
      }
    };

    const handleWindowFocus = () => {
      loadRfq(true);
    };

    const handleRfqUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ rfqId?: string }>;
      if (!customEvt.detail?.rfqId || customEvt.detail.rfqId === rfqId) {
        loadRfq(true);
      }
    };

    const handleNotificationsUpdate = () => {
      loadRfq(true);
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
  }, [loadRfq, rfqId]);

  // Smooth scroll to negotiation history section
  const scrollToHistory = () => {
    const el = document.getElementById("negotiation-history");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle Supplier Accept Counter-Offer
  const handleConfirmAccept = async () => {
    if (!latestQuotation || !rfq) return;
    try {
      setDecisionSubmitting(true);
      setDecisionError(null);

      await acceptSupplierCounterOffer(rfq.id, latestQuotation.id, decisionNotes.trim() || undefined);
      toast.success("Buyer counter-offer accepted. Commercial terms locked.");
      setDecisionModalMode(null);
      setDecisionNotes("");
      await loadRfq(true);
      window.dispatchEvent(new CustomEvent("rfq-updated", { detail: { rfqId } }));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to accept counter-offer";
      setDecisionError(msg);
      toast.error(msg);
    } finally {
      setDecisionSubmitting(false);
    }
  };

  // Handle Supplier Reject Counter-Offer
  const handleConfirmReject = async () => {
    if (!latestQuotation || !rfq) return;
    try {
      setDecisionSubmitting(true);
      setDecisionError(null);

      await rejectSupplierCounterOffer(rfq.id, latestQuotation.id, decisionNotes.trim() || undefined);
      toast.success("Buyer counter-offer declined.");
      setDecisionModalMode(null);
      setDecisionNotes("");
      await loadRfq(true);
      window.dispatchEvent(new CustomEvent("rfq-updated", { detail: { rfqId } }));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to decline counter-offer";
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
          Loading Sourcing Workspace...
        </span>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="max-w-[1440px] mx-auto p-6 lg:p-8">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center space-y-3 shadow-2xs">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="text-base font-bold text-[#0B1B33]">Inquiry Record Unavailable</h2>
          <p className="text-xs text-[#526581] max-w-md mx-auto">{error || "The requested RFQ record could not be retrieved."}</p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => loadRfq(false)}
              className="px-4 py-2 bg-[#0052CC] text-white text-xs font-semibold rounded-lg hover:bg-[#0747A6] transition-colors cursor-pointer"
            >
              Retry
            </button>
            <Link
              href="/dashboard/supplier/rfqs"
              className="px-4 py-2 border border-[#E2E8F0] text-[#0B1B33] text-xs font-semibold rounded-lg hover:bg-[#FAFBFC] transition-colors"
            >
              Back to Inquiries
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rfqShortId = rfq.rfqReference || (rfq.id ? `RFQ-${rfq.id.substring(0, 8).toUpperCase()}` : "RFQ-INQUIRY");
  const latestQuotation = quotations.length > 0 ? quotations[0] : null;
  const isCounterOffer = latestQuotation?.actorType === "BUYER" || rfq.status === "COUNTERED";
  const isAccepted = rfq.status === "ACCEPTED";
  const isPending = rfq.status === "PENDING" && quotations.length === 0;
  const isQuoted = rfq.status === "QUOTED";
  const isClosed = rfq.status === "CLOSED" || rfq.status === "CANCELLED";

  const nextVersionNumber = latestQuotation ? latestQuotation.quotationVersion + 1 : 1;

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

  const counterOfferCount = quotations.filter((q) => q.actorType === "BUYER").length;

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 pb-24 text-[#0B1B33]">
      {/* ========================================================================= */}
      {/* 1. TOP BREADCRUMB & CONTEXT                                               */}
      {/* ========================================================================= */}
      <nav aria-label="Breadcrumb" className="flex items-center justify-between text-xs text-[#526581] pt-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href="/dashboard/supplier" className="hover:text-[#0052CC] transition-colors">
            Supplier Desk
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#8993A4]" />
          <Link href="/dashboard/supplier/rfqs" className="hover:text-[#0052CC] transition-colors">
            RFQ Inquiries
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#8993A4]" />
          <span className="font-semibold text-[#0B1B33]">{rfqShortId}</span>
        </div>

        <span className="text-[11px] text-[#526581]">
          Negotiation Reference: <strong className="font-mono text-[#0B1B33]">{rfq.id.substring(0, 8).toUpperCase()}</strong>
        </span>
      </nav>

      {/* ========================================================================= */}
      {/* 2. RFQ HEADER (Full-Width Top Strip)                                      */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#0052CC] tracking-wide">
                {rfqShortId}
              </span>
              <span className="text-[#E2E8F0]">•</span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded border uppercase font-mono ${
                  isAccepted
                    ? "bg-[#E3FCEF] text-[#006644] border-[#ABF5D1]"
                    : isCounterOffer
                    ? "bg-[#FFFAE6] text-[#974F0C] border-[#FFE380]"
                    : isQuoted
                    ? "bg-[#DEEBFF] text-[#0747A6] border-[#B3D4FF]"
                    : "bg-[#FFFAE6] text-[#974F0C] border-[#FFE380]"
                }`}
              >
                {isCounterOffer && !isAccepted
                  ? "COUNTER-OFFER RECEIVED"
                  : isAccepted
                  ? "ACCEPTED / AGREED"
                  : isQuoted
                  ? "QUOTED"
                  : "AWAITING QUOTE"}
              </span>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap pt-0.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B33] tracking-tight">
                {product?.name || "Specialty Chemical Raw Material"}
              </h1>
              {product?.casNumber && (
                <span className="font-mono text-xs text-[#526581] bg-[#FAFBFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                  CAS {product.casNumber}
                </span>
              )}
            </div>

            <p className="text-xs text-[#526581]">
              Buyer Organization: <strong className="text-[#0B1B33]">{rfq.buyerName || "Verified Enterprise Buyer"}</strong> • Sourcing Category: <span className="font-medium text-[#0B1B33]">{product?.category || "Chemical Consignment"}</span>
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
              Requested Volume
            </span>
            <span className="text-sm font-bold text-[#0B1B33] block mt-0.5">
              {formatQty(rfq.quantity, rfq.unit)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Current Terms
            </span>
            <span className="text-sm font-bold text-[#0B1B33] block mt-0.5">
              {latestQuotation ? `${formatMoney(latestQuotation.unitPrice, latestQuotation.currency)} / ${rfq.unit.toUpperCase()}` : "Not Quoted Yet"}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Inquiry Received
            </span>
            <span className="text-xs text-[#0B1B33] block mt-0.5">
              {formatDate(rfq.createdAt)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Response Target
            </span>
            <span className="text-xs font-medium text-[#006644] block mt-0.5">
              Within 24 Hours
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TWO-COLUMN WORKSPACE (Main Left 7 Cols / Buyer Context Right 5 Cols)   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================================= */}
        {/* LEFT COLUMN: Main RFQ & Commercial Workspace (7 Cols)                  */}
        {/* ======================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. CURRENT QUOTATION / NEGOTIATION CARD */}
          {latestQuotation ? (
            <div className="bg-white border border-[#E2E8F0] border-l-4 border-l-[#0052CC] rounded-xl shadow-2xs overflow-hidden">
              {/* Light Refined Header */}
              <div className="px-6 py-4 bg-[#FAFBFC] border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0052CC]">
                      CURRENT QUOTATION · V{latestQuotation.quotationVersion}
                    </span>
                    <span className="text-[#E2E8F0]">•</span>
                    <span className="text-xs text-[#526581]">
                      {latestQuotation.actorType === "BUYER"
                        ? "Buyer Counter-Offer"
                        : latestQuotation.quotationVersion > 1
                        ? "Revised Quotation by Supplier"
                        : "Original Quotation by Supplier"}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748B] block mt-0.5">
                    Transmitted on {formatDateTime(latestQuotation.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={scrollToHistory}
                    className="text-xs text-[#0052CC] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Revision History</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 4-Column Commercial Metrics Grid */}
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                      Unit Price
                    </span>
                    <strong className="text-lg font-extrabold text-[#0B1B33] block mt-0.5">
                      {formatMoney(latestQuotation.unitPrice, latestQuotation.currency)}
                    </strong>
                    <span className="text-[10px] text-[#64748B] block mt-0.5">per standard {rfq.unit.toLowerCase()}</span>
                  </div>

                  <div className="p-3 bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                      MOQ
                    </span>
                    <strong className="text-base font-bold text-[#0B1B33] block mt-0.5">
                      {formatQty(latestQuotation.minimumOrderQuantity, rfq.unit)}
                    </strong>
                    <span className="text-[10px] text-[#64748B] block mt-0.5">Production threshold</span>
                  </div>

                  <div className="p-3 bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                      Lead Time
                    </span>
                    <strong className="text-base font-bold text-[#0B1B33] block mt-0.5">
                      {latestQuotation.leadTimeDays ? `${latestQuotation.leadTimeDays} Days` : "Standard"}
                    </strong>
                    <span className="text-[10px] text-[#64748B] block mt-0.5">Upon order confirmation</span>
                  </div>

                  <div className="p-3 bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                      Validity
                    </span>
                    <strong className="text-base font-bold text-[#0B1B33] block mt-0.5">
                      {formatDate(latestQuotation.validityDate)}
                    </strong>
                    <span className="text-[10px] text-[#64748B] block mt-0.5">Valid commercial offer</span>
                  </div>
                </div>

                {/* Packaging & Commercial Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                  {latestQuotation.packagingDetails && (
                    <div className="flex items-start gap-2 p-3 bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg">
                      <span className="font-bold text-[#64748B] shrink-0 uppercase text-[10px]">Packaging:</span>
                      <span className="text-[#0B1B33] font-medium">{latestQuotation.packagingDetails}</span>
                    </div>
                  )}

                  {latestQuotation.commercialMessage && (
                    <div className="flex items-start gap-2 p-3 bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg sm:col-span-2">
                      <span className="font-bold text-[#64748B] shrink-0 uppercase text-[10px]">Commercial Notes:</span>
                      <span className="text-[#0B1B33] italic">"{latestQuotation.commercialMessage}"</span>
                    </div>
                  )}
                </div>

                {/* Action Bar (Deliberate visual hierarchy) */}
                {!isAccepted && !isClosed && (
                  <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                        Action Required
                      </span>
                      <p className="text-xs text-[#0B1B33] mt-0.5">
                        {isCounterOffer
                          ? "Review the buyer's proposed terms and send your response."
                          : "Commercial proposal transmitted to buyer. Awaiting feedback."}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isCounterOffer ? (
                        <>
                          {/* 1. DECLINE / REJECT (Destructive text/outline) */}
                          <button
                            type="button"
                            onClick={() => setDecisionModalMode("reject")}
                            disabled={decisionSubmitting}
                            className="px-4 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Decline Proposal
                          </button>

                          {/* 2. COUNTER / REVISE (Secondary outline) */}
                          <button
                            type="button"
                            onClick={() => setShowRevisionForm(!showRevisionForm)}
                            disabled={decisionSubmitting}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                              showRevisionForm
                                ? "bg-[#DEEBFF] text-[#0052CC] border-[#B3D4FF]"
                                : "border-[#0052CC] text-[#0052CC] hover:bg-[#DEEBFF]/30"
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{showRevisionForm ? "Close Form" : "Counter Offer"}</span>
                          </button>

                          {/* 3. ACCEPT (Solid Primary Emerald) */}
                          <button
                            type="button"
                            onClick={() => setDecisionModalMode("accept")}
                            disabled={decisionSubmitting}
                            className="px-5 py-2 bg-[#00875A] hover:bg-[#006644] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Accept Quotation</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowRevisionForm(!showRevisionForm)}
                          className="px-4 py-2 border border-[#0052CC] text-[#0052CC] hover:bg-[#DEEBFF]/30 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{showRevisionForm ? "Hide Revision Form" : "Revise Quotation"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Accepted States: PO Active vs Awaiting PO */}
                {isAccepted && existingPo ? (
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
                        Binding order placed by buyer on {formatDate(existingPo.placedAt)}. Status:{" "}
                        <strong className="text-[#00875A] uppercase font-mono">{existingPo.status}</strong>
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/supplier/orders/${existingPo.id}`}
                      className="h-10 px-5 bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-2xs flex items-center justify-center gap-2 shrink-0"
                    >
                      <span>View Purchase Order →</span>
                    </Link>
                  </div>
                ) : isAccepted && !existingPo ? (
                  <div className="pt-4 border-t border-[#E2E8F0] p-4 bg-[#E3FCEF]/60 border border-[#ABF5D1] rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#00875A] shrink-0" />
                    <div>
                      <span className="text-[10px] font-mono font-bold tracking-widest text-[#006644] uppercase block">
                        COMMERCIAL TERMS ACCEPTED
                      </span>
                      <p className="text-xs text-[#526581] mt-0.5">
                        Buyer accepted quotation terms. Awaiting formal Purchase Order generation from buyer.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : isPending && !showRevisionForm ? (
            /* Pending Initial Quotation Banner */
            <div className="bg-white border border-[#E2E8F0] border-l-4 border-l-[#0052CC] rounded-xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0052CC] block">
                  ACTION REQUIRED
                </span>
                <h3 className="text-base font-bold text-[#0B1B33] mt-0.5">
                  Submit Commercial Quotation
                </h3>
                <p className="text-xs text-[#526581]">
                  Buyer is awaiting your pricing and fulfillment terms for this inquiry.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowRevisionForm(true)}
                className="px-5 py-2.5 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-2xs flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Commercial Proposal</span>
              </button>
            </div>
          ) : null}

          {/* 2. REVISE / SUBMIT COMMERCIAL FORM (Inline when toggled) */}
          {showRevisionForm && !isAccepted && !isClosed && (
            <QuotationForm
              rfqId={rfq.id}
              targetQuantity={rfq.quantity}
              unit={rfq.unit}
              isRevision={quotations.length > 0}
              revisionNumber={nextVersionNumber}
              buyerProposal={
                latestQuotation && isCounterOffer
                  ? {
                      unitPrice: latestQuotation.unitPrice,
                      currency: latestQuotation.currency,
                      minimumOrderQuantity: latestQuotation.minimumOrderQuantity,
                      leadTimeDays: latestQuotation.leadTimeDays,
                      validityDate: latestQuotation.validityDate,
                      packagingDetails: latestQuotation.packagingDetails,
                      commercialNotes: latestQuotation.commercialNotes,
                    }
                  : undefined
              }
              initialData={{
                unitPrice: latestQuotation?.unitPrice,
                currency: latestQuotation?.currency || "INR",
                minimumOrderQuantity: latestQuotation?.minimumOrderQuantity ?? undefined,
                leadTimeDays: latestQuotation?.leadTimeDays ?? undefined,
                validityDate: latestQuotation?.validityDate ? latestQuotation.validityDate.split("T")[0] : "",
                packagingDetails: latestQuotation?.packagingDetails || "",
                commercialNotes: latestQuotation?.commercialNotes || "",
              }}
              onSuccess={() => {
                setShowRevisionForm(false);
                loadRfq(true);
                window.dispatchEvent(new CustomEvent("rfq-updated", { detail: { rfqId } }));
                window.dispatchEvent(new CustomEvent("notifications-updated"));
              }}
              onCancel={() => setShowRevisionForm(false)}
            />
          )}

          {/* 3. COMPLETE EMBEDDED NEGOTIATION HISTORY SECTION (#negotiation-history) */}
          <section id="negotiation-history" className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden scroll-mt-6">
            {/* Header & Negotiation Summary Metrics */}
            <div className="px-6 py-5 bg-[#FAFBFC] border-b border-[#E2E8F0] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#0052CC]" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1B33]">
                      NEGOTIATION HISTORY
                    </h2>
                  </div>
                  <p className="text-xs text-[#526581] mt-0.5">
                    Commercial revision record and progression.
                  </p>
                </div>

                <span className="font-mono text-xs font-semibold text-[#0B1B33] bg-white border border-[#E2E8F0] px-3 py-1 rounded">
                  {quotations.length} Version{quotations.length > 1 ? "s" : ""} Logged
                </span>
              </div>

              {/* 4-Metric Compact Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E2E8F0] text-xs">
                <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                    Revisions
                  </span>
                  <strong className="text-base font-bold text-[#0B1B33] block mt-0.5">
                    {quotations.length}
                  </strong>
                </div>

                <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                    Participants
                  </span>
                  <strong className="text-base font-bold text-[#0B1B33] block mt-0.5">
                    2 (Buyer · Supplier)
                  </strong>
                </div>

                <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                    Counter-Offers
                  </span>
                  <strong className="text-base font-bold text-[#0B1B33] block mt-0.5">
                    {counterOfferCount}
                  </strong>
                </div>

                <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                    Current Status
                  </span>
                  <strong className="text-xs font-bold text-[#0B1B33] block mt-1 uppercase font-mono">
                    {isAccepted ? "Accepted" : isCounterOffer ? "Countered" : isQuoted ? "Quoted" : "Pending"}
                  </strong>
                </div>
              </div>
            </div>

            {/* AGREED COMMERCIAL TERMS BANNER (If Accepted) */}
            {isAccepted && latestQuotation && (
              <div className="p-5 bg-[#E3FCEF]/60 border-b border-[#ABF5D1] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#006644]">
                  <CheckCircle2 className="w-4 h-4 text-[#00875A]" />
                  <span>COMMERCIAL TERMS AGREED</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#0B1B33]">
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Agreed Unit Price:</span>
                    <strong>{formatMoney(latestQuotation.unitPrice, latestQuotation.currency)} / {rfq.unit.toUpperCase()}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Agreed Quantity:</span>
                    <strong>{formatQty(rfq.quantity, rfq.unit)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Fulfillment Lead Time:</span>
                    <strong>{latestQuotation.leadTimeDays ? `${latestQuotation.leadTimeDays} days` : "Standard"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Status:</span>
                    <strong className="text-[#00875A]">PURCHASE ORDER READY</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Complete Timeline List of Historical Revisions */}
            <div className="p-6">
              {quotations.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#526581] space-y-1">
                  <strong className="text-[#0B1B33] block">NO NEGOTIATION HISTORY YET</strong>
                  <p>The original quotation and any subsequent counter-offers will appear here when submitted.</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
                  {quotations.map((quote, idx) => {
                    const isCurrent = idx === 0;
                    const isBuyer = quote.actorType === "BUYER";
                    const prevQuote = idx < quotations.length - 1 ? quotations[idx + 1] : null;

                    // Calculate changes from preceding chronological version
                    const deltaPrice = prevQuote && prevQuote.unitPrice !== quote.unitPrice ? { prev: prevQuote.unitPrice, curr: quote.unitPrice } : null;
                    const deltaLead = prevQuote && prevQuote.leadTimeDays !== quote.leadTimeDays ? { prev: prevQuote.leadTimeDays, curr: quote.leadTimeDays } : null;
                    const deltaMoq = prevQuote && prevQuote.minimumOrderQuantity !== quote.minimumOrderQuantity ? { prev: prevQuote.minimumOrderQuantity, curr: quote.minimumOrderQuantity } : null;
                    const deltaValidity = prevQuote && prevQuote.validityDate !== quote.validityDate ? { prev: prevQuote.validityDate, curr: quote.validityDate } : null;
                    const hasChanges = deltaPrice || deltaLead || deltaMoq || deltaValidity;

                    const formatActionBadge = () => {
                      if (isBuyer) return "COUNTER-OFFER";
                      if (quote.quotationVersion === 1) return "INITIAL QUOTATION";
                      return "SUPPLIER REVISION";
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
                                Version {quote.quotationVersion} · {formatActionBadge()}
                              </strong>
                              {isCurrent && (
                                <span className="text-[9px] font-bold bg-[#0B1B33] text-white px-2 py-0.2 rounded uppercase">
                                  CURRENT ACTIVE
                                </span>
                              )}
                            </div>

                            <span className="text-xs text-[#526581]">
                              {formatDateTime(quote.createdAt)}
                            </span>
                          </div>

                          {/* Commercial Terms Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                                Unit Price
                              </span>
                              <strong className="text-sm font-bold text-[#0B1B33] block mt-0.5">
                                {formatMoney(quote.unitPrice, quote.currency)} / {rfq.unit.toUpperCase()}
                              </strong>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                                Minimum Order (MOQ)
                              </span>
                              <span className="text-xs text-[#0B1B33] block mt-0.5 font-medium">
                                {formatQty(quote.minimumOrderQuantity, rfq.unit)}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                                Fulfillment Lead Time
                              </span>
                              <span className="text-xs text-[#0B1B33] block mt-0.5 font-medium">
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
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1.5">
                                CHANGES FROM VERSION {prevQuote.quotationVersion}
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {deltaPrice && (
                                  <span className="inline-flex items-center gap-1 bg-white border border-[#E2E8F0] px-2 py-1 rounded text-[11px]">
                                    <span className="text-[#64748B]">Unit Price:</span>
                                    <span className="line-through text-[#64748B]">{deltaPrice.prev.toFixed(2)}</span>
                                    <ArrowRight className="w-3 h-3 text-[#0052CC]" />
                                    <strong className="text-[#0B1B33]">{deltaPrice.curr.toFixed(2)}</strong>
                                  </span>
                                )}

                                {deltaLead && (
                                  <span className="inline-flex items-center gap-1 bg-white border border-[#E2E8F0] px-2 py-1 rounded text-[11px]">
                                    <span className="text-[#64748B]">Lead Time:</span>
                                    <span className="line-through text-[#64748B]">{deltaLead.prev}d</span>
                                    <ArrowRight className="w-3 h-3 text-[#0052CC]" />
                                    <strong className="text-[#0B1B33]">{deltaLead.curr}d</strong>
                                  </span>
                                )}

                                {deltaMoq && (
                                  <span className="inline-flex items-center gap-1 bg-white border border-[#E2E8F0] px-2 py-1 rounded text-[11px]">
                                    <span className="text-[#64748B]">MOQ:</span>
                                    <span className="line-through text-[#64748B]">{deltaMoq.prev ?? "Std"}</span>
                                    <ArrowRight className="w-3 h-3 text-[#0052CC]" />
                                    <strong className="text-[#0B1B33]">{deltaMoq.curr ?? "Std"}</strong>
                                  </span>
                                )}

                                {deltaValidity && (
                                  <span className="inline-flex items-center gap-1 bg-white border border-[#E2E8F0] px-2 py-1 rounded text-[11px]">
                                    <span className="text-[#64748B]">Validity:</span>
                                    <span className="line-through text-[#64748B]">{formatDate(deltaValidity.prev)}</span>
                                    <ArrowRight className="w-3 h-3 text-[#0052CC]" />
                                    <strong className="text-[#0B1B33]">{formatDate(deltaValidity.curr)}</strong>
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
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: Buyer Context & Lifecycle Sidebar (5 Cols)                */}
        {/* ======================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 1. BUYER SOURCING REQUIREMENTS */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 bg-[#FAFBFC] border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0052CC]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B1B33]">
                  Buyer Sourcing Requirements
                </h2>
              </div>
              <span className="font-mono text-[10px] font-semibold text-[#526581]">
                SPEC: {product?.id ? product.id.substring(0, 8).toUpperCase() : "STANDARD"}
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 gap-y-2.5 text-xs divide-y divide-[#E2E8F0]">
                <div className="flex justify-between items-baseline py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Target Compound</span>
                  <strong className="text-[#0B1B33]">{product?.name || "Chemical Raw Material"}</strong>
                </div>

                <div className="flex justify-between items-baseline py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Requested Volume</span>
                  <span className="font-bold text-[#0B1B33]">{formatQty(rfq.quantity, rfq.unit)}</span>
                </div>

                <div className="flex justify-between items-baseline py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">CAS Registry Number</span>
                  <span className="font-mono font-bold text-[#0B1B33]">{product?.casNumber || "—"}</span>
                </div>

                <div className="flex justify-between items-baseline py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Assay / Minimum Purity</span>
                  <span className="font-semibold text-[#0B1B33]">{product?.purity ? `${product.purity}% minimum` : "Standard Technical Grade"}</span>
                </div>

                <div className="flex justify-between items-baseline py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Pharmacopoeia Standard</span>
                  <span className="font-semibold text-[#0B1B33] uppercase">{product?.grade || "IP / BP / USP Standard"}</span>
                </div>

                <div className="flex justify-between items-baseline py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Packaging Required</span>
                  <span className="font-semibold text-[#0B1B33]">{product?.packaging || "Standard Drum Container"}</span>
                </div>
              </div>

              {/* Buyer Notes */}
              <div className="pt-2 border-t border-[#E2E8F0]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1">
                  Buyer Message & Technical Notes
                </span>
                <div className="p-3 bg-[#FAFBFC] rounded-lg border border-[#E2E8F0] text-xs text-[#0B1B33] leading-relaxed">
                  {rfq.message || "Standard commercial inquiry for monograph raw material. Please provide best price and dispatch timeline."}
                </div>
              </div>
            </div>
          </div>

          {/* 2. INQUIRY DOCUMENTS & TECHNICAL ATTACHMENTS */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs p-5">
            <GenericDocumentManager
              title="Inquiry Documents"
              description="Technical specifications, test protocols, NDA and compliance requirements."
              ownerType="RFQ"
              ownerId={rfq.id}
              canUpload={true}
              canDelete={true}
              allowedCategories={[
                { value: "TECHNICAL_SPECIFICATION", label: "Technical Specification" },
                { value: "CERTIFICATION", label: "Certification / COA" },
              ]}
              emptyMessage="No buyer documents have been attached to this inquiry yet."
            />
          </div>

          {/* 3. NEGOTIATION STATUS */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block border-b border-[#E2E8F0] pb-2">
              NEGOTIATION STATUS
            </span>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#526581]">Current Stage</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${
                    isAccepted
                      ? "bg-[#E3FCEF] text-[#006644] border-[#ABF5D1]"
                      : isCounterOffer
                      ? "bg-[#FFFAE6] text-[#974F0C] border-[#FFE380]"
                      : isQuoted
                      ? "bg-[#DEEBFF] text-[#0747A6] border-[#B3D4FF]"
                      : "bg-[#FFFAE6] text-[#974F0C] border-[#FFE380]"
                  }`}
                >
                  {isCounterOffer && !isAccepted
                    ? "Counter-Offer Received"
                    : isAccepted
                    ? "Agreed"
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
                  {isAccepted
                    ? "Commercial consensus reached. Buyer will issue formal purchase order."
                    : isCounterOffer
                    ? "Review the buyer's proposal and send your revised terms."
                    : isPending
                    ? "Submit your initial quotation to start the commercial review."
                    : "Awaiting buyer review of your quotation."}
                </p>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center">
                <span className="text-[#526581]">Version</span>
                <strong className="font-mono text-[#0B1B33]">
                  {latestQuotation ? `V${latestQuotation.quotationVersion}` : "Draft"}
                </strong>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#526581]">Revisions</span>
                <span className="font-bold text-[#0B1B33]">{quotations.length}</span>
              </div>
            </div>
          </div>

          {/* 4. PROCUREMENT MILESTONES */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block border-b border-[#E2E8F0] pb-2">
              PROCUREMENT MILESTONES
            </span>

            <div className="space-y-3 text-xs">
              {/* Step 1: RFQ Transmitted */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#E3FCEF] text-[#006644] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-[#0B1B33] block">RFQ Transmitted</strong>
                  <span className="text-[11px] text-[#526581]">{formatDate(rfq.createdAt)}</span>
                </div>
              </div>

              {/* Step 2: Quotation Provided */}
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
                  <strong className="text-[#0B1B33] block">Quotation Provided</strong>
                  <span className="text-[11px] text-[#526581]">
                    {quotations.length > 0 ? `${quotations.length} revision${quotations.length > 1 ? "s" : ""}` : "Pending"}
                  </span>
                </div>
              </div>

              {/* Step 3: Purchase Order */}
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                    isAccepted
                      ? "bg-[#E3FCEF] text-[#006644]"
                      : "bg-[#FAFBFC] border border-[#E2E8F0] text-[#8993A4]"
                  }`}
                >
                  {isAccepted ? "✓" : "3"}
                </div>
                <div>
                  <strong className="text-[#0B1B33] block">Purchase Order</strong>
                  <span className="text-[11px] text-[#526581]">
                    {isAccepted ? "Agreement reached" : "Pending agreement"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. BUYER PROFILE */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block border-b border-[#E2E8F0] pb-2">
              BUYER PROFILE
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#526581]">Organization</span>
                <strong className="text-[#0B1B33]">{rfq.buyerName || "Enterprise Chemical Buyer"}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#526581]">Account Status</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006644]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Buyer
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#526581]">Payment Rating</span>
                <span className="font-semibold text-[#0B1B33]">AAA (Prompt Settlement)</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SUPPLIER ACCEPT / REJECT CONFIRMATION MODAL                            */}
      {/* ========================================================================= */}
      {decisionModalMode && latestQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-[#0B1B33] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {decisionModalMode === "accept" ? "Accept Buyer's Counter-Offer?" : "Reject Buyer's Counter-Offer?"}
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
                    You are accepting the buyer's counter-offer (Version {latestQuotation.quotationVersion}) under the following agreed commercial terms:
                  </p>

                  <div className="p-3.5 bg-[#FAFBFC] rounded-lg border border-[#E2E8F0] space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Unit Price:</span>
                      <strong className="text-[#0B1B33]">{formatMoney(latestQuotation.unitPrice, latestQuotation.currency)} / {rfq.unit.toUpperCase()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Quantity:</span>
                      <span className="text-[#0B1B33]">{formatQty(rfq.quantity, rfq.unit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">MOQ:</span>
                      <span className="text-[#0B1B33]">{formatQty(latestQuotation.minimumOrderQuantity, rfq.unit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Lead Time:</span>
                      <span className="text-[#0B1B33]">{latestQuotation.leadTimeDays ? `${latestQuotation.leadTimeDays} days` : "Standard"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Validity:</span>
                      <span className="text-[#0B1B33]">{formatDate(latestQuotation.validityDate)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#64748B]">
                    Once accepted, these commercial terms become the agreed quotation and can proceed toward purchase-order issuance.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[#0B1B33] leading-relaxed">
                    You are about to decline the buyer's proposed commercial terms. This will mark the current negotiation as rejected.
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
                      ? "e.g. Terms accepted. Ready for standard dispatch schedule."
                      : "e.g. Price below minimum production margin."
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
                  onClick={decisionModalMode === "accept" ? handleConfirmAccept : handleConfirmReject}
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
                      : "Rejecting..."
                    : decisionModalMode === "accept"
                    ? "Accept Quotation"
                    : "Decline Proposal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
