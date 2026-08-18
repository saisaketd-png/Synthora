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
    <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-6 lg:p-8 mb-6 mt-2 overflow-hidden shadow-sm flex flex-col items-center text-center">
      
      {/* Breadcrumbs */}
      <div className="text-sm font-medium text-slate-500 mb-4">
        <span className="hover:text-blue-600 cursor-pointer">Home</span>
        <span className="mx-2">/</span>
        <span className="text-slate-800">Products</span>
      </div>

      {/* Headline */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0A192F] leading-tight mb-3 max-w-[900px]">
        Find APIs, Intermediates & Specialty Chemicals from Verified Global Suppliers
      </h1>
      
      {/* Supporting Text */}
      <p className="text-slate-600 text-[14px] sm:text-[15px] leading-relaxed max-w-3xl mb-6">
        Search by product name, CAS number, molecular formula, or supplier and receive quotations from verified manufacturers.
      </p>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row shadow-sm rounded-xl overflow-hidden bg-white border border-slate-300 focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent transition-shadow mb-5 w-full max-w-[900px]">
        <div className="relative border-b sm:border-b-0 sm:border-r border-slate-200 bg-slate-50 shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-[200px] appearance-none bg-transparent py-4 pl-5 pr-10 text-[15px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
            aria-label="Select Category"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
            <ChevronDown className="w-5 h-5 text-slate-400" />
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
            placeholder="Search by product, CAS, formula, supplier..."
            className="block w-full py-4 pl-12 pr-4 text-[15px] text-[#0A192F] placeholder-slate-400 focus:outline-none bg-transparent"
            aria-label="Search query"
          />
        </div>

        <div className="flex bg-white">
          <button
            type="submit"
            className="px-8 py-4 bg-blue-600 text-white font-bold text-[15px] hover:bg-blue-900 transition-colors sm:w-auto w-full"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => router.push('/rfq')}
            className="px-8 py-4 bg-white text-blue-600 border-l border-slate-200 font-bold text-[15px] hover:bg-slate-50 transition-colors sm:w-auto w-full hidden sm:block"
          >
            Submit RFQ
          </button>
        </div>
      </form>

      {/* Popular Chips */}
      <div className="flex flex-wrap justify-center items-center gap-2 text-[12px] sm:text-[13px] mb-8">
        <span className="text-slate-500 font-bold uppercase tracking-wider mr-2">Popular:</span>
        {["Paracetamol API", "Acetic Acid", "Ethyl Acetate", "Pyridine", "4-Hydroxycarbazole"].map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => handleChipClick(term)}
            className="px-4 py-1.5 bg-transparent border border-slate-300 text-slate-700 rounded-full hover:border-blue-600 hover:text-blue-600 transition-colors font-medium"
          >
            {term}
          </button>
        ))}
      </div>

      {/* Trust Strip */}
      <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest pt-4 border-t border-slate-200 w-full max-w-[900px]">
        <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> GMP Verified</div>
        <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> ISO 9001</div>
        <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> COA Available</div>
        <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> MSDS Available</div>
        <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Export Support</div>
        <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Worldwide Logistics</div>
      </div>

    </div>
  );
}
