import type { Metadata } from "next";
import { getProducts } from "@/features/products/api/getProducts";
import { Product } from "@/features/products/types/product";
import { Navbar } from "@/features/home/components/Navbar";
import { SearchHeader } from "@/features/home/components/SearchHeader";
import { FeaturedCatalogPreview } from "@/features/home/components/FeaturedCatalogPreview";
import { CategoryShortcuts } from "@/features/home/components/CategoryShortcuts";
import { BrandStatement } from "@/features/home/components/BrandStatement";
import { BuyerSupplierSplit } from "@/features/home/components/BuyerSupplierSplit";
import { TrustSection } from "@/features/home/components/TrustSection";
import { ResourcesSection } from "@/features/home/components/ResourcesSection";
import { EnterpriseCTA } from "@/features/home/components/EnterpriseCTA";
import { Footer } from "@/features/home/components/Footer";
import { serializeJsonLd } from "@/shared/utils/security";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "KemKendra | Verified Chemical Suppliers & B2B Chemical Marketplace",
  description:
    "Discover verified chemical suppliers, compare chemical offerings, request quotations, and source raw materials through KemKendra’s B2B chemical marketplace.",
  alternates: {
    canonical: "https://kemkendra.online",
  },
  openGraph: {
    title: "KemKendra | Verified Chemical Suppliers & B2B Chemical Marketplace",
    description:
      "Discover verified chemical suppliers, compare chemical offerings, request quotations, and source raw materials through KemKendra’s B2B chemical marketplace.",
    url: "https://kemkendra.online",
    siteName: "KemKendra",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "KemKendra | Verified Chemical Suppliers & B2B Chemical Marketplace",
    description:
      "Discover verified chemical suppliers, compare chemical offerings, request quotations, and source raw materials through KemKendra’s B2B chemical marketplace.",
  },
};

export default async function HomePage() {
  let products: Product[] = [];

  try {
    const pageData = await getProducts();
    if (pageData && Array.isArray(pageData.content)) {
      products = pageData.content;
    }
  } catch (error) {
    console.warn("Using fallback demo products in buyer-first table view:", error);
  }

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KemKendra",
    url: "https://kemkendra.online",
    logo: "https://kemkendra.online/kemkendra-icon.png",
    description:
      "Enterprise B2B digital exchange for compendial APIs, pharmaceutical intermediates, laboratory solvents, and specialty chemicals.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91 7676447077",
      contactType: "customer service",
      email: "kemkendra1@gmail.com",
      areaServed: "IN",
      availableLanguage: ["en", "hi"],
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bengaluru",
      addressRegion: "Karnataka",
      addressCountry: "IN",
    },
  };

  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "KemKendra",
    url: "https://kemkendra.online",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://kemkendra.online/products?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-[#0F172A] antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(webSiteJsonLd) }}
      />
      <Navbar />
      <main className="flex-1">
        {/* 1. HERO: Full-Bleed Editorial Hero with Edge-to-Edge Chemical Facility Visual */}
        <SearchHeader />

        {/* 2. CHEMICAL CATEGORIES: High-End Horizontal Directory */}
        <CategoryShortcuts />

        {/* 3. MARKETPLACE CATALOG DISCOVERY: Products in Demand */}
        <FeaturedCatalogPreview products={products} />

        {/* 4. PROCUREMENT PIPELINE: 6-Stage Engineering Process Diagram + Large Editorial Statement */}
        <BrandStatement />

        {/* 5. BUYER & SUPPLIER SPLIT: 50/50 Editorial Value Proposition */}
        <BuyerSupplierSplit />

        {/* 6. GOVERNANCE & TRUST: Structured Verification & Auditability */}
        <TrustSection />

        {/* 7. TECHNICAL MONOGRAPHS & REGULATORY COMPLIANCE */}
        <ResourcesSection />

        {/* 8. COMPACT COMMERCIAL CTA */}
        <EnterpriseCTA />
      </main>
      <Footer />
    </div>
  );
}