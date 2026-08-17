"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getBuyerOrder } from "@/features/order/api/getBuyerOrder";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";

export default function BuyerOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<PurchaseOrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await getBuyerOrder(orderId);
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load purchase order");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <div className="inline-block w-8 h-8 border-4 border-[#17B5AE] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 text-sm font-medium">Loading Purchase Order...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← Back to Purchase Orders
          </Link>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-700 text-sm">
            <p className="font-semibold">Unable to find Purchase Order</p>
            <p className="mt-1">{error || "Order not found"}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/orders"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
              >
                Purchase Orders
              </Link>
              <span className="text-slate-400">/</span>
              <span className="text-xs font-semibold text-[#17B5AE] font-mono uppercase tracking-wider">
                {order.poNumber}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mt-1 flex items-center gap-3">
              Purchase Order
              <span className="font-mono text-2xl text-slate-600 font-semibold">
                {order.poNumber}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/rfqs/${order.rfqId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 shadow-sm transition-all"
            >
              View Origin RFQ ↗
            </Link>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 shadow-sm transition-all"
            >
              ← Back to Orders
            </Link>
          </div>
        </div>

        {/* PO Sheet Card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden divide-y divide-slate-100">
          {/* Header Bar */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                Official Commercial Commitment
              </p>
              <p className="text-2xl font-mono font-bold text-white mt-1">
                {order.poNumber}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Issued on {new Date(order.placedAt).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  order.status === "CONFIRMED"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : order.status === "PLACED"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-slate-700 text-slate-300"
                }`}
              >
                {order.status === "CONFIRMED" ? "● Supplier Confirmed" : "○ Placed (Pending Confirmation)"}
              </span>
            </div>
          </div>

          {/* Metric Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 sm:p-8 bg-slate-50/50">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Order Value
              </p>
              <p className="text-2xl font-bold text-[#17B5AE] mt-1">
                {order.currency} {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Agreed Unit Price
              </p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {order.currency} {order.unitPrice.toFixed(2)}
                <span className="text-xs font-normal text-slate-500"> / {order.unit}</span>
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Order Quantity
              </p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {order.quantity.toLocaleString()} {order.unit}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Lead Time
              </p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {order.agreedLeadTimeDays ? `${order.agreedLeadTimeDays} Days` : "Standard"}
              </p>
            </div>
          </div>

          {/* Line Item Breakdown */}
          <div className="p-6 sm:p-8 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Procurement Line Items
            </h2>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Product Description</th>
                    <th className="px-6 py-3 text-right">Quantity</th>
                    <th className="px-6 py-3 text-right">Unit Price</th>
                    <th className="px-6 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{order.productName}</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">Product ID: {order.productId}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {order.quantity.toLocaleString()} {order.unit}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {order.currency} {order.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#17B5AE]">
                      {order.currency} {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery & Billing Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Delivery / Shipping Address
              </p>
              <p className="text-sm font-medium text-slate-900 whitespace-pre-line">
                {order.shippingAddress}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Billing / Procurement Contact
              </p>
              <p className="text-sm font-medium text-slate-900">
                {order.billingContact}
              </p>
              {order.notes && (
                <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Notes: </span>
                  {order.notes}
                </div>
              )}
            </div>
          </div>

          {/* Fulfillment Status Timeline */}
          <div className="p-6 sm:p-8 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Procurement & Order Milestone Tracker
            </h2>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="mt-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 text-sm">Purchase Order Issued</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(order.placedAt).toLocaleString()} — Formal purchase commitment transmitted to supplier
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div
                  className={`mt-1 h-3.5 w-3.5 rounded-full flex-shrink-0 ${
                    order.status === "CONFIRMED"
                      ? "bg-emerald-500 ring-4 ring-emerald-100"
                      : "bg-slate-300"
                  }`}
                />
                <div>
                  <p
                    className={`text-sm font-bold ${
                      order.status === "CONFIRMED" ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    Supplier Order Confirmation
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {order.confirmedAt
                      ? `${new Date(order.confirmedAt).toLocaleString()} — Supplier has formally confirmed and accepted the order`
                      : "Waiting for supplier to confirm receipt and verify fulfillment schedule"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
