"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, RefreshCw, ArrowRight, Package, AlertCircle } from "lucide-react";
import { getSupplierRfqs, SupplierRfq } from "@/features/rfq/api/getSupplierRfqs";
import { StatusBadge, Button, SkeletonLoader } from "@/shared/components/ui/KemkendraUI";

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
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 border-b border-[#DFE1E6] pb-5">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#091E42] tracking-tight">
            RFQ Inquiries
          </h1>
          <p className="text-sm text-[#5E6C84] mt-1">
            Review incoming chemical sourcing requests, respond to buyer counter-offers, and manage procurement commitments.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          {counteredCount > 0 && (
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded animate-pulse">
              {counteredCount} counter-offer{counteredCount > 1 ? "s" : ""} received
            </span>
          )}
          <button
            type="button"
            onClick={loadRfqs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0052CC] hover:bg-[#EBECF0] px-2.5 py-1.5 rounded transition-colors disabled:opacity-50 border border-[#DFE1E6] bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Summary Row */}
      {loading ? (
        <div className="bg-white p-5 border border-[#DFE1E6] rounded-lg">
          <SkeletonLoader lines={2} />
        </div>
      ) : (
        <div className="bg-white border border-[#DFE1E6] rounded-lg grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#DFE1E6] overflow-hidden">
          {summaryMetrics.map((m, idx) => (
            <button
              key={idx}
              type="button"
              onClick={m.onClick}
              className={`p-4 sm:p-5 text-left transition-colors group block min-w-0 ${
                m.active ? "bg-[#EBECF0]/60" : "hover:bg-[#FAFBFC]"
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#5E6C84] truncate mb-1">
                {m.label}
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#091E42] tracking-tight group-hover:text-[#0052CC] transition-colors">
                {m.value}
              </div>
              <div className="text-xs text-[#5E6C84] truncate mt-1 flex items-center gap-1.5">
                {m.badgeVariant === "warning" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF8B00]" />
                )}
                <span>{m.subtext}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 3. RFQ Workspace Table Container */}
      <div className="bg-white border border-[#DFE1E6] rounded-lg overflow-hidden space-y-0">
        {/* Workspace Toolbar */}
        <div className="p-4 border-b border-[#DFE1E6] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAFBFC]">
          {/* Search */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-[#5E6C84] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search RFQ reference, chemical, buyer or ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#DFE1E6] rounded focus:outline-none focus:border-[#0052CC] placeholder:text-[#5E6C84]"
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-1 bg-[#EBECF0] p-0.5 rounded border border-[#DFE1E6]">
              {(["ALL", "PENDING", "COUNTERED", "QUOTED", "ACCEPTED", "REJECTED"] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                    statusFilter === f
                      ? "bg-white text-[#091E42] shadow-2xs font-bold"
                      : "text-[#5E6C84] hover:text-[#091E42]"
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

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs bg-white border border-[#DFE1E6] rounded px-2.5 py-1.5 font-medium text-[#091E42] focus:outline-none focus:border-[#0052CC]"
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
            <span className="text-sm font-bold text-[#091E42] block">
              No RFQ inquiries
            </span>
            <p className="text-xs text-[#5E6C84]">
              {searchQuery || statusFilter !== "ALL"
                ? "No chemical sourcing inquiries match your current search or status filter."
                : "You're currently up to date. New buyer sourcing requests will appear here."}
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/supplier/products"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0052CC] hover:underline"
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
                <tr className="bg-[#FAFBFC] border-b border-[#DFE1E6] text-[11px] font-bold uppercase tracking-wider text-[#5E6C84]">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Chemical / Product</th>
                  <th className="py-3 px-4">Buyer Organization</th>
                  <th className="py-3 px-4">Requested Quantity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Received</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE1E6] text-xs">
                {filteredRfqs.map((rfq) => {
                  const isPending = rfq.status === "PENDING" || rfq.status === "CONTACTED";
                  const isCountered = rfq.status === "COUNTERED";
                  return (
                    <tr
                      key={rfq.id}
                      onClick={() => router.push(`/dashboard/supplier/rfqs/${rfq.id}`)}
                      className={`hover:bg-[#FAFBFC] transition-colors cursor-pointer group ${
                        isCountered ? "bg-amber-50/30" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#091E42]">
                        {rfq.rfqReference || (rfq.id ? `RFQ-${rfq.id.slice(0, 8).toUpperCase()}` : "—")}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#091E42] group-hover:text-[#0052CC] block truncate">
                          {rfq.productName || "Chemical Compound"}
                        </span>
                        <span className="text-[10px] font-mono text-[#5E6C84]">
                          {rfq.productId ? `ID: ${rfq.productId.slice(0, 8)}` : rfq.masterProductId ? `MP: ${rfq.masterProductId.slice(0, 8)}` : rfq.rfqReference || `RFQ #${rfq.id.slice(0, 8)}`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#172B4D]">
                        {rfq.buyerName || `Buyer #${String(rfq.buyerId).slice(0, 8)}`}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#091E42]">
                        {rfq.quantity.toLocaleString()} {rfq.unit || "kg"}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={rfq.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#5E6C84]">
                        {new Date(rfq.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`text-xs font-semibold inline-flex items-center gap-1 ${
                            isCountered
                              ? "text-amber-800 font-bold bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300"
                              : isPending
                              ? "text-[#0052CC] font-bold"
                              : "text-[#5E6C84] group-hover:text-[#0052CC]"
                          }`}
                        >
                          <span>{isCountered ? "Review Counter-Offer" : isPending ? "Respond" : "View"}</span>
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