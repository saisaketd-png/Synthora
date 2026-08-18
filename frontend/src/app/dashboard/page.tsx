"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBuyerRfqs, BuyerRfq } from "@/features/rfq/api/getBuyerRfqs";
import { getBuyerOrders } from "@/features/order/api/getBuyerOrders";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";

export default function BuyerDashboardOverviewPage() {
  const [rfqs, setRfqs] = useState<BuyerRfq[]>([]);
  const [orders, setOrders] = useState<PurchaseOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);
        const [rfqsData, ordersData] = await Promise.all([
          getBuyerRfqs().catch(() => [] as BuyerRfq[]),
          getBuyerOrders().catch(() => [] as PurchaseOrderResponse[]),
        ]);
        setRfqs(rfqsData);
        setOrders(ordersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto min-h-[50vh] flex items-center justify-center">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
          SYSTEM INITIALIZING...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="border-l-[3px] border-orange-500 pl-4 py-1">
          <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">System Error</p>
          <p className="text-sm font-mono text-slate-700 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // --- DERIVED METRICS ---
  const activeRfqsCount = rfqs.filter((r) => r.status !== "CLOSED" && r.status !== "CANCELLED").length;
  const pendingRfqsCount = rfqs.filter((r) => r.status === "SUBMITTED" || r.status === "PENDING" || r.status === "CONTACTED").length;
  const decisionReadyRfqsCount = rfqs.filter((r) => r.status === "QUOTED").length;
  const activeOrdersCount = orders.filter((o) => o.status !== "CANCELLED").length;
  const confirmedOrdersCount = orders.filter((o) => o.status === "CONFIRMED").length;

  // --- DATA SEGMENTS ---
  const actionRequiredRfqs = rfqs.filter((r) => r.status === "QUOTED").sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const activeRfqsList = rfqs.filter((r) => r.status !== "QUOTED" && r.status !== "CLOSED" && r.status !== "CANCELLED").sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 10);

  const ordersList = [...orders].sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  ).slice(0, 10);

  // Combine for timeline
  const recentTimeline = [...rfqs, ...orders]
    .sort((a, b) => {
      const dateA = new Date('createdAt' in a ? a.createdAt : (a as PurchaseOrderResponse).placedAt).getTime();
      const dateB = new Date('createdAt' in b ? b.createdAt : (b as PurchaseOrderResponse).placedAt).getTime();
      return dateB - dateA;
    })
    .slice(0, 8);

  // --- HELPERS ---
  const getSemanticStatusClass = (status: string) => {
    switch (status) {
      case "ACCEPTED":
      case "CONFIRMED":
        return "text-teal-600";
      case "QUOTED":
      case "PLACED":
        return "text-blue-600";
      case "PENDING":
      case "SUBMITTED":
      case "CONTACTED":
        return "text-orange-500";
      case "REJECTED":
      case "CANCELLED":
      case "CLOSED":
        return "text-slate-500 line-through";
      default:
        return "text-slate-600";
    }
  };

  const currentDateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).toUpperCase();

  const currentTimeStr = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pb-24">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
        
        {/* =========================================
            1. EDITORIAL PROCUREMENT HEADER
            ========================================= */}
        <header className="border-t-[3px] border-[#0A192F] pt-6 mb-16">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="max-w-3xl">
              <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500 mb-4">
                Procurement / Control Desk
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold text-[#0A192F] tracking-tight mb-4">
                Buyer Operations
              </h1>
              <p className="text-sm font-medium text-slate-600 leading-relaxed uppercase tracking-wider">
                Monitor active procurement, evaluate quotations, and track supply network commitments.
              </p>
            </div>
            
            <div className="shrink-0 flex flex-col md:items-end gap-1 border-l-2 md:border-l-0 md:border-r-2 border-[#0A192F] pl-4 md:pl-0 md:pr-4 py-1">
              <span className="text-sm font-mono font-bold text-[#0A192F] tracking-tight">{currentDateStr}</span>
              <span className="text-[11px] font-mono text-slate-500 uppercase">{currentTimeStr}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600 mt-2">Operational</span>
            </div>
          </div>
        </header>

        {/* =========================================
            2. PROCUREMENT STATUS INDEX
            ========================================= */}
        <section className="mb-20">
          <div className="border-b border-slate-200 pb-2 mb-6">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Procurement Status
            </h2>
          </div>
          
          <div className="flex flex-wrap items-baseline gap-x-12 gap-y-8">
            {/* Highest Priority Metric */}
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-5xl font-semibold text-blue-600 tracking-tighter">
                {decisionReadyRfqsCount.toString().padStart(2, '0')}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#0A192F] max-w-[80px] leading-tight">
                Decision Ready
              </span>
            </div>
            
            <div className="hidden sm:block w-[1px] h-10 bg-slate-200 self-center" />
            
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-medium text-slate-800 tracking-tight">
                {activeRfqsCount.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 max-w-[60px] leading-tight">
                Active RFQs
              </span>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-medium text-orange-600 tracking-tight">
                {pendingRfqsCount.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 max-w-[80px] leading-tight">
                Awaiting Response
              </span>
            </div>

            <div className="hidden md:block w-[1px] h-10 bg-slate-200 self-center" />

            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-medium text-slate-800 tracking-tight">
                {activeOrdersCount.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 max-w-[60px] leading-tight">
                Active Orders
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-medium text-teal-600 tracking-tight">
                {confirmedOrdersCount.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 max-w-[80px] leading-tight">
                Confirmed
              </span>
            </div>
          </div>
        </section>

        {/* =========================================
            3. ASYMMETRIC GRID (70/30)
            ========================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-16 gap-y-20">
          
          {/* --- MAIN COLUMN (70%) --- */}
          <div className="lg:col-span-8 space-y-20">

            {/* ACTION REQUIRED */}
            <section>
              <div className="border-b-[2px] border-blue-600 pb-2 mb-1">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Action Required
                </h2>
              </div>
              
              {actionRequiredRfqs.length === 0 ? (
                <div className="py-6">
                  <p className="text-xs font-mono text-slate-500 uppercase">NO QUOTATIONS PENDING DECISION.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {/* Dense Table Header */}
                  <div className="hidden md:flex items-center py-2 border-b border-slate-200 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    <div className="w-1/4">Reference</div>
                    <div className="w-1/3">Chemical Target / Supplier</div>
                    <div className="w-[15%]">Volume</div>
                    <div className="w-[15%]">Status</div>
                    <div className="w-[12%] text-right">Action</div>
                  </div>
                  
                  {actionRequiredRfqs.map((rfq) => (
                    <div 
                      key={rfq.id} 
                      className="group flex flex-col md:flex-row md:items-center py-4 border-b border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-full md:w-1/4 mb-2 md:mb-0">
                        <Link href={`/dashboard/rfqs/${rfq.id}`} className="font-mono text-[13px] font-bold text-[#0A192F] hover:text-blue-600 transition-colors">
                          {rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`}
                        </Link>
                      </div>
                      
                      <div className="w-full md:w-1/3 mb-2 md:mb-0 pr-4">
                        <span className="text-[13px] font-bold text-slate-900 block truncate">{rfq.productName || "Specialty Chemical"}</span>
                        <span className="text-[11px] text-slate-500 block truncate mt-0.5">{rfq.supplierName || `Supplier ID: ${rfq.supplierId}`}</span>
                      </div>
                      
                      <div className="w-full md:w-[15%] mb-2 md:mb-0">
                        <span className="font-mono text-xs text-slate-700">{rfq.quantity.toLocaleString()} {rfq.unit}</span>
                      </div>

                      <div className="w-full md:w-[15%] mb-2 md:mb-0">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${getSemanticStatusClass(rfq.status)}`}>
                          {rfq.status}
                        </span>
                      </div>
                      
                      <div className="w-full md:w-[12%] md:text-right">
                        <Link href={`/dashboard/rfqs/${rfq.id}`} className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors">
                          Review →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ACTIVE PROCUREMENT REGISTER */}
            <section>
              <div className="flex items-baseline justify-between border-b-[2px] border-[#0A192F] pb-2 mb-1">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#0A192F]">
                  Active Procurement Register
                </h2>
                <Link href="/dashboard/rfqs" className="text-[10px] font-bold text-slate-500 hover:text-[#0A192F] transition-colors uppercase tracking-[0.2em]">
                  View Directory
                </Link>
              </div>
              
              {activeRfqsList.length === 0 ? (
                <div className="py-6">
                  <p className="text-xs font-mono text-slate-500 uppercase">NO ACTIVE RFQS IN PIPELINE.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {activeRfqsList.map((rfq) => (
                    <div 
                      key={rfq.id} 
                      className="group flex flex-col md:flex-row md:items-center py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-full md:w-1/4 mb-1 md:mb-0">
                        <Link href={`/dashboard/rfqs/${rfq.id}`} className="font-mono text-[13px] font-bold text-[#0A192F] hover:text-blue-600 transition-colors">
                          {rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`}
                        </Link>
                      </div>
                      
                      <div className="w-full md:w-2/5 mb-1 md:mb-0 pr-4">
                        <span className="text-[13px] font-bold text-slate-900 block truncate">{rfq.productName || "Specialty Chemical"}</span>
                        <span className="text-[11px] text-slate-500 block truncate">{rfq.supplierName || `Supplier ID: ${rfq.supplierId}`}</span>
                      </div>
                      
                      <div className="w-full md:w-1/6 mb-1 md:mb-0">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${getSemanticStatusClass(rfq.status)}`}>
                          {rfq.status}
                        </span>
                      </div>
                      
                      <div className="w-full md:w-1/6 md:text-right">
                        <span className="text-[11px] text-slate-500 font-mono">
                          {new Date(rfq.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ORDER ACTIVITY */}
            <section>
              <div className="flex items-baseline justify-between border-b-[2px] border-teal-700 pb-2 mb-1">
                <h2 className="text-xs font-bold uppercase tracking-widest text-teal-800">
                  Order Activity
                </h2>
                <Link href="/dashboard/orders" className="text-[10px] font-bold text-slate-500 hover:text-[#0A192F] transition-colors uppercase tracking-[0.2em]">
                  View Order Book
                </Link>
              </div>
              
              {ordersList.length === 0 ? (
                <div className="py-6">
                  <p className="text-xs font-mono text-slate-500 uppercase">NO PURCHASE ORDERS ISSUED.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {ordersList.map((order) => (
                    <div 
                      key={order.id} 
                      className="group flex flex-col md:flex-row md:items-center py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-full md:w-1/4 mb-1 md:mb-0">
                        <Link href={`/dashboard/orders/${order.id}`} className="font-mono text-[13px] font-bold text-[#0A192F] hover:text-blue-600 transition-colors">
                          {order.poNumber}
                        </Link>
                      </div>
                      
                      <div className="w-full md:w-2/5 mb-1 md:mb-0 pr-4">
                        <span className="text-[13px] font-bold text-slate-900 block truncate">{order.productName}</span>
                        <span className="font-mono text-[11px] text-slate-500">{order.quantity.toLocaleString()} {order.unit}</span>
                      </div>
                      
                      <div className="w-full md:w-1/6 mb-1 md:mb-0">
                        <span className="font-mono text-[11px] text-[#0A192F] font-bold">
                          {order.currency} {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="w-full md:w-1/6 md:text-right">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${getSemanticStatusClass(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>

          {/* --- OPERATIONAL RAIL (30%) --- */}
          <aside className="lg:col-span-4 lg:pl-10 relative">
            <div className="sticky top-12 space-y-20">
              
              {/* OPERATIONS LOG */}
              <div>
                <div className="border-b-[2px] border-slate-900 pb-2 mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#0A192F]">
                    Operations Log
                  </h3>
                  <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
                    Latest Procurement Events
                  </span>
                </div>
                
                {recentTimeline.length === 0 ? (
                  <p className="text-xs font-mono text-slate-500 uppercase">NO RECENT EVENTS.</p>
                ) : (
                  <div className="relative border-l border-slate-200 ml-[3px] space-y-8 pb-4">
                    {recentTimeline.map((item, idx) => {
                      const isRfq = 'createdAt' in item;
                      const date = new Date(isRfq ? (item as BuyerRfq).createdAt : (item as PurchaseOrderResponse).placedAt);
                      const idStr = isRfq 
                        ? (item as BuyerRfq).rfqReference || `RFQ-${(item as BuyerRfq).id.substring(0, 8).toUpperCase()}`
                        : (item as PurchaseOrderResponse).poNumber;
                      const entityName = isRfq ? (item as BuyerRfq).supplierName : (item as PurchaseOrderResponse).supplierId.toString();
                      const status = isRfq ? (item as BuyerRfq).status : (item as PurchaseOrderResponse).status;

                      return (
                        <div key={`${isRfq ? 'rfq' : 'po'}-${item.id}-${idx}`} className="relative pl-6">
                          {/* Minimal Marker */}
                          <div className="absolute -left-[3.5px] top-1.5 w-[6px] h-[6px] bg-[#0A192F]" />
                          
                          <div className="flex flex-col">
                            <span className="font-mono text-[11px] text-slate-500 mb-1">
                              {date.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[11px] font-bold text-[#0A192F] uppercase tracking-widest">
                              {isRfq ? `RFQ ${status}` : `ORDER ${status}`}
                            </span>
                            <span className="font-mono text-[12px] font-medium text-slate-700 mt-1">
                              {idStr}
                            </span>
                            {entityName && (
                              <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                                {entityName}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SOURCING UTILITY (No Cards) */}
              <div className="border-t border-slate-200 pt-6">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0A192F] mb-3">
                  New Sourcing
                </h4>
                <Link
                  href="/products"
                  className="group block"
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 group-hover:text-blue-800 transition-colors block mb-1">
                    Search Chemical Registry →
                  </span>
                  <span className="text-xs text-slate-500 leading-relaxed block max-w-[250px]">
                    Browse chemical targets, APIs and pharmaceutical intermediates.
                  </span>
                </Link>
              </div>

              {/* PROCUREMENT SUPPORT (No Cards) */}
              <div className="border-t border-slate-200 pt-6">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0A192F] mb-3">
                  Procurement Support
                </h4>
                <Link
                  href="/support"
                  className="text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#0A192F] transition-colors block"
                >
                  Specialized sourcing assistance →
                </Link>
              </div>

            </div>
          </aside>
          
        </div>
      </div>
    </div>
  );
}
