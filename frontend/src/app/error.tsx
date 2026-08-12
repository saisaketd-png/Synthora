"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mb-6 border border-amber-500/20">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
        Unable to Load Product Marketplace
      </h1>
      <p className="text-sm sm:text-base text-[#475569] mt-2 max-w-md">
        We encountered a communication issue while fetching marketplace data. Please check backend connection or retry.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-[#0F3D91] hover:bg-[#0c3175] text-white font-medium text-sm rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F3D91]"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          className="px-6 py-3 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] font-medium text-sm rounded-lg transition-colors flex items-center justify-center min-h-[44px]"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
