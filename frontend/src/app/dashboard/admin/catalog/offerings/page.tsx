"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  FlaskConical,
  Filter,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Lock,
  FileCheck
} from "lucide-react";
import { getAdminOfferings } from "@/features/admin/api/adminCatalogApi";

export default function AdminOfferingGovernanceDashboardPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);

  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      setError(null);
      const res = await getAdminOfferings({
        query: query.trim() || undefined,
        page,
        size: 50,
      });
      setOfferings(res.content);
    } catch (e: any) {
      setError(e.message || "Failed to load supplier offerings");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [query, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredOfferings = offerings.filter((off) => {
    if (!statusFilter) return true;
    return (off.moderationStatus || "PENDING_REVIEW") === statusFilter;
  });

  const countPending = offerings.filter(o => o.moderationStatus === "PENDING_REVIEW").length;
  const countUnderReview = offerings.filter(o => o.moderationStatus === "UNDER_REVIEW").length;
  const countInfoReq = offerings.filter(o => o.moderationStatus === "INFORMATION_REQUIRED").length;
  const countApproved = offerings.filter(o => o.moderationStatus === "APPROVED").length;
  const countFlagged = offerings.filter(o => o.moderationStatus === "FLAGGED").length;
  const countRejected = offerings.filter(o => o.moderationStatus === "REJECTED").length;
  const countSuspended = offerings.filter(o => o.moderationStatus === "SUSPENDED").length;
  const countMissingDocs = offerings.filter(o => !o.coaAvailable || !o.msdsAvailable).length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/catalog"
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-blue-600" />
              SUPPLIER OFFERING GOVERNANCE WORKSPACE
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review commercial offerings, verify purity & grade specs, and govern B2B marketplace publication.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadData()}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh Queue
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-medium">
          {error}
        </div>
      )}

      {/* 8 Governance KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl">
          <span className="text-[10px] font-bold uppercase text-amber-800 block">Pending Review</span>
          <strong className="text-xl font-black text-amber-900">{countPending}</strong>
        </div>
        <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl">
          <span className="text-[10px] font-bold uppercase text-blue-800 block">Under Review</span>
          <strong className="text-xl font-black text-blue-900">{countUnderReview}</strong>
        </div>
        <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-2xl">
          <span className="text-[10px] font-bold uppercase text-purple-800 block">Info Required</span>
          <strong className="text-xl font-black text-purple-900">{countInfoReq}</strong>
        </div>
        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
          <span className="text-[10px] font-bold uppercase text-emerald-800 block">Approved</span>
          <strong className="text-xl font-black text-emerald-900">{countApproved}</strong>
        </div>
        <div className="p-3 bg-amber-100/80 border border-amber-300 rounded-2xl">
          <span className="text-[10px] font-bold uppercase text-amber-900 block">Flagged</span>
          <strong className="text-xl font-black text-amber-950">{countFlagged}</strong>
        </div>
        <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-2xl">
          <span className="text-[10px] font-bold uppercase text-rose-800 block">Rejected</span>
          <strong className="text-xl font-black text-rose-900">{countRejected}</strong>
        </div>
        <div className="p-3 bg-slate-100 border border-slate-300 rounded-2xl">
          <span className="text-[10px] font-bold uppercase text-slate-800 block">Suspended</span>
          <strong className="text-xl font-black text-slate-900">{countSuspended}</strong>
        </div>
        <div className="p-3 bg-rose-100/60 border border-rose-200 rounded-2xl">
          <span className="text-[10px] font-bold uppercase text-rose-900 block">Missing Docs</span>
          <strong className="text-xl font-black text-rose-950">{countMissingDocs}</strong>
        </div>
      </div>

      {/* Filter & Search Ribbon */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Chemical Name, Master Code, Supplier Name..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="PENDING_REVIEW">PENDING REVIEW</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="INFORMATION_REQUIRED">INFORMATION REQUIRED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="FLAGGED">FLAGGED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Offerings Governance Queue Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Master Chemical</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Commercial Terms</th>
                <th className="px-4 py-3">Specs</th>
                <th className="px-4 py-3">Moderation & Verification</th>
                <th className="px-4 py-3 text-right">Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Loading Supplier Offerings Queue...</td>
                </tr>
              ) : filteredOfferings.length > 0 ? (
                filteredOfferings.map((off) => {
                  const modStatus = off.moderationStatus || "PENDING_REVIEW";
                  return (
                    <tr key={off.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <strong className="text-slate-900 font-bold block">{off.masterProductName}</strong>
                        <span className="font-mono text-[10px] text-slate-400 block">{off.masterProductCode}</span>
                        {off.casNumber && <span className="text-slate-500 font-mono text-[10px]">CAS: {off.casNumber}</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <strong className="text-slate-900 font-bold block">{off.supplierName}</strong>
                        <span className="text-[10px] text-slate-400">Supplier ID: #{off.supplierId}</span>
                      </td>
                      <td className="px-4 py-3.5 font-mono">
                        <strong className="text-slate-900 font-bold block">{off.currency} {off.price?.toLocaleString()} / kg</strong>
                        <span className="text-[10px] text-slate-500">Stock: {off.stock} kg | MOQ: {off.moqKg || "N/A"} kg</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="block font-bold text-slate-800">Purity: {off.purity ? `${off.purity}%` : "N/A"}</span>
                        <span className="text-[10px] text-slate-500 block">Grade: {off.grade || "N/A"}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          {off.coaAvailable && <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 text-[9px] font-extrabold rounded">COA</span>}
                          {off.msdsAvailable && <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 text-[9px] font-extrabold rounded">MSDS</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 space-y-1">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase inline-block ${
                          modStatus === "APPROVED" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                          modStatus === "UNDER_REVIEW" ? "bg-blue-50 text-blue-800 border border-blue-200" :
                          modStatus === "INFORMATION_REQUIRED" ? "bg-purple-50 text-purple-800 border border-purple-200" :
                          modStatus === "PENDING_REVIEW" ? "bg-amber-50 text-amber-800 border border-amber-200" :
                          modStatus === "FLAGGED" ? "bg-amber-100 text-amber-900 border border-amber-300" :
                          "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}>
                          {modStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/dashboard/admin/catalog/offerings/${off.id}`}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect Offering
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No Supplier Offerings found matching current governance criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
