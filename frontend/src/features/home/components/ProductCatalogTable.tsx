import Link from "next/link";
import { Product } from "@/features/products/types/product";
import { EnterpriseTable, Column } from "@/shared/components/EnterpriseTable";
import { ArrowRight, ShieldCheck } from "lucide-react";

interface ProductCatalogTableProps {
  products?: Product[];
}

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "sample-1",
    name: "Paracetamol API (Acetaminophen)",
    description: "USP / EP grade active pharmaceutical ingredient.",
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
    description: "High-purity HPLC & synthesis solvent grade.",
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
    description: "Key pharmaceutical synthesis building block.",
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
    description: "Fine chemical reactant for drug synthesis.",
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
  {
    id: "sample-5",
    name: "Metformin Hydrochloride API",
    description: "EP/BP certified anti-diabetic API.",
    price: 18.0,
    stock: 3500,
    category: "API",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sellerId: "seller-105",
    sellerName: "SoluTech Chemicals India",
    casNumber: "1115-70-4",
    moq: "250 kg",
    country: "India",
  },
];

export function ProductCatalogTable({ products }: ProductCatalogTableProps) {
  const displayProducts =
    products && products.length > 0 ? products : SAMPLE_PRODUCTS;

  const columns: Column<Product>[] = [
    {
      header: "Product Name",
      cell: (item) => (
        <div>
          <Link
            href={`/products/${item.id}`}
            className="font-bold text-blue-600 hover:underline"
          >
            {item.name}
          </Link>
          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
            {item.description}
          </div>
        </div>
      ),
    },
    {
      header: "CAS Number",
      cell: (item) => (
        <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
          {item.casNumber || "N/A"}
        </span>
      ),
    },
    {
      header: "Category",
      cell: (item) => (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-600/10 text-blue-600 uppercase">
          {item.category}
        </span>
      ),
    },
    {
      header: "Supplier",
      cell: (item) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/suppliers/${item.sellerId}`}
            className="font-medium text-slate-900 hover:text-blue-600 hover:underline"
          >
            {item.sellerName}
          </Link>
          <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
        </div>
      ),
    },
    {
      header: "Country",
      cell: (item) => <span className="text-slate-600">{item.country || "Global"}</span>,
    },
    {
      header: "MOQ",
      cell: (item) => <span className="font-semibold text-slate-900">{item.moq || "100 units"}</span>,
    },
    {
      header: "Status",
      cell: (item) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
          ● {item.stock > 0 ? "In Stock" : "On Request"}
        </span>
      ),
    },
    {
      header: "Action",
      cell: (item) => (
        <Link
          href={`/products/${item.id}`}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition-colors inline-flex items-center gap-1"
        >
          <span>RFQ</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  return (
    <section className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-500">
              Verified Directory
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Chemical & API Product Catalog
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>View Full Directory ({displayProducts.length} items)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <EnterpriseTable
          columns={columns}
          data={displayProducts}
          keyExtractor={(item) => item.id}
          emptyTitle="No Chemical Products Found"
          emptyDescription="There are currently no active products in the directory matching your query."
        />
      </div>
    </section>
  );
}
