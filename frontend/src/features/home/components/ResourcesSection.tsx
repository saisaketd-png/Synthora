import Link from "next/link";
import { ArrowRight, FileText, BookOpen, ShieldCheck } from "lucide-react";

export function ResourcesSection() {
  const resources = [
    {
      title: "Active Pharmaceutical Ingredients (API) Regulatory Standards",
      category: "Regulatory Dossier",
      date: "Industry Standard",
      summary: "Compliance guidelines covering Drug Master Files (DMF), US FDA, EDQM, and WHO-GMP requirements for API imports.",
    },
    {
      title: "Technical Specification Benchmarks: Chemical Purity & Assay",
      category: "Quality Assurance",
      date: "Monograph Protocol",
      summary: "Understanding analytical testing protocols: HPLC assay, impurity profiles, residual solvents, and COA validation.",
    },
    {
      title: "Dangerous Goods (DG) Classifications & Consignment Custody",
      category: "Supply Chain",
      date: "Logistics Framework",
      summary: "INCOTERMS, UN numbers, temperature-controlled cold chain logistics, and customs documentation requirements.",
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white border-b border-[#E4E4E7]">
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0052CC] font-mono bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1 rounded-[4px]">
              Technical Knowledge
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mt-2.5">
              Procurement & Compliance Guidelines
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-2xl leading-relaxed">
              Technical monographs, regulatory documentation standards, and logistics specifications for institutional chemical procurement.
            </p>
          </div>
          
          <Link
            href="/resources"
            className="h-9 px-4 bg-white border border-[#E4E4E7] hover:bg-[#FAFAFA] text-[#0F172A] text-xs font-medium rounded-[6px] transition-colors inline-flex items-center gap-2 shadow-xs shrink-0 self-start md:self-auto"
          >
            <span>View All Documentation</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#64748B]" />
          </Link>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {resources.map((r, i) => (
            <Link
              key={i}
              href="/resources"
              className="group bg-white hover:bg-[#FAFAFA] p-6 rounded-[8px] border border-[#E4E4E7] hover:border-[#0052CC] transition-colors flex flex-col justify-between shadow-tactile-card"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-medium uppercase tracking-wider bg-[#EFF6FF] text-[#0052CC] border border-[#BFDBFE]">
                    {r.category}
                  </span>
                  <span className="text-[10px] font-mono text-[#64748B]">
                    {r.date}
                  </span>
                </div>
                
                <h3 className="text-sm font-semibold text-[#0F172A] mb-2 leading-snug group-hover:text-[#0052CC] transition-colors">
                  {r.title}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {r.summary}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E4E4E7] flex items-center justify-between text-xs font-medium text-[#0052CC]">
                <span>Read Technical Article</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
        
      </div>
    </section>
  );
}
