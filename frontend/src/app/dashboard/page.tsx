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
  Sparkles,
} from "lucide-react";
import { StatusBadge } from "@/shared/components/ui/KemkendraUI";

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
      setLastRefreshed(new Date().toLocaleTimeString());
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
    <div className="max-w-[1560px] mx-auto space-y-6">
      {/* 1. Header & Primary Sourcing Action */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold text-[#0052CC] bg-[#DEEBFF] px-2 py-0.5 rounded uppercase">
            Buyer Procurement Desk
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#091E42] mt-1.5">
            Sourcing & Orders Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Monitor active chemical inquiries, supplier quotation proposals, and purchase orders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/rfq"
            className="w-full sm:w-auto h-11 px-5 bg-[#0052CC] hover:bg-[#0747A6] text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sourcing RFQ</span>
          </Link>
        </div>
      </div>

      {/* 2. Compact 4-Card KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/dashboard/rfqs"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] hover:border-[#0052CC] transition-all shadow-sm block group"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
            Active RFQs
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <strong className="text-2xl sm:text-3xl font-extrabold font-mono text-[#091E42] group-hover:text-[#0052CC]">
              {activeRfqs.length}
            </strong>
            <span className="text-[11px] text-[#64748B]">{rfqs.length} total</span>
          </div>
        </Link>

        <Link
          href="/dashboard/rfqs"
          className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-sm block group ${
            decisionReadyRfqs.length > 0
              ? "bg-[#DEEBFF]/30 border-[#B3D4FF] hover:border-[#0052CC]"
              : "bg-white border-[#E2E8F0] hover:border-[#0052CC]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
              Quotes to Review
            </span>
            {decisionReadyRfqs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-[#0052CC] text-white font-mono text-[9px] font-bold">
                NEW
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <strong className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0747A6]">
              {decisionReadyRfqs.length}
            </strong>
            <span className="text-[11px] text-[#0052CC] font-semibold">Evaluate →</span>
          </div>
        </Link>

        <Link
          href="/dashboard/orders"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] hover:border-[#0052CC] transition-all shadow-sm block group"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
            In Fulfillment
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <strong className="text-2xl sm:text-3xl font-extrabold font-mono text-[#091E42] group-hover:text-[#0052CC]">
              {inProgressOrders.length}
            </strong>
            <span className="text-[11px] text-[#00875A] font-semibold">Active</span>
          </div>
        </Link>

        <Link
          href="/dashboard/orders"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] hover:border-[#0052CC] transition-all shadow-sm block group"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
            Executed Orders
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <strong className="text-2xl sm:text-3xl font-extrabold font-mono text-[#091E42] group-hover:text-[#0052CC]">
              {totalOrders.length}
            </strong>
            <span className="text-[11px] text-[#64748B]">{orders.length} total</span>
          </div>
        </Link>
      </div>

      {/* 3. Action Required Banner (If Quotes are ready) */}
      {decisionReadyRfqs.length > 0 && (
        <div className="bg-[#DEEBFF] border border-[#B3D4FF] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-[#0052CC] flex items-center justify-center shrink-0 shadow-2xs font-bold">
              <Sparkles className="w-5 h-5 text-[#0052CC]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#091E42]">
                {decisionReadyRfqs.length} Supplier {decisionReadyRfqs.length === 1 ? "Quote" : "Quotes"} Awaiting Commercial Review
              </h3>
              <p className="text-xs text-[#0747A6] mt-0.5">
                Verified manufacturers have submitted commercial proposals with pricing, COA, and lead times.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/rfqs"
            className="h-10 px-4 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
          >
            <span>Evaluate Proposals</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 4. Sourcing Discovery Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/products"
          className="p-4 bg-white border border-[#E2E8F0] hover:border-[#0052CC] rounded-2xl transition-all text-left shadow-2xs group flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-[#DEEBFF] text-[#0052CC] flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-sm font-bold text-[#091E42] group-hover:text-[#0052CC] block">
              Chemical Catalog
            </strong>
            <span className="text-xs text-[#64748B] mt-0.5 block">Search monographs & live offerings</span>
          </div>
        </Link>

        <Link
          href="/categories"
          className="p-4 bg-white border border-[#E2E8F0] hover:border-[#0052CC] rounded-2xl transition-all text-left shadow-2xs group flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E3FCEF] text-[#00875A] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-sm font-bold text-[#091E42] group-hover:text-[#0052CC] block">
              Chemical Categories
            </strong>
            <span className="text-xs text-[#64748B] mt-0.5 block">Browse APIs, Intermediates, Solvents</span>
          </div>
        </Link>

        <Link
          href="/suppliers"
          className="p-4 bg-white border border-[#E2E8F0] hover:border-[#0052CC] rounded-2xl transition-all text-left shadow-2xs group flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#091E42] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-sm font-bold text-[#091E42] group-hover:text-[#0052CC] block">
              Verified Suppliers
            </strong>
            <span className="text-xs text-[#64748B] mt-0.5 block">Audit certified chemical manufacturers</span>
          </div>
        </Link>
      </div>

      {/* 5. Mobile-First Sourcing & Purchase Order Cards (Clean on Phone & Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active RFQs */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#091E42]">
                Active Sourcing RFQs
              </h2>
              <span className="text-xs text-[#64748B]">Recent quotation requests</span>
            </div>
            <Link
              href="/dashboard/rfqs"
              className="text-xs font-bold text-[#0052CC] hover:underline"
            >
              View All ({rfqs.length}) →
            </Link>
          </div>

          {rfqs.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl">
              No sourcing inquiries placed yet.
            </div>
          ) : (
            <div className="space-y-3">
              {rfqs.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  href={`/dashboard/rfqs/${r.id}`}
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

        {/* Purchase Orders */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#091E42]">
                Recent Purchase Orders
              </h2>
              <span className="text-xs text-[#64748B]">Commercial contract fulfillment</span>
            </div>
            <Link
              href="/dashboard/orders"
              className="text-xs font-bold text-[#0052CC] hover:underline"
            >
              View All ({orders.length}) →
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl">
              No purchase orders executed yet.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((o) => (
                <Link
                  key={o.id}
                  href={`/dashboard/orders/${o.id}`}
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
