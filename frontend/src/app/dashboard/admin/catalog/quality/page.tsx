"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, FileText, ChevronRight } from "lucide-react";

interface QualityItem {
  id: string;
  masterProductCode: string;
  name: string;
  casNumber: string;
  category: string;
  qualityScore: number;
  status: string;
  issueCount: number;
  highestPriorityIssue: string;
  dimensionStatuses: Record<string, string>;
  lastUpdated: string;
}

export default function MasterCatalogQualityPage() {
  const [items, setItems] = useState<QualityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuality() {
      try {
        const token = localStorage.getItem("kemkendra_token") || localStorage.getItem("token");
        const res = await fetch("/api/v1/admin/operations/catalog/quality", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data.content || []);
        }
      } catch (err) {
        console.error("Failed to load catalog quality data", err);
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
            Master Catalog Quality Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Deterministic 12-dimension quality scoring and completeness audit for chemical master products.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold animate-pulse">
          Calculating catalog quality scores...
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Master Product Audit List ({items.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="py-3.5 px-6">Product</th>
                  <th className="py-3.5 px-6">CAS / Code</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Quality Score</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">
                      <div>CAS: {item.casNumber || "N/A"}</div>
                      <div className="text-slate-400 font-bold">{item.masterProductCode}</div>
                    </td>
                    <td className="py-4 px-6 uppercase text-xs font-bold text-blue-700">
                      {item.category?.replace("_", " ")}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              item.qualityScore >= 80 ? "bg-emerald-500" : item.qualityScore >= 50 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${item.qualityScore}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-800">
                          {item.qualityScore}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 uppercase">
                        {item.status === "ACTIVE" ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/dashboard/admin/catalog/master-products/${item.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
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
