import { FlaskConical, FileText, PhoneCall, ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";

export function ProductEmptyState() {
  return (
    <div className="w-full py-16 sm:py-20 flex flex-col items-center justify-center text-center bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-10 space-y-6">
      <div className="w-16 h-16 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex items-center justify-center">
        <FlaskConical className="w-8 h-8 text-[#94A3B8] stroke-1" />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h3 className="text-xl sm:text-2xl font-bold text-[#091E42]">
          No matching chemicals found
        </h3>
        <p className="text-sm text-[#64748B] leading-relaxed">
          No approved supplier offerings or master chemicals match your current filter criteria. You can reset filters or submit a custom sourcing inquiry.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-md pt-2">
        <Link
          href="/products"
          className="h-11 px-5 bg-white border border-[#CBD5E1] text-[#091E42] font-semibold text-sm rounded-xl hover:bg-[#F1F5F9] transition-all inline-flex items-center justify-center gap-2 shadow-2xs"
        >
          <RotateCcw className="w-4 h-4 text-[#64748B]" />
          <span>Reset Filters</span>
        </Link>
        <Link
          href="/rfq"
          className="h-11 px-6 bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold text-sm rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Submit Custom RFQ</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl w-full text-left pt-4 border-t border-[#E2E8F0]">
        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start gap-3">
          <FileText className="w-5 h-5 text-[#0052CC] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-[#091E42] mb-0.5">Upload Target Specifications</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Provide required purity, mesh size, or COA and we will match qualified manufacturers.
            </p>
          </div>
        </div>

        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start gap-3">
          <PhoneCall className="w-5 h-5 text-[#00875A] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-[#091E42] mb-0.5">Direct Sourcing Desk</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Our verified procurement team can locate custom synthesis or bulk chemical partners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
