"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search, Check, ChevronDown, X, Building2, ShieldCheck, Clock, AlertCircle } from "lucide-react";
import { getAdminSuppliersList } from "../api/adminCatalogApi";

export interface SupplierOption {
  id: number;
  name: string;
  companyName?: string;
  legalName?: string;
  tradeName?: string;
  city?: string;
  countryName?: string;
  countryCode?: string;
  businessType?: string;
  verified?: boolean;
  verificationStatus?: string;
}

interface SupplierSearchComboboxProps {
  value: number | "";
  onChange: (supplierId: number | "") => void;
  onSelectSupplier?: (supplier: SupplierOption | null) => void;
  initialSuppliers?: SupplierOption[];
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function SupplierSearchCombobox({
  value,
  onChange,
  onSelectSupplier,
  initialSuppliers = [],
  disabled = false,
  required = false,
  className = "",
}: SupplierSearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suppliers, setSuppliers] = useState<SupplierOption[]>(initialSuppliers);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Sync initial suppliers if provided
  useEffect(() => {
    if (initialSuppliers.length > 0) {
      setSuppliers(initialSuppliers);
    }
  }, [initialSuppliers]);

  // Load suppliers if list is empty
  const fetchSuppliers = useCallback(async (query = "") => {
    try {
      setLoading(true);
      const data = await getAdminSuppliersList(query);
      setSuppliers(data);
    } catch (err) {
      console.error("Failed to search suppliers", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load when opened if empty
  useEffect(() => {
    if (isOpen && suppliers.length === 0) {
      fetchSuppliers("");
    }
  }, [isOpen, suppliers.length, fetchSuppliers]);

  // Debounce search query over API when query changes
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      fetchSuppliers(searchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, fetchSuppliers]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Find currently selected supplier object
  const selectedSupplier = useMemo(() => {
    if (!value) return null;
    return suppliers.find((s) => s.id === Number(value)) || null;
  }, [value, suppliers]);

  // Filtered suppliers locally for snappy instantaneous display
  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return suppliers;
    const q = searchQuery.toLowerCase().trim();
    return suppliers.filter((s) => {
      const name = (s.companyName || s.name || "").toLowerCase();
      const legal = (s.legalName || "").toLowerCase();
      const city = (s.city || "").toLowerCase();
      const country = (s.countryName || "").toLowerCase();
      const type = (s.businessType || "").toLowerCase();
      return (
        name.includes(q) ||
        legal.includes(q) ||
        city.includes(q) ||
        country.includes(q) ||
        type.includes(q)
      );
    });
  }, [suppliers, searchQuery]);

  const handleSelect = (supplier: SupplierOption) => {
    onChange(supplier.id);
    if (onSelectSupplier) {
      onSelectSupplier(supplier);
    }
    setSearchQuery("");
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    if (onSelectSupplier) {
      onSelectSupplier(null);
    }
    setSearchQuery("");
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredSuppliers.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSuppliers.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredSuppliers.length) {
        handleSelect(filteredSuppliers[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listboxRef.current) {
      const el = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (el) {
        el.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  const getStatusBadge = (sup: SupplierOption) => {
    const isVerified = sup.verified || sup.verificationStatus === "VERIFIED";
    const status = (sup.verificationStatus || (isVerified ? "VERIFIED" : "PENDING")).toUpperCase();

    if (isVerified) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Verified
        </span>
      );
    }

    if (status === "UNDER_REVIEW") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
          <Clock className="w-3 h-3 text-blue-500" />
          Under Review
        </span>
      );
    }

    if (status === "DRAFT") {
      return (
        <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
          Draft
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
        Pending
      </span>
    );
  };

  const displayName = selectedSupplier
    ? selectedSupplier.companyName || selectedSupplier.name
    : "";

  return (
    <div ref={containerRef} className={`relative font-sans text-xs ${className}`}>
      {/* Combobox Trigger & Input Container */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
        className={`flex items-center justify-between w-full px-3 py-2 bg-white border rounded-xl transition-all cursor-pointer ${
          isOpen
            ? "border-slate-900 ring-1 ring-slate-900 shadow-xs"
            : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "bg-slate-100 cursor-not-allowed opacity-60" : ""}`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />

          {selectedSupplier && !isOpen ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="font-bold text-slate-900 truncate">
                {displayName}
              </span>
              {selectedSupplier.city && (
                <span className="text-slate-400 text-[11px] truncate hidden sm:inline">
                  • {selectedSupplier.city}
                </span>
              )}
              {getStatusBadge(selectedSupplier)}
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={
                selectedSupplier
                  ? `Selected: ${displayName} (type to change...)`
                  : "Search supplier by name, city, or business type..."
              }
              className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 outline-none text-xs font-medium"
            />
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {selectedSupplier && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isOpen ? "rotate-180 text-slate-900" : ""
            }`}
          />
        </div>
      </div>

      {/* Hidden input to enforce HTML form required check */}
      <input
        type="hidden"
        value={value || ""}
        required={required}
      />

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in-50 duration-100">
          <ul
            ref={listboxRef}
            role="listbox"
            className="max-h-60 overflow-y-auto divide-y divide-slate-100 py-1"
          >
            {loading && suppliers.length === 0 ? (
              <li className="px-4 py-6 text-center text-slate-400">
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Searching verified suppliers...</span>
              </li>
            ) : filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier, index) => {
                const isSelected = supplier.id === Number(value);
                const isHighlighted = index === highlightedIndex;
                const name = supplier.companyName || supplier.name;

                return (
                  <li
                    key={supplier.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(supplier)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isHighlighted
                        ? "bg-slate-50"
                        : isSelected
                        ? "bg-slate-50/70"
                        : "hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 truncate">
                          {name}
                        </span>
                        {supplier.legalName && supplier.legalName !== name && (
                          <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                            ({supplier.legalName})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        {supplier.city && <span>{supplier.city}</span>}
                        {supplier.city && supplier.countryName && <span>•</span>}
                        {supplier.countryName && <span>{supplier.countryName}</span>}
                        {(supplier.city || supplier.countryName) && supplier.businessType && <span>•</span>}
                        {supplier.businessType && (
                          <span className="uppercase text-[10px] tracking-wider text-slate-400 font-bold">
                            {supplier.businessType}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(supplier)}
                      {isSelected && (
                        <Check className="w-4 h-4 text-slate-900" />
                      )}
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-6 text-center text-slate-400 space-y-1">
                <p className="font-medium text-slate-700">No suppliers found</p>
                <p className="text-[11px] text-slate-400">
                  {searchQuery ? `No matches for "${searchQuery}".` : "No suppliers are registered on the platform."}
                </p>
              </li>
            )}
          </ul>

          {/* Footer showing count */}
          <div className="px-3.5 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>{filteredSuppliers.length} supplier{filteredSuppliers.length === 1 ? "" : "s"} available</span>
            <span>Use ↑↓ arrows and Enter to select</span>
          </div>
        </div>
      )}
    </div>
  );
}
