"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Filter,
  FlaskConical,
  ShieldCheck,
  Package,
  AlertTriangle,
  GitMerge,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";
import { getAdminMasterProducts, getGovernanceStats, AdminMasterProductSearchCriteria, GovernanceStats } from "@/features/admin/api/adminCatalogApi";

export default function MasterCatalogGovernanceDashboardPage() {
  // Search & Filter State
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("");
  const [page, setPage] = useState(0);

  // Data State
  const [products, setProducts] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [stats, setStats] = useState<GovernanceStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setIsSearching(true);
      setError(null);

      const criteria: AdminMasterProductSearchCriteria = {
        query: query.trim() || undefined,
        category: category || undefined,
        status: status || undefined,
        verifiedSupplier: verifiedFilter === "" ? undefined : verifiedFilter === "true",
        page,
        size: 15,
      };

      const [resData, statsData] = await Promise.all([
        getAdminMasterProducts(criteria),
        getGovernanceStats(),
      ]);

      setProducts(resData.content);
      setTotalPages(resData.totalPages);
      setTotalElements(resData.totalElements);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || "Failed to load master catalog data");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [query, category, status, verifiedFilter, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadData();
  };

  const pendingReqs = stats?.pendingProductRequests ?? stats?.pendingRequests ?? 0;
  const dupeCount = stats?.duplicateCandidatesCount ?? stats?.potentialDuplicates ?? 0;
  const pendingSup = stats?.pendingSupplierVerifications ?? 0;
  const pendingOff = stats?.pendingOfferingReviews ?? 0;
  const flaggedOff = stats?.flaggedOfferingsCount ?? 0;
  const verifiedSup = stats?.verifiedSuppliersCount ?? 0;

  return (
    <div className="max-w-[1400px] mx-auto space-y-7 text-[#0F172A]">
      {/* 1. Technical Eyebrow & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#E4E4E7] pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#0052CC] block mb-1">
            Master Catalog
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A]">
            Catalog Governance
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-xl">
            Master chemical compound registry, supplier commercial offerings, and verification lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadData()}
            className="h-8 px-3 text-xs font-medium text-[#475569] bg-white hover:bg-[#FAFAFA] border border-[#E4E4E7] rounded-[4px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? "animate-spin text-[#0052CC]" : "text-[#64748B]"}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/dashboard/admin/catalog/master-products/new"
            className="h-8 px-3.5 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-[4px] text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Master Product</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-[6px] bg-[#FEF2F2] border border-[rgba(220,38,38,0.2)] text-[#DC2626] text-xs">
          {error}
        </div>
      )}

      {/* 2. Catalog Overview Horizontal Band (Editorial, not 8 giant cards) */}
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-4 shadow-xs">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] mb-3">
          Catalog Overview
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E4E7]">
          <div className="sm:px-3 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Active Products</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5">{stats?.activeMasterProducts || 0}</div>
          </div>
          <div className="sm:px-3 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Supplier Offerings</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5">{stats?.totalOfferings || 0}</div>
          </div>
          <div className="sm:px-3 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Pending Review</span>
            <div className={`text-lg font-bold font-mono mt-0.5 ${pendingOff > 0 ? "text-[#D97706]" : "text-[#0F172A]"}`}>{pendingOff}</div>
          </div>
          <div className="sm:px-3 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Verified Suppliers</span>
            <div className="text-lg font-bold font-mono text-[#059669] mt-0.5">{verifiedSup}</div>
          </div>
          <div className="sm:px-3 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Flagged Offers</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5">{flaggedOff}</div>
          </div>
          <div className="sm:px-3 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Duplicates</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5">{dupeCount}</div>
          </div>
        </div>
      </div>

      {/* 3. Action Required Compact Strip */}
      {(pendingReqs > 0 || pendingOff > 0 || dupeCount > 0) && (
        <div className="p-3 rounded-[6px] bg-[#FFFBEB] border border-[rgba(217,119,6,0.3)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-[#92400E]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
            <span className="font-semibold uppercase text-[10px] tracking-wider">Action Required:</span>
            <span>
              {pendingReqs} product requests · {pendingOff} offering reviews · {dupeCount} duplicate candidates
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {pendingOff > 0 && (
              <Link
                href="/dashboard/admin/catalog/offerings"
                className="h-6 px-2 bg-white hover:bg-[#FAFAFA] text-[#0F172A] border border-[#E4E4E7] text-xs font-medium rounded-[4px] transition-colors shadow-xs flex items-center"
              >
                Review Offerings ({pendingOff})
              </Link>
            )}
            {pendingReqs > 0 && (
              <Link
                href="/dashboard/admin/catalog/requests"
                className="h-6 px-2 bg-white hover:bg-[#FAFAFA] text-[#0F172A] border border-[#E4E4E7] text-xs font-medium rounded-[4px] transition-colors shadow-xs flex items-center"
              >
                Product Requests ({pendingReqs})
              </Link>
            )}
            {dupeCount > 0 && (
              <Link
                href="/dashboard/admin/catalog/duplicates"
                className="h-6 px-2 bg-white hover:bg-[#FAFAFA] text-[#0F172A] border border-[#E4E4E7] text-xs font-medium rounded-[4px] transition-colors shadow-xs flex items-center"
              >
                Duplicates ({dupeCount})
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Multi-Field Server-Side Search Bar */}
      <div className="p-3.5 bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-card space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Master Product by Chemical Name, CAS (e.g. 103-90-2), Code, Formula..."
              className="w-full pl-8.5 pr-3 py-1.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0052CC] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="h-8 px-4 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-[6px] text-xs font-medium transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <span>Search</span>
            )}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] pt-2 border-t border-[#E4E4E7]">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span className="font-medium text-[#0F172A]">Category:</span>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(0); }}
              className="h-7 px-2 bg-[#FAFAFA] border border-[#E4E4E7] rounded-[4px] text-xs text-[#0F172A] focus:outline-none focus:border-[#0052CC]"
            >
              <option value="">All Categories</option>
              <option value="API">API</option>
              <option value="EXCIPIENT">Excipient</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="SOLVENT">Solvent</option>
              <option value="SPECIALTY_CHEMICAL">Specialty Chemical</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-medium text-[#0F172A]">Status:</span>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(0); }}
              className="h-7 px-2 bg-[#FAFAFA] border border-[#E4E4E7] rounded-[4px] text-xs text-[#0F172A] focus:outline-none focus:border-[#0052CC]"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="MERGED">MERGED</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-medium text-[#0F172A]">Verified Suppliers:</span>
            <select
              value={verifiedFilter}
              onChange={(e) => { setVerifiedFilter(e.target.value); setPage(0); }}
              className="h-7 px-2 bg-[#FAFAFA] border border-[#E4E4E7] rounded-[4px] text-xs text-[#0F172A] focus:outline-none focus:border-[#0052CC]"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* Master Products Table */}
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] overflow-hidden shadow-tactile-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-[#E4E4E7] text-[#475569] font-mono font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Code & Name</th>
                <th className="px-4 py-3">CAS & Formula</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Completeness</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Offerings</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7] text-[#0F172A]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#64748B]">Loading Master Catalog Records...</td>
                </tr>
              ) : products.length > 0 ? (
                products.map((mp) => {
                  const score = mp.casNumber && mp.molecularFormula ? 100 : 75;
                  return (
                    <tr key={mp.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-[#0F172A] font-semibold text-xs block">{mp.name}</span>
                        <span className="font-mono text-[10px] text-[#64748B] block mt-0.5">{mp.masterProductCode || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="block font-mono text-[11px] text-[#0F172A]">CAS {mp.casNumber || "—"}</span>
                        <span className="text-[#64748B] text-[10px] block font-mono">{mp.molecularFormula || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#475569]">
                          {mp.category || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            mp.status === "ACTIVE" ? "bg-[#059669]" :
                            mp.status === "MERGED" ? "bg-[#D97706]" : "bg-[#94A3B8]"
                          }`} />
                          <span className={`font-medium ${
                            mp.status === "ACTIVE" ? "text-[#059669]" :
                            mp.status === "MERGED" ? "text-[#D97706]" : "text-[#64748B]"
                          }`}>
                            {mp.status === "ACTIVE" ? "Active" : mp.status === "MERGED" ? "Merged" : (mp.status || "—")}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <span className={`inline-flex px-1.5 py-0.5 rounded-[4px] font-semibold ${score === 100 ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FFFBEB] text-[#D97706]"}`}>
                          {score}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold uppercase border ${
                          score === 100 ? "bg-[#ECFDF5] text-[#059669] border-[rgba(5,150,105,0.2)]" : "bg-[#FFFBEB] text-[#D97706] border-[rgba(217,119,6,0.2)]"
                        }`}>
                          {score === 100 ? "VERIFIED" : "REVIEW"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#0F172A]">
                        {mp.offeringCount} {mp.offeringCount === 1 ? "Offer" : "Offers"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/admin/catalog/master-products/${mp.id}`}
                          className="h-7 px-2.5 bg-white hover:bg-[#FAFAFA] text-[#0F172A] border border-[#E4E4E7] rounded-[4px] text-xs font-medium transition-colors inline-flex items-center gap-1 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>Govern</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#64748B]">No Master Product catalog items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium bg-slate-50/50">
            <span>Showing page <strong>{page + 1}</strong> of <strong>{totalPages}</strong> ({totalElements} items)</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
