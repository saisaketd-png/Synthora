"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Edit, Trash2, AlertCircle, Eye, FileText, Image as ImageIcon, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import { getMySupplierOfferings, deactivateSupplierOffering, SupplierOffering } from "@/features/supplier-products/api/masterCatalogApi";
import { SectionHeader } from "@/shared/components/SectionHeader";

export default function SupplierProductsPage() {
  const searchParams = useSearchParams();
  const [offerings, setOfferings] = useState<SupplierOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOfferings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const offeringsData = await getMySupplierOfferings();
      setOfferings(offeringsData);
    } catch (err: any) {
      setError(err.message || "Failed to load supplier offerings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  const handleDeactivate = async (id: string) => {
    if (!window.confirm("Deactivate this commercial offering?\n\nIt will be hidden from the public chemical catalog.")) {
      return;
    }
    try {
      setActionLoading(id);
      await deactivateSupplierOffering(id);
      await loadOfferings();
    } catch (err: any) {
      alert("Failed to deactivate offering: " + (err.message || "Unknown error"));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <SectionHeader
            title="Product Inventory & Offerings"
            subtitle="Manage your active commercial chemical offerings, pricing, stock, and catalog listings"
          />
        </div>
        <Link
          href="/dashboard/supplier/products/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Chemical Offering
        </Link>
      </div>

      {error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      ) : loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : offerings.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {offerings.map((off) => {
              const modStatus = off.moderationStatus || "PENDING_REVIEW";
              const isApproved = modStatus === "APPROVED";
              const isPending = modStatus === "PENDING_REVIEW";
              const isFlagged = modStatus === "FLAGGED";

              return (
                <div
                  key={off.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-lg font-extrabold text-slate-900">{off.masterProductName}</strong>
                        <span className="px-2.5 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-bold rounded-lg uppercase">
                          {off.masterProductCode}
                        </span>
                        {off.category && (
                          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-extrabold rounded-lg uppercase">
                            {off.category.replace("_", " ")}
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase flex items-center gap-1 ${
                          isApproved ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                          isPending ? "bg-amber-50 text-amber-800 border border-amber-200" :
                          isFlagged ? "bg-purple-50 text-purple-800 border border-purple-200" :
                          "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}>
                          {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                          Catalog Status: {modStatus.replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        CAS Number: <strong className="text-slate-700">{off.casNumber || "N/A"}</strong>
                        {off.molecularFormula && (
                          <span className="ml-4">Formula: <strong className="text-slate-700">{off.molecularFormula}</strong></span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xl font-extrabold text-slate-900 font-mono">
                        {off.currency} {off.price?.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ kg</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${off.stock > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {off.stock > 0 ? `In Stock (${off.stock} kg)` : "Out of Stock"}
                      </span>
                    </div>
                  </div>

                  {/* Commercial Specifications Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Purity</span>
                      <strong className="text-slate-900">{off.purity ? `${off.purity}%` : "N/A"}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Grade</span>
                      <strong className="text-slate-900">{off.grade || "N/A"}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">MOQ</span>
                      <strong className="text-slate-900">{off.moqKg ? `${off.moqKg} kg` : "N/A"}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Lead Time</span>
                      <strong className="text-slate-900">{off.leadTimeDays ? `${off.leadTimeDays} Days` : "N/A"}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">COA Status</span>
                      <strong className={off.coaAvailable ? "text-emerald-700" : "text-slate-400"}>
                        {off.coaAvailable ? "Available" : "Not Provided"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">MSDS Status</span>
                      <strong className={off.msdsAvailable ? "text-emerald-700" : "text-slate-400"}>
                        {off.msdsAvailable ? "Available" : "Not Provided"}
                      </strong>
                    </div>
                  </div>

                  {off.moderationNotes && (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                      <strong className="font-bold block">Governance Note:</strong>
                      <span>{off.moderationNotes}</span>
                    </div>
                  )}

                  {/* Role-Correct Action Controls */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs font-bold">
                    <Link
                      href={`/products/${off.masterProductId}`}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Public Listing
                    </Link>
                    <Link
                      href={`/dashboard/supplier/products/${off.id}`}
                      className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors inline-flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Offering
                    </Link>
                    <button
                      type="button"
                      disabled={actionLoading === off.id}
                      onClick={() => handleDeactivate(off.id)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Deactivate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 space-y-4">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-base font-extrabold text-slate-900">NO CHEMICAL OFFERINGS LISTED</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              You have not listed any commercial offerings on Synthora&apos;s Master Catalog yet. Attach an offering to start receiving buyer RFQs.
            </p>
          </div>
          <Link
            href="/dashboard/supplier/products/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Your First Offering
          </Link>
        </div>
      )}
    </div>
  );
}
