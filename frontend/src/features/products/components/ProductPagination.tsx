import Link from "next/link";
import { ProductQueryParams } from "../types/product";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductPaginationProps {
  queryParams: ProductQueryParams;
  totalElements: number;
  currentCount: number;
}

export function ProductPagination({
  queryParams,
  totalElements,
  currentCount,
}: ProductPaginationProps) {
  const currentPage = queryParams.page || 0;
  const pageSize = queryParams.size || 20;
  const hasNext = currentCount >= pageSize;
  const startCount = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endCount = Math.min(totalElements, currentPage * pageSize + currentCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#E2E8F0] pt-6 gap-4">
      <p className="text-sm text-[#64748B] font-medium">
        Showing <strong className="font-bold text-[#091E42]">{startCount}–{endCount}</strong> of{" "}
        <strong className="font-bold text-[#091E42]">{totalElements}</strong> chemicals
      </p>

      <div className="flex items-center gap-2.5">
        <Link
          href={`?page=${Math.max(0, currentPage - 1)}`}
          className={`h-10 px-4 border border-[#CBD5E1] rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs ${
            currentPage === 0
              ? "text-[#94A3B8] pointer-events-none bg-[#F8FAFC] opacity-60"
              : "bg-white text-[#091E42] hover:bg-[#F1F5F9] hover:border-[#94A3B8]"
          }`}
          aria-disabled={currentPage === 0}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </Link>

        <Link
          href={`?page=${currentPage + 1}`}
          className={`h-10 px-4 border border-[#CBD5E1] rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs ${
            !hasNext
              ? "text-[#94A3B8] pointer-events-none bg-[#F8FAFC] opacity-60"
              : "bg-white text-[#091E42] hover:bg-[#F1F5F9] hover:border-[#94A3B8]"
          }`}
          aria-disabled={!hasNext}
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
