"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronDown, CheckCircle2 } from "lucide-react";

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
      // Placeholder trackSearch event
      // trackSearch({ query: searchQuery.trim(), resultCount: 0 });
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
    <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 lg:p-10 mb-8 mt-2 overflow-hidden relative shadow-sm">
      <div className="flex flex-col lg:flex-row gap-10 lg:items-center relative z-10">
        
        {/* Left Side: 70% */}
        <div className="flex-1 lg:w-7/12">
          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#0A192F] leading-tight mb-4">
            Find APIs, Intermediates & Specialty Chemicals from Verified Global Suppliers
          </h1>
          <p className="text-slate-600 text-[15px] sm:text-base leading-relaxed max-w-2xl mb-8">
            Search by product name, CAS number, molecular formula, or supplier and receive quotations from verified manufacturers.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row shadow-lg rounded-xl overflow-hidden bg-white border border-slate-200 focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent transition-shadow mb-6">
            <div className="relative border-b sm:border-b-0 sm:border-r border-slate-200 bg-slate-50 shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-[180px] appearance-none bg-transparent py-3.5 pl-4 pr-10 text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
                aria-label="Select Category"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name, CAS number, molecular formula, or supplier..."
                className="block w-full py-3.5 pl-11 pr-4 text-[15px] text-[#0A192F] placeholder-slate-400 focus:outline-none bg-transparent"
                aria-label="Search query"
              />
            </div>

            <button
              type="submit"
              className="px-8 py-3.5 bg-blue-600 text-white font-bold text-[15px] hover:bg-blue-700 transition-colors sm:w-auto w-full"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="text-slate-500 font-medium">Popular:</span>
            {["Paracetamol API", "Acetic Acid", "Ethyl Acetate", "Pyridine", "4-Hydroxycarbazole"].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleChipClick(term)}
                className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-full hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: 30% */}
        <div className="w-full lg:w-5/12 max-w-sm ml-auto shrink-0">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative">
            <div className="absolute -top-3 right-4 flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live Marketplace
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <div className="text-3xl font-black text-[#0A192F] tracking-tight">10k+</div>
                <div className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mt-1">Products</div>
              </div>
              <div>
                <div className="text-3xl font-black text-[#0A192F] tracking-tight flex items-baseline gap-1">
                  1.2k+
                </div>
                <div className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                  Verified
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-[#0A192F] tracking-tight">37</div>
                <div className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mt-1">Countries</div>
              </div>
              <div>
                <div className="text-3xl font-black text-blue-600 tracking-tight">250+</div>
                <div className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mt-1">Active RFQs</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
