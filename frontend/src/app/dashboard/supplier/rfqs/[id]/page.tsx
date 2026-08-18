"use client";

import { useEffect, useState } from "react";
import { getSupplierRfq } from "@/features/rfq/api/getSupplierRfq";
import { SupplierRfq } from "@/features/rfq/api/getSupplierRfqs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QuotationForm } from "@/features/rfq/components/QuotationForm";
import { QuotationResponse } from "@/features/rfq/api/submitQuotation";
import { GenericDocumentManager } from "@/features/documents/components/GenericDocumentManager";

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

  const getSemanticStatusClass = (status: string) => {
    switch (status) {
      case "ACCEPTED": return "text-teal-600";
      case "QUOTED": return "text-blue-600";
      case "PENDING":
      case "CONTACTED": return "text-orange-500";
      case "REJECTED": return "text-red-700";
      case "CLOSED":
      case "CANCELLED": return "text-slate-500";
      default: return "text-slate-600";
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center bg-white">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
          LOADING INQUIRY DOSSIER...
        </span>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto bg-white min-h-screen">
        <div className="border-l-[3px] border-orange-500 pl-4 py-1 mb-8">
          <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">System Error</p>
          <p className="text-sm font-mono text-slate-700 mt-2">{error || "RFQ reference not found"}</p>
          <button
            onClick={loadRfq}
            className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[#0A192F] hover:text-blue-600 transition-colors"
          >
            RETRY FETCH →
          </button>
        </div>
        <Link
          href="/dashboard/supplier/rfqs"
          className="text-[10px] font-bold uppercase tracking-widest text-[#0A192F] hover:text-blue-600 transition-colors"
        >
          ← BACK TO INBOX
        </Link>
      </div>
    );
  }

  const effectiveStatus = quotation ? "QUOTED" : rfq.status;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pb-24">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">

        {/* =========================================
            DOCUMENT HEADER
            ========================================= */}
        <header className="border-t-[3px] border-[#0A192F] pt-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="max-w-2xl">
              <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                SUPPLIER OPERATIONS / RFQ DOSSIER
              </span>
              <h1 className="text-4xl lg:text-5xl font-mono font-bold text-[#0A192F] tracking-tighter mb-4">
                {rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`}
              </h1>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {rfq.productName || "Specialty Chemical Raw Material"}
              </h2>
            </div>
            
            <div className="shrink-0 flex flex-col md:items-end gap-1 md:pl-4 py-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                STATUS
              </span>
              <span className={`text-sm font-bold uppercase tracking-widest ${getSemanticStatusClass(effectiveStatus)}`}>
                {effectiveStatus}
              </span>
            </div>
          </div>
        </header>

        {/* =========================================
            DOCUMENT META BAND
            ========================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center border-y border-slate-200 py-3 mb-12 gap-y-4 gap-x-8">
          <div className="flex-1 sm:border-r border-slate-200 sm:pr-6">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">BUYER</span>
            <span className="text-xs font-bold text-[#0A192F] truncate block">
              {rfq.buyerName || "Buyer Organization"}
            </span>
          </div>
          <div className="flex-1 sm:border-r border-slate-200 sm:pr-6">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">REQUEST DATE</span>
            <span className="font-mono text-xs font-semibold text-[#0A192F]">
              {new Date(rfq.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 sm:border-r border-slate-200 sm:pr-6">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">QUANTITY</span>
            <span className="font-mono text-xs font-bold text-[#0A192F]">
              {rfq.quantity.toLocaleString()} {rfq.unit.toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">INTERNAL ID</span>
            <span className="font-mono text-[10px] text-slate-500 truncate block">
              {rfq.id}
            </span>
          </div>
        </div>

        {/* =========================================
            ASYMMETRIC GRID (70/30)
            ========================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* LEFT COLUMN: MAIN DOSSIER (70%) */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-16">

            {/* 01 / REQUESTED MATERIAL */}
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
                <span className="text-slate-300">01 /</span> REQUESTED MATERIAL
                <div className="h-px bg-slate-200 flex-1 ml-4" />
              </h2>

              <div className="border-l-[3px] border-[#0A192F] pl-5 py-1 mb-8">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">PRODUCT</h3>
                <p className="text-lg font-bold text-slate-900">{rfq.productName || "Specialty Chemical Raw Material"}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6 border-t border-slate-200 pt-6">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">REQUESTED QUANTITY</span>
                  <span className="font-mono text-base font-bold text-[#0A192F]">
                    {rfq.quantity.toLocaleString()} {rfq.unit.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">PRODUCT ID</span>
                  <span className="font-mono text-sm font-medium text-slate-700">
                    {rfq.productId}
                  </span>
                </div>
              </div>
            </section>

            {/* 02 / BUYER REQUIREMENTS */}
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
                <span className="text-slate-300">02 /</span> BUYER REQUIREMENTS
                <div className="h-px bg-slate-200 flex-1 ml-4" />
              </h2>

              <div className="border-l-[3px] border-slate-300 bg-slate-50/50 pl-5 pr-4 py-4">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-[#0A192F] mb-3">
                  BUYER MESSAGE & SPECIFICATIONS
                </span>
                <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {rfq.message || <span className="italic text-slate-400">No additional message provided with inquiry.</span>}
                </p>
              </div>
            </section>

            {/* 03 / RFQ DOCUMENTS */}
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
                <span className="text-slate-300">03 /</span> RFQ DOCUMENTS
                <div className="h-px bg-slate-200 flex-1 ml-4" />
              </h2>
              <GenericDocumentManager
                title="Buyer Attachments"
                description="Technical specifications, NDAs, and other requirements provided by the buyer."
                ownerType="RFQ"
                ownerId={rfq.id}
                canUpload={false}
                canDelete={false}
                allowedCategories={[]}
                emptyMessage="No documents attached to this RFQ by the buyer."
              />
            </section>

            {/* 04 / COMMERCIAL QUOTATION */}
            {quotation ? (
              <section>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
                  <span className="text-slate-300">04 /</span> COMMERCIAL QUOTATION
                  <div className="h-px bg-slate-200 flex-1 ml-4" />
                </h2>

                <div className="border-l-[3px] border-teal-500 bg-slate-50/50 p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 pb-4 mb-6">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-teal-600 mb-1">
                        QUOTATION TRANSMITTED
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">
                        Revision {quotation.quotationVersion}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">UNIT PRICE</span>
                      <span className="font-mono text-lg font-bold text-[#0A192F]">
                        {quotation.currency} {quotation.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">MOQ</span>
                      <span className="font-mono text-sm font-bold text-slate-800">
                        {quotation.minimumOrderQuantity != null ? `${quotation.minimumOrderQuantity.toLocaleString()} ${rfq.unit.toUpperCase()}` : "STANDARD"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">LEAD TIME</span>
                      <span className="font-mono text-sm font-bold text-slate-800">
                        {quotation.leadTimeDays != null ? `${quotation.leadTimeDays} DAYS` : "STANDARD"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">VALID UNTIL</span>
                      <span className="font-mono text-sm font-bold text-slate-800">
                        {new Date(quotation.validityDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* QUOTATION DOCUMENTS */}
                  <div className="mt-8 pt-8 border-t border-slate-200">
                    <GenericDocumentManager
                      title="Quotation Attachments"
                      description="Technical specifications, certifications, and commercial terms to attach."
                      ownerType="QUOTATION"
                      ownerId={quotation.id}
                      canUpload={true}
                      canDelete={true}
                      allowedCategories={[
                        { value: "COA", label: "Certificate of Analysis (COA)" },
                        { value: "MSDS", label: "Material Safety Data Sheet (MSDS)" },
                        { value: "TECHNICAL_SPECIFICATION", label: "Technical Specification (TDS)" },
                        { value: "CERTIFICATION", label: "Certification" }
                      ]}
                      emptyMessage="No documents attached to this quotation."
                    />
                  </div>

                </div>
              </section>
            ) : rfq.status !== "CLOSED" && rfq.status !== "CANCELLED" ? (
              <QuotationForm rfqId={rfq.id} onSuccess={(q) => setQuotation(q)} />
            ) : null}

          </div>

          {/* RIGHT COLUMN: SUPPLIER ACTION RAIL (30%) */}
          <div className="lg:col-span-4 xl:col-span-3 border-t lg:border-t-0 lg:border-l border-slate-200 pt-8 lg:pt-0 lg:pl-12 lg:pr-4">
            
            <div className="sticky top-8 space-y-12">
              
              {/* ACTION CALLOUT */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-200 pb-2">
                  SUPPLIER RESPONSE
                </span>
                
                {quotation || effectiveStatus === "QUOTED" || effectiveStatus === "ACCEPTED" ? (
                  <div className="bg-slate-50 p-5 border border-slate-200">
                    <span className={`block text-[10px] font-bold uppercase tracking-widest mb-1 ${getSemanticStatusClass(effectiveStatus)}`}>
                      {effectiveStatus}
                    </span>
                    <p className="text-sm font-medium text-slate-700">
                      You have successfully transmitted your commercial offer to the buyer. Awaiting buyer decision.
                    </p>
                  </div>
                ) : effectiveStatus === "CLOSED" || effectiveStatus === "CANCELLED" || effectiveStatus === "REJECTED" ? (
                  <div className="bg-slate-50 p-5 border border-slate-200">
                    <span className={`block text-[10px] font-bold uppercase tracking-widest mb-1 ${getSemanticStatusClass(effectiveStatus)}`}>
                      {effectiveStatus}
                    </span>
                    <p className="text-sm font-medium text-slate-700">
                      This inquiry is no longer active for quotation.
                    </p>
                  </div>
                ) : (
                  <div className="bg-orange-50/50 p-5 border-l-[3px] border-orange-500">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-orange-600 mb-1">
                      AWAITING QUOTATION
                    </span>
                    <p className="text-sm font-medium text-slate-800 mb-6">
                      Please review the buyer requirements and prepare your commercial offer.
                    </p>
                    <button 
                      onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                      className="w-full py-3 bg-[#0A192F] hover:bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A192F] focus-visible:ring-offset-2"
                    >
                      JUMP TO QUOTE FORM ↓
                    </button>
                  </div>
                )}
              </div>

              {/* LIFECYCLE */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-200 pb-2">
                  RFQ LIFECYCLE
                </span>
                
                <div className="border-l border-slate-200 ml-1.5 space-y-6 pt-2">
                  {quotation && (
                    <div className="relative pl-5">
                      <div className="absolute w-2 h-2 rounded-full bg-blue-600 -left-[4.5px] top-1" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#0A192F]">QUOTATION SUBMITTED</p>
                      <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                        {new Date(quotation.createdAt || new Date()).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                      </p>
                    </div>
                  )}

                  <div className="relative pl-5">
                    <div className={`absolute w-2 h-2 rounded-full -left-[4.5px] top-1 ${!quotation ? "bg-orange-500" : "bg-slate-300"}`} />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700">RFQ RECEIVED</p>
                    <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                      {new Date(rfq.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* =========================================
            DOCUMENT FOOTER
            ========================================= */}
        <footer className="mt-24 pt-8 border-t border-slate-200 flex items-center justify-between">
          <Link
            href="/dashboard/supplier/rfqs"
            className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#0A192F] hover:text-blue-600 transition-colors"
          >
            ← BACK TO INBOX
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`}
          </span>
        </footer>

      </div>
    </div>
  );
}
