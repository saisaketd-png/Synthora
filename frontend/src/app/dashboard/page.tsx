"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBuyerRfqs, BuyerRfq } from "@/features/rfq/api/getBuyerRfqs";
import { getBuyerOrders } from "@/features/order/api/getBuyerOrders";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";
import {
  FileText,
  Package,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

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
      <div className="p-8 max-w-7xl mx-auto min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
          Loading Procurement Desk...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <h3 className="text-sm font-bold uppercase tracking-wider">System Communication Notice</h3>
          </div>
          <p className="text-sm text-amber-800">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold rounded-xl text-xs transition-colors"
          >
            Retry Fetch
          </button>
        </div>
      </div>
    );
  }

  // Derived metrics
  const activeRfqsCount = rfqs.filter((r) => r.status !== "CLOSED" && r.status !== "CANCELLED").length;
  const pendingRfqsCount = rfqs.filter((r) => r.status === "SUBMITTED" || r.status === "PENDING" || r.status === "CONTACTED").length;
  const decisionReadyRfqsCount = rfqs.filter((r) => r.status === "QUOTED").length;
  const activeOrdersCount = orders.filter((o) => o.status !== "CANCELLED").length;
  const confirmedOrdersCount = orders.filter((o) => o.status === "CONFIRMED" || o.status === "PROCESSING" || o.status === "SHIPPED").length;

  const actionRequiredRfqs = rfqs.filter((r) => r.status === "QUOTED").sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const activeRfqsList = rfqs.filter((r) => r.status !== "QUOTED" && r.status !== "CLOSED" && r.status !== "CANCELLED").sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 8);

  const ordersList = [...orders].sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  ).slice(0, 8);

  const recentTimeline: (BuyerRfq | PurchaseOrderResponse)[] = [...rfqs, ...orders]
    .sort((a, b) => {
      const dateA = new Date('createdAt' in a ? a.createdAt : (a as PurchaseOrderResponse).placedAt).getTime();
      const dateB = new Date('createdAt' in b ? b.createdAt : (b as PurchaseOrderResponse).placedAt).getTime();
      return dateB - dateA;
    })
    .slice(0, 8);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
      case "CONFIRMED":
      case "DELIVERED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">{status}</span>;
      case "QUOTED":
      case "SHIPPED":
      case "PROCESSING":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">{status}</span>;
      case "SUBMITTED":
      case "PENDING":
      case "CONTACTED":
      case "PLACED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">{status}</span>;
      case "REJECTED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">{status}</span>;
      case "CANCELLED":
      case "CLOSED":
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">{status}</span>;
    }
  };

  const currentDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1440px] mx-auto space-y-8">
      
      {/* 1. Command Desk Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Building2 className="w-3.5 h-3.5" />
            Institutional Buyer Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Procurement Operations
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Monitor active chemical RFQs, evaluate supplier commercial quotations, and track order fulfillment milestones.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="text-left sm:text-right px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 shrink-0">
            <span className="block text-xs font-bold text-slate-800">{currentDateStr}</span>
            <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider">● Operations Online</span>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            New Sourcing RFQ
          </Link>
        </div>
      </div>

      {/* 2. Procurement KPI Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Decision Ready</span>
          <p className="text-3xl font-extrabold text-slate-900 font-mono">
            {decisionReadyRfqsCount.toString().padStart(2, '0')}
          </p>
          <span className="text-xs text-slate-500 font-medium">Quotes awaiting review</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Inquiries</span>
          <p className="text-3xl font-extrabold text-slate-900 font-mono">
            {activeRfqsCount.toString().padStart(2, '0')}
          </p>
          <span className="text-xs text-slate-500 font-medium">Total RFQs in progress</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Awaiting Quotes</span>
          <p className="text-3xl font-extrabold text-amber-600 font-mono">
            {pendingRfqsCount.toString().padStart(2, '0')}
          </p>
          <span className="text-xs text-slate-500 font-medium">Suppliers preparing quotes</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Purchase Orders</span>
          <p className="text-3xl font-extrabold text-slate-900 font-mono">
            {activeOrdersCount.toString().padStart(2, '0')}
          </p>
          <span className="text-xs text-slate-500 font-medium">Orders placed</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Fulfillment Active</span>
          <p className="text-3xl font-extrabold text-teal-600 font-mono">
            {confirmedOrdersCount.toString().padStart(2, '0')}
          </p>
          <span className="text-xs text-slate-500 font-medium">Confirmed & in transit</span>
        </div>
      </div>

      {/* 3. Main Grid (70% Tables / 30% Operations Log) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): Action Required, Active RFQs, Purchase Orders */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Action Required: Quotations Pending Decision */}
          {actionRequiredRfqs.length > 0 && (
            <section className="bg-white rounded-3xl border-2 border-blue-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                  <h2 className="text-sm font-extrabold text-blue-900 uppercase tracking-wider">
                    Quotations Ready for Review ({actionRequiredRfqs.length})
                  </h2>
                </div>
                <span className="text-xs font-bold text-blue-600">Action Required</span>
              </div>

              <div className="divide-y divide-slate-100">
                {actionRequiredRfqs.map((rfq) => (
                  <div
                    key={rfq.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 rounded-2xl p-3 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/rfqs/${rfq.id}`}
                          className="font-mono text-xs font-bold text-blue-600 hover:underline"
                        >
                          {rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`}
                        </Link>
                        {getStatusBadge(rfq.status)}
                      </div>
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {rfq.productName || "Specialty Chemical Target"}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        Supplier: <span className="text-slate-800 font-semibold">{rfq.supplierName || "Verified Supplier"}</span> • Volume: <span className="font-mono">{rfq.quantity.toLocaleString()} {rfq.unit}</span>
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/rfqs/${rfq.id}`}
                      className="inline-flex items-center justify-center gap-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
                    >
                      Review Quotation <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active Procurement RFQ Register */}
          <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Active Procurement Inquiries
                </h2>
              </div>
              <Link
                href="/dashboard/rfqs"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                View All RFQs <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {activeRfqsList.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-slate-500 font-medium">No active inquiries in pipeline.</p>
                <Link
                  href="/products"
                  className="inline-block text-xs font-bold text-blue-600 hover:underline"
                >
                  Browse chemical catalog to request sourcing quotes →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap text-sm border-collapse">
                  <thead className="border-b border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="pb-3 pr-4">Reference</th>
                      <th className="pb-3 pr-4">Product Target</th>
                      <th className="pb-3 pr-4">Supplier</th>
                      <th className="pb-3 pr-4">Volume</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {activeRfqsList.map((rfq) => (
                      <tr key={rfq.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pr-4 font-mono font-bold text-xs">
                          <Link href={`/dashboard/rfqs/${rfq.id}`} className="text-blue-600 hover:underline">
                            {rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`}
                          </Link>
                        </td>
                        <td className="py-3.5 pr-4 font-semibold text-slate-900 max-w-xs truncate">
                          {rfq.productName || "Specialty Chemical"}
                        </td>
                        <td className="py-3.5 pr-4 text-xs text-slate-600 truncate">
                          {rfq.supplierName || `Supplier #${rfq.supplierId}`}
                        </td>
                        <td className="py-3.5 pr-4 font-mono text-xs">
                          {rfq.quantity.toLocaleString()} {rfq.unit}
                        </td>
                        <td className="py-3.5 text-right">
                          {getStatusBadge(rfq.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Active Purchase Orders */}
          <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-700" />
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Purchase Orders & Fulfillment
                </h2>
              </div>
              <Link
                href="/dashboard/orders"
                className="text-xs font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
              >
                View All Orders <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {ordersList.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-slate-500 font-medium">No purchase orders issued yet.</p>
                <p className="text-xs text-slate-400">Accepted quotes will automatically generate purchase orders here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap text-sm border-collapse">
                  <thead className="border-b border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="pb-3 pr-4">PO Number</th>
                      <th className="pb-3 pr-4">Product</th>
                      <th className="pb-3 pr-4">Quantity</th>
                      <th className="pb-3 pr-4">Total Amount</th>
                      <th className="pb-3 text-right">Fulfillment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {ordersList.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pr-4 font-mono font-bold text-xs">
                          <Link href={`/dashboard/orders/${order.id}`} className="text-teal-700 hover:underline">
                            {order.poNumber}
                          </Link>
                        </td>
                        <td className="py-3.5 pr-4 font-semibold text-slate-900 max-w-xs truncate">
                          {order.productName}
                        </td>
                        <td className="py-3.5 pr-4 font-mono text-xs">
                          {order.quantity.toLocaleString()} {order.unit}
                        </td>
                        <td className="py-3.5 pr-4 font-mono text-xs font-bold text-slate-900">
                          {order.currency} ${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 text-right">
                          {getStatusBadge(order.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>

        {/* Right Column (4 cols): Operations Log & Quick Actions */}
        <aside className="lg:col-span-4 space-y-8">
          
          {/* Operations Timeline Log */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Operations Timeline
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Recent procurement transitions</span>
            </div>

            {recentTimeline.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No recent operations logged.</p>
            ) : (
              <div className="relative border-l border-slate-200 ml-2 space-y-5 py-1">
                {recentTimeline.map((item, idx) => {
                  const isRfq = 'createdAt' in item;
                  const date = new Date(isRfq ? (item as BuyerRfq).createdAt : (item as PurchaseOrderResponse).placedAt);
                  const refStr = isRfq
                    ? (item as BuyerRfq).rfqReference || `RFQ-${(item as BuyerRfq).id.substring(0, 8).toUpperCase()}`
                    : (item as PurchaseOrderResponse).poNumber;
                  const status = isRfq ? (item as BuyerRfq).status : (item as PurchaseOrderResponse).status;
                  const itemId = (item as BuyerRfq | PurchaseOrderResponse).id;
                  const itemLink = isRfq ? `/dashboard/rfqs/${itemId}` : `/dashboard/orders/${itemId}`;

                  return (
                    <div key={`${isRfq ? 'rfq' : 'po'}-${itemId}-${idx}`} className="relative pl-5">
                      <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {date.toLocaleDateString()}
                        </span>
                        <p className="text-xs font-bold text-slate-800">
                          {isRfq ? `RFQ ${status}` : `Order ${status}`}
                        </p>
                        <Link
                          href={itemLink}
                          className="font-mono text-xs font-semibold text-blue-600 hover:underline block truncate"
                        >
                          {refStr}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Sourcing Utility Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                Procurement Assistance
              </span>
              <h4 className="text-base font-extrabold text-white">
                Global Chemical Sourcing
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Need customized purity specifications or bulk container freight? Connect with verified manufacturers.
              </p>
            </div>

            <Link
              href="/products"
              className="inline-flex items-center justify-center w-full px-4 py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs rounded-xl transition-colors"
            >
              Search Chemical Registry →
            </Link>
          </div>

        </aside>

      </div>
    </div>
  );
}
