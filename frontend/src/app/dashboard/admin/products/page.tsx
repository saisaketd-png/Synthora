"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  CheckCircle2,
  EyeOff,
  Archive,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { AdminProductResponse, ProductAvailability, PaginatedResponse } from "@/features/admin/types";
import { getAdminProducts } from "@/features/admin/api/adminApi";
import { AdminProductList } from "@/features/admin/components/products/AdminProductList";
import { AdminStatsCard } from "@/features/admin/components/AdminStatsCard";

export default function AdminProductsPage() {
  const [data, setData] = useState<PaginatedResponse<AdminProductResponse>>({
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
  const [category, setCategory] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<ProductAvailability | "">("");

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAdminProducts({
        page,
        size: pageSize,
        query: query.trim() || undefined,
        category: category.trim() || undefined,
        availabilityStatus: availabilityFilter || undefined,
      });
      setData(response);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, query, category, availabilityFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Derived metrics from loaded page
  const totalProducts = data.totalElements;
  const availableCount = data.content.filter((p) => p.availabilityStatus === "AVAILABLE").length;
  const hiddenCount = data.content.filter((p) => p.availabilityStatus === "HIDDEN").length;
  const discontinuedCount = data.content.filter((p) => p.availabilityStatus === "DISCONTINUED").length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Package className="w-3.5 h-3.5" />
              Chemical Catalog Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Product Catalog Moderation
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Review catalog products, availability, technical metadata, and supplier commercial offerings. All administrative actions are recorded to the immutable audit log.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchProducts()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Total Products"
          value={totalProducts}
          subtitle="Matching criteria"
          icon={Package}
          color="teal"
        />
        <AdminStatsCard
          title="Available (Page)"
          value={availableCount}
          subtitle="Active in catalog"
          icon={CheckCircle2}
          color="blue"
        />
        <AdminStatsCard
          title="Hidden (Page)"
          value={hiddenCount}
          subtitle="Direct link only"
          icon={EyeOff}
          color="slate"
        />
        <AdminStatsCard
          title="Discontinued (Page)"
          value={discontinuedCount}
          subtitle="Deactivated from catalog"
          icon={Archive}
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
            onClick={() => fetchProducts()}
            className="px-3 py-1.5 bg-white text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 text-xs font-bold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Product List Component */}
      <AdminProductList
        data={data}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        query={query}
        category={category}
        availabilityFilter={availabilityFilter}
        onPageChange={(newPage) => setPage(newPage)}
        onSearchChange={(newQuery) => {
          setQuery(newQuery);
          setPage(0);
        }}
        onCategoryChange={(newCategory) => {
          setCategory(newCategory);
          setPage(0);
        }}
        onAvailabilityChange={(newStatus) => {
          setAvailabilityFilter(newStatus);
          setPage(0);
        }}
        onRefresh={fetchProducts}
      />
    </div>
  );
}
