import Link from "next/link";
import { Search, ChevronDown, FileCheck, ArrowRight, ShieldCheck } from "lucide-react";

export function Hero() {
  const featuredProductsPanel = [
    {
      id: "sample-1",
      name: "Paracetamol API (USP / EP)",
      cas: "103-90-2",
      sellerId: "seller-101",
      sellerName: "Apex BioPharma",
      country: "India",
      moq: "500 kg",
    },
    {
      id: "sample-2",
      name: "Acetic Acid Glacial 99.8%",
      cas: "64-19-7",
      sellerId: "seller-102",
      sellerName: "SinoChem Corp",
      country: "China",
      moq: "1,000 L",
    },
    {
      id: "sample-3",
      name: "4-Hydroxycarbazole",
      cas: "52602-33-2",
      sellerId: "seller-103",
      sellerName: "EuroPharm Synthetics",
      country: "Germany",
      moq: "25 kg",
    },
  ];

  return (
    <section className="bg-slate-50 border-b border-slate-200 py-8 lg:py-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Procurement Headline & Search */}
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-600/10 text-blue-600 text-xs font-bold border border-blue-600/20">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
              <span>Verified Global Chemical & Pharma Sourcing</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-snug">
              Direct Procurement Platform for APIs, Intermediates & Specialty Chemicals
            </h1>

            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Connect directly with audited GMP/ISO certified chemical manufacturers worldwide. Instant access to COA, MSDS, and DMF compliance documentation.
            </p>

            {/* Global Search Bar */}
            <form action="/products" method="GET" className="bg-white p-2 rounded-full border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 flex items-center min-h-[44px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type="text"
                  name="query"
                  placeholder="Search chemical name, CAS # (e.g. 103-90-2), or formula..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 bg-transparent rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  aria-label="Search chemical database"
                />
              </div>

              <div className="relative border-t sm:border-t-0 sm:border-l border-slate-200 flex items-center min-h-[44px]">
                <select
                  name="category"
                  aria-label="Select Category"
                  className="appearance-none bg-transparent pl-3 pr-8 py-2.5 text-xs font-medium text-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg w-full"
                  defaultValue="ALL"
                >
                  <option value="ALL">All Categories</option>
                  <option value="API">APIs</option>
                  <option value="INTERMEDIATE">Intermediates</option>
                  <option value="SOLVENT">Solvents</option>
                  <option value="SPECIALTY_CHEMICAL">Specialty Chemicals</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full transition-colors shadow-sm min-h-[44px] flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/rfq"
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold text-xs rounded-full transition-colors shadow-sm flex items-center gap-2 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <FileCheck className="w-4 h-4" />
                <span>Submit RFQ Direct to Suppliers</span>
              </Link>
              <Link
                href="/products"
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-full transition-colors flex items-center gap-1.5 min-h-[40px]"
              >
                <span>Browse All Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column (4 cols / ~340px): Featured Products Panel */}
          <div className="lg:col-span-4 bg-white rounded-[2rem] border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Featured Verified Listings
              </h2>
              <Link
                href="/products"
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {featuredProductsPanel.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-slate-50 rounded-md border border-slate-200 hover:border-blue-600/40 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/products/${p.id}`}
                      className="text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                    >
                      {p.name}
                    </Link>
                    <span className="text-[10px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 shrink-0">
                      CAS {p.cas}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <Link
                      href={`/suppliers/${p.sellerId}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {p.sellerName} ({p.country})
                    </Link>
                    <span>MOQ: <strong className="text-slate-900">{p.moq}</strong></span>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded">
                      In Stock
                    </span>
                    <Link
                      href={`/products/${p.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <span>Request Quote</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
