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
import Image from "next/image";
import { fetchProductDetail } from "@/lib/api";
import { notFound } from "next/navigation";
import { Product } from "@/features/products/types/product";
import SupplierComparison from "@/features/products/components/SupplierComparison";
import { ProductDocuments } from "@/features/products/components/ProductDocuments";
import { serializeJsonLd } from "@/shared/utils/security";
import { getCategoryAbbreviation, getCategoryDisplayName } from "@/features/categories/utils/categoryUtils";
import { CANONICAL_CATEGORIES } from "@/features/categories/api/categoryApi";

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kemkendra.online";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const product: Product = await fetchProductDetail(resolvedParams.id);
    const title = `${product.name} | Specifications, Suppliers & Commercial Offerings | KemKendra`;
    const formulaPart = product.molecularFormula ? ` (${product.molecularFormula})` : "";
    const description =
      product.description ||
      `Explore ${product.name}, including CAS number ${product.casNumber || "N/A"}${formulaPart}, specifications, available supplier offerings, and quotation options on KemKendra.`;
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

  // Real commercial offers only when price is present
  const offers = product.price && product.price > 0
    ? {
        "@type": "Offer",
        price: product.price,
        priceCurrency: "INR",
        availability: (product.stock && product.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
        itemCondition: "https://schema.org/NewCondition",
        url: `${SITE_URL}/products/${canonicalCode}`,
      }
    : undefined;

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
    ...(offers ? { offers } : {}),
  };

  const matchedCategory = CANONICAL_CATEGORIES.find(
    (c) => c.key === product.category || c.id === product.category?.toLowerCase()
  );
  const categoryHref = matchedCategory ? `/categories/${matchedCategory.id}` : `/products?category=${encodeURIComponent(product.category || "API")}`;
  const categoryName = matchedCategory ? matchedCategory.name : (product.category ? product.category.replace(/_/g, " ") : "Chemicals");

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
        name: categoryName,
        item: `${SITE_URL}${categoryHref}`,
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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
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
                  href={categoryHref}
                  className="hover:text-[#0052CC] transition-colors uppercase font-bold"
                >
                  {categoryName}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </>
            )}
            <span className="text-[#091E42] font-bold truncate max-w-xs" aria-current="page">
              {product.name}
            </span>
          </nav>

          {/* 1. CHEMICAL MONOGRAPH HERO */}
          <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-5 sm:p-6 shadow-tactile-card">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              
              {/* Left: Product Image */}
              <div className="lg:col-span-5 w-full">
                <div className="relative w-full h-64 sm:h-80 md:h-[380px] rounded-[6px] border border-[#E4E4E7] bg-[#FAFAFA] p-4 sm:p-6 flex items-center justify-center overflow-hidden">
                  {resolvedImageUrl ? (
                    <Image
                      src={resolvedImageUrl}
                      alt={`${product.name} canonical chemical monograph`}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#64748B] space-y-2">
                      <FlaskConical className="w-12 h-12 stroke-1 text-[#0052CC]" />
                      <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#64748B]">
                        Canonical Compound Sample
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="bg-[#ECFDF5] text-[#059669] border border-[rgba(5,150,105,0.2)] px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> CANONICAL RECORD
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Chemical Specification & Master Identity */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {product.category && (
                    <span className="text-xs font-semibold text-[#0052CC] bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1 rounded-[4px] font-mono uppercase">
                      Category: {getCategoryAbbreviation(product.category)}
                    </span>
                  )}
                  <span className="text-xs font-mono font-semibold text-[#0F172A] bg-[#F4F4F5] border border-[#E4E4E7] px-2.5 py-1 rounded-[4px]">
                    Product Code: {canonicalCode}
                  </span>
                  <span className="text-xs font-semibold text-[#059669] bg-[#ECFDF5] border border-[rgba(5,150,105,0.2)] px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </span>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] uppercase tracking-tight leading-tight">
                    {product.name}
                  </h1>
                  <p className="text-xs text-[#64748B] mt-1 font-mono">
                    Product Code: {canonicalCode} &bull; Category: {getCategoryDisplayName(product.category)}
                  </p>
                </div>

                {/* Key Chemical Formula & CAS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px] font-mono text-xs">
                  <div>
                    <span className="text-[#64748B] text-[10px] uppercase font-semibold block">CAS Registry</span>
                    <strong className="text-sm font-semibold text-[#0F172A]">{product.casNumber || "N/A"}</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] text-[10px] uppercase font-semibold block">Molecular Formula</span>
                    <strong className="text-sm font-semibold text-[#0F172A]">{product.molecularFormula || "N/A"}</strong>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[#64748B] text-[10px] uppercase font-semibold block">Standard Purity</span>
                    <strong className="text-sm font-semibold text-[#059669]">{product.purity || "≥ 99.0%"}</strong>
                  </div>
                </div>

                {/* Chemical Description */}
                {product.description && (
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider font-mono">
                      Compound Overview
                    </h3>
                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Procurement CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                  <Link
                    href={`/rfq?productId=${product.id}&productName=${encodeURIComponent(product.name)}`}
                    className="h-9 px-4 bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-white text-xs font-medium rounded-[6px] transition-colors shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.99]"
                  >
                    <span>Request Quotation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <a
                    href="#supplier-offerings"
                    className="h-9 px-3.5 bg-white hover:bg-[#FAFAFA] border border-[#E4E4E7] text-[#0F172A] text-xs font-medium rounded-[6px] transition-colors flex items-center justify-center shadow-xs"
                  >
                    View Supplier Offerings ({product.offeringCount || 0})
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* 2. PRIMARY MARKETPLACE SECTION: AVAILABLE FROM VERIFIED SUPPLIERS */}
          <div id="supplier-offerings" className="bg-white border border-[#E4E4E7] rounded-[8px] p-5 shadow-tactile-card space-y-3">
            <SupplierComparison
              productId={product.id || resolvedParams.id}
              productName={product.name}
            />
          </div>

          {/* 3. TECHNICAL SPECIFICATION GRID */}
          <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-5 shadow-tactile-card space-y-3">
            <div className="flex items-center gap-2 border-b border-[#E4E4E7] pb-2.5">
              <Layers className="w-3.5 h-3.5 text-[#0052CC]" />
              <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider font-mono">
                Technical Information & Monograph Specifications
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
              <div className="bg-[#FAFBFC] p-3 rounded-md border border-[#DFE1E6]">
                <span className="text-[#5E6C84] block text-[10px] uppercase font-bold font-mono">Category</span>
                <strong className="text-[#091E42] font-semibold">
                  {product.category ? product.category.replace(/_/g, " ") : "Specialty"}
                </strong>
              </div>
              <div className="bg-[#FAFBFC] p-3 rounded-md border border-[#DFE1E6]">
                <span className="text-[#5E6C84] block text-[10px] uppercase font-bold font-mono">CAS Registry</span>
                <strong className="text-[#091E42] font-mono font-semibold">{product.casNumber || "N/A"}</strong>
              </div>
              <div className="bg-[#FAFBFC] p-3 rounded-md border border-[#DFE1E6]">
                <span className="text-[#5E6C84] block text-[10px] uppercase font-bold font-mono">Molecular Formula</span>
                <strong className="text-[#091E42] font-mono font-semibold">{product.molecularFormula || "N/A"}</strong>
              </div>
              <div className="bg-[#FAFBFC] p-3 rounded-md border border-[#DFE1E6]">
                <span className="text-[#5E6C84] block text-[10px] uppercase font-bold font-mono">Master Code</span>
                <strong className="text-[#091E42] font-mono font-semibold">{canonicalCode}</strong>
              </div>
              <div className="bg-[#FAFBFC] p-3 rounded-md border border-[#DFE1E6]">
                <span className="text-[#5E6C84] block text-[10px] uppercase font-bold font-mono">Governance Status</span>
                <strong className="text-[#00875A] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Canonical
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
