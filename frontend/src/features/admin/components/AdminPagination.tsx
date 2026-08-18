import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
  page: number; // 0-indexed Spring Data page
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  disabled?: boolean;
}

export function AdminPagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  disabled = false,
}: AdminPaginationProps) {
  if (totalElements === 0 || totalPages <= 1) {
    return null;
  }

  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalElements);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      <div className="text-xs sm:text-sm text-slate-500 font-medium">
        Showing <span className="font-bold text-slate-900">{startItem}</span> to{" "}
        <span className="font-bold text-slate-900">{endItem}</span> of{" "}
        <span className="font-bold text-slate-900">{totalElements}</span> results
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0 || disabled}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <span className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg">
          Page {page + 1} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1 || disabled}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
          aria-label="Next Page"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
