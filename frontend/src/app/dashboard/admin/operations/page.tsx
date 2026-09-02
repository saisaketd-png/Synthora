"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Search,
  ShieldAlert,
  ArrowRight,
  Clock,
  Layers,
  Building2,
  Package,
  Users,
  Sparkles,
  ShoppingBag,
  Scale,
  Activity,
  CheckCircle2,
  RefreshCw,
  Bell,
  Sliders,
} from "lucide-react";

interface PlatformSnapshot {
  users: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    pendingVerificationUsers: number;
    buyerCount: number;
    supplierUserCount: number;
    adminCount: number;
  };
  suppliers: {
    totalSuppliers: number;
    verifiedSuppliers: number;
    pendingSuppliers: number;
    underReviewSuppliers: number;
    informationRequiredSuppliers: number;
    rejectedSuppliers: number;
    suspendedSuppliers: number;
  };
  catalog: {
    activeMasterProducts: number;
    draftMasterProducts: number;
    inactiveMasterProducts: number;
    activeOfferings: number;
    pendingOfferings: number;
    underReviewOfferings: number;
    flaggedOfferings: number;
  };
  marketplace: {
    activeRfqs: number;
    closedRfqs: number;
    pendingQuotations: number;
    acceptedQuotations: number;
    activeOrders: number;
    fulfilledOrders: number;
    activeShipments: number;
    deliveredShipments: number;
  };
  governance: {
    activeSuspensions: number;
    openAppeals: number;
    underReviewAppeals: number;
    infoRequiredAppeals: number;
  };
  communication?: {
    totalNotifications: number;
    unreadNotifications: number;
    notificationsToday: number;
  };
  policies?: {
    maintenanceModeActive: boolean;
    activeFeatureFlags: number;
    totalSettings: number;
    publishedAnnouncements: number;
  };
  generatedAt: string;
}

interface AttentionQueueItem {
  id: string;
  category: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  count: number;
  title: string;
  description: string;
  actionUrl: string;
  actionLabel: string;
}

interface AuditLogItem {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  actorEmail: string;
  createdAt: string;
  reason?: string;
}

