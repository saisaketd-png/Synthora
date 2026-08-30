import { Metadata } from "next";
import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { getSuppliers } from "@/features/suppliers/api";
import { SupplierSearchParams, SupplierDiscoveryResponse } from "@/features/suppliers/types";
import { SupplierSearch } from "@/features/suppliers/components/SupplierSearch";
import { SupplierFilters } from "@/features/suppliers/components/SupplierFilters";
import { SupplierCard } from "@/features/suppliers/components/SupplierCard";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Building2, ShieldCheck, RefreshCw } from "lucide-react";
import { PageHeader, EmptyState, ErrorState } from "@/shared/components/ui/SynthoraUI";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kemkendra.com";

export const metadata: Metadata = {
  title: "Supplier Directory | Verified Chemical Manufacturers | KemKendra",
  description: "Discover verified chemical manufacturers, request audits, and streamline your onboarding process with our audited supplier network.",
  alternates: {
    canonical: `${SITE_URL}/suppliers`,
  },
  openGraph: {
    title: "Verified Chemical Suppliers Directory | KemKendra",
    description: "Discover verified chemical manufacturers and audited suppliers on KemKendra.",
    url: `${SITE_URL}/suppliers`,
    siteName: "KemKendra",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verified Chemical Suppliers Directory | KemKendra",
    description: "Discover verified chemical manufacturers and audited suppliers on KemKendra.",
  },
};

export default async function SuppliersPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  const queryParams: SupplierSearchParams = {
    search: typeof searchParams.search === "string" ? searchParams.search : undefined,
    country: typeof searchParams.country === "string" ? searchParams.country : undefined,
    verified: searchParams.verified === "true" ? true : undefined,
    exportReady: searchParams.exportReady === "true" ? true : undefined,
    page: typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 0,
    size: typeof searchParams.size === "string" ? parseInt(searchParams.size, 10) : 10,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : "name,asc",
  };

  let response: SupplierDiscoveryResponse | null = null;
  let error: string | null = null;

  try {
    response = await getSuppliers(queryParams);
  } catch (err: any) {
    error = err.message || "Failed to load suppliers";
  }

  const suppliers = response?.content || [];
  const totalElements = response?.totalElements || 0;
  const totalPages = response?.totalPages || 0;
  const currentPage = queryParams.page || 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] font-sans text-[#0F172A] antialiased">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <PageHeader
            title="Supplier Directory"
            description="Discover verified chemical manufacturers, primary synthetic labs, and audited distributors for institutional procurement."
            badge={
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#EFF4FF] text-[#155EEF] border border-[#D1E0FF]">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Supplier Network
              </span>
            }
          />

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="w-full lg:w-1/4 max-w-sm shrink-0">
              <SupplierFilters />
            </div>

            {/* Main Content Area */}
            <div className="w-full lg:w-3/4 flex-1 min-w-0 space-y-6">
              <SupplierSearch />

              {error ? (
                <ErrorState
                  title="Unable to load supplier directory"
                  message={error}
                />
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
                    <span>Showing {suppliers.length} of {totalElements} registered suppliers</span>
                  </div>

                  {suppliers.length === 0 ? (
                    <EmptyState
                      icon={<Building2 className="w-6 h-6 text-[#94A3B8]" />}
                      title="No suppliers found"
                      description="Try adjusting your search query, country, or verification filter to discover suppliers."
                      action={
                        <Link
                          href="/suppliers"
                          className="px-4 py-2 text-xs font-bold text-white bg-[#155EEF] hover:bg-[#104EC6] rounded-xl transition-colors shadow-2xs"
                        >
                          Clear All Filters
                        </Link>
                      }
                    />
                  ) : (
                    <div className="space-y-4">
                      {suppliers.map((supplier) => (
                        <SupplierCard key={supplier.id} supplier={supplier} />
                      ))}
                    </div>
                  )}

                  {totalPages > 1 && (
                    <div className="flex justify-center pt-6">
                      <div className="flex items-center gap-2">
                        {currentPage > 0 ? (
                          <Link
                            href={{
                              pathname: "/suppliers",
                              query: { ...searchParams, page: currentPage - 1 },
                            }}
                            className="p-2 bg-white border border-[#E2E8F0] rounded-xl hover:bg-[#F8FAFC] text-[#0F172A] transition-colors shadow-2xs"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="p-2 bg-white border border-[#E2E8F0] text-[#CBD5E1] rounded-xl cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        )}

                        <span className="text-xs font-bold text-[#475569] px-4">
                          Page {currentPage + 1} of {totalPages}
                        </span>

                        {currentPage < totalPages - 1 ? (
                          <Link
                            href={{
                              pathname: "/suppliers",
                              query: { ...searchParams, page: currentPage + 1 },
                            }}
                            className="p-2 bg-white border border-[#E2E8F0] rounded-xl hover:bg-[#F8FAFC] text-[#0F172A] transition-colors shadow-2xs"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="p-2 bg-white border border-[#E2E8F0] text-[#CBD5E1] rounded-xl cursor-not-allowed"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
