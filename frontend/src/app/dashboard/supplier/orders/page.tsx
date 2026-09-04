"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, RefreshCw, ArrowRight, CheckCircle2, Package } from "lucide-react";
import { getSupplierOrders } from "@/features/order/api/getSupplierOrders";
import { confirmOrder } from "@/features/order/api/confirmOrder";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";
import { PageHeader, StatusBadge, Button, SkeletonLoader } from "@/shared/components/ui/KemkendraUI";
import { useToast } from "@/shared/context/ToastContext";

type StatusFilter = "ALL" | "PLACED" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED";
type SortOption = "DATE_DESC" | "DATE_ASC" | "VALUE_DESC" | "VALUE_ASC";

export default function SupplierOrdersPage() {
  const toast = useToast();
  const router = useRouter();

  const [orders, setOrders] = useState<PurchaseOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("DATE_DESC");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupplierOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load supplier purchase orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleQuickConfirm = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    try {
      setConfirmingId(orderId);
      await confirmOrder(orderId);
      toast.success("Purchase order confirmed successfully");
      await loadOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm order");
    } finally {
      setConfirmingId(null);
    }
  };

  const totalCount = orders.length;
  const placedCount = useMemo(() => orders.filter((o) => o.status === "PLACED").length, [orders]);
  const confirmedCount = useMemo(() => orders.filter((o) => o.status === "CONFIRMED").length, [orders]);
  const processingCount = useMemo(() => orders.filter((o) => o.status === "PROCESSING").length, [orders]);
  const shippedCount = useMemo(() => orders.filter((o) => o.status === "SHIPPED").length, [orders]);
  const deliveredCount = useMemo(() => orders.filter((o) => o.status === "DELIVERED").length, [orders]);
  const completedCount = useMemo(() => orders.filter((o) => o.status === "COMPLETED").length, [orders]);
  const cancelledCount = useMemo(() => orders.filter((o) => o.status === "CANCELLED").length, [orders]);

  // Total active commercial volume
  const totalActiveValueFormatted = useMemo(() => {
    let total = 0;
    let currency = "USD";
    orders.forEach((o) => {
      if (o.status !== "CANCELLED") {
        total += o.totalAmount;
        if (o.currency) currency = o.currency;
      }
    });
    return `${currency} ${total.toLocaleString()}`;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (statusFilter !== "ALL" && order.status !== statusFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesPo = (order.poNumber || "").toLowerCase().includes(q);
          const matchesRfq = (order.rfqId || "").toLowerCase().includes(q);
          const matchesId = (order.id || "").toLowerCase().includes(q);
          const matchesProduct =
            (order.productName || "").toLowerCase().includes(q) ||
            (order.productId ? order.productId.toLowerCase().includes(q) : false);
          const matchesBuyer = (order.buyerId || "").toLowerCase().includes(q);
          return matchesPo || matchesRfq || matchesId || matchesProduct || matchesBuyer;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "DATE_DESC") return new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();
        if (sortBy === "DATE_ASC") return new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
        if (sortBy === "VALUE_DESC") return b.totalAmount - a.totalAmount;
        if (sortBy === "VALUE_ASC") return a.totalAmount - b.totalAmount;
        return 0;
      });
  }, [orders, statusFilter, searchQuery, sortBy]);

  const summaryMetrics = [
    {
      label: "Total Orders",
      value: totalCount,
      subtext: `${totalActiveValueFormatted} active value`,
      active: statusFilter === "ALL",
      onClick: () => setStatusFilter("ALL"),
    },
    {
      label: "Action Required",
      value: placedCount,
      subtext: placedCount > 0 ? "Awaiting acceptance" : "All accepted",
      badgeVariant: placedCount > 0 ? "warning" : undefined,
      active: statusFilter === "PLACED",
      onClick: () => setStatusFilter("PLACED"),
    },
    {
      label: "Confirmed",
      value: confirmedCount,
      subtext: "Accepted commitments",
      active: statusFilter === "CONFIRMED",
      onClick: () => setStatusFilter("CONFIRMED"),
    },
    {
      label: "In Fulfillment",
      value: processingCount + shippedCount,
      subtext: `${shippedCount} dispatched`,
      active: statusFilter === "PROCESSING" || statusFilter === "SHIPPED",
      onClick: () => setStatusFilter("PROCESSING"),
    },
    {
      label: "Delivered",
      value: deliveredCount,
      subtext: "Fulfilled contracts",
      active: statusFilter === "DELIVERED",
      onClick: () => setStatusFilter("DELIVERED"),
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto space-y-5 text-[#0F172A]">
      {/* 1. Page Header */}
      <PageHeader
        title="Purchase Contracts Ledger"
        description="Review confirmed purchase orders, process manufacturing consignments, record shipments, and track deliveries."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium px-2.5 py-1 bg-white text-[#0F172A] border border-[#E4E4E7] rounded-[4px]">
              {placedCount > 0 ? `${placedCount} Action Required` : "All Contracts Confirmed"}
            </span>
            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="h-8 px-3 text-xs font-medium text-[#0F172A] bg-white border border-[#E4E4E7] hover:bg-[#FAFAFA] rounded-[6px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* 2. Compact Operational Metrics Strip */}
      {loading ? (
        <div className="bg-white p-4 border border-[#E4E4E7] rounded-[8px] shadow-tactile-card">
          <SkeletonLoader lines={2} />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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

      {/* 3. PO Workspace Table Container */}
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
              placeholder="Search PO, RFQ, chemical, buyer..."
              className="w-full h-8.5 pl-8.5 pr-3 text-xs bg-white border border-[#E4E4E7] rounded-[6px] focus:outline-none focus:border-[#0052CC] text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            {/* Desktop Status Filters */}
            <div className="hidden sm:flex items-center gap-1 bg-[#F4F4F5] p-0.5 rounded-[6px] border border-[#E4E4E7] overflow-x-auto">
              {(["ALL", "PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED"] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === f
                      ? "bg-white text-[#0052CC] font-semibold shadow-xs"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  {f === "ALL" ? "All" : f === "PLACED" ? "Action Required" : f.charAt(0) + f.slice(1).toLowerCase()}
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
                <option value="ALL">All Statuses ({totalCount})</option>
                <option value="PLACED">Action Required ({placedCount})</option>
                <option value="CONFIRMED">Confirmed ({confirmedCount})</option>
                <option value="PROCESSING">Processing ({processingCount})</option>
                <option value="SHIPPED">Shipped ({shippedCount})</option>
                <option value="DELIVERED">Delivered ({deliveredCount})</option>
                <option value="COMPLETED">Completed ({completedCount})</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs bg-white border border-[#E4E4E7] rounded-[6px] px-2.5 py-1.5 font-medium text-[#0F172A] focus:outline-none focus:border-[#0052CC] ml-auto sm:ml-0"
            >
              <option value="DATE_DESC">Newest First</option>
              <option value="DATE_ASC">Oldest First</option>
              <option value="VALUE_DESC">Highest Value</option>
              <option value="VALUE_ASC">Lowest Value</option>
            </select>
          </div>
        </div>

        {/* Data Table or Compact Empty State */}
        {filteredOrders.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2 max-w-md mx-auto">
            <span className="text-sm font-semibold text-[#0F172A] block">
              No Purchase Orders Found
            </span>
            <p className="text-xs text-[#64748B]">
              {searchQuery || statusFilter !== "ALL"
                ? "No purchase orders match your current search or status filter."
                : "Confirmed buyer orders will appear here once a quotation is accepted and converted into an order."}
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/supplier/rfqs"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0052CC] hover:underline"
              >
                <span>View RFQ Inquiries</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[10px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">
                  <th className="py-2.5 px-4">PO Reference</th>
                  <th className="py-2.5 px-4">Chemical / Monograph</th>
                  <th className="py-2.5 px-4">Buyer Organization</th>
                  <th className="py-2.5 px-4">Contract Value</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Placed Date</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7] text-xs">
                {filteredOrders.map((order) => {
                  const isPlaced = order.status === "PLACED";
                  return (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/dashboard/supplier/orders/${order.id}`)}
                      className="hover:bg-[#FAFAFA] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-[#0052CC]">
                        {order.poNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#0F172A] group-hover:text-[#0052CC] block truncate">
                          {order.productName || "Chemical Product"}
                        </span>
                        <span className="text-[10px] font-mono text-[#64748B]">
                          {order.productId ? `ID: ${order.productId.slice(0, 8)}` : order.poNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#475569]">
                        Buyer #{order.buyerId ? order.buyerId.slice(0, 8) : "N/A"}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">
                        {order.currency} {order.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#64748B]">
                        {new Date(order.placedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isPlaced ? (
                          <button
                            type="button"
                            onClick={(e) => handleQuickConfirm(e, order.id)}
                            disabled={confirmingId === order.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#059669] hover:bg-[#047857] text-white font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{confirmingId === order.id ? "Confirming..." : "Confirm PO"}</span>
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-[#64748B] group-hover:text-[#0052CC] inline-flex items-center gap-1">
                            <span>Manage</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        )}
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
