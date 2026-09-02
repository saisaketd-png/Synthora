"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag,
  FileText,
  Truck,
  DollarSign,
  Search,
  RefreshCw,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";

type ActiveTab = "rfqs" | "quotations" | "orders" | "shipments";

export default function AdminMarketplacePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("rfqs");
  const [items, setItems] = useState<any[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("kemkendra_token") || localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      let url = "";
      if (activeTab === "rfqs") {
        url = `/api/v1/admin/transactions/rfqs?page=${page}&size=${pageSize}${searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : ""}`;
      } else if (activeTab === "quotations") {
        url = `/api/v1/admin/operations/marketplace/quotations?page=${page}&size=${pageSize}`;
      } else if (activeTab === "orders") {
        url = `/api/v1/admin/transactions/orders?page=${page}&size=${pageSize}${searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : ""}`;
      } else if (activeTab === "shipments") {
        url = `/api/v1/admin/operations/marketplace/shipments?page=${page}&size=${pageSize}${searchQuery ? `&trackingNumber=${encodeURIComponent(searchQuery)}` : ""}`;
      }

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setItems(data.content || []);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 0);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Failed to fetch marketplace operations data", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize, searchQuery]);

  useEffect(() => {
    setPage(0);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="max-w-[1560px] mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              <ShoppingBag className="w-3.5 h-3.5" />
              Platform Commerce & Fulfilment
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Marketplace Operations Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Cross-cutting administrative visibility into sourcing RFQs, supplier quotations, Purchase Orders, and live freight shipments.
            </p>
          </div>

          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-600" : ""}`} />
            Refresh Feed
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("rfqs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "rfqs"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            Requests for Quotation (RFQs)
          </button>

          <button
            onClick={() => setActiveTab("quotations")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "quotations"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Supplier Quotations
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "orders"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Purchase Orders
          </button>

          <button
            onClick={() => setActiveTab("shipments")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "shipments"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Truck className="w-4 h-4" />
            Logistics & Shipments
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === "shipments"
                ? "Search tracking number..."
                : "Search by keyword, reference, ID..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing <strong>{items.length}</strong> of <strong>{totalElements}</strong> total records
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading marketplace data...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto mb-1" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No transactions matching the selected category and search filters exist in the database.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                {activeTab === "rfqs" && (
                  <tr>
                    <th className="px-6 py-3.5">RFQ Code / ID</th>
                    <th className="px-6 py-3.5">Chemical Product</th>
                    <th className="px-6 py-3.5">Quantity</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Created Date</th>
                  </tr>
                )}
                {activeTab === "quotations" && (
                  <tr>
                    <th className="px-6 py-3.5">Quotation ID</th>
                    <th className="px-6 py-3.5">Supplier</th>
                    <th className="px-6 py-3.5">Unit Price</th>
                    <th className="px-6 py-3.5">Lead Time</th>
                    <th className="px-6 py-3.5">Action Type</th>
                    <th className="px-6 py-3.5">Created Date</th>
                  </tr>
                )}
                {activeTab === "orders" && (
                  <tr>
                    <th className="px-6 py-3.5">PO Number</th>
                    <th className="px-6 py-3.5">Total Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Payment Terms</th>
                    <th className="px-6 py-3.5">Created Date</th>
                  </tr>
                )}
                {activeTab === "shipments" && (
                  <tr>
                    <th className="px-6 py-3.5">Tracking Number</th>
                    <th className="px-6 py-3.5">Carrier</th>
                    <th className="px-6 py-3.5">PO Reference</th>
                    <th className="px-6 py-3.5">Supplier</th>
                    <th className="px-6 py-3.5">Est. Delivery</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {activeTab === "rfqs" &&
                  items.map((rfq) => (
                    <tr key={rfq.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono font-semibold text-purple-600 dark:text-purple-400">
                        {rfq.rfqCode || rfq.id?.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {rfq.productName || "Chemical Master Product"}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {rfq.targetQuantityKg ? `${rfq.targetQuantityKg.toLocaleString()} kg` : "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {rfq.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString() : ""}
                      </td>
                    </tr>
                  ))}

                {activeTab === "quotations" &&
                  items.map((quote) => (
                    <tr key={quote.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                        {quote.id?.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {quote.supplierName}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {quote.currency || "USD"} {quote.unitPrice?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {quote.leadTimeDays ? `${quote.leadTimeDays} days` : "Immediate"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {quote.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : ""}
                      </td>
                    </tr>
                  ))}

                {activeTab === "orders" &&
                  items.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {order.poNumber || order.id?.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {order.currency || "USD"} {order.totalAmount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {order.paymentTerms || "Standard Terms"}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                      </td>
                    </tr>
                  ))}

                {activeTab === "shipments" &&
                  items.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {shipment.trackingNumber}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {shipment.carrier}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-700 dark:text-slate-300">
                        {shipment.poNumber}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {shipment.supplierName}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {shipment.estimatedDeliveryDate
                          ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString()
                          : "In Transit"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                          {shipment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
