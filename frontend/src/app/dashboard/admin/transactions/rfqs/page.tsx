"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  Lock,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { AdminRfqResponse, RfqStatus, PaginatedResponse } from "@/features/admin/types";
import { getAdminRfqs } from "@/features/admin/api/adminApi";
import { AdminRfqList } from "@/features/admin/components/transactions/AdminRfqList";
import { AdminStatsCard } from "@/features/admin/components/AdminStatsCard";

import { PageHeader } from "@/shared/components/ui/KemkendraUI";

export default function AdminRfqsPage() {
  const [data, setData] = useState<PaginatedResponse<AdminRfqResponse>>({
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
  const [statusFilter, setStatusFilter] = useState<RfqStatus | "">("");

  const fetchRfqs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAdminRfqs({
        page,
        size: pageSize,
        query: query.trim() || undefined,
        status: statusFilter || undefined,
      });
      setData(response);
    } catch (err: any) {
      setError(err.message || "Failed to load RFQ transactions");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, query, statusFilter]);

  useEffect(() => {
    fetchRfqs();
  }, [fetchRfqs]);

  // Derived metrics
  const totalRfqs = data.totalElements;
  const pendingCount = data.content.filter((r) => r.status === "PENDING" || r.status === "CONTACTED").length;
  const quotedCount = data.content.filter((r) => r.status === "QUOTED" || r.status === "ACCEPTED").length;
  const terminalCount = data.content.filter((r) => r.status === "CLOSED" || r.status === "CANCELLED").length;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 text-[#0F172A] pb-12">
      {/* 1. Calm Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#E4E4E7] pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#0052CC] block mb-1">
            Commercial Sourcing
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A]">
            Sourcing Requests & Negotiations
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-xl">
            Sourcing RFQs, supplier quote proposals, counter-offers, and procurement closure lifecycle.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchRfqs()}
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
          Sourcing Pipeline
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E4E7]">
          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Total RFQs</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5">{totalRfqs}</div>
          </div>
          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Awaiting Quote</span>
            <div className="text-lg font-bold font-mono text-[#D97706] mt-0.5">{pendingCount}</div>
          </div>
          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Quoted / In Review</span>
            <div className="text-lg font-bold font-mono text-[#059669] mt-0.5">{quotedCount}</div>
          </div>
          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Closed / Terminal</span>
            <div className="text-lg font-bold font-mono text-[#64748B] mt-0.5">{terminalCount}</div>
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
            onClick={() => fetchRfqs()}
            className="px-2.5 py-1 bg-white text-[#DC2626] border border-[#E4E4E7] rounded-[4px] hover:bg-[#FAFAFA] text-xs font-medium transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* RFQ List Component */}
      <AdminRfqList
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
        onRefresh={fetchRfqs}
      />
    </div>
  );
}
