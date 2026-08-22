"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Search,
  ShieldAlert,
  ArrowRight,
  Clock,
  Layers,
  Building2,
  Package,
  Users,
  Sparkles,
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
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const [kpiRes, actRes] = await Promise.all([
          fetch("/api/v1/admin/operations/kpis", { headers }),
          fetch("/api/v1/admin/operations/action-center", { headers }),
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

  const pendingSuppliers = kpis?.suppliers.pendingVerification ?? 0;
  const pendingOfferings = kpis?.offerings.pendingReview ?? 0;
  const activeProducts = kpis?.catalog.activeMasterProducts ?? 0;
  const verifiedSuppliers = kpis?.suppliers.verified ?? 0;

  return (
    <div className="max-w-[1560px] mx-auto space-y-6">
      {/* 1. Header & Live Operational Search */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold text-[#0052CC] bg-[#DEEBFF] px-2 py-0.5 rounded uppercase">
            Admin Operations Console
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#091E42] mt-1.5">
            Platform Quality & Governance Desk
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Real-time platform metrics, catalog quality governance, and operational priority queues.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/admin/search"
            className="w-full sm:w-auto h-11 px-4 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] rounded-xl text-xs sm:text-sm font-semibold text-[#091E42] flex items-center justify-center gap-2 shadow-2xs transition-colors"
          >
            <Search className="w-4 h-4 text-[#0052CC]" />
            <span>Global Search</span>
          </Link>
        </div>
      </div>

      {/* 2. Priority Operational Queues: ATTENTION REQUIRED */}
      {(pendingSuppliers > 0 || pendingOfferings > 0 || actions.length > 0) && (
        <div className="bg-[#FFFAE6] border border-[#FFE380] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#974F0C]">
            <AlertTriangle className="w-4 h-4 text-[#FF8B00]" />
            <span>Attention Required — Operational Action Items</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingSuppliers > 0 && (
              <Link
                href="/dashboard/admin/suppliers/quality"
                className="p-3.5 bg-white border border-[#FFE380] rounded-xl flex items-center justify-between shadow-2xs hover:border-[#FF8B00] transition-colors block group"
              >
                <div>
                  <strong className="text-sm text-[#091E42] group-hover:text-[#0052CC] block">
                    Supplier Verification
                  </strong>
                  <span className="text-xs text-[#974F0C]">
                    {pendingSuppliers} pending KYC & document audits
                  </span>
                </div>
                <span className="px-2 py-1 rounded-md bg-[#FFE380] text-[#974F0C] font-mono font-bold text-xs">
                  {pendingSuppliers}
                </span>
              </Link>
            )}

            {pendingOfferings > 0 && (
              <Link
                href="/dashboard/admin/catalog/offerings/quality"
                className="p-3.5 bg-white border border-[#FFE380] rounded-xl flex items-center justify-between shadow-2xs hover:border-[#FF8B00] transition-colors block group"
              >
                <div>
                  <strong className="text-sm text-[#091E42] group-hover:text-[#0052CC] block">
                    Offering Moderation
                  </strong>
                  <span className="text-xs text-[#974F0C]">
                    {pendingOfferings} chemical offerings to approve
                  </span>
                </div>
                <span className="px-2 py-1 rounded-md bg-[#FFE380] text-[#974F0C] font-mono font-bold text-xs">
                  {pendingOfferings}
                </span>
              </Link>
            )}

            <Link
              href="/dashboard/admin/catalog/audit"
              className="p-3.5 bg-white border border-[#FFE380] rounded-xl flex items-center justify-between shadow-2xs hover:border-[#FF8B00] transition-colors block group"
            >
              <div>
                <strong className="text-sm text-[#091E42] group-hover:text-[#0052CC] block">
                  Catalog Integrity
                </strong>
                <span className="text-xs text-[#64748B]">Verify canonical synonyms & duplicates</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#0052CC]" />
            </Link>
          </div>
        </div>
      )}

      {/* 3. Platform Core KPIs (2 cols on mobile -> 4 cols on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/dashboard/admin/catalog"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] hover:border-[#0052CC] transition-all shadow-sm block group"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
            Master Chemicals
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <strong className="text-2xl sm:text-3xl font-extrabold font-mono text-[#091E42] group-hover:text-[#0052CC]">
              {activeProducts}
            </strong>
            <span className="text-[11px] text-[#00875A] font-semibold">Active</span>
          </div>
        </Link>

        <Link
          href="/dashboard/admin/suppliers"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] hover:border-[#0052CC] transition-all shadow-sm block group"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
            Verified Suppliers
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <strong className="text-2xl sm:text-3xl font-extrabold font-mono text-[#091E42] group-hover:text-[#0052CC]">
              {verifiedSuppliers}
            </strong>
            <span className="text-[11px] text-[#006644] font-semibold">Audited</span>
          </div>
        </Link>

        <Link
          href="/dashboard/admin/transactions/rfqs"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] hover:border-[#0052CC] transition-all shadow-sm block group"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
            Pending Offerings
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <strong className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0747A6]">
              {pendingOfferings}
            </strong>
            <span className="text-[11px] text-[#0052CC] font-semibold">Review</span>
          </div>
        </Link>

        <Link
          href="/dashboard/admin/users"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] hover:border-[#0052CC] transition-all shadow-sm block group"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
            Supplier Queue
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <strong className="text-2xl sm:text-3xl font-extrabold font-mono text-[#091E42] group-hover:text-[#0052CC]">
              {pendingSuppliers}
            </strong>
            <span className="text-[11px] text-[#974F0C] font-semibold">KYC</span>
          </div>
        </Link>
      </div>

      {/* 4. Quick Governance Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/dashboard/admin/catalog"
          className="p-4 bg-white border border-[#E2E8F0] hover:border-[#0052CC] rounded-2xl transition-all text-left shadow-2xs group flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-[#DEEBFF] text-[#0052CC] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-sm font-bold text-[#091E42] group-hover:text-[#0052CC] block">
              Master Catalog Governance
            </strong>
            <span className="text-xs text-[#64748B] mt-0.5 block">
              Monographs, CAS validation, images & synonym merges
            </span>
          </div>
        </Link>

        <Link
          href="/dashboard/admin/suppliers/quality"
          className="p-4 bg-white border border-[#E2E8F0] hover:border-[#0052CC] rounded-2xl transition-all text-left shadow-2xs group flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E3FCEF] text-[#00875A] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-sm font-bold text-[#091E42] group-hover:text-[#0052CC] block">
              Supplier Quality Audits
            </strong>
            <span className="text-xs text-[#64748B] mt-0.5 block">
              GMP / ISO certifications, export licenses & verification
            </span>
          </div>
        </Link>

        <Link
          href="/dashboard/admin/transactions/rfqs"
          className="p-4 bg-white border border-[#E2E8F0] hover:border-[#0052CC] rounded-2xl transition-all text-left shadow-2xs group flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#091E42] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-sm font-bold text-[#091E42] group-hover:text-[#0052CC] block">
              Transaction Oversight
            </strong>
            <span className="text-xs text-[#64748B] mt-0.5 block">
              Commercial RFQs, quotation responses & purchase orders
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
