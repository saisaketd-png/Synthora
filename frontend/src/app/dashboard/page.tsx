"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getBuyerRfqs, BuyerRfq } from "@/features/rfq/api/getBuyerRfqs";
import { getBuyerOrders } from "@/features/order/api/getBuyerOrders";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";
import {
  FileText,
  Package,
  Plus,
  Building2,
  ShoppingCart,
  FlaskConical,
  Layers,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { PageHeader, StatusBadge } from "@/shared/components/ui/KemkendraUI";

export default function BuyerDashboardOverviewPage() {
  const [rfqs, setRfqs] = useState<BuyerRfq[]>([]);
  const [orders, setOrders] = useState<PurchaseOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [rfqsData, ordersData] = await Promise.all([
        getBuyerRfqs().catch(() => [] as BuyerRfq[]),
        getBuyerOrders().catch(() => [] as PurchaseOrderResponse[]),
      ]);
      setRfqs(rfqsData);
      setOrders(ordersData);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Derived metrics
  const activeRfqs = rfqs.filter((r) => r.status !== "CLOSED" && r.status !== "CANCELLED");
  const decisionReadyRfqs = rfqs.filter((r) => r.status === "QUOTED");
  const inProgressOrders = orders.filter(
    (o) => o.status === "CONFIRMED" || o.status === "PROCESSING" || o.status === "SHIPPED"
  );
  const totalOrders = orders.filter((o) => o.status !== "CANCELLED");

  return (
    <div className="space-y-6 pb-12 text-[#0F172A]">
      {/* 1. Standard Enterprise Page Header */}
      <PageHeader
        title="Buyer Procurement Desk"
        description="Monitor chemical sourcing RFQs, evaluate supplier commercial quotations, and track order fulfillment milestones."
        actions={
          <Link
            href="/rfq"
            className="inline-flex items-center gap-1.5 px-3.5 h-9 text-xs font-medium text-white bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] rounded-[6px] transition-colors shadow-xs active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Sourcing RFQ</span>
          </Link>
        }
      />

      {/* 2. Structured Operational KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          href="/dashboard/rfqs"
          className="p-3.5 bg-white border border-[#E4E4E7] rounded-[8px] hover:border-[#0052CC] transition-colors group shadow-tactile-card block"
        >
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-semibold uppercase tracking-wider font-mono">
              Active Sourcing RFQs
            </span>
            <FileText className="w-3.5 h-3.5 group-hover:text-[#0052CC] transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <strong className="text-xl font-bold font-mono text-[#0F172A] group-hover:text-[#0052CC] transition-colors">
              {loading ? "—" : activeRfqs.length}
            </strong>
            <span className="text-[11px] text-[#64748B]">{rfqs.length} total</span>
          </div>
        </Link>

        <Link
          href="/dashboard/rfqs?filter=QUOTED"
          className="p-3.5 bg-white border border-[#E4E4E7] rounded-[8px] hover:border-[#0052CC] transition-colors group shadow-tactile-card block"
        >
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-semibold uppercase tracking-wider font-mono">
              Quotes to Review
            </span>
            <Clock className="w-3.5 h-3.5 group-hover:text-[#0052CC] transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <strong className="text-xl font-bold font-mono text-[#D97706] group-hover:text-[#B45309] transition-colors">
              {loading ? "—" : decisionReadyRfqs.length}
            </strong>
            <span className="text-[11px] text-[#64748B]">Action required</span>
          </div>
        </Link>

        <Link
          href="/dashboard/orders"
          className="p-3.5 bg-white border border-[#E4E4E7] rounded-[8px] hover:border-[#0052CC] transition-colors group shadow-tactile-card block"
        >
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-semibold uppercase tracking-wider font-mono">
              Fulfillment in Flight
            </span>
            <ShoppingCart className="w-3.5 h-3.5 group-hover:text-[#0052CC] transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <strong className="text-xl font-bold font-mono text-[#0052CC]">
              {loading ? "—" : inProgressOrders.length}
            </strong>
            <span className="text-[11px] text-[#64748B]">{totalOrders.length} total orders</span>
          </div>
        </Link>

        <div className="p-3.5 bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-card block">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-semibold uppercase tracking-wider font-mono">
              Desk Synchronization
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <strong className="text-xs font-semibold text-[#059669] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] inline-block" />
              Connected
            </strong>
            <span className="text-[10px] text-[#64748B] font-mono">
              {lastRefreshed ? `Synced ${lastRefreshed}` : "Live"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Action Required Banner (If any quotations await decision) */}
      {decisionReadyRfqs.length > 0 && (
        <div className="p-3.5 bg-[#FFFBEB] border border-[rgba(217,119,6,0.2)] rounded-[8px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[4px] bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-[#92400E]">
                {decisionReadyRfqs.length} Quotation{decisionReadyRfqs.length > 1 ? "s" : ""} Awaiting Commercial Decision
              </h2>
              <p className="text-[11px] text-[#B45309]">
                Suppliers have submitted formal pricing. Review quotations to accept terms, send counter-offers, or issue purchase orders.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/rfqs?filter=QUOTED"
            className="h-8 px-3 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-medium rounded-[6px] transition-colors flex items-center gap-1 shrink-0 shadow-xs"
          >
            <span>Review Quotes</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* 4. Main Two-Column Operational Surface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Active Chemical Sourcing Pipeline (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-card overflow-hidden">
          <div className="p-3.5 border-b border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0052CC]" />
              <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider font-mono">
                Active Chemical RFQs
              </h2>
            </div>
            <Link
              href="/dashboard/rfqs"
              className="text-xs font-medium text-[#0052CC] hover:underline flex items-center gap-1"
            >
              <span>View all ({rfqs.length})</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#E4E4E7]">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                <div className="w-5 h-5 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Loading active inquiries...</span>
              </div>
            ) : activeRfqs.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <FlaskConical className="w-8 h-8 text-[#94A3B8] mx-auto" />
                <p className="text-xs font-medium text-[#0F172A]">No Active Chemical Sourcing Inquiries</p>
                <p className="text-[11px] text-[#64748B]">
                  Submit an RFQ for APIs, solvents, or intermediates from verified suppliers.
                </p>
                <Link
                  href="/rfq"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#0052CC] hover:underline pt-1"
                >
                  <span>Submit your first RFQ →</span>
                </Link>
              </div>
            ) : (
              activeRfqs.slice(0, 5).map((rfq) => {
                const rfqRef = rfq.rfqReference || `RFQ-${rfq.id.substring(0, 8).toUpperCase()}`;
                return (
                  <Link
                    key={rfq.id}
                    href={`/dashboard/rfqs/${rfq.id}`}
                    className="p-3.5 hover:bg-[#FAFAFA] transition-colors flex items-center justify-between gap-4 block group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#0052CC] group-hover:underline">
                          {rfqRef}
                        </span>
                        <StatusBadge status={rfq.status} />
                      </div>
                      <h3 className="text-xs font-medium text-[#0F172A] truncate">
                        {rfq.productName || "Specialty Chemical Requirement"}
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Volume: <span className="font-mono text-[#0F172A]">{rfq.quantity.toLocaleString()} {rfq.unit.toUpperCase()}</span>
                        {rfq.supplierName && ` · Supplier: ${rfq.supplierName}`}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-medium text-[#0052CC] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Purchase Orders & Milestones (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-card overflow-hidden">
          <div className="p-3.5 border-b border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#0052CC]" />
              <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider font-mono">
                Purchase Orders
              </h2>
            </div>
            <Link
              href="/dashboard/orders"
              className="text-xs font-medium text-[#0052CC] hover:underline flex items-center gap-1"
            >
              <span>View all ({orders.length})</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#E4E4E7]">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                <div className="w-5 h-5 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Loading purchase orders...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Package className="w-8 h-8 text-[#94A3B8] mx-auto" />
                <p className="text-xs font-medium text-[#0F172A]">No Purchase Orders Issued</p>
                <p className="text-[11px] text-[#64748B]">
                  Accept an active quotation to generate a formal purchase order and start shipment fulfillment.
                </p>
              </div>
            ) : (
              orders.slice(0, 5).map((order) => {
                const currency = order.currency || "INR";
                return (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    className="p-3.5 hover:bg-[#FAFAFA] transition-colors flex items-center justify-between gap-3 block group"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#0052CC] group-hover:underline">
                          {order.poNumber}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-xs font-medium text-[#0F172A] truncate">
                        {order.productName || "Chemical Order Consignment"}
                      </p>
                      <p className="text-[11px] text-[#64748B] font-mono">
                        {currency} {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-medium text-[#0052CC] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                        <span>Track</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. Sourcing Shortcuts Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/products"
          className="p-3 bg-white border border-[#E4E4E7] hover:border-[#0052CC] rounded-[8px] transition-colors text-left shadow-tactile-card group flex items-start gap-2.5"
        >
          <FlaskConical className="w-4 h-4 text-[#0052CC] mt-0.5 shrink-0" />
          <div>
            <strong className="text-xs font-semibold text-[#0F172A] group-hover:text-[#0052CC] block">
              Chemical Catalog
            </strong>
            <span className="text-[11px] text-[#64748B] block">Search monographs & supplier offerings</span>
          </div>
        </Link>

        <Link
          href="/categories"
          className="p-3 bg-white border border-[#E4E4E7] hover:border-[#0052CC] rounded-[8px] transition-colors text-left shadow-tactile-card group flex items-start gap-2.5"
        >
          <Layers className="w-4 h-4 text-[#059669] mt-0.5 shrink-0" />
          <div>
            <strong className="text-xs font-semibold text-[#0F172A] group-hover:text-[#0052CC] block">
              Chemical Categories
            </strong>
            <span className="text-[11px] text-[#64748B] block">Browse APIs, Intermediates, Solvents</span>
          </div>
        </Link>

        <Link
          href="/suppliers"
          className="p-3 bg-white border border-[#E4E4E7] hover:border-[#0052CC] rounded-[8px] transition-colors text-left shadow-tactile-card group flex items-start gap-2.5"
        >
          <Building2 className="w-4 h-4 text-[#0052CC] mt-0.5 shrink-0" />
          <div>
            <strong className="text-xs font-semibold text-[#0F172A] group-hover:text-[#0052CC] block">
              Verified Suppliers
            </strong>
            <span className="text-[11px] text-[#64748B] block">Audit certified chemical manufacturers</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
