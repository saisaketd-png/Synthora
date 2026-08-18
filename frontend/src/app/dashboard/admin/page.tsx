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
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  EyeOff,
  UserX,
} from "lucide-react";
import {
  AdminUserResponse,
  AdminSupplierResponse,
  AdminProductResponse,
  AdminRfqResponse,
  AdminPurchaseOrderResponse,
} from "@/features/admin/types";
import {
  getAdminUsers,
  getAdminSuppliers,
  getAdminProducts,
  getAdminRfqs,
  getAdminOrders,
} from "@/features/admin/api/adminApi";
import { getNotifications, getUnreadCount } from "@/features/notifications/api/notifications";
import { NotificationResponse } from "@/features/notifications/types/notification";
import { AdminStatsCard } from "@/features/admin/components/AdminStatsCard";
import { AdminBadge } from "@/features/admin/components/AdminBadge";

interface DashboardMetrics {
  totalUsers: number;
  totalSuppliers: number;
  totalProducts: number;
  totalRfqs: number;
  totalOrders: number;
  unreadNotifications: number;
  // Attention metrics
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
  const [recentNotifications, setRecentNotifications] = useState<NotificationResponse[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    const collectedErrors: string[] = [];

    const results = await Promise.allSettled([
      getAdminUsers({ page: 0, size: 1 }),
      getAdminSuppliers({ page: 0, size: 1 }),
      getAdminProducts({ page: 0, size: 1 }),
      getAdminRfqs({ page: 0, size: 5 }),
      getAdminOrders({ page: 0, size: 5 }),
      getUnreadCount(),
      getAdminUsers({ status: "SUSPENDED", page: 0, size: 1 }),
      getAdminSuppliers({ verified: false, page: 0, size: 1 }),
      getAdminProducts({ availabilityStatus: "HIDDEN", page: 0, size: 1 }),
      getNotifications(0, 5),
    ]);

    // 1. Users
    let totalUsers = 0;
    if (results[0].status === "fulfilled") {
      totalUsers = results[0].value.totalElements;
    } else {
      collectedErrors.push("Users metric unavailable");
    }

    // 2. Suppliers
    let totalSuppliers = 0;
    if (results[1].status === "fulfilled") {
      totalSuppliers = results[1].value.totalElements;
    } else {
      collectedErrors.push("Suppliers metric unavailable");
    }

    // 3. Products
    let totalProducts = 0;
    if (results[2].status === "fulfilled") {
      totalProducts = results[2].value.totalElements;
    } else {
      collectedErrors.push("Products metric unavailable");
    }

    // 4. RFQs
    let totalRfqs = 0;
    if (results[3].status === "fulfilled") {
      totalRfqs = results[3].value.totalElements;
      setRecentRfqs(results[3].value.content);
    } else {
      collectedErrors.push("RFQ oversight feed unavailable");
    }

    // 5. Orders
    let totalOrders = 0;
    if (results[4].status === "fulfilled") {
      totalOrders = results[4].value.totalElements;
      setRecentOrders(results[4].value.content);
    } else {
      collectedErrors.push("Order oversight feed unavailable");
    }

    // 6. Unread Notifications
    let unreadNotifications = 0;
    if (results[5].status === "fulfilled") {
      unreadNotifications = results[5].value;
    }

    // 7. Suspended Users
    let suspendedUsers = 0;
    if (results[6].status === "fulfilled") {
      suspendedUsers = results[6].value.totalElements;
    }

    // 8. Unverified Suppliers
    let unverifiedSuppliers = 0;
    if (results[7].status === "fulfilled") {
      unverifiedSuppliers = results[7].value.totalElements;
    }

    // 9. Hidden Products
    let hiddenProducts = 0;
    if (results[8].status === "fulfilled") {
      hiddenProducts = results[8].value.totalElements;
    }

    // 10. Notifications preview
    if (results[9].status === "fulfilled") {
      setRecentNotifications(results[9].value.content || []);
    }

    setMetrics({
      totalUsers,
      totalSuppliers,
      totalProducts,
      totalRfqs,
      totalOrders,
      unreadNotifications,
      suspendedUsers,
      unverifiedSuppliers,
      hiddenProducts,
    });

    setErrors(collectedErrors);
    setLastRefreshed(new Date().toLocaleTimeString());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const modules = [
    {
      title: "User Administration",
      description: "Manage accounts, roles, suspensions, activations, and non-destructive deactivations.",
      href: "/dashboard/admin/users",
      icon: Users,
      badge: "Accounts",
      color: "blue",
    },
    {
      title: "Supplier Moderation",
      description: "Moderate supplier verification statuses, export readiness, and account standing.",
      href: "/dashboard/admin/suppliers",
      icon: Building2,
      badge: "Verification",
      color: "purple",
    },
    {
      title: "Product Catalog",
      description: "Control catalog availability (Available, Out of Stock, Hidden, Discontinued) and supplier offerings.",
      href: "/dashboard/admin/products",
      icon: Package,
      badge: "Catalog",
      color: "emerald",
    },
    {
      title: "RFQ Oversight",
      description: "Inspect RFQ inquiries, full quotation revision histories, and moderate terminal states.",
      href: "/dashboard/admin/transactions/rfqs",
      icon: FileText,
      badge: "Quotes",
      color: "amber",
    },
    {
      title: "Purchase Order Oversight",
      description: "Track purchase order fulfillment milestones, inspect shipment tracking, and manage cancellations.",
      href: "/dashboard/admin/transactions/orders",
      icon: ShoppingCart,
      badge: "Orders",
      color: "sky",
    },
    {
      title: "Notification Center",
      description: "Review system alerts, platform-wide procurement notifications, and communication logs.",
      href: "/dashboard/notifications",
      icon: Bell,
      badge: "Alerts",
      color: "rose",
    },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Workspace Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
              <Shield className="w-3.5 h-3.5" />
              Administrative Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Admin Workspace
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Platform-wide governance, supplier moderation, chemical catalog control, and transactional procurement oversight.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-xs font-medium text-slate-400 hidden md:inline-block">
                Refreshed: {lastRefreshed}
              </span>
            )}
            <button
              type="button"
              onClick={() => fetchDashboardData()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-teal-600" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Partial Errors Notice if any */}
      {errors.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Some dashboard metrics could not be retrieved: {errors.join(", ")}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchDashboardData()}
            className="px-3 py-1 bg-white text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-100 text-xs font-bold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Global KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <AdminStatsCard
          title="Users"
          value={isLoading ? "..." : metrics.totalUsers}
          subtitle="Platform accounts"
          icon={Users}
          color="blue"
        />
        <AdminStatsCard
          title="Suppliers"
          value={isLoading ? "..." : metrics.totalSuppliers}
          subtitle="Verified & onboarding"
          icon={Building2}
          color="purple"
        />
        <AdminStatsCard
          title="Products"
          value={isLoading ? "..." : metrics.totalProducts}
          subtitle="Catalog chemicals"
          icon={Package}
          color="teal"
        />
        <AdminStatsCard
          title="RFQs"
          value={isLoading ? "..." : metrics.totalRfqs}
          subtitle="Inquiry exchanges"
          icon={FileText}
          color="amber"
        />
        <AdminStatsCard
          title="Orders"
          value={isLoading ? "..." : metrics.totalOrders}
          subtitle="Purchase orders"
          icon={ShoppingCart}
          color="blue"
        />
        <AdminStatsCard
          title="Alerts"
          value={isLoading ? "..." : metrics.unreadNotifications}
          subtitle="Unread notifications"
          icon={Bell}
          color="rose"
        />
      </div>

      {/* Attention Required Banner */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Items Requiring Administrative Attention
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">Operational Highlights</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/dashboard/admin/users?status=SUSPENDED"
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-300 transition-all flex items-center justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <UserX className="w-3.5 h-3.5 text-amber-600" />
                Suspended Users
              </div>
              <p className="text-xl font-extrabold text-slate-900">
                {isLoading ? "..." : metrics.suspendedUsers}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            href="/dashboard/admin/suppliers?verified=false"
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-purple-300 transition-all flex items-center justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                Unverified Suppliers
              </div>
              <p className="text-xl font-extrabold text-slate-900">
                {isLoading ? "..." : metrics.unverifiedSuppliers}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            href="/dashboard/admin/products?availabilityStatus=HIDDEN"
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-400 transition-all flex items-center justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                Hidden Catalog Products
              </div>
              <p className="text-xl font-extrabold text-slate-900">
                {isLoading ? "..." : metrics.hiddenProducts}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Procurement Activity Feed (Recent RFQs & POs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent RFQs */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Recent RFQ Inquiries
              </h3>
            </div>
            <Link
              href="/dashboard/admin/transactions/rfqs"
              className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1"
            >
              View all RFQs <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2 py-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentRfqs.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              No recent RFQ inquiries found.
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentRfqs.map((rfq) => (
                <div
                  key={rfq.id}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 truncate">
                    <p className="font-bold text-slate-900 truncate">
                      {rfq.productName || "Product Inquiry"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      {rfq.buyerName || "Buyer"} → {rfq.supplierName || "Supplier"} ({rfq.quantity} {rfq.unit})
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <AdminBadge type={rfq.status} />
                    <span className="text-[10px] text-slate-400">
                      {new Date(rfq.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Purchase Orders */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Recent Purchase Orders
              </h3>
            </div>
            <Link
              href="/dashboard/admin/transactions/orders"
              className="text-xs font-bold text-sky-700 hover:text-sky-800 inline-flex items-center gap-1"
            >
              View all Orders <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2 py-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              No recent purchase orders found.
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 truncate">
                    <p className="font-bold text-slate-900 font-mono truncate">
                      {order.poNumber}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      {order.currency} ${order.totalAmount.toFixed(2)} • {order.productName || "Product"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <AdminBadge type={order.status} />
                    <span className="text-[10px] text-slate-400">
                      {new Date(order.placedAt || order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Platform Notifications */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Recent System & Platform Notifications
            </h3>
          </div>
          <Link
            href="/dashboard/notifications"
            className="text-xs font-bold text-rose-700 hover:text-rose-800 inline-flex items-center gap-1"
          >
            View all notifications <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2 py-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentNotifications.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4 text-center">
            No system notifications recorded.
          </p>
        ) : (
          <div className="space-y-2">
            {recentNotifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">{notif.title}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{notif.message}</p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(notif.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Administrative Modules Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">
          Governance & Moderation Modules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <Link
              key={mod.title}
              href={mod.href}
              className="group bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-amber-50 group-hover:text-amber-700 group-hover:border-amber-200 transition-colors">
                    <mod.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                    {mod.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-900 transition-colors mb-2">
                  {mod.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  {mod.description}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-slate-700 group-hover:text-amber-700 transition-colors pt-4 border-t border-slate-100">
                <span>Open Module</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