export default function AdminOperationsDashboard() {
  const [snapshot, setSnapshot] = useState<PlatformSnapshot | null>(null);
  const [queue, setQueue] = useState<AttentionQueueItem[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      const token = localStorage.getItem("kemkendra_token") || localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const [snapRes, queueRes, auditRes] = await Promise.all([
        fetch("/api/v1/admin/operations/platform-snapshot", { headers }),
        fetch("/api/v1/admin/operations/attention-queue", { headers }),
        fetch("/api/v1/admin/audit?size=6", { headers }).catch(() => null),
      ]);

      if (snapRes.ok) setSnapshot(await snapRes.json());
      if (queueRes.ok) setQueue(await queueRes.json());
      if (auditRes && auditRes.ok) {
        const auditData = await auditRes.json();
        setRecentAudits(auditData.content || []);
      }
    } catch (err) {
      console.error("Failed to load operations control data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    loadData();
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Platform Control Center
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Administrative Operations & Governance
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Live operational observability across identity, supplier compliance, product catalog, marketplace volume, and communications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-medium text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Feeds
          </button>
          <Link
            href="/dashboard/admin/marketplace"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Marketplace Hub
          </Link>
        </div>
      </div>

      {/* Snapshot KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Users */}
        <Link
          href="/dashboard/admin/users"
          className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-indigo-500/50 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Users</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? "..." : snapshot?.users.totalUsers.toLocaleString() ?? "0"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{snapshot?.users.activeUsers ?? 0} active</span>
              <span>•</span>
              <span className="text-rose-600 dark:text-rose-400 font-medium">{snapshot?.users.suspendedUsers ?? 0} suspended</span>
            </div>
          </div>
        </Link>

        {/* Suppliers */}
        <Link
          href="/dashboard/admin/suppliers"
          className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-emerald-500/50 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Suppliers</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? "..." : snapshot?.suppliers.totalSuppliers.toLocaleString() ?? "0"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{snapshot?.suppliers.verifiedSuppliers ?? 0} verified</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">{snapshot?.suppliers.pendingSuppliers ?? 0} pending</span>
            </div>
          </div>
        </Link>

        {/* Master Catalog */}
        <Link
          href="/dashboard/admin/catalog"
          className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-cyan-500/50 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Catalog Offerings</span>
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? "..." : snapshot?.catalog.activeOfferings.toLocaleString() ?? "0"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-cyan-600 dark:text-cyan-400 font-medium">{snapshot?.catalog.activeMasterProducts ?? 0} products</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">{snapshot?.catalog.pendingOfferings ?? 0} in review</span>
            </div>
          </div>
        </Link>

        {/* Marketplace */}
        <Link
          href="/dashboard/admin/marketplace"
          className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-purple-500/50 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Marketplace RFQs</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? "..." : snapshot?.marketplace.activeRfqs.toLocaleString() ?? "0"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-purple-600 dark:text-purple-400 font-medium">{snapshot?.marketplace.pendingQuotations ?? 0} quotes</span>
              <span>•</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">{snapshot?.marketplace.activeOrders ?? 0} orders</span>
            </div>
          </div>
        </Link>

        {/* Governance */}
        <Link
          href="/dashboard/admin/account-governance"
          className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-rose-500/50 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Governance</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? "..." : snapshot?.governance.openAppeals.toLocaleString() ?? "0"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-rose-600 dark:text-rose-400 font-medium">{snapshot?.governance.activeSuspensions ?? 0} suspended</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">{snapshot?.governance.underReviewAppeals ?? 0} in review</span>
            </div>
          </div>
        </Link>

        {/* Communication */}
        <Link
          href="/dashboard/notifications"
          className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-blue-500/50 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Communications</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? "..." : snapshot?.communication?.totalNotifications.toLocaleString() ?? "0"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-medium">{snapshot?.communication?.notificationsToday ?? 0} today</span>
              <span>•</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">{snapshot?.communication?.unreadNotifications ?? 0} unread</span>
            </div>
          </div>
        </Link>

        {/* Policies & Controls */}
        <Link
          href="/dashboard/admin/settings"
          className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-amber-500/50 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Policies & Controls</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? "..." : snapshot?.policies?.activeFeatureFlags ?? 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className={snapshot?.policies?.maintenanceModeActive ? "text-rose-600 font-bold" : "text-emerald-600 font-medium"}>
                {snapshot?.policies?.maintenanceModeActive ? "MAINTENANCE ACTIVE" : "System Operational"}
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Operational Attention Queue & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prioritized Attention Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Operational Attention Queue
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tasks requiring administrative adjudication, review, or compliance approval.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              {queue.length} Pending Actions
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-500">
              Loading operational queue...
            </div>
          ) : queue.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">All Operational Queues Clear</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                No outstanding supplier verifications, moderation backlogs, or appeals waiting for administrative action.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                          item.priority === "HIGH"
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        {item.priority} Priority
                      </span>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                        {item.count} items
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{item.description}</p>
                  </div>

                  <Link
                    href={item.actionUrl}
                    className="self-start sm:self-center shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition"
                  >
                    {item.actionLabel}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Recent Audit */}
        <div className="space-y-6">
          {/* Quick Actions Hub */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Administrative Quick Navigation
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <Link
                href="/dashboard/admin/users"
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition flex flex-col gap-1"
              >
                <Users className="w-4 h-4 text-indigo-500" />
                <span>User Directory</span>
              </Link>
              <Link
                href="/dashboard/admin/suppliers"
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition flex flex-col gap-1"
              >
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span>Supplier Center</span>
              </Link>
              <Link
                href="/dashboard/admin/marketplace"
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition flex flex-col gap-1"
              >
                <ShoppingBag className="w-4 h-4 text-purple-500" />
                <span>Marketplace Hub</span>
              </Link>
              <Link
                href="/dashboard/admin/account-governance"
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition flex flex-col gap-1"
              >
                <Scale className="w-4 h-4 text-rose-500" />
                <span>Governance</span>
              </Link>
              <Link
                href="/dashboard/notifications"
                className="col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-500" />
                  <span>Notification Center</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Recent Audit Events */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Recent Privileged Events
              </h2>
              <Link
                href="/dashboard/admin/audit"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Full Audit Trail
              </Link>
            </div>

            {recentAudits.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">No recent privileged logs recorded.</p>
            ) : (
              <div className="space-y-2.5">
                {recentAudits.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-slate-200">
                        {item.action}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                      by <span className="font-medium text-slate-800 dark:text-slate-300">{item.actorEmail || "System"}</span> on {item.targetType}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
