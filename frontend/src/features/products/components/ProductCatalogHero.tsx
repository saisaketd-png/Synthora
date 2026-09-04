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
    <div className="bg-white border border-[#DFE1E6] rounded-md p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Title & Live Sourcing Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#091E42] tracking-tight">
              Chemical Catalog
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#DEEBFF] text-[#0747A6] border border-[#B3D4FF]">
              LIVE SOURCING
            </span>
          </div>
          <p className="text-xs text-[#5E6C84] mt-0.5 leading-relaxed max-w-3xl hidden sm:block">
            Source verified pharmaceutical APIs, intermediates, and specialty chemicals directly from certified global manufacturers with active compliance records.
          </p>
        </div>
      </div>

      {/* Dominant Operational Search Bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5E6C84] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chemical name, CAS number, molecular formula..."
            className="w-full h-10 pl-9.5 pr-8 bg-white border border-[#DFE1E6] rounded-md text-xs sm:text-sm text-[#091E42] font-medium placeholder:text-[#5E6C84] focus:outline-none focus:border-[#0052CC] transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#5E6C84] hover:text-[#091E42]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="sm:w-56 hidden sm:block">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by chemical category"
            className="w-full h-10 px-3 bg-white border border-[#DFE1E6] rounded-md text-xs font-semibold text-[#091E42] focus:outline-none focus:border-[#0052CC] transition-colors cursor-pointer shadow-2xs"
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
          className="h-10 px-5 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs sm:text-sm font-bold rounded-md transition-colors inline-flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
        >
          <span>Search Catalog</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Horizontal Category Quick-Chips */}
      <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 pb-0.5">
        <button
          type="button"
          onClick={() => handleQuickCategorySelect("")}
          className={`h-7 px-2.5 rounded text-[11px] font-semibold shrink-0 transition-colors border ${
            !activeCategoryParam
              ? "bg-[#091E42] text-white border-[#091E42]"
              : "bg-[#FAFBFC] text-[#5E6C84] border-[#DFE1E6] hover:border-[#0052CC] hover:bg-white"
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
              className={`h-7 px-2.5 rounded text-[11px] font-semibold shrink-0 transition-colors border ${
                isSelected
                  ? "bg-[#0052CC] text-white border-[#0052CC]"
                  : "bg-[#FAFBFC] text-[#5E6C84] border-[#DFE1E6] hover:border-[#0052CC] hover:bg-white"
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
