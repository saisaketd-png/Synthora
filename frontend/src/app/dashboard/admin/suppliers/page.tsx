"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  ShieldCheck,
  Globe2,
  UserX,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { AdminSupplierResponse, UserStatus, PaginatedResponse } from "@/features/admin/types";
import { getAdminSuppliers } from "@/features/admin/api/adminApi";
import { AdminSupplierList } from "@/features/admin/components/suppliers/AdminSupplierList";
import { AdminStatsCard } from "@/features/admin/components/AdminStatsCard";

export default function AdminSuppliersPage() {
  const [data, setData] = useState<PaginatedResponse<AdminSupplierResponse>>({
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
  const [country, setCountry] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | undefined>(undefined);
  const [exportReadyFilter, setExportReadyFilter] = useState<boolean | undefined>(undefined);
  const [userStatusFilter, setUserStatusFilter] = useState<UserStatus | "">("");

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAdminSuppliers({
        page,
        size: pageSize,
        query: query.trim() || undefined,
        country: country.trim() || undefined,
        verified: verifiedFilter,
        exportReady: exportReadyFilter,
        userStatus: userStatusFilter || undefined,
      });
      setData(response);
    } catch (err: any) {
      setError(err.message || "Failed to load suppliers");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, query, country, verifiedFilter, exportReadyFilter, userStatusFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Derived metrics from loaded dataset
  const totalSuppliers = data.totalElements;
  const verifiedCount = data.content.filter((s) => s.verified).length;
  const exportReadyCount = data.content.filter((s) => s.exportReady).length;
  const suspendedCount = data.content.filter((s) => s.userStatus === "SUSPENDED").length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
              <Building2 className="w-3.5 h-3.5" />
              Supplier Moderation & Verification
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Supplier Moderation
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Review supplier accounts, verification status, export readiness, and marketplace visibility. All administrative moderation actions are recorded to the immutable audit log.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchSuppliers()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-purple-600" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Total Suppliers"
          value={totalSuppliers}
          subtitle="Matching criteria"
          icon={Building2}
          color="purple"
        />
        <AdminStatsCard
          title="Verified (Page)"
          value={verifiedCount}
          subtitle="Verified standing"
          icon={ShieldCheck}
          color="teal"
        />
        <AdminStatsCard
          title="Export Ready (Page)"
          value={exportReadyCount}
          subtitle="Global suppliers"
          icon={Globe2}
          color="blue"
        />
        <AdminStatsCard
          title="Suspended (Page)"
          value={suspendedCount}
          subtitle="Restricted standing"
          icon={UserX}
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
            onClick={() => fetchSuppliers()}
            className="px-3 py-1.5 bg-white text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 text-xs font-bold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Supplier List */}
      <AdminSupplierList
        data={data}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        query={query}
        country={country}
        verifiedFilter={verifiedFilter}
        exportReadyFilter={exportReadyFilter}
        userStatusFilter={userStatusFilter}
        onPageChange={(newPage) => setPage(newPage)}
        onSearchChange={(newQuery) => {
          setQuery(newQuery);
          setPage(0);
        }}
        onCountryChange={(newCountry) => {
          setCountry(newCountry);
          setPage(0);
        }}
        onVerifiedFilterChange={(newVerified) => {
          setVerifiedFilter(newVerified);
          setPage(0);
        }}
        onExportReadyFilterChange={(newExport) => {
          setExportReadyFilter(newExport);
          setPage(0);
        }}
        onUserStatusFilterChange={(newStatus) => {
          setUserStatusFilter(newStatus);
          setPage(0);
        }}
        onRefresh={fetchSuppliers}
      />
    </div>
  );
}
