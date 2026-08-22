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
  FlaskConical,
  ShieldCheck,
  Eye,
  Layers,
  AlertCircle,
  Activity,
} from "lucide-react";
import {
  AdminRfqResponse,
  AdminPurchaseOrderResponse,
} from "@/features/admin/types";
import {
  getAdminUsers,
  getAdminSuppliers,
  getAdminRfqs,
  getAdminOrders,
} from "@/features/admin/api/adminApi";
import { getGovernanceStats } from "@/features/admin/api/adminCatalogApi";
import { getNotifications, getUnreadCount } from "@/features/notifications/api/notifications";
import {
  DataTable,
  StatusBadge,
  Button,
  SkeletonLoader,
  Badge,
} from "@/shared/components/ui/SynthoraUI";

interface DashboardMetrics {
  totalUsers: number;
  totalSuppliers: number;
  totalProducts: number;
  totalRfqs: number;
  totalOrders: number;
  unreadNotifications: number;
  suspendedUsers: number;
  unverifiedSuppliers: number;
  hiddenProducts: number;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    totalSuppliers: 0,
    totalProducts: 0,
    totalRfqs: 0,
    totalOrders: 0,
    unreadNotifications: 0,
    suspendedUsers: 0,
    unverifiedSuppliers: 0,
    hiddenProducts: 0,
  });

  const [recentRfqs, setRecentRfqs] = useState<AdminRfqResponse[]>([]);
  const [recentOrders, setRecentOrders] = useState<AdminPurchaseOrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);

    const results = await Promise.allSettled([
      getAdminUsers({ page: 0, size: 1 }),
      getAdminSuppliers({ page: 0, size: 1 }),
      getGovernanceStats(),
      getAdminRfqs({ page: 0, size: 6 }),
      getAdminOrders({ page: 0, size: 6 }),
      getUnreadCount(),
      getAdminUsers({ status: "SUSPENDED", page: 0, size: 1 }),
      getAdminSuppliers({ verified: false, page: 0, size: 1 }),
    ]);

    let totalUsers = 0;
    if (results[0].status === "fulfilled") totalUsers = results[0].value.totalElements;

    let totalSuppliers = 0;
    if (results[1].status === "fulfilled") totalSuppliers = results[1].value.totalElements;

    let totalProducts = 0;
    let pendingRequests = 0;
    if (results[2].status === "fulfilled") {
      totalProducts = results[2].value.activeMasterProducts;
      pendingRequests = results[2].value.pendingRequests || 0;
    }

    let totalRfqs = 0;
    if (results[3].status === "fulfilled") {
      totalRfqs = results[3].value.totalElements;
      setRecentRfqs(results[3].value.content);
    }

    let totalOrders = 0;
    if (results[4].status === "fulfilled") {
      totalOrders = results[4].value.totalElements;
      setRecentOrders(results[4].value.content);
    }

    let unreadNotifications = 0;
    if (results[5].status === "fulfilled") unreadNotifications = results[5].value;

    let suspendedUsers = 0;
    if (results[6].status === "fulfilled") suspendedUsers = results[6].value.totalElements;

    let unverifiedSuppliers = 0;
    if (results[7].status === "fulfilled") unverifiedSuppliers = results[7].value.totalElements;

    setMetrics({
      totalUsers,
      totalSuppliers,
      totalProducts,
      totalRfqs,
      totalOrders,
      unreadNotifications,
      suspendedUsers,
      unverifiedSuppliers,
      hiddenProducts: pendingRequests,
    });

    setLastRefreshed(new Date().toLocaleTimeString());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const summaryMetrics = [
    {
      label: "MASTER CHEMICALS",
      value: metrics.totalProducts,
      subtext: "Canonical chemical records",
      href: "/dashboard/admin/catalog",
    },
    {
      label: "SUPPLIERS",
      value: metrics.totalSuppliers,
      subtext: metrics.unverifiedSuppliers > 0 ? `${metrics.unverifiedSuppliers} suppliers awaiting verification` : "All suppliers verified",
      href: "/dashboard/admin/suppliers",
    },
    {
      label: "ACCOUNTS",
      value: metrics.totalUsers,
      subtext: "Buyer and supplier accounts",
      href: "/dashboard/admin/users",
    },
    {
      label: "OPEN RFQs",
      value: metrics.totalRfqs,
      subtext: "Active procurement inquiries",
      href: "/dashboard/admin/transactions/rfqs",
    },
    {
      label: "ORDERS",
      value: metrics.totalOrders,
      subtext: "Active purchase orders",
      href: "/dashboard/admin/transactions/orders",
    },
  ];

  const attentionItems = [
    ...(metrics.unverifiedSuppliers > 0
      ? [
          {
            type: "SUPPLIER VERIFICATION",
            title: `${metrics.unverifiedSuppliers} Supplier Applications Pending`,
            detail: "Corporate identity, GST/CIN verification and compliance documents awaiting review",
            priority: "HIGH PRIORITY",
            priorityVariant: "danger" as const,
            href: "/dashboard/admin/suppliers/verification",
            actionLabel: "Review Queue →",
          },
        ]
      : []),
    ...(metrics.hiddenProducts > 0
      ? [
          {
            type: "CATALOG REQUESTS",
            title: `${metrics.hiddenProducts} Chemical Addition Requests`,
            detail: "New chemical compound monographs submitted by suppliers for catalog admission",
            priority: "NORMAL",
            priorityVariant: "warning" as const,
            href: "/dashboard/admin/catalog/requests",
            actionLabel: "Evaluate →",
          },
        ]
      : []),
    ...(metrics.suspendedUsers > 0
      ? [
          {
            type: "ACCOUNT STATUS",
            title: `${metrics.suspendedUsers} Suspended User Accounts`,
            detail: "User accounts flagged or suspended pending administrative investigation",
            priority: "AUDIT",
            priorityVariant: "neutral" as const,
            href: "/dashboard/admin/users",
            actionLabel: "Inspect →",
          },
        ]
      : []),
  ];

  const quickAccessItems = [
    {
      name: "Master Catalog",
      description: "Canonical chemical compound registry, CAS codes, and monographs",
      href: "/dashboard/admin/catalog",
      icon: FlaskConical,
    },
    {
      name: "Supplier Moderation & Verification",
      description: "Field-level verification of legal identity, GST, CIN, and certifications",
      href: "/dashboard/admin/suppliers/verification",
      icon: ShieldCheck,
    },
    {
      name: "Offering Review",
      description: "Commercial offering moderation, purity tiers, MOQ, and batch documents",
      href: "/dashboard/admin/catalog/offerings",
      icon: Package,
    },
    {
      name: "User Management",
      description: "Account lifecycle management, roles, security status, and suspensions",
      href: "/dashboard/admin/users",
      icon: Users,
    },
    {
      name: "RFQ Oversight",
      description: "Monitor procurement inquiries, quotation revisions, and negotiations",
      href: "/dashboard/admin/transactions/rfqs",
      icon: FileText,
    },
    {
      name: "Order Oversight",
      description: "Track procurement fulfillment milestones and contract status",
      href: "/dashboard/admin/transactions/orders",
      icon: ShoppingCart,
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto space-y-7">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 border-b border-[#DFE1E6] pb-5">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#091E42] tracking-tight">
            Administrative Operations
          </h1>
          <p className="text-sm text-[#5E6C84] mt-1">
            Platform governance, supplier verification, catalog integrity and transaction oversight.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          {lastRefreshed && (
            <span className="text-xs font-mono text-[#5E6C84]">
              Refreshed {lastRefreshed}
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchDashboardData()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0052CC] hover:bg-[#EBECF0] px-2.5 py-1.5 rounded transition-colors disabled:opacity-50 border border-[#DFE1E6]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Operational Summary Strip */}
      {isLoading ? (
        <div className="bg-white p-5 border border-[#DFE1E6] rounded-lg">
          <SkeletonLoader lines={2} />
        </div>
      ) : (
        <div className="bg-white border border-[#DFE1E6] rounded-lg grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#DFE1E6]">
          {summaryMetrics.map((m, idx) => (
            <Link
              key={idx}
              href={m.href}
              className="p-4 sm:p-5 hover:bg-[#FAFBFC] transition-colors group block min-w-0"
            >
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#5E6C84] truncate mb-1">
                {m.label}
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#091E42] tracking-tight group-hover:text-[#0052CC] transition-colors">
                {m.value}
              </div>
              <div className="text-xs text-[#5E6C84] truncate mt-1">
                {m.subtext}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 3. Primary Focal Point: REQUIRES ATTENTION */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#091E42] tracking-tight">
              Requires Attention
            </h2>
            <p className="text-[13px] text-[#5E6C84] mt-0.5">
              Items requiring administrative review or intervention.
            </p>
          </div>
          {attentionItems.length > 0 && (
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#FFFAE6] text-[#974F0C] border border-[#FFE380] rounded">
              {attentionItems.length} Action Items
            </span>
          )}
        </div>

        {attentionItems.length === 0 ? (
          <div className="bg-white border border-[#DFE1E6] rounded-lg p-5 text-center text-xs text-[#5E6C84]">
            No operations currently require administrative intervention.
          </div>
        ) : (
          <div className="bg-white border border-[#DFE1E6] rounded-lg divide-y divide-[#DFE1E6] overflow-hidden">
            {attentionItems.map((item, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAFBFC] transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[10px] font-mono font-bold text-[#5E6C84] uppercase tracking-wider">
                      {item.type}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase ${
                        item.priorityVariant === "danger"
                          ? "bg-[#FFEBE6] text-[#BF2600] border-[#FFBDAD]"
                          : item.priorityVariant === "warning"
                          ? "bg-[#FFFAE6] text-[#974F0C] border-[#FFE380]"
                          : "bg-[#F4F5F7] text-[#42526E] border-[#DFE1E6]"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#091E42] truncate">
                    {item.title}
                  </div>
                  <p className="text-xs text-[#5E6C84] truncate">
                    {item.detail}
                  </p>
                </div>

                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0052CC] hover:underline shrink-0 self-start sm:self-auto py-1 px-2.5 rounded hover:bg-[#DEEBFF]/30 transition-colors"
                >
                  <span>{item.actionLabel}</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Recent Operational Activity */}
      <div className="space-y-2.5">
        <h2 className="text-base font-bold text-[#091E42] tracking-tight">
          Recent Operational Activity
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1. RFQ Inquiries Panel */}
          <div className="bg-white border border-[#DFE1E6] rounded-lg overflow-hidden flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="px-4 py-3 bg-[#FAFBFC] border-b border-[#DFE1E6] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#091E42]">
                    RFQ Inquiries
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-[#DEEBFF] text-[#0747A6] rounded">
                    {metrics.totalRfqs}
                  </span>
                </div>
                <Link
                  href="/dashboard/admin/transactions/rfqs"
                  className="text-xs font-semibold text-[#0052CC] hover:underline"
                >
                  View all →
                </Link>
              </div>

              {/* Populated Rows vs Compact Empty State */}
              {recentRfqs.length === 0 ? (
                <div className="p-5 text-center space-y-1">
                  <span className="text-xs font-bold text-[#091E42] block">
                    No active RFQ inquiries
                  </span>
                  <p className="text-xs text-[#5E6C84] max-w-sm mx-auto">
                    New procurement requests will appear here for administrative oversight.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/dashboard/admin/transactions/rfqs"
                      className="text-xs font-semibold text-[#0052CC] hover:underline inline-flex items-center gap-1"
                    >
                      <span>View RFQ Oversight</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[#DFE1E6]">
                  {recentRfqs.slice(0, 4).map((rfq) => (
                    <Link
                      key={rfq.id}
                      href={`/dashboard/admin/transactions/rfqs/${rfq.id}`}
                      className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#FAFBFC] transition-colors group block"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#091E42] group-hover:text-[#0052CC] truncate">
                            {rfq.productName || "Chemical Product"}
                          </span>
                          <span className="text-[10px] font-mono text-[#5E6C84]">
                            {rfq.quantity} {rfq.unit || "kg"}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#5E6C84] flex items-center gap-2">
                          <span>Buyer: <strong className="text-[#172B4D]">{rfq.buyerEmail ? rfq.buyerEmail.split("@")[0] : "Buyer"}</strong></span>
                          <span>·</span>
                          <span className="font-mono text-[10px]">{new Date(rfq.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <StatusBadge status={rfq.status} size="sm" />
                        <span className="text-xs font-semibold text-[#0052CC] opacity-0 group-hover:opacity-100 transition-opacity">
                          View →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. Purchase Orders Panel */}
          <div className="bg-white border border-[#DFE1E6] rounded-lg overflow-hidden flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="px-4 py-3 bg-[#FAFBFC] border-b border-[#DFE1E6] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#091E42]">
                    Purchase Orders
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-[#E3FCEF] text-[#006644] rounded">
                    {metrics.totalOrders}
                  </span>
                </div>
                <Link
                  href="/dashboard/admin/transactions/orders"
                  className="text-xs font-semibold text-[#0052CC] hover:underline"
                >
                  View all →
                </Link>
              </div>

              {/* Populated Rows vs Compact Empty State */}
              {recentOrders.length === 0 ? (
                <div className="p-5 text-center space-y-1">
                  <span className="text-xs font-bold text-[#091E42] block">
                    No active purchase orders
                  </span>
                  <p className="text-xs text-[#5E6C84] max-w-sm mx-auto">
                    Executed orders and fulfillment activity will appear here.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/dashboard/admin/transactions/orders"
                      className="text-xs font-semibold text-[#0052CC] hover:underline inline-flex items-center gap-1"
                    >
                      <span>View Order Oversight</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[#DFE1E6]">
                  {recentOrders.slice(0, 4).map((order) => (
                    <Link
                      key={order.id}
                      href={`/dashboard/admin/transactions/orders/${order.id}`}
                      className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#FAFBFC] transition-colors group block"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-[#091E42] group-hover:text-[#0052CC] truncate">
                            {order.poNumber}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-[#091E42]">
                            {order.currency} {order.totalAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#5E6C84] flex items-center gap-2">
                          <span>Buyer: <strong className="text-[#172B4D]">{order.buyerEmail ? order.buyerEmail.split("@")[0] : "Buyer"}</strong></span>
                          <span>·</span>
                          <span className="font-mono text-[10px]">{new Date(order.placedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <StatusBadge status={order.status} size="sm" />
                        <span className="text-xs font-semibold text-[#0052CC] opacity-0 group-hover:opacity-100 transition-opacity">
                          View →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Quick Access Directory (Workflow Grid) */}
      <div className="space-y-2.5">
        <h2 className="text-base font-bold text-[#091E42] tracking-tight">
          Quick Access
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickAccessItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                className="p-4 bg-white border border-[#DFE1E6] hover:border-[#0052CC] rounded-lg transition-colors flex items-start gap-3.5 group text-left"
              >
                <Icon className="w-4.5 h-4.5 text-[#5E6C84] group-hover:text-[#0052CC] shrink-0 mt-0.5 transition-colors" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#091E42] group-hover:text-[#0052CC] truncate">
                      {item.name}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#5E6C84] group-hover:text-[#0052CC] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <p className="text-xs text-[#5E6C84] truncate mt-0.5">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
