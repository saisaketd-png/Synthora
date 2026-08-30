"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, PlusCircle, CheckCircle, FlaskConical, AlertCircle, FilePlus, RefreshCw } from "lucide-react";
import { MasterProduct, searchMasterProducts } from "../api/masterCatalogApi";

interface MasterProductSearchStepProps {
  onSelectMasterProduct: (product: MasterProduct) => void;
  onRequestNewChemical: () => void;
}

export function MasterProductSearchStep({
  onSelectMasterProduct,
  onRequestNewChemical,
}: MasterProductSearchStepProps) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async (searchQuery: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const results = await searchMasterProducts(searchQuery);
      setProducts(results);
      setHasSearched(true);
    } catch (e: any) {
      setError(e.message || "Unable to search the Master Catalog. Please try again.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog("");
  }, [fetchCatalog]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalog(query.trim());
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-blue-600" />
          Step 1: Search Master Chemical Catalog
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Search KemKendra&apos;s canonical master catalog by Chemical Name, CAS Number, or Master Product Code.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Chemical Name, CAS (e.g. 103-90-2), or Code (e.g. API-MP-100428)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Searching...
            </>
          ) : (
            "Search Catalog"
          )}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between text-rose-800 text-xs font-medium">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchCatalog(query)}
            className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg text-xs hover:bg-rose-700 transition-colors"
          >
            RETRY
          </button>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-3 pt-2">
        {products.length > 0 ? (
          products.map((mp: any) => {
            const name = mp.name || "Unnamed Compound";
            const code = mp.masterProductCode || mp.code || mp.id;
            const cas = mp.casNumber || mp.cas || "N/A";
            const formula = mp.molecularFormula || mp.formula || null;
            const category = (mp.category || "CHEMICAL").toString().replace("_", " ");
            const offeringCount = mp.offeringCount ?? 0;

            return (
              <div
                key={mp.id || code}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-2xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {name}
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-lg uppercase">
                      {category}
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded-lg">
                      {code}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap font-medium">
                    <span>CAS Number: <strong className="text-slate-900 font-bold">{cas}</strong></span>
                    {formula && (
                      <span>Molecular Formula: <strong className="text-slate-900 font-bold">{formula}</strong></span>
                    )}
                    <span>Verified Offerings: <strong className="text-slate-900 font-bold">{offeringCount}</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectMasterProduct(mp)}
                  className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  SELECT & ADD OFFERING
                </button>
              </div>
            );
          })
        ) : hasSearched && !isLoading ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <div>
              <p className="text-sm font-bold text-slate-900">Chemical Not Found in Master Catalog</p>
              <p className="text-xs text-slate-500 mt-1">
                Can&apos;t find the chemical compound you want to supply? Submit a proposal for review.
              </p>
            </div>
            <button
              type="button"
              onClick={onRequestNewChemical}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <FilePlus className="w-4 h-4" />
              Request New Chemical
            </button>
          </div>
        ) : null}
      </div>

      {/* Footer Banner */}
      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3 text-xs text-blue-900">
        <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">KemKendra Master Catalog System:</strong> Master product identity (CAS, name, category) is managed centrally. You control your commercial offering details (price, stock, purity, grade, MOQ).
        </div>
      </div>
    </div>
  );
}
