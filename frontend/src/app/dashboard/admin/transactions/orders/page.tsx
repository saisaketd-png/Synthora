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

import { PageHeader } from "@/shared/components/ui/KemkendraUI";

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
    <div className="max-w-[1400px] mx-auto space-y-6 text-[#0F172A] pb-12">
      {/* 1. Calm Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#E4E4E7] pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#0052CC] block mb-1">
            Commercial Fulfillment
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A]">
            Purchase Orders & Shipments
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-xl">
            Commercial contracts, order acceptance, carrier dispatch, milestone progress, and fulfillment audit records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchOrders()}
          disabled={isLoading}
          className="h-8 px-3 text-xs font-medium text-[#475569] bg-white hover:bg-[#FAFAFA] border border-[#E4E4E7] rounded-[4px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#0052CC]" : "text-[#64748B]"}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Horizontal Overview Band */}
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-4 shadow-xs">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] mb-3">
          Order Volumes
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E4E7]">
          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Total Orders</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5">{totalOrders}</div>
          </div>
          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">In Fulfillment</span>
            <div className="text-lg font-bold font-mono text-[#D97706] mt-0.5">{inFulfillmentCount}</div>
          </div>
          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Dispatched / Delivered</span>
            <div className="text-lg font-bold font-mono text-[#059669] mt-0.5">{dispatchedCount}</div>
          </div>
          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Cancelled</span>
            <div className="text-lg font-bold font-mono text-[#DC2626] mt-0.5">{cancelledCount}</div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between p-3.5 rounded-[6px] bg-[#FEF2F2] border border-[rgba(220,38,38,0.2)] text-[#DC2626] text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchOrders()}
            className="px-2.5 py-1 bg-white text-[#DC2626] border border-[#E4E4E7] rounded-[4px] hover:bg-[#FAFAFA] text-xs font-medium transition-colors cursor-pointer"
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
