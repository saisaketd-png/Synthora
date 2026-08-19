"use client";

import { Filter, SlidersHorizontal, ArrowUpDown } from "lucide-react";

export interface ComparisonFilterState {
  maxPrice: string;
  minPurity: string;
  maxMoq: string;
  maxLeadTime: string;
  coaOnly: boolean;
  msdsOnly: boolean;
  sortBy: "price_asc" | "purity_desc" | "moq_asc" | "lead_time_asc";
}

interface OfferingComparisonFiltersProps {
  filters: ComparisonFilterState;
  onChange: (newFilters: ComparisonFilterState) => void;
  onReset: () => void;
}

export function OfferingComparisonFilters({
  filters,
  onChange,
  onReset,
}: OfferingComparisonFiltersProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          Filter & Compare Offerings
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
        {/* Sort Option */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value as any })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          >
            <option value="price_asc">Lowest Price</option>
            <option value="purity_desc">Highest Purity</option>
            <option value="moq_asc">Lowest MOQ</option>
            <option value="lead_time_asc">Shortest Lead Time</option>
          </select>
        </div>

        {/* Max Price */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Max Unit Price (₹ / kg)
          </label>
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
            placeholder="e.g. 150"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        {/* Min Purity */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Min Purity (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={filters.minPurity}
            onChange={(e) => onChange({ ...filters, minPurity: e.target.value })}
            placeholder="e.g. 99.0"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        {/* Max MOQ */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Max MOQ (kg)
          </label>
          <input
            type="number"
            value={filters.maxMoq}
            onChange={(e) => onChange({ ...filters, maxMoq: e.target.value })}
            placeholder="e.g. 50"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>
      </div>

      {/* Compliance Checkboxes */}
      <div className="pt-2 border-t border-slate-100 flex items-center gap-6 text-xs font-semibold">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.coaOnly}
            onChange={(e) => onChange({ ...filters, coaOnly: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <span>COA Available Only</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.msdsOnly}
            onChange={(e) => onChange({ ...filters, msdsOnly: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <span>MSDS / SDS Available Only</span>
        </label>
      </div>
    </div>
  );
}
