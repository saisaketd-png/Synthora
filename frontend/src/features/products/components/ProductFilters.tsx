"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { X, Filter, ChevronDown, Search } from "lucide-react";

interface ProductFiltersProps {
  categories: string[];
  countries: string[];
}

export function ProductFilters({ categories, countries }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false); // Mobile drawer state
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");

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
    setLocalSearch("");
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

      {/* 1. Search within results */}
      <fieldset className="border-t border-slate-100 pt-6">
        <legend className="font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-4">
          Search
        </legend>
        <form onSubmit={(e) => { e.preventDefault(); updateParam("search", localSearch); }} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search keywords..."
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow bg-slate-50"
            aria-label="Search within results"
          />
        </form>
      </fieldset>

      {/* 2. Categories */}
      {categories.length > 0 && (
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
                className="text-xs text-slate-400 hover:text-slate-600 mt-2 block"
              >
                Clear selection
              </button>
            )}
          </div>
        </fieldset>
      )}

      {/* 3. Supplier Country */}
      {countries.length > 0 && (
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
      )}

      {/* 4. Verification */}
      <fieldset className="border-t border-slate-100 pt-6">
        <legend className="font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-4">
          Verification
        </legend>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={searchParams.get("verified") === "true"}
              onChange={() => toggleBooleanParam("verified")}
              className="w-4 h-4 rounded-sm text-blue-600 border-slate-300 focus:ring-blue-600"
            />
            <span className="text-sm text-slate-700 group-hover:text-[#0A192F] transition-colors">GMP Verified</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={searchParams.get("iso") === "true"}
              onChange={() => toggleBooleanParam("iso")}
              className="w-4 h-4 rounded-sm text-blue-600 border-slate-300 focus:ring-blue-600"
            />
            <span className="text-sm text-slate-700 group-hover:text-[#0A192F] transition-colors">ISO Certified</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={searchParams.get("exportReady") === "true"}
              onChange={() => toggleBooleanParam("exportReady")}
              className="w-4 h-4 rounded-sm text-blue-600 border-slate-300 focus:ring-blue-600"
            />
            <span className="text-sm text-slate-700 group-hover:text-[#0A192F] transition-colors">Export Ready</span>
          </label>
        </div>
      </fieldset>

      {/* 5. Purity Range */}
      <fieldset className="border-t border-slate-100 pt-6">
        <legend className="font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-4">
          Purity
        </legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min %"
            value={searchParams.get("purityMin") || ""}
            onChange={(e) => updateParam("purityMin", e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-slate-50"
            aria-label="Minimum purity"
          />
          <span className="text-slate-400">-</span>
          <input
            type="number"
            placeholder="Max %"
            value={searchParams.get("purityMax") || ""}
            onChange={(e) => updateParam("purityMax", e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-slate-50"
            aria-label="Maximum purity"
          />
        </div>
      </fieldset>

      {/* 6. MOQ Range */}
      <fieldset className="border-t border-slate-100 pt-6">
        <legend className="font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-4">
          MOQ (kg)
        </legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min kg"
            value={searchParams.get("moqMin") || ""}
            onChange={(e) => updateParam("moqMin", e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-slate-50"
            aria-label="Minimum MOQ"
          />
          <span className="text-slate-400">-</span>
          <input
            type="number"
            placeholder="Max kg"
            value={searchParams.get("moqMax") || ""}
            onChange={(e) => updateParam("moqMax", e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-slate-50"
            aria-label="Maximum MOQ"
          />
        </div>
      </fieldset>

      {/* 7. Availability */}
      <fieldset className="border-t border-slate-100 pt-6">
        <legend className="font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-4">
          Availability
        </legend>
        <div className="space-y-3">
          {["In Stock", "Limited", "Made to Order"].map((status) => (
            <label key={status} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="availability"
                checked={searchParams.get("availability") === status}
                onChange={() => updateParam("availability", status)}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600"
              />
              <span className="text-sm text-slate-700 group-hover:text-[#0A192F] transition-colors">{status}</span>
            </label>
          ))}
          {searchParams.get("availability") && (
            <button 
              onClick={() => updateParam("availability", "")}
              className="text-xs text-slate-400 hover:text-slate-600 mt-2 block"
            >
              Clear selection
            </button>
          )}
        </div>
      </fieldset>

      {/* 8. Documentation */}
      <fieldset className="border-t border-slate-100 pt-6">
        <legend className="font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-4">
          Documentation
        </legend>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={searchParams.get("coa") === "true"}
              onChange={() => toggleBooleanParam("coa")}
              className="w-4 h-4 rounded-sm text-blue-600 border-slate-300 focus:ring-blue-600"
            />
            <span className="text-sm text-slate-700 group-hover:text-[#0A192F] transition-colors">COA Available</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={searchParams.get("msds") === "true"}
              onChange={() => toggleBooleanParam("msds")}
              className="w-4 h-4 rounded-sm text-blue-600 border-slate-300 focus:ring-blue-600"
            />
            <span className="text-sm text-slate-700 group-hover:text-[#0A192F] transition-colors">MSDS Available</span>
          </label>
        </div>
      </fieldset>

      {/* 9. Lead Time */}
      <fieldset className="border-t border-slate-100 pt-6">
        <legend className="font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-4">
          Lead Time
        </legend>
        <div className="relative">
          <select
            value={searchParams.get("leadTime") || ""}
            onChange={(e) => updateParam("leadTime", e.target.value)}
            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md py-2.5 pl-3 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="Filter by lead time"
          >
            <option value="">Any Lead Time</option>
            <option value="immediate">Immediate Dispatch</option>
            <option value="1week">&lt; 1 Week</option>
            <option value="2weeks">&lt; 2 Weeks</option>
            <option value="1month">&lt; 1 Month</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
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
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-4">
              <button
                onClick={clearAll}
                className="w-1/3 py-3 bg-white text-slate-700 border border-slate-200 font-bold rounded-full shadow-sm"
              >
                Reset
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-2/3 py-3 bg-blue-600 text-white font-bold rounded-full shadow-lg"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
