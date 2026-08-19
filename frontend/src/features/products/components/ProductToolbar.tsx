"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ArrowUpDown, Layers } from "lucide-react";

interface ProductToolbarProps {
  totalResults: number;
}

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

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 sm:px-6 rounded-2xl border border-slate-200/80 shadow-xs">
      
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Layers className="w-4 h-4 text-slate-400" />
        <span>
          Showing <span className="font-extrabold text-slate-900 font-mono">{totalResults}</span> chemical products
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">Sort:</span>
        </div>

        <select
          value={searchParams.get("sort") || ""}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent block px-3 py-2 cursor-pointer shadow-2xs"
          aria-label="Sort products"
        >
          <option value="">Default (Newest)</option>
          <option value="name,asc">Product Name (A–Z)</option>
          <option value="name,desc">Product Name (Z–A)</option>
          <option value="productCode,asc">Product Code (Ascending)</option>
          <option value="price,asc">Price (Low to High)</option>
          <option value="price,desc">Price (High to Low)</option>
          <option value="createdAt,desc">Recently Added</option>
        </select>
      </div>
    </div>
  );
}
