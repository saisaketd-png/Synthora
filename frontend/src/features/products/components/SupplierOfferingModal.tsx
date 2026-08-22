"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  ShieldCheck,
  Clock,
  Building2,
  ExternalLink,
  FileText,
  Download,
  ChevronRight,
  Package,
  CheckCircle2,
  MapPin,
  Maximize2,
  FileCheck,
  Truck,
  Sparkles,
  Layers,
  FlaskConical,
  Eye,
} from "lucide-react";
import { getDocuments, downloadDocument, DocumentResponse } from "@/features/documents/api/documentApi";
import { SupplierPerformance } from "@/features/suppliers/types";
import { resolveApiUrl } from "@/lib/apiUrl";

export interface SupplierOfferingModalData {
  id?: string;
  supplierOfferingId?: string;
  masterProductId?: string;
  masterProductCode?: string;
  productName?: string;
  casNumber?: string;
  molecularFormula?: string;
  category?: string;
  supplierId: number;
  supplierName: string;
  supplierLogoUrl?: string | null;
  supplierVerified?: boolean;
  supplierCountry?: string;
  yearsInBusiness?: number;
  responseRate?: number | null;
  averageResponseTimeSeconds?: number | null;
  formattedResponseTime?: string | null;
  eligibleRfqs?: number | null;
  respondedRfqs?: number | null;
  price?: number | null;
  currency?: string | null;
  stock?: number | null;
  purity?: string | number | null;
  grade?: string | null;
  moq?: string | null;
  moqKg?: number | null;
  packaging?: string | null;
  leadTime?: string | null;
  leadTimeDays?: number | null;
  paymentTerms?: string | null;
  incoterms?: string | null;
  coaAvailable?: boolean | null;
  msdsAvailable?: boolean | null;
  exportReady?: boolean | null;
  availabilityStatus?: string | null;
  moderationStatus?: string | null;
}

interface SupplierOfferingModalProps {
  offering: SupplierOfferingModalData;
  onClose: () => void;
  onRequestQuote: (offering: SupplierOfferingModalData) => void;
}

interface ImageItem {
  id: string;
  imageUrl?: string;
  isPrimary?: boolean;
  altText?: string;
}

