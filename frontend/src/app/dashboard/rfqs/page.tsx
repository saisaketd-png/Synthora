"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  ChevronRight,
  Filter,
  PackageCheck,
  TrendingUp,
} from "lucide-react";
import { getBuyerRfqs, BuyerRfq } from "@/features/rfq/api/getBuyerRfqs";

type StatusFilter = "ALL" | "QUOTED" | "PENDING" | "COUNTERED" | "ACCEPTED" | "REJECTED" | "CLOSED";
type SortOption = "DATE_DESC" | "DATE_ASC" | "QTY_DESC" | "QTY_ASC";

export default function BuyerRfqsPage() {
  const router = useRouter();

  const [rfqs, setRfqs] = useState<BuyerRfq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("DATE_DESC");

  const loadRfqs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBuyerRfqs();
      setRfqs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load RFQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRfqs();
  }, []);

  const totalCount = rfqs.length;
  const quotedCount = useMemo(() => rfqs.filter((r) => r.status === "QUOTED").length, [rfqs]);
  const pendingCount = useMemo(
    () => rfqs.filter((r) => r.status === "PENDING" || r.status === "CONTACTED").length,
    [rfqs]
  );
  const counteredCount = useMemo(() => rfqs.filter((r) => r.status === "COUNTERED").length, [rfqs]);
  const acceptedCount = useMemo(() => rfqs.filter((r) => r.status === "ACCEPTED").length, [rfqs]);
  const rejectedCount = useMemo(() => rfqs.filter((r) => r.status === "REJECTED").length, [rfqs]);
  const closedCount = useMemo(
    () => rfqs.filter((r) => r.status === "CLOSED" || r.status === "CANCELLED").length,
    [rfqs]
  );
  const activeCount = quotedCount + pendingCount + counteredCount + acceptedCount;

  const filteredRfqs = useMemo(() => {
    return rfqs
      .filter((rfq) => {
        if (statusFilter === "QUOTED" && rfq.status !== "QUOTED") return false;
        if (statusFilter === "PENDING" && rfq.status !== "PENDING" && rfq.status !== "CONTACTED")
          return false;
        if (statusFilter === "COUNTERED" && rfq.status !== "COUNTERED") return false;
        if (statusFilter === "ACCEPTED" && rfq.status !== "ACCEPTED") return false;
        if (statusFilter === "REJECTED" && rfq.status !== "REJECTED") return false;
        if (statusFilter === "CLOSED" && rfq.status !== "CLOSED" && rfq.status !== "CANCELLED")
          return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesRef = (rfq.rfqReference || "").toLowerCase().includes(q);
          const matchesId = (rfq.id || "").toLowerCase().includes(q);
          const matchesProduct =
            (rfq.productName || "").toLowerCase().includes(q) ||
            (rfq.productId ? rfq.productId.toLowerCase().includes(q) : false) ||
            (rfq.masterProductId ? rfq.masterProductId.toLowerCase().includes(q) : false);
          const matchesSupplier =
            (rfq.supplierName || "").toLowerCase().includes(q) ||
            String(rfq.supplierId || "").includes(q);
          return matchesRef || matchesId || matchesProduct || matchesSupplier;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "DATE_DESC")
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === "DATE_ASC")
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === "QTY_DESC") return b.quantity - a.quantity;
        if (sortBy === "QTY_ASC") return a.quantity - b.quantity;
        return 0;
      });
  }, [rfqs, statusFilter, searchQuery, sortBy]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return {
          label: "ACCEPTED",
          classes: "bg-[#E3FCEF] text-[#006644] border-[#ABF5D1]",
          hint: "Ready to issue formal purchase order",
        };
      case "QUOTED":
        return {
          label: "QUOTED",
          classes: "bg-[#DEEBFF] text-[#0747A6] border-[#B3D4FF]",
          hint: "Supplier quotation awaiting your decision",
        };
      case "COUNTERED":
        return {
          label: "COUNTER OFFER",
          classes: "bg-[#FFFAE6] text-[#974F0C] border-[#FFE380]",
          hint: "Counter offer in negotiation",
        };
      case "PENDING":
      case "CONTACTED":
        return {
          label: "AWAITING RESPONSE",
          classes: "bg-[#FAFBFC] text-[#526581] border-[#E2E8F0]",
          hint: "Supplier preparing commercial proposal",
        };
      case "REJECTED":
        return {
          label: "DECLINED",
          classes: "bg-rose-50 text-rose-700 border-rose-200",
          hint: "Proposal declined",
        };
      case "CLOSED":
      case "CANCELLED":
        return {
          label: "CLOSED",
          classes: "bg-slate-100 text-slate-600 border-slate-200",
          hint: "Negotiation archived",
        };
      default:
        return {
          label: status,
          classes: "bg-slate-100 text-slate-700 border-slate-200",
          hint: "",
        };
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto p-8 min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono font-medium text-[#526581] uppercase tracking-wider">
          Loading Sourcing Workspace...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1440px] mx-auto p-6 lg:p-8">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center space-y-3 shadow-2xs">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="text-base font-bold text-[#0B1B33]">Unable to Load RFQs</h2>
          <p className="text-xs text-[#526581] max-w-md mx-auto">{error}</p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={loadRfqs}
              className="px-4 py-2 bg-[#0052CC] text-white text-xs font-semibold rounded-lg hover:bg-[#0747A6] transition-colors cursor-pointer"
            >
              Retry Fetch
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 pb-24 text-[#0B1B33]">
      {/* ========================================================================= */}
      {/* 1. COMPACT PAGE HEADER & METRICS                                          */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block font-mono">
              PROCUREMENT / RFQ REGISTER
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B33] tracking-tight">
              My Sourcing RFQs
            </h1>
            <p className="text-xs text-[#526581]">
              Manage active chemical sourcing requests, supplier quotations and procurement negotiations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/rfq"
              className="h-10 px-4.5 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create New RFQ</span>
            </Link>
          </div>
        </div>

        {/* Structured Metric Strip */}
        <div className="mt-5 pt-4 border-t border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Total RFQs
            </span>
            <strong className="text-lg font-bold text-[#0B1B33] block mt-0.5 font-mono">
              {totalCount}
            </strong>
          </div>

          <div className="p-3 bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Active Inquiries
            </span>
            <strong className="text-lg font-bold text-[#0052CC] block mt-0.5 font-mono">
              {activeCount}
            </strong>
          </div>

          <div className="p-3 bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Awaiting Decision
            </span>
            <strong className="text-lg font-bold text-[#974F0C] block mt-0.5 font-mono">
              {quotedCount}
            </strong>
          </div>

          <div className="p-3 bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Accepted / Ready PO
            </span>
            <strong className="text-lg font-bold text-[#006644] block mt-0.5 font-mono">
              {acceptedCount}
            </strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HORIZONTAL STATUS SUMMARY TABS                                         */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: "ALL", label: "All RFQs", count: totalCount },
          { key: "QUOTED", label: "Quoted", count: quotedCount },
          { key: "PENDING", label: "Awaiting Response", count: pendingCount },
          { key: "COUNTERED", label: "Counter Offer", count: counteredCount },
          { key: "ACCEPTED", label: "Accepted", count: acceptedCount },
          { key: "REJECTED", label: "Rejected", count: rejectedCount },
          { key: "CLOSED", label: "Closed", count: closedCount },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as StatusFilter)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer text-xs ${
                isActive
                  ? "bg-[#0052CC] text-white shadow-2xs"
                  : "bg-white border border-[#E2E8F0] text-[#526581] hover:bg-[#FAFBFC] hover:text-[#0B1B33]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-[#F4F5F7] text-[#0B1B33]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. TOOLBAR: SEARCH & SORT                                                 */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[#8993A4] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by RFQ reference, chemical, or supplier..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg text-[#0B1B33] placeholder:text-[#8993A4] focus:outline-none focus:border-[#0052CC]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-[11px] text-[#64748B] font-bold uppercase tracking-wider">
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 text-xs bg-[#FAFBFC] border border-[#E2E8F0] rounded-lg font-medium text-[#0B1B33] focus:outline-none focus:border-[#0052CC] cursor-pointer"
          >
            <option value="DATE_DESC">Newest First</option>
            <option value="DATE_ASC">Oldest First</option>
            <option value="QTY_DESC">Highest Quantity</option>
            <option value="QTY_ASC">Lowest Quantity</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PREMIUM PROCUREMENT LIST                                               */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {rfqs.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center space-y-3 shadow-2xs">
            <FileText className="w-10 h-10 text-[#8993A4] mx-auto" />
            <h3 className="text-sm font-bold text-[#0B1B33]">No RFQs Found</h3>
            <p className="text-xs text-[#526581] max-w-sm mx-auto">
              You have not submitted any chemical sourcing requests yet. Browse the catalog to request quotations.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0052CC] text-white text-xs font-semibold rounded-lg hover:bg-[#0747A6] transition-colors"
              >
                <span>Browse Chemical Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : filteredRfqs.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center space-y-3 shadow-2xs">
            <Filter className="w-8 h-8 text-[#8993A4] mx-auto" />
            <h3 className="text-sm font-bold text-[#0B1B33]">No Matching RFQs</h3>
            <p className="text-xs text-[#526581]">
              No sourcing requests match your search and filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
              className="text-xs font-semibold text-[#0052CC] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredRfqs.map((rfq) => {
            const badge = getStatusBadge(rfq.status);
            const rfqRef = rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`;

            return (
              <div
                key={rfq.id}
                onClick={() => router.push(`/dashboard/rfqs/${rfq.id}`)}
                className="bg-white border border-[#E2E8F0] hover:border-[#B3D4FF] rounded-xl p-5 shadow-2xs transition-all hover:shadow-xs cursor-pointer group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Identity & Compound */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#0052CC] group-hover:underline">
                        {rfqRef}
                      </span>
                      <span className="text-[#E2E8F0]">•</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                      {badge.hint && (
                        <span className="text-[11px] text-[#526581] hidden sm:inline">
                          — {badge.hint}
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-[#0B1B33] group-hover:text-[#0052CC] transition-colors truncate">
                        {rfq.productName || "Specialty Chemical Raw Material"}
                      </h2>
                    </div>

                    <p className="text-xs text-[#526581] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#8993A4]" />
                      <span>
                        Supplier: <strong className="text-[#0B1B33]">{rfq.supplierName || `Supplier #${rfq.supplierId}`}</strong>
                      </span>
                    </p>
                  </div>

                  {/* Middle: Volume & Dates */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 text-xs shrink-0 lg:w-72 border-t lg:border-t-0 lg:border-l border-[#E2E8F0] pt-3 lg:pt-0 lg:pl-6">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                        Quantity
                      </span>
                      <strong className="text-sm font-bold text-[#0B1B33] block mt-0.5">
                        {rfq.quantity.toLocaleString()} {rfq.unit.toUpperCase()}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                        Submitted
                      </span>
                      <span className="text-xs text-[#526581] block mt-0.5">
                        {formatDate(rfq.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Primary Call to Action */}
                  <div className="flex items-center justify-end shrink-0 pt-2 lg:pt-0">
                    {rfq.status === "ACCEPTED" ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E3FCEF] text-[#006644] text-xs font-bold uppercase tracking-wider rounded-lg border border-[#ABF5D1] group-hover:bg-[#00875A] group-hover:text-white transition-colors">
                        <span>Issue PO →</span>
                      </span>
                    ) : rfq.status === "QUOTED" ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#DEEBFF] text-[#0747A6] text-xs font-bold uppercase tracking-wider rounded-lg border border-[#B3D4FF] group-hover:bg-[#0052CC] group-hover:text-white transition-colors">
                        <span>Review Quote →</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0052CC] group-hover:underline">
                        <span>View RFQ</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}