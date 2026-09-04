import Link from "next/link";
import { Product } from "@/features/products/types/product";
import { PremiumProductCard, PremiumProduct } from "@/shared/components/PremiumProductCard";
import { ArrowRight } from "lucide-react";

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
    name: "Acetic Acid Glacial",
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
    <section className="py-16 sm:py-20 bg-white border-b border-[#E4E4E7]">
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0052CC] font-mono bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1 rounded-[4px]">
              Marketplace Liquidity
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mt-2.5">
              Products in Demand
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-2xl leading-relaxed">
              Active sourcing monographs from verified manufacturers, complete with Certificates of Analysis (COA) and batch test records.
            </p>
          </div>

          <Link
            href="/products"
            className="h-9 px-4 bg-white border border-[#E4E4E7] hover:bg-[#FAFAFA] text-[#0F172A] text-xs font-medium rounded-[6px] transition-colors inline-flex items-center gap-1.5 shadow-xs shrink-0 self-start md:self-auto"
          >
            <span>View Full Directory</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#64748B]" />
          </Link>
        </div>

        {/* Product Grid: 1 col (mobile) -> 2 cols (tablet) -> 4 cols (desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayProducts.slice(0, 4).map((product) => (
            <PremiumProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
