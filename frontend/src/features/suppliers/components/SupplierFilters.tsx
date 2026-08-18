"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";

export function SupplierFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCheckboxChange = (key: string, checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set(key, "true");
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/suppliers?${params.toString()}`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-bold text-slate-900">Filters</h3>
      </div>
      
      <div className="space-y-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={searchParams.get("verified") === "true"}
            onChange={(e) => handleCheckboxChange("verified", e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm text-slate-700 font-medium">Verified Supplier</span>
        </label>
        
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={searchParams.get("exportReady") === "true"}
            onChange={(e) => handleCheckboxChange("exportReady", e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm text-slate-700 font-medium">Export Ready</span>
        </label>
      </div>
    </div>
  );
}
