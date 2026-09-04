import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function BrandStatement() {
  const steps = [
    { num: "01", title: "DISCOVER", desc: "Locate verified chemical materials, active monograph specs, and supplier origin data." },
    { num: "02", title: "SOURCE", desc: "Submit structured RFQs detailing purity targets, batch volumes, and incoterm destinations." },
    { num: "03", title: "COMPARE", desc: "Evaluate binding quotation matrices, shipping lead times, and batch test documentation side-by-side." },
    { num: "04", title: "NEGOTIATE", desc: "Execute transparent, recorded price and payment term counter-proposals with authorized suppliers." },
    { num: "05", title: "ORDER", desc: "Issue legally enforceable purchase orders with locked commercial pricing and milestones." },
    { num: "06", title: "FULFILL", desc: "Track batch manufacturing progress, export customs clearances, and final consignment delivery." },
  ];

  return (
    <section className="py-16 sm:py-24 bg-[#FAFAFA] border-b border-[#E4E4E7]">
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-2xl space-y-2 mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#0052CC] block">
            How KemKendra Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
            From chemical discovery <br />
            to commercial execution.
          </h2>
          <p className="text-sm text-[#64748B] leading-relaxed">
            An auditable, end-to-end transaction pipeline engineered for international chemical trade.
          </p>
        </div>

        {/* Engineering Process Diagram / Pipeline (Horizontal on Desktop, Vertical on Mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 relative">
          {steps.map((step, idx) => (
            <div key={step.num} className="relative flex flex-col justify-between pt-4 border-t-2 border-slate-300 hover:border-[#0052CC] transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-mono font-bold text-slate-400 group-hover:text-[#0052CC] transition-colors">
                    {step.num}
                  </span>
                  {idx < steps.length - 1 && (
                    <span className="hidden lg:block text-slate-300 text-sm">→</span>
                  )}
                </div>

                <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider font-mono">
                  {step.title}
                </h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Large Editorial Statement Block */}
        <div className="mt-20 pt-16 border-t border-[#E4E4E7] grid grid-cols-1 lg:grid-cols-12 gap-8 items-baseline">
          <div className="lg:col-span-8">
            <h3 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#0F172A] tracking-tight leading-[1.18]">
              Chemical procurement shouldn’t depend on fragmented conversations.
            </h3>
          </div>
          <div className="lg:col-span-4 space-y-4">
            <p className="text-sm text-[#64748B] leading-relaxed">
              KemKendra brings product discovery, RFQs, quotation management, negotiation, and purchasing into one structured workflow.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#0052CC] hover:text-[#0747A6]"
            >
              <span>Explore the marketplace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
