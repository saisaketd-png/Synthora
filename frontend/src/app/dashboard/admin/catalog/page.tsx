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
  const flaggedOff = stats?.flaggedOfferingsCount ?? 0;
  const verifiedSup = stats?.verifiedSuppliersCount ?? 0;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FlaskConical className="w-7 h-7 text-blue-600" />
            MASTER CATALOG GOVERNANCE & OPERATIONS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized canonical chemical compound registry, field verification engine, and governance hub.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadData()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <Link
            href="/dashboard/admin/catalog/master-products/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Master Product
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Action Center Ribbon */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">
              REQUIRES ADMIN ACTION
            </span>
            <div className="text-xs font-bold text-slate-200">
              {stats ? (
                <>
                  <strong className="text-white font-extrabold">{pendingReqs}</strong> Uncatalogued Requests |{" "}
                  <strong className="text-white font-extrabold">{dupeCount}</strong> Duplicate Pairs |{" "}
                  <strong className="text-white font-extrabold">{pendingSup}</strong> Unverified Suppliers |{" "}
                  <strong className="text-white font-extrabold">{flaggedOff}</strong> Flagged Listings
                </>
              ) : (
                "Scanning catalog governance queues..."
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/admin/catalog/requests"
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
          >
            Review Requests ({pendingReqs})
          </Link>
          <Link
            href="/dashboard/admin/catalog/verification"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
          >
            Verify Suppliers ({pendingSup})
          </Link>
          <Link
            href="/dashboard/admin/catalog/duplicates"
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
          >
            Duplicates ({dupeCount})
          </Link>
          <Link
            href="/dashboard/admin/catalog/audit"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors border border-slate-700"
          >
            Audit Logs
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">ACTIVE PRODUCTS</span>
          <strong className="text-xl font-extrabold text-slate-900">{stats?.activeMasterProducts || 0}</strong>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">DRAFT PRODUCTS</span>
          <strong className="text-xl font-extrabold text-slate-900">{stats?.draftMasterProducts || 0}</strong>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block">REQUIRING VERIFICATION</span>
          <strong className="text-xl font-extrabold text-amber-600">{stats?.draftMasterProducts || 0}</strong>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider block">DUPLICATES</span>
          <strong className="text-xl font-extrabold text-purple-600">{dupeCount}</strong>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">TOTAL OFFERINGS</span>
          <strong className="text-xl font-extrabold text-blue-600">{stats?.totalOfferings || 0}</strong>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">VERIFIED SUPPLIERS</span>
          <strong className="text-xl font-extrabold text-emerald-600">{verifiedSup}</strong>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider block">FLAGGED OFFERINGS</span>
          <strong className="text-xl font-extrabold text-rose-600">{flaggedOff}</strong>
        </div>
      </div>

      {/* Multi-Field Server-Side Search Bar */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-2xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Master Product by Chemical Name, CAS (e.g. 103-90-2), Code (e.g. API-MP-100428), Formula..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                SEARCHING...
              </>
            ) : (
              "SEARCH"
            )}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-700">Category:</span>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(0); }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
            >
              <option value="">All Categories</option>
              <option value="API">API</option>
              <option value="EXCIPIENT">Excipient</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="SOLVENT">Solvent</option>
              <option value="SPECIALTY_CHEMICAL">Specialty Chemical</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Status:</span>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(0); }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="MERGED">MERGED</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Verified Suppliers Only:</span>
            <select
              value={verifiedFilter}
              onChange={(e) => { setVerifiedFilter(e.target.value); setPage(0); }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* Master Products Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Code & Name</th>
                <th className="px-4 py-3">CAS & Formula</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Verification Score</th>
                <th className="px-4 py-3">Verification Status</th>
                <th className="px-4 py-3">Offerings</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">Loading Master Catalog Records...</td>
                </tr>
              ) : products.length > 0 ? (
                products.map((mp) => {
                  const score = mp.casNumber && mp.molecularFormula ? 100 : 75;
                  return (
                    <tr key={mp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-[10px] font-bold text-slate-400 block">{mp.masterProductCode}</span>
                        <strong className="text-slate-900 font-bold block">{mp.name}</strong>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="block font-mono text-[11px]">CAS: {mp.casNumber || "N/A"}</span>
                        <span className="text-slate-400 font-mono text-[10px] block">{mp.molecularFormula || "N/A"}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-extrabold rounded uppercase">
                          {mp.category.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          mp.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                          mp.status === "MERGED" ? "bg-purple-50 text-purple-800 border border-purple-200" :
                          "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {mp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${score === 100 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {score}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                          score === 100 ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}>
                          {score === 100 ? "VERIFIED" : "NEEDS REVIEW"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900 block">{mp.offeringCount} Offerings</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/dashboard/admin/catalog/master-products/${mp.id}`}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View / Govern
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">No Master Product catalog items found.</td>
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
