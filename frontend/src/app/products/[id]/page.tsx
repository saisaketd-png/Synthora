import { Metadata } from "next";
import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { ShieldCheck, MapPin, FlaskConical, ChevronRight, FileCheck, CheckCircle2, Building2 } from "lucide-react";
import Link from "next/link";
import { fetchProductDetail } from "@/lib/api";
import { notFound } from "next/navigation";
import { Product } from "@/features/products/types/product";
import SupplierComparison from "@/features/products/components/SupplierComparison";
import RequestQuoteButton from "@/features/rfq/components/RequestQuoteButton";
import { ProductDocuments } from "@/features/products/components/ProductDocuments";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://synthora.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const product: Product = await fetchProductDetail(resolvedParams.id);
    const title = `${product.name} | CAS ${product.casNumber || "N/A"} | Synthora`;
    const description =
      product.description ||
      `Source high-purity ${product.name} (CAS ${product.casNumber || "N/A"}) with verified documentation on Synthora. Request quotations from verified chemical suppliers.`;
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
        siteName: "Synthora",
        type: "website",
        images: product.primaryImageUrl
          ? [
              {
                url: `${API_URL}${product.primaryImageUrl}`,
                alt: `${product.name} chemical sample`,
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
      title: "Product Details | Synthora",
      description: "Chemical product specifications and supplier procurement on Synthora.",
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

  // Schema.org JSON-LD Structured Data
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `High purity ${product.name} for industrial & pharmaceutical procurement.`,
    sku: canonicalCode,
    category: product.category ? product.category.replace("_", " ") : "Chemicals",
    image: product.primaryImageUrl ? `${API_URL}${product.primaryImageUrl}` : undefined,
    additionalProperty: [
      product.casNumber ? { "@type": "PropertyValue", name: "CAS Number", value: product.casNumber } : null,
      product.molecularFormula ? { "@type": "PropertyValue", name: "Molecular Formula", value: product.molecularFormula } : null,
      product.purity ? { "@type": "PropertyValue", name: "Purity", value: `${product.purity}%` } : null,
      product.grade ? { "@type": "PropertyValue", name: "Grade", value: product.grade } : null,
    ].filter(Boolean),
    offers: {
      "@type": "Offer",
      price: product.price ? product.price.toFixed(2) : "0.00",
      priceCurrency: "USD",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      seller: {
        "@type": "Organization",
        name: product.sellerName || "Verified Chemical Supplier",
      },
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
        name: "Products",
        item: `${SITE_URL}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category ? product.category.replace("_", " ") : "Chemicals",
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans text-slate-900 antialiased">
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

      <main className="flex-1 py-8 sm:py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Breadcrumbs */}
          <nav
            className="flex items-center gap-2 text-xs font-semibold text-slate-500"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/products" className="hover:text-blue-600 transition-colors">
              Chemical Catalog
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link
              href={`/products?category=${encodeURIComponent(product.category)}`}
              className="hover:text-blue-600 transition-colors uppercase font-bold"
            >
              {product.category.replace("_", " ")}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold truncate max-w-xs" aria-current="page">
              {product.name}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column (4 cols): Product Visuals & Thumbnails */}
            <div className="lg:col-span-4 space-y-6">
              <div className="aspect-square bg-white border border-slate-200/80 rounded-3xl flex items-center justify-center p-6 relative overflow-hidden shadow-xs">
                {product.primaryImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${API_URL}${product.primaryImageUrl}`}
                    alt={`${product.name} product sample`}
                    className="w-full h-full object-contain rounded-2xl"
                  />
                ) : (
                  <FlaskConical className="w-24 h-24 text-slate-300" />
                )}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-teal-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </div>
              </div>

              {/* Gallery Thumbnails if multiple */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.map((img) => (
                    <div
                      key={img.id}
                      className="aspect-square rounded-2xl border border-slate-200 overflow-hidden bg-white p-1 shadow-2xs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${API_URL}${img.imageUrl}`}
                        alt={img.fileName}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Trust Indicators */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2.5 text-xs text-slate-600 shadow-2xs">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Quality Assured Batch Analysis</span>
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>COA & MSDS Documentation Provided</span>
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verified cGMP Manufacturer</span>
                </div>
              </div>
            </div>

            {/* Middle Column (5 cols): Details & Technical Data */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full uppercase tracking-wider">
                    {product.category.replace("_", " ")}
                  </span>
                  {product.productCode && (
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                      {product.productCode}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A192F] tracking-tight leading-tight">
                  {product.name}
                </h1>

                <p className="text-sm font-mono text-slate-500">
                  CAS Registry: <span className="font-bold text-slate-800">{product.casNumber || "N/A"}</span>
                </p>

                {product.description && (
                  <p className="text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Technical Specifications Grid */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100">
                  Technical Specifications
                </h3>

                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-slate-500 mb-0.5 text-xs">CAS Number</dt>
                    <dd className="font-bold text-slate-900 font-mono">
                      {product.casNumber || "N/A"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500 mb-0.5 text-xs">Molecular Formula</dt>
                    <dd className="font-bold text-slate-900 font-mono">
                      {product.molecularFormula || "N/A"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500 mb-0.5 text-xs">Purity</dt>
                    <dd className="font-bold text-slate-900 font-mono">
                      {product.purity ? `${product.purity}%` : "N/A"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500 mb-0.5 text-xs">Grade</dt>
                    <dd className="font-bold text-slate-900">
                      {product.grade || "N/A"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500 mb-0.5 text-xs">Packaging</dt>
                    <dd className="font-bold text-slate-900">
                      {product.packaging || "N/A"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500 mb-0.5 text-xs">Minimum Order (MOQ)</dt>
                    <dd className="font-bold text-slate-900 font-mono">
                      {product.moqKg ? `${product.moqKg} kg` : "Contact"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500 mb-0.5 text-xs">Lead Time</dt>
                    <dd className="font-bold text-slate-900">
                      {product.leadTimeDays ? `${product.leadTimeDays} days` : "N/A"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500 mb-0.5 text-xs">Availability</dt>
                    <dd className="font-bold text-slate-900">
                      {product.availabilityStatus || "N/A"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Product Quality Documents Section */}
              <ProductDocuments productId={resolvedParams.id} isSeller={false} />
            </div>

            {/* Right Column (3 cols): Sourcing & Supplier Desk Card */}
            <div className="lg:col-span-3">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs sticky top-24 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Indicative Price</span>
                    <span className="text-2xl font-extrabold text-slate-900 font-mono">
                      ${product.price ? product.price.toFixed(2) : "0.00"} <span className="text-xs font-normal text-slate-500 font-sans">/ kg</span>
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-slate-500">Minimum Order</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {product.moqKg ? `${product.moqKg} kg` : "N/A"}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-slate-500">Inventory Status</span>
                    <span
                      className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
                        product.stock > 0
                          ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                          : "text-amber-700 bg-amber-50 border border-amber-200"
                      }`}
                    >
                      {product.stock > 0 ? "In Stock" : "Made to Order"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Verified Manufacturer
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
                      {(product.sellerName || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block leading-tight text-sm truncate">
                        {product.sellerName || "Verified Chemical Supplier"}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        Global Supplier
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <RequestQuoteButton
                    productId={product.id}
                    productName={product.name}
                    supplierId={Number(product.sellerId) || 1}
                    supplierName={product.sellerName || "Verified Supplier"}
                    supplierCountry={"Global"}
                    defaultQuantity={product.moqKg || 10}
                  />
                  <Link
                    href="/products"
                    className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl transition-colors text-xs"
                  >
                    Browse Other Chemicals
                  </Link>
                </div>
              </div>
            </div>

          </div>

          {/* Supplier Comparison Section */}
          <div className="mt-12">
            <SupplierComparison productId={resolvedParams.id} productName={product.name} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
