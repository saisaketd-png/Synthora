import { FlaskConical } from "lucide-react";
import Link from "next/link";

export function ProductEmptyState() {
  return (
    <div className="w-full py-24 flex flex-col items-center justify-center text-center bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
        <FlaskConical className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-[#0A192F] mb-2">
        No products found
      </h3>
      <p className="text-[15px] text-slate-500 max-w-md mx-auto mb-8">
        We couldn't find any products matching your current filters. Try adjusting your search query or clearing all filters.
      </p>
      <Link
        href="/products"
        className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors shadow-lg"
      >
        Clear All Filters
      </Link>
    </div>
  );
}
