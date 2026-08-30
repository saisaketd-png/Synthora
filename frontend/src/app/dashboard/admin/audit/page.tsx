"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getAuditLogs,
  getAuditSummary,
  AdminAuditLog,
  AuditKpiSummary,
  AuditAction,
  AuditTargetType,
  PageResponse,
} from "@/features/admin/api/adminAuditApi";
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  Package,
  Layers,
  FileText,
  Lock,
  Calendar,
  X,
  Eye,
  Activity,
  AlertCircle,
} from "lucide-react";

type CategoryTab =
  | "ALL"
  | "USER_GOVERNANCE"
  | "SUPPLIER_TRUST"
  | "MASTER_CATALOG"
  | "SUPPLIER_OFFERINGS"
  | "TRANSACTIONS";

const CATEGORY_ACTIONS: Record<CategoryTab, AuditAction[]> = {
  ALL: [],
  USER_GOVERNANCE: [
    "USER_CREATED",
    "USER_SUSPENDED",
    "USER_ACTIVATED",
    "USER_REINSTATED",
    "USER_ROLE_CHANGED",
    "USER_DELETED",
    "APPEAL_SUBMITTED",
    "APPEAL_REVIEW_STARTED",
    "APPEAL_INFORMATION_REQUESTED",
    "APPEAL_INFORMATION_RESPONDED",
    "APPEAL_APPROVED",
    "APPEAL_REJECTED",
  ],
  SUPPLIER_TRUST: [
    "SUPPLIER_VERIFICATION_SUBMITTED",
    "SUPPLIER_REVIEW_STARTED",
    "SUPPLIER_INFORMATION_REQUESTED",
    "SUPPLIER_VERIFIED",
    "SUPPLIER_UNVERIFIED",
    "SUPPLIER_REJECTED",
    "SUPPLIER_EXPORT_READY_CHANGED",
    "SUPPLIER_SUSPENDED",
    "SUPPLIER_ACTIVATED",
    "SUPPLIER_LOGO_UPLOADED",
    "SUPPLIER_EVIDENCE_UPDATED",
  ],
  MASTER_CATALOG: [
    "PRODUCT_REQUEST_APPROVED",
    "PRODUCT_REQUEST_REJECTED",
    "MASTER_PRODUCT_CREATED",
    "MASTER_PRODUCT_UPDATED",
    "MASTER_PRODUCT_ACTIVATED",
    "MASTER_PRODUCT_DEACTIVATED",
    "MASTER_PRODUCT_MERGED",
    "PRODUCT_UPDATED",
    "PRODUCT_DELETED",
    "DOCUMENT_DELETED",
  ],
  SUPPLIER_OFFERINGS: [
    "SUPPLIER_OFFERING_CREATED",
    "SUPPLIER_OFFERING_CREATED_BY_ADMIN",
    "SUPPLIER_OFFERING_UPDATED",
    "SUPPLIER_OFFERING_ACTIVATED",
    "SUPPLIER_OFFERING_DEACTIVATED",
    "SUPPLIER_OFFERING_APPROVED",
    "SUPPLIER_OFFERING_REJECTED",
    "SUPPLIER_OFFERING_FLAGGED",
  ],
  TRANSACTIONS: [
    "RFQ_STATUS_CHANGED",
    "ORDER_CANCELLED",
    "PO_CONFIRMED",
    "PO_PROCESSING_STARTED",
    "PO_SHIPPED",
    "PO_DELIVERED",
    "PO_REJECTED",
  ],
};

