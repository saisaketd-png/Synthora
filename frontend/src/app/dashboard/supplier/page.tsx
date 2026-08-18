"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupplierRfqs, SupplierRfq } from "@/features/rfq/api/getSupplierRfqs";
import { getSupplierOrders } from "@/features/order/api/getSupplierOrders";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";

type ActivityEvent = {
  id: string;
  type: "RFQ_RECEIVED" | "QUOTATION_SUBMITTED" | "ORDER_RECEIVED";
  reference: string;
  timestamp: Date;
  link: string;
};

export default function SupplierDashboardOverviewPage() {
  const [rfqs, setRfqs] = useState<SupplierRfq[]>([]);
  const [orders, setOrders] = useState<PurchaseOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSupplierData() {
      try {
        setLoading(true);
        setError(null);
        const [rfqsData, ordersData] = await Promise.all([
          getSupplierRfqs().catch(() => [] as SupplierRfq[]),
          getSupplierOrders().catch(() => [] as PurchaseOrderResponse[]),
        ]);
        setRfqs(rfqsData);
        setOrders(ordersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load supplier workspace");
      } finally {
        setLoading(false);
      }
    }

    loadSupplierData();
  }, []);

  const getSemanticStatusClass = (status: string) => {
    switch (status) {
      case "ACCEPTED":
      case "CONFIRMED":
      case "DELIVERED": return "text-teal-600";
      case "QUOTED": return "text-blue-600";
      case "PENDING":
      case "CONTACTED":
      case "PLACED": return "text-orange-500";
      case "REJECTED": return "text-red-700";
      case "CLOSED":
      case "CANCELLED": return "text-slate-500";
      default: return "text-slate-600";
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center bg-white">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest animate-pulse">
          LOADING SUPPLIER OPERATIONS...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto bg-white min-h-[50vh]">
        <div className="border-l-[3px] border-orange-500 pl-4 py-1">
          <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">System Error</p>
          <p className="text-sm font-mono text-slate-700 mt-2">UNABLE TO LOAD SUPPLIER OPERATIONS DATA</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[#0A192F] hover:text-blue-600 transition-colors"
          >
            RETRY FETCH →
          </button>
        </div>
      </div>
    );
  }

  // Derived metrics
  const totalRfqs = rfqs.length;
  const awaitingQuoteRfqs = rfqs.filter(r => r.status === "SUBMITTED" || r.status === "PENDING");
  const quotedRfqs = rfqs.filter(r => r.status === "QUOTED");
  
  const totalOrders = orders.length;
  const awaitingConfirmationOrders = orders.filter(o => o.status === "PLACED");
  const confirmedOrders = orders.filter(o => o.status === "CONFIRMED");

  // Registers
  const recentRfqs = [...rfqs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
  const recentOrders = [...orders].sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()).slice(0, 8);

  // Operations Log Generation
  const activityEvents: ActivityEvent[] = [];
  rfqs.forEach(rfq => {
    activityEvents.push({
      id: `rcv-${rfq.id}`,
      type: "RFQ_RECEIVED",
      reference: rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`,
      timestamp: new Date(rfq.createdAt),
      link: `/dashboard/supplier/rfqs/${rfq.id}`
    });
    // NOTE: In a real system, quotation timestamp would be available. We approximate here.
    if (rfq.status === "QUOTED" || rfq.status === "ACCEPTED") {
      activityEvents.push({
        id: `qto-${rfq.id}`,
        type: "QUOTATION_SUBMITTED",
        reference: rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`,
        timestamp: new Date(new Date(rfq.createdAt).getTime() + 86400000), // Approx +1 day
        link: `/dashboard/supplier/rfqs/${rfq.id}`
      });
    }
  });
  orders.forEach(order => {
    activityEvents.push({
      id: `ord-${order.id}`,
      type: "ORDER_RECEIVED",
      reference: order.poNumber,
      timestamp: new Date(order.placedAt),
      link: `/dashboard/supplier/orders/${order.id}`
    });
  });

  const sortedActivities = activityEvents
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pb-24">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">

        {/* =========================================
            EDITORIAL HEADER
            ========================================= */}
        <header className="border-t-[3px] border-[#0A192F] pt-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="max-w-2xl">
              <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                SUPPLIER OPERATIONS / COMMERCIAL DESK
              </span>
              <h1 className="text-4xl lg:text-5xl font-sans font-extrabold text-[#0A192F] tracking-tighter mb-4">
                Supplier Operations
              </h1>
              <p className="text-sm text-slate-600 font-medium">
                Manage incoming sourcing requests, commercial quotations and purchase orders.
              </p>
            </div>
          </div>
        </header>

        {/* =========================================
            OPERATIONAL INDEX
            ========================================= */}
        <div className="flex flex-wrap sm:flex-nowrap border-y border-slate-200 py-6 mb-12 gap-y-8 gap-x-12">
          <div className="flex flex-col">
            <span className="font-mono text-3xl font-bold text-[#0A192F]">
              {totalRfqs.toString().padStart(2, "0")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
              TOTAL INQUIRIES
            </span>
          </div>
          <div className="hidden sm:block w-px bg-slate-200" />
          <div className="flex flex-col">
            <span className="font-mono text-3xl font-bold text-orange-600">
              {awaitingQuoteRfqs.length.toString().padStart(2, "0")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
              AWAITING QUOTE
            </span>
          </div>
          <div className="hidden sm:block w-px bg-slate-200" />
          <div className="flex flex-col">
            <span className="font-mono text-3xl font-bold text-[#0A192F]">
              {quotedRfqs.length.toString().padStart(2, "0")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
              QUOTED
            </span>
          </div>
          <div className="hidden sm:block w-px bg-slate-200" />
          <div className="flex flex-col">
            <span className="font-mono text-3xl font-bold text-[#0A192F]">
              {totalOrders.toString().padStart(2, "0")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
              ORDERS PLACED
            </span>
          </div>
          <div className="hidden sm:block w-px bg-slate-200" />
          <div className="flex flex-col">
            <span className="font-mono text-3xl font-bold text-teal-600">
              {confirmedOrders.length.toString().padStart(2, "0")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
              CONFIRMED
            </span>
          </div>
        </div>

        {/* =========================================
            ASYMMETRIC GRID (70/30)
            ========================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* LEFT COLUMN: MAIN OPERATIONS (70%) */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-16">

            {/* 01 / ACTION REQUIRED */}
            {(awaitingConfirmationOrders.length > 0 || awaitingQuoteRfqs.length > 0) && (
              <section>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-orange-600 mb-6 flex items-center gap-4">
                  <span className="text-orange-300">01 /</span> ACTION REQUIRED
                  <div className="h-px bg-slate-200 flex-1 ml-4" />
                </h2>

                <div className="divide-y divide-slate-200 border-y border-slate-200">
                  {awaitingConfirmationOrders.map(order => (
                    <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-5 pl-4 border-l-2 border-orange-500 hover:bg-slate-50 transition-colors">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 flex-1">
                        <div>
                          <span className="font-mono text-sm font-bold text-[#0A192F]">{order.poNumber}</span>
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">PURCHASE ORDER</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-sm font-bold text-[#0A192F] truncate block">{order.productName}</span>
                          <span className="font-mono text-[11px] text-slate-500 mt-1">{order.quantity.toLocaleString()} {order.unit.toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold uppercase tracking-widest text-orange-500">PLACED</span>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 sm:ml-4 shrink-0">
                        <Link
                          href={`/dashboard/supplier/orders/${order.id}`}
                          className="inline-block px-6 py-2 bg-[#0A192F] hover:bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest transition-colors"
                        >
                          CONFIRM ORDER →
                        </Link>
                      </div>
                    </div>
                  ))}

                  {awaitingQuoteRfqs.map(rfq => (
                    <div key={rfq.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-5 pl-4 border-l-2 border-orange-500 hover:bg-slate-50 transition-colors">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 flex-1">
                        <div>
                          <span className="font-mono text-sm font-bold text-[#0A192F]">{rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`}</span>
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">INQUIRY</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-sm font-bold text-[#0A192F] truncate block">{rfq.productName || "Specialty Chemical"}</span>
                          <span className="font-mono text-[11px] text-slate-500 mt-1">{rfq.quantity.toLocaleString()} {rfq.unit.toUpperCase()} • {rfq.buyerName || "Buyer Organization"}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold uppercase tracking-widest text-orange-500">AWAITING QUOTE</span>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 sm:ml-4 shrink-0">
                        <Link
                          href={`/dashboard/supplier/rfqs/${rfq.id}`}
                          className="inline-block px-6 py-2 bg-[#0A192F] hover:bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest transition-colors"
                        >
                          SUBMIT QUOTE →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 02 / INCOMING RFQ REGISTER */}
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
                <span className="text-slate-300">{(awaitingConfirmationOrders.length > 0 || awaitingQuoteRfqs.length > 0) ? "02" : "01"} /</span> INCOMING RFQ REGISTER
                <div className="h-px bg-slate-200 flex-1 ml-4" />
              </h2>

              {recentRfqs.length === 0 ? (
                <div className="border-t border-slate-200 pt-8">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">NO ACTIVE RFQ INQUIRIES</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap pr-6">RFQ REFERENCE</th>
                        <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap pr-6">PRODUCT</th>
                        <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap pr-6">BUYER</th>
                        <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap pr-6">QUANTITY</th>
                        <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap pr-6">RECEIVED</th>
                        <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentRfqs.map((rfq) => (
                        <tr key={rfq.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="py-4 pr-6">
                            <Link href={`/dashboard/supplier/rfqs/${rfq.id}`} className="font-mono text-xs font-bold text-[#0A192F] group-hover:text-blue-600 transition-colors">
                              {rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`}
                            </Link>
                          </td>
                          <td className="py-4 pr-6 text-sm font-semibold text-slate-800 max-w-[200px] truncate">
                            {rfq.productName || "Specialty Chemical"}
                          </td>
                          <td className="py-4 pr-6 text-xs text-slate-600 truncate max-w-[150px]">
                            {rfq.buyerName || "Buyer Organization"}
                          </td>
                          <td className="py-4 pr-6 font-mono text-xs text-slate-600">
                            {rfq.quantity.toLocaleString()} {rfq.unit.toUpperCase()}
                          </td>
                          <td className="py-4 pr-6 font-mono text-xs text-slate-500">
                            {new Date(rfq.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                          </td>
                          <td className="py-4">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${getSemanticStatusClass(rfq.status)}`}>
                              {rfq.status === "SUBMITTED" || rfq.status === "PENDING" ? "AWAITING QUOTE" : rfq.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-6">
                    <Link
                      href="/dashboard/supplier/rfqs"
                      className="text-[10px] font-bold uppercase tracking-widest text-[#0A192F] hover:text-blue-600 transition-colors"
                    >
                      VIEW ALL RFQS →
                    </Link>
                  </div>
                </div>
              )}
            </section>

            {/* 03 / ORDER ACTIVITY */}
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
                <span className="text-slate-300">{(awaitingConfirmationOrders.length > 0 || awaitingQuoteRfqs.length > 0) ? "03" : "02"} /</span> ORDER ACTIVITY
                <div className="h-px bg-slate-200 flex-1 ml-4" />
              </h2>

              {recentOrders.length === 0 ? (
                <div className="border-t border-slate-200 pt-8">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">NO ACTIVE PURCHASE ORDERS</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap pr-6">PO NUMBER</th>
                        <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap pr-6">PRODUCT</th>
                        <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap pr-6">BUYER</th>
                        <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap pr-6">QUANTITY</th>
                        <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap pr-6">DATE</th>
                        <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="py-4 pr-6">
                            <Link href={`/dashboard/supplier/orders/${order.id}`} className="font-mono text-xs font-bold text-[#0A192F] group-hover:text-teal-600 transition-colors">
                              {order.poNumber}
                            </Link>
                          </td>
                          <td className="py-4 pr-6 text-sm font-semibold text-slate-800 max-w-[200px] truncate">
                            {order.productName}
                          </td>
                          <td className="py-4 pr-6 text-xs text-slate-600 truncate max-w-[150px]">
                            {/* Buyer information not available on PO response */}
                            —
                          </td>
                          <td className="py-4 pr-6 font-mono text-xs text-slate-600">
                            {order.quantity.toLocaleString()} {order.unit.toUpperCase()}
                          </td>
                          <td className="py-4 pr-6 font-mono text-xs text-slate-500">
                            {new Date(order.placedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                          </td>
                          <td className="py-4">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${getSemanticStatusClass(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-6">
                    <Link
                      href="/dashboard/supplier/orders"
                      className="text-[10px] font-bold uppercase tracking-widest text-[#0A192F] hover:text-blue-600 transition-colors"
                    >
                      VIEW ALL ORDERS →
                    </Link>
                  </div>
                </div>
              )}
            </section>

          </div>

          {/* RIGHT COLUMN: OPERATIONS RAIL (30%) */}
          <div className="lg:col-span-4 xl:col-span-3 border-t lg:border-t-0 lg:border-l border-slate-200 pt-8 lg:pt-0 lg:pl-12 lg:pr-4">
            
            <div className="sticky top-8 space-y-16">
              
              {/* SUPPLIER WORKFLOW */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-200 pb-2">
                  SUPPLIER WORKFLOW
                </span>
                
                <div className="border-l border-slate-200 ml-1.5 space-y-6 pt-2 pb-2">
                  <div className="relative pl-5">
                    <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-300 -left-[3.5px] top-1.5" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">RFQ RECEIVED</p>
                  </div>
                  <div className="relative pl-5">
                    <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-300 -left-[3.5px] top-1.5" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">REVIEW REQUIREMENTS</p>
                  </div>
                  <div className="relative pl-5">
                    <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-300 -left-[3.5px] top-1.5" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">SUBMIT QUOTATION</p>
                  </div>
                  <div className="relative pl-5">
                    <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-300 -left-[3.5px] top-1.5" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">BUYER DECISION</p>
                  </div>
                  <div className="relative pl-5">
                    <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-300 -left-[3.5px] top-1.5" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">PURCHASE ORDER</p>
                  </div>
                  <div className="relative pl-5">
                    <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-300 -left-[3.5px] top-1.5" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">CONFIRM ORDER</p>
                  </div>
                </div>
              </div>

              {/* OPERATIONS LOG */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-200 pb-2">
                  OPERATIONS LOG
                </span>
                
                {sortedActivities.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No recent activity.</p>
                ) : (
                  <div className="border-l border-slate-200 ml-1.5 space-y-6 pt-2">
                    {sortedActivities.map(activity => (
                      <div key={activity.id} className="relative pl-5 group">
                        <div className="absolute w-1.5 h-1.5 rounded-full bg-blue-600 -left-[3.5px] top-1.5 group-hover:scale-150 transition-transform" />
                        <p className="font-mono text-[10px] text-slate-400 mb-0.5">
                          {activity.timestamp.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })} • {activity.timestamp.toLocaleDateString("en-GB", { day: '2-digit', month: 'short' }).toUpperCase()}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#0A192F]">
                          {activity.type.replace("_", " ")}
                        </p>
                        <Link href={activity.link} className="font-mono text-[10px] text-blue-600 hover:text-blue-800 transition-colors mt-0.5 block">
                          {activity.reference}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
