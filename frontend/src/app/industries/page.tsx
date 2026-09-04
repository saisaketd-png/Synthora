import { Metadata } from "next";
import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { IndustryGrid } from "@/features/home/components/IndustryGrid";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kemkendra.online";

export const metadata: Metadata = {
  title: "Industries | Chemical Sourcing | KemKendra",
  description: "Industry-specific chemical procurement taxonomy and specialized sector directories on KemKendra.",
  alternates: {
    canonical: `${SITE_URL}/industries`,
  },
};

export default function IndustriesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F5F7] font-sans text-[#172B4D]">
      <Navbar />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-6">
        <div className="border-b border-[#DFE1E6] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#091E42] tracking-tight">
                Industries & Sectors
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#DEEBFF] text-[#0747A6] border border-[#B3D4FF] uppercase flex items-center gap-1">
                <Clock className="w-3 h-3" /> Coming Soon
              </span>
            </div>
            <p className="text-xs text-[#5E6C84] mt-1">
              Sector-optimized procurement directories are currently in pilot expansion. Direct chemical sourcing is fully operational via the Chemical Catalog and Category Shortcuts.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-bold rounded transition-colors self-start sm:self-auto shrink-0"
          >
            <span>Explore Chemical Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <IndustryGrid />
      </main>
      <Footer />
    </div>
  );
}
