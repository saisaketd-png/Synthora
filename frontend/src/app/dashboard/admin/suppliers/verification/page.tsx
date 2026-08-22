"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  Filter,
  ArrowRight,
  Globe2,
  Mail,
  Phone,
} from "lucide-react";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

export default function SupplierVerificationQueuePage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authenticatedFetch("/api/v1/admin/suppliers?size=100&excludeDraft=true");
      if (!res.ok) {
        let errMsg = "Failed to load supplier verification queue";
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.content || [];
      setSuppliers(list);
    } catch (e: any) {
      setError(e.message || "Failed to load supplier verification queue");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // Derived counts
  const pendingCount = suppliers.filter((s) => s.verificationStatus === "PENDING").length;
  const underReviewCount = suppliers.filter((s) => s.verificationStatus === "UNDER_REVIEW").length;
  const infoRequiredCount = suppliers.filter((s) => s.verificationStatus === "INFORMATION_REQUIRED").length;
  const verifiedCount = suppliers.filter((s) => s.verificationStatus === "VERIFIED" || s.verified).length;

  const filteredSuppliers = suppliers.filter((sup) => {
    if (statusFilter !== "ALL") {
      if (statusFilter === "PENDING" && sup.verificationStatus !== "PENDING") return false;
      if (statusFilter === "UNDER_REVIEW" && sup.verificationStatus !== "UNDER_REVIEW") return false;
      if (statusFilter === "INFORMATION_REQUIRED" && sup.verificationStatus !== "INFORMATION_REQUIRED") return false;
      if (statusFilter === "VERIFIED" && !(sup.verificationStatus === "VERIFIED" || sup.verified)) return false;
      if (statusFilter === "REJECTED" && sup.verificationStatus !== "REJECTED") return false;
      if (statusFilter === "SUSPENDED" && sup.verificationStatus !== "SUSPENDED") return false;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/suppliers"
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                SUPPLIER VERIFICATION QUEUE
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Evidence-based due diligence, legal identity verification, KYC document review, and authorized contacts moderation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadSuppliers()}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-600" : ""}`} /> Refresh Queue
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                statusFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Submissions ({suppliers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                statusFilter === "PENDING"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("UNDER_REVIEW")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                statusFilter === "UNDER_REVIEW"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/60"
              }`}
            >
              Under Review ({underReviewCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("INFORMATION_REQUIRED")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                statusFilter === "INFORMATION_REQUIRED"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/60"
              }`}
            >
              Info Required ({infoRequiredCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("VERIFIED")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                statusFilter === "VERIFIED"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60"
              }`}
            >
              Verified ({verifiedCount})
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>
      </div>

      {/* Verification Queue Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.length > 0 ? (
          filteredSuppliers.map((supplier) => {
            const isVerified = supplier.verificationStatus === "VERIFIED" || supplier.verified;
            const isUnderReview = supplier.verificationStatus === "UNDER_REVIEW";
            const isPending = supplier.verificationStatus === "PENDING";
            const isInfoReq = supplier.verificationStatus === "INFORMATION_REQUIRED";

            return (
              <div
                key={supplier.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Card Header with Logo & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 p-1">
                        {supplier.logoUrl ? (
                          <img
                            src={supplier.logoUrl}
                            alt="Logo"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <strong className="block font-black text-slate-900 text-sm line-clamp-1">
                          {supplier.name}
                        </strong>
                        <span className="text-[11px] font-mono text-purple-700 font-bold">
                          Supplier ID: #{supplier.id}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                        isVerified
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : isUnderReview
                          ? "bg-blue-50 text-blue-800 border border-blue-200"
                          : isInfoReq
                          ? "bg-purple-50 text-purple-800 border border-purple-200"
                          : isPending
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-800 border border-slate-200"
                      }`}
                    >
                      {supplier.verificationStatus || (isVerified ? "VERIFIED" : "PENDING")}
                    </span>
                  </div>

                  {/* Company Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Country</span>
                      <strong className="text-slate-800 font-medium">
                        {supplier.countryName || supplier.countryCode || "India"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Export Ready</span>
                      <strong className="text-slate-800 font-medium">
                        {supplier.exportReady ? "Export Global" : "Domestic Only"}
                      </strong>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        Email:{" "}
                        <strong className={supplier.emailVerified ? "text-emerald-700 font-bold" : "text-slate-500"}>
                          {supplier.emailVerified ? "✓ VERIFIED" : "NOT VERIFIED"}
                        </strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        Phone:{" "}
                        <strong className={supplier.phoneVerified ? "text-emerald-700 font-bold" : "text-slate-500"}>
                          {supplier.phoneVerified ? "✓ VERIFIED" : "NOT VERIFIED"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <Link
                  href={`/dashboard/admin/suppliers/verification/${supplier.id}`}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-extrabold uppercase tracking-wider text-center transition-colors shadow-2xs flex items-center justify-center gap-2"
                >
                  <span>{isUnderReview ? "Continue Review" : "Review Application"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-2 shadow-2xs">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Supplier Applications in Queue</h3>
            <p className="text-xs text-slate-500">
              There are currently no submitted supplier verification applications matching the selected criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
