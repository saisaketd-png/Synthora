"use client";

import Link from "next/link";
import { ProductSearchResponse, ProductSearchSupplier, Product } from "../types/product";
import { ShieldCheck, Flag, CheckCircle2, ChevronRight, Download, Beaker } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface ProductSupplierResultsProps {
  searchResponse: ProductSearchResponse;
}

export function ProductSupplierResults({ searchResponse }: ProductSupplierResultsProps) {
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  const product = searchResponse.product;
  const suppliers = searchResponse.suppliers || [];

  if (!product) return null;

  // Header stats
  const verifiedCount = suppliers.filter(s => s.verified).length;
  const countries = new Set(suppliers.map(s => s.countryName || s.countryCode));

  return (
    <div className="w-full flex-1">
      {/* Product Summary Header Card */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row md:justify-between md:items-start gap-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Product Image / Molecular Structure Area */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center p-2">
            <Beaker className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-[#0A192F] mb-2">{product.name}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
              <span className="font-mono text-sm text-slate-600">CAS: {product.casNumber || "—"}</span>
              {product.molecularFormula && (
                <>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="font-mono text-sm text-slate-600">{product.molecularFormula}</span>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded uppercase tracking-wider">
                {product.category}
              </span>
              {verifiedCount > 0 && (
                <span className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-100 text-xs font-bold rounded uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {verifiedCount} Verified Suppliers
                </span>
              )}
              {countries.size > 0 && (
                <span className="px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold rounded uppercase tracking-wider flex items-center gap-1">
                  <Flag className="w-3.5 h-3.5" />
                  {countries.size} Countries
                </span>
              )}
              {suppliers.some(s => s.exportReady) && (
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold rounded uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Export Ready
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3 shrink-0 w-full md:w-auto">
          {product.coaAvailable && (
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 transition-colors shadow-sm text-sm">
              <Download className="w-4 h-4" />
              Specs
            </button>
          )}
          <Link
            href={`/rfq?productId=${product.id}&${query}`}
            className="flex-1 md:flex-none flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors shadow-lg text-sm"
          >
            Submit RFQ
          </Link>
        </div>
      </div>

      {/* Supplier Comparison List */}
      <div className="space-y-4">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group flex flex-col md:flex-row gap-6">
            
            {/* Column 1: Supplier Info */}
            <div className="flex-1 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                  <span className="text-[17px] font-black text-slate-400 tracking-tighter select-none">
                    {supplier.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <Link href={`/suppliers/${supplier.id}`} className="font-bold text-[#0A192F] hover:text-blue-600 hover:underline text-[17px] leading-tight block mb-1">
                    {supplier.name}
                  </Link>
                  <div className="flex items-center gap-2 mb-2">
                    {supplier.verified && (
                      <span className="flex items-center gap-1 text-xs font-bold text-teal-600">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {supplier.verificationLevel || "Verified"}
                      </span>
                    )}
                    {supplier.yearsInBusiness && (
                      <>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="text-xs text-slate-500 font-medium">{supplier.yearsInBusiness} Yrs</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Flag className="w-4 h-4 text-slate-400" />
                    <span>{supplier.countryName || supplier.countryCode}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Technical Specs */}
            <div className="flex-[1.5] md:w-5/12 grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <span className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Purity / Grade</span>
                <div className="text-sm font-mono font-medium text-[#0A192F]">
                  {supplier.purity || "—"} {supplier.grade ? <span className="text-slate-400">({supplier.grade})</span> : ""}
                </div>
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">MOQ / Packaging</span>
                <div className="text-sm font-mono font-medium text-[#0A192F]">
                  {supplier.moq || "Contact"} {supplier.packaging ? <span className="text-slate-400">({supplier.packaging})</span> : ""}
                </div>
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Lead Time</span>
                <div className="text-sm font-medium text-slate-700">
                  {supplier.leadTime || "—"}
                </div>
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Response Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                    <div 
                      className={`h-full rounded-full ${supplier.responseRate && supplier.responseRate > 90 ? 'bg-green-500' : 'bg-orange-400'}`}
                      style={{ width: `${supplier.responseRate || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700">{supplier.responseRate || "—"}%</span>
                </div>
              </div>
            </div>

            {/* Column 3: Procurement Actions */}
            <div className="flex-1 md:w-1/4 flex flex-col justify-between items-start md:items-end md:pl-6 md:border-l border-slate-100 pt-4 md:pt-0">
              <div className="flex flex-wrap gap-1.5 mb-4 md:justify-end w-full">
                {supplier.exportReady && (
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-sm border border-slate-200">EXPORT</span>
                )}
                {supplier.coaAvailable && (
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-sm border border-blue-100">COA</span>
                )}
                {supplier.msdsAvailable && (
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-sm border border-slate-200">MSDS</span>
                )}
              </div>
              
              <div className="w-full flex flex-col gap-2">
                <Link
                  href={`/rfq?productId=${product.id}&supplierId=${supplier.id}&${query}`}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-white border border-slate-300 text-slate-800 text-[13px] font-bold rounded-full hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Request Quote
                </Link>
                <Link
                  href={`/suppliers/${supplier.id}`}
                  className="w-full flex items-center justify-center text-blue-600 text-[12px] font-bold hover:underline"
                >
                  View Profile <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
