import Link from "next/link";
import { ProductQueryParams } from "../types/product";

interface ProductPaginationProps {
  queryParams: ProductQueryParams;
  totalElements: number;
  currentCount: number;
}

export function ProductPagination({ queryParams, totalElements, currentCount }: ProductPaginationProps) {
  const currentPage = queryParams.page || 0;
  const pageSize = queryParams.size || 20;
  const hasNext = currentCount >= pageSize;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 pt-6 gap-4">
      <p className="text-[13px] text-slate-500">
        Showing <span className="font-bold text-slate-900">{currentCount}</span> of <span className="font-bold text-slate-900">{totalElements}</span> results
      </p>
      <div className="flex items-center gap-2">
        <Link 
          href={`?page=${Math.max(0, currentPage - 1)}`} 
          className={`px-4 py-2 border border-slate-200 rounded-full text-[13px] font-bold ${currentPage === 0 ? 'text-slate-400 pointer-events-none bg-slate-50' : 'text-slate-700 hover:bg-slate-50 transition-colors'}`}
          aria-disabled={currentPage === 0}
        >
          Previous
        </Link>
        <Link 
          href={`?page=${currentPage + 1}`} 
          className={`px-4 py-2 border border-slate-200 rounded-full text-[13px] font-bold ${!hasNext ? 'text-slate-400 pointer-events-none bg-slate-50' : 'text-slate-700 hover:bg-slate-50 transition-colors'}`}
          aria-disabled={!hasNext}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
