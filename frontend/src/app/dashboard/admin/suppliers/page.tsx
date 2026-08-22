"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Ban,
  RefreshCw,
  ArrowRight,
  Search,
  Filter,
  Globe2,
  UserCheck,
} from "lucide-react";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { AdminStatsCard } from "@/features/admin/components/AdminStatsCard";

export default function SupplierModerationHubPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authenticatedFetch("/api/v1/admin/suppliers?size=100&excludeDraft=false");
      if (!res.ok) throw new Error("Failed to load supplier moderation records");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.content || [];
      setSuppliers(list);
    } catch (err: any) {
      setError(err.message || "Failed to load supplier moderation hub");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived counts
  const pendingCount = suppliers.filter((s) => s.verificationStatus === "PENDING").length;
  const underReviewCount = suppliers.filter((s) => s.verificationStatus === "UNDER_REVIEW").length;
  const infoRequiredCount = suppliers.filter((s) => s.verificationStatus === "INFORMATION_REQUIRED").length;
  const verifiedCount = suppliers.filter((s) => s.verificationStatus === "VERIFIED" || s.verified).length;
  const rejectedCount = suppliers.filter((s) => s.verificationStatus === "REJECTED").length;
  const suspendedCount = suppliers.filter((s) => s.verificationStatus === "SUSPENDED" || s.userStatus === "SUSPENDED").length;

  const filteredSuppliers = suppliers.filter((sup) => {
    if (statusFilter !== "ALL") {
      if (statusFilter === "VERIFIED" && !(sup.verificationStatus === "VERIFIED" || sup.verified)) return false;
      if (statusFilter === "PENDING" && sup.verificationStatus !== "PENDING") return false;
      if (statusFilter === "UNDER_REVIEW" && sup.verificationStatus !== "UNDER_REVIEW") return false;
      if (statusFilter === "INFORMATION_REQUIRED" && sup.verificationStatus !== "INFORMATION_REQUIRED") return false;
      if (statusFilter === "REJECTED" && sup.verificationStatus !== "REJECTED") return false;
      if (statusFilter === "SUSPENDED" && sup.verificationStatus !== "SUSPENDED" && sup.userStatus !== "SUSPENDED") return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = sup.name?.toLowerCase().includes(q);
      const legalMatch = sup.legalName?.toLowerCase().includes(q);
      const countryMatch = sup.countryName?.toLowerCase().includes(q) || sup.countryCode?.toLowerCase().includes(q);
      return nameMatch || legalMatch || countryMatch;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
              <Building2 className="w-3.5 h-3.5" />
              Supplier Moderation Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Supplier Moderation
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Manage the end-to-end supplier compliance lifecycle, due-diligence verification, and commercial offering reviews. All administrative actions are recorded to the immutable audit ledger.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadData()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Two Visually Separate Primary Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Banner 1: Supplier Verification */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white border border-purple-700/50 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-2xl border border-purple-400/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/30 text-purple-200 border border-purple-400/30">
                {pendingCount + underReviewCount} In Queue
              </span>
            </div>
            <h2 className="text-lg font-black text-white tracking-tight uppercase">
              Supplier Verification Workspace
            </h2>
            <p className="text-xs text-purple-200/80 leading-relaxed">
              Verify legal company identity, official CIN/registration, GST/tax status, registered headquarters, uploaded KYC compliance documents, and authorized contacts.
            </p>
          </div>

          <Link
            href="/dashboard/admin/suppliers/verification"
            className="inline-flex items-center justify-between w-full px-5 py-3.5 bg-white text-purple-950 hover:bg-purple-50 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md"
          >
            <span>Open Verification Queue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Banner 2: Offering Review */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white border border-blue-700/50 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-2xl border border-blue-400/30">
                <Package className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/30 text-blue-200 border border-blue-400/30">
                Commercial Catalog
              </span>
            </div>
            <h2 className="text-lg font-black text-white tracking-tight uppercase">
              Supplier Offering Review
            </h2>
            <p className="text-xs text-blue-200/80 leading-relaxed">
              Review individual supplier commercial chemical listings, pricing, purity grades, packaging specs, and certificates of analysis (CoA) before public catalog publication.
            </p>
          </div>

          <Link
            href="/dashboard/admin/catalog/offerings"
            className="inline-flex items-center justify-between w-full px-5 py-3.5 bg-white text-blue-950 hover:bg-blue-50 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md"
          >
            <span>Open Offering Review</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter(statusFilter === "PENDING" ? "ALL" : "PENDING")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === "PENDING" ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500/20" : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Pending</span>
          </div>
          <strong className="text-xl font-black text-slate-900">{pendingCount}</strong>
          <span className="block text-[11px] text-slate-500 mt-0.5">Awaiting Review</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "UNDER_REVIEW" ? "ALL" : "UNDER_REVIEW")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === "UNDER_REVIEW" ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20" : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <RefreshCw className="w-4 h-4" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">In Review</span>
          </div>
          <strong className="text-xl font-black text-slate-900">{underReviewCount}</strong>
          <span className="block text-[11px] text-slate-500 mt-0.5">Under Review</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "INFORMATION_REQUIRED" ? "ALL" : "INFORMATION_REQUIRED")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === "INFORMATION_REQUIRED" ? "bg-purple-50 border-purple-300 ring-2 ring-purple-500/20" : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between text-purple-600 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Info Req</span>
          </div>
          <strong className="text-xl font-black text-slate-900">{infoRequiredCount}</strong>
          <span className="block text-[11px] text-slate-500 mt-0.5">Clarification</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "VERIFIED" ? "ALL" : "VERIFIED")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === "VERIFIED" ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20" : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Verified</span>
          </div>
          <strong className="text-xl font-black text-slate-900">{verifiedCount}</strong>
          <span className="block text-[11px] text-slate-500 mt-0.5">Authorized</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "REJECTED" ? "ALL" : "REJECTED")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === "REJECTED" ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500/20" : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <XCircle className="w-4 h-4" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Rejected</span>
          </div>
          <strong className="text-xl font-black text-slate-900">{rejectedCount}</strong>
          <span className="block text-[11px] text-slate-500 mt-0.5">Non-compliant</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "SUSPENDED" ? "ALL" : "SUSPENDED")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === "SUSPENDED" ? "bg-slate-100 border-slate-400 ring-2 ring-slate-500/20" : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between text-slate-700 mb-1">
            <Ban className="w-4 h-4" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Suspended</span>
          </div>
          <strong className="text-xl font-black text-slate-900">{suspendedCount}</strong>
          <span className="block text-[11px] text-slate-500 mt-0.5">Restricted</span>
        </div>
      </div>

      {/* Supplier Directory / Quick Search */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Supplier Accounts ({filteredSuppliers.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Filtered by: <span className="font-bold text-purple-700">{statusFilter}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {statusFilter !== "ALL" && (
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 px-3">Supplier</th>
                <th className="pb-3 px-3">Country</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Export Ready</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                          {s.logoUrl ? (
                            <img src={s.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <Building2 className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <strong className="block font-bold text-slate-900">{s.name}</strong>
                          <span className="text-[11px] text-slate-400 font-mono">ID: #{s.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">
                      {s.countryName || s.countryCode || "N/A"}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                        s.verificationStatus === "VERIFIED" || s.verified ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                        s.verificationStatus === "UNDER_REVIEW" ? "bg-blue-50 text-blue-800 border border-blue-200" :
                        s.verificationStatus === "INFORMATION_REQUIRED" ? "bg-purple-50 text-purple-800 border border-purple-200" :
                        s.verificationStatus === "SUSPENDED" ? "bg-slate-100 text-slate-800 border border-slate-300" :
                        s.verificationStatus === "REJECTED" ? "bg-rose-50 text-rose-800 border border-rose-200" :
                        "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}>
                        {s.verificationStatus || (s.verified ? "VERIFIED" : "DRAFT")}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      {s.exportReady ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
                          <Globe2 className="w-3.5 h-3.5" /> Export Ready
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Domestic Only</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        href={`/dashboard/admin/suppliers/verification/${s.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[11px] transition-colors shadow-2xs"
                      >
                        <span>Due Diligence</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    No suppliers match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
