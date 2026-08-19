import { Metadata } from "next";
import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { getSuppliers } from "@/features/suppliers/api";
import { SupplierSearchParams, SupplierDiscoveryResponse } from "@/features/suppliers/types";
import { SupplierSearch } from "@/features/suppliers/components/SupplierSearch";
import { SupplierFilters } from "@/features/suppliers/components/SupplierFilters";
import { SupplierCard } from "@/features/suppliers/components/SupplierCard";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://synthora.com";

export const metadata: Metadata = {
  title: "Supplier Directory | Verified Chemical Manufacturers | Synthora",
  description: "Discover verified chemical manufacturers, request audits, and streamline your onboarding process with our audited supplier network.",
  alternates: {
    canonical: `${SITE_URL}/suppliers`,
  },
  openGraph: {
    title: "Verified Chemical Suppliers Directory | Synthora",
    description: "Discover verified chemical manufacturers and audited suppliers on Synthora.",
    url: `${SITE_URL}/suppliers`,
    siteName: "Synthora",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verified Chemical Suppliers Directory | Synthora",
    description: "Discover verified chemical manufacturers and audited suppliers on Synthora.",
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
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
              Supplier Directory
            </h1>
            <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">
              Discover verified chemical manufacturers, request audits, and streamline your onboarding process.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters */}
            <div className="w-full lg:w-1/4 max-w-sm shrink-0">
              <SupplierFilters />
            </div>

            {/* Main Content */}
            <div className="w-full lg:w-3/4 flex-1 min-w-0">
              <SupplierSearch />
              
              {error ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-sm font-medium">
                  {error}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                    <span>Showing {suppliers.length} of {totalElements} suppliers</span>
                  </div>

                  {suppliers.length === 0 ? (
                    <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">No suppliers found</h3>
                      <p className="text-slate-500 text-sm">
                        Try adjusting your search or filters to find what you're looking for.
                      </p>
                      <Link 
                        href="/suppliers" 
                        className="inline-block mt-4 text-sm font-bold text-teal-600 hover:text-teal-700"
                      >
                        Clear all filters
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {suppliers.map(supplier => (
                        <SupplierCard key={supplier.id} supplier={supplier} />
                      ))}
                    </div>
                  )}

                  {totalPages > 1 && (
                    <div className="flex justify-center pt-8">
                      <div className="flex items-center gap-2">
                        {currentPage > 0 ? (
                          <Link
                            href={{
                              pathname: "/suppliers",
                              query: { ...searchParams, page: currentPage - 1 }
                            }}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Link>
                        ) : (
                          <button disabled className="p-2 border border-slate-100 text-slate-300 rounded-lg cursor-not-allowed">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        )}
                        
                        <span className="text-sm font-medium text-slate-600 px-4">
                          Page {currentPage + 1} of {totalPages}
                        </span>

                        {currentPage < totalPages - 1 ? (
                          <Link
                            href={{
                              pathname: "/suppliers",
                              query: { ...searchParams, page: currentPage + 1 }
                            }}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        ) : (
                          <button disabled className="p-2 border border-slate-100 text-slate-300 rounded-lg cursor-not-allowed">
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
