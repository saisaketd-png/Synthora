"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, RefreshCw, ArrowRight, CheckCircle2, Package } from "lucide-react";
import { getSupplierOrders } from "@/features/order/api/getSupplierOrders";
import { confirmOrder } from "@/features/order/api/confirmOrder";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";
import { StatusBadge, Button, SkeletonLoader } from "@/shared/components/ui/KemkendraUI";
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
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 border-b border-[#DFE1E6] pb-5">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#091E42] tracking-tight">
            Purchase Orders
          </h1>
          <p className="text-sm text-[#5E6C84] mt-1">
            Manage confirmed orders, commercial commitments, and fulfillment progress.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-white text-[#091E42] border border-[#DFE1E6] rounded">
            {placedCount > 0 ? `${placedCount} action required` : "All orders confirmed"}
          </span>
          <button
            type="button"
            onClick={loadOrders}
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
        <div className="bg-white border border-[#DFE1E6] rounded-lg grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#DFE1E6] overflow-hidden">
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

      {/* 3. PO Workspace Table Container */}
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
              placeholder="Search PO number, RFQ, chemical or buyer..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#DFE1E6] rounded focus:outline-none focus:border-[#0052CC] placeholder:text-[#5E6C84]"
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Desktop Status Filters */}
            <div className="hidden sm:flex items-center gap-1 bg-[#EBECF0] p-0.5 rounded border border-[#DFE1E6] overflow-x-auto">
              {(["ALL", "PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED"] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                    statusFilter === f
                      ? "bg-white text-[#091E42] shadow-2xs font-bold"
                      : "text-[#5E6C84] hover:text-[#091E42]"
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
                className="w-full text-xs bg-white border border-[#DFE1E6] rounded px-3 py-2 font-semibold text-[#091E42] focus:outline-none focus:border-[#0052CC]"
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
              className="text-xs bg-white border border-[#DFE1E6] rounded px-2.5 py-1.5 font-medium text-[#091E42] focus:outline-none focus:border-[#0052CC] ml-auto sm:ml-0"
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
            <span className="text-sm font-bold text-[#091E42] block">
              No purchase orders yet
            </span>
            <p className="text-xs text-[#5E6C84]">
              {searchQuery || statusFilter !== "ALL"
                ? "No purchase orders match your current search or status filter."
                : "Confirmed buyer orders will appear here once a quotation is accepted and converted into an order."}
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/supplier/rfqs"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0052CC] hover:underline"
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
                <tr className="bg-[#FAFBFC] border-b border-[#DFE1E6] text-[11px] font-bold uppercase tracking-wider text-[#5E6C84]">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Chemical / Product</th>
                  <th className="py-3 px-4">Buyer Organization</th>
                  <th className="py-3 px-4">Contract Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Placed Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE1E6] text-xs">
                {filteredOrders.map((order) => {
                  const isPlaced = order.status === "PLACED";
                  return (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/dashboard/supplier/orders/${order.id}`)}
                      className="hover:bg-[#FAFBFC] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#091E42]">
                        {order.poNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#091E42] group-hover:text-[#0052CC] block truncate">
                          {order.productName || "Chemical Product"}
                        </span>
                        <span className="text-[10px] font-mono text-[#5E6C84]">
                          {order.productId ? `ID: ${order.productId.slice(0, 8)}` : order.poNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#172B4D]">
                        Buyer #{order.buyerId ? order.buyerId.slice(0, 8) : "N/A"}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#091E42]">
                        {order.currency} {order.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#5E6C84]">
                        {new Date(order.placedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isPlaced ? (
                          <button
                            type="button"
                            onClick={(e) => handleQuickConfirm(e, order.id)}
                            disabled={confirmingId === order.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#00875A] hover:bg-[#006644] text-white font-bold text-xs transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{confirmingId === order.id ? "Confirming..." : "Confirm"}</span>
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-[#5E6C84] group-hover:text-[#0052CC] inline-flex items-center gap-1">
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
