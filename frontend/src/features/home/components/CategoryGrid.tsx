import Link from "next/link";
import { Pill, FlaskConical, Droplet, Sparkles, ArrowRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  count: string;
  description: string;
  icon: React.ElementType;
}

export function CategoryGrid() {
  const categories: Category[] = [
    {
      id: "apis",
      name: "APIs",
      count: "3,400+ Products",
      description: "Active Pharmaceutical Ingredients compliant with USP, EP, and IP standards.",
      icon: Pill,
    },
    {
      id: "intermediates",
      name: "Pharmaceutical Intermediates",
      count: "2,800+ Products",
      description: "Key building blocks and synthesis intermediates for drug formulation.",
      icon: FlaskConical,
    },
    {
      id: "solvents",
      name: "Solvents & Reagents",
      count: "1,950+ Products",
      description: "High-purity HPLC, analytical, and industrial grade solvents.",
      icon: Droplet,
    },
    {
      id: "specialty",
      name: "Specialty Chemicals",
      count: "2,100+ Products",
      description: "Custom synthesis, catalysts, fine chemicals, and specialty additives.",
      icon: Sparkles,
    },
  ];

  return (
    <section id="categories" className="py-16 md:py-24 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#17B5AE]">
              Explore Marketplace
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#0F172A] mt-1">
              Featured Chemical Categories
            </h2>
            <p className="text-[#475569] text-base mt-2 max-w-xl">
              Browse verified chemical compounds categorized by purity, compliance, and industrial applications.
            </p>
          </div>
          <Link
            href="#all-categories"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F3D91] hover:text-[#0c3175] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F3D91] rounded-md p-1"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Responsive Grid with auto-fit / minmax */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.id}`}
                className="group relative bg-[#F8FAFC] hover:bg-white p-6 rounded-2xl border border-[#E2E8F0] hover:border-[#0F3D91]/40 hover:shadow-lg transition-all duration-200 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F3D91]"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white group-hover:bg-[#0F3D91] border border-[#E2E8F0] group-hover:border-[#0F3D91] flex items-center justify-center text-[#0F3D91] group-hover:text-white transition-colors shadow-sm mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A] group-hover:text-[#0F3D91] transition-colors">
                    {cat.name}
                  </h3>
                  <span className="inline-block px-2.5 py-0.5 mt-2 rounded-full text-xs font-semibold bg-[#0F3D91]/10 text-[#0F3D91]">
                    {cat.count}
                  </span>
                  <p className="text-sm text-[#475569] mt-3 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#0F3D91]">
                  <span>Explore Products</span>
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
