"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  Truck,
  CheckCircle2,
  Ban,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  AdminPurchaseOrderResponse,
  OrderStatus,
  PaginatedResponse,
} from "@/features/admin/types";
import { getAdminOrders } from "@/features/admin/api/adminApi";
import { AdminOrderList } from "@/features/admin/components/transactions/AdminOrderList";
import { AdminStatsCard } from "@/features/admin/components/AdminStatsCard";

export default function AdminOrdersPage() {
  const [data, setData] = useState<PaginatedResponse<AdminPurchaseOrderResponse>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAdminOrders({
        page,
        size: pageSize,
        query: query.trim() || undefined,
        status: statusFilter || undefined,
      });
      setData(response);
    } catch (err: any) {
      setError(err.message || "Failed to load purchase orders");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, query, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Derived metrics
  const totalOrders = data.totalElements;
  const inFulfillmentCount = data.content.filter(
    (o) => o.status === "PLACED" || o.status === "CONFIRMED" || o.status === "PROCESSING"
  ).length;
  const dispatchedCount = data.content.filter(
    (o) => o.status === "SHIPPED" || o.status === "DELIVERED"
  ).length;
  const cancelledCount = data.content.filter((o) => o.status === "CANCELLED").length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
              <ShoppingCart className="w-3.5 h-3.5" />
              Order Fulfillment Oversight
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Purchase Order Oversight
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Monitor purchase order lifecycle, fulfillment milestones, and carrier shipment tracking. Administrative order cancellations are recorded in the audit log.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Total Orders"
          value={totalOrders}
          subtitle="Matching criteria"
          icon={ShoppingCart}
          color="blue"
        />
        <AdminStatsCard
          title="In Fulfillment (Page)"
          value={inFulfillmentCount}
          subtitle="Placed / Confirmed / Processing"
          icon={CheckCircle2}
          color="teal"
        />
        <AdminStatsCard
          title="Dispatched / Done (Page)"
          value={dispatchedCount}
          subtitle="Shipped / Delivered"
          icon={Truck}
          color="slate"
        />
        <AdminStatsCard
          title="Cancelled (Page)"
          value={cancelledCount}
          subtitle="Terminated orders"
          icon={Ban}
          color="rose"
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchOrders()}
            className="px-3 py-1.5 bg-white text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 text-xs font-bold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Order List Component */}
      <AdminOrderList
        data={data}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        query={query}
        statusFilter={statusFilter}
        onPageChange={(newPage) => setPage(newPage)}
        onSearchChange={(newQuery) => {
          setQuery(newQuery);
          setPage(0);
        }}
        onStatusFilterChange={(newStatus) => {
          setStatusFilter(newStatus);
          setPage(0);
        }}
        onRefresh={fetchOrders}
      />
    </div>
  );
}
