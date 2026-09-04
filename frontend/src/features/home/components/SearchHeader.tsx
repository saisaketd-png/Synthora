import Link from "next/link";
import Image from "next/image";
import { Search, ChevronDown, ArrowRight } from "lucide-react";

export function SearchHeader() {
  return (
    <section className="relative bg-[#0A1128] text-white border-b border-[#1E293B] overflow-hidden">
      <div className="max-w-[1560px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px] lg:min-h-[660px]">
          
          {/* Left Column (~55% / 7 cols): Editorial Typography, Sourcing Search & Trust Strip */}
          <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-16 z-10">
            <div className="space-y-6 max-w-2xl">
              {/* Eyebrow */}
              <span className="text-xs font-semibold uppercase tracking-widest text-[#38BDF8] block">
                Chemical Sourcing Platform
              </span>

              {/* Large Confident Editorial Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] xl:text-[64px] font-bold tracking-tight text-white leading-[1.08]">
                Source the chemicals <br />
                your business needs.
              </h1>

              {/* Concise Supporting Narrative */}
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg font-normal">
                Discover chemical products, connect with verified manufacturers, and manage commercial procurement through one structured B2B marketplace.
              </p>

              {/* Large Horizontal Marketplace Search Control */}
              <div className="pt-2">
                <form
                  action="/products"
                  method="GET"
                  className="bg-white rounded-[6px] p-2 flex flex-col sm:flex-row items-center gap-2 max-w-xl shadow-2xl border border-white/20"
                >
                  {/* Category Dropdown */}
                  <div className="relative border-b sm:border-b-0 sm:border-r border-[#E4E4E7] flex items-center h-11 min-w-[150px] shrink-0 w-full sm:w-auto">
                    <select
                      name="category"
                      aria-label="Select chemical category"
                      className="w-full h-full bg-transparent text-xs font-semibold text-[#0F172A] pl-3 pr-7 appearance-none cursor-pointer focus:outline-none"
                      defaultValue=""
                    >
                      <option value="">All Categories</option>
                      <option value="API">APIs & Actives</option>
                      <option value="INTERMEDIATE">Intermediates</option>
                      <option value="EXCIPIENT">Excipients</option>
                      <option value="SOLVENT">Solvents</option>
                      <option value="SPECIALTY_CHEMICAL">Specialty Chemicals</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2 pointer-events-none" />
                  </div>

                  {/* Text Search Input */}
                  <div className="flex-1 flex items-center h-11 w-full px-2">
                    <Search className="w-4 h-4 text-[#0052CC] mr-2.5 shrink-0" />
                    <input
                      type="text"
                      name="search"
                      placeholder="Search chemicals, CAS numbers, grades or product codes..."
                      className="w-full bg-transparent text-xs text-[#0F172A] placeholder:text-[#64748B] focus:outline-none font-medium"
                    />
                  </div>

                  {/* Search Action */}
                  <button
                    type="submit"
                    className="w-full sm:w-auto h-11 px-6 bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-white text-xs font-semibold rounded-[4px] transition-all flex items-center justify-center gap-2 shrink-0 shadow-xs"
                  >
                    <span>Search</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                <div className="pt-2 text-[11px] font-mono text-slate-400">
                  Chemical name &middot; CAS number &middot; Grade &middot; Product code
                </div>
              </div>

              {/* Primary vs Secondary CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link
                  href="/products"
                  className="h-11 px-6 bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-white text-xs font-semibold rounded-[4px] transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Explore Marketplace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/rfq"
                  className="h-11 px-6 bg-transparent hover:bg-white/5 border border-slate-700 text-slate-200 text-xs font-medium rounded-[4px] transition-colors flex items-center justify-center"
                >
                  <span>Request an RFQ</span>
                </Link>
              </div>
            </div>

            {/* Quiet Horizontal Trust Line */}
            <div className="pt-8 mt-6 border-t border-slate-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium tracking-wider text-slate-400">
              <span className="text-slate-200">STRUCTURED RFQs</span>
              <span>&middot;</span>
              <span className="text-slate-200">SUPPLIER SOURCING</span>
              <span>&middot;</span>
              <span className="text-slate-200">COMMERCIAL NEGOTIATION</span>
              <span>&middot;</span>
              <span className="text-slate-200">ORDER WORKFLOW</span>
            </div>
          </div>

          {/* Right Column (~45% / 5 cols): Edge-to-edge Macro Chemical Material Editorial Visual */}
          <div className="lg:col-span-5 relative min-h-[360px] lg:min-h-full border-t lg:border-t-0 lg:border-l border-slate-800 bg-[#0A1128] overflow-hidden">
            <Image
              src="/hero-chemical-material.jpg"
              alt="High-purity crystalline and pharmaceutical chemical raw material"
              fill
              priority
              className="object-cover object-center brightness-95 contrast-105"
            />
            {/* Natural gradient blend: dissolves seamlessly into the left navy canvas */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1128] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#0A1128] lg:via-[#0A1128]/20 lg:to-transparent pointer-events-none" />

            {/* Understated Editorial Notation (integrated, subtle, not a floating UI card) */}
            <div className="absolute bottom-5 right-5 text-right font-mono text-[11px] text-slate-400/90 pointer-events-none hidden sm:block">
              <span className="text-slate-300 font-semibold block text-xs">High-Purity Compendial Assay</span>
              <span>Controlled Crystalline & Powder Spec</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
