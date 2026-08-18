"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, MapPin, FileCheck, ChevronRight, Building2, PackageOpen, Calendar, Activity } from "lucide-react";
import Link from "next/link";
import RfqModal from "../../rfq/components/RfqModal";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085";

export type ProductSupplier = {
  supplierId: number;
  supplierName: string;
  countryName: string;
  verified: boolean;
  yearsInBusiness: number;
  responseRate: number;
  exportReady: boolean;
  purity: string;
  grade: string;
  moqKg: number;
  packaging: string;
  leadTimeDays: number;
  coaAvailable: boolean;
  msdsAvailable: boolean;
};

export default function SupplierComparison({ productId, productName }: { productId: string, productName: string }) {
  const [suppliers, setSuppliers] = useState<ProductSupplier[]>([]);
  const [rfqSupplier, setRfqSupplier] = useState<ProductSupplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        setError(null);

       const res = await fetch(
         `${API_URL}/api/v1/products/${productId}/suppliers`,
         {
           cache: "no-store",
         }
       );
        if (!res.ok) {
          throw new Error("Failed to fetch suppliers");
        }
        const data = await res.json();
        setSuppliers(data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [productId]);

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Compare Suppliers</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-2xl p-6 md:p-8 h-48 w-full">
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12 bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl">
        <p className="font-semibold">Error loading suppliers</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!suppliers || suppliers.length === 0) {
    return (
      <div className="mt-12 bg-white border border-slate-200 p-8 rounded-2xl text-center shadow-sm">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-900">No Suppliers Found</h3>
        <p className="text-slate-500 mt-1">There are currently no suppliers listed for this product.</p>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Compare Suppliers</h2>
      <div className="space-y-6">
        {suppliers.map((supplier) => (
          <div key={supplier.supplierId} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Section: Supplier Info */}
              <div className="lg:col-span-4 flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  <Building2 className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 leading-tight">
                    {supplier.supplierName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    {supplier.verified && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="w-3 h-3" />
                      {supplier.countryName}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {supplier.yearsInBusiness} yrs
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Section: Commercial Info */}
              <div className="lg:col-span-4 grid grid-cols-2 gap-4 border-y lg:border-y-0 lg:border-x border-slate-100 py-4 lg:py-0 lg:px-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Purity / Grade</div>
                  <div className="text-base font-medium text-slate-900">{supplier.purity}</div>
                  <div className="text-sm text-slate-600">{supplier.grade}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">MOQ</div>
                  <div className="text-base font-medium text-slate-900">{supplier.moqKg} kg</div>
                  <div className="text-sm text-slate-600">{supplier.packaging}</div>
                </div>
                <div className="col-span-2 mt-2 flex items-center gap-2">
                  <PackageOpen className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">Lead time: <strong className="text-slate-900">{supplier.leadTimeDays} days</strong></span>
                </div>
              </div>

              {/* Right Section: Actions & Badges */}
              <div className="lg:col-span-4 flex flex-col justify-between h-full min-h-[120px]">
                <div className="flex flex-wrap gap-2">
                  {supplier.exportReady && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-600/10 px-2 py-1 rounded-sm">
                      Export Ready
                    </span>
                  )}
                  {supplier.coaAvailable && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-sm flex items-center gap-1">
                      <FileCheck className="w-3 h-3" /> COA
                    </span>
                  )}
                  {supplier.msdsAvailable && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-sm flex items-center gap-1">
                      <FileCheck className="w-3 h-3" /> MSDS
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col gap-1 mt-3 lg:mt-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Activity className="w-4 h-4 text-slate-400" />
                      Response Rate
                    </span>
                    <span className={`font-bold ${
                      supplier.responseRate >= 95 ? 'text-emerald-600' :
                      supplier.responseRate >= 85 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {supplier.responseRate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${
                        supplier.responseRate >= 95 ? 'bg-emerald-500' :
                        supplier.responseRate >= 85 ? 'bg-amber-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${supplier.responseRate}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 lg:mt-auto">
                  <button 
                    onClick={() => setRfqSupplier(supplier)}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold py-2.5 px-4 rounded-sm transition-colors text-sm text-center"
                  >
                    Request Quote
                  </button>
                  <Link href={`/suppliers/${supplier.supplierId}`} className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1 whitespace-nowrap">
                    View Profile <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              
            </div>
          </div>
        ))}
      </div>

      {rfqSupplier && (
        <RfqModal
          isOpen={!!rfqSupplier}
          onClose={() => setRfqSupplier(null)}
          productId={productId}
          productName={productName}
          supplierId={rfqSupplier.supplierId}
          supplierName={rfqSupplier.supplierName}
          supplierCountry={rfqSupplier.countryName}
          defaultQuantity={rfqSupplier.moqKg}
        />
      )}
    </div>
  );
}
