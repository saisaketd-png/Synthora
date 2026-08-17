import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#0F3D91] via-[#0F3D91] to-[#17B5AE] rounded-3xl p-8 sm:p-12 md:p-16 text-white text-center shadow-xl relative overflow-hidden">
          {/* Background Decorative Graphic */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm border border-white/20">
              <ShieldCheck className="w-4 h-4 text-[#17B5AE]" />
              <span>Join 1,200+ Audited Manufacturers</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Start Sourcing with Verified Global Chemical Suppliers
            </h2>

            <p className="text-slate-200 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Accelerate your chemical procurement timeline. Get instant quotes, sample shipments, and compliant regulatory documentation today.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="#products"
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-[#0F3D91] hover:bg-slate-100 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>Explore Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/suppliers"
                className="w-full sm:w-auto px-8 py-3.5 bg-transparent hover:bg-white/10 text-white font-bold text-sm rounded-xl border border-white/30 transition-all flex items-center justify-center min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Verified Suppliers
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
