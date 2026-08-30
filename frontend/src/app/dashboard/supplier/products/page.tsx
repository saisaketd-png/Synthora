"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  Package,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Search,
  FlaskConical,
  Layers,
  ArrowRight,
  MoreVertical,
  AlertCircle,
  FileText,
  Clock,
  Boxes,
  Check,
} from "lucide-react";
import {
  getMySupplierOfferings,
  deactivateSupplierOffering,
  SupplierOffering,
} from "@/features/supplier-products/api/masterCatalogApi";
import { StatusBadge, Modal } from "@/shared/components/ui/SynthoraUI";
import { useToast } from "@/shared/context/ToastContext";

type StatusFilter = "ALL" | "APPROVED" | "PENDING_REVIEW" | "REJECTED";
type SortOption = "DATE_DESC" | "DATE_ASC" | "PRICE_DESC" | "PRICE_ASC" | "STOCK_DESC";

export default function SupplierProductsPage() {
  const toast = useToast();
  const [offerings, setOfferings] = useState<SupplierOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("DATE_DESC");

  const loadOfferings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const offeringsData = await getMySupplierOfferings();
      setOfferings(offeringsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load supplier offerings. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  // Close overflow menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const confirmDeactivate = async () => {
    if (!deactivateId) return;
    try {
      setActionLoading(deactivateId);
      await deactivateSupplierOffering(deactivateId);
      toast.success("Commercial offering deactivated successfully");
      setDeactivateId(null);
      await loadOfferings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to deactivate offering: " + msg);
    } finally {
      setActionLoading(null);
    }
  };

  // Metrics calculation
  const totalCount = offerings.length;
  const approvedCount = useMemo(
    () => offerings.filter((o) => (o.moderationStatus || "APPROVED") === "APPROVED").length,
    [offerings]
  );
  const pendingCount = useMemo(
    () => offerings.filter((o) => o.moderationStatus === "PENDING_REVIEW").length,
    [offerings]
  );
  const activeOfferingsCount = useMemo(
    () => offerings.filter((o) => o.availabilityStatus === "AVAILABLE" || o.availabilityStatus === "ACTIVE").length,
    [offerings]
  );

  // Filtered & Sorted list
  const filteredOfferings = useMemo(() => {
    return offerings
      .filter((off) => {
        const modStatus = off.moderationStatus || "APPROVED";
        if (statusFilter !== "ALL" && modStatus !== statusFilter) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = (off.masterProductName || "").toLowerCase().includes(q);
          const matchesCode = (off.masterProductCode || "").toLowerCase().includes(q);
          const matchesCas = (off.casNumber || "").toLowerCase().includes(q);
          const matchesFormula = (off.molecularFormula || "").toLowerCase().includes(q);
          const matchesCategory = (off.category || "").toLowerCase().includes(q);
          return matchesName || matchesCode || matchesCas || matchesFormula || matchesCategory;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "DATE_DESC") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === "DATE_ASC") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === "PRICE_DESC") return b.price - a.price;
        if (sortBy === "PRICE_ASC") return a.price - b.price;
        if (sortBy === "STOCK_DESC") return b.stock - a.stock;
        return 0;
      });
  }, [offerings, statusFilter, searchQuery, sortBy]);

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 pb-20">
      {/* ======================================================================= */}
      {/* 1. PAGE HEADER                                                          */}
      {/* ======================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[#DFE1E6] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#0052CC] bg-[#DEEBFF] px-2.5 py-0.5 rounded">
              COMMERCIAL CATALOG
            </span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#091E42] tracking-tight mt-1">
            PRODUCT OFFERINGS
          </h1>
          <p className="text-sm text-[#526581] mt-1 leading-normal">
            Manage the chemicals you supply, commercial terms, quality specifications, and compliance documentation.
          </p>

          {/* Subtle Summary Direct Indicator */}
          {!loading && (
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#5E6C84] mt-2.5">
              <span className="text-[#091E42]">
                <strong>{totalCount}</strong> Total {totalCount === 1 ? "Offering" : "Offerings"}
              </span>
              <span>•</span>
              <span className="text-[#00875A]">
                <strong>{approvedCount}</strong> Approved
              </span>
              <span>•</span>
              <span className="text-[#0052CC]">
                <strong>{activeOfferingsCount}</strong> Active
              </span>
              {pendingCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-[#B35C00]">
                    <strong>{pendingCount}</strong> Pending Review
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Primary Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadOfferings}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#091E42] bg-white border border-[#DFE1E6] hover:bg-[#FAFBFC] rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/dashboard/supplier/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#0052CC] hover:bg-[#0747A6] rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Chemical Offering</span>
          </Link>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 2. REFINED SEARCH & FILTER TOOLBAR                                      */}
      {/* ======================================================================= */}
      <div className="bg-white border border-[#DFE1E6] rounded-xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-[#5E6C84] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by chemical name, CAS, product code..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAFBFC] focus:bg-white border border-[#DFE1E6] rounded-lg focus:outline-none focus:border-[#0052CC] placeholder:text-[#5E6C84] transition-all text-[#091E42]"
          />
        </div>

        {/* Right: Segmented Status Filter + Sort */}
        <div className="flex items-center gap-2.5 overflow-x-auto">
          {/* Status filter segmented control */}
          <div className="inline-flex items-center p-0.5 bg-[#EBECF0]/70 rounded-lg border border-[#DFE1E6] text-xs font-semibold">
            {(["ALL", "APPROVED", "PENDING_REVIEW", "REJECTED"] as StatusFilter[]).map((f) => {
              const isActive = statusFilter === f;
              const label =
                f === "ALL"
                  ? "All"
                  : f === "APPROVED"
                  ? "Approved"
                  : f === "PENDING_REVIEW"
                  ? "Pending"
                  : "Rejected";

              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 text-xs rounded-md transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-[#0052CC] font-bold shadow-xs border border-[#DFE1E6]/80"
                      : "text-[#5E6C84] hover:text-[#091E42]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-xs bg-white border border-[#DFE1E6] rounded-lg px-3 py-1.5 font-medium text-[#091E42] focus:outline-none focus:border-[#0052CC] shadow-2xs cursor-pointer"
          >
            <option value="DATE_DESC">Newest First</option>
            <option value="DATE_ASC">Oldest First</option>
            <option value="PRICE_DESC">Highest Price</option>
            <option value="PRICE_ASC">Lowest Price</option>
            <option value="STOCK_DESC">Highest Stock</option>
          </select>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 3. CATALOG WORKSPACE LIST                                               */}
      {/* ======================================================================= */}
      {error ? (
        <div className="bg-white border border-rose-200 rounded-2xl p-10 text-center shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[#091E42]">Unable to load commercial offerings</h3>
          <p className="text-xs text-[#5E6C84] max-w-md mx-auto">{error}</p>
          <button
            type="button"
            onClick={loadOfferings}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#091E42] bg-white border border-[#DFE1E6] rounded-lg hover:bg-[#FAFBFC] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-[#DFE1E6] rounded-2xl p-6 shadow-2xs animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 bg-[#EBECF0] rounded w-1/4" />
                <div className="h-5 bg-[#EBECF0] rounded w-20" />
              </div>
              <div className="h-4 bg-[#F4F5F7] rounded w-1/3" />
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#DFE1E6]">
                <div className="h-10 bg-[#F4F5F7] rounded" />
                <div className="h-10 bg-[#F4F5F7] rounded" />
                <div className="h-10 bg-[#F4F5F7] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredOfferings.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-[#DFE1E6] rounded-2xl p-12 sm:p-16 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-[#FAFBFC] flex items-center justify-center mx-auto mb-3.5 text-[#64748B] border border-[#DFE1E6]">
            <Package className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#091E42]">
            {searchQuery || statusFilter !== "ALL"
              ? "No matching chemical offerings"
              : "No product offerings listed yet"}
          </h2>
          <p className="text-xs sm:text-sm text-[#5E6C84] mt-1 max-w-md mx-auto">
            {searchQuery || statusFilter !== "ALL"
              ? "Try adjusting your search query or status filter to find existing offerings."
              : "Add your first chemical offering to make it available for commercial sourcing and RFQ matching."}
          </p>

          <div className="pt-5">
            {searchQuery || statusFilter !== "ALL" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0052CC] bg-white border border-[#DFE1E6] rounded-lg hover:bg-[#FAFBFC] transition-colors cursor-pointer"
              >
                <span>Clear Filters</span>
              </button>
            ) : (
              <Link
                href="/dashboard/supplier/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0052CC] hover:bg-[#0747A6] rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Chemical Offering</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        /* List of Offering Cards */
        <div className="space-y-4">
          {filteredOfferings.map((off) => {
            const modStatus = off.moderationStatus || "APPROVED";
            const currencySymbol = off.currency === "USD" ? "$" : off.currency === "EUR" ? "€" : off.currency === "INR" ? "₹" : `${off.currency || "INR"} `;

            return (
              <div
                key={off.id}
                className="bg-white border border-[#DFE1E6] hover:border-[#B3D4FF] rounded-2xl p-5 sm:p-6 shadow-2xs transition-all space-y-4 relative group"
              >
                {/* 1. TOP BAR: Canonical Chemical Identity + Status */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#DFE1E6] pb-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-bold text-[#091E42] tracking-tight">
                        {off.masterProductName}
                      </h2>
                      <span className="px-2 py-0.5 bg-[#091E42] text-white font-mono text-[10px] font-bold rounded">
                        {off.masterProductCode}
                      </span>
                      {off.category && (
                        <span className="px-2 py-0.5 bg-[#DEEBFF] text-[#0747A6] font-mono text-[10px] font-bold rounded uppercase">
                          {off.category.replace("_", " ")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-[#5E6C84]">
                      <span>
                        CAS: <strong className="text-[#172B4D]">{off.casNumber || "N/A"}</strong>
                      </span>
                      {off.molecularFormula && (
                        <>
                          <span>•</span>
                          <span>
                            Formula: <strong className="text-[#172B4D]">{off.molecularFormula}</strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status & Provenance Badges */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                    {off.createdByRole === "ADMIN" ? (
                      <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Listed by KemKendra Admin
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg">
                        🏢 Self-Listed
                      </span>
                    )}
                    <StatusBadge status={modStatus} size="md" />
                  </div>
                </div>

                {/* 2. CORE INFORMATION GRIDS: Commercial Terms, Quality, Compliance */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
                  {/* Column 1: Commercial Terms (5 Cols) */}
                  <div className="md:col-span-4 p-4 bg-[#FAFBFC] rounded-xl border border-[#DFE1E6] space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block font-mono">
                      Commercial Terms
                    </span>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg sm:text-xl font-bold font-mono text-[#091E42]">
                        {off.price > 0 ? `${currencySymbol}${off.price.toFixed(2)}` : "Inquiry Only"}
                      </span>
                      <span className="text-xs text-[#5E6C84] font-medium">per kg</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#DFE1E6]/80 text-[11px]">
                      <div>
                        <span className="text-[#64748B] block">MOQ:</span>
                        <strong className="text-[#091E42] font-mono">
                          {off.moqKg ? `${off.moqKg.toLocaleString()} kg` : "Flexible"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#64748B] block">Available Stock:</span>
                        <strong className="text-[#00875A] font-mono">
                          {off.stock ? `${off.stock.toLocaleString()} kg` : "Made to Order"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Quality & Specifications (4 Cols) */}
                  <div className="md:col-span-4 p-4 bg-[#FAFBFC] rounded-xl border border-[#DFE1E6] space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block font-mono">
                      Quality & Specifications
                    </span>

                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[#64748B]">Assay Purity:</span>
                        <strong className="text-[#091E42] font-mono">
                          {off.purity ? `${off.purity}% Purity` : "Standard Assay"}
                        </strong>
                      </div>

                      <div className="flex justify-between items-baseline">
                        <span className="text-[#64748B]">Pharmacopoeia:</span>
                        <strong className="text-[#091E42] truncate max-w-[140px]">
                          {off.grade || "Standard Industrial"}
                        </strong>
                      </div>

                      <div className="flex justify-between items-baseline">
                        <span className="text-[#64748B]">Lead Time:</span>
                        <strong className="text-[#091E42] font-mono">
                          {off.leadTimeDays ? `${off.leadTimeDays} Days` : "Standard SLA"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Compliance & Documents (4 Cols) */}
                  <div className="md:col-span-4 p-4 bg-[#FAFBFC] rounded-xl border border-[#DFE1E6] space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block font-mono">
                      Compliance & Documents
                    </span>

                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        {off.coaAvailable ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006644] bg-[#E3FCEF] border border-[#ABF5D1] px-2 py-0.5 rounded">
                            <Check className="w-3 h-3 text-[#00875A]" />
                            COA Available
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#64748B]">COA: On Request</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {off.msdsAvailable ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0747A6] bg-[#DEEBFF] border border-[#B3D4FF] px-2 py-0.5 rounded">
                            <Check className="w-3 h-3 text-[#0052CC]" />
                            MSDS / SDS Verified
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#64748B]">MSDS: Standard</span>
                        )}
                      </div>

                      {off.exportReady && (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006644] bg-[#E3FCEF] border border-[#ABF5D1] px-2 py-0.5 rounded">
                            <Check className="w-3 h-3 text-[#00875A]" />
                            Export Ready
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. BOTTOM ACTIONS ROW */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#DFE1E6]/70">
                  <div className="text-[11px] text-[#5E6C84] font-mono">
                    Updated: {new Date(off.updatedAt || off.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Public Marketplace View */}
                    <Link
                      href={`/products/${off.masterProductCode}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAFBFC] border border-[#DFE1E6] text-[#091E42] text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                      title="View public catalog page"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#5E6C84]" />
                      <span>View</span>
                    </Link>

                    {/* Edit Offering */}
                    <Link
                      href={`/dashboard/supplier/products/${off.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#DEEBFF]/30 border border-[#0052CC] text-[#0052CC] text-xs font-bold rounded-lg shadow-2xs transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#0052CC]" />
                      <span>Edit</span>
                    </Link>

                    {/* Overflow / Deactivate Button */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === off.id ? null : off.id)}
                        className="p-1.5 rounded-lg border border-[#DFE1E6] bg-white hover:bg-[#FAFBFC] text-[#5E6C84] hover:text-[#091E42] transition-colors cursor-pointer shadow-2xs"
                        title="More options"
                        aria-label="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === off.id && (
                        <div className="absolute right-0 bottom-full mb-1.5 w-48 bg-white border border-[#DFE1E6] rounded-xl shadow-lg p-1 z-30 text-xs animate-in fade-in zoom-in-95 duration-100">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setDeactivateId(off.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors text-left cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Deactivate Offering</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================================= */}
      {/* 4. DEACTIVATE CONFIRMATION MODAL                                        */}
      {/* ======================================================================= */}
      <Modal
        isOpen={Boolean(deactivateId)}
        onClose={() => setDeactivateId(null)}
        title="Deactivate Chemical Offering"
        description="Are you sure you want to deactivate this chemical offering? It will immediately be hidden from the public marketplace and buyer sourcing results."
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setDeactivateId(null)}
              className="px-4 py-2 text-xs font-bold text-[#091E42] bg-white border border-[#DFE1E6] hover:bg-[#FAFBFC] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={Boolean(actionLoading)}
              onClick={confirmDeactivate}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? "Deactivating..." : "Confirm Deactivation"}
            </button>
          </div>
        }
      >
        <p className="text-xs text-[#5E6C84] leading-relaxed">
          You can update specifications or re-publish this chemical offering at any time from your catalog desk.
        </p>
      </Modal>
    </div>
  );
}
