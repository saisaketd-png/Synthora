import Link from "next/link";
import { Product } from "@/features/products/types/product";
import { PremiumProductCard, PremiumProduct } from "@/shared/components/PremiumProductCard";
import { ArrowRight, Sparkles } from "lucide-react";

interface FeaturedCatalogPreviewProps {
  products?: Product[];
}

const SAMPLE_PRODUCTS: PremiumProduct[] = [
  {
    id: "sample-1",
    name: "Paracetamol API",
    category: "Active Pharmaceutical Ingredients",
    casNumber: "103-90-2",
    moq: "500 kg",
    purity: "99.8%",
    stockStatus: "In Stock",
    supplier: {
      id: "seller-101",
      name: "Apex BioPharma Exporters",
      isVerified: true,
      country: "India",
      countryCode: "IN",
    },
  },
  {
    id: "sample-2",
    name: "Acetic Acid",
    category: "Industrial Solvents",
    casNumber: "64-19-7",
    moq: "2 MT",
    purity: "99.5%",
    stockStatus: "In Stock",
    supplier: {
      id: "seller-102",
      name: "SinoChem Specialty Corp",
      isVerified: true,
      country: "United Arab Emirates",
      countryCode: "AE",
    },
  },
  {
    id: "sample-3",
    name: "4-Hydroxycarbazole",
    category: "Pharmaceutical Intermediates",
    casNumber: "52602-39-8",
    moq: "25 kg",
    purity: "98.0%",
    stockStatus: "Low Stock",
    supplier: {
      id: "seller-103",
      name: "EuroPharm Synthetics GmbH",
      isVerified: true,
      country: "Germany",
      countryCode: "DE",
    },
  },
  {
    id: "sample-4",
    name: "Methyl Adipoyl Chloride",
    category: "Specialty Chemicals",
    casNumber: "35444-44-1",
    moq: "100 kg",
    purity: "97.5%",
    stockStatus: "Made to Order",
    supplier: {
      id: "seller-104",
      name: "Vanguard Fine Chem Tech",
      isVerified: true,
      country: "China",
      countryCode: "CN",
    },
  },
];

export function FeaturedCatalogPreview({ products }: FeaturedCatalogPreviewProps) {
  const displayProducts =
    products && products.length > 0
      ? products.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          casNumber: p.casNumber || "N/A",
          moq: p.moq || "100 units",
          purity: "99.0%",
          image: p.primaryImageUrl,
          stockStatus: (p.stock > 0 ? "In Stock" : "Made to Order") as "In Stock" | "Made to Order",
          supplier: {
            id: p.sellerId || "unknown",
            name: p.sellerName || "Verified Supplier",
            isVerified: true,
            country: p.country || "Global",
            countryCode: p.country ? p.country.substring(0, 2).toUpperCase() : "GL",
          },
        }))
      : SAMPLE_PRODUCTS;

  return (
    <section className="py-16 sm:py-20 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-bold text-[#006644] bg-[#E3FCEF] border border-[#ABF5D1]">
              <Sparkles className="w-3.5 h-3.5 text-[#00875A]" />
              <span className="font-mono uppercase tracking-wider">Verified Sourcing</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#091E42] tracking-tight">
              Precision Chemical Catalog
            </h2>
            <p className="text-sm sm:text-[15px] text-[#64748B] leading-relaxed">
              Curated from verified pharmaceutical and chemical manufacturers, complete with Certificates of Analysis (COA) and regulatory compliance data.
            </p>
          </div>

          <Link
            href="/products"
            className="h-[42px] px-5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#091E42] text-sm font-semibold rounded-xl transition-all inline-flex items-center gap-2 shadow-2xs shrink-0 self-start md:self-auto"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-4 h-4 text-[#64748B]" />
          </Link>
        </div>

        {/* Product Grid: 1 col (mobile) -> 2 cols (tablet) -> 3-4 cols (desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayProducts.slice(0, 4).map((product) => (
            <PremiumProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
