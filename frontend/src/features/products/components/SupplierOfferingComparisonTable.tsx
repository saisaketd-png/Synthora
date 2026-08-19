"use client";

import Link from "next/link";
import { Building2, ShieldCheck, FileCheck2, Send, Check, X } from "lucide-react";
import { SupplierOffering, MasterProduct } from "@/features/supplier-products/api/masterCatalogApi";

interface SupplierOfferingComparisonTableProps {
  masterProduct: MasterProduct;
  offerings: SupplierOffering[];
}

export function SupplierOfferingComparisonTable({
  masterProduct,
  offerings,
}: SupplierOfferingComparisonTableProps) {
  if (!offerings || offerings.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
        <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
        <p className="text-sm font-bold text-slate-900">No Verified Suppliers Currently Listed</p>
        <p className="text-xs text-slate-500">
          Check back soon or submit a quotation request for this chemical compound.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* DESKTOP COMPARISON TABLE (lg and above) */}
      <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Supplier</th>
              <th className="py-3.5 px-4">Unit Price</th>
              <th className="py-3.5 px-4">MOQ</th>
              <th className="py-3.5 px-4">Purity</th>
              <th className="py-3.5 px-4">Grade</th>
              <th className="py-3.5 px-4">Lead Time</th>
              <th className="py-3.5 px-4">Compliance Docs</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {offerings.map((offering) => (
              <tr key={offering.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Supplier Name */}
                <td className="py-4 px-4 font-bold text-slate-900">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{offering.supplierName}</span>
                    <span title="Verified Supplier">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    </span>
                  </div>
                </td>

                {/* Price */}
                <td className="py-4 px-4 font-extrabold text-slate-900">
                  {offering.currency === "INR" ? "₹" : offering.currency + " "}
                  {offering.price.toLocaleString(undefined, { minimumFractionDigits: 2 })} / kg
                </td>

                {/* MOQ */}
                <td className="py-4 px-4">
                  {offering.moqKg ? `${offering.moqKg} kg` : "N/A"}
                </td>

                {/* Purity */}
                <td className="py-4 px-4">
                  {offering.purity ? (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-md">
                      {offering.purity}%
                    </span>
                  ) : "N/A"}
                </td>

                {/* Grade */}
                <td className="py-4 px-4 font-semibold text-slate-700">
                  {offering.grade || "Standard"}
                </td>

                {/* Lead Time */}
                <td className="py-4 px-4">
                  {offering.leadTimeDays ? `${offering.leadTimeDays} days` : "Immediate"}
                </td>

                {/* Compliance Docs */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase">
                    {offering.coaAvailable && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded" title="COA Available">COA</span>
                    )}
                    {offering.msdsAvailable && (
                      <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded" title="MSDS Available">MSDS</span>
                    )}
                    {offering.exportReady && (
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded" title="Export Ready">EXPORT</span>
                    )}
                  </div>
                </td>

                {/* Action */}
                <td className="py-4 px-4 text-right">
                  <Link
                    href={`/rfq?masterProductId=${masterProduct.id}&supplierOfferingId=${offering.id}&supplierId=${offering.supplierId}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Request Quote
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE STACKED COMPARISON CARDS (sm and md) */}
      <div className="block lg:hidden space-y-4">
        {offerings.map((offering) => (
          <div
            key={offering.id}
            className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-900 text-sm">{offering.supplierName}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-sm font-extrabold text-slate-900">
                {offering.currency === "INR" ? "₹" : offering.currency + " "}
                {offering.price.toLocaleString(undefined, { minimumFractionDigits: 2 })} / kg
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Purity</span>
                <strong className="text-slate-900 font-bold">{offering.purity ? `${offering.purity}%` : "N/A"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Grade</span>
                <strong className="text-slate-900 font-bold">{offering.grade || "Standard"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">MOQ</span>
                <strong className="text-slate-900 font-bold">{offering.moqKg ? `${offering.moqKg} kg` : "N/A"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Lead Time</span>
                <strong className="text-slate-900 font-bold">{offering.leadTimeDays ? `${offering.leadTimeDays} days` : "Immediate"}</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase">
                {offering.coaAvailable && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">COA</span>}
                {offering.msdsAvailable && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded">MSDS</span>}
              </div>

              <Link
                href={`/rfq?masterProductId=${masterProduct.id}&supplierOfferingId=${offering.id}&supplierId=${offering.supplierId}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Request Quote
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
