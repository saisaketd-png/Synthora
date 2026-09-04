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
import { PageHeader } from "@/shared/components/ui/KemkendraUI";

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
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { from: start.toISOString(), to: now.toISOString() };
    }
    if (datePreset === "7DAYS") {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { from: start.toISOString(), to: now.toISOString() };
    }
    if (datePreset === "30DAYS") {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { from: start.toISOString(), to: now.toISOString() };
    }
    if (datePreset === "CUSTOM" && customFrom && customTo) {
      return { from: new Date(customFrom).toISOString(), to: new Date(customTo).toISOString() };
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
        page: currentPage,
        size: 20,
        action: actionFilter || undefined,
        targetType: targetTypeFilter || undefined,
        from: dateRange.from,
        to: dateRange.to,
        query: searchQuery.trim() || undefined,
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
      return "bg-[#FEF2F2] text-[#DC2626] border-[rgba(220,38,38,0.2)]";
    }
    if (action.includes("VERIFIED") || action.includes("APPROVED") || action.includes("ACTIVATED") || action.includes("REINSTATED")) {
      return "bg-[#ECFDF5] text-[#059669] border-[rgba(5,150,105,0.2)]";
    }
    if (action.includes("REQUESTED") || action.includes("INFORMATION") || action.includes("FLAGGED") || action.includes("MERGED")) {
      return "bg-[#FFFBEB] text-[#D97706] border-[rgba(217,119,6,0.2)]";
    }
    if (action.includes("CREATED") || action.includes("SUBMITTED")) {
      return "bg-[#EFF6FF] text-[#0052CC] border-[#BFDBFE]";
    }
    return "bg-[#F4F4F5] text-[#475569] border-[#E4E4E7]";
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
    <div className="max-w-[1400px] mx-auto space-y-6 text-[#0F172A] pb-12">
      {/* 1. Calm Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#E4E4E7] pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#0052CC] block mb-1">
            Governance & Compliance
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A]">
            Platform Audit Ledger
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-xl">
            Immutable, append-only security telemetry and administrative activity trail across marketplace operations.
          </p>
        </div>

        <button
          onClick={() => {
            loadSummary();
            loadLogs();
          }}
          disabled={loading}
          className="h-8 px-3 text-xs font-medium text-[#475569] bg-white hover:bg-[#FAFAFA] border border-[#E4E4E7] rounded-[4px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0052CC]" : "text-[#64748B]"}`} />
          <span>Refresh Stream</span>
        </button>
      </div>

      {/* 2. Horizontal Activity Summary Band (Not 5 bulky cards) */}
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-4 shadow-xs">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] mb-3">
          Telemetry Summary
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E4E7]">
          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Total Events</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5">
              {summaryLoading ? "—" : summary?.totalEvents.toLocaleString() || 0}
            </div>
            <span className="text-[10px] text-[#94A3B8] font-mono">immutable ledger</span>
          </div>

          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Today's Actions</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5">
              {summaryLoading ? "—" : summary?.todayEvents.toLocaleString() || 0}
            </div>
            <span className="text-[10px] text-[#94A3B8] font-mono">since UTC midnight</span>
          </div>

          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">User Governance</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5">
              {summaryLoading ? "—" : summary?.userGovernanceEvents.toLocaleString() || 0}
            </div>
            <span className="text-[10px] text-[#94A3B8] font-mono">accounts & roles</span>
          </div>

          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Supplier Trust</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5">
              {summaryLoading ? "—" : summary?.supplierGovernanceEvents.toLocaleString() || 0}
            </div>
            <span className="text-[10px] text-[#94A3B8] font-mono">KYC & verification</span>
          </div>

          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Catalog & Offers</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5">
              {summaryLoading ? "—" : summary?.catalogGovernanceEvents.toLocaleString() || 0}
            </div>
            <span className="text-[10px] text-[#94A3B8] font-mono">products & listings</span>
          </div>
        </div>
      </div>

      {/* Category Segmented Tabs */}
      <div className="flex items-center p-0.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px] w-fit overflow-x-auto max-w-full">
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
            className={`flex items-center h-7 px-3 text-xs font-medium rounded-[4px] whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === tab.id
                ? "bg-[#0052CC] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4F4F5]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-3.5 rounded-[8px] border border-[#E4E4E7] bg-white shadow-tactile-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Free-text search */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
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
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-[6px] border border-[#E4E4E7] bg-[#FAFAFA] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0052CC]"
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
              className="w-full px-2.5 py-1.5 rounded-[6px] border border-[#E4E4E7] bg-[#FAFAFA] text-xs text-[#0F172A] focus:outline-none focus:border-[#0052CC]"
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
              className="w-full px-2.5 py-1.5 rounded-[6px] border border-[#E4E4E7] bg-[#FAFAFA] text-xs text-[#0F172A] focus:outline-none focus:border-[#0052CC]"
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

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E4E4E7]">
            <button
              onClick={handleResetFilters}
              className="h-7 px-3 text-xs text-[#64748B] hover:text-[#0F172A] font-medium transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              onClick={() => {
                setCurrentPage(0);
                loadLogs();
              }}
              className="h-7 px-3.5 bg-[#0052CC] text-white rounded-[6px] text-xs font-medium hover:bg-[#0747A6] transition-colors cursor-pointer shadow-xs"
            >
              Apply Search
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3.5 rounded-[6px] bg-[#FEF2F2] border border-[rgba(220,38,38,0.2)] text-[#DC2626] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Table */}
      <div className="rounded-[8px] border border-[#E4E4E7] bg-white shadow-tactile-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-[#E4E4E7] text-[#475569] font-mono font-semibold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Timestamp (UTC)</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Target</th>
                <th className="py-2.5 px-4">Summary Details</th>
                <th className="py-2.5 px-4">Client IP</th>
                <th className="py-2.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#0052CC]" />
                    Loading immutable audit stream...
                  </td>
                </tr>
              ) : logsData.content.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-[#94A3B8]" />
                    No audit records matching your current filter parameters.
                  </td>
                </tr>
              ) : (
                logsData.content.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(item)}
                  >
                    <td className="py-2.5 px-4 whitespace-nowrap text-[#475569] font-mono text-[11px]">
                      {new Date(item.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        timeZone: "UTC",
                      })}{" "}
                      <span className="text-[10px] text-[#94A3B8]">UTC</span>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#0F172A] text-xs">
                          {item.adminName}
                        </span>
                        <span className="text-[11px] text-[#64748B] font-mono truncate max-w-[160px]">
                          {item.adminEmail}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold border ${getActionBadge(
                          item.action
                        )}`}
                      >
                        {item.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-[#0F172A]">
                          {item.targetType}
                        </span>
                        <span className="text-[11px] text-[#64748B] font-mono truncate max-w-[120px]">
                          {item.targetId || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-[#334155] text-xs max-w-xs truncate">
                      {item.details || <span className="text-[#94A3B8] italic">No notes</span>}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap font-mono text-xs text-[#64748B]">
                      {item.ipAddress || "127.0.0.1"}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(item);
                        }}
                        className="p-1 rounded-[4px] border border-[#E4E4E7] text-[#64748B] hover:text-[#0052CC] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                        title="View Record Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
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