export default function AdminAuditPage() {
  const [logsData, setLogsData] = useState<PageResponse<AdminAuditLog>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: true,
  });
  const [summary, setSummary] = useState<AuditKpiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>("ALL");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [datePreset, setDatePreset] = useState<"ALL" | "TODAY" | "7DAYS" | "30DAYS" | "CUSTOM">("ALL");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);

  // Selected Log Drawer Modal
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  // Fetch KPI Summary
  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const data = await getAuditSummary();
      setSummary(data);
    } catch (err: any) {
      console.error("Failed to load audit summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Compute ISO Dates based on preset
  const getDateRange = useCallback(() => {
    const now = new Date();
    if (datePreset === "TODAY") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { from: todayStart.toISOString(), to: now.toISOString() };
    }
    if (datePreset === "7DAYS") {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { from: past.toISOString(), to: now.toISOString() };
    }
    if (datePreset === "30DAYS") {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { from: past.toISOString(), to: now.toISOString() };
    }
    if (datePreset === "CUSTOM") {
      return {
        from: customFrom ? new Date(customFrom).toISOString() : undefined,
        to: customTo ? new Date(customTo).toISOString() : undefined,
      };
    }
    return { from: undefined, to: undefined };
  }, [datePreset, customFrom, customTo]);

  // Fetch Logs
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dateRange = getDateRange();
      const res = await getAuditLogs({
        action: actionFilter || undefined,
        targetType: targetTypeFilter || undefined,
        from: dateRange.from,
        to: dateRange.to,
        query: searchQuery.trim() || undefined,
        page: currentPage,
        size: 20,
      });
      setLogsData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, targetTypeFilter, getDateRange, searchQuery, currentPage]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Handle Category Tab Switch
  const handleCategoryChange = (tab: CategoryTab) => {
    setSelectedCategory(tab);
    setActionFilter("");
    setCurrentPage(0);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory("ALL");
    setActionFilter("");
    setTargetTypeFilter("");
    setSearchQuery("");
    setDatePreset("ALL");
    setCustomFrom("");
    setCustomTo("");
    setCurrentPage(0);
  };

  // Helper: Action Badge Color
  const getActionBadge = (action: AuditAction) => {
    if (action.includes("SUSPENDED") || action.includes("REJECTED") || action.includes("DELETED")) {
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800";
    }
    if (action.includes("VERIFIED") || action.includes("APPROVED") || action.includes("ACTIVATED") || action.includes("REINSTATED")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
    }
    if (action.includes("REQUESTED") || action.includes("INFORMATION") || action.includes("FLAGGED") || action.includes("MERGED")) {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800";
    }
    if (action.includes("CREATED") || action.includes("SUBMITTED")) {
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800";
    }
    return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  };

  // Helper: Deep Link to Target Entity
  const getTargetRoute = (targetType: AuditTargetType, targetId: string): string | null => {
    switch (targetType) {
      case "USER":
        return `/dashboard/admin/account-governance/${targetId}`;
      case "SUPPLIER":
        return `/dashboard/admin/suppliers/verification/${targetId}`;
      case "MASTER_PRODUCT":
        return `/dashboard/admin/catalog/master-products/${targetId}`;
      case "SUPPLIER_OFFERING":
        return `/dashboard/admin/catalog/offerings/${targetId}`;
      case "ACCOUNT_SUSPENSION":
      case "ACCOUNT_SUSPENSION_APPEAL":
        return `/dashboard/admin/account-governance`;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 border border-slate-700">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Audit & Governance Engine
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Centralized platform audit trail and administrative governance history.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadSummary();
              loadLogs();
            }}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-500" : ""}`} />
            Refresh Stream
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Events
            </span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {summaryLoading ? "..." : summary?.totalEvents.toLocaleString() || 0}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Immutable records</span>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Today's Actions
            </span>
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-950 dark:text-emerald-200 mt-2">
            {summaryLoading ? "..." : summary?.todayEvents.toLocaleString() || 0}
          </p>
          <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 block">Since UTC midnight</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              User Governance
            </span>
            <User className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {summaryLoading ? "..." : summary?.userGovernanceEvents.toLocaleString() || 0}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Accounts & appeals</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Supplier Trust
            </span>
            <Building2 className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {summaryLoading ? "..." : summary?.supplierGovernanceEvents.toLocaleString() || 0}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">KYC & verifications</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Catalog & Offers
            </span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {summaryLoading ? "..." : summary?.catalogGovernanceEvents.toLocaleString() || 0}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Master products & offers</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex overflow-x-auto gap-2 py-1 scrollbar-none">
          {[
            { id: "ALL", label: "All Events" },
            { id: "USER_GOVERNANCE", label: "User Governance" },
            { id: "SUPPLIER_TRUST", label: "Supplier Trust" },
            { id: "MASTER_CATALOG", label: "Master Catalog" },
            { id: "SUPPLIER_OFFERINGS", label: "Supplier Offerings" },
            { id: "TRANSACTIONS", label: "Transactions" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleCategoryChange(tab.id as CategoryTab)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg transition-all border-b-2 ${
                selectedCategory === tab.id
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/50 dark:bg-emerald-950/20"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Free-text search */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by actor, target ID, details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setCurrentPage(0);
                  loadLogs();
                }
              }}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Actions</option>
              {(selectedCategory === "ALL"
                ? Object.values(CATEGORY_ACTIONS).flat()
                : CATEGORY_ACTIONS[selectedCategory]
              ).map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Target Type Filter */}
          <div>
            <select
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Target Types</option>
              <option value="USER">USER</option>
              <option value="SUPPLIER">SUPPLIER</option>
              <option value="MASTER_PRODUCT">MASTER_PRODUCT</option>
              <option value="SUPPLIER_OFFERING">SUPPLIER_OFFERING</option>
              <option value="ACCOUNT_SUSPENSION">ACCOUNT_SUSPENSION</option>
              <option value="ACCOUNT_SUSPENSION_APPEAL">ACCOUNT_SUSPENSION_APPEAL</option>
              <option value="PRODUCT_REQUEST">PRODUCT_REQUEST</option>
              <option value="PRODUCT">PRODUCT</option>
              <option value="DOCUMENT">DOCUMENT</option>
              <option value="RFQ">RFQ</option>
              <option value="PURCHASE_ORDER">PURCHASE_ORDER</option>
            </select>
          </div>
        </div>

        {/* Date Presets & Custom Dates */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5" /> Date:
            </span>
            {[
              { id: "ALL", label: "All Time" },
              { id: "TODAY", label: "Today" },
              { id: "7DAYS", label: "Last 7 Days" },
              { id: "30DAYS", label: "Last 30 Days" },
              { id: "CUSTOM", label: "Custom" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setDatePreset(p.id as any);
                  setCurrentPage(0);
                }}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  datePreset === p.id
                    ? "bg-emerald-600 text-white font-medium shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}

            {datePreset === "CUSTOM" && (
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2.5 py-1 font-medium transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={() => {
                setCurrentPage(0);
                loadLogs();
              }}
              className="px-3 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md text-xs font-semibold hover:bg-slate-800 dark:hover:bg-white transition-colors"
            >
              Apply Search
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Timestamp (UTC)</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target</th>
                <th className="py-3.5 px-4">Summary Details</th>
                <th className="py-3.5 px-4">Client IP</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Loading immutable audit stream...
                  </td>
                </tr>
              ) : logsData.content.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    No audit records matching your current filter parameters.
                  </td>
                </tr>
              ) : (
                logsData.content.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedLog(item)}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-xs">
                      {new Date(item.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        timeZone: "UTC",
                      })}{" "}
                      <span className="text-[10px] text-slate-400">UTC</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                          {item.adminName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono truncate max-w-[160px]">
                          {item.adminEmail}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionBadge(
                          item.action
                        )}`}
                      >
                        {item.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {item.targetType}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono truncate max-w-[120px]">
                          {item.targetId}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs max-w-xs truncate">
                      {item.details || <span className="text-slate-400 italic">No notes</span>}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-400">
                      {item.ipAddress || "127.0.0.1"}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(item);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View Record Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <div>
            Showing{" "}
            <span className="font-medium text-slate-900 dark:text-white">
              {logsData.content.length > 0 ? logsData.number * logsData.size + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-medium text-slate-900 dark:text-white">
              {Math.min((logsData.number + 1) * logsData.size, logsData.totalElements)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-900 dark:text-white">{logsData.totalElements}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={logsData.first || loading}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs px-2 font-medium">
              Page {logsData.totalPages === 0 ? 0 : logsData.number + 1} of {logsData.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => (p + 1 < logsData.totalPages ? p + 1 : p))}
              disabled={logsData.last || loading}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Detail Modal / Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Audit Event Details</h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                      Immutable Record
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">UUID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Event Summary Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Timestamp (UTC)</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                    {new Date(selectedLog.createdAt).toISOString()}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Client IP Address</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                    {selectedLog.ipAddress || "127.0.0.1"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Actor Name</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedLog.adminName}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Actor Email</span>
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                    {selectedLog.adminEmail}
                  </span>
                </div>
              </div>

              {/* Action & Target */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Action Executed</span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getActionBadge(
                      selectedLog.action
                    )}`}
                  >
                    {selectedLog.action}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      Target Entity
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {selectedLog.targetType}
                    </span>
                    <span className="text-xs font-mono text-slate-400 block mt-0.5">
                      ID: {selectedLog.targetId}
                    </span>
                  </div>

                  {getTargetRoute(selectedLog.targetType, selectedLog.targetId) && (
                    <Link
                      href={getTargetRoute(selectedLog.targetType, selectedLog.targetId)!}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors"
                    >
                      <span>View Target</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Full Details Payload */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Action Details & Reason
                </span>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                  {selectedLog.details || "No structured notes recorded for this event."}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                Tamper-evident system log
              </span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
