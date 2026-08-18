"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { getSupplierRfqs, SupplierRfq } from "@/features/rfq/api/getSupplierRfqs";

type StatusFilter = "ALL" | "PENDING" | "QUOTED" | "ACCEPTED" | "REJECTED";
type SortOption = "DATE_DESC" | "DATE_ASC" | "QTY_DESC" | "QTY_ASC";

export default function SupplierRfqsPage() {
  const router = useRouter();

  const [rfqs, setRfqs] = useState<SupplierRfq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("DATE_DESC");

  const loadRfqs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupplierRfqs();
      setRfqs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load supplier RFQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRfqs();
  }, []);

  const totalCount = rfqs.length;
  const pendingCount = useMemo(() => rfqs.filter((r) => r.status === "PENDING" || r.status === "CONTACTED").length, [rfqs]);
  const quotedCount = useMemo(() => rfqs.filter((r) => r.status === "QUOTED").length, [rfqs]);
  const acceptedCount = useMemo(() => rfqs.filter((r) => r.status === "ACCEPTED").length, [rfqs]);
  const rejectedCount = useMemo(() => rfqs.filter((r) => r.status === "REJECTED").length, [rfqs]);
  
  const activeCount = pendingCount + quotedCount + acceptedCount;

  const filteredRfqs = useMemo(() => {
    return rfqs
      .filter((rfq) => {
        if (statusFilter === "PENDING" && rfq.status !== "PENDING" && rfq.status !== "CONTACTED") return false;
        if (statusFilter === "QUOTED" && rfq.status !== "QUOTED") return false;
        if (statusFilter === "ACCEPTED" && rfq.status !== "ACCEPTED") return false;
        if (statusFilter === "REJECTED" && rfq.status !== "REJECTED") return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesRef = (rfq.rfqReference || "").toLowerCase().includes(q);
          const matchesId = rfq.id.toLowerCase().includes(q);
          const matchesProduct = (rfq.productName || "").toLowerCase().includes(q) || rfq.productId.toLowerCase().includes(q);
          const matchesBuyer = (rfq.buyerName || "").toLowerCase().includes(q) || String(rfq.buyerId).includes(q);
          return matchesRef || matchesId || matchesProduct || matchesBuyer;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "DATE_DESC") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === "DATE_ASC") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === "QTY_DESC") return b.quantity - a.quantity;
        if (sortBy === "QTY_ASC") return a.quantity - b.quantity;
        return 0;
      });
  }, [rfqs, statusFilter, searchQuery, sortBy]);

  // Separate Action Required (Pending) vs General Register (Everything else) ONLY when viewing "ALL"
  const actionRequiredRfqs = useMemo(() => {
    if (statusFilter !== "ALL") return [];
    return filteredRfqs.filter(r => r.status === "PENDING" || r.status === "CONTACTED");
  }, [filteredRfqs, statusFilter]);
  
  const registerRfqs = useMemo(() => {
    if (statusFilter !== "ALL") return filteredRfqs;
    return filteredRfqs.filter(r => r.status !== "PENDING" && r.status !== "CONTACTED");
  }, [filteredRfqs, statusFilter]);

  const getSemanticStatusClass = (status: string) => {
    switch (status) {
      case "ACCEPTED": return "text-teal-600";
      case "QUOTED": return "text-blue-600";
      case "PENDING":
      case "CONTACTED": return "text-orange-500";
      case "REJECTED": return "text-red-700";
      case "CLOSED":
      case "CANCELLED": return "text-slate-500";
      default: return "text-slate-600";
    }
  };

  const currentDateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).toUpperCase();

  if (loading) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
          LOADING QUOTATION DESK...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto">
        <div className="border-l-[3px] border-orange-500 pl-4 py-1">
          <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">System Error</p>
          <p className="text-sm font-mono text-slate-700 mt-2">{error}</p>
          <button
            onClick={loadRfqs}
            className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[#0A192F] hover:text-blue-600 transition-colors"
          >
            RETRY FETCH →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pb-24">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">

        {/* =========================================
            1. EDITORIAL HEADER
            ========================================= */}
        <header className="border-t-[3px] border-[#0A192F] pt-6 mb-12">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="max-w-3xl">
              <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                SUPPLIER / QUOTATION OPERATIONS
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold text-[#0A192F] tracking-tight mb-3">
                RFQ Inbox
              </h1>
              <p className="text-sm font-medium text-slate-600 leading-relaxed uppercase tracking-wider">
                Review incoming chemical sourcing requests, prioritize pending inquiries, and submit commercial quotations.
              </p>
            </div>
            
            <div className="shrink-0 flex flex-col md:items-end gap-1 border-l-2 md:border-l-0 md:border-r-2 border-[#0A192F] pl-4 md:pl-0 md:pr-4 py-1">
              <span className="text-sm font-mono font-bold text-[#0A192F] tracking-tight">{currentDateStr}</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                SUPPLIER WORKSPACE
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600 mt-2">
                {String(activeCount).padStart(2, '0')} ACTIVE
              </span>
            </div>
          </div>
        </header>

        {/* =========================================
            2. OPERATIONAL INDEX
            ========================================= */}
        <section className="mb-12 border-b border-slate-200 pb-8">
          <div className="flex flex-wrap items-baseline gap-x-12 gap-y-6">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl font-semibold text-[#0A192F] tracking-tighter">
                {String(totalCount).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 max-w-[80px] leading-tight">
                TOTAL INQUIRIES
              </span>
            </div>
            
            <div className="hidden sm:block w-[1px] h-8 bg-slate-200 self-center" />
            
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl font-semibold text-orange-500 tracking-tighter">
                {String(pendingCount).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 max-w-[100px] leading-tight">
                AWAITING QUOTE
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl font-semibold text-blue-600 tracking-tighter">
                {String(quotedCount).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 max-w-[80px] leading-tight">
                QUOTED
              </span>
            </div>
            
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl font-semibold text-teal-600 tracking-tighter">
                {String(acceptedCount).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 max-w-[80px] leading-tight">
                ACCEPTED
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl font-semibold text-red-700 tracking-tighter">
                {String(rejectedCount).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 max-w-[80px] leading-tight">
                REJECTED
              </span>
            </div>
          </div>
        </section>

        {/* =========================================
            3. CONTROL BAR (Search & Filters)
            ========================================= */}
        <section className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 pb-2">
            
            {/* SEARCH */}
            <div className="relative w-full lg:max-w-sm mb-4 lg:mb-0">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                RFQ SEARCH
              </span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-0 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Reference, chemical or buyer organization..."
                  className="w-full pl-6 pr-0 py-1 text-xs font-mono border-b border-slate-300 focus:outline-none focus:border-[#0A192F] transition-colors placeholder:font-sans placeholder:text-slate-400 bg-transparent"
                />
              </div>
            </div>

            {/* FILTERS & SORT */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-8">
              <div>
                <span className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  FILTERS
                </span>
                <div className="flex items-center gap-6 overflow-x-auto pb-1">
                  {(["ALL", "PENDING", "QUOTED", "ACCEPTED", "REJECTED"] as StatusFilter[]).map((filter) => {
                    const isActive = statusFilter === filter;
                    const count = filter === "ALL" ? totalCount : 
                                 filter === "PENDING" ? pendingCount :
                                 filter === "QUOTED" ? quotedCount :
                                 filter === "ACCEPTED" ? acceptedCount : rejectedCount;
                    return (
                      <button
                        key={filter}
                        onClick={() => setStatusFilter(filter)}
                        className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                          isActive 
                            ? "text-[#0A192F] border-b-2 border-[#0A192F] pb-[2px]" 
                            : "text-slate-500 hover:text-slate-800 pb-[4px]"
                        }`}
                      >
                        {filter === "PENDING" ? "AWAITING QUOTE" : filter} {String(count).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  SORT
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-[10px] font-bold uppercase tracking-widest text-[#0A192F] bg-transparent focus:outline-none cursor-pointer pb-1 border-b border-transparent hover:border-slate-300 transition-colors"
                >
                  <option value="DATE_DESC">NEWEST FIRST</option>
                  <option value="DATE_ASC">OLDEST FIRST</option>
                  <option value="QTY_DESC">HIGHEST QUANTITY</option>
                  <option value="QTY_ASC">LOWEST QUANTITY</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            4. PRIORITY RESPONSE AREA (Only visible when viewing ALL)
            ========================================= */}
        {statusFilter === "ALL" && !searchQuery.trim() && actionRequiredRfqs.length > 0 && (
          <section className="mb-16">
            <div className="border-b-[2px] border-orange-500 pb-2 mb-4 flex justify-between items-end">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#0A192F]">
                Action Required
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                PENDING QUOTATIONS
              </span>
            </div>

            <div className="flex flex-col border-b border-slate-200">
              <div className="hidden lg:flex items-center py-2 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <div className="w-[15%]">RFQ Reference</div>
                <div className="w-[20%]">Product / Chemical</div>
                <div className="w-[20%]">Buyer Organization</div>
                <div className="w-[12%] text-right">Quantity</div>
                <div className="w-[10%] text-center">Status</div>
                <div className="w-[11%]">Request Date</div>
                <div className="w-[12%] text-right">Action</div>
              </div>

              {actionRequiredRfqs.map((rfq) => (
                <div
                  key={rfq.id}
                  onClick={() => router.push(`/dashboard/supplier/rfqs/${rfq.id}`)}
                  className="group flex flex-col lg:flex-row lg:items-center py-5 border-b border-slate-100 hover:bg-orange-50/30 transition-colors cursor-pointer"
                >
                  <div className="w-full lg:w-[15%] mb-2 lg:mb-0">
                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">RFQ Reference</span>
                    <span className="font-mono text-[13px] font-semibold text-[#0A192F] group-hover:text-blue-600 transition-colors">
                      {rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`}
                    </span>
                  </div>

                  <div className="w-full lg:w-[20%] mb-2 lg:mb-0 pr-4">
                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Product / Chemical</span>
                    <span className="text-[13px] font-bold text-slate-900 block truncate">
                      {rfq.productName || "Specialty Chemical Raw Material"}
                    </span>
                  </div>

                  <div className="w-full lg:w-[20%] mb-3 lg:mb-0 pr-4">
                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Buyer Organization</span>
                    <span className="text-xs font-medium text-slate-800 block truncate">
                      {rfq.buyerName || "Buyer Organization"}
                    </span>
                  </div>

                  <div className="w-full lg:w-[12%] lg:text-right mb-3 lg:mb-0 pr-0 lg:pr-4">
                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Quantity</span>
                    <span className="font-mono text-[13px] text-slate-900">
                      {rfq.quantity.toLocaleString()} {rfq.unit.toUpperCase()}
                    </span>
                  </div>

                  <div className="w-full lg:w-[10%] lg:text-center mb-3 lg:mb-0">
                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Status</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${getSemanticStatusClass(rfq.status)}`}>
                      AWAITING QUOTE
                    </span>
                  </div>

                  <div className="w-full lg:w-[11%] mb-3 lg:mb-0">
                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Request Date</span>
                    <span className="font-mono text-xs text-slate-700">
                      {new Date(rfq.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                    </span>
                  </div>

                  <div className="w-full lg:w-[12%] lg:text-right">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-blue-600 group-hover:text-blue-800 transition-colors">
                      SUBMIT QUOTE →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================
            5. INCOMING RFQ REGISTER (Data Table)
            ========================================= */}
        <section>
          <div className="border-b-[2px] border-[#0A192F] pb-2 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#0A192F]">
              Incoming RFQ Register
            </h2>
          </div>

          {rfqs.length === 0 ? (
            <div className="py-12 border-b border-slate-200">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                NO OPEN QUOTATION REQUESTS
              </span>
              <p className="text-sm font-medium text-slate-600 mb-6">
                All incoming RFQs have been reviewed or there are no current inquiries for your catalog.
              </p>
            </div>
          ) : registerRfqs.length === 0 ? (
            <div className="py-12 border-b border-slate-200">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                NO MATCHING RECORDS
              </span>
              <p className="text-sm font-medium text-slate-600 mb-6">
                No procurement requests match your current search and filter criteria.
              </p>
              <button
                onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }}
                className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#0A192F] hover:text-blue-600 transition-colors"
              >
                CLEAR FILTERS →
              </button>
            </div>
          ) : (
            <div className="flex flex-col border-b border-slate-200">
              <div className="hidden lg:flex items-center py-2 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <div className="w-[15%]">RFQ Reference</div>
                <div className="w-[20%]">Product / Chemical</div>
                <div className="w-[20%]">Buyer Organization</div>
                <div className="w-[12%] text-right">Quantity</div>
                <div className="w-[10%] text-center">Status</div>
                <div className="w-[11%]">Submitted</div>
                <div className="w-[12%] text-right">Action</div>
              </div>

              {registerRfqs.map((rfq) => (
                <div
                  key={rfq.id}
                  onClick={() => router.push(`/dashboard/supplier/rfqs/${rfq.id}`)}
                  className="group flex flex-col lg:flex-row lg:items-center py-5 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-full lg:w-[15%] mb-2 lg:mb-0">
                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">RFQ Reference</span>
                    <span className="font-mono text-[13px] font-semibold text-[#0A192F] group-hover:text-blue-600 transition-colors">
                      {rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`}
                    </span>
                  </div>

                  <div className="w-full lg:w-[20%] mb-2 lg:mb-0 pr-4">
                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Product / Chemical</span>
                    <span className="text-[13px] font-bold text-slate-900 block truncate">
                      {rfq.productName || "Specialty Chemical Raw Material"}
                    </span>
                  </div>

                  <div className="w-full lg:w-[20%] mb-3 lg:mb-0 pr-4">
                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Buyer Organization</span>
                    <span className="text-xs font-medium text-slate-800 block truncate">
                      {rfq.buyerName || "Buyer Organization"}
                    </span>
                  </div>

                  <div className="w-full lg:w-[12%] lg:text-right mb-3 lg:mb-0 pr-0 lg:pr-4">
                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Quantity</span>
                    <span className="font-mono text-[13px] text-slate-900">
                      {rfq.quantity.toLocaleString()} {rfq.unit.toUpperCase()}
                    </span>
                  </div>

                  <div className="w-full lg:w-[10%] lg:text-center mb-3 lg:mb-0">
                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Status</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${getSemanticStatusClass(rfq.status)}`}>
                      {rfq.status}
                    </span>
                  </div>

                  <div className="w-full lg:w-[11%] mb-3 lg:mb-0">
                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Submitted</span>
                    <span className="font-mono text-xs text-slate-700">
                      {new Date(rfq.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                    </span>
                  </div>

                  <div className="w-full lg:w-[12%] lg:text-right">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      rfq.status === "PENDING" || rfq.status === "CONTACTED"
                        ? "text-blue-600 group-hover:text-blue-800"
                        : "text-[#0A192F] group-hover:text-blue-600"
                    }`}>
                      {rfq.status === "PENDING" || rfq.status === "CONTACTED" ? "SUBMIT QUOTE →" : "VIEW DETAILS →"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}