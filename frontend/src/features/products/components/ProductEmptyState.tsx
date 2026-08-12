import { FlaskConical, FileText, PhoneCall } from "lucide-react";
import Link from "next/link";

export function ProductEmptyState() {
  return (
    <div className="w-full py-24 flex flex-col items-center justify-center text-center bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
        <FlaskConical className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-[#0A192F] mb-2">
        No suppliers found
      </h3>
      <p className="text-[15px] text-slate-500 max-w-md mx-auto mb-8">
        We couldn't find any suppliers matching your exact search criteria. However, our procurement desk can source this for you.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 w-full max-w-lg px-4">
        <Link
          href="/products"
          className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 transition-colors shadow-sm"
        >
          Clear Search
        </Link>
        <Link
          href="/rfq"
          className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors shadow-lg"
        >
          Submit Custom RFQ
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl px-4 w-full text-left">
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-3">
          <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[13px] font-bold text-slate-700 mb-1">Upload specification / COA</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Provide your required specs and we'll match you with qualified manufacturers.</p>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-3">
          <PhoneCall className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[13px] font-bold text-slate-700 mb-1">Request custom sourcing</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Let our global procurement desk find reliable suppliers for your custom requirements.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
