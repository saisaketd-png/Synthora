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
    <div className="bg-white p-3.5 rounded-[8px] border border-[#E4E4E7] shadow-tactile-card space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-8 py-1.5 text-xs font-medium bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px] focus:bg-white focus:border-[#0052CC] focus:outline-hidden transition-all placeholder:text-[#94A3B8] text-[#0F172A]"
        />
        {localSearch && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[#94A3B8] hover:text-[#0F172A] transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Action Filters Slot */}
      {children && (
        <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E4E4E7]">
          {children}
          {onReset && (
            <button
              type="button"
              onClick={handleClear}
              className="h-8 px-2.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px] border border-[#E4E4E7] transition-colors cursor-pointer shadow-xs"
            >
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
