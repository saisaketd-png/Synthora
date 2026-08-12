"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { List, Grid, Download } from "lucide-react";

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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      
      <div className="text-sm font-semibold text-slate-700">
        Showing <span className="text-[#0A192F]">{totalResults}</span> results
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
        <button
          className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          aria-label="Export CSV"
          title="Export CSV (Coming Soon)"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>

        <select
          value={searchParams.get("sort") || ""}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-md focus:ring-blue-600 focus:border-blue-600 block px-3 py-2"
          aria-label="Sort products"
        >
          <option value="">Relevance</option>
          <option value="name,asc">Name A–Z</option>
          <option value="name,desc">Name Z–A</option>
          <option value="createdAt,desc">Newest</option>
          <option value="moq,asc">MOQ Low–High</option>
        </select>

        <div className="hidden lg:flex items-center gap-1 border-l border-slate-200 pl-3 ml-1">
          <button
            className="p-2 bg-slate-100 text-slate-900 rounded-md transition-colors shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
            aria-label="Table View"
            aria-pressed="true"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-colors cursor-not-allowed opacity-50"
            aria-label="Grid View"
            aria-pressed="false"
            title="Grid view coming soon"
            disabled
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
