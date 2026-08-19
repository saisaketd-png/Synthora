"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { X, Filter, ChevronDown, Search, RotateCcw, ShieldCheck, FileCheck, CheckCircle2 } from "lucide-react";

interface ProductFiltersProps {
  categories: string[];
  countries: string[];
}

export function ProductFilters({ categories, countries }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
  const [localCas, setLocalCas] = useState(searchParams.get("casNumber") || "");
  const [localPurityMin, setLocalPurityMin] = useState(searchParams.get("purityMin") || "");
  const [localPurityMax, setLocalPurityMax] = useState(searchParams.get("purityMax") || "");
  const [localMoqMin, setLocalMoqMin] = useState(searchParams.get("moqMin") || "");
  const [localMoqMax, setLocalMoqMax] = useState(searchParams.get("moqMax") || "");

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
    setLocalCas("");
    setLocalPurityMin("");
    setLocalPurityMax("");
    setLocalMoqMin("");
    setLocalMoqMax("");
  };

  const hasActiveFilters = Boolean(
    searchParams.get("search") ||
    searchParams.get("category") ||
    searchParams.get("casNumber") ||
    searchParams.get("purityMin") ||
    searchParams.get("purityMax") ||
    searchParams.get("moqMin") ||
    searchParams.get("moqMax") ||
    searchParams.get("inStock") ||
    searchParams.get("coa") ||
    searchParams.get("msds") ||
    searchParams.get("exportReady") ||
    searchParams.get("country")
  );

  const FilterContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-700" />
          <h2 className="font-extrabold text-slate-900 text-base">Catalog Filters</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* 1. Keyword Search */}
      <fieldset className="space-y-2">
        <legend className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
          Keyword Search
        </legend>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateParam("search", localSearch);
          }}
          className="relative"
        >
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Product, code, formula..."
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-slate-50/70 text-slate-900"
            aria-label="Search within catalog"
          />
        </form>
      </fieldset>

      {/* 2. CAS Registry Number Exact Match */}
      <fieldset className="space-y-2 pt-4 border-t border-slate-100">
        <legend className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
          CAS Number
        </legend>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateParam("casNumber", localCas);
          }}
          className="relative"
        >
          <input
            type="text"
            value={localCas}
            onChange={(e) => setLocalCas(e.target.value)}
            placeholder="e.g. 103-90-2"
            className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-slate-50/70 text-slate-900"
            aria-label="Filter by CAS number"
          />
        </form>
      </fieldset>

      {/* 3. Product Categories */}
      {categories.length > 0 && (
        <fieldset className="space-y-3 pt-4 border-t border-slate-100">
          <legend className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
            Chemical Category
          </legend>
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat} className="flex items-center gap-3 cursor-pointer group py-0.5">
                <input
                  type="radio"
                  name="category"
                  checked={searchParams.get("category") === cat}
                  onChange={() => updateParam("category", cat)}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600"
                />
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                  {cat.replace("_", " ")}
                </span>
              </label>
            ))}
            {searchParams.get("category") && (
              <button
                type="button"
                onClick={() => updateParam("category", "")}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 mt-2 block"
              >
                Clear category selection
              </button>
            )}
          </div>
        </fieldset>
      )}

      {/* 4. Technical Purity Range */}
      <fieldset className="space-y-2 pt-4 border-t border-slate-100">
        <legend className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
          Purity Range (%)
        </legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            placeholder="Min %"
            value={localPurityMin}
            onChange={(e) => setLocalPurityMin(e.target.value)}
            onBlur={() => updateParam("purityMin", localPurityMin)}
            onKeyDown={(e) => { if (e.key === "Enter") updateParam("purityMin", localPurityMin); }}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono bg-slate-50/70 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="Minimum purity percentage"
          />
          <span className="text-slate-400 font-bold">—</span>
          <input
            type="number"
            step="0.1"
            placeholder="Max %"
            value={localPurityMax}
            onChange={(e) => setLocalPurityMax(e.target.value)}
            onBlur={() => updateParam("purityMax", localPurityMax)}
            onKeyDown={(e) => { if (e.key === "Enter") updateParam("purityMax", localPurityMax); }}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono bg-slate-50/70 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="Maximum purity percentage"
          />
        </div>
      </fieldset>

      {/* 5. Minimum Order Quantity (MOQ) */}
      <fieldset className="space-y-2 pt-4 border-t border-slate-100">
        <legend className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
          MOQ Range (kg)
        </legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min kg"
            value={localMoqMin}
            onChange={(e) => setLocalMoqMin(e.target.value)}
            onBlur={() => updateParam("moqMin", localMoqMin)}
            onKeyDown={(e) => { if (e.key === "Enter") updateParam("moqMin", localMoqMin); }}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono bg-slate-50/70 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="Minimum MOQ in kg"
          />
          <span className="text-slate-400 font-bold">—</span>
          <input
            type="number"
            placeholder="Max kg"
            value={localMoqMax}
            onChange={(e) => setLocalMoqMax(e.target.value)}
            onBlur={() => updateParam("moqMax", localMoqMax)}
            onKeyDown={(e) => { if (e.key === "Enter") updateParam("moqMax", localMoqMax); }}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono bg-slate-50/70 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="Maximum MOQ in kg"
          />
        </div>
      </fieldset>

      {/* 6. Availability & Stock Status */}
      <fieldset className="space-y-3 pt-4 border-t border-slate-100">
        <legend className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
          Inventory Standing
        </legend>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group py-0.5">
            <input
              type="checkbox"
              checked={searchParams.get("inStock") === "true"}
              onChange={() => toggleBooleanParam("inStock")}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-600"
            />
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
              In Stock Only
            </span>
          </label>
        </div>
      </fieldset>

      {/* 7. Quality Documentation */}
      <fieldset className="space-y-3 pt-4 border-t border-slate-100">
        <legend className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
          Quality Compliance
        </legend>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group py-0.5">
            <input
              type="checkbox"
              checked={searchParams.get("coa") === "true"}
              onChange={() => toggleBooleanParam("coa")}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-600"
            />
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
              COA Available
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group py-0.5">
            <input
              type="checkbox"
              checked={searchParams.get("msds") === "true"}
              onChange={() => toggleBooleanParam("msds")}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-600"
            />
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
              MSDS Available
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group py-0.5">
            <input
              type="checkbox"
              checked={searchParams.get("exportReady") === "true"}
              onChange={() => toggleBooleanParam("exportReady")}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-600"
            />
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
              Export Ready Documentation
            </span>
          </label>
        </div>
      </fieldset>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Trigger Button */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-between w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 hover:bg-slate-50 shadow-xs"
          aria-expanded={isOpen}
          aria-controls="mobile-filter-drawer"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filter Catalog Results</span>
          </div>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-blue-600" />
          )}
        </button>
      </div>

      {/* Desktop Filter Rail */}
      <aside className="hidden lg:block w-full bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
        {FilterContent}
      </aside>

      {/* Mobile Filter Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-slate-900/50 backdrop-blur-xs transition-opacity">
          <div
            id="mobile-filter-drawer"
            className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white shadow-2xl overflow-y-auto flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Catalog Filters"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <span className="font-extrabold text-slate-900 text-base">Catalog Filters</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {FilterContent}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                type="button"
                onClick={clearAll}
                className="w-1/3 py-3 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl shadow-xs text-xs"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-2/3 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-xs text-xs"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
