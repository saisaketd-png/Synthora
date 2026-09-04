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
  ShoppingBag,
  Scale,
  Activity,
  CheckCircle2,
  RefreshCw,
  Bell,
  Sliders,
} from "lucide-react";
import { PageHeader, StatusBadge } from "@/shared/components/ui/KemkendraUI";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

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
  actorEmail?: string;
  createdAt: string;
  details?: string;
}

export default function AdminOperationsPage() {
  const [snapshot, setSnapshot] = useState<PlatformSnapshot | null>(null);
  const [queue, setQueue] = useState<AttentionQueueItem[]>([]);
  const [recentAudit, setRecentAudit] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  async function loadData() {
    try {
      const [snapRes, queueRes, auditRes] = await Promise.all([
        authenticatedFetch("/api/v1/admin/operations/snapshot").catch(() => null),
        authenticatedFetch("/api/v1/admin/operations/attention-queue").catch(() => null),
        authenticatedFetch("/api/v1/admin/operations/audit/recent?limit=8").catch(() => null),
      ]);

      if (snapRes && snapRes.ok) {
        setSnapshot(await snapRes.json());
      }
      if (queueRes && queueRes.ok) {
        const qData = await queueRes.json();
        setQueue(Array.isArray(qData) ? qData : qData.content || []);
      }
      if (auditRes && auditRes.ok) {
        const aData = await auditRes.json();
        setRecentAudit(Array.isArray(aData) ? aData : aData.content || []);
      }
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.error("Failed to load operations dashboard", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    loadData();
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 text-[#0F172A] pb-12">
      {/* 1. Calm Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#E4E4E7] pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#0052CC] block mb-1">
            Platform Operations
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A]">
            Governance & Operational Desk
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-xl">
            Live telemetry across platform participants, catalog readiness, transaction throughput, and compliance queues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 px-3 text-xs font-medium text-[#475569] bg-white hover:bg-[#FAFAFA] border border-[#E4E4E7] rounded-[4px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#0052CC]" : "text-[#64748B]"}`} />
            <span>{lastRefreshed ? `Refreshed ${lastRefreshed}` : "Refresh"}</span>
          </button>
          <Link
            href="/dashboard/admin/marketplace"
            className="h-8 px-3.5 text-xs font-medium text-white bg-[#0052CC] hover:bg-[#0747A6] rounded-[4px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Marketplace Hub</span>
          </Link>
        </div>
      </div>

      {/* 2. Unified Operations Telemetry Band */}
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-4 shadow-xs">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] mb-3">
          Platform Snapshot
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E4E7]">
          {/* Users */}
          <Link href="/dashboard/admin/users" className="sm:px-3 first:pl-0 last:pr-0 py-1 sm:py-0 group">
            <span className="text-[11px] text-[#64748B] block group-hover:text-[#0052CC]">Users</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5 group-hover:text-[#0052CC]">
              {loading ? "—" : snapshot?.users.totalUsers.toLocaleString() ?? "0"}
            </div>
            <span className="text-[10px] text-[#059669] font-mono">{snapshot?.users.activeUsers ?? 0} active</span>
          </Link>

          {/* Suppliers */}
          <Link href="/dashboard/admin/suppliers" className="sm:px-3 first:pl-0 last:pr-0 py-1 sm:py-0 group">
            <span className="text-[11px] text-[#64748B] block group-hover:text-[#0052CC]">Suppliers</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5 group-hover:text-[#0052CC]">
              {loading ? "—" : snapshot?.suppliers.totalSuppliers.toLocaleString() ?? "0"}
            </div>
            <span className="text-[10px] text-[#059669] font-mono">{snapshot?.suppliers.verifiedSuppliers ?? 0} verified</span>
          </Link>

          {/* Catalog */}
          <Link href="/dashboard/admin/catalog" className="sm:px-3 first:pl-0 last:pr-0 py-1 sm:py-0 group">
            <span className="text-[11px] text-[#64748B] block group-hover:text-[#0052CC]">Offerings</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5 group-hover:text-[#0052CC]">
              {loading ? "—" : snapshot?.catalog.activeOfferings.toLocaleString() ?? "0"}
            </div>
            <span className="text-[10px] text-[#D97706] font-mono">{snapshot?.catalog.pendingOfferings ?? 0} in review</span>
          </Link>

          {/* Marketplace RFQs */}
          <Link href="/dashboard/admin/transactions/rfqs" className="sm:px-3 first:pl-0 last:pr-0 py-1 sm:py-0 group">
            <span className="text-[11px] text-[#64748B] block group-hover:text-[#0052CC]">Active RFQs</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5 group-hover:text-[#0052CC]">
              {loading ? "—" : snapshot?.marketplace.activeRfqs.toLocaleString() ?? "0"}
            </div>
            <span className="text-[10px] text-[#64748B] font-mono">{snapshot?.marketplace.pendingQuotations ?? 0} quotes</span>
          </Link>

          {/* Governance */}
          <Link href="/dashboard/admin/account-governance" className="sm:px-3 first:pl-0 last:pr-0 py-1 sm:py-0 group">
            <span className="text-[11px] text-[#64748B] block group-hover:text-[#0052CC]">Appeals</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5 group-hover:text-[#0052CC]">
              {loading ? "—" : snapshot?.governance.openAppeals.toLocaleString() ?? "0"}
            </div>
            <span className="text-[10px] text-[#DC2626] font-mono">{snapshot?.governance.activeSuspensions ?? 0} bans</span>
          </Link>

          {/* Policies */}
          <Link href="/dashboard/admin/settings" className="sm:px-3 first:pl-0 last:pr-0 py-1 sm:py-0 group">
            <span className="text-[11px] text-[#64748B] block group-hover:text-[#0052CC]">Runtime Flags</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5 group-hover:text-[#0052CC]">
              {loading ? "—" : snapshot?.policies?.activeFeatureFlags ?? 0}
            </div>
            <span className={`text-[10px] font-mono ${snapshot?.policies?.maintenanceModeActive ? "text-[#DC2626] font-bold" : "text-[#059669]"}`}>
              {snapshot?.policies?.maintenanceModeActive ? "Maintenance" : "Operational"}
            </span>
          </Link>
        </div>
      </div>

      {/* 3. Operational Attention Queue & Action Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operational Attention Queue (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#DFE1E6]">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#091E42] font-mono">
                Operational Adjudication Queue
              </h2>
              <p className="text-[11px] text-[#5E6C84]">
                Items requiring compliance verification, supplier approval, or dispute moderation.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#FFFAE6] text-[#974F0C] border border-[#FFE380] rounded">
              {queue.length} Pending
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white border border-[#DFE1E6] rounded-md text-xs text-[#5E6C84] font-mono">
              Loading operational queue...
            </div>
          ) : queue.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#DFE1E6] rounded-md space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#00875A] mx-auto" />
              <h3 className="text-xs font-bold text-[#091E42]">All Operational Queues Clear</h3>
              <p className="text-[11px] text-[#5E6C84] max-w-sm mx-auto">
                No outstanding supplier credential reviews, catalog moderation backlogs, or appeals waiting for administrative decision.
              </p>
            </div>
          ) : (
            <div className="border border-[#DFE1E6] rounded-md bg-white divide-y divide-[#DFE1E6] overflow-hidden">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAFBFC] transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[9px] uppercase font-bold font-mono px-1.5 py-0.2 rounded border ${
                          item.priority === "HIGH"
                            ? "bg-[#FFEBE6] text-[#BF2600] border-[#FFBDAD]"
                            : "bg-[#FFFAE6] text-[#974F0C] border-[#FFE380]"
                        }`}
                      >
                        {item.priority} PRIORITY
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-[#5E6C84]">
                        {item.count} items
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-[#091E42]">{item.title}</h3>
                    <p className="text-[11px] text-[#5E6C84] leading-relaxed">{item.description}</p>
                  </div>

                  <Link
                    href={item.actionUrl}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#0052CC] bg-white hover:bg-[#F4F5F7] border border-[#DFE1E6] rounded transition-colors self-start sm:self-center shrink-0 shadow-2xs"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side Panel: Consoles & Recent Audit Trail */}
        <div className="space-y-6">
          {/* Quick Nav Consoles */}
          <div className="bg-white border border-[#E4E4E7] rounded-[8px] overflow-hidden shadow-tactile-card">
            <div className="px-4 py-3 border-b border-[#E4E4E7] bg-[#FAFAFA]">
              <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider font-mono">
                Management Modules
              </h2>
            </div>
            <div className="divide-y divide-[#E4E4E7] text-xs">
              <Link
                href="/dashboard/admin/users"
                className="px-4 py-2.5 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#64748B] group-hover:text-[#0052CC]" />
                  <span className="font-medium text-[#0F172A] group-hover:text-[#0052CC]">User Directory & Roles</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0052CC]" />
              </Link>
              <Link
                href="/dashboard/admin/suppliers"
                className="px-4 py-2.5 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-[#64748B] group-hover:text-[#0052CC]" />
                  <span className="font-medium text-[#0F172A] group-hover:text-[#0052CC]">Supplier Directory & Verification</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0052CC]" />
              </Link>
              <Link
                href="/dashboard/admin/catalog"
                className="px-4 py-2.5 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-[#64748B] group-hover:text-[#0052CC]" />
                  <span className="font-medium text-[#0F172A] group-hover:text-[#0052CC]">Master Chemical Catalog</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0052CC]" />
              </Link>
              <Link
                href="/dashboard/admin/feature-controls"
                className="px-4 py-2.5 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-[#64748B] group-hover:text-[#0052CC]" />
                  <span className="font-medium text-[#0F172A] group-hover:text-[#0052CC]">Feature Controls & Gates</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0052CC]" />
              </Link>
            </div>
          </div>

          {/* Recent Audit Events */}
          <div className="bg-white border border-[#E4E4E7] rounded-[8px] overflow-hidden shadow-tactile-card">
            <div className="px-4 py-3 border-b border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between">
              <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider font-mono">
                Recent Audit Trail
              </h2>
              <Link href="/dashboard/admin/audit" className="text-[11px] font-semibold text-[#0052CC] hover:underline">
                Full Log →
              </Link>
            </div>
            <div className="divide-y divide-[#E4E4E7] text-xs">
              {recentAudit.length === 0 ? (
                <div className="p-4 text-center text-[#64748B] text-[11px]">
                  No recent audit events recorded.
                </div>
              ) : (
                recentAudit.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-3 space-y-1 hover:bg-[#FAFAFA] transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-semibold text-[#0052CC] uppercase">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-[#64748B] font-mono">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#0F172A] font-mono truncate">
                      {log.targetType} • {log.targetId ? log.targetId.substring(0, 8) : "N/A"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
