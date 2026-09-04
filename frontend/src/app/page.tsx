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

export const dynamic = "force-dynamic";

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

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-[#0F172A] antialiased">
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