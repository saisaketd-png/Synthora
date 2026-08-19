"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ShieldCheck, MapPin, FileCheck, ChevronRight, Building2, SlidersHorizontal, Star, Info, Bookmark } from "lucide-react";
import Link from "next/link";
import { fetchProductSuppliers } from "@/lib/api";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import RfqModal from "../../rfq/components/RfqModal";

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
  responseRate?: number;
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
};

export default function SupplierComparison({ productId, productName }: { productId: string; productName: string }) {
  const [suppliers, setSuppliers] = useState<ProductSupplier[]>([]);
  const [rfqSupplier, setRfqSupplier] = useState<ProductSupplier | null>(null);
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
  const [shortlistLoading, setShortlistLoading] = useState<string | null>(null);

  // Best Match Explanation Modal State
  const [selectedBestMatch, setSelectedBestMatch] = useState<ProductSupplier | null>(null);

  const loadOfferings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProductSuppliers(productId);
      setSuppliers(data);
    } catch (err: any) {
      setError(err.message || "An error occurred fetching approved supplier offerings");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) loadOfferings();
  }, [productId, loadOfferings]);

  const handleToggleShortlist = async (offering: ProductSupplier) => {
    try {
      setShortlistLoading(offering.supplierOfferingId || offering.id);
      const isAlready = shortlistedIds.has(offering.supplierOfferingId || offering.id);
      
      if (isAlready) {
        // Fetch current shortlist to find item ID
        const res = await authenticatedFetch("/api/v1/buyer/shortlists");
        if (res.ok) {
          const list = await res.json();
          const found = list.items?.find((i: any) => i.supplierOfferingId === (offering.supplierOfferingId || offering.id));
          if (found) {
            await authenticatedFetch(`/api/v1/buyer/shortlists/items/${found.itemId}`, { method: "DELETE" });
          }
        }
        setShortlistedIds((prev) => {
          const next = new Set(prev);
          next.delete(offering.supplierOfferingId || offering.id);
          return next;
        });
      } else {
        const res = await authenticatedFetch("/api/v1/buyer/shortlists/items", {
          method: "POST",
          body: JSON.stringify({ supplierOfferingId: offering.supplierOfferingId || offering.id }),
        });
        if (!res.ok) throw new Error("Please log in as a buyer to shortlist offerings.");
        setShortlistedIds((prev) => new Set(prev).add(offering.supplierOfferingId || offering.id));
      }
    } catch (err: any) {
      alert(err.message || "Shortlist action failed");
    } finally {
      setShortlistLoading(null);
    }
  };

  const getFilteredAndSortedSuppliers = () => {
    let list = [...suppliers];

    // Filters
    if (maxPrice) {
      const limit = parseFloat(maxPrice);
      list = list.filter((s) => (s.price ?? 0) <= limit);
    }
    if (minPurity) {
      const limit = parseFloat(minPurity);
      list = list.filter((s) => parseFloat((s.purity || "0").replace("%", "")) >= limit);
    }
    if (maxMoq) {
      const limit = parseFloat(maxMoq);
      list = list.filter((s) => (s.moqKg ?? Infinity) <= limit);
    }
    if (maxLeadTime) {
      const limit = parseInt(maxLeadTime);
      list = list.filter((s) => (s.leadTimeDays ?? Infinity) <= limit);
    }
    if (filterCoa) {
      list = list.filter((s) => Boolean(s.coaAvailable));
    }
    if (filterMsds) {
      list = list.filter((s) => Boolean(s.msdsAvailable));
    }
    if (filterExport) {
      list = list.filter((s) => Boolean(s.exportReady));
    }

    // Sort
    switch (sortOption) {
      case "price_asc":
        return list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      case "purity_desc":
        return list.sort((a, b) => {
          const pA = parseFloat((a.purity || "0").replace("%", ""));
          const pB = parseFloat((b.purity || "0").replace("%", ""));
          return pB - pA;
        });
      case "moq_asc":
        return list.sort((a, b) => (a.moqKg ?? Infinity) - (b.moqKg ?? Infinity));
      case "lead_asc":
        return list.sort((a, b) => (a.leadTimeDays ?? Infinity) - (b.leadTimeDays ?? Infinity));
      case "best_match":
      default:
        // Score calculation: Verified(20) + COA(10) + MSDS(10) + Export(10) + Purity>=99(10) + MOQ<=100(10) + Lead<=7(10)
        return list.sort((a, b) => {
          const scoreA = (a.verified ? 20 : 0) + (a.coaAvailable ? 10 : 0) + (a.msdsAvailable ? 10 : 0) + (a.exportReady ? 10 : 0) + (parseFloat((a.purity || "0").replace("%", "")) >= 99 ? 10 : 0) + ((a.moqKg || 999) <= 100 ? 10 : 0) + ((a.leadTimeDays || 99) <= 7 ? 10 : 0);
          const scoreB = (b.verified ? 20 : 0) + (b.coaAvailable ? 10 : 0) + (b.msdsAvailable ? 10 : 0) + (b.exportReady ? 10 : 0) + (parseFloat((b.purity || "0").replace("%", "")) >= 99 ? 10 : 0) + ((b.moqKg || 999) <= 100 ? 10 : 0) + ((b.leadTimeDays || 99) <= 7 ? 10 : 0);
          return scoreB - scoreA;
        });
    }
  };

  if (loading) {
    return (
      <div className="mt-12 space-y-4">
        <h2 className="text-2xl font-black text-slate-900">Commercial Supplier Offerings</h2>
        <div className="animate-pulse bg-white border border-slate-200 rounded-3xl p-8 h-64 w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12 bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-3xl text-xs font-medium">
        <p className="font-bold">Error loading supplier offerings</p>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  if (!suppliers || suppliers.length === 0) {
    return (
      <div className="mt-12 bg-white border border-slate-200 p-8 rounded-3xl text-center shadow-2xs">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-black text-slate-900 uppercase">CHEMICAL CURRENTLY BEING ONBOARDED</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          There are currently no approved commercial supplier offerings listed for this chemical compound.
        </p>
      </div>
    );
  }

  const filteredList = getFilteredAndSortedSuppliers();

  return (
    <div className="mt-12 space-y-6">
      {/* Header & Filter Controls Bar */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Approved Supplier Offerings ({filteredList.length})</h2>
            <p className="text-xs text-slate-500 mt-0.5">Compare verified B2B commercial terms, purity specifications, and request quote directly.</p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-bold text-slate-700">Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              <option value="best_match">Best Commercial Match</option>
              <option value="price_asc">Lowest Price</option>
              <option value="purity_desc">Highest Purity</option>
              <option value="moq_asc">Lowest MOQ</option>
              <option value="lead_asc">Shortest Lead Time</option>
            </select>
          </div>
        </div>

        {/* Filter Ribbon */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-wrap items-center gap-3 text-xs font-medium">
          <input
            type="number"
            placeholder="Max Price (INR)"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl w-32"
          />
          <input
            type="number"
            placeholder="Min Purity (%)"
            value={minPurity}
            onChange={(e) => setMinPurity(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl w-32"
          />
          <input
            type="number"
            placeholder="Max MOQ (kg)"
            value={maxMoq}
            onChange={(e) => setMaxMoq(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl w-32"
          />
          <input
            type="number"
            placeholder="Max Lead (days)"
            value={maxLeadTime}
            onChange={(e) => setMaxLeadTime(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl w-32"
          />

          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
            <input type="checkbox" checked={filterCoa} onChange={(e) => setFilterCoa(e.target.checked)} className="rounded" />
            COA
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
            <input type="checkbox" checked={filterMsds} onChange={(e) => setFilterMsds(e.target.checked)} className="rounded" />
            MSDS
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
            <input type="checkbox" checked={filterExport} onChange={(e) => setFilterExport(e.target.checked)} className="rounded" />
            Export Ready
          </label>
        </div>
      </div>

      {/* Enterprise B2B Comparison Table (Desktop) */}
      <div className="hidden lg:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Supplier & Match</th>
              <th className="px-4 py-3">Unit Price</th>
              <th className="px-4 py-3">Purity & Grade</th>
              <th className="px-4 py-3">MOQ & Pack</th>
              <th className="px-4 py-3">Stock & Lead</th>
              <th className="px-4 py-3">Compliance</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredList.map((offering, idx) => {
              const isBest = idx === 0 && sortOption === "best_match";
              const key = offering.supplierOfferingId || offering.id;
              const isShortlisted = shortlistedIds.has(key);

              return (
                <tr key={key} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-extrabold text-sm">{offering.name}</strong>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-black uppercase flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> VERIFIED
                        </span>
                      </div>
                      {isBest && (
                        <button
                          type="button"
                          onClick={() => setSelectedBestMatch(offering)}
                          className="px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-[9px] uppercase rounded-md flex items-center gap-1 hover:brightness-110"
                        >
                          <Star className="w-3 h-3 text-amber-300 fill-amber-300" /> BEST COMMERCIAL MATCH <Info className="w-3 h-3 ml-0.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono font-bold text-slate-900 text-sm">
                    {offering.currency || "INR"} {offering.price?.toLocaleString()} / kg
                  </td>
                  <td className="px-4 py-4">
                    <strong className="text-slate-900 font-bold block">{offering.purity || "N/A"}</strong>
                    <span className="text-slate-500 text-[11px]">{offering.grade || "Standard"}</span>
                  </td>
                  <td className="px-4 py-4">
                    <strong className="text-slate-900 font-bold block font-mono">{offering.moqKg ? `${offering.moqKg} kg` : "N/A"}</strong>
                    <span className="text-slate-500 text-[11px]">{offering.packaging || "Drum"}</span>
                  </td>
                  <td className="px-4 py-4">
                    <strong className="text-slate-900 font-bold block font-mono">{offering.stock ? `${offering.stock} kg` : "Available"}</strong>
                    <span className="text-slate-500 text-[11px]">{offering.leadTimeDays ? `${offering.leadTimeDays} Days` : "Immediate"}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {offering.coaAvailable && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-bold rounded">COA</span>}
                      {offering.msdsAvailable && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-bold rounded">MSDS</span>}
                      {offering.exportReady && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded">Export</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleShortlist(offering)}
                        className={`p-2 rounded-xl border transition-colors ${
                          isShortlisted ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                        }`}
                        title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
                      >
                        <Bookmark className={`w-4 h-4 ${isShortlisted ? "fill-amber-500" : ""}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRfqSupplier(offering)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-2xs"
                      >
                        Request Quote
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-4">
        {filteredList.map((offering) => {
          const key = offering.supplierOfferingId || offering.id;
          const isShortlisted = shortlistedIds.has(key);

          return (
            <div key={key} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <strong className="text-slate-900 font-bold block text-sm">{offering.name}</strong>
                  <span className="text-[10px] text-emerald-700 font-extrabold uppercase">Verified Supplier</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleShortlist(offering)}
                  className={`p-2 rounded-xl border ${isShortlisted ? "bg-amber-50 text-amber-700 border-amber-300" : "bg-slate-50 text-slate-500 border-slate-200"}`}
                >
                  <Bookmark className={`w-4 h-4 ${isShortlisted ? "fill-amber-500" : ""}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Price</span>
                  <strong className="text-slate-900 font-mono">{offering.currency || "INR"} {offering.price?.toLocaleString()} / kg</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Purity</span>
                  <strong className="text-slate-900">{offering.purity || "N/A"} ({offering.grade || "Standard"})</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">MOQ</span>
                  <strong className="text-slate-900">{offering.moqKg ? `${offering.moqKg} kg` : "N/A"}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Lead Time</span>
                  <strong className="text-slate-900">{offering.leadTimeDays ? `${offering.leadTimeDays} Days` : "Immediate"}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRfqSupplier(offering)}
                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs"
              >
                Request Quote
              </button>
            </div>
          );
        })}
      </div>

      {/* Best Match Explanation Modal */}
      {selectedBestMatch && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-900 font-black text-base">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              BEST COMMERCIAL MATCH EXPLANATION
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This offering was deterministically ranked as a Best Commercial Match based on objective B2B procurement metrics:
            </p>
            <ul className="space-y-2 text-xs font-bold text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <li className="flex items-center gap-2 text-emerald-700">✓ Verified Corporate Identity</li>
              <li className="flex items-center gap-2 text-emerald-700">✓ Verified Commercial Specification</li>
              {selectedBestMatch.coaAvailable && <li className="flex items-center gap-2 text-emerald-700">✓ Certificate of Analysis (COA) Included</li>}
              {selectedBestMatch.msdsAvailable && <li className="flex items-center gap-2 text-emerald-700">✓ Material Safety Data Sheet (MSDS) Included</li>}
              {selectedBestMatch.exportReady && <li className="flex items-center gap-2 text-emerald-700">✓ Global Export & Logistics Ready</li>}
              <li className="flex items-center gap-2 text-emerald-700">✓ Competitive Pricing & Flexible MOQ</li>
            </ul>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBestMatch(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {rfqSupplier && (
        <RfqModal
          isOpen={!!rfqSupplier}
          onClose={() => setRfqSupplier(null)}
          masterProductId={rfqSupplier.masterProductId}
          supplierOfferingId={rfqSupplier.supplierOfferingId}
          productName={productName}
          supplierId={rfqSupplier.supplierId}
          supplierName={rfqSupplier.name}
          supplierCountry={rfqSupplier.countryName || "India"}
          defaultQuantity={rfqSupplier.moqKg}
        />
      )}
    </div>
  );
}
