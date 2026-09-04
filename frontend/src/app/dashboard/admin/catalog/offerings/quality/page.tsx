"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

interface OfferingQualityItem {
  id: string;
  masterProductCode: string;
  productName: string;
  supplierId: number;
  supplierName: string;
  unitPrice: number;
  currency: string;
  purityPercentage: number;
  grade: string;
  minimumOrderQuantity: number;
  packagingDescription: string;
  leadTimeDays: number;
  availabilityStatus: string;
  coaAvailable: boolean;
  msdsAvailable: boolean;
  exportReady: boolean;
  moderationStatus: string;
  completenessScore: number;
  verifiedDimensionsCount: number;
  issueCount: number;
  dimensionStatuses: Record<string, string>;
  lastUpdated: string;
}

export default function OfferingQualityPage() {
  const [items, setItems] = useState<OfferingQualityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuality() {
      try {
        const res = await authenticatedFetch("/api/v1/admin/operations/offerings/quality");
        if (res.ok) {
          const data = await res.json();
          setItems(data.content || []);
        }
      } catch (err) {
        console.error("Failed to load offering quality data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchQuality();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 text-[#0F172A] p-4 sm:p-6 pb-12">
      {/* 1. Calm Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#E4E4E7] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/admin/operations" className="inline-flex items-center gap-1 text-[11px] font-mono text-[#64748B] hover:text-[#0052CC] transition-colors">
              <ArrowLeft className="w-3 h-3" />
              <span>Operations</span>
            </Link>
            <span className="text-[#CBD5E1]">/</span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#0052CC]">
              Catalog Quality
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A]">
            Supplier Offering Quality
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-xl">
            Commercial completeness, document verification status, and moderation readiness across supplier listings.
          </p>
        </div>

        <div className="text-xs text-[#64748B] font-mono">
          <span>{items.length} {items.length === 1 ? "listing indexed" : "listings indexed"}</span>
        </div>
      </div>

      {/* 2. Horizontal Metric Band */}
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-4 shadow-xs">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] mb-3">
          Quality Overview
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E4E7]">
          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Total Offerings</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5">{items.length}</div>
          </div>
          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Approved</span>
            <div className="text-lg font-bold font-mono text-[#059669] mt-0.5">
              {items.filter(i => i.moderationStatus === "APPROVED").length}
            </div>
          </div>
          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Pending Review</span>
            <div className="text-lg font-bold font-mono text-[#D97706] mt-0.5">
              {items.filter(i => i.moderationStatus === "PENDING" || !i.moderationStatus).length}
            </div>
          </div>
          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Flagged</span>
            <div className="text-lg font-bold font-mono text-[#DC2626] mt-0.5">
              {items.filter(i => i.moderationStatus === "FLAGGED" || i.moderationStatus === "REJECTED").length}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#64748B] font-mono text-xs">
          Loading offering quality metrics...
        </div>
      ) : (
        <div className="bg-white rounded-[8px] border border-[#E4E4E7] shadow-xs overflow-hidden">
          <div className="p-3 border-b border-[#E4E4E7] flex items-center justify-between bg-[#FAFAFA]">
            <h2 className="text-xs font-semibold text-[#0F172A] flex items-center gap-2">
              <span>Offerings Ledger</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E4E4E7] text-[10px] font-mono font-semibold uppercase text-[#475569] tracking-wider">
                  <th className="py-2.5 px-4">Product / Supplier</th>
                  <th className="py-2.5 px-4">Commercial Terms</th>
                  <th className="py-2.5 px-4">Documents</th>
                  <th className="py-2.5 px-4">Completeness</th>
                  <th className="py-2.5 px-4">Moderation</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7] text-xs">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#0F172A]">{item.productName || "—"}</div>
                      <div className="text-[11px] text-[#64748B] font-medium">{item.supplierName || "—"}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#0F172A]">
                      <div>{typeof item.unitPrice === "number" ? `₹${item.unitPrice.toFixed(2)} / kg` : "—"}</div>
                      <div className="text-[#64748B] text-[11px]">MOQ: {item.minimumOrderQuantity ? `${item.minimumOrderQuantity} kg` : "—"}</div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className={item.coaAvailable ? "text-[#059669] font-medium" : "text-[#94A3B8]"}>COA</span>
                      <span className="text-[#E4E4E7] mx-1.5">|</span>
                      <span className={item.msdsAvailable ? "text-[#0052CC] font-medium" : "text-[#94A3B8]"}>MSDS</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#0F172A]">
                      {item.completenessScore ? `${item.completenessScore}%` : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[4px] bg-[#F4F4F5] text-[#334155] border border-[#E4E4E7] uppercase">
                        {item.moderationStatus || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/dashboard/admin/catalog/offerings/${item.id}`}
                        className="h-7 px-2.5 bg-white hover:bg-[#FAFAFA] text-[#0F172A] border border-[#E4E4E7] rounded-[4px] text-xs font-medium transition-colors inline-flex items-center gap-1 shadow-xs"
                      >
                        <span>Workspace</span>
                        <ChevronRight className="w-3 h-3 text-[#64748B]" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
