import { getProducts } from "@/features/products/api/getProducts";
import { Product } from "@/features/products/types/product";
import { Navbar } from "@/features/home/components/Navbar";
import { SearchHeader } from "@/features/home/components/SearchHeader";
import { TrustBar } from "@/features/home/components/TrustBar";
import { FeaturedCatalogPreview } from "@/features/home/components/FeaturedCatalogPreview";
import { CategoryShortcuts } from "@/features/home/components/CategoryShortcuts";
import { SupplierSpotlight } from "@/features/home/components/SupplierSpotlight";
import { MarketActivity } from "@/features/home/components/MarketActivity";
import { ProcurementWorkflow } from "@/features/home/components/ProcurementWorkflow";
import { IndustryGrid } from "@/features/home/components/IndustryGrid";
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
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased selection:bg-teal-500/20">
      <Navbar />
      <main className="flex-1">
        <SearchHeader />
        <FeaturedCatalogPreview products={products} />
        <section className="py-24 bg-slate-50 border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <MarketActivity />
              <ProcurementWorkflow />
            </div>
          </div>
        </section>
        <CategoryShortcuts />
        <IndustryGrid />
        <ResourcesSection />
        <EnterpriseCTA />
      </main>
      <Footer />
    </div>
  );
}