"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, MapPin, FileCheck, ChevronRight, Building2, RefreshCw, AlertCircle, Loader2 } from "lucide-react";

export type SupplierOffering = {
  id: string;
  masterProductId: string;
  masterProductCode: string;
  masterProductName: string;
  supplierId: number;
  supplierName: string;
  price?: number;
  currency?: string;
  stock?: number;
  countryName?: string;
  verified?: boolean;
  purity?: string;
  grade?: string;
  moqKg?: number;
  packaging?: string;
  leadTimeDays?: number;
  coaAvailable?: boolean;
  msdsAvailable?: boolean;
  exportReady?: boolean;
  availabilityStatus?: string;
  moderationStatus?: string;
};

interface ExpandableSupplierOfferingsDrawerProps {
  masterProductCode: string;
  masterProductName: string;
  offerings: SupplierOffering[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onRequestQuote: (offering: SupplierOffering) => void;
}

export function ExpandableSupplierOfferingsDrawer({
  masterProductCode,
  offerings,
  loading,
  error,
  onRetry,
  onRequestQuote,
}: ExpandableSupplierOfferingsDrawerProps) {
  if (loading) {
    return (
      <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl animate-fadeIn">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 py-3 justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading supplier offerings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50/80 border-t border-rose-100 rounded-b-2xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-rose-800 font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Unable to load supplier availability.</span>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-rose-200 text-rose-700 font-bold rounded-lg hover:bg-rose-100/50 transition-colors shrink-0"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  if (!offerings || offerings.length === 0) {
    return (
      <div className="p-5 bg-slate-50 border-t border-slate-100 rounded-b-2xl text-center">
        <p className="text-xs font-bold text-slate-700">
          Supplier offerings are currently being onboarded.
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          No verified commercial suppliers are currently listed for this chemical compound.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/90 border-t border-slate-200/80 p-4 md:p-5 rounded-b-2xl space-y-3.5 animate-fadeIn overflow-hidden">
      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
        <span>Available Supplier Offerings ({offerings.length})</span>
        <span className="text-[10px] text-slate-400 font-normal">Verified Marketplace Listings</span>
      </div>

      <div className="space-y-3">
        {offerings.map((offering) => {
          const currencySymbol = offering.currency === "USD" ? "$" : offering.currency === "EUR" ? "€" : "₹";

          return (
            <div
              key={offering.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Column: Supplier Identity & Commercial specs */}
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-sm">
                    <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">{offering.supplierName}</span>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    VERIFIED
                  </span>

                  {offering.countryName && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {offering.countryName}
                    </span>
                  )}
                </div>

                {/* Key Spec Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Unit Price</span>
                    <span className="font-mono font-extrabold text-slate-900">
                      {offering.price ? `${currencySymbol}${offering.price.toLocaleString()}/kg` : "Quote"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Purity & Grade</span>
                    <span className="font-medium text-slate-800">
                      {offering.purity ? `${offering.purity}%` : "Standard"} {offering.grade ? `(${offering.grade})` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">MOQ</span>
                    <span className="font-medium text-slate-800">
                      {offering.moqKg ? `${offering.moqKg} kg` : "Contact"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Lead Time</span>
                    <span className="font-medium text-slate-800">
                      {offering.leadTimeDays ? `${offering.leadTimeDays} days` : "Immediate"}
                    </span>
                  </div>
                </div>

                {/* Badges Row */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {offering.coaAvailable && (
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-200 flex items-center gap-1">
                      <FileCheck className="w-3 h-3" /> COA ✓
                    </span>
                  )}
                  {offering.msdsAvailable && (
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded border border-slate-200 flex items-center gap-1">
                      <FileCheck className="w-3 h-3" /> MSDS ✓
                    </span>
                  )}
                  {offering.exportReady && (
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded border border-emerald-200">
                      Export Ready ✓
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <Link
                  href={`/products/${masterProductCode}`}
                  className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1 min-h-[38px]"
                >
                  View Offering <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => onRequestQuote(offering)}
                  className="px-3.5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-2xs min-h-[38px]"
                >
                  Request Quote
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
