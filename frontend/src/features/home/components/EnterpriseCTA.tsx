import Link from "next/link";
import { ArrowRight, FileCheck } from "lucide-react";

export function EnterpriseCTA() {
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-blue-600 to-[#0A192F] rounded-[3rem] p-12 sm:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-900/20">
          
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-teal-400 opacity-10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Ready to streamline your chemical sourcing?
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed max-w-2xl mx-auto">
              Join thousands of procurement teams worldwide. Source verified pharmaceutical ingredients directly from audited manufacturers.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link
                href="/products"
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-blue-600 hover:bg-slate-50 font-bold text-[15px] rounded-full transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/rfq"
                className="w-full sm:w-auto px-8 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-[15px] rounded-full transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <FileCheck className="w-4 h-4" />
                <span>Submit RFQ</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
