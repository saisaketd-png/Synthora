"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { X, Filter, ChevronDown } from "lucide-react";

interface LeftFilterRailProps {
  categories: string[];
  countries: string[];
}

export function LeftFilterRail({ categories, countries }: LeftFilterRailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false); // Mobile drawer state

  const updateParam = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.set("page", "0");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const toggleBooleanParam = useCallback(
    (name: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.get(name);
      if (current === "true") {
        params.delete(name);
      } else {
        params.set(name, "true");
      }
      params.set("page", "0");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const clearAll = () => {
    router.push(pathname);
  };

  const FilterContent = (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[#0A192F] text-lg">Filters</h2>
        {(searchParams.toString() !== "") && (
          <button
            onClick={clearAll}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Categories */}
      <fieldset className="border-t border-slate-100 pt-6">
        <legend className="font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-4">
          Categories
        </legend>
        <div className="space-y-3">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="category"
                checked={searchParams.get("category") === cat}
                onChange={() => updateParam("category", cat)}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600"
              />
              <span className="text-sm text-slate-700 group-hover:text-[#0A192F] transition-colors">{cat}</span>
            </label>
          ))}
          {searchParams.get("category") && (
            <button 
              onClick={() => updateParam("category", "")}
              className="text-xs text-slate-400 hover:text-slate-600 mt-2"
            >
              Clear selection
            </button>
          )}
        </div>
      </fieldset>

      {/* Supplier Country */}
      <fieldset className="border-t border-slate-100 pt-6">
        <legend className="font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-4">
          Supplier Region
        </legend>
        <div className="relative">
          <select
            value={searchParams.get("country") || ""}
            onChange={(e) => updateParam("country", e.target.value)}
            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md py-2.5 pl-3 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="Filter by country"
          >
            <option value="">All Regions</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </fieldset>

      {/* Regulatory & Verification */}
      <fieldset className="border-t border-slate-100 pt-6">
        <legend className="font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-4">
          Regulatory & Trust
        </legend>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={searchParams.get("verified") === "true"}
              onChange={() => toggleBooleanParam("verified")}
              className="w-4 h-4 rounded-sm text-blue-600 border-slate-300 focus:ring-blue-600"
            />
            <span className="text-sm text-slate-700 group-hover:text-[#0A192F] transition-colors">Verified Supplier Only</span>
          </label>
        </div>
      </fieldset>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
          aria-expanded={isOpen}
          aria-controls="mobile-filter-drawer"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Desktop Rail */}
      <aside className="hidden lg:block w-full lg:w-[300px] shrink-0 sticky top-24 self-start bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-y-auto max-h-[calc(100vh-8rem)] hide-scrollbar">
        {FilterContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div
            id="mobile-filter-drawer"
            className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white shadow-2xl overflow-y-auto flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <span className="font-bold text-[#0A192F]">Filters</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1">
              {FilterContent}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-full shadow-lg"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
