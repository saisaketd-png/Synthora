import Link from "next/link";
import { ShieldCheck, MapPin, Building2, Globe2, ChevronRight } from "lucide-react";
import { SupplierPublicProfile } from "@/features/suppliers/types";

export function SupplierCard({ supplier }: { supplier: SupplierPublicProfile }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        
        <div className="flex-1 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
              {supplier.logoUrl ? (
                <img src={supplier.logoUrl} alt={supplier.name} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-6 h-6 text-slate-400" />
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{supplier.name}</h3>
                {supplier.verified && (
                  <span title="Verified Supplier" className="flex items-center">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{supplier.countryName || supplier.countryCode || "Unknown Location"}</span>
                </div>
                {supplier.yearsInBusiness > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span>{supplier.yearsInBusiness} yrs business</span>
                  </div>
                )}
                {supplier.exportReady && (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>Export Ready</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {supplier.aboutCompany && (
            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed max-w-3xl">
              {supplier.aboutCompany}
            </p>
          )}
        </div>
        
        <div className="shrink-0 flex flex-col items-end gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
          <Link
            href={`/suppliers/${supplier.id}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors w-full sm:w-auto"
          >
            View Supplier
            <ChevronRight className="w-4 h-4" />
          </Link>
          
          {supplier.responseRate && (
            <div className="text-xs text-slate-500 text-center sm:text-right w-full">
              <span className="font-medium text-slate-700">{supplier.responseRate}%</span> response rate
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
