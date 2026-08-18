import { Stethoscope, Sprout, TestTube, Sparkle, Dna, Factory } from "lucide-react";

export function IndustriesSection() {
  const industries = [
    {
      icon: Stethoscope,
      title: "Pharmaceuticals",
      description: "High-grade APIs, excipients, and drug delivery polymers compliant with FDA/EMA standards.",
    },
    {
      icon: Sprout,
      title: "Agrochemicals",
      description: "Pesticide intermediates, herbicides, fungicides, and agricultural yield enhancers.",
    },
    {
      icon: SpecialtyIcon,
      title: "Specialty Chemicals",
      description: "Performance additives, surfactants, coatings, and custom synthesis formulations.",
    },
    {
      icon: TestTube,
      title: "Fine Chemicals",
      description: "High-purity organic synthesis reagents, chiral building blocks, and lab catalysts.",
    },
    {
      icon: Dna,
      title: "Biotechnology",
      description: "Cell culture media ingredients, bio-reagents, and peptide synthesis precursors.",
    },
    {
      icon: Factory,
      title: "Industrial Manufacturing",
      description: "Bulk solvents, industrial acids, monomers, and polymers for large-scale production.",
    },
  ];

  return (
    <section id="industries" className="py-16 md:py-24 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Global Coverage
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#0F172A] mt-1">
            Industries Powered by Synthora
          </h2>
          <p className="text-[#475569] text-base mt-2">
            Tailored supply chain solutions and raw material sourcing for specialized manufacturing sectors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((ind) => {
            const Icon = ind.icon;
            return (
              <div
                key={ind.title}
                className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-teal-500 hover:bg-white transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-full bg-white group-hover:bg-teal-500/10 border border-[#E2E8F0] flex items-center justify-center text-blue-600 group-hover:text-teal-500 transition-colors mb-4 shadow-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2 group-hover:text-blue-600 transition-colors">
                  {ind.title}
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {ind.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SpecialtyIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Sparkle {...props} />;
}
