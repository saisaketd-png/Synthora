import Link from "next/link";
import { Stethoscope, Sprout, TestTube, Sparkles, Dna, Factory, ArrowRight } from "lucide-react";

export function IndustryGrid() {
  const industries = [
    {
      title: "Pharmaceuticals",
      icon: Stethoscope,
      desc: "FDA/EMA compliant APIs, intermediates, & GMP synthesis.",
    },
    {
      title: "Agrochemicals",
      icon: Sprout,
      desc: "Pesticide intermediates, herbicides, and crop enhancers.",
    },
    {
      title: "Fine Chemicals",
      icon: TestTube,
      desc: "High-purity reagents, chiral building blocks, & catalysts.",
    },
    {
      title: "Specialty Chemicals",
      icon: Sparkles,
      desc: "Performance additives, coatings, and custom synthesis.",
    },
    {
      title: "Biotechnology",
      icon: Dna,
      desc: "Cell culture precursors, amino acids, & bio-reagents.",
    },
    {
      title: "Industrial Manufacturing",
      icon: Factory,
      desc: "Bulk solvents, industrial acids, monomers, & polymers.",
    },
  ];

  return (
    <section className="py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
                Targeted Solutions
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#0A192F] tracking-tight">
              Procurement optimized for your sector
            </h2>
          </div>
          
          <Link
            href="/industries"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 text-[13px] font-bold rounded-full transition-all shrink-0"
          >
            <span>Explore all sectors</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((ind) => {
            const Icon = ind.icon;
            return (
              <Link
                key={ind.title}
                href="/industries"
                className="group relative p-8 rounded-[2rem] bg-white border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col h-full"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <Icon className="w-7 h-7" />
                </div>
                
                <h3 className="text-xl font-bold text-[#0A192F] mb-3 group-hover:text-blue-600 transition-colors">
                  {ind.title}
                </h3>
                
                <p className="text-sm text-slate-500 leading-relaxed mb-8 flex-1">
                  {ind.desc}
                </p>
                
                <div className="mt-auto flex justify-end">
                  <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ArrowRight className="w-5 h-5 group-hover:-rotate-45 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
