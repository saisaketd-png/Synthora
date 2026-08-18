"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { getBuyerOrders } from "@/features/order/api/getBuyerOrders";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";

type StatusFilter = "ALL" | "PLACED" | "CONFIRMED" | "CANCELLED" | "PROCESSING" | "SHIPPED" | "DELIVERED";
type SortOption = "DATE_DESC" | "DATE_ASC";

export default function BuyerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("DATE_DESC");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBuyerOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Derived Summary Indexes
  const totalCount = orders.length;
  const placedCount = useMemo(() => orders.filter((o) => o.status === "PLACED").length, [orders]);
  const confirmedCount = useMemo(() => orders.filter((o) => o.status === "CONFIRMED").length, [orders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (statusFilter !== "ALL" && order.status !== statusFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesPo = (order.poNumber || "").toLowerCase().includes(q);
          const matchesRfq = (order.rfqId || "").toLowerCase().includes(q);
          const matchesProduct = (order.productName || "").toLowerCase().includes(q);
          const matchesSupplier = String(order.supplierId).includes(q);
          return matchesPo || matchesRfq || matchesProduct || matchesSupplier;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "DATE_DESC") return new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();
        if (sortBy === "DATE_ASC") return new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
        return 0;
      });
  }, [orders, statusFilter, searchQuery, sortBy]);

  const getSemanticStatusClass = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "ACCEPTED": return "text-teal-600";
      case "PLACED": return "text-orange-500";
      case "CANCELLED": return "text-slate-500";
      case "PROCESSING": return "text-blue-600";
      case "SHIPPED": return "text-indigo-600";
      case "DELIVERED": return "text-green-600";
      default: return "text-slate-600";
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center bg-white">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest animate-pulse">
          LOADING ORDER REGISTER...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto bg-white min-h-[50vh]">
        <div className="border-l-[3px] border-orange-500 pl-4 py-1">
          <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">System Error</p>
          <p className="text-sm font-mono text-slate-700 mt-2">UNABLE TO LOAD PURCHASE ORDERS</p>
          <button
            onClick={loadOrders}
            className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[#0A192F] hover:text-blue-600 transition-colors"
          >
            [ RETRY ]
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pb-24">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">

        {/* =========================================
            DOCUMENT HEADER
            ========================================= */}
        <header className="border-t-[3px] border-[#0A192F] pt-6 mb-12">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="max-w-3xl">
              <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                BUYER PROCUREMENT / ORDER REGISTER
              </span>
              <h1 className="text-4xl lg:text-5xl font-sans font-bold text-[#0A192F] tracking-tighter mb-4">
                Purchase Orders
              </h1>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                Manage issued purchase orders and commercial procurement commitments.
              </p>
            </div>
          </div>
        </header>

        {/* =========================================
            PROCUREMENT INDEX
            ========================================= */}
        <div className="flex flex-wrap sm:flex-nowrap border-y border-slate-200 py-6 mb-12 gap-y-8 gap-x-12">
          <div className="flex flex-col">
            <span className="font-mono text-3xl font-bold text-[#0A192F]">
              {totalCount.toString().padStart(2, "0")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
              TOTAL ORDERS
            </span>
          </div>
          <div className="hidden sm:block w-px bg-slate-200" />
          <div className="flex flex-col">
            <span className="font-mono text-3xl font-bold text-orange-500">
              {placedCount.toString().padStart(2, "0")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
              PLACED
            </span>
          </div>
          <div className="hidden sm:block w-px bg-slate-200" />
          <div className="flex flex-col">
            <span className="font-mono text-3xl font-bold text-teal-600">
              {confirmedCount.toString().padStart(2, "0")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
              CONFIRMED
            </span>
          </div>
        </div>

        {/* =========================================
            REGISTER CONTROL BAR
            ========================================= */}
        <section className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 pb-4">
            
            {/* SEARCH */}
            <div className="relative w-full lg:max-w-sm mb-6 lg:mb-0">
              <div className="relative border-b border-slate-300 focus-within:border-[#0A192F] transition-colors pb-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-0 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="PO number, RFQ reference, product..."
                  className="w-full pl-8 pr-0 py-1 text-sm font-sans focus:outline-none placeholder:text-slate-400 bg-transparent"
                />
              </div>
            </div>

            {/* FILTERS & SORT */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-8">
              <div>
                <div className="flex items-center gap-6 overflow-x-auto">
                  {(["ALL", "PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as StatusFilter[]).map((filter) => {
                    const isActive = statusFilter === filter;
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
                        {filter}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-[10px] font-bold uppercase tracking-widest text-[#0A192F] bg-transparent focus:outline-none cursor-pointer pb-1 border-b border-transparent hover:border-slate-300 transition-colors"
                >
                  <option value="DATE_DESC">NEWEST FIRST</option>
                  <option value="DATE_ASC">OLDEST FIRST</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            PURCHASE ORDER REGISTER
            ========================================= */}
        <section>
          <div className="border-b-[2px] border-[#0A192F] pb-4 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#0A192F]">
              PURCHASE ORDER REGISTER
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 border-b border-slate-200">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                NO PURCHASE ORDERS
              </span>
              <p className="text-sm font-medium text-slate-600 mb-6">
                Purchase orders created from accepted quotations will appear here.
              </p>
              <Link
                href="/dashboard/rfqs"
                className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#0A192F] hover:text-blue-600 transition-colors"
              >
                VIEW MY RFQS →
              </Link>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 border-b border-slate-200">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                NO MATCHING RECORDS
              </span>
              <p className="text-sm font-medium text-slate-600 mb-6">
                No commercial orders match your current search and filter criteria.
              </p>
              <button
                onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }}
                className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#0A192F] hover:text-blue-600 transition-colors"
              >
                CLEAR FILTERS →
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Desktop Header Row */}
              <div className="hidden xl:flex items-center py-3 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <div className="w-[14%]">PO NUMBER</div>
                <div className="w-[14%]">RFQ REFERENCE</div>
                <div className="w-[16%]">PRODUCT / CHEMICAL</div>
                <div className="w-[12%]">SUPPLIER</div>
                <div className="w-[10%] text-right">QUANTITY</div>
                <div className="w-[10%] text-center">STATUS</div>
                <div className="w-[10%] text-right">ORDER DATE</div>
                <div className="w-[14%] text-right">ACTION</div>
              </div>

              {/* Data Rows */}
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  className="group flex flex-col xl:flex-row xl:items-center py-6 border-b border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-full xl:w-[14%] mb-3 xl:mb-0">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">PO NUMBER</span>
                    <span className="font-mono text-[13px] font-semibold text-[#0A192F] group-hover:text-blue-600 transition-colors">
                      {order.poNumber}
                    </span>
                  </div>

                  <div className="w-full xl:w-[14%] mb-3 xl:mb-0">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">RFQ REFERENCE</span>
                    <span className="font-mono text-[11px] font-medium text-slate-500">
                      {`RFQ-${order.rfqId.substring(0, 8).toUpperCase()}`}
                    </span>
                  </div>

                  <div className="w-full xl:w-[16%] mb-3 xl:mb-0 xl:pr-4">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">PRODUCT / CHEMICAL</span>
                    <span className="text-[13px] font-bold text-slate-900 block truncate">
                      {order.productName || "Specialty Chemical Raw Material"}
                    </span>
                  </div>

                  <div className="w-full xl:w-[12%] mb-3 xl:mb-0 xl:pr-4">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">SUPPLIER</span>
                    <span className="text-[13px] font-medium text-slate-800 block truncate">
                      {`Supplier #${order.supplierId}`}
                    </span>
                  </div>

                  <div className="w-full xl:w-[10%] xl:text-right mb-4 xl:mb-0 xl:pr-4">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">QUANTITY</span>
                    <span className="font-mono text-[13px] text-slate-900">
                      {order.quantity.toLocaleString()} {order.unit.toUpperCase()}
                    </span>
                  </div>

                  <div className="w-full xl:w-[10%] xl:text-center mb-4 xl:mb-0">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">STATUS</span>
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${getSemanticStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="w-full xl:w-[10%] xl:text-right mb-6 xl:mb-0">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">ORDER DATE</span>
                    <span className="font-mono text-[11px] text-slate-500 block">
                      {new Date(order.placedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                    </span>
                  </div>

                  <div className="w-full xl:w-[14%] xl:text-right">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#0A192F] group-hover:text-blue-600 transition-colors">
                      OPEN DOCUMENT →
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
