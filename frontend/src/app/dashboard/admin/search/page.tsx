"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, ChevronRight } from "lucide-react";

interface SearchResult {
  entityType: string;
  identifier: string;
  displayName: string;
  status: string;
  summary: string;
  targetUrl: string;
  lastUpdated: string;
}

export default function UnifiedAdminSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const token = localStorage.getItem("kemkendra_token") || localStorage.getItem("token");
      const res = await fetch(`/api/v1/admin/operations/search?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.content || []);
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link href="/dashboard/admin/operations" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Operations
          </Link>
          <h1 className="text-3xl font-extrabold text-[#0A192F] tracking-tight">
            Unified Admin Search & Investigation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search across MasterProducts, CAS, Suppliers, Offerings, RFQs, and POs.
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Chemical Name, CAS (50-78-2), Master Product Code, or Supplier Name..."
            className="w-full bg-white border border-slate-200/90 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-2xs"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-xs transition-colors"
        >
          {loading ? "Searching..." : "Search Platform"}
        </button>
      </form>

      {/* Results */}
      {searched && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
              Search Results ({results.length})
            </h2>
          </div>

          {results.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No matching records found across Master Products or Suppliers.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {results.map((res, idx) => (
                <Link
                  key={idx}
                  href={res.targetUrl}
                  className="p-6 hover:bg-slate-50 flex items-center justify-between transition-colors group block"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {res.entityType}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {res.identifier}
                      </span>
                    </div>
                    <div className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {res.displayName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {res.summary}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
