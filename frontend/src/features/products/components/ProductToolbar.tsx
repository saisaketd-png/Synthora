"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Search, List, Grid } from "lucide-react";

interface ProductToolbarProps {
  totalResults: number;
}

export function ProductToolbar({ totalResults }: ProductToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state for immediate input feedback
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");

  // Debounced search logic could be added here, or handled via form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", searchValue);
  };

  const updateParam = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.set("page", "0"); // Reset to page 0 on any filter change
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search product name or CAS number..."
          className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow bg-slate-50"
          aria-label="Search catalog"
        />
      </form>

      {/* Controls */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
        <select
          value={searchParams.get("sort") || ""}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-full focus:ring-blue-600 focus:border-blue-600 block px-4 py-2"
          aria-label="Sort products"
        >
          <option value="">Most Relevant</option>
          <option value="price,asc">Price: Low to High</option>
          <option value="price,desc">Price: High to Low</option>
          <option value="createdAt,desc">Newest Arrivals</option>
        </select>

        <div className="hidden lg:flex items-center gap-1 border-l border-slate-200 pl-3 ml-1">
          <button
            className="p-2 bg-slate-100 text-slate-900 rounded-md transition-colors"
            aria-label="Table View"
            aria-pressed="true"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-colors cursor-not-allowed opacity-50"
            aria-label="Grid View"
            aria-pressed="false"
            title="Grid view coming soon"
            disabled
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
