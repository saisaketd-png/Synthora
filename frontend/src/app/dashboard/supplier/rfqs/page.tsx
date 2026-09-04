"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, RefreshCw, ArrowRight, Package, AlertCircle } from "lucide-react";
import { getSupplierRfqs, SupplierRfq } from "@/features/rfq/api/getSupplierRfqs";
import { PageHeader, StatusBadge, Button, SkeletonLoader } from "@/shared/components/ui/KemkendraUI";

type StatusFilter = "ALL" | "PENDING" | "COUNTERED" | "QUOTED" | "ACCEPTED" | "REJECTED";
type SortOption = "DATE_DESC" | "DATE_ASC" | "QTY_DESC" | "QTY_ASC";

export default function SupplierRfqsPage() {
  const router = useRouter();

  const [rfqs, setRfqs] = useState<SupplierRfq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const totalCount = rfqs.length;
  const pendingCount = useMemo(() => rfqs.filter((r) => r.status === "PENDING" || r.status === "CONTACTED").length, [rfqs]);
  const counteredCount = useMemo(() => rfqs.filter((r) => r.status === "COUNTERED").length, [rfqs]);
  const quotedCount = useMemo(() => rfqs.filter((r) => r.status === "QUOTED").length, [rfqs]);
  const acceptedCount = useMemo(() => rfqs.filter((r) => r.status === "ACCEPTED").length, [rfqs]);
  const rejectedCount = useMemo(() => rfqs.filter((r) => r.status === "REJECTED").length, [rfqs]);

  const filteredRfqs = useMemo(() => {
    return rfqs
      .filter((rfq) => {
        if (statusFilter === "PENDING" && rfq.status !== "PENDING" && rfq.status !== "CONTACTED") return false;
        if (statusFilter === "COUNTERED" && rfq.status !== "COUNTERED") return false;
        if (statusFilter === "QUOTED" && rfq.status !== "QUOTED") return false;
        if (statusFilter === "ACCEPTED" && rfq.status !== "ACCEPTED") return false;
        if (statusFilter === "REJECTED" && rfq.status !== "REJECTED") return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesRef = (rfq.rfqReference || "").toLowerCase().includes(q);
          const matchesId = (rfq.id || "").toLowerCase().includes(q);
          const matchesProduct =
            (rfq.productName || "").toLowerCase().includes(q) ||
            (rfq.productId ? rfq.productId.toLowerCase().includes(q) : false) ||
            (rfq.masterProductId ? rfq.masterProductId.toLowerCase().includes(q) : false);
          const matchesBuyer = (rfq.buyerName || "").toLowerCase().includes(q) || String(rfq.buyerId || "").includes(q);
          return matchesRef || matchesId || matchesProduct || matchesBuyer;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "DATE_DESC") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === "DATE_ASC") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === "QTY_DESC") return b.quantity - a.quantity;
        if (sortBy === "QTY_ASC") return a.quantity - b.quantity;
        return 0;
      });
  }, [rfqs, statusFilter, searchQuery, sortBy]);

  const summaryMetrics = [
    {
      label: "Total RFQs",
      value: totalCount,
      subtext: "All incoming requests",
      active: statusFilter === "ALL",
      onClick: () => setStatusFilter("ALL"),
    },
    {
      label: "Awaiting Quote",
      value: pendingCount,
      subtext: pendingCount > 0 ? "Needs response" : "Up to date",
      badgeVariant: pendingCount > 0 ? "warning" : undefined,
      active: statusFilter === "PENDING",
      onClick: () => setStatusFilter("PENDING"),
    },
    {
      label: "Counter-Offers",
      value: counteredCount,
      subtext: counteredCount > 0 ? "Action required" : "None pending",
      badgeVariant: counteredCount > 0 ? "warning" : undefined,
      active: statusFilter === "COUNTERED",
      onClick: () => setStatusFilter("COUNTERED"),
    },
    {
      label: "Quoted",
      value: quotedCount,
      subtext: "Proposals submitted",
      active: statusFilter === "QUOTED",
      onClick: () => setStatusFilter("QUOTED"),
    },
    {
      label: "Accepted",
      value: acceptedCount,
      subtext: "Ready for order conversion",
      active: statusFilter === "ACCEPTED",
      onClick: () => setStatusFilter("ACCEPTED"),
    },
    {
      label: "Rejected / Closed",
      value: rejectedCount,
      subtext: "Declined or expired",
      active: statusFilter === "REJECTED",
      onClick: () => setStatusFilter("REJECTED"),
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto space-y-5 text-[#0F172A]">
      {/* 1. Page Header */}
      <PageHeader
        title="Sourcing Opportunity Ledger"
        description="Review incoming buyer RFQ inquiries, submit commercial quotation proposals, and negotiate counter-offers."
        actions={
          <div className="flex items-center gap-2">
            {counteredCount > 0 && (
              <span className="text-xs font-mono font-medium px-2.5 py-1 bg-[#FFFBEB] text-[#D97706] border border-[rgba(217,119,6,0.2)] rounded-[4px]">
                {counteredCount} Counter-Offer{counteredCount > 1 ? "s" : ""}
              </span>
            )}
            <button
              type="button"
              onClick={loadRfqs}
              disabled={loading}
              className="h-8 px-3 text-xs font-medium text-[#0F172A] bg-white border border-[#E4E4E7] hover:bg-[#FAFAFA] rounded-[6px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* 2. Compact Metric Strip */}
      {loading ? (
        <div className="bg-white p-4 border border-[#E4E4E7] rounded-[8px] shadow-tactile-card">
          <SkeletonLoader lines={2} />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {summaryMetrics.map((m, idx) => (
            <button
              key={idx}
              type="button"
              onClick={m.onClick}
              className={`p-3.5 rounded-[8px] border text-left transition-colors cursor-pointer block min-w-0 shadow-tactile-card ${
                m.active
                  ? "bg-[#EFF6FF] border-[#BFDBFE]"
                  : "bg-white border-[#E4E4E7] hover:border-[#0052CC]"
              }`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider font-mono text-[#64748B] truncate mb-1">
                {m.label}
              </div>
              <div className="text-xl font-bold font-mono text-[#0F172A] tracking-tight">
                {m.value}
              </div>
              <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                {m.subtext}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 3. RFQ Workspace Table Container */}
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-card overflow-hidden">
        {/* Workspace Toolbar */}
        <div className="p-3.5 border-b border-[#E4E4E7] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#FAFAFA]">
          {/* Search */}
          <div className="relative w-full md:max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, compound, buyer..."
              className="w-full h-8.5 pl-8.5 pr-3 text-xs bg-white border border-[#E4E4E7] rounded-[6px] focus:outline-none focus:border-[#0052CC] text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            {/* Desktop Status Filters */}
            <div className="hidden sm:flex items-center gap-1 bg-[#F4F4F5] p-0.5 rounded-[6px] border border-[#E4E4E7]">
              {(["ALL", "PENDING", "COUNTERED", "QUOTED", "ACCEPTED", "REJECTED"] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === f
                      ? "bg-white text-[#0052CC] font-semibold shadow-xs"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  {f === "ALL"
                    ? "All"
                    : f === "PENDING"
                    ? "Awaiting Quote"
                    : f === "COUNTERED"
                    ? "Counter-Offers"
                    : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Mobile Status Dropdown Filter */}
            <div className="sm:hidden w-full">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full text-xs bg-white border border-[#E4E4E7] rounded-[6px] px-3 py-1.5 font-medium text-[#0F172A] focus:outline-none focus:border-[#0052CC]"
              >
                <option value="ALL">All Inquiries ({totalCount})</option>
                <option value="PENDING">Awaiting Quote ({pendingCount})</option>
                <option value="COUNTERED">Counter-Offers ({counteredCount})</option>
                <option value="QUOTED">Quoted ({quotedCount})</option>
                <option value="ACCEPTED">Accepted ({acceptedCount})</option>
                <option value="REJECTED">Rejected ({rejectedCount})</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs bg-white border border-[#E4E4E7] rounded-[6px] px-2.5 py-1.5 font-medium text-[#0F172A] focus:outline-none focus:border-[#0052CC] ml-auto sm:ml-0"
            >
              <option value="DATE_DESC">Newest First</option>
              <option value="DATE_ASC">Oldest First</option>
              <option value="QTY_DESC">Highest Quantity</option>
              <option value="QTY_ASC">Lowest Quantity</option>
            </select>
          </div>
        </div>

        {/* Data Table or Compact Empty State */}
        {filteredRfqs.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2 max-w-md mx-auto">
            <span className="text-sm font-semibold text-[#0F172A] block">
              No Sourcing Inquiries Found
            </span>
            <p className="text-xs text-[#64748B]">
              {searchQuery || statusFilter !== "ALL"
                ? "No chemical sourcing inquiries match your current search or status filter."
                : "Your inquiry queue is up to date. New buyer sourcing inquiries will appear here."}
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/supplier/products"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0052CC] hover:underline"
              >
                <span>View Product Inventory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[10px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">
                  <th className="py-2.5 px-4">Inquiry Ref</th>
                  <th className="py-2.5 px-4">Chemical / Monograph</th>
                  <th className="py-2.5 px-4">Buyer Organization</th>
                  <th className="py-2.5 px-4">Volume</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Received Date</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7] text-xs">
                {filteredRfqs.map((rfq) => {
                  const isPending = rfq.status === "PENDING" || rfq.status === "CONTACTED";
                  const isCountered = rfq.status === "COUNTERED";
                  return (
                    <tr
                      key={rfq.id}
                      onClick={() => router.push(`/dashboard/supplier/rfqs/${rfq.id}`)}
                      className={`hover:bg-[#FAFAFA] transition-colors cursor-pointer group ${
                        isCountered ? "bg-[#FFFBEB]/40" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-[#0052CC]">
                        {rfq.rfqReference || (rfq.id ? `RFQ-${rfq.id.slice(0, 8).toUpperCase()}` : "—")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#0F172A] group-hover:text-[#0052CC] block truncate">
                          {rfq.productName || "Chemical Compound"}
                        </span>
                        <span className="text-[10px] font-mono text-[#64748B]">
                          {rfq.productId ? `ID: ${rfq.productId.slice(0, 8)}` : rfq.masterProductId ? `MP: ${rfq.masterProductId.slice(0, 8)}` : rfq.rfqReference || `RFQ #${rfq.id.slice(0, 8)}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#475569]">
                        {rfq.buyerName || `Buyer #${String(rfq.buyerId).slice(0, 8)}`}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#0F172A]">
                        {rfq.quantity.toLocaleString()} {rfq.unit || "kg"}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={rfq.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#64748B]">
                        {new Date(rfq.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`text-xs font-medium inline-flex items-center gap-1 ${
                            isCountered
                              ? "text-[#D97706] font-semibold bg-[#FFFBEB] px-2 py-0.5 rounded-[4px] border border-[rgba(217,119,6,0.2)]"
                              : isPending
                              ? "text-[#0052CC] font-semibold"
                              : "text-[#64748B] group-hover:text-[#0052CC]"
                          }`}
                        >
                          <span>{isCountered ? "Review Counter" : isPending ? "Submit Quote" : "View"}</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}