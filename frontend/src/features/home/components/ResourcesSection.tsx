import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ResourcesSection() {
  const resources = [
    {
      title: "Q3 API Manufacturing Trends & Forecasts",
      category: "Market Analysis",
      date: "Oct 12, 2023",
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Navigating EU GMP Compliance Changes",
      category: "Regulatory",
      date: "Oct 05, 2023",
      color: "bg-teal-100 text-teal-600",
    },
    {
      title: "Global Freight Benchmarks for Chemicals",
      category: "Supply Chain",
      date: "Sep 28, 2023",
      color: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <section className="py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-teal-400" />
              <span className="text-[11px] font-bold text-teal-600 uppercase tracking-widest">
                Knowledge & Data
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#0A192F] tracking-tight">
              News & Market Insights
            </h2>
          </div>
          
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 text-[13px] font-bold rounded-full transition-all shrink-0"
          >
            <span>View all reports</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {resources.map((r, i) => (
            <div
              key={i}
              className="group rounded-[2rem] border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col bg-white"
            >
              {/* Image Placeholder */}
              <div className="h-48 bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100 group-hover:scale-105 transition-transform duration-500">
                <svg className="w-16 h-16 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zM5 19V5h14l.002 14H5z" />
                  <path d="m10 14-1-1-3 4h12l-5-7z" />
                </svg>
                {/* Overlay badge */}
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${r.color}`}>
                  {r.category}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                  {r.title}
                </h3>
                <div className="mt-auto text-[13px] font-semibold text-slate-400">
                  {r.date}
                </div>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
