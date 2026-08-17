"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Package,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
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
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="inline-block w-8 h-8 border-4 border-[#17B5AE] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-500 text-sm font-medium">Loading workspace overview...</p>
        </div>
      </div>
    );
  }

  // Real derived KPIs
  const totalRfqs = rfqs.length;
  const pendingRfqs = rfqs.filter((r) => r.status === "SUBMITTED" || r.status === "PENDING").length;
  const quotedRfqs = rfqs.filter((r) => r.status === "QUOTED").length;
  const acceptedRfqs = rfqs.filter((r) => r.status === "ACCEPTED").length;
  const totalOrders = orders.length;
  const awaitingConfirmationOrders = orders.filter((o) => o.status === "PLACED").length;
  const confirmedOrders = orders.filter((o) => o.status === "CONFIRMED").length;

  const recentRfqs = [...rfqs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  const recentOrders = [...orders].sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  ).slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Procurement Command Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Buyer Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor active chemical inquiries, evaluate supplier quotation versions, and track purchase order fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex-shrink-0"
          >
            <Building2 className="w-3.5 h-3.5" />
            + Request New Quote
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total RFQs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total RFQs Issued
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-slate-900">{totalRfqs}</p>
            <Link
              href="/dashboard/rfqs"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span>{quotedRfqs} Quoted</span>
            <span>•</span>
            <span>{acceptedRfqs} Accepted</span>
          </div>
        </div>

        {/* Actionable Quotes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Quotes Ready for Review
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-slate-900">{quotedRfqs}</p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {quotedRfqs > 0 ? "Decision Ready" : "Up to date"}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
            {quotedRfqs > 0 ? "Quotations awaiting your comparison" : "No pending quotes requiring decision"}
          </div>
        </div>

        {/* Purchase Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Purchase Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#17B5AE] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-slate-900">{totalOrders}</p>
            <Link
              href="/dashboard/orders"
              className="text-xs font-bold text-[#17B5AE] hover:text-teal-700 flex items-center gap-0.5"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span>{awaitingConfirmationOrders} Placed</span>
            <span>•</span>
            <span>{confirmedOrders} Confirmed</span>
          </div>
        </div>

        {/* Confirmed / Active Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Supplier Confirmed
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-slate-900">{confirmedOrders}</p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
            Orders confirmed by supplier
          </div>
        </div>
      </div>

      {/* Quick Action Band */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
            Enterprise Procurement Workflow
          </span>
          <h2 className="text-lg font-bold text-white mt-1">
            Looking for specialized pharmaceutical or chemical raw materials?
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Explore audited suppliers, request custom quantity batches, and negotiate quotes with multi-version tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          <Link
            href="/products"
            className="px-4 py-2.5 bg-[#17B5AE] hover:bg-[#149d97] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            Browse Catalog
          </Link>
          <Link
            href="/dashboard/rfqs"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            My RFQs
          </Link>
        </div>
      </div>

      {/* Two-Column Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent RFQs */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent RFQs</h2>
              <p className="text-xs text-slate-500 mt-0.5">Latest quotation requests</p>
            </div>
            <Link
              href="/dashboard/rfqs"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all ({totalRfqs}) <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {recentRfqs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No RFQs submitted yet. Start by browsing products.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {recentRfqs.map((rfq) => (
                <Link
                  key={rfq.id}
                  href={`/dashboard/rfqs/${rfq.id}`}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors block"
                >
                  <div className="space-y-0.5">
                    <p className="font-mono font-bold text-slate-800">
                      RFQ #{rfq.id.substring(0, 8)}...
                    </p>
                    <p className="text-slate-500">
                      Product ID: <span className="font-mono">{rfq.productId.substring(0, 12)}...</span> • {rfq.quantity} {rfq.unit}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rfq.status === "ACCEPTED"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : rfq.status === "QUOTED"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {rfq.status}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {new Date(rfq.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Purchase Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Purchase Orders</h2>
              <p className="text-xs text-slate-500 mt-0.5">Placed procurement orders</p>
            </div>
            <Link
              href="/dashboard/orders"
              className="text-xs font-bold text-[#17B5AE] hover:text-teal-700 flex items-center gap-1"
            >
              View all ({totalOrders}) <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No purchase orders issued yet. Accept a quotation to issue a PO.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors block"
                >
                  <div className="space-y-0.5">
                    <p className="font-mono font-bold text-slate-800">
                      {order.poNumber}
                    </p>
                    <p className="text-slate-500">
                      {order.productName} • {order.quantity} {order.unit}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-[#17B5AE]">
                      {order.currency} {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      order.status === "CONFIRMED"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
