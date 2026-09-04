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
import { PageHeader, StatusBadge } from "@/shared/components/ui/KemkendraUI";

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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="p-8 min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-6 h-6 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-[#64748B] uppercase tracking-wider">
          Loading Sourcing Register...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-white border border-[rgba(220,38,38,0.2)] rounded-[8px] p-6 text-center space-y-3 shadow-tactile-card">
          <AlertCircle className="w-6 h-6 text-[#DC2626] mx-auto" />
          <h2 className="text-sm font-semibold text-[#0F172A]">Unable to Load RFQs</h2>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">{error}</p>
          <button
            onClick={loadRfqs}
            className="h-8 px-3.5 bg-[#0052CC] text-white text-xs font-medium rounded-[6px] hover:bg-[#0747A6] transition-colors inline-block"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-16 text-[#0F172A]">
      {/* 1. Standard Page Header */}
      <PageHeader
        title="My Sourcing RFQs"
        description="Manage active chemical sourcing requests, evaluate supplier quotations, and negotiate commercial terms."
        actions={
          <Link
            href="/rfq"
            className="h-9 px-3.5 bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-white text-xs font-medium rounded-[6px] transition-colors flex items-center gap-1.5 shadow-xs active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New RFQ</span>
          </Link>
        }
      />

      {/* 2. Structured Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-card">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block font-mono">
            Total RFQs
          </span>
          <strong className="text-lg font-bold text-[#0F172A] block mt-0.5 font-mono">
            {totalCount}
          </strong>
        </div>

        <div className="p-3 bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-card">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block font-mono">
            Active Inquiries
          </span>
          <strong className="text-lg font-bold text-[#0052CC] block mt-0.5 font-mono">
            {activeCount}
          </strong>
        </div>

        <div className="p-3 bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-card">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block font-mono">
            Awaiting Decision
          </span>
          <strong className="text-lg font-bold text-[#D97706] block mt-0.5 font-mono">
            {quotedCount}
          </strong>
        </div>

        <div className="p-3 bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-card">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block font-mono">
            Ready to Issue PO
          </span>
          <strong className="text-lg font-bold text-[#059669] block mt-0.5 font-mono">
            {acceptedCount}
          </strong>
        </div>
      </div>

      {/* 3. Filter Tabs */}
      <div className="hidden sm:flex items-center gap-1.5 border-b border-[#E4E4E7] pb-2 overflow-x-auto text-xs">
        {(
          [
            { id: "ALL", label: "All Inquiries", count: totalCount },
            { id: "QUOTED", label: "Quoted", count: quotedCount },
            { id: "PENDING", label: "Awaiting Response", count: pendingCount },
            { id: "COUNTERED", label: "Counter Offer", count: counteredCount },
            { id: "ACCEPTED", label: "Accepted", count: acceptedCount },
            { id: "REJECTED", label: "Declined", count: rejectedCount },
            { id: "CLOSED", label: "Closed", count: closedCount },
          ] as const
        ).map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`h-8 px-3 rounded-[6px] text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? "bg-[#EFF6FF] text-[#0052CC] font-semibold"
                  : "text-[#475569] hover:bg-[#FAFAFA] hover:text-[#0F172A]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-[4px] font-mono ${
                  isActive
                    ? "bg-[#DBEAFE] text-[#0052CC]"
                    : "bg-[#F4F4F5] text-[#64748B]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Select Filter */}
      <div className="sm:hidden w-full">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="w-full text-xs bg-white border border-[#E4E4E7] rounded-[6px] px-3 py-2 text-[#0F172A] shadow-xs focus:outline-none focus:border-[#0052CC]"
        >
          <option value="ALL">All Inquiries ({totalCount})</option>
          <option value="QUOTED">Quoted ({quotedCount})</option>
          <option value="PENDING">Awaiting Response ({pendingCount})</option>
          <option value="COUNTERED">Counter Offer ({counteredCount})</option>
          <option value="ACCEPTED">Accepted ({acceptedCount})</option>
          <option value="REJECTED">Declined ({rejectedCount})</option>
          <option value="CLOSED">Closed ({closedCount})</option>
        </select>
      </div>

      {/* 4. Toolbar: Search & Sort */}
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-3 shadow-tactile-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference, compound, or supplier..."
            className="w-full h-9 pl-8.5 pr-3 text-xs bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0052CC] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-[11px] text-[#64748B] font-mono uppercase tracking-wider">
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-9 px-2.5 text-xs bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px] font-normal text-[#0F172A] focus:outline-none focus:border-[#0052CC] cursor-pointer"
          >
            <option value="DATE_DESC">Newest First</option>
            <option value="DATE_ASC">Oldest First</option>
            <option value="QTY_DESC">Highest Volume</option>
            <option value="QTY_ASC">Lowest Volume</option>
          </select>
        </div>
      </div>

      {/* 5. Professional Sourcing Table */}
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-card overflow-hidden">
        {rfqs.length === 0 ? (
          <div className="p-12 text-center space-y-2.5">
            <FileText className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <h3 className="text-xs font-semibold text-[#0F172A]">No Sourcing RFQs Found</h3>
            <p className="text-[11px] text-[#64748B] max-w-sm mx-auto">
              You have not submitted any chemical sourcing requests yet. Browse the catalog to request commercial quotations.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-[#0052CC] text-white text-xs font-medium rounded-[6px] hover:bg-[#0747A6] transition-colors shadow-xs"
              >
                <span>Browse Chemical Catalog</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : filteredRfqs.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Filter className="w-6 h-6 text-[#94A3B8] mx-auto" />
            <h3 className="text-xs font-semibold text-[#0F172A]">No Matching Inquiries</h3>
            <p className="text-[11px] text-[#64748B]">
              No sourcing requests match your search and filter parameters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
              className="text-xs font-medium text-[#0052CC] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E4E4E7]">
            {/* Table Header (Desktop) */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2.5 bg-[#FAFAFA] text-[10px] font-semibold font-mono uppercase tracking-wider text-[#64748B] border-b border-[#E4E4E7]">
              <div className="col-span-3">Inquiry Ref & Compound</div>
              <div className="col-span-3">Assigned Supplier</div>
              <div className="col-span-2">Volume Required</div>
              <div className="col-span-2">Date Submitted</div>
              <div className="col-span-2 text-right">Status & Action</div>
            </div>

            {/* Rows */}
            {filteredRfqs.map((rfq) => {
              const rfqRef = rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`;

              return (
                <div
                  key={rfq.id}
                  onClick={() => router.push(`/dashboard/rfqs/${rfq.id}`)}
                  className="p-4 lg:px-4 lg:py-3 hover:bg-[#FAFAFA] transition-colors cursor-pointer group flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 items-start lg:items-center"
                >
                  {/* Compound & Ref */}
                  <div className="lg:col-span-3 min-w-0 space-y-0.5">
                    <span className="font-mono text-xs font-semibold text-[#0052CC] group-hover:underline block">
                      {rfqRef}
                    </span>
                    <h3 className="text-xs font-medium text-[#0F172A] truncate">
                      {rfq.productName || "Specialty Chemical Raw Material"}
                    </h3>
                  </div>

                  {/* Supplier */}
                  <div className="lg:col-span-3 text-xs text-[#475569] flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                    <span className="truncate">
                      {rfq.supplierName || `Supplier #${rfq.supplierId}`}
                    </span>
                  </div>

                  {/* Volume */}
                  <div className="lg:col-span-2 text-xs font-mono font-medium text-[#0F172A]">
                    {rfq.quantity.toLocaleString()} {rfq.unit.toUpperCase()}
                  </div>

                  {/* Submitted Date */}
                  <div className="lg:col-span-2 text-xs font-mono text-[#64748B]">
                    {formatDate(rfq.createdAt)}
                  </div>

                  {/* Status & CTA */}
                  <div className="lg:col-span-2 flex items-center justify-between lg:justify-end gap-2 w-full lg:w-auto">
                    <StatusBadge status={rfq.status} />
                    <span className="text-xs font-medium text-[#0052CC] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                      <span>Dossier</span>
                      <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}