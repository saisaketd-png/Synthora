import Link from "next/link";
import { Search, ChevronDown, FileCheck, ArrowRight, ShieldCheck, CheckCircle2, FlaskConical } from "lucide-react";

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
    <section className="bg-white border-b border-[#E2E8F0] py-10 sm:py-14 lg:py-16">
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column (7-8 cols): Procurement Headline & Search */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#E3FCEF] text-[#006644] text-xs font-bold border border-[#ABF5D1]">
              <ShieldCheck className="w-4 h-4 text-[#00875A]" />
              <span className="font-mono uppercase tracking-wider">Verified Global Chemical & Pharma Sourcing</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#091E42] leading-tight">
              Direct B2B Chemical Sourcing for APIs, Intermediates & Solvents
            </h1>

            <p className="text-sm sm:text-base text-[#475569] max-w-2xl leading-relaxed">
              Connect directly with audited GMP/ISO certified chemical manufacturers worldwide. Instant access to live stock availability, COA, MSDS, and verified commercial terms.
            </p>

            {/* Global Search Bar */}
            <form action="/products" method="GET" className="bg-[#F8FAFC] p-2 rounded-2xl border border-[#CBD5E1] shadow-sm flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 flex items-center min-h-[46px]">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3.5" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search chemical name, CAS # (e.g. 103-90-2), or formula..."
                  className="w-full pl-10 pr-3 py-2 text-sm text-[#091E42] placeholder-[#64748B] bg-transparent rounded-xl focus:outline-none focus:bg-white transition-all font-medium"
                  aria-label="Search chemical database"
                />
              </div>

              <div className="relative border-t sm:border-t-0 sm:border-l border-[#CBD5E1] flex items-center min-h-[46px] sm:w-48">
                <select
                  name="category"
                  aria-label="Select Category"
                  className="appearance-none bg-transparent pl-3 pr-8 py-2 text-xs sm:text-sm font-semibold text-[#091E42] cursor-pointer focus:outline-none rounded-xl w-full"
                  defaultValue=""
                >
                  <option value="">All Categories</option>
                  <option value="API">APIs</option>
                  <option value="INTERMEDIATE">Intermediates</option>
                  <option value="SOLVENT">Solvents</option>
                  <option value="SPECIALTY_CHEMICAL">Specialty Chemicals</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 pointer-events-none" />
              </div>

              <button
                type="submit"
                className="h-[46px] px-6 bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 active:scale-[0.99]"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/rfq"
                className="h-11 px-5 bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>Submit Sourcing RFQ</span>
              </Link>
              <Link
                href="/products"
                className="h-11 px-5 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#091E42] font-semibold text-sm rounded-xl transition-all flex items-center gap-2 shadow-2xs"
              >
                <span>Browse Chemical Catalog</span>
                <ArrowRight className="w-4 h-4 text-[#64748B]" />
              </Link>
            </div>
          </div>

          {/* Right Column (5 cols): Live Verified Chemical Spotlights */}
          <div className="lg:col-span-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#0052CC]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#091E42]">
                  Live Manufacturer Feeds
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-[#00875A] bg-[#E3FCEF] px-2 py-0.5 rounded-md">
                LIVE
              </span>
            </div>

            <div className="space-y-3">
              {featuredProductsPanel.map((p) => (
                <Link
                  key={p.id}
                  href={`/products?search=${encodeURIComponent(p.cas)}`}
                  className="block p-3.5 bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#0052CC] rounded-xl transition-all shadow-2xs group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-[#091E42] group-hover:text-[#0052CC] transition-colors">
                        {p.name}
                      </h4>
                      <span className="text-xs font-mono text-[#64748B]">CAS: {p.cas}</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-[#0747A6] bg-[#DEEBFF] px-2 py-0.5 rounded-md shrink-0">
                      MOQ: {p.moq}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#64748B] mt-2 pt-2 border-t border-[#F1F5F9]">
                    <span className="flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00875A]" />
                      {p.sellerName} ({p.country})
                    </span>
                    <span className="text-[#0052CC] font-semibold text-xs flex items-center gap-1">
                      Compare <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
