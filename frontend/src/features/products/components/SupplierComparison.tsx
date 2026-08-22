"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  MapPin,
  FileCheck,
  Building2,
  SlidersHorizontal,
  Star,
  Bookmark,
  ExternalLink,
  Package,
  Clock,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  X,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { fetchProductSuppliers } from "@/lib/api";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import RfqModal from "../../rfq/components/RfqModal";
import SupplierOfferingModal from "./SupplierOfferingModal";
import { useToast } from "@/shared/context/ToastContext";

export type ProductSupplier = {
  id: string;
  supplierOfferingId: string;
  masterProductId: string;
  supplierId: number;
  name: string;
  price?: number;
  currency?: string;
  stock?: number;
  countryName?: string;
  verified?: boolean;
  yearsInBusiness?: number;
  responseRate?: number | null;
  formattedResponseTime?: string | null;
  exportReady?: boolean;
  purity?: string;
  grade?: string;
  moq?: string;
  moqKg?: number;
  packaging?: string;
  leadTime?: string;
  leadTimeDays?: number;
  coaAvailable?: boolean;
  msdsAvailable?: boolean;
  availabilityStatus?: string;
  moderationStatus?: string;
  supplierLogoUrl?: string;
};

interface SupplierComparisonProps {
  productId: string;
  productName: string;
}

