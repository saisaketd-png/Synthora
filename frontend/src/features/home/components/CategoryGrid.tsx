import Link from "next/link";
import { Pill, FlaskConical, Droplet, Sparkles, Layers, Factory, ArrowRight, Clock } from "lucide-react";
import { CANONICAL_CATEGORIES, getCategoryCounts } from "@/features/categories/api/categoryApi";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  API: Pill,
  INTERMEDIATE: FlaskConical,
  SPECIALTY_CHEMICAL: Sparkles,
  SOLVENT: Droplet,
  EXCIPIENT: Layers,
  CONTRACT_MANUFACTURING: Factory,
};

export async function CategoryGrid() {
  const counts = await getCategoryCounts();

  return (
    <section id="categories" className="py-12 md:py-16 bg-white border-b border-[#DCE3EC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#155EEF] bg-[#EFF4FF] px-2.5 py-0.5 rounded-md">
              Canonical Directory
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1F3A] mt-2">
              Chemical Categories & Classifications
            </h2>
            <p className="text-[#64748B] text-xs sm:text-sm mt-1 max-w-xl">
              Browse verified chemical compounds classified by pharmacopoeial grade, technical application, and compliance standards.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#155EEF] hover:underline"
          >
            <span>View Full Chemical Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Responsive Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CANONICAL_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.key] || FlaskConical;
            const count = counts[cat.key] ?? 0;
            const isComingSoon = Boolean(cat.isComingSoon);

            if (isComingSoon) {
              return (
                <div
                  key={cat.id}
                  className="bg-[#F8FAFC] p-6 rounded-2xl border border-[#DCE3EC] flex flex-col justify-between opacity-80"
                >
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-white border border-[#DCE3EC] flex items-center justify-center text-[#64748B] shadow-2xs mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-[#0F172A]">
                        {cat.name}
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-2 rounded-md text-[10px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                      <Clock className="w-3 h-3" /> Coming Soon
                    </span>
                    <p className="text-xs text-[#64748B] mt-2.5 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#DCE3EC] text-xs font-semibold text-[#64748B] italic">
                    Custom synthesis & CMO services launching in upcoming phase
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.id}`}
                className="group bg-white hover:bg-[#F8FAFC] p-6 rounded-2xl border border-[#DCE3EC] hover:border-[#155EEF] transition-all flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#EFF4FF] group-hover:bg-[#155EEF] border border-[#BFDBFE] group-hover:border-[#155EEF] flex items-center justify-center text-[#155EEF] group-hover:text-white transition-colors shadow-2xs mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#0F172A] group-hover:text-[#155EEF] transition-colors">
                    {cat.name}
                  </h3>
                  <span className="inline-block px-2.5 py-0.5 mt-2 rounded-md text-xs font-mono font-bold bg-[#F1F5F9] text-[#0B1F3A] border border-[#DCE3EC]">
                    {count} {count === 1 ? "Product" : "Products"}
                  </span>
                  <p className="text-xs text-[#64748B] mt-2.5 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-bold text-[#155EEF]">
                  <span>Browse Category</span>
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
