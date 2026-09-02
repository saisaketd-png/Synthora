"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, ChevronRight } from "lucide-react";

interface SupplierQualityItem {
  supplierId: number;
  companyName: string;
  businessType: string;
  verificationStatus: string;
  completenessScore: number;
  verificationProgress: number;
  missingEvidenceCount: number;
  flaggedEvidenceCount: number;
  expiredDocumentsCount: number;
  activeOfferings: number;
  pendingOfferings: number;
  flaggedOfferings: number;
  suspendedOfferings: number;
  lastActivity: string;
}

export default function SupplierQualityPage() {
  const [items, setItems] = useState<SupplierQualityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuality() {
      try {
        const token = localStorage.getItem("kemkendra_token") || localStorage.getItem("token");
        const res = await fetch("/api/v1/admin/operations/suppliers/quality", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data.content || []);
        }
      } catch (err) {
        console.error("Failed to load supplier quality data", err);
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
            Supplier Quality & Due Diligence Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Supplier credential completeness, verification progress, and commercial due-diligence status.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold animate-pulse">
          Loading supplier due-diligence profiles...
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Supplier Quality Directory ({items.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="py-3.5 px-6">Company</th>
                  <th className="py-3.5 px-6">Business Type</th>
                  <th className="py-3.5 px-6">Verification Status</th>
                  <th className="py-3.5 px-6">Completeness</th>
                  <th className="py-3.5 px-6">Active Offerings</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {items.map((item) => (
                  <tr key={item.supplierId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {item.companyName}
                    </td>
                    <td className="py-4 px-6 uppercase text-xs font-bold text-slate-600">
                      {item.businessType}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                        {item.verificationStatus}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-xs text-slate-800">
                      {item.completenessScore}%
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-xs text-slate-800">
                      {item.activeOfferings}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/dashboard/admin/suppliers/verification/${item.supplierId}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors"
                      >
                        Inspect Verification <ChevronRight className="w-3.5 h-3.5" />
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
