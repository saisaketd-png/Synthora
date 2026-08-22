"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getSupplierRfqs, SupplierRfq } from "@/features/rfq/api/getSupplierRfqs";
import { getSupplierOrders } from "@/features/order/api/getSupplierOrders";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";
import { getMySupplierOfferings, SupplierOffering } from "@/features/supplier-products/api/masterCatalogApi";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { SupplierPerformance } from "@/features/suppliers/types";
import {
  FileText,
  Package,
  Plus,
  Building2,
  ShoppingCart,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Layers,
  FlaskConical,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { StatusBadge } from "@/shared/components/ui/SynthoraUI";

export default function SupplierDashboardOverviewPage() {
  const [rfqs, setRfqs] = useState<SupplierRfq[]>([]);
  const [orders, setOrders] = useState<PurchaseOrderResponse[]>([]);
  const [offerings, setOfferings] = useState<SupplierOffering[]>([]);
  const [performance, setPerformance] = useState<SupplierPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const loadSupplierData = useCallback(async () => {
    try {
      setLoading(true);
      const [rfqsData, ordersData, offeringsData, perfData] = await Promise.all([
        getSupplierRfqs().catch(() => [] as SupplierRfq[]),
        getSupplierOrders().catch(() => [] as PurchaseOrderResponse[]),
        getMySupplierOfferings().catch(() => [] as SupplierOffering[]),
        authenticatedFetch("/api/v1/supplier/performance")
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),
      ]);

      setRfqs(rfqsData);
      setOrders(ordersData);
      setOfferings(offeringsData);
      setPerformance(perfData);
      setLastRefreshed(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSupplierData();
  }, [loadSupplierData]);

  // Derived business metrics
  const activeOfferings = offerings.filter(
    (o) => o.availabilityStatus === "AVAILABLE" && o.moderationStatus === "APPROVED"
  );
  const pendingReviewOfferings = offerings.filter((o) => o.moderationStatus === "PENDING_REVIEW");
  const pendingRfqs = rfqs.filter(
    (r) => r.status === "SUBMITTED" || r.status === "PENDING" || r.status === "CONTACTED"
  );
  const openOrders = orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED");

  return (
    <div className="max-w-[1560px] mx-auto space-y-6">
      {/* 1. Header & Primary Supplier Actions */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold text-[#0052CC] bg-[#DEEBFF] px-2 py-0.5 rounded uppercase">
            Supplier Commercial Desk
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#091E42] mt-1.5">
            Operations & Offerings Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Manage your chemical inventory offerings, respond to incoming buyer RFQs, and fulfill orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/supplier/products/new"
            className="flex-1 sm:flex-none h-11 px-5 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Chemical Offering</span>
          </Link>
          <Link
            href="/dashboard/supplier/rfqs"
            className="flex-1 sm:flex-none h-11 px-4 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#091E42] text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <FileText className="w-4 h-4 text-[#0052CC]" />
            <span>RFQ Inbox ({pendingRfqs.length})</span>
          </Link>
        </div>
      </div>

      {/* 2. Compact 5-Card KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Link
          href="/dashboard/supplier/products"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] hover:border-[#0052CC] transition-all shadow-sm block group"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
            Active Offerings
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <strong className="text-2xl sm:text-3xl font-extrabold font-mono text-[#091E42] group-hover:text-[#0052CC]">
              {activeOfferings.length}
            </strong>
            <span className="text-[11px] text-[#64748B]">{offerings.length} total</span>
          </div>
        </Link>

        <Link
          href="/dashboard/supplier/rfqs"
          className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-sm block group ${
            pendingRfqs.length > 0
              ? "bg-[#DEEBFF]/30 border-[#B3D4FF] hover:border-[#0052CC]"
              : "bg-white border-[#E2E8F0] hover:border-[#0052CC]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
              RFQs To Quote
            </span>
            {pendingRfqs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-[#DE350B] text-white font-mono text-[9px] font-bold">
                ACTION
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <strong className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0747A6]">
              {pendingRfqs.length}
            </strong>
            <span className="text-[11px] text-[#0052CC] font-semibold">Respond →</span>
          </div>
        </Link>

        <Link
          href="/dashboard/supplier/orders"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] hover:border-[#0052CC] transition-all shadow-sm block group"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
            Active Orders
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <strong className="text-2xl sm:text-3xl font-extrabold font-mono text-[#091E42] group-hover:text-[#0052CC]">
              {openOrders.length}
            </strong>
            <span className="text-[11px] text-[#00875A] font-semibold">Fulfilling</span>
          </div>
        </Link>

        {/* 4. RFQ Responsiveness Metric */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-sm block">
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
            Response Rate
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <strong className="text-2xl sm:text-3xl font-extrabold font-mono text-[#091E42]">
              {performance?.responseRate !== null && performance?.responseRate !== undefined
                ? `${performance.responseRate}%`
                : "New"}
            </strong>
            <span className="text-[11px] text-[#64748B] font-mono">
              {performance?.formattedResponseTime ? `~${performance.formattedResponseTime}` : "No history"}
            </span>
          </div>
        </div>

        <Link
          href="/dashboard/supplier/products"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] hover:border-[#0052CC] transition-all shadow-sm block group"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
            Under Review
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <strong className="text-2xl sm:text-3xl font-extrabold font-mono text-[#091E42] group-hover:text-[#0052CC]">
              {pendingReviewOfferings.length}
            </strong>
            <span className="text-[11px] text-[#64748B]">Pending</span>
          </div>
        </Link>
      </div>

      {/* 3. Action Required Banner */}
      {pendingRfqs.length > 0 && (
        <div className="bg-[#DEEBFF] border border-[#B3D4FF] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-[#0052CC] flex items-center justify-center shrink-0 shadow-2xs font-bold">
              <Sparkles className="w-5 h-5 text-[#0052CC]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#091E42]">
                {pendingRfqs.length} Incoming Buyer {pendingRfqs.length === 1 ? "RFQ" : "RFQs"} Awaiting Quotations
              </h3>
              <p className="text-xs text-[#0747A6] mt-0.5">
                Qualified chemical buyers are requesting formal price and dispatch timelines for your products.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/supplier/rfqs"
            className="h-10 px-4 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
          >
            <span>Review & Submit Quotes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 4. Sourcing Discovery & Operations Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/dashboard/supplier/products"
          className="p-4 bg-white border border-[#E2E8F0] hover:border-[#0052CC] rounded-2xl transition-all text-left shadow-2xs group flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-[#DEEBFF] text-[#0052CC] flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-sm font-bold text-[#091E42] group-hover:text-[#0052CC] block">
              Manage Offerings
            </strong>
            <span className="text-xs text-[#64748B] mt-0.5 block">Update purity, MOQ, prices, & COA documents</span>
          </div>
        </Link>

        <Link
          href="/dashboard/supplier/verification"
          className="p-4 bg-white border border-[#E2E8F0] hover:border-[#0052CC] rounded-2xl transition-all text-left shadow-2xs group flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E3FCEF] text-[#00875A] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-sm font-bold text-[#091E42] group-hover:text-[#0052CC] block">
              Compliance & Verification
            </strong>
            <span className="text-xs text-[#64748B] mt-0.5 block">Audit status, GMP/ISO certificates & KYC</span>
          </div>
        </Link>

        <Link
          href="/products"
          className="p-4 bg-white border border-[#E2E8F0] hover:border-[#0052CC] rounded-2xl transition-all text-left shadow-2xs group flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#091E42] flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-sm font-bold text-[#091E42] group-hover:text-[#0052CC] block">
              Public Catalog View
            </strong>
            <span className="text-xs text-[#64748B] mt-0.5 block">See how buyers discover your chemical listings</span>
          </div>
        </Link>
      </div>

      {/* 5. Mobile-First Sourcing & Purchase Order Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming RFQs */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#091E42]">
                Incoming RFQ Inquiries
              </h2>
              <span className="text-xs text-[#64748B]">Buyer quotation requests</span>
            </div>
            <Link
              href="/dashboard/supplier/rfqs"
              className="text-xs font-bold text-[#0052CC] hover:underline"
            >
              View All ({rfqs.length}) →
            </Link>
          </div>

          {rfqs.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl">
              No RFQ inquiries received yet.
            </div>
          ) : (
            <div className="space-y-3">
              {rfqs.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  href={`/dashboard/supplier/rfqs/${r.id}`}
                  className="p-3.5 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#0052CC] rounded-xl transition-all flex items-center justify-between gap-3 shadow-2xs group block"
                >
                  <div className="min-w-0">
                    <strong className="text-sm font-bold text-[#091E42] group-hover:text-[#0052CC] block truncate">
                      {r.productName || "Chemical Product"}
                    </strong>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#64748B] mt-0.5">
                      <span>Qty: {r.quantity} {r.unit || "kg"}</span>
                      <span>·</span>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={r.status} size="sm" />
                    <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#0052CC]" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Supplier Purchase Orders */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#091E42]">
                Purchase Orders To Fulfill
              </h2>
              <span className="text-xs text-[#64748B]">Active buyer purchase contracts</span>
            </div>
            <Link
              href="/dashboard/supplier/orders"
              className="text-xs font-bold text-[#0052CC] hover:underline"
            >
              View All ({orders.length}) →
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl">
              No purchase orders to fulfill yet.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((o) => (
                <Link
                  key={o.id}
                  href={`/dashboard/supplier/orders/${o.id}`}
                  className="p-3.5 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#0052CC] rounded-xl transition-all flex items-center justify-between gap-3 shadow-2xs group block"
                >
                  <div className="min-w-0">
                    <strong className="text-sm font-bold font-mono text-[#091E42] group-hover:text-[#0052CC] block truncate">
                      {o.poNumber}
                    </strong>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#64748B] mt-0.5">
                      <span className="font-bold text-[#091E42]">{o.currency} {o.totalAmount.toLocaleString()}</span>
                      <span>·</span>
                      <span>{new Date(o.placedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={o.status} size="sm" />
                    <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#0052CC]" />
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
