"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getRfq, RfqDetail } from "@/features/rfq/api/getRfq";
import { getBuyerQuotations } from "@/features/rfq/api/getBuyerQuotations";
import { QuotationResponse } from "@/features/rfq/api/submitQuotation";
import { QuotationComparison } from "@/features/rfq/components/QuotationComparison";
import { getProductDetail } from "@/app/products/api/getProductDetail";
import { getProductSuppliers } from "@/app/products/api/getProductSuppliers";
import { getOrderByRfqId } from "@/features/order/api/getOrderByRfqId";
import { IssuePoModal } from "@/features/order/components/IssuePoModal";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";
import { GenericDocumentManager } from "@/features/documents/components/GenericDocumentManager";
import { CounterOfferModal } from "@/features/rfq/components/CounterOfferModal";
import { useToast } from "@/shared/context/ToastContext";
import { getSupplierPublicProfile } from "@/features/suppliers/api";

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
  const [supplierNameResolved, setSupplierNameResolved] = useState<string | null>(null);
  const [quotations, setQuotations] = useState<QuotationResponse[]>([]);
  const [existingPo, setExistingPo] = useState<PurchaseOrderResponse | null>(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const toast = useToast();

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
        rfqData.productId ? getProductDetail(rfqData.productId).catch(() => null) : Promise.resolve(null),
        rfqData.productId ? getProductSuppliers(rfqData.productId).catch(() => [] as Supplier[]) : Promise.resolve([] as Supplier[]),
      ]);

      const matchingSupplier = suppliersData?.find(
        (item: Supplier) => item.supplierId === rfqData.supplierId
      );

      setRfq(rfqData);
      setQuotations(quotationsData);
      setExistingPo(poData);
      setProduct(productData);
      setSupplier(matchingSupplier ?? null);

      if (rfqData.supplierId) {
        getSupplierPublicProfile(rfqData.supplierId)
          .then((s) => { if (s?.name) setSupplierNameResolved(s.name); })
          .catch(() => null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load RFQ details");
    } finally {
      setLoading(false);
    }
  }, [rfqId]);

  useEffect(() => {
    loadRfqDetail();
  }, [loadRfqDetail]);

  const getSemanticStatusClass = (status: string) => {
    switch (status) {
      case "ACCEPTED":
      case "CONFIRMED":
        return "text-teal-600";
      case "QUOTED":
      case "PLACED":
        return "text-blue-600";
      case "PENDING":
      case "SUBMITTED":
      case "CONTACTED":
        return "text-orange-500";
      case "REJECTED":
      case "CANCELLED":
      case "CLOSED":
        return "text-slate-500 line-through";
      default:
        return "text-slate-600";
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
          LOADING DOSSIER...
        </span>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto">
        <div className="border-l-[3px] border-orange-500 pl-4 py-1">
          <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">Dossier Retrieval Error</p>
          <p className="text-sm font-mono text-slate-700 mt-2">{error ?? "RFQ reference not found"}</p>
          <div className="mt-4 flex gap-4">
            <button
              onClick={loadRfqDetail}
              className="text-[10px] font-bold uppercase tracking-widest text-[#0A192F] hover:text-blue-600 transition-colors"
            >
              RETRY FETCH →
            </button>
            <Link
              href="/dashboard/rfqs"
              className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← BACK TO REGISTER
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rfqShortId = rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pb-24">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">

        {/* =========================================
            HEADER: PROCUREMENT DOSSIER
            ========================================= */}
        <header className="border-t-[3px] border-[#0A192F] pt-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-6 mb-4">
                <Link
                  href="/dashboard/rfqs"
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#0A192F] transition-colors"
                >
                  ← BACK TO RFQs
                </Link>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-300">|</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  PROCUREMENT / RFQ DOSSIER
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-mono font-bold text-[#0A192F] tracking-tight mb-2">
                {rfqShortId}
              </h1>
              <h2 className="text-xl font-bold text-slate-700 tracking-tight">
                {product?.name ?? "Specialty Chemical Raw Material"}
              </h2>
            </div>
            
            <div className="shrink-0 flex flex-col md:items-end gap-1 border-l-2 md:border-l-0 md:border-r-2 border-[#0A192F] pl-4 md:pl-0 md:pr-4 py-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">STATUS</span>
              <span className={`text-sm font-bold uppercase tracking-widest ${getSemanticStatusClass(rfq.status)}`}>
                {rfq.status}
              </span>
              <span className="text-[11px] font-mono text-slate-500 uppercase mt-2">
                {new Date(rfq.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* =========================================
            METADATA BAND
            ========================================= */}
        <div className="border-t border-b border-slate-200 py-3 mb-16 overflow-x-auto">
          <div className="flex items-center gap-12 min-w-max">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Product</span>
              <span className="text-[11px] font-bold text-slate-800 uppercase mt-1">{product?.name ?? "Specialty Chemical"}</span>
            </div>
            <div className="w-[1px] h-6 bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Supplier</span>
              <span className="text-[11px] font-bold text-slate-800 uppercase mt-1">{supplier?.supplierName ?? supplierNameResolved ?? "Verified Supplier"}</span>
            </div>
            <div className="w-[1px] h-6 bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Requested Quantity</span>
              <span className="text-[11px] font-mono font-bold text-slate-800 uppercase mt-1">{rfq.quantity.toLocaleString()} {rfq.unit}</span>
            </div>
            <div className="w-[1px] h-6 bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Request Date</span>
              <span className="text-[11px] font-mono font-bold text-slate-800 mt-1">
                {new Date(rfq.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* =========================================
            MAIN DOSSIER (70/30)
            ========================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-16 gap-y-20">
          
          {/* --- MAIN CONTENT (70%) --- */}
          <div className="lg:col-span-8">
            
            {/* 01 / CHEMICAL SPECIFICATION */}
            <section className="mb-16">
              <div className="border-b-[2px] border-[#0A192F] pb-2 mb-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#0A192F]">
                  01 / Chemical Specification
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                <div className="border-b border-slate-200 pb-3 flex justify-between items-baseline">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Molecular Formula</span>
                  <span className="font-mono text-xs font-bold text-[#0A192F]">{product?.molecularFormula || "—"}</span>
                </div>
                <div className="border-b border-slate-200 pb-3 flex justify-between items-baseline">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">CAS Number</span>
                  <span className="font-mono text-xs font-bold text-[#0A192F]">{product?.casNumber || "—"}</span>
                </div>
                <div className="border-b border-slate-200 pb-3 flex justify-between items-baseline">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Assay / Purity</span>
                  <span className="text-xs font-bold text-[#0A192F] uppercase">{product?.purity ? `${product.purity}%` : "STANDARD"}</span>
                </div>
                <div className="border-b border-slate-200 pb-3 flex justify-between items-baseline">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Grade</span>
                  <span className="text-xs font-bold text-[#0A192F] uppercase">{product?.grade || "INDUSTRIAL"}</span>
                </div>
                <div className="border-b border-slate-200 pb-3 flex justify-between items-baseline">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Packaging</span>
                  <span className="text-xs font-bold text-[#0A192F] uppercase truncate ml-4">{product?.packaging || "DRUM / TOTE"}</span>
                </div>
                <div className="border-b border-slate-200 pb-3 flex justify-between items-baseline">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Target Category</span>
                  <span className="text-xs font-bold text-[#0A192F] uppercase">{product?.category || "—"}</span>
                </div>
              </div>
            </section>

            {/* 02 / BUYER REQUIREMENTS */}
            <section className="mb-16">
              <div className="border-b-[2px] border-[#0A192F] pb-2 mb-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#0A192F]">
                  02 / Buyer Requirements
                </h2>
              </div>
              
              {rfq.message ? (
                <div className="pl-4 border-l-2 border-slate-300">
                  <p className="text-sm text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                    {rfq.message}
                  </p>
                </div>
              ) : (
                <p className="text-xs font-mono text-slate-500 uppercase">NO ADDITIONAL BUYER REQUIREMENTS SPECIFIED.</p>
              )}
            </section>

            {/* 03 / RFQ DOCUMENTS */}
            <section className="mb-16">
              <div className="border-b-[2px] border-[#0A192F] pb-2 mb-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#0A192F]">
                  03 / RFQ Documents
                </h2>
              </div>
              <GenericDocumentManager
                title="RFQ Attachments"
                description="Technical specifications, NDAs, and other requirements."
                ownerType="RFQ"
                ownerId={rfq.id}
                canUpload={true}
                canDelete={true}
                allowedCategories={[
                  { value: "TECHNICAL_SPECIFICATION", label: "Technical Specification" },
                  { value: "CERTIFICATION", label: "Certification" }
                ]}
                emptyMessage="No documents attached to this RFQ."
              />
            </section>

            {/* 04 / COMMERCIAL QUOTATION & NEGOTIATION */}
            <QuotationComparison
              quotations={quotations}
              rfqStatus={rfq.status}
              rfqId={rfq.id}
              onDecisionSuccess={loadRfqDetail}
              onOpenCounterOffer={() => setIsCounterModalOpen(true)}
            />

            {/* 05 / PROCUREMENT DECISION (ONLY SHOWN IF ACCEPTED) */}
            {rfq.status === "ACCEPTED" && (
              <section className="mb-16">
                <div className="border-b-[2px] border-teal-700 pb-2 mb-6">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-teal-800">
                    05 / Procurement Decision
                  </h2>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600 mb-2">
                      QUOTATION ACCEPTED
                    </span>
                    {existingPo ? (
                      <h3 className="text-2xl font-mono font-bold text-[#0A192F]">
                        {existingPo.poNumber}
                      </h3>
                    ) : (
                      <h3 className="text-2xl font-bold text-[#0A192F]">
                        Ready for Purchase Order
                      </h3>
                    )}
                    <p className="text-xs text-slate-500 font-mono mt-2 max-w-lg">
                      {existingPo 
                        ? `Binding purchase order was issued on ${new Date(existingPo.placedAt).toLocaleDateString("en-GB").toUpperCase()}.` 
                        : "Commercial consensus has been reached. Generate a binding purchase order to initiate supply chain fulfillment."}
                    </p>
                  </div>

                  <div>
                    {existingPo ? (
                      <Link
                        href={`/dashboard/orders/${existingPo.id}`}
                        className="inline-block text-[11px] font-bold uppercase tracking-widest text-teal-600 hover:text-teal-800 transition-colors"
                      >
                        VIEW PURCHASE ORDER →
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsPoModalOpen(true)}
                        className="text-[11px] font-bold uppercase tracking-widest text-teal-600 hover:text-teal-800 transition-colors"
                      >
                        ISSUE PURCHASE ORDER →
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* --- RIGHT RAIL (30%) --- */}
          <aside className="lg:col-span-4 relative">
            <div className="sticky top-12 space-y-16">
              
              {/* SUPPLIER DOSSIER */}
              <section>
                <div className="border-b-[2px] border-[#0A192F] pb-2 mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#0A192F]">
                    Supplier Dossier
                  </h3>
                </div>
                
                <h4 className="text-lg font-bold text-[#0A192F] mb-1">
                  {supplier?.supplierName ?? `Supplier #${rfq.supplierId}`}
                </h4>
                {supplier?.countryName && (
                  <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-6">
                    Origin: {supplier.countryName}
                  </p>
                )}

                {supplier ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-baseline border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Verification</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${supplier.verified ? 'text-teal-600' : 'text-slate-400'}`}>
                        {supplier.verified ? 'VERIFIED' : 'UNVERIFIED'}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Response Rate</span>
                      <span className="font-mono text-[11px] font-bold text-[#0A192F]">{supplier.responseRate}%</span>
                    </div>
                    <div className="flex justify-between items-baseline border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Time in Business</span>
                      <span className="font-mono text-[11px] font-bold text-[#0A192F]">{supplier.yearsInBusiness} YRS</span>
                    </div>
                    <div className="flex justify-between items-baseline border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Compliance</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600">COA / MSDS</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-4">
                    SUPPLIER METADATA NOT AVAILABLE
                  </p>
                )}
              </section>

              {/* PROCUREMENT LIFECYCLE */}
              <section>
                <div className="border-b-[2px] border-slate-900 pb-2 mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#0A192F]">
                    Procurement Lifecycle
                  </h3>
                </div>
                
                <div className="relative border-l border-slate-200 ml-[3px] space-y-8 pb-4">
                  {/* Step 1: Submission */}
                  <div className="relative pl-6">
                    <div className="absolute -left-[3.5px] top-1.5 w-[6px] h-[6px] bg-[#0A192F]" />
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] text-slate-500 mb-1">
                        {new Date(rfq.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                      </span>
                      <span className="text-[11px] font-bold text-[#0A192F] uppercase tracking-widest">
                        RFQ SUBMITTED
                      </span>
                      <span className="font-mono text-[12px] text-slate-700 mt-1">
                        {rfqShortId}
                      </span>
                    </div>
                  </div>

                  {/* Step 2: Quotation */}
                  <div className="relative pl-6">
                    <div className={`absolute -left-[3.5px] top-1.5 w-[6px] h-[6px] ${quotations.length > 0 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] text-slate-500 mb-1">
                        {quotations.length > 0 ? new Date(quotations[0].createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : 'PENDING'}
                      </span>
                      <span className={`text-[11px] font-bold uppercase tracking-widest ${quotations.length > 0 ? 'text-[#0A192F]' : 'text-slate-400'}`}>
                        QUOTATION RECEIVED
                      </span>
                      <span className="font-mono text-[12px] text-slate-700 mt-1">
                        {quotations.length > 0 ? `${quotations.length} REVISION(S)` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Step 3: Decision */}
                  <div className="relative pl-6">
                    <div className={`absolute -left-[3.5px] top-1.5 w-[6px] h-[6px] ${
                      rfq.status === 'ACCEPTED' ? 'bg-teal-600' : 
                      rfq.status === 'REJECTED' ? 'bg-slate-400' : 'bg-slate-200'
                    }`} />
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] text-slate-500 mb-1">
                        {rfq.status === 'ACCEPTED' || rfq.status === 'REJECTED' ? 'LOGGED' : 'PENDING'}
                      </span>
                      <span className={`text-[11px] font-bold uppercase tracking-widest ${
                        rfq.status === 'ACCEPTED' || rfq.status === 'REJECTED' ? 'text-[#0A192F]' : 'text-slate-400'
                      }`}>
                        COMMERCIAL DECISION
                      </span>
                      <span className="font-mono text-[12px] text-slate-700 mt-1">
                        {rfq.status === 'ACCEPTED' ? 'ACCEPTED' : 
                         rfq.status === 'REJECTED' ? 'REJECTED' : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Step 4: PO */}
                  <div className="relative pl-6">
                    <div className={`absolute -left-[3.5px] top-1.5 w-[6px] h-[6px] ${existingPo ? 'bg-[#0A192F]' : 'bg-slate-200'}`} />
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] text-slate-500 mb-1">
                        {existingPo ? new Date(existingPo.placedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : 'PENDING'}
                      </span>
                      <span className={`text-[11px] font-bold uppercase tracking-widest ${existingPo ? 'text-[#0A192F]' : 'text-slate-400'}`}>
                        PURCHASE ORDER ISSUED
                      </span>
                      <span className="font-mono text-[12px] text-slate-700 mt-1">
                        {existingPo ? existingPo.poNumber : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </aside>

        </div>
      </div>

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

      {/* Counter Offer Modal Dialog */}
      {isCounterModalOpen && (
        <CounterOfferModal
          rfqId={rfq.id}
          initialUnitPrice={quotations.length > 0 ? quotations[0].unitPrice : undefined}
          initialCurrency={quotations.length > 0 ? quotations[0].currency : "INR"}
          initialMoq={quotations.length > 0 && quotations[0].minimumOrderQuantity != null ? quotations[0].minimumOrderQuantity : undefined}
          initialLeadTimeDays={quotations.length > 0 && quotations[0].leadTimeDays != null ? quotations[0].leadTimeDays : undefined}
          initialPackaging={quotations.length > 0 && quotations[0].packagingDetails != null ? quotations[0].packagingDetails : undefined}
          onClose={() => setIsCounterModalOpen(false)}
          onSuccess={() => {
            toast.success("Counter offer transmitted to supplier.");
            loadRfqDetail();
          }}
        />
      )}
    </div>
  );
}