"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, ChevronUp, ShieldCheck, AlertCircle } from "lucide-react";
import { MasterProduct } from "@/features/supplier-products/api/masterCatalogApi";
import { fetchProductSuppliers } from "@/lib/api";
import { ExpandableSupplierOfferingsDrawer, SupplierOffering } from "./ExpandableSupplierOfferingsDrawer";
import RfqModal from "../../rfq/components/RfqModal";

interface MasterProductCardProps {
  product: MasterProduct;
}

export function MasterProductCard({ product }: MasterProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [offerings, setOfferings] = useState<SupplierOffering[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRfqOffering, setSelectedRfqOffering] = useState<SupplierOffering | null>(null);

  const loadOfferings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProductSuppliers(product.masterProductCode || product.id);
      setOfferings(data);
    } catch (err: any) {
      setError(err.message || "Failed to load supplier availability");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);

    if (nextState && offerings === null && !loading) {
      loadOfferings();
    }
  };

  const offeringCount = product.offeringCount || 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group overflow-hidden">
      <div className="p-5 md:p-6 space-y-4">
        {/* Category & Master Code */}
        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-extrabold rounded-md uppercase tracking-wider">
            {product.category ? product.category.replace("_", " ") : "GENERAL"}
          </span>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {product.masterProductCode}
          </span>
        </div>

        {/* Chemical Name */}
        <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
          <Link href={`/products/${product.masterProductCode}`}>
            {product.name}
          </Link>
        </h3>

        {/* CAS & Formula */}
        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
          <span>CAS: <strong className="text-slate-800 font-semibold">{product.casNumber || "N/A"}</strong></span>
          {product.molecularFormula && (
            <span>Formula: <strong className="text-slate-800 font-semibold">{product.molecularFormula}</strong></span>
          )}
        </div>

        {/* Description snippet */}
        {product.description && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Interactive Supplier Availability Control */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          {offeringCount > 0 ? (
            <button
              type="button"
              onClick={handleToggleExpand}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-800 text-xs font-extrabold rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-2xs"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {offeringCount} {offeringCount === 1 ? "Verified Supplier Available" : "Verified Suppliers Available"}
              </span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 text-xs font-bold rounded-xl border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Supplier offerings are currently being onboarded</span>
            </span>
          )}

          <Link
            href={`/products/${product.masterProductCode}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 shrink-0"
          >
            <span>View Product</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Expanded Supplier Availability Section */}
      {isExpanded && (
        <ExpandableSupplierOfferingsDrawer
          masterProductCode={product.masterProductCode}
          masterProductName={product.name}
          offerings={offerings || []}
          loading={loading}
          error={error}
          onRetry={loadOfferings}
          onRequestQuote={(offering) => setSelectedRfqOffering(offering)}
        />
      )}

      {/* Zero-Trust Targeted RFQ Modal */}
      {selectedRfqOffering && (
        <RfqModal
          isOpen={!!selectedRfqOffering}
          onClose={() => setSelectedRfqOffering(null)}
          masterProductId={selectedRfqOffering.masterProductId}
          supplierOfferingId={selectedRfqOffering.id}
          productName={product.name}
          supplierId={selectedRfqOffering.supplierId}
          supplierName={selectedRfqOffering.supplierName}
          supplierCountry={selectedRfqOffering.countryName || "India"}
          defaultQuantity={selectedRfqOffering.moqKg}
        />
      )}
    </div>
  );
}
