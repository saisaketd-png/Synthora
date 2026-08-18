"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { getSupplierOrders } from "@/features/order/api/getSupplierOrders";
import { confirmOrder } from "@/features/order/api/confirmOrder";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";

type StatusFilter = "ALL" | "PLACED" | "CONFIRMED" | "CANCELLED" | "PROCESSING" | "SHIPPED" | "DELIVERED";
type SortOption = "DATE_DESC" | "DATE_ASC" | "VALUE_DESC" | "VALUE_ASC";

export default function SupplierOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("DATE_DESC");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupplierOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load supplier orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleQuickConfirm = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    try {
      setConfirmingId(orderId);
      await confirmOrder(orderId);
      await loadOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to confirm order");
    } finally {
      setConfirmingId(null);
    }
  };

  // Derived Summary Indexes
  const totalCount = orders.length;
  const placedCount = useMemo(() => orders.filter((o) => o.status === "PLACED").length, [orders]);
  const confirmedCount = useMemo(() => orders.filter((o) => o.status === "CONFIRMED").length, [orders]);
  const cancelledCount = useMemo(() => orders.filter((o) => o.status === "CANCELLED").length, [orders]);
  
  const activeCount = placedCount + confirmedCount;

  // Commercial Value Ledger Calculation
  const commercialValues = useMemo(() => {
    const totals: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.status !== "CANCELLED") {
        if (!totals[o.currency]) totals[o.currency] = 0;
        totals[o.currency] += o.totalAmount;
      }
    });
    return totals;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (statusFilter !== "ALL" && order.status !== statusFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesPo = (order.poNumber || "").toLowerCase().includes(q);
          const matchesRfq = (order.rfqId || "").toLowerCase().includes(q);
          const matchesId = order.id.toLowerCase().includes(q);
          const matchesProduct = (order.productName || "").toLowerCase().includes(q) || order.productId.toLowerCase().includes(q);
          const matchesBuyer = (order.buyerId || "").toLowerCase().includes(q);
          return matchesPo || matchesRfq || matchesId || matchesProduct || matchesBuyer;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "DATE_DESC") return new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();
        if (sortBy === "DATE_ASC") return new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
        if (sortBy === "VALUE_DESC") return b.totalAmount - a.totalAmount;
        if (sortBy === "VALUE_ASC") return a.totalAmount - b.totalAmount;
        return 0;
      });
  }, [orders, statusFilter, searchQuery, sortBy]);

  // Separate Action Required (Placed) vs General Register (Everything else) ONLY when viewing "ALL"
  const actionRequiredOrders = useMemo(() => {
    if (statusFilter !== "ALL") return [];
    return filteredOrders.filter(r => r.status === "PLACED");
  }, [filteredOrders, statusFilter]);
  
  const registerOrders = useMemo(() => {
    if (statusFilter !== "ALL") return filteredOrders;
    return filteredOrders.filter(r => r.status !== "PLACED");
  }, [filteredOrders, statusFilter]);

  const getSemanticStatusClass = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "text-teal-600";
      case "PLACED": return "text-orange-500";
      case "CANCELLED": return "text-red-700";
      case "PROCESSING": return "text-blue-600";
      case "SHIPPED": return "text-indigo-600";
      case "DELIVERED": return "text-green-600";
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
          LOADING FULFILLMENT REGISTER...
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
            onClick={loadOrders}
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
                SUPPLIER / FULFILLMENT OPERATIONS
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold text-[#0A192F] tracking-tight mb-3">
                Incoming Orders
              </h1>
              <p className="text-sm font-medium text-slate-600 leading-relaxed uppercase tracking-wider">
                Manage confirmed purchase orders, review commercial commitments, and monitor fulfillment activity.
              </p>
            </div>
            
            <div className="shrink-0 flex flex-col md:items-end gap-1 border-l-2 md:border-l-0 md:border-r-2 border-[#0A192F] pl-4 md:pl-0 md:pr-4 py-1">
              <span className="text-sm font-mono font-bold text-[#0A192F] tracking-tight">{currentDateStr}</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                SUPPLIER WORKSPACE
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600 mt-2">
                {String(activeCount).padStart(2, '0')} ACTIVE ORDERS
              </span>
            </div>
          </div>
        </header>

        {/* =========================================
            2. OPERATIONAL INDEX & VALUE LEDGER
            ========================================= */}
        <section className="mb-12 border-b border-slate-200 pb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-10">
          
          <div className="flex flex-wrap items-baseline gap-x-12 gap-y-6">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl font-semibold text-[#0A192F] tracking-tighter">
                {String(totalCount).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 max-w-[80px] leading-tight">
                TOTAL ORDERS
              </span>
            </div>
            
            <div className="hidden sm:block w-[1px] h-8 bg-slate-200 self-center" />
            
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl font-semibold text-orange-500 tracking-tighter">
                {String(placedCount).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 max-w-[80px] leading-tight">
                ACTION REQUIRED
              </span>
            </div>
            
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl font-semibold text-teal-600 tracking-tighter">
                {String(confirmedCount).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 max-w-[80px] leading-tight">
                CONFIRMED
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl font-semibold text-red-700 tracking-tighter">
                {String(cancelledCount).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 max-w-[80px] leading-tight">
                CANCELLED
              </span>
            </div>
          </div>

          <div className="xl:text-right border-l-[3px] border-[#0A192F] pl-4">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              COMMERCIAL PIPELINE VALUE
            </span>
            {Object.keys(commercialValues).length > 0 ? (
              Object.entries(commercialValues).map(([currency, total]) => (
                <div key={currency} className="font-mono text-xl md:text-2xl font-bold text-[#0A192F] tracking-tighter">
                  {currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              ))
            ) : (
              <div className="font-mono text-xl md:text-2xl font-bold text-slate-300 tracking-tighter">
                0.00
              </div>
            )}
          </div>
        </section>

        {/* =========================================
            3. ORDERBOOK TOOLBAR (Search & Filters)
            ========================================= */}
        <section className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 pb-2">
            
            {/* SEARCH */}
            <div className="relative w-full lg:max-w-sm mb-4 lg:mb-0">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                ORDER SEARCH
              </span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-0 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="PO number, RFQ reference, product..."
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
                        {filter === "PLACED" ? "ACTION REQUIRED" : filter}
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
                  <option value="VALUE_DESC">HIGHEST VALUE</option>
                  <option value="VALUE_ASC">LOWEST VALUE</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            4. PRIORITY RESPONSE AREA (Only visible when viewing ALL)
            ========================================= */}
        {statusFilter === "ALL" && !searchQuery.trim() && actionRequiredOrders.length > 0 && (
          <section className="mb-16">
            <div className="border-b-[2px] border-orange-500 pb-2 mb-4 flex justify-between items-end">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#0A192F]">
                Action Required
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                PENDING CONFIRMATION
              </span>
            </div>

            <div className="flex flex-col border-b border-slate-200">
              <div className="hidden xl:flex items-center py-2 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <div className="w-[12%]">PO Number</div>
                <div className="w-[20%]">Product / Chemical</div>
                <div className="w-[18%]">Buyer Organization</div>
                <div className="w-[10%] text-right">Quantity</div>
                <div className="w-[12%] text-right">Order Value</div>
                <div className="w-[10%] text-center">Status</div>
                <div className="w-[18%] text-right">Action</div>
              </div>

              {actionRequiredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/dashboard/supplier/orders/${order.id}`)}
                  className="group flex flex-col xl:flex-row xl:items-center py-5 border-b border-slate-100 hover:bg-orange-50/30 transition-colors cursor-pointer"
                >
                  <div className="w-full xl:w-[12%] mb-2 xl:mb-0">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">PO Number</span>
                    <span className="font-mono text-[13px] font-semibold text-[#0A192F] group-hover:text-blue-600 transition-colors">
                      {order.poNumber}
                    </span>
                    <span className="xl:hidden font-mono text-[11px] text-slate-500 block mt-1">
                      {new Date(order.placedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                    </span>
                  </div>

                  <div className="w-full xl:w-[20%] mb-2 xl:mb-0 pr-4">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Product / Chemical</span>
                    <span className="text-[13px] font-bold text-slate-900 block truncate">
                      {order.productName || "Specialty Chemical Raw Material"}
                    </span>
                  </div>

                  <div className="w-full xl:w-[18%] mb-3 xl:mb-0 pr-4">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Buyer Organization</span>
                    <span className="text-[13px] font-medium text-[#0A192F] block truncate">
                      Synthora Organization
                    </span>
                  </div>

                  <div className="w-full xl:w-[10%] xl:text-right mb-3 xl:mb-0 pr-0 xl:pr-4">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Quantity</span>
                    <span className="font-mono text-[13px] text-slate-900">
                      {order.quantity.toLocaleString()} {order.unit.toUpperCase()}
                    </span>
                  </div>

                  <div className="w-full xl:w-[12%] xl:text-right mb-3 xl:mb-0 pr-0 xl:pr-4">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Order Value</span>
                    <span className="font-mono text-[13px] font-semibold text-[#0A192F]">
                      {order.currency} {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="w-full xl:w-[10%] xl:text-center mb-4 xl:mb-0">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Status</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${getSemanticStatusClass(order.status)}`}>
                      ACTION REQUIRED
                    </span>
                  </div>

                  <div className="w-full xl:w-[18%] xl:text-right flex flex-col sm:flex-row items-start xl:items-end justify-end gap-3">
                    <button
                      onClick={(e) => handleQuickConfirm(e, order.id)}
                      disabled={confirmingId === order.id}
                      className="inline-block text-[10px] font-bold uppercase tracking-widest text-orange-600 hover:text-orange-800 transition-colors disabled:opacity-50"
                    >
                      {confirmingId === order.id ? "CONFIRMING..." : "CONFIRM ORDER →"}
                    </button>
                    <span className="hidden sm:block text-slate-300">|</span>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors">
                      OPEN ORDER →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================
            5. INCOMING ORDER REGISTER (Data Table)
            ========================================= */}
        <section>
          <div className="border-b-[2px] border-[#0A192F] pb-2 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#0A192F]">
              Incoming Order Register
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 border-b border-slate-200">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                NO INCOMING ORDERS
              </span>
              <p className="text-sm font-medium text-slate-600 mb-6">
                No committed purchase orders currently require supplier fulfillment.
              </p>
              <Link
                href="/dashboard/supplier/rfqs"
                className="inline-block text-[11px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
              >
                VIEW RFQ INBOX →
              </Link>
            </div>
          ) : registerOrders.length === 0 ? (
            <div className="py-12 border-b border-slate-200">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                NO MATCHING RECORDS
              </span>
              <p className="text-sm font-medium text-slate-600 mb-6">
                No commercial orders match your current search and filter criteria.
              </p>
              <button
                onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }}
                className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#0A192F] hover:text-blue-600 transition-colors"
              >
                CLEAR FILTERS →
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Desktop Header Row */}
              <div className="hidden xl:flex items-center py-2 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <div className="w-[12%]">PO Number</div>
                <div className="w-[20%]">Product / Chemical</div>
                <div className="w-[18%]">Buyer Organization</div>
                <div className="w-[10%] text-right">Quantity</div>
                <div className="w-[12%] text-right">Order Value</div>
                <div className="w-[10%] text-center">Status</div>
                <div className="w-[18%] text-right">Action</div>
              </div>

              {/* Data Rows */}
              {registerOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/dashboard/supplier/orders/${order.id}`)}
                  className="group flex flex-col xl:flex-row xl:items-center py-5 border-b border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-full xl:w-[12%] mb-2 xl:mb-0">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">PO Number</span>
                    <span className="font-mono text-[13px] font-semibold text-[#0A192F] group-hover:text-blue-600 transition-colors">
                      {order.poNumber}
                    </span>
                    <span className="xl:hidden font-mono text-[11px] text-slate-500 block mt-1">
                      {new Date(order.placedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                    </span>
                  </div>

                  <div className="w-full xl:w-[20%] mb-2 xl:mb-0 pr-4">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Product / Chemical</span>
                    <span className="text-[13px] font-bold text-slate-900 block truncate">
                      {order.productName || "Specialty Chemical Raw Material"}
                    </span>
                  </div>

                  <div className="w-full xl:w-[18%] mb-3 xl:mb-0 pr-4">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Buyer Organization</span>
                    <span className="text-[13px] font-medium text-[#0A192F] block truncate">
                      Synthora Organization
                    </span>
                  </div>

                  <div className="w-full xl:w-[10%] xl:text-right mb-3 xl:mb-0 pr-0 xl:pr-4">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Quantity</span>
                    <span className="font-mono text-[13px] text-slate-900">
                      {order.quantity.toLocaleString()} {order.unit.toUpperCase()}
                    </span>
                  </div>

                  <div className="w-full xl:w-[12%] xl:text-right mb-3 xl:mb-0 pr-0 xl:pr-4">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Order Value</span>
                    <span className="font-mono text-[13px] font-semibold text-[#0A192F]">
                      {order.currency} {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="w-full xl:w-[10%] xl:text-center mb-4 xl:mb-0">
                    <span className="xl:hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Status</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${getSemanticStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="w-full xl:w-[18%] xl:text-right flex flex-col sm:flex-row items-start xl:items-end justify-end gap-3">
                    <span className="hidden xl:inline-block font-mono text-[11px] text-slate-500 mb-1">
                      {new Date(order.placedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                    </span>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-[#0A192F] group-hover:text-blue-600 transition-colors">
                      OPEN ORDER →
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
