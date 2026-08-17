"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Inbox,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  X,
  FileText,
  Send,
} from "lucide-react";

import { getSupplierRfqs, SupplierRfq } from "@/features/rfq/api/getSupplierRfqs";

type StatusFilter = "ALL" | "PENDING" | "QUOTED" | "ACCEPTED" | "REJECTED";
type SortOption = "DATE_DESC" | "DATE_ASC" | "QTY_DESC" | "QTY_ASC";

export default function SupplierRfqsPage() {
  const router = useRouter();

  const [rfqs, setRfqs] = useState<SupplierRfq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort State
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("DATE_DESC");

  const loadRfqs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupplierRfqs();
      setRfqs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load supplier RFQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRfqs();
  }, []);

  // Derived KPI Counts
  const totalCount = rfqs.length;
  const pendingCount = useMemo(
    () =>
      rfqs.filter((r) => r.status === "PENDING" || r.status === "CONTACTED")
        .length,
    [rfqs]
  );
  const quotedCount = useMemo(
    () => rfqs.filter((r) => r.status === "QUOTED").length,
    [rfqs]
  );
  const acceptedCount = useMemo(
    () => rfqs.filter((r) => r.status === "ACCEPTED").length,
    [rfqs]
  );
  const rejectedCount = useMemo(
    () => rfqs.filter((r) => r.status === "REJECTED").length,
    [rfqs]
  );

  // Client-side Filter & Sort
  const filteredRfqs = useMemo(() => {
    return rfqs
      .filter((rfq) => {
        // Status filter mapping
        if (
          statusFilter === "PENDING" &&
          rfq.status !== "PENDING" &&
          rfq.status !== "CONTACTED"
        )
          return false;
        if (statusFilter === "QUOTED" && rfq.status !== "QUOTED") return false;
        if (statusFilter === "ACCEPTED" && rfq.status !== "ACCEPTED") return false;
        if (statusFilter === "REJECTED" && rfq.status !== "REJECTED") return false;

        // Search query filter (Reference, Product Name, Buyer Name, or IDs)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesRef = (rfq.rfqReference || "").toLowerCase().includes(q);
          const matchesId = rfq.id.toLowerCase().includes(q);
          const matchesProduct =
            (rfq.productName || "").toLowerCase().includes(q) ||
            rfq.productId.toLowerCase().includes(q);
          const matchesBuyer =
            (rfq.buyerName || "").toLowerCase().includes(q) ||
            rfq.buyerId.toLowerCase().includes(q);
          return matchesRef || matchesId || matchesProduct || matchesBuyer;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "DATE_DESC") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "DATE_ASC") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "QTY_DESC") {
          return b.quantity - a.quantity;
        }
        if (sortBy === "QTY_ASC") {
          return a.quantity - b.quantity;
        }
        return 0;
      });
  }, [rfqs, statusFilter, searchQuery, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== "ALL";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setSortBy("DATE_DESC");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "QUOTED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "PENDING":
      case "CONTACTED":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "CLOSED":
      case "CANCELLED":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Loading Skeleton View
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded-md" />
            <div className="h-8 w-48 bg-slate-200 rounded-lg" />
            <div className="h-4 w-80 bg-slate-200 rounded-md" />
          </div>
        </div>

        {/* KPI Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-white border border-slate-200 rounded-2xl p-4" />
          ))}
        </div>

        {/* Filter Bar Skeleton */}
        <div className="h-12 bg-white border border-slate-200 rounded-2xl" />

        {/* Table Skeleton */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error State View
  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-rose-800 space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Unable to Load RFQs</h2>
              <p className="text-sm text-slate-600 mt-0.5">{error}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={loadRfqs}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Request
            </button>
            <Link
              href="/dashboard/supplier"
              className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#17B5AE]/10 text-[#0d7d78] border border-[#17B5AE]/30">
              Supplier Workspace
            </span>
            <span className="text-xs text-slate-400 font-medium">Inquiry Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Supplier RFQ Inbox
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review incoming requests for quote from verified chemical buyers, formulate commercial terms, and submit quotations.
          </p>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              statusFilter === "ALL" ? "text-slate-300" : "text-slate-400"
            }`}
          >
            Total Inquiries
          </span>
          <p className="text-2xl font-extrabold mt-1 tracking-tight">{totalCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("PENDING")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "PENDING"
              ? "bg-amber-600 text-white border-amber-600 shadow-sm"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
              statusFilter === "PENDING" ? "text-amber-100" : "text-amber-600"
            }`}
          >
            <Clock className="w-3 h-3" />
            Awaiting Quote
          </span>
          <p className="text-2xl font-extrabold mt-1 tracking-tight">{pendingCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("QUOTED")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "QUOTED"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
              statusFilter === "QUOTED" ? "text-blue-100" : "text-blue-600"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Quoted (Active)
          </span>
          <p className="text-2xl font-extrabold mt-1 tracking-tight">{quotedCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("ACCEPTED")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "ACCEPTED"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
              statusFilter === "ACCEPTED" ? "text-emerald-100" : "text-emerald-600"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Accepted
          </span>
          <p className="text-2xl font-extrabold mt-1 tracking-tight">{acceptedCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("REJECTED")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "REJECTED"
              ? "bg-rose-600 text-white border-rose-600 shadow-sm"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
              statusFilter === "REJECTED" ? "text-rose-100" : "text-rose-600"
            }`}
          >
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
          <p className="text-2xl font-extrabold mt-1 tracking-tight">{rejectedCount}</p>
        </button>
      </div>

      {/* Control Bar: Search & Status Filter Tabs & Sorter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by RFQ reference, product name, or buyer company..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Action Controls: Filter Badges & Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "PENDING"
                  ? "bg-white text-amber-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Awaiting Quote ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("QUOTED")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "QUOTED"
                  ? "bg-white text-blue-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Quoted ({quotedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACCEPTED")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "ACCEPTED"
                  ? "bg-white text-emerald-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Accepted ({acceptedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("REJECTED")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "REJECTED"
                  ? "bg-white text-rose-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-slate-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="DATE_DESC">Newest First</option>
              <option value="DATE_ASC">Oldest First</option>
              <option value="QTY_DESC">Highest Quantity</option>
              <option value="QTY_ASC">Lowest Quantity</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Zero Total vs Filtered Empty vs Data Grid */}
      {rfqs.length === 0 ? (
        // True Zero Empty State
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <Inbox className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            No RFQs received yet
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            When buyers submit procurement inquiries for your catalog materials, they will appear here for commercial review and quotation.
          </p>
        </div>
      ) : filteredRfqs.length === 0 ? (
        // Filtered Empty State
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No RFQs match your current filters
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or switching status filters to view other buyer inquiries.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        // Enterprise Data Grid
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3.5">RFQ Reference</th>
                  <th className="px-6 py-3.5">Product / Chemical</th>
                  <th className="px-6 py-3.5">Buyer Organization</th>
                  <th className="px-6 py-3.5 text-right">Quantity</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5">Submitted Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRfqs.map((rfq) => (
                  <tr
                    key={rfq.id}
                    onClick={() => router.push(`/dashboard/supplier/rfqs/${rfq.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <span>{rfq.productName || "Specialty Chemical Raw Material"}</span>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-1">
                        {rfq.buyerName || "Buyer Organization"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {rfq.quantity.toLocaleString()} {rfq.unit}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                          rfq.status
                        )}`}
                      >
                        {rfq.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      {new Date(rfq.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/supplier/rfqs/${rfq.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0d7d78] hover:text-[#0b635f] group-hover:underline"
                      >
                        <span>
                          {rfq.status === "PENDING" || rfq.status === "CONTACTED"
                            ? "Submit Quote"
                            : "View Details"}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Metadata */}
          <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{filteredRfqs.length}</strong> of{" "}
              <strong className="text-slate-800">{totalCount}</strong> inquiries
            </span>
            <span className="text-[11px]">
              Click any row to open quotation workspace and view commercial requirements
            </span>
          </div>
        </div>
      )}
    </div>
  );
}