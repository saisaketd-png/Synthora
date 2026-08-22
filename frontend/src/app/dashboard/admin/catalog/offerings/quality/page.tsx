"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";

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
        const token = localStorage.getItem("token");
        const res = await fetch("/api/v1/admin/operations/offerings/quality", {
          headers: { Authorization: `Bearer ${token}` }
        });
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
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link href="/dashboard/admin/operations" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Operations
          </Link>
          <h1 className="text-3xl font-extrabold text-[#0A192F] tracking-tight">
            Supplier Offering Quality Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            15-dimension commercial completeness and moderation quality analysis.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold animate-pulse">
          Calculating 15-dimension offering quality scores...
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Supplier Offering Quality List ({items.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="py-3.5 px-6">Product / Supplier</th>
                  <th className="py-3.5 px-6">Commercial Details</th>
                  <th className="py-3.5 px-6">Docs</th>
                  <th className="py-3.5 px-6">Completeness Score</th>
                  <th className="py-3.5 px-6">Moderation Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-xs text-slate-500 font-medium">{item.supplierName}</div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-700">
                      <div>${item.unitPrice ? item.unitPrice.toFixed(2) : "N/A"} / kg ({item.currency})</div>
                      <div className="text-slate-400 font-bold">MOQ: {item.minimumOrderQuantity || "N/A"} kg</div>
                    </td>
                    <td className="py-4 px-6 text-xs font-bold">
                      <span className={item.coaAvailable ? "text-emerald-600" : "text-slate-400"}>COA </span>|{" "}
                      <span className={item.msdsAvailable ? "text-blue-600" : "text-slate-400"}>MSDS</span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-xs text-slate-800">
                      {item.completenessScore}% ({item.verifiedDimensionsCount}/15)
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 uppercase">
                        {item.moderationStatus}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/dashboard/admin/catalog/offerings/${item.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Governance Workspace <ChevronRight className="w-3.5 h-3.5" />
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
