import Link from "next/link";
import { Pill, FlaskConical, Droplet, Sparkles, TestTube, Factory, ArrowRight } from "lucide-react";
import { SectionHeader } from "@/shared/components/SectionHeader";

export function CategoryShortcuts() {
  const categories = [
    {
      id: "apis",
      name: "APIs & Actives",
      count: "3,400+ Products",
      desc: "USP, EP, & IP grade active ingredients.",
      icon: Pill,
    },
    {
      id: "intermediates",
      name: "Pharma Intermediates",
      count: "2,800+ Products",
      desc: "Synthesis precursors & building blocks.",
      icon: FlaskConical,
    },
    {
      id: "solvents",
      name: "Solvents & Reagents",
      count: "1,950+ Products",
      desc: "HPLC, analytical, & industrial grade.",
      icon: Droplet,
    },
    {
      id: "specialty",
      name: "Specialty Chemicals",
      count: "2,100+ Products",
      desc: "Performance additives & catalysts.",
      icon: Sparkles,
    },
    {
      id: "fine",
      name: "Fine Chemicals",
      count: "1,450+ Products",
      desc: "Organic synthesis & chiral reagents.",
      icon: TestTube,
    },
    {
      id: "contract",
      name: "Contract Manufacturing",
      count: "850+ Audited Plants",
      desc: "Custom synthesis & toll manufacturing.",
      icon: Factory,
    },
  ];

  return (
    <section className="py-12 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Chemical Classifications"
          title="Category Shortcuts"
          subtitle="Explore compounds grouped by regulatory monograph and chemical synthesis application."
          actionHref="/categories"
          actionText="View All Categories"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={`/categories`}
                className="bg-white p-4 rounded-sm border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 bg-slate-50 border border-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-500 flex items-center justify-center transition-colors mb-4 rounded-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] font-bold text-teal-500 uppercase tracking-wider block mt-1">
                    {cat.count}
                  </span>
                  <p className="text-xs text-slate-500 leading-tight mt-2 line-clamp-2">
                    {cat.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>Browse</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
