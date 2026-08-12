import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { getProducts } from "@/features/products/api/getProducts";
import { ProductPage, ProductQueryParams } from "@/features/products/types/product";
import { LeftFilterRail } from "@/features/products/components/LeftFilterRail";
import { ProductToolbar } from "@/features/products/components/ProductToolbar";
import { ProductCatalogTable } from "@/features/products/components/ProductCatalogTable";
import { ProductEmptyState } from "@/features/products/components/ProductEmptyState";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Parse search params
  const queryParams: ProductQueryParams = {
    page: typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 0,
    size: typeof searchParams.size === "string" ? parseInt(searchParams.size, 10) : 20,
    search: typeof searchParams.search === "string" ? searchParams.search : undefined,
    category: typeof searchParams.category === "string" ? searchParams.category : undefined,
    country: typeof searchParams.country === "string" ? searchParams.country : undefined,
    verified: searchParams.verified === "true",
    sort: typeof searchParams.sort === "string" ? searchParams.sort : undefined,
  };

  let productPage: ProductPage | null = null;
  
  try {
    productPage = await getProducts(queryParams);
  } catch (err) {
    console.error("Failed to fetch products for catalog", err);
    // Let error.tsx handle the boundary if we want to throw, or render empty state if we catch
    throw err; 
  }

  const products = productPage?.content || [];
  const totalElements = productPage?.totalElements || 0;

  // Extract dynamic filters (In a real app, these might come from an aggregation API endpoint)
  // Here we derive from the fetched list for the current page as a fallback, or we can use fixed arrays
  // since extracting from page only shows categories for current page. Let's provide fixed typical categories
  // to avoid jumping filters, as per standard practice when aggregations are missing.
  const categories = [
    "API", "INTERMEDIATE", "SOLVENT", "SPECIALTY_CHEMICAL", "FINE_CHEMICAL", "AGROCHEMICAL"
  ];
  const countries = ["USA", "Germany", "India", "China", "Switzerland", "Japan", "UK"];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[13px] font-medium text-slate-500 mb-6">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900">Products</span>
          </nav>

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0A192F]">
                Product Catalog
              </h1>
              <p className="text-slate-500 mt-3 text-[15px] leading-relaxed">
                Search APIs, intermediates, solvents, and specialty chemicals from verified suppliers.
              </p>
            </div>
            
            <Link
              href="/rfq"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors shadow-lg shrink-0"
            >
              Submit RFQ
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Filter Rail (3/12) */}
            <div className="w-full lg:w-3/12 max-w-sm shrink-0">
              <LeftFilterRail categories={categories} countries={countries} />
            </div>

            {/* Catalog Area (9/12) */}
            <div className="w-full lg:w-9/12 flex-1 min-w-0">
              <ProductToolbar totalResults={totalElements} />

              {products.length === 0 ? (
                <ProductEmptyState />
              ) : (
                <div className="space-y-6">
                  <ProductCatalogTable products={products} />
                  
                  {/* Pagination placeholder (server driven via params in reality) */}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-6">
                    <p className="text-[13px] text-slate-500">
                      Showing <span className="font-bold text-slate-900">{products.length}</span> of <span className="font-bold text-slate-900">{totalElements}</span> results
                    </p>
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`?page=${Math.max(0, queryParams.page! - 1)}`} 
                        className={`px-4 py-2 border border-slate-200 rounded-full text-[13px] font-bold ${queryParams.page === 0 ? 'text-slate-400 pointer-events-none' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        Previous
                      </Link>
                      <Link 
                        href={`?page=${queryParams.page! + 1}`} 
                        className={`px-4 py-2 border border-slate-200 rounded-full text-[13px] font-bold ${products.length < (queryParams.size || 20) ? 'text-slate-400 pointer-events-none' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        Next
                      </Link>
                    </div>
                  </div>
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
