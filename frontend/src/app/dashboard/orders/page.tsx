"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBuyerOrders } from "@/features/order/api/getBuyerOrders";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
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
    }

    loadOrders();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/rfqs"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
              >
                Procurement
              </Link>
              <span className="text-slate-400">/</span>
              <span className="text-xs font-semibold text-[#17B5AE] uppercase tracking-wider">
                Purchase Orders
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">
              Purchase Orders
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Track and manage all issued commercial purchase orders and supplier commitments.
            </p>
          </div>

          <Link
            href="/dashboard/rfqs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 shadow-sm transition-all"
          >
            ← Back to RFQs
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#17B5AE] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 text-sm font-medium">Loading purchase orders...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-700 text-sm">
            <p className="font-semibold">Unable to load purchase orders</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              📋
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">No Purchase Orders Issued Yet</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                Once a supplier submits a quotation and you accept it, you can issue an official Purchase Order.
              </p>
            </div>
            <Link
              href="/dashboard/rfqs"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#17B5AE] text-white font-semibold text-sm hover:bg-[#149f99] shadow-md transition-all"
            >
              View My RFQs
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">PO Number</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Placed Date</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {po.poNumber}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 max-w-xs truncate">
                        {po.productName}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {po.quantity.toLocaleString()} {po.unit}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#17B5AE]">
                        {po.currency} {po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            po.status === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : po.status === "PLACED"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {po.status === "CONFIRMED" ? "● Confirmed" : "○ Placed"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(po.placedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/orders/${po.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-sm"
                        >
                          View PO →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
