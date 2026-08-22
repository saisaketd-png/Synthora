import Link from "next/link";
import { ShieldCheck, MapPin, Building2, Globe2, ChevronRight, Award, PackageCheck } from "lucide-react";
import { SupplierPublicProfile } from "@/features/suppliers/types";

export function SupplierCard({ supplier }: { supplier: SupplierPublicProfile }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 hover:border-[#CBD5E1] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
        
        {/* Left: Supplier Info */}
        <div className="flex-1 space-y-3.5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-1">
              {supplier.logoUrl ? (
                <img src={supplier.logoUrl} alt={supplier.name} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-7 h-7 text-[#94A3B8]" />
              )}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/suppliers/${supplier.id}`}
                  className="text-base font-bold text-[#0F172A] hover:text-[#155EEF] transition-colors"
                >
                  {supplier.name}
                </Link>
                {supplier.verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Supplier
                  </span>
                )}
                {supplier.exportReady && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF4FF] text-[#155EEF] border border-[#D1E0FF]">
                    <Globe2 className="w-3 h-3" />
                    Export Ready
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-xs text-[#64748B] flex-wrap font-medium">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>{supplier.countryName || supplier.countryCode || "Global"}</span>
                </div>
                {supplier.yearsInBusiness > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                    <span>{supplier.yearsInBusiness} Yrs in Business</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {supplier.aboutCompany && (
            <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed max-w-3xl">
              {supplier.aboutCompany}
            </p>
          )}
        </div>
        
        {/* Right: CTA & Verification Details */}
        <div className="shrink-0 flex flex-col items-end gap-3 border-t sm:border-t-0 sm:border-l border-[#E2E8F0] pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
          <Link
            href={`/suppliers/${supplier.id}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0B1F3A] hover:bg-[#07152A] rounded-xl transition-all shadow-2xs w-full sm:w-auto"
          >
            <span>View Supplier Profile</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          
          {supplier.responseRate !== null && supplier.responseRate !== undefined ? (
            <div className="text-[11px] text-[#64748B] text-center sm:text-right w-full space-y-0.5">
              <div>
                <span className="font-bold text-[#0F172A]">{supplier.responseRate}%</span> Response Rate
              </div>
              {supplier.formattedResponseTime && (
                <div className="text-[10px] text-[#64748B]">
                  Responds ~{supplier.formattedResponseTime}
                </div>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-[#94A3B8] text-center sm:text-right w-full font-medium">
              No response history yet
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
