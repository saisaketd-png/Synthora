"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronDown, CheckCircle2, FlaskConical, ShieldCheck, FileCheck } from "lucide-react";

interface ProductCatalogHeroProps {
  categories: string[];
}

export function ProductCatalogHero({ categories }: ProductCatalogHeroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");

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

  const handleChipClick = (term: string) => {
    setSearchQuery(term);
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", term);
    params.set("page", "0");
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 lg:p-10 mb-8 shadow-xs">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-4">
        
        {/* Header Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <FlaskConical className="w-3.5 h-3.5" />
          Enterprise Chemical Directory
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0A192F] tracking-tight leading-tight">
          Source Pharmaceutical & Industrial Chemicals
        </h1>
        
        {/* Supporting Text */}
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
          Search high-purity APIs, pharmaceutical intermediates, and specialty solvents directly from verified global manufacturers with verified COA & MSDS documentation.
        </p>

        {/* Search & Category Selector Bar */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row rounded-2xl overflow-hidden bg-white border-2 border-slate-200 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10 transition-all shadow-sm w-full mt-2"
        >
          {/* Category Dropdown */}
          <div className="relative border-b sm:border-b-0 sm:border-r border-slate-200 bg-slate-50/80 shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-[210px] appearance-none bg-transparent py-3.5 pl-4 pr-10 text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
              aria-label="Filter by Category"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace("_", " ")}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3.5 pointer-events-none">
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Search Text Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, CAS (e.g. 103-90-2), or code (e.g. API-100428)..."
              className="block w-full py-3.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
              aria-label="Search Chemical Directory"
            />
          </div>

          {/* Search Action Buttons */}
          <div className="flex bg-white">
            <button
              type="submit"
              className="px-8 py-3.5 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors sm:w-auto w-full shadow-xs"
            >
              Search
            </button>
          </div>
        </form>

        {/* Popular Search Suggestions */}
        <div className="flex flex-wrap justify-center items-center gap-2 text-xs pt-2">
          <span className="text-slate-400 font-bold uppercase tracking-wider">Quick Search:</span>
          {["Paracetamol API", "N,N-Dimethylformamide", "4-Hydroxycarbazole", "Solvents", "103-90-2"].map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => handleChipClick(term)}
              className="px-3 py-1 bg-slate-100/80 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-full transition-colors font-medium border border-slate-200/60"
            >
              {term}
            </button>
          ))}
        </div>

        {/* Trust Signals Strip */}
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs font-bold text-slate-500 uppercase tracking-wider pt-6 border-t border-slate-100 w-full">
          <div className="flex items-center gap-1.5 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-teal-600" /> Verified cGMP Suppliers
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <FileCheck className="w-4 h-4 text-blue-600" /> COA & MSDS Verified
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Guaranteed MOQ Compliance
          </div>
        </div>

      </div>
    </div>
  );
}
