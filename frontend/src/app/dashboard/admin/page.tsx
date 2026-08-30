"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  Package,
  FileText,
  ShoppingCart,
  Shield,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Truck,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  ShieldCheck,
  Search,
} from "lucide-react";
import { AdminAnalyticsOverviewResponse } from "@/features/admin/types";
import { getAdminAnalyticsOverview } from "@/features/admin/api/adminApi";
import { PlatformTrendChart, MarketplaceFunnelChart } from "@/features/admin/components/AnalyticsCharts";
import { ActionCenterAlerts } from "@/features/admin/components/ActionCenterAlerts";
import { RecentActivityFeed } from "@/features/admin/components/RecentActivityFeed";
import { Button, SkeletonLoader } from "@/shared/components/ui/SynthoraUI";

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<string>("30d");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);

  const [analytics, setAnalytics] = useState<AdminAnalyticsOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAdminAnalyticsOverview({
        period,
        from: period === "custom" ? customFrom : undefined,
        to: period === "custom" ? customTo : undefined,
      });
      setAnalytics(data);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load platform analytics";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [period, customFrom, customTo]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handlePeriodChange = (newPeriod: string) => {
    if (newPeriod === "custom") {
      setShowCustomModal(true);
    } else {
      setPeriod(newPeriod);
    }
  };

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return;
    if (new Date(customFrom) > new Date(customTo)) {
      alert("Start date must be before or equal to end date");
      return;
    }
    setPeriod("custom");
    setShowCustomModal(false);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "7d":
        return "Last 7 Days";
      case "30d":
        return "Last 30 Days";
      case "90d":
        return "Last 90 Days";
      case "12m":
        return "Last 12 Months";
      case "custom":
        return `${customFrom} to ${customTo}`;
      default:
        return "Last 30 Days";
    }
  };

  return (
    <div className="max-w-[1560px] mx-auto space-y-6 pb-12">
      {/* 1. Header & Live Operational Search */}
      <div className="bg-white border border-[#DFE1E6] rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-[#0052CC] bg-[#DEEBFF] px-2 py-0.5 rounded uppercase">
              Admin Platform Operations
            </span>
            <span className="text-xs text-[#7A869A]">•</span>
            <span className="text-xs font-mono text-[#5E6C84]">{getPeriodLabel()}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#091E42] mt-1">
            Platform Analytics & Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#5E6C84] mt-0.5">
            Real-time commercial transaction telemetry, conversion efficiency, and governance queues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Filter Buttons */}
          <div className="flex items-center p-1 bg-[#F4F5F7] border border-[#DFE1E6] rounded-xl shadow-2xs">
            {[
              { id: "7d", label: "7D" },
              { id: "30d", label: "30D" },
              { id: "90d", label: "90D" },
              { id: "12m", label: "12M" },
              { id: "custom", label: "Custom" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handlePeriodChange(item.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  period === item.id
                    ? "bg-[#0052CC] text-white shadow-xs"
                    : "text-[#5E6C84] hover:text-[#091E42] hover:bg-[#EBECF0]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#091E42] bg-white hover:bg-[#F4F5F7] border border-[#DFE1E6] rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#0052CC]" : "text-[#5E6C84]"}`} />
            <span>{lastRefreshed ? `Refreshed ${lastRefreshed}` : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Error Banner if any */}
      {error && (
        <div className="p-4 rounded-xl bg-[#FFEBE6] border border-[#FFBDAD] flex items-center justify-between text-[#DE350B] text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#DE350B] shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-3 py-1 bg-white border border-[#FFBDAD] text-xs font-bold rounded-lg hover:bg-[#FFEBE6]"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GMV Card */}
        <div className="bg-white border border-[#DFE1E6] p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#5E6C84] mb-2">
            <span className="font-semibold uppercase tracking-wider font-mono text-[10px]">Total GMV / PO Value</span>
            <div className="p-2 rounded-xl bg-[#E3FCEF] text-[#00875A]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          {isLoading || !analytics ? (
            <SkeletonLoader className="h-8 w-28 mt-2" />
          ) : (
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#091E42] tracking-tight">
                ${analytics.commercial.totalGmv.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                {analytics.commercial.gmvGrowthPercentage !== null && analytics.commercial.gmvGrowthPercentage !== undefined ? (
                  <span className={`inline-flex items-center gap-0.5 font-bold font-mono px-1.5 py-0.2 rounded text-[11px] ${analytics.commercial.gmvGrowthPercentage >= 0 ? "bg-[#E3FCEF] text-[#006644]" : "bg-[#FFEBE6] text-[#DE350B]"}`}>
                    {analytics.commercial.gmvGrowthPercentage >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {analytics.commercial.gmvGrowthPercentage >= 0 ? `+${analytics.commercial.gmvGrowthPercentage}%` : `${analytics.commercial.gmvGrowthPercentage}%`}
                  </span>
                ) : (
                  <span className="text-[#7A869A] font-mono text-[11px]">baseline</span>
                )}
                <span className="text-[#7A869A]">vs previous period</span>
              </div>
            </div>
          )}
        </div>

        {/* Purchase Orders Card */}
        <div className="bg-white border border-[#DFE1E6] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5E6C84] mb-2">
            <span className="font-semibold uppercase tracking-wider font-mono text-[10px]">Purchase Orders</span>
            <div className="p-2 rounded-xl bg-[#DEEBFF] text-[#0052CC]">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          {isLoading || !analytics ? (
            <SkeletonLoader className="h-8 w-24 mt-2" />
          ) : (
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#091E42] tracking-tight">
                {analytics.orders.totalOrders.toLocaleString("en-US")}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-[#5E6C84]">
                <span>{analytics.orders.placedOrders} placed</span>
                <span>•</span>
                <span>{analytics.orders.completedOrders} completed</span>
              </div>
            </div>
          )}
        </div>

        {/* Open RFQs Card */}
        <div className="bg-white border border-[#DFE1E6] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5E6C84] mb-2">
            <span className="font-semibold uppercase tracking-wider font-mono text-[10px]">Active Open RFQs</span>
            <div className="p-2 rounded-xl bg-[#FFF0B3] text-[#FF8B00]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          {isLoading || !analytics ? (
            <SkeletonLoader className="h-8 w-20 mt-2" />
          ) : (
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#091E42] tracking-tight">
                {analytics.marketplace.openRfqs.toLocaleString("en-US")}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-[#5E6C84]">
                <span>{analytics.marketplace.totalRfqs} total created</span>
                <span>•</span>
                <span>{analytics.marketplace.totalQuotations} quotes</span>
              </div>
            </div>
          )}
        </div>

        {/* Users & Verified Sellers Card */}
        <div className="bg-white border border-[#DFE1E6] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5E6C84] mb-2">
            <span className="font-semibold uppercase tracking-wider font-mono text-[10px]">Registered Users</span>
            <div className="p-2 rounded-xl bg-[#EAE6FF] text-[#6554C0]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          {isLoading || !analytics ? (
            <SkeletonLoader className="h-8 w-20 mt-2" />
          ) : (
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#091E42] tracking-tight">
                {analytics.users.totalUsers.toLocaleString("en-US")}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-[#5E6C84]">
                <span>{analytics.users.totalBuyers} buyers</span>
                <span>•</span>
                <span>{analytics.suppliers.verifiedSuppliers} verified sellers</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Interactive Charts: Trends & Funnel */}
      {isLoading || !analytics ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonLoader className="h-80 rounded-2xl" />
          <SkeletonLoader className="h-80 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlatformTrendChart trends={analytics.trends} periodLabel={getPeriodLabel()} />
          <MarketplaceFunnelChart funnel={analytics.funnel} />
        </div>
      )}

      {/* 4. Action Center & Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {isLoading || !analytics ? (
            <SkeletonLoader className="h-64 rounded-2xl" />
          ) : (
            <ActionCenterAlerts items={analytics.actionCenter} />
          )}
        </div>

        <div className="lg:col-span-2">
          {isLoading || !analytics ? (
            <SkeletonLoader className="h-64 rounded-2xl" />
          ) : (
            <RecentActivityFeed activities={analytics.recentActivity} />
          )}
        </div>
      </div>

      {/* 5. Direct Administration Quick Navigation */}
      <div className="bg-white border border-[#DFE1E6] rounded-2xl p-5 sm:p-6 shadow-sm">
        <h3 className="text-xs font-bold text-[#5E6C84] uppercase tracking-wider mb-4 font-mono">
          Platform Management Consoles
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            href="/dashboard/admin/users"
            className="p-4 rounded-xl bg-[#FAFBFC] border border-[#DFE1E6] hover:border-[#0052CC] hover:bg-white transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#DEEBFF] text-[#0052CC]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-[#091E42] group-hover:text-[#0052CC]">
                  User Accounts
                </div>
                <div className="text-[11px] text-[#5E6C84]">Governance & Roles</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#7A869A] group-hover:text-[#0052CC] transition-colors" />
          </Link>

          <Link
            href="/dashboard/admin/suppliers"
            className="p-4 rounded-xl bg-[#FAFBFC] border border-[#DFE1E6] hover:border-[#0052CC] hover:bg-white transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#DEEBFF] text-[#0052CC]">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-[#091E42] group-hover:text-[#0052CC]">
                  Supplier Directory
                </div>
                <div className="text-[11px] text-[#5E6C84]">Verifications & Profiles</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#7A869A] group-hover:text-[#0052CC] transition-colors" />
          </Link>

          <Link
            href="/dashboard/admin/transactions/orders"
            className="p-4 rounded-xl bg-[#FAFBFC] border border-[#DFE1E6] hover:border-[#0052CC] hover:bg-white transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#E3FCEF] text-[#00875A]">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-[#091E42] group-hover:text-[#0052CC]">
                  Orders & Shipments
                </div>
                <div className="text-[11px] text-[#5E6C84]">PO Lifecycle & Tracking</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#7A869A] group-hover:text-[#0052CC] transition-colors" />
          </Link>

          <Link
            href="/dashboard/admin/catalog"
            className="p-4 rounded-xl bg-[#FAFBFC] border border-[#DFE1E6] hover:border-[#0052CC] hover:bg-white transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#EAE6FF] text-[#6554C0]">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-[#091E42] group-hover:text-[#0052CC]">
                  Master Catalog
                </div>
                <div className="text-[11px] text-[#5E6C84]">Chemicals & Offerings</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#7A869A] group-hover:text-[#0052CC] transition-colors" />
          </Link>
        </div>
      </div>

      {/* Custom Date Range Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#DFE1E6] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#091E42]">Select Custom Date Range</h3>
            <p className="text-xs text-[#5E6C84]">
              Filter telemetry data across a customized historical interval.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Start Date</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full bg-white border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">End Date</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full bg-white border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-[#5E6C84] hover:bg-[#F4F5F7] rounded-xl border border-[#DFE1E6] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyCustomRange}
                disabled={!customFrom || !customTo}
                className="px-4 py-2 text-xs font-semibold bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
