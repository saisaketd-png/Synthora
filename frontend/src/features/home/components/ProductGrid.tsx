import Link from "next/link";
import { Product } from "@/features/products/types/product";
import { Building2, ShieldCheck, MapPin, ArrowRight } from "lucide-react";

interface ProductGridProps {
  products?: Product[];
}

// Fallback sample products if API backend is empty or unreachable
const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "sample-1",
    name: "Paracetamol API (Acetaminophen)",
    description: "USP / EP grade analgesic and antipyretic active ingredient.",
    price: 12.5,
    stock: 5000,
    category: "API",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sellerId: "seller-101",
    sellerName: "Apex BioPharma Exporters",
    casNumber: "103-90-2",
    moq: "500 kg",
    country: "India",
  },
  {
    id: "sample-2",
    name: "Acetic Acid Glacial 99.8%",
    description: "High-purity industrial grade organic solvent for synthesis.",
    price: 0.85,
    stock: 25000,
    category: "SOLVENT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sellerId: "seller-102",
    sellerName: "SinoChem Specialty Corp",
    casNumber: "64-19-7",
    moq: "1,000 L",
    country: "China",
  },
  {
    id: "sample-3",
    name: "4-Hydroxycarbazole",
    description: "Pharmaceutical intermediate used in Carvedilol synthesis.",
    price: 185.0,
    stock: 800,
    category: "INTERMEDIATE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sellerId: "seller-103",
    sellerName: "EuroPharm Synthetics GmbH",
    casNumber: "52602-33-2",
    moq: "25 kg",
    country: "Germany",
  },
  {
    id: "sample-4",
    name: "Methyl Adipoyl Chloride",
    description: "Fine chemical reactant for specialty polymer & drug synthesis.",
    price: 45.0,
    stock: 1200,
    category: "SPECIALTY_CHEMICAL",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sellerId: "seller-104",
    sellerName: "Vanguard Fine Chem Tech",
    casNumber: "35449-36-6",
    moq: "100 kg",
    country: "United States",
  },
];

export function ProductGrid({ products }: ProductGridProps) {
  const displayProducts =
    products && products.length > 0 ? products : SAMPLE_PRODUCTS;

  return (
    <section id="products" className="py-16 md:py-24 bg-[#F8FAFC] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0F3D91]">
              Verified Listings
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#0F172A] mt-1">
              Featured Chemical & API Products
            </h2>
            <p className="text-[#475569] text-base mt-2 max-w-xl">
              Source direct from audited suppliers with instant documentation access and verified specs.
            </p>
          </div>
          <Link
            href="#all-products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F3D91] hover:text-[#0c3175] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F3D91] rounded-md p-1"
          >
            <span>Browse Catalog ({displayProducts.length})</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Responsive Grid with CSS auto-fit / minmax */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {displayProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#0F3D91]/40 hover:shadow-lg transition-all duration-200 p-6 flex flex-col justify-between group"
            >
              <div>
                {/* Header Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#0F3D91]/10 text-[#0F3D91] uppercase tracking-wide">
                    {product.category || "CHEMICAL"}
                  </span>
                  <span className="text-xs font-mono font-medium text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
                    CAS: {product.casNumber || "Available"}
                  </span>
                </div>

                {/* Product Title */}
                <h3 className="text-lg font-bold text-[#0F172A] group-hover:text-[#0F3D91] transition-colors line-clamp-2 leading-snug mb-2">
                  {product.name}
                </h3>

                {/* Product Description */}
                <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed mb-4">
                  {product.description || "High purity grade chemical formulation available for RFQ."}
                </p>

                {/* Supplier & Country Info */}
                <div className="space-y-2 py-3 border-t border-b border-[#F1F5F9] my-4 text-xs text-[#475569]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-[#0F172A]">
                      <Building2 className="w-3.5 h-3.5 text-[#17B5AE]" />
                      {product.sellerName || "Verified Exporter"}
                    </span>
                    <ShieldCheck className="w-4 h-4 text-[#17B5AE]" />
                  </div>
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {product.country || "Global"}
                    </span>
                    <span>MOQ: <strong className="text-[#0F172A]">{product.moq || `${product.stock || 100} units`}</strong></span>
                  </div>
                </div>
              </div>

              {/* Price & Action Row */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#94A3B8] block">
                    Pricing
                  </span>
                  <span className="text-base font-bold text-[#0F3D91]">
                    {product.price && product.price > 0
                      ? `$${product.price.toFixed(2)} / unit`
                      : "Request Quote"}
                  </span>
                </div>

                <Link
                  href={`/products/${product.id}`}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0F3D91] hover:bg-[#0c3175] active:translate-y-[1px] rounded-lg transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F3D91] min-h-[38px] flex items-center justify-center"
                  aria-label={`View details for ${product.name}`}
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
