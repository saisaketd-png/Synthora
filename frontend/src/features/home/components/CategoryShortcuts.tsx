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

export async function CategoryShortcuts() {
  const counts = await getCategoryCounts();

  return (
    <section className="py-16 sm:py-20 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0052CC] bg-[#DEEBFF] px-2.5 py-1 rounded-md">
              Product Categories
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#091E42] mt-2">
              Category Sourcing Shortcuts
            </h2>
            <p className="text-[#64748B] text-sm mt-1 max-w-2xl leading-relaxed">
              Explore chemical products by category and quickly find the materials relevant to your procurement requirements.
            </p>
          </div>

          <Link
            href="/categories"
            className="h-[42px] px-5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#091E42] text-sm font-semibold rounded-xl transition-all inline-flex items-center gap-2 shadow-2xs shrink-0 self-start md:self-auto"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 text-[#64748B]" />
          </Link>
        </div>

        {/* Responsive Category Shortcut Cards: 1 col (mobile) -> 2 cols (tablet) -> 3 cols (desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CANONICAL_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.key] || FlaskConical;
            const count = counts[cat.key] ?? 0;
            const isComingSoon = Boolean(cat.isComingSoon);

            if (isComingSoon) {
              return (
                <div
                  key={cat.id}
                  className="bg-[#F8FAFC] p-6 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] shadow-2xs mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-extrabold text-[#091E42]">
                      {cat.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-2 rounded-md text-[11px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                      <Clock className="w-3 h-3" /> Coming Soon
                    </span>
                    <p className="text-xs sm:text-sm text-[#64748B] mt-2.5 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#E2E8F0] text-xs font-medium text-[#64748B] italic">
                    Custom synthesis & CMO services launching in a future phase
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.id}`}
                className="group bg-white hover:bg-[#F8FAFC] p-6 rounded-2xl border border-[#E2E8F0] hover:border-[#0052CC] transition-all flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#DEEBFF] group-hover:bg-[#0052CC] border border-[#B3D4FF] group-hover:border-[#0052CC] flex items-center justify-center text-[#0052CC] group-hover:text-white transition-colors shadow-2xs mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#091E42] group-hover:text-[#0052CC] transition-colors">
                    {cat.name}
                  </h3>
                  <span className="inline-block px-2.5 py-0.5 mt-2 rounded-md text-xs font-mono font-bold bg-[#F8FAFC] text-[#091E42] border border-[#E2E8F0]">
                    {count} {count === 1 ? "Product" : "Products"}
                  </span>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-2.5 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs sm:text-sm font-bold text-[#0052CC]">
                  <span>Explore {cat.name}</span>
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
