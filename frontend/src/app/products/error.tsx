"use client";

import { useEffect } from "react";
import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Products catalog error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased">
      <Navbar />
      
      <main className="flex-1 py-24 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold text-[#0A192F] mb-3">
            Unable to load catalog
          </h2>
          
          <p className="text-slate-500 mb-8 text-[15px]">
            We encountered an issue fetching the product catalog. Please try again. If the problem persists, contact procurement support.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => reset()}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors shadow-lg"
            >
              Try again
            </button>
            <a
              href="mailto:support@synthora.com"
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
