"use client";

import React, { useState, useEffect } from "react";
import { Search, X, Filter } from "lucide-react";

interface AdminSearchFilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange: (value: string) => void;
  onReset?: () => void;
  children?: React.ReactNode;
  debounceMs?: number;
}

export function AdminSearchFilterBar({
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  onReset,
  children,
  debounceMs = 300,
}: AdminSearchFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);

  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== searchValue) {
        onSearchChange(localSearch);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [localSearch, debounceMs, onSearchChange, searchValue]);

  const handleClear = () => {
    setLocalSearch("");
    onSearchChange("");
    if (onReset) onReset();
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9.5 pr-8 py-2 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden transition-all placeholder:text-slate-400 text-slate-900"
        />
        {localSearch && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg absolute right-2 top-1/2 -translate-y-1/2"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Children & Reset */}
      {children && (
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </div>
          {children}
          {onReset && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
