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
    searchParams.grade ||
    searchParams.maxPrice ||
    searchParams.moqMin ||
    searchParams.moqMax ||
    searchParams.maxLeadTime ||
    searchParams.inStock ||
    searchParams.verified ||
    searchParams.coa ||
    searchParams.msds ||
    searchParams.exportReady ||
    searchParams.country
  );

  return {
    title: searchParams.search
      ? `Search: "${searchParams.search}" | Chemical Catalog | KemKendra`
      : "Chemical Product Catalog | APIs, Intermediates & Solvents | KemKendra",
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
      title: "Chemical Product Catalog | KemKendra",
      description:
        "Global chemical B2B marketplace. Search APIs, pharmaceutical intermediates, and solvents with verified documentation.",
      url: "https://kemkendra.online/products",
      siteName: "KemKendra",
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
    grade: typeof searchParams.grade === "string" ? searchParams.grade : undefined,
    currency: typeof searchParams.currency === "string" ? searchParams.currency : undefined,
    maxPrice: typeof searchParams.maxPrice === "string" ? searchParams.maxPrice : undefined,
    moqMin: typeof searchParams.moqMin === "string" ? searchParams.moqMin : undefined,
    moqMax: typeof searchParams.moqMax === "string" ? searchParams.moqMax : undefined,
    maxLeadTime: typeof searchParams.maxLeadTime === "string" ? searchParams.maxLeadTime : undefined,
    minStock: typeof searchParams.minStock === "string" ? searchParams.minStock : undefined,
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans text-[#1E293B] antialiased">
      <Navbar />

      <main className="flex-1 py-8 sm:py-10">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
          {/* Breadcrumb Navigation */}
          <nav
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#64748B]"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-[#0052CC] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
            <span className="text-[#091E42] font-bold" aria-current="page">
              Chemical Catalog
            </span>
          </nav>

          {/* Operational Top Catalog Area */}
          <ProductCatalogHero categories={categories} />

          {/* Two-Column Discovery Layout with Sticky Filter Rail */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left Filter Rail (320px Sticky on Desktop) */}
            <aside className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pr-0 lg:pr-1">
              <ProductFilters categories={categories} countries={countries} />
            </aside>

            {/* Main Product Results Area */}
            <div className="w-full flex-1 min-w-0 space-y-6">
              <ProductToolbar totalResults={totalElements} />

              {products.length === 0 ? (
                <ProductEmptyState />
              ) : (
                <section className="space-y-6" aria-label="Chemical Catalog entries">
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
