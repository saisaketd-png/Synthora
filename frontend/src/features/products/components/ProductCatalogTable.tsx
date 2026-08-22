"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  MapPin,
  FileCheck,
  Building2,
  SlidersHorizontal,
  Star,
  Bookmark,
  ChevronRight,
  Eye,
  CheckCircle2,
  Layers,
  FlaskConical,
  X,
  ExternalLink,
  Loader2,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Product } from "../types/product";
import { fetchProductSuppliers } from "@/lib/api";
import { ProductSupplier } from "./SupplierComparison";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { useToast } from "@/shared/context/ToastContext";
import RfqModal from "../../rfq/components/RfqModal";
import SupplierOfferingModal from "./SupplierOfferingModal";

interface ProductCatalogTableProps {
  products: Product[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function ProductCatalogTable({ products }: ProductCatalogTableProps) {
  const toast = useToast();

  // Offering Cache: mapped by productCode or productId
  const [offeringsCache, setOfferingsCache] = useState<Record<string, ProductSupplier[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});

  // Shortlisted Supplier Offerings
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());

  // Quick Action State for Modals
  const [selectedOfferingDetail, setSelectedOfferingDetail] = useState<{
    offering: ProductSupplier;
    productName: string;
  } | null>(null);

  const [selectedRfqOffering, setSelectedRfqOffering] = useState<{
    offering: ProductSupplier;
    productName: string;
  } | null>(null);

  // Load Shortlists on mount
  useEffect(() => {
    async function loadShortlist() {
      try {
        const res = await authenticatedFetch("/api/v1/buyer/shortlists");
        if (res.ok) {
          const list = await res.json();
          const ids = new Set<string>(
            (list.items || []).map((i: any) => i.supplierOfferingId || i.id)
          );
          setShortlistedIds(ids);
        }
      } catch {
        // Guest user - ignore
      }
    }
    loadShortlist();
  }, []);

