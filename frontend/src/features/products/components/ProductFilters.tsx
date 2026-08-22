"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  X,
  Search,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FlaskConical,
  BadgePercent,
  CircleDollarSign,
  Clock,
  FileCheck2,
} from "lucide-react";

interface ProductFiltersProps {
  categories?: string[];
  countries?: string[];
}

const CANONICAL_CATEGORIES = [
  { value: "API", label: "Active Pharmaceutical Ingredients (API)", short: "APIs" },
  { value: "INTERMEDIATE", label: "Pharma Intermediates", short: "Intermediates" },
  { value: "EXCIPIENT", label: "Pharmaceutical Excipients", short: "Excipients" },
  { value: "SOLVENT", label: "Solvents & Reagents", short: "Solvents" },
  { value: "SPECIALTY_CHEMICAL", label: "Specialty Chemicals", short: "Specialties" },
  { value: "LAB_CHEMICAL", label: "Laboratory Chemicals", short: "Lab Chemicals" },
];

const GRADE_OPTIONS = [
  { value: "", label: "All Grades" },
  { value: "USP", label: "USP (United States Pharmacopeia)" },
  { value: "BP", label: "BP (British Pharmacopoeia)" },
  { value: "EP", label: "EP / Ph. Eur. (European Pharmacopoeia)" },
  { value: "IP", label: "IP (Indian Pharmacopoeia)" },
  { value: "Pharma", label: "Pharmaceutical Grade" },
  { value: "Analytical", label: "Analytical / AR Grade" },
  { value: "Technical", label: "Technical / Industrial Grade" },
];

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // Collapsible section state
  const [sectionsOpen, setSectionsOpen] = useState({
    search: true,
    category: true,
    quality: true,
    commercial: true,
    availability: true,
    compliance: true,
  });

  const toggleSection = (key: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [key]: !prev [key] }));
  };

  // Local form state
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
  const [localCas, setLocalCas] = useState(searchParams.get("casNumber") || "");
  const [localPurityMin, setLocalPurityMin] = useState(searchParams.get("purityMin") || "");
  const [localPurityMax, setLocalPurityMax] = useState(searchParams.get("purityMax") || "");
  const [localGrade, setLocalGrade] = useState(searchParams.get("grade") || "");
  const [localMaxPrice, setLocalMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [localMoqMax, setLocalMoqMax] = useState(searchParams.get("moqMax") || "");
  const [localMaxLead, setLocalMaxLead] = useState(searchParams.get("maxLeadTime") || "");

  // Sync local state when URL searchParams change (browser navigation / external clicks)
  useEffect(() => {
    setLocalSearch(searchParams.get("search") || "");
    setLocalCas(searchParams.get("casNumber") || "");
    setLocalPurityMin(searchParams.get("purityMin") || "");
    setLocalPurityMax(searchParams.get("purityMax") || "");
    setLocalGrade(searchParams.get("grade") || "");
    setLocalMaxPrice(searchParams.get("maxPrice") || "");
    setLocalMoqMax(searchParams.get("moqMax") || "");
    setLocalMaxLead(searchParams.get("maxLeadTime") || "");
  }, [searchParams]);

  const updateParam = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value.trim()) {
        params.set(name, value.trim());
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
    setLocalGrade("");
    setLocalMaxPrice("");
    setLocalMoqMax("");
    setLocalMaxLead("");
  };

  // Compute active filter count
  const activeKeys = [
    "search",
    "category",
    "casNumber",
    "purityMin",
    "purityMax",
    "grade",
    "maxPrice",
    "moqMax",
    "maxLeadTime",
    "inStock",
    "verified",
    "coa",
    "msds",
    "exportReady",
  ];

  const activeFilterCount = activeKeys.reduce((count, key) => {
    return searchParams.get(key) ? count + 1 : count;
  }, 0);

  const hasActiveFilters = activeFilterCount > 0;

  const FilterContent = (
    <div className="space-y-5 text-[#1E293B]">
      {/* Header with Active Filter Count & Reset */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#0052CC]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#091E42]">
              Filter Catalog
            </h2>
          </div>
          {hasActiveFilters ? (
            <span className="text-xs text-[#0052CC] font-semibold mt-0.5 block">
              {activeFilterCount} {activeFilterCount === 1 ? "criterion applied" : "criteria applied"}
            </span>
          ) : (
            <span className="text-[11px] text-[#64748B] font-medium mt-0.5 block">
              Refine active inventory
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0052CC] hover:text-[#0747A6] hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 1. SEARCH GROUP */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={() => toggleSection("search")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B] hover:text-[#091E42]"
        >
          <span className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-[#64748B]" /> Chemical Identification
          </span>
          {sectionsOpen.search ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {sectionsOpen.search && (
          <div className="space-y-2 pt-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onBlur={() => updateParam("search", localSearch)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateParam("search", localSearch);
                }}
                placeholder="Name or formula (e.g. C8H9NO2)"
                className="w-full h-10 pl-8.5 pr-3 bg-[#F8FAFC] hover:bg-white focus:bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#091E42] font-medium placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0052CC] transition-all shadow-2xs"
              />
            </div>

            <input
              type="text"
              value={localCas}
              onChange={(e) => setLocalCas(e.target.value)}
              onBlur={() => updateParam("casNumber", localCas)}
              onKeyDown={(e) => {
                if (e.key === "Enter") updateParam("casNumber", localCas);
              }}
              placeholder="CAS Number (e.g. 103-90-2)"
              className="w-full h-10 px-3 bg-[#F8FAFC] hover:bg-white focus:bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-mono text-[#091E42] font-medium placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0052CC] transition-all shadow-2xs"
            />
          </div>
        )}
      </div>

      {/* 2. CATEGORY GROUP */}
      <div className="space-y-2.5 pt-3.5 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => toggleSection("category")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B] hover:text-[#091E42]"
        >
          <span className="flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-[#64748B]" /> Category
          </span>
          {sectionsOpen.category ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {sectionsOpen.category && (
          <div className="space-y-1 pt-1 max-h-52 overflow-y-auto pr-1">
            <label className="flex items-center gap-2.5 cursor-pointer py-1 text-xs sm:text-sm font-medium text-[#334155] hover:text-[#091E42]">
              <input
                type="radio"
                name="filter_category"
                checked={!searchParams.get("category")}
                onChange={() => updateParam("category", "")}
                className="w-4 h-4 text-[#0052CC] border-[#CBD5E1] focus:ring-0 cursor-pointer"
              />
              <span className="font-semibold text-[#091E42]">All Categories</span>
            </label>

            {CANONICAL_CATEGORIES.map((cat) => (
              <label
                key={cat.value}
                className="flex items-center gap-2.5 cursor-pointer py-1 text-xs sm:text-sm font-medium text-[#334155] hover:text-[#091E42]"
              >
                <input
                  type="radio"
                  name="filter_category"
                  checked={searchParams.get("category") === cat.value}
                  onChange={() => updateParam("category", cat.value)}
                  className="w-4 h-4 text-[#0052CC] border-[#CBD5E1] focus:ring-0 cursor-pointer"
                />
                <span className="truncate">{cat.label}</span>
              </label>
            ))}

            {/* Contract Manufacturing (COMING SOON) */}
            <div className="flex items-center justify-between py-1.5 px-2 mt-1 rounded-lg bg-[#F1F5F9] text-[#64748B] text-xs">
              <span className="font-medium">Contract Manufacturing</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#E2E8F0] text-[#475569]">
                COMING SOON
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. QUALITY & SPECIFICATIONS GROUP */}
      <div className="space-y-2.5 pt-3.5 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => toggleSection("quality")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B] hover:text-[#091E42]"
        >
          <span className="flex items-center gap-1.5">
            <BadgePercent className="w-3.5 h-3.5 text-[#64748B]" /> Quality & Grade
          </span>
          {sectionsOpen.quality ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {sectionsOpen.quality && (
          <div className="space-y-2.5 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-[#64748B] font-semibold block mb-1">
                  Min Purity %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={localPurityMin}
                  onChange={(e) => setLocalPurityMin(e.target.value)}
                  onBlur={() => updateParam("purityMin", localPurityMin)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") updateParam("purityMin", localPurityMin);
                  }}
                  placeholder="e.g. 98.0"
                  className="w-full h-10 px-2.5 bg-[#F8FAFC] hover:bg-white focus:bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#091E42] font-medium placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0052CC] transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#64748B] font-semibold block mb-1">
                  Max Purity %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={localPurityMax}
                  onChange={(e) => setLocalPurityMax(e.target.value)}
                  onBlur={() => updateParam("purityMax", localPurityMax)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") updateParam("purityMax", localPurityMax);
                  }}
                  placeholder="e.g. 99.9"
                  className="w-full h-10 px-2.5 bg-[#F8FAFC] hover:bg-white focus:bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#091E42] font-medium placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0052CC] transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#64748B] font-semibold block mb-1">
                Pharmacopoeial / Purity Grade
              </label>
              <select
                value={localGrade}
                onChange={(e) => {
                  setLocalGrade(e.target.value);
                  updateParam("grade", e.target.value);
                }}
                className="w-full h-10 px-2.5 bg-[#F8FAFC] hover:bg-white focus:bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#091E42] font-medium focus:outline-none focus:border-[#0052CC] transition-all shadow-2xs cursor-pointer"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 4. COMMERCIAL TERMS GROUP */}
      <div className="space-y-2.5 pt-3.5 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => toggleSection("commercial")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B] hover:text-[#091E42]"
        >
          <span className="flex items-center gap-1.5">
            <CircleDollarSign className="w-3.5 h-3.5 text-[#64748B]" /> Commercial Terms
          </span>
          {sectionsOpen.commercial ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {sectionsOpen.commercial && (
          <div className="space-y-2 pt-1">
            <div>
              <label className="text-[11px] text-[#64748B] font-semibold block mb-1">
                Max Price / kg (INR / USD)
              </label>
              <input
                type="number"
                min="0"
                value={localMaxPrice}
                onChange={(e) => setLocalMaxPrice(e.target.value)}
                onBlur={() => updateParam("maxPrice", localMaxPrice)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateParam("maxPrice", localMaxPrice);
                }}
                placeholder="e.g. 500"
                className="w-full h-10 px-3 bg-[#F8FAFC] hover:bg-white focus:bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#091E42] font-medium placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0052CC] transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#64748B] font-semibold block mb-1">
                Max Minimum Order Qty (kg)
              </label>
              <input
                type="number"
                min="0"
                value={localMoqMax}
                onChange={(e) => setLocalMoqMax(e.target.value)}
                onBlur={() => updateParam("moqMax", localMoqMax)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateParam("moqMax", localMoqMax);
                }}
                placeholder="e.g. 100"
                className="w-full h-10 px-3 bg-[#F8FAFC] hover:bg-white focus:bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#091E42] font-medium placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0052CC] transition-all shadow-2xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. AVAILABILITY & LEAD TIME */}
      <div className="space-y-2.5 pt-3.5 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => toggleSection("availability")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B] hover:text-[#091E42]"
        >
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#64748B]" /> Availability & Lead Time
          </span>
          {sectionsOpen.availability ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {sectionsOpen.availability && (
          <div className="space-y-2.5 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer py-0.5 text-xs sm:text-sm font-medium text-[#334155] hover:text-[#091E42]">
              <input
                type="checkbox"
                checked={searchParams.get("inStock") === "true"}
                onChange={() => toggleBooleanParam("inStock")}
                className="w-4 h-4 text-[#0052CC] rounded border-[#CBD5E1] focus:ring-0 cursor-pointer"
              />
              <span>In Stock for Immediate Dispatch</span>
            </label>

            <div>
              <label className="text-[11px] text-[#64748B] font-semibold block mb-1">
                Max Lead Time (days)
              </label>
              <input
                type="number"
                min="1"
                value={localMaxLead}
                onChange={(e) => setLocalMaxLead(e.target.value)}
                onBlur={() => updateParam("maxLeadTime", localMaxLead)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateParam("maxLeadTime", localMaxLead);
                }}
                placeholder="e.g. 14"
                className="w-full h-10 px-3 bg-[#F8FAFC] hover:bg-white focus:bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#091E42] font-medium placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0052CC] transition-all shadow-2xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* 6. DOCUMENTATION & COMPLIANCE */}
      <div className="space-y-2.5 pt-3.5 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => toggleSection("compliance")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B] hover:text-[#091E42]"
        >
          <span className="flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-[#64748B]" /> Compliance & Docs
          </span>
          {sectionsOpen.compliance ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {sectionsOpen.compliance && (
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer py-0.5 text-xs sm:text-sm font-medium text-[#334155] hover:text-[#091E42]">
              <input
                type="checkbox"
                checked={searchParams.get("verified") === "true"}
                onChange={() => toggleBooleanParam("verified")}
                className="w-4 h-4 text-[#0052CC] rounded border-[#CBD5E1] focus:ring-0 cursor-pointer"
              />
              <span className="inline-flex items-center gap-1.5 font-bold text-[#006644]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00875A]" /> Verified Suppliers Only
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer py-0.5 text-xs sm:text-sm font-medium text-[#334155] hover:text-[#091E42]">
              <input
                type="checkbox"
                checked={searchParams.get("coa") === "true"}
                onChange={() => toggleBooleanParam("coa")}
                className="w-4 h-4 text-[#0052CC] rounded border-[#CBD5E1] focus:ring-0 cursor-pointer"
              />
              <span>Certificate of Analysis (COA)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer py-0.5 text-xs sm:text-sm font-medium text-[#334155] hover:text-[#091E42]">
              <input
                type="checkbox"
                checked={searchParams.get("msds") === "true"}
                onChange={() => toggleBooleanParam("msds")}
                className="w-4 h-4 text-[#0052CC] rounded border-[#CBD5E1] focus:ring-0 cursor-pointer"
              />
              <span>MSDS / SDS Available</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer py-0.5 text-xs sm:text-sm font-medium text-[#334155] hover:text-[#091E42]">
              <input
                type="checkbox"
                checked={searchParams.get("exportReady") === "true"}
                onChange={() => toggleBooleanParam("exportReady")}
                className="w-4 h-4 text-[#0052CC] rounded border-[#CBD5E1] focus:ring-0 cursor-pointer"
              />
              <span>Export Documentation Ready</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-white border border-[#CBD5E1] rounded-2xl text-sm font-bold text-[#091E42] shadow-sm hover:bg-[#F8FAFC] transition-colors"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#0052CC]" />
            <span>Filter Catalog</span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 text-xs bg-[#DEEBFF] text-[#0747A6] rounded-full font-bold">
                {activeFilterCount} Active
              </span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Desktop Sticky Rail (280–320px) */}
      <div className="hidden lg:block bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
        {FilterContent}
      </div>

      {/* Mobile Drawer / Bottom Sheet */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-[340px] max-w-full h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#0052CC]" />
                <span className="font-bold text-base text-[#091E42]">Filter Catalog</span>
                {hasActiveFilters && (
                  <span className="px-2 py-0.5 text-xs bg-[#DEEBFF] text-[#0747A6] rounded-md font-bold font-mono">
                    {activeFilterCount} Active
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#091E42] rounded-lg"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filter Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6">
              {FilterContent}
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2.5">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="h-11 px-4 bg-white border border-[#CBD5E1] text-[#091E42] text-xs font-semibold rounded-xl hover:bg-[#F1F5F9] transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 h-11 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <span>Apply Filters</span>
                {hasActiveFilters && <span>({activeFilterCount})</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
