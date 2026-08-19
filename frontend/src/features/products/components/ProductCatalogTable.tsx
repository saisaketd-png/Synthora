"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Product } from "../types/product";
import { ShieldCheck, FlaskConical, ChevronRight, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { fetchProductSuppliers } from "@/lib/api";
import { ExpandableSupplierOfferingsDrawer, SupplierOffering } from "./ExpandableSupplierOfferingsDrawer";
import RfqModal from "../../rfq/components/RfqModal";

interface ProductCatalogTableProps {
  products: Product[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085";

export function ProductCatalogTable({ products }: ProductCatalogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [offeringsCache, setOfferingsCache] = useState<Record<string, SupplierOffering[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});
  const [selectedRfqOffering, setSelectedRfqOffering] = useState<{ offering: SupplierOffering; productName: string } | null>(null);

  const loadOfferingsForProduct = async (productCodeOrId: string) => {
    try {
      setLoadingMap((prev) => ({ ...prev, [productCodeOrId]: true }));
      setErrorMap((prev) => ({ ...prev, [productCodeOrId]: null }));
      const data = await fetchProductSuppliers(productCodeOrId);
      setOfferingsCache((prev) => ({ ...prev, [productCodeOrId]: data }));
    } catch (err: any) {
      setErrorMap((prev) => ({ ...prev, [productCodeOrId]: err.message || "Failed to load supplier availability" }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [productCodeOrId]: false }));
    }
  };

  const handleToggleExpand = (productCodeOrId: string) => {
    if (expandedId === productCodeOrId) {
      setExpandedId(null);
    } else {
      setExpandedId(productCodeOrId);
      if (!offeringsCache[productCodeOrId] && !loadingMap[productCodeOrId]) {
        loadOfferingsForProduct(productCodeOrId);
      }
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden flex flex-col">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="w-full text-left whitespace-nowrap border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
            <tr>
              <th scope="col" className="px-5 py-4 w-72">Chemical / Compound</th>
              <th scope="col" className="px-4 py-4">CAS Number</th>
              <th scope="col" className="px-4 py-4">Formula</th>
              <th scope="col" className="px-4 py-4">Category</th>
              <th scope="col" className="px-4 py-4 text-center">Verified Suppliers</th>
              <th scope="col" className="px-5 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
            {products.map((p) => {
              const codeOrId = p.productCode || p.id;
              const productUrl = `/products/${codeOrId}`;
              const offeringCount = (p as any).offeringCount || 0;
              const isExpanded = expandedId === codeOrId;

              return (
                <React.Fragment key={p.id}>
                  <tr className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                          {p.primaryImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`${API_URL}${p.primaryImageUrl}`}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FlaskConical className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 max-w-xs">
                          <Link
                            href={productUrl}
                            className="font-bold text-slate-900 hover:text-blue-600 truncate transition-colors text-sm"
                          >
                            {p.name}
                          </Link>
                          {p.productCode && (
                            <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit mt-0.5">
                              {p.productCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 font-mono text-slate-700 text-xs font-semibold">
                      {p.casNumber || "—"}
                    </td>

                    <td className="px-4 py-4 font-mono text-slate-600 text-xs font-medium">
                      {p.molecularFormula || "—"}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold uppercase">
                        {p.category ? p.category.replace("_", " ") : "GENERAL"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      {offeringCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleToggleExpand(codeOrId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full border border-emerald-200 cursor-pointer transition-colors shadow-2xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{offeringCount} {offeringCount === 1 ? "Verified Supplier ▾" : "Verified Suppliers ▾"}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Onboarding
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={productUrl}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                      >
                        View Product <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>

                  {/* Expanded Sub-row */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="p-0 border-b border-slate-200">
                        <ExpandableSupplierOfferingsDrawer
                          masterProductCode={codeOrId}
                          masterProductName={p.name}
                          offerings={offeringsCache[codeOrId] || []}
                          loading={!!loadingMap[codeOrId]}
                          error={errorMap[codeOrId] || null}
                          onRetry={() => loadOfferingsForProduct(codeOrId)}
                          onRequestQuote={(offering) => setSelectedRfqOffering({ offering, productName: p.name })}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked View */}
      <div className="md:hidden divide-y divide-slate-100">
        {products.map((p) => {
          const codeOrId = p.productCode || p.id;
          const productUrl = `/products/${codeOrId}`;
          const offeringCount = (p as any).offeringCount || 0;
          const isExpanded = expandedId === codeOrId;

          return (
            <div key={p.id} className="bg-white flex flex-col overflow-hidden">
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    <FlaskConical className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {p.category ? p.category.replace("_", " ") : "GENERAL"}
                      </span>
                      {p.productCode && (
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {p.productCode}
                        </span>
                      )}
                    </div>
                    <Link
                      href={productUrl}
                      className="font-bold text-slate-900 hover:text-blue-600 text-base leading-tight block truncate"
                    >
                      {p.name}
                    </Link>
                    <p className="font-mono text-xs text-slate-500 mt-1">
                      CAS: {p.casNumber || "N/A"} {p.molecularFormula ? `| ${p.molecularFormula}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  {offeringCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(codeOrId)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-800 font-extrabold rounded-xl border border-emerald-200 text-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{offeringCount} Verified Suppliers ▾</span>
                    </button>
                  ) : (
                    <span className="text-slate-400 text-xs italic">No suppliers available</span>
                  )}

                  <Link
                    href={productUrl}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-2xs flex items-center gap-1"
                  >
                    View Product <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Mobile Expanded Drawer */}
              {isExpanded && (
                <ExpandableSupplierOfferingsDrawer
                  masterProductCode={codeOrId}
                  masterProductName={p.name}
                  offerings={offeringsCache[codeOrId] || []}
                  loading={!!loadingMap[codeOrId]}
                  error={errorMap[codeOrId] || null}
                  onRetry={() => loadOfferingsForProduct(codeOrId)}
                  onRequestQuote={(offering) => setSelectedRfqOffering({ offering, productName: p.name })}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Target RFQ Modal */}
      {selectedRfqOffering && (
        <RfqModal
          isOpen={!!selectedRfqOffering}
          onClose={() => setSelectedRfqOffering(null)}
          masterProductId={selectedRfqOffering.offering.masterProductId}
          supplierOfferingId={selectedRfqOffering.offering.id}
          productName={selectedRfqOffering.productName}
          supplierId={selectedRfqOffering.offering.supplierId}
          supplierName={selectedRfqOffering.offering.supplierName}
          supplierCountry={selectedRfqOffering.offering.countryName || "India"}
          defaultQuantity={selectedRfqOffering.offering.moqKg}
        />
      )}
    </div>
  );
}
