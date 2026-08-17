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
  TrendingUp,
} from "lucide-react";
import { getSupplierRfqs, SupplierRfq } from "@/features/rfq/api/getSupplierRfqs";
import { getSupplierOrders } from "@/features/order/api/getSupplierOrders";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";

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

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="inline-block w-8 h-8 border-4 border-[#17B5AE] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-500 text-sm font-medium">Loading supplier workspace overview...</p>
        </div>
      </div>
    );
  }

  // Real derived metrics
  const totalRfqs = rfqs.length;
  const pendingQuoteRfqs = rfqs.filter(
    (r) => r.status === "SUBMITTED" || r.status === "PENDING"
  ).length;
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
      {/* Supplier Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
              Supplier Sales & Fulfillment Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Supplier Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage incoming buyer RFQs, issue competitive price quotations, and confirm purchase orders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/supplier/rfqs"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all flex-shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-teal-400" />
            Open RFQ Inbox
          </Link>
        </div>
      </div>

      {/* Action Required Alert Banner if unconfirmed orders exist */}
      {awaitingConfirmationOrders > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-900">
                Action Required: {awaitingConfirmationOrders} Purchase Order{awaitingConfirmationOrders > 1 ? "s" : ""} Awaiting Confirmation
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Buyers have accepted your quotations and issued purchase orders. Confirm receipt to lock delivery timelines.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/supplier/orders"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex-shrink-0 text-center"
          >
            Review Orders →
          </Link>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* RFQs Received */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              RFQs Received
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-slate-900">{totalRfqs}</p>
            <Link
              href="/dashboard/supplier/rfqs"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              Inbox <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span>{pendingQuoteRfqs} New</span>
            <span>•</span>
            <span>{quotedRfqs} Quoted</span>
          </div>
        </div>

        {/* Actionable Quotes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Awaiting Quotation
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-slate-900">{pendingQuoteRfqs}</p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {pendingQuoteRfqs > 0 ? "Pending Quote" : "Up to date"}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
            Requests ready for price submission
          </div>
        </div>

        {/* Purchase Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Purchase Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#17B5AE] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-slate-900">{totalOrders}</p>
            <Link
              href="/dashboard/supplier/orders"
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

        {/* Confirmed Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Confirmed Orders
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
            Fulfillment schedule confirmed
          </div>
        </div>
      </div>

      {/* Two-Column Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent RFQs */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Incoming RFQs</h2>
              <p className="text-xs text-slate-500 mt-0.5">Requests assigned to your supplier profile</p>
            </div>
            <Link
              href="/dashboard/supplier/rfqs"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View Inbox ({totalRfqs}) <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {recentRfqs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No RFQs received yet. New buyer inquiries will appear here.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {recentRfqs.map((rfq) => (
                <Link
                  key={rfq.id}
                  href={`/dashboard/supplier/rfqs/${rfq.id}`}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors block"
                >
                  <div className="space-y-0.5">
                    <p className="font-mono font-bold text-slate-800">
                      RFQ #{rfq.id.substring(0, 8)}...
                    </p>
                    <p className="text-slate-500">
                      Buyer: <span className="font-mono">{rfq.buyerId.substring(0, 12)}...</span> • {rfq.quantity} {rfq.unit}
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
              <h2 className="text-sm font-bold text-slate-900">Assigned Purchase Orders</h2>
              <p className="text-xs text-slate-500 mt-0.5">Orders placed against your quotations</p>
            </div>
            <Link
              href="/dashboard/supplier/orders"
              className="text-xs font-bold text-[#17B5AE] hover:text-teal-700 flex items-center gap-1"
            >
              View all ({totalOrders}) <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No purchase orders assigned yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/supplier/orders/${order.id}`}
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
