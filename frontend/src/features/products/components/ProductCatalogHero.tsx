"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowRight, X } from "lucide-react";

interface ProductCatalogHeroProps {
  categories?: string[];
}

const CANONICAL_CATEGORIES = [
  { value: "API", label: "Active Pharmaceutical Ingredients", short: "APIs" },
  { value: "INTERMEDIATE", label: "Pharma Intermediates", short: "Intermediates" },
  { value: "EXCIPIENT", label: "Pharmaceutical Excipients", short: "Excipients" },
  { value: "SOLVENT", label: "Solvents & Reagents", short: "Solvents" },
  { value: "SPECIALTY_CHEMICAL", label: "Specialty Chemicals", short: "Specialties" },
  { value: "LAB_CHEMICAL", label: "Laboratory Chemicals", short: "Lab Chemicals" },
];

export function ProductCatalogHero({ categories = [] }: ProductCatalogHeroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
    setSelectedCategory(searchParams.get("category") || "");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    } else {
      params.delete("search");
    }

    if (selectedCategory) {
      params.set("category", selectedCategory);
    } else {
      params.delete("category");
    }

    params.set("page", "0");
    router.push(`/products?${params.toString()}`);
  };

  const handleQuickCategorySelect = (categoryKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!categoryKey || categoryKey === selectedCategory) {
      params.delete("category");
      setSelectedCategory("");
    } else {
      params.set("category", categoryKey);
      setSelectedCategory(categoryKey);
    }
    params.set("page", "0");
    router.push(`/products?${params.toString()}`);
  };

  const activeCategoryParam = searchParams.get("category") || "";

  // Combine canonical list with any dynamic categories passed in
  const categoryOptions = CANONICAL_CATEGORIES;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 lg:p-7 shadow-sm space-y-4 sm:space-y-5">
      {/* Title & Live Sourcing Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#091E42] tracking-tight">
              Chemical Catalog
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#DEEBFF] text-[#0747A6] border border-[#B3D4FF]">
              LIVE SOURCING
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#475569] mt-1 leading-relaxed max-w-3xl hidden sm:block">
            Source verified pharmaceutical APIs, intermediates, and specialty chemicals directly from certified global manufacturers with real-time commercial availability and compliance records.
          </p>
        </div>
      </div>

      {/* Dominant Operational Search Bar (48-52px) */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        <div className="relative flex-1">
          <Search className="w-4.5 h-4.5 text-[#64748B] absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chemical name, CAS, formula..."
            className="w-full h-11 sm:h-12 pl-10 sm:pl-11 pr-9 sm:pr-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm sm:text-[15px] text-[#091E42] font-medium placeholder:text-[#64748B] focus:outline-none focus:border-[#0052CC] focus:bg-white transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#091E42]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="sm:w-60 hidden sm:block">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by chemical category"
            className="w-full h-11 sm:h-12 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-semibold text-[#091E42] focus:outline-none focus:border-[#0052CC] transition-all cursor-pointer shadow-2xs"
          >
            <option value="">All Categories</option>
            {categoryOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="h-11 sm:h-12 px-6 sm:px-7 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs sm:text-sm font-bold rounded-xl transition-all inline-flex items-center justify-center gap-2 shrink-0 shadow-sm active:scale-[0.99]"
        >
          <span>Search Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Horizontal Category Quick-Chips (Mobile & Desktop Discovery) */}
      <div className="pt-1 overflow-x-auto no-scrollbar flex items-center gap-2 pb-1 -mx-1 px-1">
        <button
          type="button"
          onClick={() => handleQuickCategorySelect("")}
          className={`h-8 px-3 rounded-lg text-xs font-semibold shrink-0 transition-all border ${
            !activeCategoryParam
              ? "bg-[#091E42] text-white border-[#091E42] shadow-2xs"
              : "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-white"
          }`}
        >
          All Chemicals
        </button>
        {categoryOptions.map((cat) => {
          const isSelected = activeCategoryParam.toUpperCase() === cat.value.toUpperCase();
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => handleQuickCategorySelect(cat.value)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold shrink-0 transition-all border ${
                isSelected
                  ? "bg-[#0052CC] text-white border-[#0052CC] shadow-2xs"
                  : "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-white"
              }`}
            >
              {cat.short}
            </button>
          );
        })}
      </div>
    </div>
  );
}
