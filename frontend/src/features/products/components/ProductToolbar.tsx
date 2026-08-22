"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { X, RotateCcw, SlidersHorizontal, ArrowUpDown } from "lucide-react";

interface ProductToolbarProps {
  totalResults: number;
}

const CATEGORY_NAMES: Record<string, string> = {
  API: "API",
  INTERMEDIATE: "Intermediates",
  EXCIPIENT: "Excipients",
  SOLVENT: "Solvents",
  SPECIALTY_CHEMICAL: "Specialty Chemicals",
  LAB_CHEMICAL: "Lab Chemicals",
};

export function ProductToolbar({ totalResults }: ProductToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const removeParam = useCallback(
    (name: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(name);
      params.set("page", "0");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const clearAll = () => {
    router.push(pathname);
  };

  // Build active filter badges
  const activeChips: { key: string; label: string }[] = [];

  const search = searchParams.get("search");
  if (search) activeChips.push({ key: "search", label: `Search: "${search}"` });

  const category = searchParams.get("category");
  if (category) {
    activeChips.push({
      key: "category",
      label: `Category: ${CATEGORY_NAMES[category] || category.replace(/_/g, " ")}`,
    });
  }

  const casNumber = searchParams.get("casNumber");
  if (casNumber) activeChips.push({ key: "casNumber", label: `CAS: ${casNumber}` });

  const purityMin = searchParams.get("purityMin");
  if (purityMin) activeChips.push({ key: "purityMin", label: `Min Purity: ${purityMin}%` });

  const purityMax = searchParams.get("purityMax");
  if (purityMax) activeChips.push({ key: "purityMax", label: `Max Purity: ${purityMax}%` });

  const grade = searchParams.get("grade");
  if (grade) activeChips.push({ key: "grade", label: `Grade: ${grade}` });

  const maxPrice = searchParams.get("maxPrice");
  if (maxPrice) activeChips.push({ key: "maxPrice", label: `Max Price: ${maxPrice}` });

  const moqMax = searchParams.get("moqMax");
  if (moqMax) activeChips.push({ key: "moqMax", label: `Max MOQ: ${moqMax} kg` });

  const maxLeadTime = searchParams.get("maxLeadTime");
  if (maxLeadTime) activeChips.push({ key: "maxLeadTime", label: `Lead Time: ≤ ${maxLeadTime}d` });

  if (searchParams.get("inStock") === "true") {
    activeChips.push({ key: "inStock", label: "In Stock Only" });
  }

  if (searchParams.get("verified") === "true") {
    activeChips.push({ key: "verified", label: "Verified Suppliers Only" });
  }

  if (searchParams.get("coa") === "true") {
    activeChips.push({ key: "coa", label: "COA Available" });
  }

  if (searchParams.get("msds") === "true") {
    activeChips.push({ key: "msds", label: "MSDS / SDS" });
  }

  if (searchParams.get("exportReady") === "true") {
    activeChips.push({ key: "exportReady", label: "Export Ready" });
  }

  return (
    <div className="bg-white px-5 sm:px-6 py-4 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-3">
      {/* Top Header Row: Count + Sort Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-[#091E42] tracking-tight">
              {totalResults} {totalResults === 1 ? "Chemical Found" : "Chemicals Found"}
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
            Matching your current procurement criteria
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label
            htmlFor="catalog-sort-select"
            className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1"
          >
            <ArrowUpDown className="w-3 h-3 text-[#64748B]" />
            Sort:
          </label>
          <select
            id="catalog-sort-select"
            value={searchParams.get("sort") || ""}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="h-9.5 px-3 bg-[#F8FAFC] hover:bg-white border border-[#CBD5E1] text-[#091E42] text-xs font-semibold rounded-xl focus:outline-none focus:border-[#0052CC] cursor-pointer transition-all shadow-2xs"
            aria-label="Sort chemicals"
          >
            <option value="">Best Match</option>
            <option value="name,asc">Chemical Name (A–Z)</option>
            <option value="name,desc">Chemical Name (Z–A)</option>
            <option value="createdAt,desc">Recently Added</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips Strip */}
      {activeChips.length > 0 && (
        <div className="pt-2.5 border-t border-[#F1F5F9] flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mr-1">
            Active:
          </span>

          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#DEEBFF] text-[#0747A6] border border-[#B3D4FF]"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={() => removeParam(chip.key)}
                className="p-0.5 hover:bg-[#B3D4FF] rounded-md transition-colors"
                aria-label={`Remove filter ${chip.label}`}
              >
                <X className="w-3 h-3 text-[#0747A6]" />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#64748B] hover:text-[#0052CC] transition-colors ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear all filters</span>
          </button>
        </div>
      )}
    </div>
  );
}
