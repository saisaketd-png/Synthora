"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupplierRfqs, SupplierRfq } from "@/features/rfq/api/getSupplierRfqs";
import { getSupplierOrders } from "@/features/order/api/getSupplierOrders";
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
  ShoppingCart,
} from "lucide-react";

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
      case "CLOSED":
      case "CANCELLED":
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
          Loading Supplier Operations...
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
            <h3 className="text-sm font-bold uppercase tracking-wider">Supplier Workspace Notice</h3>
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
  const totalRfqs = rfqs.length;
  const awaitingQuoteRfqs = rfqs.filter(r => r.status === "SUBMITTED" || r.status === "PENDING" || r.status === "CONTACTED");
  const quotedRfqs = rfqs.filter(r => r.status === "QUOTED");
  const totalOrders = orders.length;
  const awaitingConfirmationOrders = orders.filter(o => o.status === "PLACED");
  const confirmedOrders = orders.filter(o => o.status === "CONFIRMED" || o.status === "PROCESSING" || o.status === "SHIPPED");

  const recentRfqs = [...rfqs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
  const recentOrders = [...orders].sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()).slice(0, 8);

  const activityEvents: ActivityEvent[] = [];
  rfqs.forEach(rfq => {
    activityEvents.push({
      id: `rcv-${rfq.id}`,
      type: "RFQ_RECEIVED",
      reference: rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`,
      timestamp: new Date(rfq.createdAt),
      link: `/dashboard/supplier/rfqs/${rfq.id}`
    });
    if (rfq.status === "QUOTED" || rfq.status === "ACCEPTED") {
      activityEvents.push({
        id: `qto-${rfq.id}`,
        type: "QUOTATION_SUBMITTED",
        reference: rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`,
        timestamp: new Date(rfq.createdAt),
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
    .slice(0, 8);

  const currentDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1440px] mx-auto space-y-8">
      
      {/* 1. Header Desk */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Building2 className="w-3.5 h-3.5" />
            Verified Chemical Manufacturer
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Supplier Operations
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Manage incoming chemical sourcing inquiries, submit commercial quotations, and fulfill customer purchase orders.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="text-left sm:text-right px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 shrink-0">
            <span className="block text-xs font-bold text-slate-800">{currentDateStr}</span>
            <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Commercial Desk</span>
          </div>
          <Link
            href="/dashboard/supplier/products/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#0A192F] hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Add Chemical Product
          </Link>
        </div>
      </div>

      {/* 2. KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Inquiries</span>
          <p className="text-3xl font-extrabold text-slate-900 font-mono">
            {totalRfqs.toString().padStart(2, "0")}
          </p>
          <span className="text-xs text-slate-500 font-medium">All customer requests</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Awaiting Quotes</span>
          <p className="text-3xl font-extrabold text-amber-600 font-mono">
            {awaitingQuoteRfqs.length.toString().padStart(2, "0")}
          </p>
          <span className="text-xs text-slate-500 font-medium">Inquiries to quote</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Quoted</span>
          <p className="text-3xl font-extrabold text-blue-600 font-mono">
            {quotedRfqs.length.toString().padStart(2, "0")}
          </p>
          <span className="text-xs text-slate-500 font-medium">Awaiting buyer decision</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Orders Received</span>
          <p className="text-3xl font-extrabold text-slate-900 font-mono">
            {totalOrders.toString().padStart(2, "0")}
          </p>
          <span className="text-xs text-slate-500 font-medium">All purchase orders</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Active Fulfillment</span>
          <p className="text-3xl font-extrabold text-teal-600 font-mono">
            {confirmedOrders.length.toString().padStart(2, "0")}
          </p>
          <span className="text-xs text-slate-500 font-medium">Confirmed & in transit</span>
        </div>
      </div>

      {/* 3. Main Grid (70% Tables / 30% Operations Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): Action Required, RFQs, POs */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Action Required: Unconfirmed Orders & Unquoted RFQs */}
          {(awaitingConfirmationOrders.length > 0 || awaitingQuoteRfqs.length > 0) && (
            <section className="bg-white rounded-3xl border-2 border-amber-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <h2 className="text-sm font-extrabold text-amber-900 uppercase tracking-wider">
                    Commercial Actions Required ({awaitingConfirmationOrders.length + awaitingQuoteRfqs.length})
                  </h2>
                </div>
                <span className="text-xs font-bold text-amber-700">Action Required</span>
              </div>

              <div className="divide-y divide-slate-100">
                {awaitingConfirmationOrders.map((order) => (
                  <div
                    key={order.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 rounded-2xl p-3 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/supplier/orders/${order.id}`}
                          className="font-mono text-xs font-bold text-teal-700 hover:underline"
                        >
                          {order.poNumber}
                        </Link>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          NEW PURCHASE ORDER
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {order.productName}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        Volume: <span className="font-mono">{order.quantity.toLocaleString()} {order.unit}</span> • Total: <span className="font-bold text-slate-900">{order.currency} ${order.totalAmount.toFixed(2)}</span>
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/supplier/orders/${order.id}`}
                      className="inline-flex items-center justify-center gap-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
                    >
                      Confirm Order <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}

                {awaitingQuoteRfqs.map((rfq) => (
                  <div
                    key={rfq.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 rounded-2xl p-3 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/supplier/rfqs/${rfq.id}`}
                          className="font-mono text-xs font-bold text-blue-600 hover:underline"
                        >
                          {rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`}
                        </Link>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          NEW INQUIRY
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {rfq.productName || "Specialty Chemical Target"}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        Buyer: <span className="text-slate-800 font-semibold">{rfq.buyerName || "Institutional Buyer"}</span> • Volume: <span className="font-mono">{rfq.quantity.toLocaleString()} {rfq.unit}</span>
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/supplier/rfqs/${rfq.id}`}
                      className="inline-flex items-center justify-center gap-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
                    >
                      Submit Quote <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Incoming RFQ Register */}
          <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Incoming RFQ Inquiries
                </h2>
              </div>
              <Link
                href="/dashboard/supplier/rfqs"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                View All RFQs <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentRfqs.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-slate-500 font-medium">No incoming RFQs recorded yet.</p>
                <Link
                  href="/dashboard/supplier/products/new"
                  className="inline-block text-xs font-bold text-purple-700 hover:underline"
                >
                  Add chemical products to your catalog to start receiving customer inquiries →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap text-sm border-collapse">
                  <thead className="border-b border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="pb-3 pr-4">Reference</th>
                      <th className="pb-3 pr-4">Product</th>
                      <th className="pb-3 pr-4">Buyer Organization</th>
                      <th className="pb-3 pr-4">Volume</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentRfqs.map((rfq) => (
                      <tr key={rfq.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pr-4 font-mono font-bold text-xs">
                          <Link href={`/dashboard/supplier/rfqs/${rfq.id}`} className="text-blue-600 hover:underline">
                            {rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`}
                          </Link>
                        </td>
                        <td className="py-3.5 pr-4 font-semibold text-slate-900 max-w-xs truncate">
                          {rfq.productName || "Specialty Chemical"}
                        </td>
                        <td className="py-3.5 pr-4 text-xs text-slate-600 truncate">
                          {rfq.buyerName || "Institutional Buyer"}
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

          {/* Incoming Orders Register */}
          <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-teal-700" />
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Incoming Purchase Orders
                </h2>
              </div>
              <Link
                href="/dashboard/supplier/orders"
                className="text-xs font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
              >
                View All Orders <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-slate-500 font-medium">No purchase orders received yet.</p>
                <p className="text-xs text-slate-400">Accepted quotes from buyers will automatically generate purchase orders here.</p>
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
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pr-4 font-mono font-bold text-xs">
                          <Link href={`/dashboard/supplier/orders/${order.id}`} className="text-teal-700 hover:underline">
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

        {/* Right Column (4 cols): Workflow Guide & Activity Log */}
        <aside className="lg:col-span-4 space-y-8">
          
          {/* Supplier Commercial Workflow Checklist */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Supplier Fulfillment Lifecycle
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Standard procurement stages</span>
            </div>

            <div className="border-l-2 border-purple-200 ml-2 space-y-4 py-1">
              <div className="relative pl-4">
                <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-purple-600" />
                <p className="text-xs font-bold text-slate-800">1. Inquiry Received</p>
                <p className="text-[11px] text-slate-500 leading-tight">Review buyer specifications & volume</p>
              </div>
              <div className="relative pl-4">
                <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-purple-600" />
                <p className="text-xs font-bold text-slate-800">2. Submit Quotation</p>
                <p className="text-[11px] text-slate-500 leading-tight">Define unit price, MOQ & lead time</p>
              </div>
              <div className="relative pl-4">
                <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-purple-600" />
                <p className="text-xs font-bold text-slate-800">3. Purchase Order</p>
                <p className="text-[11px] text-slate-500 leading-tight">Confirm customer PO or provide reason</p>
              </div>
              <div className="relative pl-4">
                <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-purple-600" />
                <p className="text-xs font-bold text-slate-800">4. Processing & Dispatch</p>
                <p className="text-[11px] text-slate-500 leading-tight">Update tracking number & delivery date</p>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Commercial Activity Log
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Recent platform transitions</span>
            </div>

            {sortedActivities.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No recent activity recorded.</p>
            ) : (
              <div className="relative border-l border-slate-200 ml-2 space-y-4 py-1">
                {sortedActivities.map(activity => (
                  <div key={activity.id} className="relative pl-5 group">
                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {activity.timestamp.toLocaleDateString()}
                    </span>
                    <p className="text-xs font-bold text-slate-800">
                      {activity.type.replace("_", " ")}
                    </p>
                    <Link
                      href={activity.link}
                      className="font-mono text-xs font-semibold text-purple-700 hover:underline block truncate"
                    >
                      {activity.reference}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

        </aside>

      </div>
    </div>
  );
}
