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
      countryCode: "IN"
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
      countryCode: "AE"
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
      countryCode: "DE"
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
      countryCode: "CN"
    },
  },
];

export function FeaturedCatalogPreview({ products }: FeaturedCatalogPreviewProps) {
  const displayProducts = (products && products.length > 0) 
    ? products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        casNumber: p.casNumber || "N/A",
        moq: p.moq || "100 units",
        purity: "99.0%",
        stockStatus: (p.stock > 0 ? "In Stock" : "Made to Order") as "In Stock" | "Made to Order",
        supplier: {
          id: p.sellerId || "unknown",
          name: p.sellerName || "Unknown Supplier",
          isVerified: true,
          country: p.country || "Global",
          countryCode: p.country ? p.country.substring(0, 2).toUpperCase() : "GL"
        }
      })) 
    : SAMPLE_PRODUCTS;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header matching Screenshot 2 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-teal-400" />
              <span className="text-[11px] font-bold text-teal-600 uppercase tracking-widest">
                Featured Catalog
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#0A192F] tracking-tight mb-4">
              Precision ingredients, <br /> ready to source
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed">
              Curated from top-rated verified manufacturers, each listing ships with certificates of analysis and full regulatory documentation.
            </p>
          </div>
          
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 text-[13px] font-bold rounded-full transition-all shrink-0"
          >
            <span>Browse full catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.slice(0, 4).map((product) => (
            <PremiumProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

