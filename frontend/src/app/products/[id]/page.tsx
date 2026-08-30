import { Metadata } from "next";
import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import {
  ShieldCheck,
  FlaskConical,
  ChevronRight,
  CheckCircle2,
  Atom,
  Layers,
  FileCheck,
  Info,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { fetchProductDetail } from "@/lib/api";
import { notFound } from "next/navigation";
import { Product } from "@/features/products/types/product";
import SupplierComparison from "@/features/products/components/SupplierComparison";
import { ProductDocuments } from "@/features/products/components/ProductDocuments";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kemkendra.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const product: Product = await fetchProductDetail(resolvedParams.id);
    const title = `${product.name} (CAS ${product.casNumber || "N/A"}) | Verified Chemical Suppliers | KemKendra`;
    const description =
      product.description ||
      `Source high-purity ${product.name} (CAS ${product.casNumber || "N/A"}) with verified documentation, COAs, and competitive pricing from verified chemical manufacturers on KemKendra.`;
    const canonicalCode = product.productCode || resolvedParams.id;

    return {
      title,
      description,
      alternates: {
        canonical: `${SITE_URL}/products/${canonicalCode}`,
      },
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/products/${canonicalCode}`,
        siteName: "KemKendra",
        type: "website",
        images: product.primaryImageUrl
          ? [
              {
                url: product.primaryImageUrl.startsWith("http")
                  ? product.primaryImageUrl
                  : `${API_URL}${product.primaryImageUrl}`,
                alt: `${product.name} chemical monograph sample`,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Chemical Product Details | KemKendra",
      description: "Chemical compound specifications and supplier procurement on KemKendra.",
      robots: { index: false, follow: true },
    };
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  let product: Product;

  try {
    product = await fetchProductDetail(resolvedParams.id);
  } catch (err) {
    notFound();
  }

  const canonicalCode = product.productCode || resolvedParams.id;
  const resolvedImageUrl = product.primaryImageUrl
    ? product.primaryImageUrl.startsWith("http")
      ? product.primaryImageUrl
      : `${API_URL}${product.primaryImageUrl}`
    : null;

  // Schema.org JSON-LD Structured Data for Chemical Compound
  const productJsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: resolvedImageUrl ? [resolvedImageUrl] : [],
    description: product.description || `Chemical specifications for ${product.name}`,
    category: product.category,
    sku: canonicalCode,
    identifier: product.casNumber
      ? {
          "@type": "PropertyValue",
          name: "CAS Registry Number",
          value: product.casNumber,
        }
      : undefined,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      offerCount: product.offeringCount || 1,
      availability: "https://schema.org/InStock",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Chemical Catalog",
        item: `${SITE_URL}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category ? product.category.replace(/_/g, " ") : "Chemicals",
        item: `${SITE_URL}/products?category=${encodeURIComponent(product.category || "API")}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: `${SITE_URL}/products/${canonicalCode}`,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans text-[#1E293B] antialiased">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Navbar />

      <main className="flex-1 py-5 sm:py-8 pb-24 lg:pb-8">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Breadcrumbs */}
          <nav
            className="flex items-center gap-2 text-xs font-semibold text-[#64748B] flex-wrap"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-[#0052CC] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
            <Link href="/products" className="hover:text-[#0052CC] transition-colors">
              Chemical Catalog
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
            {product.category && (
              <>
                <Link
                  href={`/products?category=${encodeURIComponent(product.category)}`}
                  className="hover:text-[#0052CC] transition-colors uppercase font-bold"
                >
                  {product.category.replace(/_/g, " ")}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </>
            )}
            <span className="text-[#091E42] font-bold truncate max-w-xs" aria-current="page">
              {product.name}
            </span>
          </nav>

          {/* 1. LARGE PROMINENT TWO-COLUMN CHEMICAL MONOGRAPH HERO */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              
              {/* Left: Prominent Product Image */}
              <div className="lg:col-span-5 w-full">
                <div className="relative w-full h-64 sm:h-80 md:h-[420px] rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:p-6 flex items-center justify-center overflow-hidden shadow-2xs">
                  {resolvedImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolvedImageUrl}
                      alt={`${product.name} canonical chemical monograph`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#94A3B8] space-y-2">
                      <FlaskConical className="w-16 h-16 stroke-1" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B]">
                        Canonical Compound Sample
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="bg-[#E3FCEF] text-[#006644] border border-[#ABF5D1] px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> CANONICAL MONOGRAPH
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Chemical Specification & Master Identity */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center gap-2 flex-wrap">
                  {product.category && (
                    <span className="text-xs font-bold text-[#0747A6] bg-[#DEEBFF] px-2.5 py-1 rounded-md font-mono uppercase">
                      {product.category.replace(/_/g, " ")}
                    </span>
                  )}
                  <span className="text-xs font-mono font-bold text-[#091E42] bg-[#F8FAFC] border border-[#CBD5E1] px-2.5 py-1 rounded-md">
                    CODE: {canonicalCode}
                  </span>
                  <span className="text-xs font-bold text-[#006644] bg-[#E3FCEF] border border-[#ABF5D1] px-2.5 py-1 rounded-md inline-flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" /> IDENTITY VERIFIED
                  </span>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#091E42] uppercase tracking-tight leading-tight">
                    {product.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-mono">
                    KemKendra Master Catalog Specification ID: {canonicalCode}
                  </p>
                </div>

                {/* Key Chemical Formula & CAS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-mono text-xs">
                  <div>
                    <span className="text-[#64748B] text-[10px] uppercase font-bold block">CAS Registry</span>
                    <strong className="text-sm font-bold text-[#091E42]">{product.casNumber || "N/A"}</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] text-[10px] uppercase font-bold block">Molecular Formula</span>
                    <strong className="text-sm font-bold text-[#091E42]">{product.molecularFormula || "N/A"}</strong>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[#64748B] text-[10px] uppercase font-bold block">Standard Purity</span>
                    <strong className="text-sm font-bold text-[#00875A]">{product.purity || "≥ 99.0%"}</strong>
                  </div>
                </div>

                {/* Chemical Description */}
                {product.description && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-[#091E42] uppercase tracking-wider">
                      Compound Overview
                    </h3>
                    <p className="text-sm text-[#475569] leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Procurement CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <Link
                    href={`/rfq?productId=${product.id}&productName=${encodeURIComponent(product.name)}`}
                    className="h-11 px-6 bg-[#0052CC] hover:bg-[#0747A6] text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>Request Quotation</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <a
                    href="#supplier-offerings"
                    className="h-11 px-5 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#091E42] text-sm font-semibold rounded-xl transition-colors flex items-center justify-center shadow-2xs"
                  >
                    View Supplier Offerings ({product.offeringCount || 0})
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* 2. PRIMARY MARKETPLACE SECTION: AVAILABLE FROM VERIFIED SUPPLIERS */}
          <div id="supplier-offerings" className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-7 shadow-sm space-y-4">
            <SupplierComparison
              productId={product.id || resolvedParams.id}
              productName={product.name}
            />
          </div>

          {/* 3. TECHNICAL SPECIFICATION GRID */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <Layers className="w-4 h-4 text-[#0052CC]" />
              <h2 className="text-xs sm:text-sm font-bold text-[#091E42] uppercase tracking-wider">
                Technical Information & Governance Monograph
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Category</span>
                <strong className="text-[#091E42] font-semibold">
                  {product.category ? product.category.replace(/_/g, " ") : "Specialty"}
                </strong>
              </div>
              <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">CAS Registry</span>
                <strong className="text-[#091E42] font-mono font-semibold">{product.casNumber || "N/A"}</strong>
              </div>
              <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Molecular Formula</span>
                <strong className="text-[#091E42] font-mono font-semibold">{product.molecularFormula || "N/A"}</strong>
              </div>
              <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Master Code</span>
                <strong className="text-[#091E42] font-mono font-semibold">{canonicalCode}</strong>
              </div>
              <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Governance Status</span>
                <strong className="text-[#00875A] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Canonical Record
                </strong>
              </div>
            </div>
          </div>

          {/* 4. CANONICAL PRODUCT DOCUMENTS */}
          <ProductDocuments
            productId={product.id || resolvedParams.id}
            isSeller={false}
          />

        </div>
      </main>

      {/* Sticky Mobile Action Bar (Fixed above bottom nav on mobile viewports) */}
      <div className="lg:hidden fixed bottom-[58px] left-0 right-0 z-30 bg-white border-t border-[#E2E8F0] p-3 shadow-lg flex items-center gap-2.5">
        <a
          href="#supplier-offerings"
          className="flex-1 h-11 px-3 bg-white border border-[#CBD5E1] text-[#091E42] text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center text-center shadow-2xs"
        >
          Suppliers ({product.offeringCount || 0})
        </a>
        <Link
          href={`/rfq?productId=${product.id}&productName=${encodeURIComponent(product.name)}`}
          className="flex-1 h-11 px-4 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99]"
        >
          <span>Request Quote</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <Footer />
    </div>
  );
}
