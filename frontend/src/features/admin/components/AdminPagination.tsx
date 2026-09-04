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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2">
      <div className="text-xs text-[#64748B]">
        Showing <span className="font-mono font-bold text-[#0F172A]">{startItem}</span> to{" "}
        <span className="font-mono font-bold text-[#0F172A]">{endItem}</span> of{" "}
        <span className="font-mono font-bold text-[#0F172A]">{totalElements}</span> results
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0 || disabled}
          className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium text-[#475569] bg-white border border-[#E4E4E7] rounded-[6px] hover:bg-[#FAFAFA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <span className="h-8 px-3 inline-flex items-center text-xs font-mono font-semibold text-[#0F172A] bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px]">
          {page + 1} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1 || disabled}
          className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium text-[#475569] bg-white border border-[#E4E4E7] rounded-[6px] hover:bg-[#FAFAFA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
          aria-label="Next Page"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
