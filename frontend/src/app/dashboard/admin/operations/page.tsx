"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, AlertTriangle, FileText, CheckCircle2, 
  Search, ShieldAlert, ArrowUpRight, 
  Clock
} from "lucide-react";

interface Kpis {
  catalog: {
    activeMasterProducts: number;
    draftMasterProducts: number;
    inactiveMasterProducts: number;
    mergedMasterProducts: number;
    productsRequiringVerification: number;
    duplicateCandidates: number;
    productsWithoutEligibleOfferings: number;
  };
  suppliers: {
    pendingVerification: number;
    underReview: number;
    informationRequired: number;
    verified: number;
    rejected: number;
    suspended: number;
  };
  offerings: {
    pendingReview: number;
    underReview: number;
    informationRequired: number;
    approved: number;
    flagged: number;
    rejected: number;
    suspended: number;
    missingRequiredDocuments: number;
  };
  requests: {
    pendingProductRequests: number;
    informationRequired: number;
    recentlyApproved: number;
    recentlyRejected: number;
  };
}

interface ActionItem {
  id: string;
  category: string;
  priority: string;
  title: string;
  reason: string;
  count: number;
  targetUrl: string;
}

export default function AdminOperationsDashboard() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [kpiRes, actRes] = await Promise.all([
          fetch("http://127.0.0.1:8085/api/v1/admin/operations/kpis", { headers }),
          fetch("http://127.0.0.1:8085/api/v1/admin/operations/action-center", { headers })
        ]);

        if (kpiRes.ok) setKpis(await kpiRes.json());
        if (actRes.ok) setActions(await actRes.json());
      } catch (err) {
        console.error("Failed to load operations data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0A192F] tracking-tight">
            Admin Operations & Control Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time platform metrics, catalog quality governance, and operational priority queues.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/search"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
          >
            <Search className="w-4 h-4 text-slate-500" />
            Unified Search
          </Link>
          <Link
            href="/dashboard/admin/governance"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xs transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            Governance Queue
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold animate-pulse">
          Loading operations control metrics...
        </div>
      ) : (
        <>
          {/* Action Center Banner */}
          {actions.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Operational Action Center
                </h2>
                <span className="text-xs text-slate-500 font-mono font-bold">
                  {actions.length} Action Items
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {actions.map((act) => (
                  <Link
                    key={act.id}
                    href={act.targetUrl}
                    className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl flex flex-col justify-between transition-colors group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 text-amber-800">
                          {act.priority}
                        </span>
                        <span className="text-xl font-extrabold text-slate-900 font-mono">
                          {act.count}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {act.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {act.reason}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600">
                      <span>Review Items</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Real-time KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Catalog KPIs */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Master Catalog</span>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Active Products</span>
                  <span className="font-bold text-slate-900 font-mono">{kpis?.catalog.activeMasterProducts}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Draft Products</span>
                  <span className="font-bold text-slate-900 font-mono">{kpis?.catalog.draftMasterProducts}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Merged Records</span>
                  <span className="font-bold text-slate-900 font-mono">{kpis?.catalog.mergedMasterProducts}</span>
                </div>
              </div>
              <Link
                href="/dashboard/admin/catalog/quality"
                className="block text-center w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors"
              >
                Inspect Quality Center →
              </Link>
            </div>

            {/* Supplier KPIs */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Suppliers</span>
                <ShieldCheck className="w-4 h-4 text-teal-600" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Verified Suppliers</span>
                  <span className="font-bold text-teal-700 font-mono">{kpis?.suppliers.verified}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Pending Verification</span>
                  <span className="font-bold text-amber-700 font-mono">{kpis?.suppliers.pendingVerification}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Under Review</span>
                  <span className="font-bold text-blue-700 font-mono">{kpis?.suppliers.underReview}</span>
                </div>
              </div>
              <Link
                href="/dashboard/admin/suppliers/quality"
                className="block text-center w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors"
              >
                Inspect Supplier Quality →
              </Link>
            </div>

            {/* Offering KPIs */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Offerings</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Approved Offerings</span>
                  <span className="font-bold text-emerald-700 font-mono">{kpis?.offerings.approved}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Pending Review</span>
                  <span className="font-bold text-amber-700 font-mono">{kpis?.offerings.pendingReview}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Flagged Offerings</span>
                  <span className="font-bold text-rose-700 font-mono">{kpis?.offerings.flagged}</span>
                </div>
              </div>
              <Link
                href="/dashboard/admin/catalog/offerings/quality"
                className="block text-center w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors"
              >
                Inspect Offering Quality →
              </Link>
            </div>

            {/* Product Request KPIs */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Product Requests</span>
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Pending Requests</span>
                  <span className="font-bold text-purple-700 font-mono">{kpis?.requests.pendingProductRequests}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Approved</span>
                  <span className="font-bold text-emerald-700 font-mono">{kpis?.requests.recentlyApproved}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Rejected</span>
                  <span className="font-bold text-slate-500 font-mono">{kpis?.requests.recentlyRejected}</span>
                </div>
              </div>
              <Link
                href="/dashboard/admin/catalog/requests"
                className="block text-center w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors"
              >
                Inspect Requests →
              </Link>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
