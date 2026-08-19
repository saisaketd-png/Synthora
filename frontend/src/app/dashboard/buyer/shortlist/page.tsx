"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Bookmark,
  Building2,
  ShieldCheck,
  Trash2,
  ArrowLeft,
  RefreshCw,
  Eye,
  FileCheck,
  Send,
  Star
} from "lucide-react";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import RfqModal from "@/features/rfq/components/RfqModal";

export default function BuyerShortlistPage() {
  const [shortlist, setShortlist] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rfqItem, setRfqItem] = useState<any | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadShortlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authenticatedFetch("/api/v1/buyer/shortlists");
      if (!res.ok) throw new Error("Failed to load buyer shortlist");
      const data = await res.json();
      setShortlist(data);
    } catch (e: any) {
      setError(e.message || "Failed to load buyer shortlist");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShortlist();
  }, [loadShortlist]);

  const handleRemoveItem = async (itemId: string) => {
    try {
      setRemovingId(itemId);
      const res = await authenticatedFetch(`/api/v1/buyer/shortlists/items/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove item from shortlist");
      await loadShortlist();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-xs font-bold text-slate-500">
        Loading Saved Sourcing Shortlist...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Bookmark className="w-7 h-7 text-amber-500 fill-amber-500" />
              BUYER SOURCING SHORTLIST ({shortlist?.totalItems || 0})
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Saved commercial offerings, side-by-side specification comparison, and direct RFQ sourcing desk.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadShortlist()}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Shortlist
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Shortlist Table / Grid */}
      {shortlist?.items && shortlist.items.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Master Chemical</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Price & Currency</th>
                  <th className="px-4 py-3">Purity & Grade</th>
                  <th className="px-4 py-3">MOQ & Lead</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {shortlist.items.map((item: any) => (
                  <tr key={item.itemId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <strong className="text-slate-900 font-extrabold text-sm block">{item.masterProductName}</strong>
                      <span className="font-mono text-[10px] text-slate-400 block">{item.masterProductCode}</span>
                      {item.casNumber && <span className="text-slate-500 font-mono text-[10px]">CAS: {item.casNumber}</span>}
                    </td>
                    <td className="px-4 py-4">
                      <strong className="text-slate-900 font-bold block">{item.supplierName}</strong>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[9px] font-black uppercase inline-block mt-0.5">
                        {item.supplierVerificationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-slate-900 text-sm">
                      {item.currency} {item.price?.toLocaleString()} / kg
                    </td>
                    <td className="px-4 py-4">
                      <strong className="text-slate-900 font-bold block">{item.purity ? `${item.purity}%` : "N/A"}</strong>
                      <span className="text-slate-500 text-[11px]">{item.grade || "Standard"}</span>
                    </td>
                    <td className="px-4 py-4">
                      <strong className="text-slate-900 font-bold block font-mono">{item.moqKg ? `${item.moqKg} kg` : "N/A"}</strong>
                      <span className="text-slate-500 text-[11px]">{item.leadTimeDays ? `${item.leadTimeDays} Days` : "Immediate"}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${item.masterProductCode || item.masterProductId}`}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                          title="View Product Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          disabled={removingId === item.itemId}
                          onClick={() => handleRemoveItem(item.itemId)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors"
                          title="Remove from shortlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRfqItem(item)}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-2xs"
                        >
                          Request Quote
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 space-y-4">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-base font-extrabold text-slate-900">YOUR SHORTLIST IS EMPTY</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              You have not saved any chemical offerings to your shortlist yet. Browse the Master Chemical Catalog and click the shortlist bookmark icon to save offerings for side-by-side procurement comparison.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            Browse Chemical Catalog
          </Link>
        </div>
      )}

      {rfqItem && (
        <RfqModal
          isOpen={!!rfqItem}
          onClose={() => setRfqItem(null)}
          masterProductId={rfqItem.masterProductId}
          supplierOfferingId={rfqItem.supplierOfferingId}
          productName={rfqItem.masterProductName}
          supplierId={rfqItem.supplierId}
          supplierName={rfqItem.supplierName}
          supplierCountry={"India"}
          defaultQuantity={rfqItem.moqKg}
        />
      )}
    </div>
  );
}
