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
  Clock,
  Search,
  ArrowRight,
  Globe2,
  Mail,
  Phone,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

interface SupplierItem {
  id: number;
  name: string;
  legalName?: string;
  countryCode?: string;
  countryName?: string;
  businessType?: string;
  businessEmail?: string;
  businessPhone?: string;
  verificationStatus?: string;
  verified?: boolean;
  exportReady?: boolean;
  createdAt?: string;
}

export default function SupplierVerificationQueuePage() {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authenticatedFetch("/api/v1/admin/suppliers?size=100&excludeDraft=false");
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load supplier verification queue";
      setError(msg);
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
      return Boolean(nameMatch || legalMatch || countryMatch);
    }
    return true;
  });

  return (
    <div className="max-w-[1560px] mx-auto space-y-6 pb-12">
      {/* 1. Header */}
      <div className="bg-white border border-[#DFE1E6] rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/suppliers"
            className="p-2 hover:bg-[#F4F5F7] rounded-xl text-[#5E6C84] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-[#0052CC] bg-[#DEEBFF] px-2 py-0.5 rounded uppercase">
                Admin Verification Center
              </span>
              <span className="text-xs text-[#7A869A]">•</span>
              <span className="text-xs font-mono text-[#5E6C84]">Due Diligence Queue</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#091E42] mt-1">
              Supplier Verification Queue
            </h1>
            <p className="text-xs sm:text-sm text-[#5E6C84] mt-0.5">
              Evidence-based corporate identity verification, KYC document review, and authorized contacts moderation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadSuppliers()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#091E42] bg-white hover:bg-[#F4F5F7] border border-[#DFE1E6] rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0052CC]" : "text-[#5E6C84]"}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#FFEBE6] border border-[#FFBDAD] text-[#DE350B] text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#DE350B] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-[#DFE1E6] p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F4F5F7] border border-[#DFE1E6] rounded-xl">
            {[
              { id: "ALL", label: `All (${suppliers.length})` },
              { id: "PENDING", label: `Pending (${pendingCount})` },
              { id: "UNDER_REVIEW", label: `Under Review (${underReviewCount})` },
              { id: "INFORMATION_REQUIRED", label: `Info Required (${infoRequiredCount})` },
              { id: "VERIFIED", label: `Verified (${verifiedCount})` },
              { id: "REJECTED", label: "Rejected" },
              { id: "SUSPENDED", label: "Suspended" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-[#0052CC] text-white shadow-xs"
                    : "text-[#5E6C84] hover:text-[#091E42] hover:bg-[#EBECF0]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-[#7A869A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by company, legal name, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#DFE1E6] rounded-xl text-xs text-[#091E42] focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
            />
          </div>
        </div>

        {/* Suppliers Queue Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs font-mono font-bold text-[#5E6C84]">
              Loading supplier records...
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#5E6C84]">
              No suppliers found matching the selected filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EBECF0] text-[10px] uppercase font-mono font-bold text-[#5E6C84]">
                  <th className="py-3 px-3">Supplier & Legal Entity</th>
                  <th className="py-3 px-3">Type & Market</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBECF0]">
                {filteredSuppliers.map((sup) => {
                  const st = sup.verificationStatus || "DRAFT";
                  return (
                    <tr key={sup.id} className="hover:bg-[#FAFBFC] transition-colors group">
                      <td className="py-3.5 px-3">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-[#F4F5F7] border border-[#DFE1E6] shrink-0 text-[#0052CC] mt-0.5">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-[#091E42] text-xs sm:text-sm">{sup.name}</div>
                            {sup.legalName && sup.legalName !== sup.name && (
                              <div className="text-[11px] text-[#5E6C84] font-mono">{sup.legalName}</div>
                            )}
                            <div className="text-[10px] text-[#7A869A] font-mono flex items-center gap-1 mt-0.5">
                              <Globe2 className="w-3 h-3" />
                              <span>{sup.countryName || sup.countryCode || "Global"}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#EBECF0] text-[#172B4D]">
                          {sup.businessType || "MANUFACTURER"}
                        </span>
                        {sup.exportReady && (
                          <div className="text-[10px] text-[#00875A] font-mono mt-1 font-semibold">
                            ✓ Export Ready
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-[#5E6C84]">
                        {sup.businessEmail && (
                          <div className="flex items-center gap-1 text-[11px] truncate max-w-[180px]">
                            <Mail className="w-3 h-3 text-[#7A869A]" />
                            <span>{sup.businessEmail}</span>
                          </div>
                        )}
                        {sup.businessPhone && (
                          <div className="flex items-center gap-1 text-[11px] mt-0.5">
                            <Phone className="w-3 h-3 text-[#7A869A]" />
                            <span>{sup.businessPhone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold font-mono inline-flex items-center gap-1 ${
                          st === "VERIFIED" || sup.verified ? "bg-[#E3FCEF] text-[#006644]" :
                          st === "INFORMATION_REQUIRED" ? "bg-[#FFF0B3] text-[#974F0C]" :
                          st === "UNDER_REVIEW" ? "bg-[#FFF0B3] text-[#974F0C]" :
                          st === "PENDING" ? "bg-[#DEEBFF] text-[#0747A6]" :
                          st === "REJECTED" || st === "SUSPENDED" ? "bg-[#FFEBE6] text-[#DE350B]" :
                          "bg-[#F4F5F7] text-[#172B4D]"
                        }`}>
                          {st}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <Link
                          href={`/dashboard/admin/suppliers/verification/${sup.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#091E42] bg-white hover:bg-[#F4F5F7] border border-[#DFE1E6] hover:border-[#0052CC] rounded-lg transition-colors shadow-2xs"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3 text-[#5E6C84]" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
