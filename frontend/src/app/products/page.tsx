import { Metadata } from "next";
import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { getProducts } from "@/features/products/api/getProducts";

import { ProductPage, ProductQueryParams } from "@/features/products/types/product";
import { ProductFilters } from "@/features/products/components/ProductFilters";
import { ProductToolbar } from "@/features/products/components/ProductToolbar";
import { ProductCatalogTable } from "@/features/products/components/ProductCatalogTable";
import { ProductEmptyState } from "@/features/products/components/ProductEmptyState";
import { ProductPagination } from "@/features/products/components/ProductPagination";
import { ProductCatalogHero } from "@/features/products/components/ProductCatalogHero";
import { getUniqueCategories, getUniqueCountries } from "@/features/products/utils/extractFilters";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const hasFilters = Boolean(
    searchParams.search ||
    searchParams.category ||
    searchParams.casNumber ||
    searchParams.purityMin ||
    searchParams.purityMax ||
    searchParams.moqMin ||
    searchParams.moqMax ||
    searchParams.inStock ||
    searchParams.coa ||
    searchParams.msds ||
    searchParams.country
  );

  return {
    title: searchParams.search
      ? `Search: "${searchParams.search}" | Chemical Catalog | Synthora`
      : "Chemical Product Catalog | APIs, Intermediates & Solvents | Synthora",
    description:
      "Browse and source pharmaceutical APIs, intermediates, specialty chemicals, and solvents from verified global suppliers. Compare CAS numbers, purity grades, and request quotes directly.",
    alternates: {
      canonical: "/products",
    },
    robots: {
      index: !hasFilters,
      follow: true,
    },
    openGraph: {
      title: "Chemical Product Catalog | Synthora",
      description:
        "Global chemical B2B marketplace. Search APIs, pharmaceutical intermediates, and solvents with verified documentation.",
      url: "https://synthora.com/products",
      siteName: "Synthora",
      type: "website",
    },
  };
}

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
    casNumber: typeof searchParams.casNumber === "string" ? searchParams.casNumber : undefined,
    country: typeof searchParams.country === "string" ? searchParams.country : undefined,
    verified: searchParams.verified === "true",
    purityMin: typeof searchParams.purityMin === "string" ? searchParams.purityMin : undefined,
    purityMax: typeof searchParams.purityMax === "string" ? searchParams.purityMax : undefined,
    moqMin: typeof searchParams.moqMin === "string" ? searchParams.moqMin : undefined,
    moqMax: typeof searchParams.moqMax === "string" ? searchParams.moqMax : undefined,
    inStock: searchParams.inStock === "true",
    coa: searchParams.coa === "true",
    msds: searchParams.msds === "true",
    exportReady: searchParams.exportReady === "true",
    availability: typeof searchParams.availability === "string" ? searchParams.availability : undefined,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : undefined,
  };

  // Fetch products from unified search/filter endpoint
  let productPage: ProductPage = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: queryParams.size || 20,
  };

  try {
    productPage = await getProducts(queryParams);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error loading products:", err);
    }
  }

  const products = productPage.content || [];
  const totalElements = productPage.totalElements || 0;

  // Categories & Countries fallback
  const categories = getUniqueCategories(products);
  const countries = getUniqueCountries(products);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans text-slate-900 antialiased">
      <Navbar />

      <main className="flex-1 py-8 sm:py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-2 text-xs font-semibold text-slate-500"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold" aria-current="page">
              Chemical Catalog
            </span>
          </nav>

          {/* Catalog Hero */}
          <ProductCatalogHero categories={categories} />

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Filter Rail */}
            <div className="w-full lg:w-3/12 max-w-sm shrink-0">
              <ProductFilters categories={categories} countries={countries} />
            </div>

            {/* Main Content Area */}
            <div className="w-full lg:w-9/12 flex-1 min-w-0">
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
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
