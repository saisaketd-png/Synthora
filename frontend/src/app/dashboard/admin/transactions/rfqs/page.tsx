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
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <FileText className="w-3.5 h-3.5" />
              Procurement Oversight
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              RFQ Oversight
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Monitor procurement requests, immutable quotation revisions, and RFQ lifecycle transitions. All administrative closures and cancellations are recorded in the audit log.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchRfqs()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-600" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Total RFQs"
          value={totalRfqs}
          subtitle="Matching criteria"
          icon={FileText}
          color="amber"
        />
        <AdminStatsCard
          title="In Negotiation (Page)"
          value={quotedCount}
          subtitle="Quoted / Accepted"
          icon={CheckCircle2}
          color="teal"
        />
        <AdminStatsCard
          title="Pending (Page)"
          value={pendingCount}
          subtitle="Awaiting supplier response"
          icon={Clock}
          color="blue"
        />
        <AdminStatsCard
          title="Terminal (Page)"
          value={terminalCount}
          subtitle="Closed / Cancelled"
          icon={Lock}
          color="slate"
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
            onClick={() => fetchRfqs()}
            className="px-3 py-1.5 bg-white text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 text-xs font-bold transition-colors"
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
