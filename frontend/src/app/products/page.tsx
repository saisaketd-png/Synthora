import { Metadata } from "next";
import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { getProducts } from "@/features/products/api/getProducts";
import { searchProducts } from "@/features/products/api/searchProducts";

import { ProductPage, ProductQueryParams, ProductSearchResponse } from "@/features/products/types/product";
import { ProductFilters } from "@/features/products/components/ProductFilters";
import { ProductToolbar } from "@/features/products/components/ProductToolbar";
import { ProductCatalogTable } from "@/features/products/components/ProductCatalogTable";
import { ProductEmptyState } from "@/features/products/components/ProductEmptyState";
import { ProductPagination } from "@/features/products/components/ProductPagination";
import { ProductCatalogHero } from "@/features/products/components/ProductCatalogHero";
import { ProductSupplierResults } from "@/features/products/components/ProductSupplierResults";
import { getUniqueCategories, getUniqueCountries } from "@/features/products/utils/extractFilters";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Product Catalog | Synthora",
  description: "Browse APIs, pharmaceutical intermediates, specialty chemicals, and solvents from verified global suppliers. Search by CAS number, compare specifications, and request quotations.",
};

export default async function ProductsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  // Parse search params
  const queryParams: ProductQueryParams = {
    page: typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 0,
    size: typeof searchParams.size === "string" ? parseInt(searchParams.size, 10) : 20,
    search: typeof searchParams.search === "string" ? searchParams.search : undefined,
    category: typeof searchParams.category === "string" ? searchParams.category : undefined,
    country: typeof searchParams.country === "string" ? searchParams.country : undefined,
    verified: searchParams.verified === "true",
    purityMin: typeof searchParams.purityMin === "string" ? searchParams.purityMin : undefined,
    purityMax: typeof searchParams.purityMax === "string" ? searchParams.purityMax : undefined,
    availability: typeof searchParams.availability === "string" ? searchParams.availability : undefined,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : undefined,
  };

  const searchQuery = queryParams.search;

  // Fetch all data concurrently with Promise.allSettled
const [productsResult, searchResult] = await Promise.allSettled([
  getProducts(queryParams),
  searchQuery ? searchProducts(searchQuery) : Promise.resolve(null)
]);

  // Handle generic product catalog
  let productPage: ProductPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: queryParams.size || 20 };
  if (productsResult.status === "fulfilled" && productsResult.value) {
    productPage = productsResult.value;
  }
  const products = productPage.content || [];
  const totalElements = productPage.totalElements || 0;

  // Handle specific product search
  let searchResponse: ProductSearchResponse | null = null;
  if (searchQuery && searchResult.status === "fulfilled" && searchResult.value) {
    searchResponse = searchResult.value;
  }

  // Categories & Countries fallback
 const categories = getUniqueCategories(products);
const countries = getUniqueCountries(products);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased">
      <Navbar />
      
      <main className="flex-1 py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[13px] font-medium text-slate-500 mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900" aria-current="page">Products</span>
          </nav>

          {/* New Catalog Hero replacing the generic header */}
          <ProductCatalogHero categories={categories} />

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Filter Rail (3/12) */}
            <div className="w-full lg:w-3/12 max-w-sm shrink-0">
              <ProductFilters categories={categories} countries={countries} />
            </div>

            {/* Main Content Area (9/12) */}
            <div className="w-full lg:w-9/12 flex-1 min-w-0">
              
              {searchQuery && searchResponse?.mode === "EXACT" ? (
                // --- SEARCH RESULTS MODE ---
                <ProductSupplierResults searchResponse={searchResponse} />
              ) : (
                // --- GENERIC CATALOG MODE ---
                <>
                  <ProductToolbar totalResults={totalElements} />
                  
                  {products.length === 0 ? (
                    <ProductEmptyState />
                  ) : (
                    <section className="space-y-6" aria-label="Product listings">
                      <ProductCatalogTable products={products} />
                      
                      <ProductPagination 
                        queryParams={queryParams} 
                        totalElements={totalElements} 
                        currentCount={products.length} 
                      />
                    </section>
                  )}
                </>
              )}
              
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
