import Link from "next/link";
import { Search, ChevronDown, ArrowUpRight } from "lucide-react";

export function SearchHeader() {
  const popularChips = [
    { label: "Paracetamol API", query: "Paracetamol" },
    { label: "Acetic Acid", query: "Acetic Acid" },
    { label: "Solvents", query: "Solvents" },
    { label: "Excipients", query: "Excipients" },
    { label: "Ibuprofen", query: "Ibuprofen" },
  ];

  return (
    <section className="relative bg-white pt-20 pb-24 overflow-hidden border-b border-slate-100">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Soft gradient blur (optional, for that SaaS feel) */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 z-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column (7 cols): Hero Content & Search */}
          <div className="lg:col-span-7 space-y-8">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm">
              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                New
              </span>
              <span className="text-sm font-medium text-slate-600">
                Verified supplier network across 37 countries
              </span>
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-[3.5rem] leading-[1.1] font-extrabold tracking-tight text-[#0A192F]">
                Source <br />
                Pharmaceutical <br />
                Ingredients <span className="text-blue-600">Globally</span>
              </h1>
              <p className="text-lg text-slate-500 mt-6 font-medium max-w-xl leading-relaxed">
                One marketplace for APIs, intermediates, and specialty chemicals — with GMP-verified suppliers, complete technical documentation, and end-to-end procurement support.
              </p>
            </div>

            {/* Search Pill */}
            <div className="bg-white p-2 rounded-full border border-slate-200 shadow-lg shadow-slate-200/50 flex flex-col sm:flex-row items-center gap-2 max-w-2xl relative z-20">
              
              {/* Category Dropdown */}
              <div className="relative border-b sm:border-b-0 sm:border-r border-slate-200 flex items-center h-12 min-w-[160px] shrink-0 w-full sm:w-auto">
                <select
                  name="category"
                  aria-label="Select Category"
                  className="appearance-none bg-transparent pl-5 pr-8 py-2 text-sm font-semibold text-slate-700 cursor-pointer focus-visible:outline-none w-full"
                  defaultValue="ALL"
                >
                  <option value="ALL">All Categories</option>
                  <option value="API">APIs</option>
                  <option value="INTERMEDIATE">Intermediates</option>
                  <option value="SOLVENT">Solvents</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 pointer-events-none" />
              </div>

              {/* Search Input */}
              <div className="relative flex-1 flex items-center h-12 w-full">
                <Search className="w-5 h-5 text-slate-400 absolute left-4" />
                <input
                  type="text"
                  name="query"
                  placeholder="Search products, CAS numbers, suppli..."
                  className="w-full pl-11 pr-4 py-2 text-[15px] font-medium text-slate-900 placeholder-slate-400 bg-transparent focus-visible:outline-none"
                  aria-label="Search chemical database"
                />
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="w-full sm:w-auto px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] rounded-full transition-colors flex items-center justify-center gap-2 shrink-0 shadow-md shadow-blue-600/20"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>

            {/* Popular Tags */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="text-sm font-semibold text-slate-500">
                Popular:
              </span>
              {popularChips.map((chip) => (
                <Link
                  key={chip.label}
                  href={`/products?query=${encodeURIComponent(chip.query)}`}
                  className="px-4 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-[13px] font-semibold text-slate-600 transition-colors shadow-sm"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Column (5 cols): Live Marketplace Pulse Card */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col overflow-hidden">
              
              {/* Card Header */}
              <div className="px-8 pt-8 pb-6 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                  <span className="font-bold text-slate-800 text-[15px]">Live Marketplace Pulse</span>
                </div>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-mono rounded-md uppercase tracking-wider">
                  realtime
                </span>
              </div>

              {/* Grid Metrics */}
              <div className="px-8 pb-8 grid grid-cols-2 gap-4">
                
                {/* Products */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[13px] font-medium text-slate-500">Products</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                  <div className="text-[32px] font-bold text-blue-600 leading-none mb-2 tracking-tight">10,482</div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <span className="text-blue-500 flex items-center">
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                    +124 this week
                  </div>
                </div>

                {/* Verified Suppliers */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[13px] font-medium text-slate-500">Verified Suppliers</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                  <div className="text-[32px] font-bold text-teal-500 leading-none mb-2 tracking-tight">1,284</div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <span className="text-teal-500 flex items-center">
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                    +38 this month
                  </div>
                </div>

                {/* Countries */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[13px] font-medium text-slate-500">Countries</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                  <div className="text-[32px] font-bold text-slate-800 leading-none mb-2 tracking-tight">37</div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <span className="text-slate-400 flex items-center">
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                    Global reach
                  </div>
                </div>

                {/* RFQs Today */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[13px] font-medium text-slate-500">RFQs Today</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                  <div className="text-[32px] font-bold text-orange-500 leading-none mb-2 tracking-tight">286</div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <span className="text-orange-500 flex items-center">
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                    Live
                  </div>
                </div>

              </div>

              {/* Bottom Strip */}
              <div className="bg-[#0A192F] px-8 py-5 flex items-center justify-between mt-auto">
                <div>
                  <div className="text-slate-400 text-xs mb-0.5 font-medium">Avg. supplier response</div>
                  <div className="text-white font-bold text-[15px]">under 4 hours</div>
                </div>
                
                {/* Overlapping Circles */}
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-[#0A192F] z-10" />
                  <div className="w-8 h-8 rounded-full bg-teal-500 border-2 border-[#0A192F] z-20" />
                  <div className="w-8 h-8 rounded-full bg-orange-500 border-2 border-[#0A192F] z-30" />
                  <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-[#0A192F] z-40 flex items-center justify-center text-white text-[10px] font-bold">
                    +9
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