export default function SupplierComparison({ productId, productName }: SupplierComparisonProps) {
  const toast = useToast();
  const [suppliers, setSuppliers] = useState<ProductSupplier[]>([]);
  const [rfqSupplier, setRfqSupplier] = useState<ProductSupplier | null>(null);
  const [detailOffering, setDetailOffering] = useState<ProductSupplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<string>("best_match");
  
  // Filter States
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minPurity, setMinPurity] = useState<string>("");
  const [maxMoq, setMaxMoq] = useState<string>("");
  const [maxLeadTime, setMaxLeadTime] = useState<string>("");
  const [filterCoa, setFilterCoa] = useState<boolean>(false);
  const [filterMsds, setFilterMsds] = useState<boolean>(false);
  const [filterExport, setFilterExport] = useState<boolean>(false);
  
  // Shortlist State
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProductSuppliers(productId);
      setSuppliers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load supplier offerings for this chemical.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // Load Shortlist on mount
  useEffect(() => {
    async function loadShortlist() {
      try {
        const res = await authenticatedFetch("/api/v1/buyer/shortlists");
        if (res.ok) {
          const list = await res.json();
          const ids = new Set<string>((list.items || []).map((i: any) => i.supplierOfferingId));
          setShortlistedIds(ids);
        }
      } catch {
        // Guest - ignore
      }
    }
    loadShortlist();
  }, []);

  const toggleShortlist = async (offering: ProductSupplier) => {
    const key = offering.supplierOfferingId || offering.id;
    try {
      const isAlready = shortlistedIds.has(key);
      if (isAlready) {
        const res = await authenticatedFetch("/api/v1/buyer/shortlists");
        if (res.ok) {
          const list = await res.json();
          const found = list.items?.find((i: any) => i.supplierOfferingId === key);
          if (found) {
            await authenticatedFetch(`/api/v1/buyer/shortlists/items/${found.itemId}`, { method: "DELETE" });
          }
        }
        setShortlistedIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        toast.success("Offering removed from shortlist");
      } else {
        const res = await authenticatedFetch("/api/v1/buyer/shortlists/items", {
          method: "POST",
          body: JSON.stringify({ supplierOfferingId: key }),
        });
        if (!res.ok) throw new Error("Please log in as a buyer to shortlist offerings.");
        setShortlistedIds((prev) => new Set(prev).add(key));
        toast.success("Offering saved to shortlist");
      }
    } catch (err: any) {
      toast.error(err.message || "Shortlist action failed");
    }
  };

  // Filter & Sort Logic
  const filteredList = suppliers
    .filter((s) => {
      if (maxPrice && s.price && s.price > Number(maxPrice)) return false;
      if (minPurity && s.purity) {
        const pNum = parseFloat(s.purity.replace(/[^0-9.]/g, ""));
        if (!isNaN(pNum) && pNum < Number(minPurity)) return false;
      }
      if (maxMoq && s.moqKg && s.moqKg > Number(maxMoq)) return false;
      if (maxLeadTime && s.leadTimeDays && s.leadTimeDays > Number(maxLeadTime)) return false;
      if (filterCoa && !s.coaAvailable) return false;
      if (filterMsds && !s.msdsAvailable) return false;
      if (filterExport && !s.exportReady) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOption === "price_asc") return (a.price || 999999) - (b.price || 999999);
      if (sortOption === "purity_desc") {
        const pA = parseFloat(a.purity?.replace(/[^0-9.]/g, "") || "0");
        const pB = parseFloat(b.purity?.replace(/[^0-9.]/g, "") || "0");
        return pB - pA;
      }
      if (sortOption === "moq_asc") return (a.moqKg || 999999) - (b.moqKg || 999999);
      if (sortOption === "lead_asc") return (a.leadTimeDays || 999) - (b.leadTimeDays || 999);
      return 0;
    });

  return (
    <div className="space-y-5">
      {/* 1. Header & Quick Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-[#DFE1E6] pb-3.5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#091E42] tracking-tight">
            Available Supplier Offerings
          </h2>
          <p className="text-xs text-[#5E6C84] mt-0.5">
            Compare verified suppliers, commercial terms, specifications and documentation.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="text-[11px] font-bold text-[#5E6C84] uppercase">Sort:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-2.5 py-1 bg-white border border-[#DFE1E6] rounded text-xs font-semibold text-[#091E42] focus:outline-none focus:border-[#0052CC]"
          >
            <option value="best_match">Best Commercial Match</option>
            <option value="price_asc">Lowest Price</option>
            <option value="purity_desc">Highest Purity</option>
            <option value="moq_asc">Lowest MOQ</option>
            <option value="lead_asc">Fastest Lead Time</option>
          </select>
        </div>
      </div>

      {/* 2. Compact Procurement Filter Ribbon */}
      <div className="p-3 bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg flex flex-wrap items-center gap-3 text-xs">
        <input
          type="number"
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="px-2.5 py-1 bg-white border border-[#DFE1E6] rounded w-28 text-xs font-medium focus:outline-none focus:border-[#0052CC]"
        />
        <input
          type="number"
          placeholder="Min Purity %"
          value={minPurity}
          onChange={(e) => setMinPurity(e.target.value)}
          className="px-2.5 py-1 bg-white border border-[#DFE1E6] rounded w-28 text-xs font-medium focus:outline-none focus:border-[#0052CC]"
        />
        <input
          type="number"
          placeholder="Max MOQ (kg)"
          value={maxMoq}
          onChange={(e) => setMaxMoq(e.target.value)}
          className="px-2.5 py-1 bg-white border border-[#DFE1E6] rounded w-28 text-xs font-medium focus:outline-none focus:border-[#0052CC]"
        />

        <div className="h-4 w-px bg-[#DFE1E6] hidden sm:block" />

        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-[#172B4D] select-none hover:text-[#091E42]">
          <input
            type="checkbox"
            checked={filterCoa}
            onChange={(e) => setFilterCoa(e.target.checked)}
            className="rounded border-[#DFE1E6] text-[#0052CC]"
          />
          COA Available
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-[#172B4D] select-none hover:text-[#091E42]">
          <input
            type="checkbox"
            checked={filterMsds}
            onChange={(e) => setFilterMsds(e.target.checked)}
            className="rounded border-[#DFE1E6] text-[#0052CC]"
          />
          MSDS Available
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-[#172B4D] select-none hover:text-[#091E42]">
          <input
            type="checkbox"
            checked={filterExport}
            onChange={(e) => setFilterExport(e.target.checked)}
            className="rounded border-[#DFE1E6] text-[#0052CC]"
          />
          Export Ready
        </label>
      </div>

      {/* 3. Loading, Error, Empty, or Populated Offering Cards */}
      {loading ? (
        <div className="bg-white border border-[#DFE1E6] rounded-xl p-8 text-center text-xs text-[#5E6C84]">
          Loading verified supplier offerings...
        </div>
      ) : error ? (
        <div className="bg-[#FFFAE6] border border-[#FFE380] p-4 rounded-xl flex items-center justify-between text-xs text-[#974F0C]">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadSuppliers}
            className="px-2.5 py-1 bg-white border border-[#FFE380] rounded font-bold hover:bg-[#FFF0B3]"
          >
            Retry
          </button>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white border border-[#DFE1E6] rounded-xl p-8 text-center space-y-2">
          <p className="text-sm font-bold text-[#091E42]">No supplier offerings match your criteria.</p>
          <p className="text-xs text-[#5E6C84]">
            Submit a custom RFQ to request quotation proposals directly from verified manufacturers.
          </p>
          <div className="pt-2">
            <Link
              href="/rfq"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-bold rounded"
            >
              <span>Submit Custom Sourcing RFQ</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((offering, idx) => {
            const isBestMatch = idx === 0 && sortOption === "best_match";
            const key = offering.supplierOfferingId || offering.id;
            const isShortlisted = shortlistedIds.has(key);
            const priceFormatted = offering.price && offering.price > 0
              ? `${offering.currency || "USD"} ${offering.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
              : "Inquiry Only";

            return (
              <div
                key={key}
                className="bg-white border border-[#DFE1E6] hover:border-[#0052CC] rounded-xl p-3.5 sm:p-4 transition-colors space-y-3"
              >
                {/* Top Line: Supplier Logo + Identity + Verification Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#DFE1E6] pb-2.5">
                  <div className="flex items-center gap-2.5">
                    {/* Real Supplier Company Logo from backend */}
                    {offering.supplierLogoUrl ? (
                      <div className="w-9 h-9 rounded-lg border border-[#DFE1E6] bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={offering.supplierLogoUrl}
                          alt={offering.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg border border-[#DFE1E6] bg-[#DEEBFF] text-[#0747A6] font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                        {offering.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/suppliers/${offering.supplierId}`}
                          className="font-bold text-sm sm:text-[15px] text-[#091E42] hover:text-[#0052CC] transition-colors"
                        >
                          {offering.name}
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
                          <span className="text-[10px] text-[#5E6C84] font-medium font-mono">
                            · ~{offering.formattedResponseTime} response
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-[#5E6C84] mt-0.5">
                        <span>Manufacturer / Supplier</span>
                        {offering.countryName && <span> · {offering.countryName}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => toggleShortlist(offering)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isShortlisted
                          ? "bg-[#FFFAE6] border-[#FFE380] text-[#974F0C]"
                          : "bg-white border-[#DFE1E6] text-[#5E6C84] hover:bg-[#F4F5F7]"
                      }`}
                      title={isShortlisted ? "Remove from shortlist" : "Save to shortlist"}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isShortlisted ? "fill-[#974F0C]" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Middle: Procurement Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 py-0.5 text-xs">
                  {/* 1. Price */}
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

                  {/* 4. Stock */}
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

                {/* Bottom: Verified Documents & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-[#DFE1E6]">
                  {/* Verified Documentation Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mr-0.5">
                      Documentation:
                    </span>
                    {offering.coaAvailable && (
                      <span className="px-1.5 py-0.5 bg-[#E3FCEF] text-[#006644] border border-[#ABF5D1] rounded font-mono text-[9px] font-bold">
                        ✓ COA
                      </span>
                    )}
                    {offering.msdsAvailable && (
                      <span className="px-1.5 py-0.5 bg-[#DEEBFF] text-[#0747A6] border border-[#B3D4FF] rounded font-mono text-[9px] font-bold">
                        ✓ MSDS
                      </span>
                    )}
                    {offering.exportReady && (
                      <span className="px-1.5 py-0.5 bg-[#E3FCEF] text-[#006644] border border-[#ABF5D1] rounded font-mono text-[9px] font-bold">
                        ✓ Export Ready
                      </span>
                    )}
                    {!offering.coaAvailable && !offering.msdsAvailable && !offering.exportReady && (
                      <span className="text-[10px] text-[#64748B]">Available on request</span>
                    )}
                  </div>

                  {/* Commercial Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDetailOffering(offering)}
                      className="h-8 px-3 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F4F5F7] text-xs font-semibold text-[#091E42] transition-colors shadow-2xs"
                    >
                      View Offering
                    </button>

                    <button
                      type="button"
                      onClick={() => setRfqSupplier(offering)}
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

      {/* RFQ Request Modal */}
      {rfqSupplier && (
        <RfqModal
          isOpen={Boolean(rfqSupplier)}
          onClose={() => setRfqSupplier(null)}
          productId={productId}
          masterProductId={rfqSupplier.masterProductId || productId}
          supplierOfferingId={rfqSupplier.supplierOfferingId || rfqSupplier.id}
          productName={productName}
          supplierId={rfqSupplier.supplierId}
          supplierName={rfqSupplier.name}
          supplierCountry={rfqSupplier.countryName || "India"}
          defaultQuantity={rfqSupplier.moqKg || 50}
        />
      )}

      {/* Premium Supplier Commercial Offering Modal */}
      {detailOffering && (
        <SupplierOfferingModal
          offering={{
            id: detailOffering.supplierOfferingId || detailOffering.id,
            supplierOfferingId: detailOffering.supplierOfferingId || detailOffering.id,
            masterProductId: detailOffering.masterProductId || productId,
            productName: productName,
            supplierId: detailOffering.supplierId,
            supplierName: detailOffering.name,
            supplierLogoUrl: detailOffering.supplierLogoUrl,
            supplierVerified: detailOffering.verified,
            supplierCountry: detailOffering.countryName,
            yearsInBusiness: detailOffering.yearsInBusiness,
            responseRate: detailOffering.responseRate,
            formattedResponseTime: detailOffering.formattedResponseTime,
            price: detailOffering.price,
            currency: detailOffering.currency,
            stock: detailOffering.stock,
            purity: detailOffering.purity,
            grade: detailOffering.grade,
            moq: detailOffering.moq,
            moqKg: detailOffering.moqKg,
            packaging: detailOffering.packaging,
            leadTime: detailOffering.leadTime,
            leadTimeDays: detailOffering.leadTimeDays,
            coaAvailable: detailOffering.coaAvailable,
            msdsAvailable: detailOffering.msdsAvailable,
            exportReady: detailOffering.exportReady,
            availabilityStatus: detailOffering.availabilityStatus,
            moderationStatus: detailOffering.moderationStatus,
          }}
          onClose={() => setDetailOffering(null)}
          onRequestQuote={() => {
            const target = detailOffering;
            setDetailOffering(null);
            setRfqSupplier(target);
          }}
        />
      )}
    </div>
  );
}