  // Fetch Offerings for a given product
  const loadOfferingsForProduct = async (codeOrId: string) => {
    if (offeringsCache[codeOrId] || loadingMap[codeOrId]) return;

    setLoadingMap((prev) => ({ ...prev, [codeOrId]: true }));
    setErrorMap((prev) => ({ ...prev, [codeOrId]: null }));

    try {
      const data = await fetchProductSuppliers(codeOrId);
      setOfferingsCache((prev) => ({ ...prev, [codeOrId]: data }));
    } catch (err: any) {
      setErrorMap((prev) => ({
        ...prev,
        [codeOrId]: err.message || "Failed to load supplier offerings",
      }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [codeOrId]: false }));
    }
  };

  // Pre-fetch offerings on mount
  useEffect(() => {
    products.forEach((p) => {
      const key = p.productCode || p.id;
      if (key && !offeringsCache[key]) {
        loadOfferingsForProduct(key);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  // Toggle Shortlist item
  const toggleShortlist = async (offering: ProductSupplier) => {
    const key = offering.supplierOfferingId || offering.id;
    try {
      const isAlready = shortlistedIds.has(key);
      if (isAlready) {
        setShortlistedIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        toast.info("Removed from your procurement shortlist");
      } else {
        const res = await authenticatedFetch("/api/v1/buyer/shortlists/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplierOfferingId: key,
            notes: "Saved from Chemical Catalog",
          }),
        });
        if (res.ok) {
          setShortlistedIds((prev) => new Set(prev).add(key));
          toast.success("Saved offering to your procurement shortlist");
        } else {
          toast.error("Please log in as a buyer to save shortlists");
        }
      }
    } catch {
      toast.error("Failed to update shortlist");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8" aria-label="Chemical Catalog Entries">
      {products.map((product) => {
        const codeOrId = product.productCode || product.id;
        const offerings = offeringsCache[codeOrId] || [];
        const isLoading = loadingMap[codeOrId];
        const error = errorMap[codeOrId];
        const offeringCount = offerings.length;
        const productUrl = `/products/${product.productCode || product.id}`;

        const resolvedImageUrl = product.primaryImageUrl
          ? product.primaryImageUrl.startsWith("http")
            ? product.primaryImageUrl
            : `${API_URL}${product.primaryImageUrl}`
          : null;

        // Calculate minimum starting price
        const prices = offerings
          .map((o) => o.price)
          .filter((p): p is number => typeof p === "number" && p > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : null;
        const currency = offerings[0]?.currency || "USD";
        const bestSupplier = offerings[0] || null;

        return (
          <article
            key={product.id}
            className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-2xl p-4 sm:p-6 lg:p-7 shadow-sm transition-all space-y-4 sm:space-y-6"
          >
            {/* ======================================================================= */}
            {/* A. MOBILE-FIRST COMPACT CARD (< lg screens: 360px - 1023px)             */}
            {/* ======================================================================= */}
            <div className="block lg:hidden space-y-4">
              {/* 1. Mobile Identity Row: Image + Details */}
              <div className="flex gap-3.5 items-start">
                {/* 110–120px Dedicated Mobile Image Area */}
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 shrink-0 flex items-center justify-center relative overflow-hidden shadow-2xs">
                  {resolvedImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolvedImageUrl}
                      alt={`${product.name} canonical compound`}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#94A3B8] space-y-1">
                      <FlaskConical className="w-8 h-8 stroke-1" />
                      <span className="text-[9px] font-mono font-bold uppercase">Compound</span>
                    </div>
                  )}
                  <div className="absolute top-1.5 left-1.5">
                    <span className="bg-[#E3FCEF] text-[#006644] border border-[#ABF5D1] px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" /> CANONICAL
                    </span>
                  </div>
                </div>

                {/* Right: Chemical Monograph Summary */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {product.category && (
                      <span className="text-[10px] font-bold text-[#0747A6] bg-[#DEEBFF] px-2 py-0.2 rounded font-mono uppercase">
                        {product.category.replace(/_/g, " ")}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-[#006644] bg-[#E3FCEF] px-1.5 py-0.2 rounded font-mono inline-flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                    </span>
                  </div>

                  <Link
                    href={productUrl}
                    className="text-base sm:text-lg font-bold text-[#091E42] hover:text-[#0052CC] uppercase tracking-tight block leading-snug line-clamp-2"
                  >
                    {product.name}
                  </Link>

                  <div className="space-y-0.5 pt-0.5 font-mono text-xs text-[#475569]">
                    <div>
                      <span className="text-[#64748B] font-bold text-[11px]">CAS: </span>
                      <span className="text-[#091E42] font-semibold">{product.casNumber || "N/A"}</span>
                    </div>
                    {product.molecularFormula && (
                      <div>
                        <span className="text-[#64748B] font-bold text-[11px]">Formula: </span>
                        <span className="text-[#091E42] font-semibold">{product.molecularFormula}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Commercial Summary Bar (IndiaMART inspired pricing & availability) */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                    Commercial Sourcing
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    {minPrice !== null ? (
                      <>
                        <span className="text-xs text-[#64748B] font-medium">From</span>
                        <strong className="text-base sm:text-lg font-bold font-mono text-[#091E42]">
                          {currency} {minPrice.toFixed(2)}
                        </strong>
                        <span className="text-xs text-[#64748B]">/ kg</span>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-[#091E42]">
                        Price Available on Inquiry
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0052CC] bg-white border border-[#CBD5E1] px-2.5 py-1 rounded-lg shadow-2xs font-mono">
                    <Building2 className="w-3.5 h-3.5" />
                    {offeringCount} {offeringCount === 1 ? "Supplier" : "Suppliers"}
                  </span>
                </div>
              </div>

              {/* 3. Featured Supplier Preview (If offerings exist) */}
              {bestSupplier && (
                <div className="border border-[#E2E8F0] rounded-xl p-3 bg-white space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-[#DEEBFF] text-[#0747A6] font-bold text-xs flex items-center justify-center font-mono shrink-0">
                        {bestSupplier.name.charAt(0)}
                      </span>
                      <strong className="text-xs sm:text-sm text-[#091E42] truncate">
                        {bestSupplier.name}
                      </strong>
                    </div>

                    <span className="text-[10px] font-bold text-[#006644] bg-[#E3FCEF] border border-[#ABF5D1] px-1.5 py-0.2 rounded shrink-0 font-mono">
                      ✓ Verified
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-[#475569] pt-1 border-t border-[#F1F5F9]">
                    <span className="bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                      Purity: <strong>{bestSupplier.purity || "99%"}</strong>
                    </span>
                    <span className="bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                      MOQ: <strong>{bestSupplier.moqKg ? `${bestSupplier.moqKg} kg` : "50 kg"}</strong>
                    </span>
                    {bestSupplier.coaAvailable && (
                      <span className="text-[#006644] font-bold">✓ COA</span>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Mobile Quick Action Buttons (Stacked, Touch-Friendly 44px) */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Link
                  href={productUrl}
                  className="h-11 px-3 bg-white border border-[#CBD5E1] text-[#091E42] rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-2xs hover:bg-[#F8FAFC]"
                >
                  <span>View Chemical</span>
                  <ChevronRight className="w-4 h-4 text-[#64748B]" />
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedRfqOffering({
                      offering: bestSupplier || {
                        id: product.id,
                        supplierOfferingId: product.id,
                        masterProductId: product.id,
                        supplierId: 1,
                        name: "Verified Supplier",
                        price: minPrice || 0,
                      },
                      productName: product.name,
                    })
                  }
                  className="h-11 px-3 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99]"
                >
                  <span>Request Quote</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ======================================================================= */}
            {/* B. DESKTOP RICH COMPARISON ARCHITECTURE (hidden on mobile, lg:block)     */}
            {/* ======================================================================= */}
            <div className="hidden lg:block space-y-6">
              {/* 1. MASTER CHEMICAL IDENTITY HERO */}
              <div className="flex flex-row gap-6 items-start">
                {/* Dedicated Image Area (180–220px Wide, Contain Mode) */}
                <div className="w-52 h-52 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 shrink-0 flex items-center justify-center relative overflow-hidden">
                  {resolvedImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolvedImageUrl}
                      alt={`${product.name} canonical chemical compound`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#64748B] space-y-2">
                      <FlaskConical className="w-12 h-12 text-[#94A3B8] stroke-1" />
                      <span className="text-[11px] font-mono font-bold uppercase text-[#64748B]">
                        Compound Sample
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className="bg-[#E3FCEF] text-[#006644] border border-[#ABF5D1] px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase flex items-center gap-1"
                      title="Canonical Master Chemical"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> CANONICAL
                    </span>
                  </div>
                </div>

                {/* Chemical Identity & Monograph Details */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {product.category && (
                      <span className="text-xs font-bold text-[#0747A6] bg-[#DEEBFF] px-2.5 py-0.5 rounded-md uppercase font-mono">
                        {product.category.replace(/_/g, " ")}
                      </span>
                    )}
                    {product.productCode && (
                      <span className="font-mono text-xs font-bold text-[#091E42] bg-[#F8FAFC] border border-[#CBD5E1] px-2.5 py-0.5 rounded-md">
                        {product.productCode}
                      </span>
                    )}
                    <span className="text-xs font-bold text-[#006644] bg-[#E3FCEF] border border-[#ABF5D1] px-2.5 py-0.5 rounded-md inline-flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> IDENTITY VERIFIED
                    </span>
                  </div>

                  <div>
                    <Link
                      href={productUrl}
                      className="text-2xl sm:text-[26px] font-bold text-[#091E42] hover:text-[#0052CC] transition-colors uppercase tracking-tight block"
                    >
                      {product.name}
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-[#475569] font-mono">
                    <span className="bg-[#F8FAFC] px-3 py-1 rounded-lg border border-[#E2E8F0]">
                      <strong className="text-[#64748B]">CAS: </strong>
                      <span className="text-[#091E42] font-bold text-sm">{product.casNumber || "N/A"}</span>
                    </span>
                    {product.molecularFormula && (
                      <span className="bg-[#F8FAFC] px-3 py-1 rounded-lg border border-[#E2E8F0]">
                        <strong className="text-[#64748B]">Formula: </strong>
                        <span className="text-[#091E42] font-bold text-sm">{product.molecularFormula}</span>
                      </span>
                    )}
                  </div>

                  {product.description && (
                    <p className="text-sm text-[#475569] leading-relaxed line-clamp-2 pt-0.5">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* View Chemical Monograph CTA */}
                <div className="shrink-0 self-center">
                  <Link
                    href={productUrl}
                    className="h-11 px-5 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#091E42] rounded-xl text-sm font-bold transition-all inline-flex items-center gap-2 shadow-2xs hover:border-[#94A3B8]"
                  >
                    <span>View Chemical Page</span>
                    <ChevronRight className="w-4 h-4 text-[#64748B]" />
                  </Link>
                </div>
              </div>

              {/* 2. DIRECT VISIBLE SUPPLIER AVAILABILITY SECTION */}
              <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#091E42]">
                      Supplier Availability
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                      {offeringCount} {offeringCount === 1 ? "verified supplier offering" : "verified supplier offerings"} · Direct manufacturer procurement terms
                    </p>
                  </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[#64748B]">
                      <Loader2 className="w-4 h-4 animate-spin text-[#0052CC]" />
                      <span>Loading live supplier availability records...</span>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {!isLoading && error && (
                  <div className="bg-[#FFFAE6] border border-[#FFE380] p-4 rounded-xl flex items-center justify-between text-sm text-[#974F0C]">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#FF8B00]" />
                      <span>Unable to retrieve supplier offerings for this chemical.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadOfferingsForProduct(codeOrId)}
                      className="px-3 py-1.5 bg-white border border-[#FFE380] rounded-lg font-bold hover:bg-[#FFF0B3] transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && offerings.length === 0 && (
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-xl text-center space-y-2.5">
                    <p className="text-sm font-bold text-[#091E42]">
                      No verified supplier offerings are currently listed.
                    </p>
                    <p className="text-sm text-[#64748B] max-w-lg mx-auto">
                      Submit a custom sourcing inquiry to request pricing proposals and COAs directly from certified manufacturers.
                    </p>
                    <div className="pt-1">
                      <Link
                        href="/rfq"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>Request Sourcing Quote</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Direct Supplier Offering Rows */}
                {!isLoading && offerings.length > 0 && (
                  <div className="space-y-3.5">
                    {offerings.map((offering, idx) => {
                      const isBestMatch = idx === 0;
                      const isShortlisted = shortlistedIds.has(offering.id);
                      const displayName = offering.name || "Verified Supplier";
                      const priceFormatted =
                        offering.price && offering.price > 0
                          ? `${offering.currency || "USD"} ${offering.price.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}`
                          : "Inquiry Only";

                      return (
                        <div
                          key={offering.id}
                          className="bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#0052CC] rounded-xl p-3.5 sm:p-4 transition-all space-y-3 shadow-2xs"
                        >
                          {/* Top Line: Supplier Logo + Identity + Verification Badge */}
                          <div className="flex flex-row items-center justify-between gap-2.5 border-b border-[#E2E8F0] pb-2.5">
                            <div className="flex items-center gap-2.5">
                              {/* Supplier Logo from backend */}
                              {offering.supplierLogoUrl ? (
                                <div className="w-9 h-9 rounded-lg border border-[#E2E8F0] bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={offering.supplierLogoUrl}
                                    alt={displayName}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-lg border border-[#E2E8F0] bg-[#DEEBFF] text-[#0747A6] font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                                  {displayName.substring(0, 2).toUpperCase()}
                                </div>
                              )}

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Link
                                    href={`/suppliers/${offering.supplierId}`}
                                    className="font-bold text-sm sm:text-base text-[#091E42] hover:text-[#0052CC] transition-colors"
                                  >
                                    {displayName}
                                  </Link>

                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#006644] bg-[#E3FCEF] border border-[#ABF5D1] px-1.5 py-0.5 rounded font-mono">
                                    <ShieldCheck className="w-3 h-3 text-[#00875A]" /> VERIFIED SUPPLIER
                                  </span>

                                  {isBestMatch && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#0747A6] bg-[#DEEBFF] border border-[#B3D4FF] px-1.5 py-0.5 rounded font-mono">
                                      <Star className="w-2.5 h-2.5 fill-[#0747A6]" /> BEST MATCH
                                    </span>
                                  )}

                                  {offering.responseRate !== undefined && offering.responseRate !== null && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#0747A6] bg-[#F4F5F7] border border-[#DFE1E6] px-1.5 py-0.5 rounded font-mono">
                                      <Clock className="w-2.5 h-2.5 text-[#0052CC]" /> {offering.responseRate}% RESPONSE RATE
                                    </span>
                                  )}

                                  {offering.formattedResponseTime && (
                                    <span className="text-[10px] text-[#64748B] font-medium font-mono">
                                      · ~{offering.formattedResponseTime} response
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1.5 font-medium">
                                  <span>Manufacturer / Supplier</span>
                                  {offering.countryName && (
                                    <>
                                      <span>·</span>
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-[#94A3B8]" />
                                        {offering.countryName}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleShortlist(offering)}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isShortlisted
                                    ? "bg-[#FFFAE6] border-[#FFE380] text-[#974F0C]"
                                    : "bg-white border-[#CBD5E1] text-[#64748B] hover:bg-[#F1F5F9]"
                                }`}
                                title={isShortlisted ? "Remove from shortlist" : "Save to shortlist"}
                              >
                                <Bookmark
                                  className={`w-3.5 h-3.5 ${isShortlisted ? "fill-[#974F0C]" : ""}`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Middle: Commercial Metrics Comparison Grid */}
                          <div className="grid grid-cols-5 gap-2.5 sm:gap-3 py-0.5 text-xs">
                            {/* 1. Price (Visually Strongest) */}
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                                PRICE
                              </span>
                              <div className="mt-0.5">
                                <strong className="text-base sm:text-lg font-bold text-[#091E42] font-mono">
                                  {priceFormatted}
                                </strong>
                                {offering.price && offering.price > 0 && (
                                  <span className="text-[10px] text-[#64748B] block">/ kg</span>
                                )}
                              </div>
                            </div>

                            {/* 2. Purity & Grade */}
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                                PURITY & GRADE
                              </span>
                              <div className="mt-0.5">
                                <strong className="text-xs sm:text-sm font-bold text-[#091E42] block">
                                  {offering.purity || "Standard"}
                                </strong>
                                <span className="text-[10px] text-[#64748B]">
                                  {offering.grade || "USP / BP"}
                                </span>
                              </div>
                            </div>

                            {/* 3. MOQ */}
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                                MOQ
                              </span>
                              <div className="mt-0.5">
                                <strong className="text-xs sm:text-sm font-bold text-[#091E42] font-mono block">
                                  {offering.moqKg ? `${offering.moqKg} kg` : "Negotiable"}
                                </strong>
                                <span className="text-[10px] text-[#64748B]">
                                  {offering.packaging || "Standard Drum"}
                                </span>
                              </div>
                            </div>

                            {/* 4. Available Stock */}
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                                AVAILABLE STOCK
                              </span>
                              <div className="mt-0.5">
                                <strong className="text-xs sm:text-sm font-bold text-[#00875A] font-mono block">
                                  {offering.stock ? `${offering.stock.toLocaleString()} kg` : "In stock"}
                                </strong>
                                <span className="text-[10px] text-[#64748B]">Ready for dispatch</span>
                              </div>
                            </div>

                            {/* 5. Lead Time */}
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                                LEAD TIME
                              </span>
                              <div className="mt-0.5">
                                <strong className="text-xs sm:text-sm font-bold text-[#091E42] block">
                                  {offering.leadTimeDays ? `${offering.leadTimeDays} days` : "Immediate"}
                                </strong>
                                <span className="text-[10px] text-[#64748B]">Dispatch timeline</span>
                              </div>
                            </div>
                          </div>

                          {/* Bottom: Verified Documents & Procurement Actions */}
                          <div className="flex flex-row items-center justify-between gap-2.5 pt-2.5 border-t border-[#E2E8F0]">
                            <div className="flex items-center gap-1.5 flex-wrap text-xs font-medium">
                              <span className="text-[#64748B] font-bold text-[10px] uppercase mr-0.5">
                                Documentation:
                              </span>
                              {offering.coaAvailable ? (
                                <span className="inline-flex items-center gap-1 text-[#006644] bg-[#E3FCEF] border border-[#ABF5D1] px-1.5 py-0.5 rounded font-mono text-[9px] font-bold">
                                  <FileCheck className="w-3 h-3 text-[#00875A]" /> COA
                                </span>
                              ) : (
                                <span className="text-[#94A3B8] font-mono text-[10px]">COA on request</span>
                              )}

                              {offering.msdsAvailable ? (
                                <span className="inline-flex items-center gap-1 text-[#006644] bg-[#E3FCEF] border border-[#ABF5D1] px-1.5 py-0.5 rounded font-mono text-[9px] font-bold">
                                  <FileCheck className="w-3 h-3 text-[#00875A]" /> MSDS
                                </span>
                              ) : (
                                <span className="text-[#94A3B8] font-mono text-[10px]">MSDS on request</span>
                              )}

                              {offering.exportReady && (
                                <span className="inline-flex items-center gap-1 text-[#006644] bg-[#E3FCEF] border border-[#ABF5D1] px-1.5 py-0.5 rounded font-mono text-[9px] font-bold">
                                  <ShieldCheck className="w-3 h-3 text-[#00875A]" /> Export Ready
                                </span>
                              )}
                            </div>

                            {/* Procurement Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedOfferingDetail({
                                    offering,
                                    productName: product.name,
                                  })
                                }
                                className="h-8 px-3 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-xs font-semibold text-[#091E42] transition-colors shadow-2xs"
                              >
                                View Offering
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedRfqOffering({
                                    offering,
                                    productName: product.name,
                                  })
                                }
                                className="h-8 px-3.5 sm:px-4 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1 active:scale-[0.99]"
                              >
                                <span>Request Quote</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}

      {/* Premium Supplier Commercial Offering Modal */}
      {selectedOfferingDetail && (
        <SupplierOfferingModal
          offering={{
            id: selectedOfferingDetail.offering.supplierOfferingId || selectedOfferingDetail.offering.id,
            supplierOfferingId: selectedOfferingDetail.offering.supplierOfferingId || selectedOfferingDetail.offering.id,
            masterProductId: selectedOfferingDetail.offering.masterProductId,
            productName: selectedOfferingDetail.productName,
            supplierId: selectedOfferingDetail.offering.supplierId,
            supplierName: selectedOfferingDetail.offering.name,
            supplierLogoUrl: selectedOfferingDetail.offering.supplierLogoUrl,
            supplierVerified: selectedOfferingDetail.offering.verified,
            supplierCountry: selectedOfferingDetail.offering.countryName,
            yearsInBusiness: selectedOfferingDetail.offering.yearsInBusiness,
            responseRate: selectedOfferingDetail.offering.responseRate,
            formattedResponseTime: selectedOfferingDetail.offering.formattedResponseTime,
            price: selectedOfferingDetail.offering.price,
            currency: selectedOfferingDetail.offering.currency,
            stock: selectedOfferingDetail.offering.stock,
            purity: selectedOfferingDetail.offering.purity,
            grade: selectedOfferingDetail.offering.grade,
            moq: selectedOfferingDetail.offering.moq,
            moqKg: selectedOfferingDetail.offering.moqKg,
            packaging: selectedOfferingDetail.offering.packaging,
            leadTime: selectedOfferingDetail.offering.leadTime,
            leadTimeDays: selectedOfferingDetail.offering.leadTimeDays,
            coaAvailable: selectedOfferingDetail.offering.coaAvailable,
            msdsAvailable: selectedOfferingDetail.offering.msdsAvailable,
            exportReady: selectedOfferingDetail.offering.exportReady,
            availabilityStatus: selectedOfferingDetail.offering.availabilityStatus,
            moderationStatus: selectedOfferingDetail.offering.moderationStatus,
          }}
          onClose={() => setSelectedOfferingDetail(null)}
          onRequestQuote={() => {
            const target = selectedOfferingDetail;
            setSelectedOfferingDetail(null);
            setSelectedRfqOffering(target);
          }}
        />
      )}

      {/* RFQ Submission Modal */}
      {selectedRfqOffering && (
        <RfqModal
          isOpen={Boolean(selectedRfqOffering)}
          onClose={() => setSelectedRfqOffering(null)}
          productName={selectedRfqOffering.productName}
          supplierOfferingId={selectedRfqOffering.offering.id}
          masterProductId={selectedRfqOffering.offering.masterProductId}
          supplierId={selectedRfqOffering.offering.supplierId}
          supplierName={selectedRfqOffering.offering.name || "Verified Supplier"}
          supplierCountry={selectedRfqOffering.offering.countryName || "India"}
          defaultQuantity={selectedRfqOffering.offering.moqKg || 50}
        />
      )}
    </div>
  );
}
