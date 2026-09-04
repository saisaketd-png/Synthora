import { Metadata } from "next";
import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { CANONICAL_CATEGORIES, getCategoryCounts } from "@/features/categories/api/categoryApi";
import { getProducts } from "@/features/products/api/getProducts";
import { ProductPage, ProductQueryParams } from "@/features/products/types/product";
import { ProductCatalogTable } from "@/features/products/components/ProductCatalogTable";
import { ProductFilters } from "@/features/products/components/ProductFilters";
import { ProductToolbar } from "@/features/products/components/ProductToolbar";
import { ProductPagination } from "@/features/products/components/ProductPagination";
import { getUniqueCategories, getUniqueCountries } from "@/features/products/utils/extractFilters";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Clock, Factory, Layers, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kemkendra.online";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const categoryMeta = CANONICAL_CATEGORIES.find(
    (c) => c.id === resolvedParams.slug.toLowerCase() || c.key.toLowerCase() === resolvedParams.slug.toLowerCase()
  );

  if (!categoryMeta) {
    return {
      title: "Chemical Category | KemKendra",
      robots: { index: false, follow: true },
    };
  }

  const title = `${categoryMeta.name} | Verified Chemical Sourcing | KemKendra`;
  const description = categoryMeta.description;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/categories/${categoryMeta.id}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/categories/${categoryMeta.id}`,
      siteName: "KemKendra",
      type: "website",
    },
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const categoryMeta = CANONICAL_CATEGORIES.find(
    (c) => c.id === resolvedParams.slug.toLowerCase() || c.key.toLowerCase() === resolvedParams.slug.toLowerCase()
  );

  if (!categoryMeta) {
    notFound();
  }

  // If Contract Manufacturing (Coming Soon)
  if (categoryMeta.isComingSoon) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F7F9FC] font-sans text-[#0F172A] antialiased">
        <Navbar />
        <main className="flex-1 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-center">
            <nav className="flex items-center justify-center gap-2 text-xs font-semibold text-[#64748B] mb-8">
              <Link href="/" className="hover:text-[#155EEF]">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/categories" className="hover:text-[#155EEF]">Categories</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#0F172A] font-bold">{categoryMeta.name}</span>
            </nav>

            <div className="bg-white border border-[#DCE3EC] rounded-3xl p-10 sm:p-14 shadow-2xs space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-[#EFF4FF] border border-[#BFDBFE] text-[#155EEF] flex items-center justify-center mx-auto">
                <Factory className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" /> Coming Soon
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">
                  {categoryMeta.name}
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
                  Custom synthesis, formulation scaling, and verified CMO/CDMO manufacturing services will be introduced to KemKendra in a future phase.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/products"
                  className="px-6 py-2.5 bg-[#155EEF] hover:bg-[#104EC6] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
                >
                  Explore Active Chemical Catalog
                </Link>
                <Link
                  href="/categories"
                  className="px-6 py-2.5 bg-white border border-[#DCE3EC] hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-bold rounded-xl transition-colors"
                >
                  View All Categories
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Active Category Query
  const queryParams: ProductQueryParams = {
    page: typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page, 10) : 0,
    size: typeof resolvedSearchParams.size === "string" ? parseInt(resolvedSearchParams.size, 10) : 20,
    search: typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined,
    category: categoryMeta.key,
    casNumber: typeof resolvedSearchParams.casNumber === "string" ? resolvedSearchParams.casNumber : undefined,
    country: typeof resolvedSearchParams.country === "string" ? resolvedSearchParams.country : undefined,
    verified: resolvedSearchParams.verified === "true",
    purityMin: typeof resolvedSearchParams.purityMin === "string" ? resolvedSearchParams.purityMin : undefined,
    purityMax: typeof resolvedSearchParams.purityMax === "string" ? resolvedSearchParams.purityMax : undefined,
    moqMin: typeof resolvedSearchParams.moqMin === "string" ? resolvedSearchParams.moqMin : undefined,
    moqMax: typeof resolvedSearchParams.moqMax === "string" ? resolvedSearchParams.moqMax : undefined,
    inStock: resolvedSearchParams.inStock === "true",
    coa: resolvedSearchParams.coa === "true",
    msds: resolvedSearchParams.msds === "true",
    exportReady: resolvedSearchParams.exportReady === "true",
    sort: typeof resolvedSearchParams.sort === "string" ? resolvedSearchParams.sort : undefined,
  };

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
    // Graceful fallback
  }

  const products = productPage.content || [];
  const totalElements = productPage.totalElements || 0;
  const categories = getUniqueCategories(products);
  const countries = getUniqueCountries(products);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] font-sans text-[#0F172A] antialiased">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
            <Link href="/" className="hover:text-[#155EEF]">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
            <Link href="/categories" className="hover:text-[#155EEF]">Categories</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span className="text-[#0F172A] font-extrabold">{categoryMeta.name}</span>
          </nav>

          {/* Category Header */}
          <div className="bg-white border border-[#DCE3EC] rounded-3xl p-6 sm:p-8 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#155EEF] bg-[#EFF4FF] px-2.5 py-0.5 rounded-md">
                Canonical Category
              </span>
              <span className="text-xs font-mono font-bold text-[#64748B]">
                {totalElements} {totalElements === 1 ? "Product" : "Products"} Registered
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] tracking-tight">
              {categoryMeta.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-3xl leading-relaxed">
              {categoryMeta.description} Compare commercial availability, batch purity, and lead times from verified manufacturers.
            </p>
          </div>

          {/* Category Sourcing Workspace */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Refine Results Rail */}
            <div className="w-full lg:w-3/12 max-w-sm shrink-0">
              <ProductFilters categories={categories} countries={countries} />
            </div>

            {/* Results Area */}
            <div className="w-full lg:w-9/12 flex-1 min-w-0">
              <ProductToolbar totalResults={totalElements} />

              {products.length === 0 ? (
                <div className="bg-white border border-[#DCE3EC] p-10 rounded-2xl text-center shadow-2xs space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC] flex items-center justify-center text-[#64748B] mx-auto">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0F172A]">
                    No Products Found in this Category
                  </h3>
                  <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
                    No active master chemicals currently match your filter criteria in {categoryMeta.name}. Sourcing requests can be submitted through our custom RFQ desk.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/rfqs/new"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#155EEF] hover:bg-[#104EC6] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
                    >
                      Request Sourcing Quote
                    </Link>
                  </div>
                </div>
              ) : (
                <section className="space-y-6">
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
