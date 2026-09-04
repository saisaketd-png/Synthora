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

import { PageHeader } from "@/shared/components/ui/KemkendraUI";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

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

      const res = await authenticatedFetch(url);
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
    <div className="max-w-[1400px] mx-auto space-y-6 text-[#0F172A] pb-12">
      {/* 1. Calm Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#E4E4E7] pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#0052CC] block mb-1">
            Commerce Operations
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A]">
            Marketplace Operations
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-xl">
            Unified commercial activity ledger across sourcing RFQs, supplier quotes, purchase orders, and consignments.
          </p>
        </div>

        <button
          onClick={() => fetchData()}
          disabled={loading}
          className="h-8 px-3 text-xs font-medium text-[#475569] bg-white hover:bg-[#FAFAFA] border border-[#E4E4E7] rounded-[4px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0052CC]" : "text-[#64748B]"}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* 2. Unified Operations Ledger Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-[8px] border border-[#E4E4E7] shadow-xs">
        {/* Restrained Domain Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: "rfqs", label: "RFQs" },
            { id: "quotations", label: "Quotations" },
            { id: "orders", label: "Orders" },
            { id: "shipments", label: "Consignments" },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded-[4px] transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-[#0052CC] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#FAFAFA]"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Filter ${activeTab}...`}
            className="w-full pl-8 pr-2.5 py-1 text-xs bg-[#FAFAFA] border border-[#E4E4E7] rounded-[4px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0052CC]"
          />
        </div>
      </div>

      {/* Record Counter Strip */}
      <div className="flex items-center justify-between text-xs text-[#64748B] px-1">
        <span>Displaying <strong className="font-mono text-[#0F172A]">{items.length}</strong> of <strong className="font-mono text-[#0F172A]">{totalElements}</strong> operations records</span>
        <span className="font-mono text-[11px] uppercase">Domain: {activeTab}</span>
      </div>

      {/* Content Table */}
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] overflow-hidden shadow-tactile-card">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#64748B] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#0052CC]" />
            Loading {activeTab} operations feed...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            No {activeTab} records found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8FAFC] text-[#475569] uppercase text-[10px] font-mono font-semibold tracking-wider border-b border-[#E4E4E7]">
                {activeTab === "rfqs" && (
                  <tr>
                    <th className="px-4 py-3">RFQ Reference</th>
                    <th className="px-4 py-3">Chemical Product</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Workflow State</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                )}
                {activeTab === "quotations" && (
                  <tr>
                    <th className="px-4 py-3">Quote Reference</th>
                    <th className="px-4 py-3">Supplier Name</th>
                    <th className="px-4 py-3">Unit Price</th>
                    <th className="px-4 py-3">Lead Time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                )}
                {activeTab === "orders" && (
                  <tr>
                    <th className="px-4 py-3">PO Number</th>
                    <th className="px-4 py-3">Total Amount</th>
                    <th className="px-4 py-3">Fulfillment State</th>
                    <th className="px-4 py-3">Payment Terms</th>
                    <th className="px-4 py-3">Order Date</th>
                  </tr>
                )}
                {activeTab === "shipments" && (
                  <tr>
                    <th className="px-4 py-3">Waybill / Tracking</th>
                    <th className="px-4 py-3">Carrier</th>
                    <th className="px-4 py-3">PO Reference</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Est. Delivery</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-[#E4E4E7]">
                {activeTab === "rfqs" &&
                  items.map((rfq) => {
                    const status = (rfq.status || "").toUpperCase();
                    const badgeClass =
                      status.includes("ACCEPTED") || status.includes("COMPLETED")
                        ? "bg-[#ECFDF5] text-[#059669] border-[rgba(5,150,105,0.2)]"
                        : status.includes("PENDING") || status.includes("CONTACTED")
                        ? "bg-[#FFFBEB] text-[#D97706] border-[rgba(217,119,6,0.2)]"
                        : status.includes("CANCELLED") || status.includes("CLOSED") || status.includes("REJECTED")
                        ? "bg-[#FEF2F2] text-[#DC2626] border-[rgba(220,38,38,0.2)]"
                        : "bg-[#EFF6FF] text-[#0052CC] border-[#BFDBFE]";

                    return (
                      <tr key={rfq.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-[#0052CC]">
                          {rfq.rfqCode || (rfq.id ? rfq.id.substring(0, 8) : "—")}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#0F172A]">
                          {rfq.productName || "Chemical Master Product"}
                        </td>
                        <td className="px-4 py-3 text-[#334155] font-mono">
                          {rfq.targetQuantityKg ? `${rfq.targetQuantityKg.toLocaleString()} kg` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold border ${badgeClass}`}>
                            {rfq.status || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#64748B] font-mono text-[11px]">
                          {rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    );
                  })}

                {activeTab === "quotations" &&
                  items.map((quote) => {
                    const status = (quote.status || "").toUpperCase();
                    const badgeClass =
                      status.includes("ACCEPTED")
                        ? "bg-[#ECFDF5] text-[#059669] border-[rgba(5,150,105,0.2)]"
                        : status.includes("REJECTED")
                        ? "bg-[#FEF2F2] text-[#DC2626] border-[rgba(220,38,38,0.2)]"
                        : "bg-[#EFF6FF] text-[#0052CC] border-[#BFDBFE]";

                    return (
                      <tr key={quote.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-[#0052CC]">
                          {quote.id ? quote.id.substring(0, 8) : "—"}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#0F172A]">
                          {quote.supplierName || "—"}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-[#0F172A]">
                          {typeof quote.unitPrice === "number" ? `${quote.currency || "USD"} ${quote.unitPrice.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-[#334155]">
                          {quote.leadTimeDays ? `${quote.leadTimeDays} days` : "Immediate"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold border ${badgeClass}`}>
                            {quote.status || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#64748B] font-mono text-[11px]">
                          {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    );
                  })}

                {activeTab === "orders" &&
                  items.map((order) => {
                    const status = (order.status || "").toUpperCase();
                    const badgeClass =
                      status.includes("DELIVERED") || status.includes("CONFIRMED")
                        ? "bg-[#ECFDF5] text-[#059669] border-[rgba(5,150,105,0.2)]"
                        : status.includes("CANCELLED")
                        ? "bg-[#FEF2F2] text-[#DC2626] border-[rgba(220,38,38,0.2)]"
                        : status.includes("PROCESSING") || status.includes("SHIPPED")
                        ? "bg-[#EFF6FF] text-[#0052CC] border-[#BFDBFE]"
                        : "bg-[#FFFBEB] text-[#D97706] border-[rgba(217,119,6,0.2)]";

                    return (
                      <tr key={order.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-[#0052CC]">
                          {order.poNumber || (order.id ? order.id.substring(0, 8) : "—")}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-[#0F172A]">
                          {typeof order.totalAmount === "number" ? `${order.currency || "USD"} ${order.totalAmount.toLocaleString()}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold border ${badgeClass}`}>
                            {order.status || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#334155]">
                          {order.paymentTerms || "Standard Terms"}
                        </td>
                        <td className="px-4 py-3 text-[#64748B] font-mono text-[11px]">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    );
                  })}

                {activeTab === "shipments" &&
                  items.map((shipment) => {
                    const status = (shipment.status || "").toUpperCase();
                    const badgeClass =
                      status.includes("DELIVERED")
                        ? "bg-[#ECFDF5] text-[#059669] border-[rgba(5,150,105,0.2)]"
                        : "bg-[#EFF6FF] text-[#0052CC] border-[#BFDBFE]";

                    return (
                      <tr key={shipment.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-[#0052CC]">
                          {shipment.trackingNumber || "—"}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#0F172A]">
                          {shipment.carrier || "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-[#334155]">
                          {shipment.poNumber || "—"}
                        </td>
                        <td className="px-4 py-3 text-[#334155]">
                          {shipment.supplierName || "—"}
                        </td>
                        <td className="px-4 py-3 text-[#64748B] font-mono text-[11px]">
                          {shipment.estimatedDeliveryDate
                            ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString()
                            : "In Transit"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold border ${badgeClass}`}>
                            {shipment.status || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E4E4E7] bg-[#FAFAFA]">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center h-7 px-2.5 rounded-[4px] border border-[#E4E4E7] bg-white text-xs font-medium text-[#0F172A] hover:bg-[#F4F4F5] disabled:opacity-40 transition-colors cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-mono text-[#64748B]">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center h-7 px-2.5 rounded-[4px] border border-[#E4E4E7] bg-white text-xs font-medium text-[#0F172A] hover:bg-[#F4F4F5] disabled:opacity-40 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
