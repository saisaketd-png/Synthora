import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CANONICAL_CATEGORIES, getCategoryCounts } from "@/features/categories/api/categoryApi";

export async function CategoryShortcuts() {
  const counts = await getCategoryCounts();

  return (
    <section className="py-16 sm:py-24 bg-white border-b border-[#E4E4E7]">
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Section Header: Left Heading + Right Explanation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end pb-12 border-b border-[#E4E4E7]">
          <div className="lg:col-span-7 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0052CC] block">
              Marketplace Taxonomy
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F172A] leading-tight">
              Chemical categories, <br />
              organized for discovery.
            </h2>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between items-start lg:items-end gap-4">
            <p className="text-sm text-[#64748B] leading-relaxed max-w-md">
              Browse verified active pharmaceutical ingredients, fine chemical intermediates, and industrial materials structured for procurement compliance.
            </p>
            <Link
              href="/categories"
              className="text-xs font-semibold text-[#0052CC] hover:text-[#0747A6] inline-flex items-center gap-1.5"
            >
              <span>View complete taxonomy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* High-End Horizontal Category Directory (NO repetitive cards) */}
        <div className="divide-y divide-[#E4E4E7]">
          {CANONICAL_CATEGORIES.map((cat, idx) => {
            const count = counts[cat.key];
            const isComingSoon = Boolean(cat.isComingSoon);
            const num = String(idx + 1).padStart(2, "0");
            const isPrimary = cat.key === "API";

            return (
              <div
                key={cat.id}
                className="py-6 sm:py-8 transition-colors hover:bg-slate-50/70 group"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-center">
                  
                  {/* Category Index & Name (4 cols) */}
                  <div className="md:col-span-4 flex items-baseline gap-4">
                    <span className="text-sm font-mono font-bold text-slate-400 group-hover:text-[#0052CC] transition-colors">
                      {num}
                    </span>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A] group-hover:text-[#0052CC] transition-colors">
                        {cat.name}
                      </h3>
                      {count ? (
                        <span className="text-[11px] font-mono text-[#059669] block mt-0.5">
                          {count} listed product{count > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                          {isComingSoon ? "CMO services upcoming" : "Category available"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category Description (5 cols) */}
                  <div className="md:col-span-5">
                    <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-xl">
                      {cat.description}
                    </p>

                    {/* Real Active Reference Chemicals for Primary API Category */}
                    {isPrimary && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono text-[#0F172A]">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-[3px]">Paracetamol API (103-90-2)</span>
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-[3px]">Ibuprofen BP (15687-27-1)</span>
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-[3px]">Metformin HCl (1115-70-4)</span>
                      </div>
                    )}
                  </div>

                  {/* Action Link (3 cols) */}
                  <div className="md:col-span-3 flex justify-start md:justify-end">
                    {isComingSoon ? (
                      <span className="text-xs font-mono text-slate-400">
                        Launching soon
                      </span>
                    ) : (
                      <Link
                        href={`/categories/${cat.id}`}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-[#0052CC] group-hover:translate-x-1.5 transition-transform"
                      >
                        <span>Explore category</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