export default function SupplierOfferingModal({
  offering,
  onClose,
  onRequestQuote,
}: SupplierOfferingModalProps) {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [loadingImages, setLoadingImages] = useState(true);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const [performance, setPerformance] = useState<SupplierPerformance | null>(null);
  const [loadingPerf, setLoadingPerf] = useState(false);

  const offeringId = offering.supplierOfferingId || offering.id;
  const masterProductId = offering.masterProductId;

  // 1. Fetch Dynamic Supplier Performance if not passed or to ensure freshest data
  useEffect(() => {
    let isMounted = true;
    if (offering.supplierId) {
      setLoadingPerf(true);
      fetch(resolveApiUrl(`/api/v1/suppliers/${offering.supplierId}/performance`))
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data) {
            setPerformance(data);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoadingPerf(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [offering.supplierId]);

  // 2. Fetch Real Supplier Offering Documents
  useEffect(() => {
    let isMounted = true;
    async function loadOfferingDocuments() {
      setLoadingDocs(true);
      try {
        let docs: DocumentResponse[] = [];
        if (offeringId) {
          try {
            docs = await getDocuments("SUPPLIER_OFFERING", offeringId);
          } catch {}
        }
        if ((!docs || docs.length === 0) && masterProductId) {
          try {
            docs = await getDocuments("MASTER_PRODUCT", masterProductId);
          } catch {}
        }
        if (isMounted) {
          setDocuments(docs || []);
        }
      } catch {
        if (isMounted) setDocuments([]);
      } finally {
        if (isMounted) setLoadingDocs(false);
      }
    }
    loadOfferingDocuments();
    return () => {
      isMounted = false;
    };
  }, [offeringId, masterProductId]);

  // 3. Fetch Real Product / Offering Images
  useEffect(() => {
    let isMounted = true;
    async function loadOfferingImages() {
      setLoadingImages(true);
      try {
        let loadedImages: ImageItem[] = [];

        // Check offering specific images
        if (offeringId) {
          try {
            const res = await fetch(resolveApiUrl(`/api/v1/supplier/offerings/${offeringId}/images`));
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data) && data.length > 0) {
                loadedImages = data.map((img: any) => ({
                  id: img.id,
                  imageUrl: img.imageUrl || resolveApiUrl(`/api/v1/supplier/offerings/${offeringId}/images/${img.id}/content`),
                  isPrimary: img.isPrimary,
                  altText: img.altText,
                }));
              }
            }
          } catch {}
        }

        // Fallback to master product canonical images
        if (loadedImages.length === 0 && masterProductId) {
          try {
            const res = await fetch(resolveApiUrl(`/api/v1/master-products/${masterProductId}/images`));
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data) && data.length > 0) {
                loadedImages = data.map((img: any) => ({
                  id: img.id,
                  imageUrl: img.imageUrl || resolveApiUrl(`/api/v1/master-products/${masterProductId}/images/${img.id}/content`),
                  isPrimary: img.isPrimary,
                  altText: img.altText,
                }));
              }
            }
          } catch {}
        }

        if (isMounted) {
          setImages(loadedImages);
          const primaryIdx = loadedImages.findIndex((i) => i.isPrimary);
          setSelectedImageIndex(primaryIdx >= 0 ? primaryIdx : 0);
        }
      } catch {
        if (isMounted) setImages([]);
      } finally {
        if (isMounted) setLoadingImages(false);
      }
    }
    loadOfferingImages();
    return () => {
      isMounted = false;
    };
  }, [offeringId, masterProductId]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isZoomOpen) setIsZoomOpen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isZoomOpen]);

  const handleDocumentDownload = async (doc: DocumentResponse) => {
    try {
      setDownloadingDocId(doc.id);
      await downloadDocument(doc.id, doc.originalFileName || "document.pdf");
    } catch {
      window.open(resolveApiUrl(`/api/v1/documents/${doc.id}/download`), "_blank");
    } finally {
      setDownloadingDocId(null);
    }
  };

  // Resolve active response rate and time
  const effectiveResponseRate =
    performance?.responseRate ?? offering.responseRate;
  const effectiveResponseTime =
    performance?.formattedResponseTime ?? offering.formattedResponseTime;

  const currentActiveImage = images[selectedImageIndex]?.imageUrl || null;

  // Format Price
  const formattedPrice =
    offering.price && offering.price > 0
      ? `${offering.currency || "USD"} ${offering.price.toLocaleString(undefined, { minimumFractionDigits: 2 })} / kg`
      : "Inquiry Only";

  // Format Purity
  const formattedPurity =
    offering.purity != null
      ? typeof offering.purity === "number"
        ? `${offering.purity}%`
        : offering.purity.toString().includes("%")
        ? offering.purity
        : `${offering.purity}%`
      : "Standard Grade";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#091E42]/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden my-auto text-[#091E42]">
        
        {/* ===================================================
            1. MODAL HEADER & CONTEXT
        =================================================== */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-[#0052CC] bg-[#DEEBFF] px-2 py-0.5 rounded">
                Supplier Commercial Offering
              </span>
              {offering.category && (
                <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded uppercase font-mono">
                  {offering.category}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#091E42] tracking-tight">
                {offering.productName || "Chemical Compound"}
              </h2>
              <span className="text-sm font-semibold text-[#64748B]">·</span>
              <span className="text-sm font-bold text-[#334155]">
                {offering.supplierName}
              </span>
              {offering.casNumber && (
                <span className="text-xs font-mono text-[#64748B] bg-white border border-[#E2E8F0] px-1.5 py-0.5 rounded">
                  CAS {offering.casNumber}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 pt-0.5 flex-wrap text-xs">
              {(offering.supplierVerified ?? true) && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006644] bg-[#E3FCEF] border border-[#ABF5D1] px-2 py-0.5 rounded-full font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Supplier
                </span>
              )}
              <Link
                href={`/suppliers/${offering.supplierId}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0052CC] hover:text-[#0747A6] hover:underline"
              >
                <span>View Supplier Profile</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#091E42] hover:bg-[#E2E8F0] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===================================================
            SCROLLABLE BODY
        =================================================== */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm">

          {/* ===================================================
              2. TOP SECTION: PRODUCT IMAGE & SUPPLIER PERFORMANCE
          =================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">
            
            {/* Left: Product / Offering Image Gallery (5 cols) */}
            <div className="sm:col-span-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex flex-col justify-between space-y-2">
              <div className="relative w-full h-44 sm:h-48 bg-white border border-[#E2E8F0] rounded-lg overflow-hidden flex items-center justify-center group">
                {currentActiveImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentActiveImage}
                      alt={offering.productName || "Chemical Offering"}
                      className="w-full h-full object-contain p-2 cursor-pointer transition-transform group-hover:scale-105"
                      onClick={() => setIsZoomOpen(true)}
                    />
                    <button
                      type="button"
                      onClick={() => setIsZoomOpen(true)}
                      className="absolute bottom-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Enlarge Image"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#94A3B8] p-4 text-center space-y-1.5">
                    <FlaskConical className="w-10 h-10 text-[#CBD5E1]" />
                    <span className="text-xs font-mono font-medium">Standard Chemical Sample</span>
                  </div>
                )}
              </div>

              {/* Thumbnails if multiple images exist */}
              {images.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-10 h-10 rounded border shrink-0 bg-white p-0.5 overflow-hidden transition-all ${
                        selectedImageIndex === idx
                          ? "border-[#0052CC] ring-2 ring-[#0052CC]/20"
                          : "border-[#E2E8F0] hover:border-[#94A3B8]"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.imageUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Supplier Performance & Reliability Strip (7 cols) */}
            <div className="sm:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#0052CC]" />
                    Supplier RFQ Reliability
                  </span>
                  <span className="text-[10px] text-[#64748B] font-mono">Live Metrics</span>
                </div>
                <p className="text-xs text-[#64748B]">
                  Calculated dynamically from verified RFQ delivery and quotation timestamps.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Metric 1: Response Rate */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Response Rate
                  </span>
                  {effectiveResponseRate !== null && effectiveResponseRate !== undefined ? (
                    <div className="flex items-baseline gap-1">
                      <strong className="text-2xl font-black font-mono text-[#0052CC]">
                        {effectiveResponseRate}%
                      </strong>
                    </div>
                  ) : (
                    <div className="text-xs font-medium text-[#94A3B8] italic pt-1">
                      No response history yet
                    </div>
                  )}
                  <span className="text-[10px] text-[#64748B] block">
                    {effectiveResponseRate !== null && effectiveResponseRate !== undefined
                      ? "Eligible RFQs answered"
                      : "Pending initial RFQs"}
                  </span>
                </div>

                {/* Metric 2: Average Response Time */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Avg. Response Time
                  </span>
                  {effectiveResponseTime ? (
                    <div className="flex items-baseline gap-1">
                      <strong className="text-2xl font-black font-mono text-[#091E42]">
                        {effectiveResponseTime}
                      </strong>
                    </div>
                  ) : (
                    <div className="text-xs font-medium text-[#94A3B8] italic pt-1">
                      Not yet available
                    </div>
                  )}
                  <span className="text-[10px] text-[#64748B] block">
                    {effectiveResponseTime ? "From inquiry to quote" : "Awaiting response data"}
                  </span>
                </div>
              </div>

              {/* Verified Supplier Corporate Guarantee */}
              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-[#0052CC]" />
                  {offering.supplierCountry ? `Direct from ${offering.supplierCountry}` : "Verified Manufacturer"}
                </span>
                {offering.exportReady && (
                  <span className="font-bold text-[#006644] font-mono text-[11px]">
                    ✓ Export Ready
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* ===================================================
              3. COMMERCIAL TERMS GRID
          =================================================== */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#0052CC]" />
              Commercial & Specification Terms
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
              {/* 1. Price */}
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">Price</span>
                <strong className="text-sm font-extrabold text-[#091E42] font-mono block truncate">
                  {formattedPrice}
                </strong>
              </div>

              {/* 2. Purity */}
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">Purity</span>
                <strong className="text-sm font-bold text-[#091E42] block truncate">
                  {formattedPurity}
                </strong>
              </div>

              {/* 3. Grade */}
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">Grade</span>
                <strong className="text-sm font-bold text-[#091E42] block truncate">
                  {offering.grade || "Pharma / USP"}
                </strong>
              </div>

              {/* 4. MOQ */}
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">Min. Order (MOQ)</span>
                <strong className="text-sm font-bold text-[#091E42] font-mono block truncate">
                  {offering.moqKg ? `${offering.moqKg} kg` : offering.moq || "Negotiable"}
                </strong>
              </div>

              {/* 5. Stock */}
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">Available Stock</span>
                <strong className="text-sm font-bold text-[#00875A] font-mono block truncate">
                  {offering.stock ? `${offering.stock.toLocaleString()} kg` : "In Stock"}
                </strong>
              </div>

              {/* 6. Lead Time */}
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">Lead Time</span>
                <strong className="text-sm font-bold text-[#091E42] block truncate">
                  {offering.leadTimeDays ? `${offering.leadTimeDays} days` : offering.leadTime || "Immediate"}
                </strong>
              </div>
            </div>

            {/* Optional Secondary Commercial Terms: Packaging / Payment / Incoterms */}
            {(offering.packaging || offering.paymentTerms || offering.incoterms) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {offering.packaging && (
                  <div className="bg-white border border-[#E2E8F0] p-2.5 rounded-lg flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-bold block">Packaging</span>
                      <span className="font-semibold text-[#091E42]">{offering.packaging}</span>
                    </div>
                  </div>
                )}
                {offering.paymentTerms && (
                  <div className="bg-white border border-[#E2E8F0] p-2.5 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-bold block">Payment Terms</span>
                      <span className="font-semibold text-[#091E42]">{offering.paymentTerms}</span>
                    </div>
                  </div>
                )}
                {offering.incoterms && (
                  <div className="bg-white border border-[#E2E8F0] p-2.5 rounded-lg flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-bold block">Incoterms</span>
                      <span className="font-semibold text-[#091E42]">{offering.incoterms}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ===================================================
              4. SUPPLIER COMMERCIAL DOCUMENTS (REAL DATA)
          =================================================== */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-[#0052CC]" />
                Commercial Documentation & Compliance
              </h3>
              <span className="text-[11px] text-[#64748B] font-mono">
                {documents.length} {documents.length === 1 ? "document" : "documents"} available
              </span>
            </div>

            {loadingDocs ? (
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center text-xs text-[#64748B]">
                Loading verified commercial documents...
              </div>
            ) : documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {documents.map((doc) => {
                  const isDownloading = downloadingDocId === doc.id;
                  return (
                    <div
                      key={doc.id}
                      className="bg-white border border-[#E2E8F0] hover:border-[#0052CC] p-3 rounded-xl transition-all shadow-2xs flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#EFF4FF] text-[#0052CC] flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold font-mono text-[#0052CC] uppercase block">
                            {doc.category ? doc.category.replace(/_/g, " ") : "Document"}
                          </span>
                          <span
                            className="text-xs font-semibold text-[#091E42] block truncate"
                            title={doc.originalFileName}
                          >
                            {doc.originalFileName}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-[#F1F5F9] flex items-center justify-between">
                        <span className="text-[10px] text-[#64748B] font-mono">
                          {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : "PDF"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDocumentDownload(doc)}
                          disabled={isDownloading}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0052CC] hover:text-[#0747A6] px-2 py-1 rounded hover:bg-[#DEEBFF] transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>{isDownloading ? "Downloading..." : "View / Download"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-xl text-center space-y-1">
                <p className="text-xs text-[#64748B]">
                  No commercial documents have been uploaded for this offering.
                </p>
                <p className="text-[11px] text-[#94A3B8]">
                  You can request a Certificate of Analysis (COA) or MSDS directly through the quotation request.
                </p>
              </div>
            )}
          </div>

          {/* ===================================================
              5. SUPPLIER IDENTITY & PROFILE BANNER
          =================================================== */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {offering.supplierLogoUrl ? (
                <div className="w-10 h-10 rounded-lg border border-[#CBD5E1] bg-white p-1 flex items-center justify-center overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={offering.supplierLogoUrl}
                    alt={offering.supplierName}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[#DEEBFF] text-[#0052CC] font-bold text-xs flex items-center justify-center shrink-0">
                  {offering.supplierName.substring(0, 2).toUpperCase()}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/suppliers/${offering.supplierId}`}
                    className="font-bold text-sm text-[#091E42] hover:text-[#0052CC] transition-colors"
                  >
                    {offering.supplierName}
                  </Link>
                  {(offering.supplierVerified ?? true) && (
                    <span className="text-[10px] font-bold text-[#006644] bg-[#E3FCEF] px-1.5 py-0.2 rounded font-mono">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#64748B] flex items-center gap-2">
                  <span>Manufacturer / Supplier</span>
                  {offering.supplierCountry && <span>· {offering.supplierCountry}</span>}
                </div>
              </div>
            </div>

            <Link
              href={`/suppliers/${offering.supplierId}`}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-xs font-bold text-[#091E42] transition-colors shrink-0"
            >
              <span>View Supplier Profile</span>
              <ExternalLink className="w-3 h-3 text-[#64748B]" />
            </Link>
          </div>

        </div>

        {/* ===================================================
            6. MODAL FOOTER & PRIMARY ACTIONS (STICKY)
        =================================================== */}
        <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#64748B] hidden sm:block">
            <span>Direct negotiation & audit protection backed by Synthora.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-xs sm:text-sm font-semibold text-[#334155] hover:bg-[#F1F5F9] transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onRequestQuote(offering)}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <span>Request Quotation</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Fullscreen Image Zoom Overlay */}
      {isZoomOpen && currentActiveImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full"
            aria-label="Close image zoom"
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentActiveImage}
            alt="Enlarged Preview"
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
