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
import { getAdminAnalyticsOverview, getAdminRfqs, getAdminOrders } from "@/features/admin/api/adminApi";
import { PlatformTrendChart, MarketplaceFunnelChart } from "@/features/admin/components/AnalyticsCharts";
import { ActionCenterAlerts } from "@/features/admin/components/ActionCenterAlerts";
import { PageHeader, SkeletonLoader } from "@/shared/components/ui/KemkendraUI";
import { AdminRfqResponse, AdminPurchaseOrderResponse } from "@/features/admin/types";

interface ProductDemandItem {
  productId: string;
  productName: string;
  rfqCount: number;
  totalRfqVolume: number;
  unit: string;
  orderCount: number;
  totalOrderAmount: number;
  currency: string;
  activeQuotations: number;
  statusBreakdown: Record<string, number>;
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<string>("30d");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);

  const [analytics, setAnalytics] = useState<AdminAnalyticsOverviewResponse | null>(null);
  const [demandMetrics, setDemandMetrics] = useState<ProductDemandItem[]>([]);
  const [demandLoading, setDemandLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [overviewData, rfqData, orderData] = await Promise.all([
        getAdminAnalyticsOverview({
          period,
          from: period === "custom" ? customFrom : undefined,
          to: period === "custom" ? customTo : undefined,
        }),
        getAdminRfqs({ size: 100 }).catch(() => null),
        getAdminOrders({ size: 100 }).catch(() => null),
      ]);

      setAnalytics(overviewData);

      // Aggregate Product Sourcing Demand Intelligence
      if (rfqData?.content) {
        const demandMap: Record<string, ProductDemandItem> = {};

        // Aggregate RFQs
        rfqData.content.forEach((rfq: AdminRfqResponse) => {
          const key = rfq.productId || rfq.masterProductId || rfq.productName || "Unknown Product";
          const name = rfq.productName || "Unspecified Chemical Compound";

          if (!demandMap[key]) {
            demandMap[key] = {
              productId: key,
              productName: name,
              rfqCount: 0,
              totalRfqVolume: 0,
              unit: rfq.unit || "kg",
              orderCount: 0,
              totalOrderAmount: 0,
              currency: "INR",
              activeQuotations: 0,
              statusBreakdown: {},
            };
          }

          demandMap[key].rfqCount += 1;
          demandMap[key].totalRfqVolume += (rfq.quantity || 0);
          if (rfq.unit) demandMap[key].unit = rfq.unit;
          if (rfq.status === "QUOTED" || rfq.status === "ACCEPTED") {
            demandMap[key].activeQuotations += 1;
          }
          demandMap[key].statusBreakdown[rfq.status] = (demandMap[key].statusBreakdown[rfq.status] || 0) + 1;
        });

        // Aggregate Orders
        if (orderData?.content) {
          orderData.content.forEach((order: AdminPurchaseOrderResponse) => {
            const key = order.productId || order.productName || "Unknown Product";
            if (demandMap[key]) {
              demandMap[key].orderCount += 1;
              demandMap[key].totalOrderAmount += (order.totalAmount || 0);
              if (order.currency) demandMap[key].currency = order.currency;
            } else {
              demandMap[key] = {
                productId: key,
                productName: order.productName || "Unspecified Chemical Compound",
                rfqCount: 0,
                totalRfqVolume: 0,
                unit: order.unit || "kg",
                orderCount: 1,
                totalOrderAmount: order.totalAmount || 0,
                currency: order.currency || "INR",
                activeQuotations: 0,
                statusBreakdown: {},
              };
            }
          });
        }

        const sorted = Object.values(demandMap).sort((a, b) => {
          // Sort by RFQ count descending, then by total volume
          if (b.rfqCount !== a.rfqCount) return b.rfqCount - a.rfqCount;
          return b.totalRfqVolume - a.totalRfqVolume;
        });

        setDemandMetrics(sorted);
      }

      setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load platform analytics";
      setError(msg);
    } finally {
      setIsLoading(false);
      setDemandLoading(false);
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
    <div className="space-y-8 pb-12 text-[#0F172A] max-w-[1400px]">
      {/* 1. Sophisticated Baseline Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#E4E4E7] pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#0052CC] block mb-1">
            Platform Command Center
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A]">
            Marketplace Operations & Telemetry
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-xl">
            Liquidity telemetry, cross-actor commercial volumes, and priority administration queues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Period Filter Pill Tabs */}
          <div className="flex items-center p-0.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px]">
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
                className={`h-7 px-2.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                  period === item.id
                    ? "bg-[#0052CC] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4F4F5]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 h-7 text-xs font-medium text-[#475569] bg-white hover:bg-[#FAFAFA] border border-[#E4E4E7] rounded-[4px] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#0052CC]" : "text-[#64748B]"}`} />
            <span>{lastRefreshed ? `Refreshed ${lastRefreshed}` : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-[6px] bg-[#FEF2F2] border border-[rgba(220,38,38,0.2)] flex items-center justify-between text-[#DC2626] text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-2.5 py-1 bg-white border border-[#E4E4E7] text-xs font-medium rounded-[4px] hover:bg-[#FAFAFA] text-[#DC2626] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Restrained Horizontal Telemetry Band (Not 4 bulky cards) */}
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E4E7]">
          {/* GMV Metric */}
          <div className="sm:px-4 first:pl-0 last:pr-0 py-2 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Gross Marketplace Value</span>
            {isLoading || !analytics ? (
              <SkeletonLoader className="h-7 w-28 mt-2" />
            ) : (
              <div className="mt-1">
                <div className="text-xl font-bold font-mono text-[#0F172A]">
                  ${analytics.commercial.totalGmv.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#64748B]">
                  {analytics.commercial.gmvGrowthPercentage !== null && analytics.commercial.gmvGrowthPercentage !== undefined ? (
                    <span className={`font-mono font-medium ${analytics.commercial.gmvGrowthPercentage >= 0 ? "text-[#059669]" : "text-[#DC2626]"}`}>
                      {analytics.commercial.gmvGrowthPercentage >= 0 ? `+${analytics.commercial.gmvGrowthPercentage}%` : `${analytics.commercial.gmvGrowthPercentage}%`}
                    </span>
                  ) : (
                    <span className="font-mono text-[#94A3B8]">baseline</span>
                  )}
                  <span>vs prev. window</span>
                </div>
              </div>
            )}
          </div>

          {/* Orders Metric */}
          <div className="sm:px-4 first:pl-0 last:pr-0 py-2 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Purchase Orders</span>
            {isLoading || !analytics ? (
              <SkeletonLoader className="h-7 w-20 mt-2" />
            ) : (
              <div className="mt-1">
                <div className="text-xl font-bold font-mono text-[#0F172A]">
                  {analytics.orders.totalOrders.toLocaleString("en-US")}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#64748B]">
                  <span className="font-mono">{analytics.orders.placedOrders} placed</span>
                  <span>·</span>
                  <span className="text-[#059669] font-mono font-medium">{analytics.orders.completedOrders} completed</span>
                </div>
              </div>
            )}
          </div>

          {/* Sourcing RFQs */}
          <div className="sm:px-4 first:pl-0 last:pr-0 py-2 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Active Sourcing RFQs</span>
            {isLoading || !analytics ? (
              <SkeletonLoader className="h-7 w-16 mt-2" />
            ) : (
              <div className="mt-1">
                <div className="text-xl font-bold font-mono text-[#0F172A]">
                  {analytics.marketplace.openRfqs.toLocaleString("en-US")}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#64748B]">
                  <span className="font-mono">{analytics.marketplace.totalRfqs} total</span>
                  <span>·</span>
                  <span className="font-mono">{analytics.marketplace.totalQuotations} quotes</span>
                </div>
              </div>
            )}
          </div>

          {/* Platform Participants */}
          <div className="sm:px-4 first:pl-0 last:pr-0 py-2 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Platform Participants</span>
            {isLoading || !analytics ? (
              <SkeletonLoader className="h-7 w-16 mt-2" />
            ) : (
              <div className="mt-1">
                <div className="text-xl font-bold font-mono text-[#0F172A]">
                  {analytics.users.totalUsers.toLocaleString("en-US")}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#64748B]">
                  <span className="font-mono">{analytics.users.totalBuyers} buyers</span>
                  <span>·</span>
                  <span className="text-[#059669] font-mono font-medium">{analytics.suppliers.verifiedSuppliers} verified</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Operational Grid: Activity Trends (compact) + Operational Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Platform Activity Trends (7 cols) */}
        <div className="lg:col-span-7">
          {isLoading || !analytics ? (
            <SkeletonLoader className="h-56 rounded-[8px]" />
          ) : (
            <PlatformTrendChart trends={analytics.trends} periodLabel={getPeriodLabel()} />
          )}
        </div>

        {/* Right: Operational Attention Review Queue (5 cols) */}
        <div className="lg:col-span-5">
          {isLoading || !analytics ? (
            <SkeletonLoader className="h-56 rounded-[8px]" />
          ) : (
            <ActionCenterAlerts items={analytics.actionCenter} />
          )}
        </div>
      </div>

      {/* 4. Full-width Transaction Conversion Pipeline */}
      {isLoading || !analytics ? (
        <SkeletonLoader className="h-32 rounded-[8px]" />
      ) : (
        <MarketplaceFunnelChart funnel={analytics.funnel} />
      )}

      {/* 5. Product Sourcing Demand Intelligence */}
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#E4E4E7] pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
              Marketplace Sourcing Demand
            </span>
            <h3 className="text-base font-semibold text-[#0F172A] mt-0.5">
              Product Demand & RFQ Volume Ranking
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              High-demand chemical compounds ranked by inbound buyer RFQ inquiry frequency, requested bulk volume, and executed purchase orders.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dashboard/admin/transactions/rfqs"
              className="text-xs font-medium text-[#0052CC] hover:text-[#0747A6] inline-flex items-center gap-1"
            >
              <span>View all RFQs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {demandLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <SkeletonLoader key={i} className="h-14 rounded-[6px]" />
            ))}
          </div>
        ) : demandMetrics.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#64748B]">
            No chemical sourcing RFQs recorded in the active period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8FAFC] border-b border-[#E4E4E7] text-[#475569] font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-2.5">Rank & Product Name</th>
                  <th className="px-4 py-2.5 text-center">RFQ Inquiries</th>
                  <th className="px-4 py-2.5">Total Sourcing Volume</th>
                  <th className="px-4 py-2.5">Active Quotes</th>
                  <th className="px-4 py-2.5">Confirmed Orders</th>
                  <th className="px-4 py-2.5 text-right">Order Value (GMV)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7] text-[#0F172A]">
                {demandMetrics.map((item, idx) => (
                  <tr key={item.productId} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-[4px] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? "bg-[#EFF6FF] text-[#0052CC] border border-[#BFDBFE]"
                            : idx === 1
                            ? "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]"
                            : idx === 2
                            ? "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]"
                            : "bg-[#FAFAFA] text-[#64748B] border border-[#E4E4E7]"
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-[#0F172A] block text-xs">
                            {item.productName}
                          </span>
                          <span className="text-[10px] font-mono text-[#64748B] block mt-0.5">
                            ID: {item.productId.length > 20 ? `${item.productId.substring(0, 18)}...` : item.productId}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-[#EFF6FF] text-[#0052CC] font-mono font-bold text-xs border border-[#BFDBFE]">
                        {item.rfqCount} {item.rfqCount === 1 ? "RFQ" : "RFQs"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <div className="font-semibold text-[#0F172A]">
                        {item.totalRfqVolume.toLocaleString("en-US")} {item.unit}
                      </div>
                      <div className="text-[10px] text-[#64748B] mt-0.5">
                        Avg: {(item.totalRfqVolume / Math.max(item.rfqCount, 1)).toFixed(0)} {item.unit} / RFQ
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono font-medium ${item.activeQuotations > 0 ? "text-[#059669]" : "text-[#94A3B8]"}`}>
                        {item.activeQuotations} quoted
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {item.orderCount > 0 ? (
                        <span className="text-[#059669] font-medium font-mono">
                          {item.orderCount} {item.orderCount === 1 ? "order" : "orders"}
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {item.totalOrderAmount > 0 ? (
                        <div className="font-bold text-[#0F172A]">
                          ₹{item.totalOrderAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* 5. Direct Administration Quick Navigation */}
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-4 sm:p-5 shadow-tactile-card">
        <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-3 font-mono">
          Platform Governance Consoles
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/dashboard/admin/users"
            className="p-3.5 rounded-[6px] bg-[#FAFAFA] border border-[#E4E4E7] hover:border-[#0052CC] hover:bg-white transition-all flex items-center justify-between group shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-[#64748B] group-hover:text-[#0052CC]" />
              <div>
                <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#0052CC]">
                  User Accounts
                </div>
                <div className="text-[10px] text-[#64748B]">Governance & Roles</div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0052CC] transition-colors" />
          </Link>

          <Link
            href="/dashboard/admin/suppliers"
            className="p-3.5 rounded-[6px] bg-[#FAFAFA] border border-[#E4E4E7] hover:border-[#0052CC] hover:bg-white transition-all flex items-center justify-between group shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-[#64748B] group-hover:text-[#0052CC]" />
              <div>
                <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#0052CC]">
                  Supplier Directory
                </div>
                <div className="text-[10px] text-[#64748B]">Verifications & Profiles</div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0052CC] transition-colors" />
          </Link>

          <Link
            href="/dashboard/admin/transactions/orders"
            className="p-3.5 rounded-[6px] bg-[#FAFAFA] border border-[#E4E4E7] hover:border-[#0052CC] hover:bg-white transition-all flex items-center justify-between group shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="w-4 h-4 text-[#64748B] group-hover:text-[#0052CC]" />
              <div>
                <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#0052CC]">
                  Orders & Shipments
                </div>
                <div className="text-[10px] text-[#64748B]">PO Lifecycle & Milestones</div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0052CC] transition-colors" />
          </Link>

          <Link
            href="/dashboard/admin/catalog"
            className="p-3.5 rounded-[6px] bg-[#FAFAFA] border border-[#E4E4E7] hover:border-[#0052CC] hover:bg-white transition-all flex items-center justify-between group shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4 text-[#64748B] group-hover:text-[#0052CC]" />
              <div>
                <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#0052CC]">
                  Master Catalog
                </div>
                <div className="text-[10px] text-[#64748B]">Chemicals & Offerings</div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0052CC] transition-colors" />
          </Link>
        </div>
      </div>

      {/* Custom Date Range Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 backdrop-blur-[2px] p-4">
          <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-5 max-w-md w-full shadow-tactile-modal space-y-3.5">
            <h3 className="text-sm font-bold text-[#0F172A]">Select Custom Date Range</h3>
            <p className="text-xs text-[#64748B]">
              Filter telemetry data across a customized historical interval.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1 font-mono uppercase">Start Date</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full bg-white border border-[#E4E4E7] rounded-[6px] px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0052CC] font-mono shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1 font-mono uppercase">End Date</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full bg-white border border-[#E4E4E7] rounded-[6px] px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0052CC] font-mono shadow-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E4E4E7]">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="h-8 px-3 text-xs font-medium text-[#475569] hover:bg-[#FAFAFA] rounded-[6px] border border-[#E4E4E7] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyCustomRange}
                disabled={!customFrom || !customTo}
                className="h-8 px-3.5 text-xs font-medium bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-[6px] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
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
