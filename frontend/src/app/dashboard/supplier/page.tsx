"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  FlaskConical,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { PageHeader, StatusBadge } from "@/shared/components/ui/KemkendraUI";

export default function SupplierDashboardOverviewPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState<SupplierRfq[]>([]);
  const [orders, setOrders] = useState<PurchaseOrderResponse[]>([]);
  const [offerings, setOfferings] = useState<SupplierOffering[]>([]);
  const [performance, setPerformance] = useState<SupplierPerformance | null>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const loadSupplierData = useCallback(async () => {
    try {
      setLoading(true);
      const [rfqsData, ordersData, offeringsData, perfData, profileData] = await Promise.all([
        getSupplierRfqs().catch(() => [] as SupplierRfq[]),
        getSupplierOrders().catch(() => [] as PurchaseOrderResponse[]),
        getMySupplierOfferings().catch(() => [] as SupplierOffering[]),
        authenticatedFetch("/api/v1/supplier/performance")
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),
        authenticatedFetch("/api/v1/supplier/profile")
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),
      ]);

      // If supplier profile is in DRAFT and lacks required company information, redirect to onboarding
      if (profileData) {
        setProfileStatus(profileData.verificationStatus);
        if (
          profileData.verificationStatus === "DRAFT" &&
          (!profileData.registeredAddress || !profileData.legalName)
        ) {
          router.replace("/dashboard/supplier/onboarding");
          return;
        }
      }

      setRfqs(rfqsData);
      setOrders(ordersData);
      setOfferings(offeringsData);
      setPerformance(perfData);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } finally {
      setLoading(false);
    }
  }, [router]);

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
    <div className="space-y-6 pb-12 text-[#0F172A]">
      {/* 1. Standard Enterprise Page Header */}
      {/* 1. Standard Enterprise Page Header */}
      <PageHeader
        title="Supplier Operations Desk"
        description="Monitor active chemical inquiries, respond to buyer quotation requests, negotiate commercial terms, and fulfill purchase contracts."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/supplier/products/new"
              className="h-8 px-3 text-xs font-medium text-[#0F172A] bg-white border border-[#E4E4E7] hover:bg-[#FAFAFA] rounded-[6px] transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>Add Chemical Listing</span>
            </Link>
            <Link
              href="/dashboard/supplier/rfqs"
              className="h-8 px-3.5 text-xs font-medium text-white bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] rounded-[6px] transition-colors shadow-xs flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>RFQ Inbox ({pendingRfqs.length})</span>
            </Link>
          </div>
        }
      />

      {/* Onboarding Notice Banner if Draft or Under Review */}
      {profileStatus === "DRAFT" && (
        <div className="p-3.5 rounded-[8px] bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-tactile-card">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-[4px] bg-amber-600 text-white flex items-center justify-center font-bold font-mono text-xs shrink-0">
              !
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider block text-amber-800">
                ONBOARDING INCOMPLETE — PROFILE IN DRAFT STATUS
              </span>
              <p className="text-xs text-amber-950 mt-0.5">
                Complete your company profile and KYC documents, then click &quot;Submit for Verification&quot; to begin selling.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/supplier/onboarding"
            className="h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-[6px] transition-colors text-xs font-semibold flex items-center gap-1.5 shrink-0"
          >
            <span>Complete Onboarding</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {(profileStatus === "PENDING" || profileStatus === "UNDER_REVIEW") && (
        <div className="p-3.5 rounded-[8px] bg-purple-50 border border-purple-200 text-xs text-purple-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-tactile-card">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-purple-600 shrink-0 animate-pulse" />
            <div>
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider block text-purple-700">
                VERIFICATION APPLICATION SUBMITTED — UNDER ADMIN REVIEW
              </span>
              <p className="text-xs text-purple-950 mt-0.5">
                Your company registration documents are currently undergoing administrative compliance review.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/supplier/onboarding"
            className="h-8 px-3 bg-white border border-purple-200 hover:bg-purple-100 text-purple-700 rounded-[6px] transition-colors text-xs font-medium flex items-center gap-1.5 shrink-0"
          >
            <span>View Application</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 2. Action Required Cockpit Strip */}
      {pendingRfqs.length > 0 && (
        <div className="p-3.5 rounded-[8px] bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#0052CC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-tactile-card">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-[4px] bg-[#0052CC] text-white flex items-center justify-center font-bold font-mono text-xs shrink-0">
              {pendingRfqs.length}
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider block">
                COMMERCIAL ACTION REQUIRED — SOURCING INQUIRIES AWAITING QUOTE
              </span>
              <p className="text-xs text-[#0F172A] mt-0.5">
                You have {pendingRfqs.length} buyer RFQ{pendingRfqs.length > 1 ? "s" : ""} awaiting pricing proposals or negotiation response.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/supplier/rfqs"
            className="h-8 px-3 bg-white border border-[#BFDBFE] hover:bg-[#EFF6FF] text-[#0052CC] rounded-[6px] transition-colors text-xs font-medium flex items-center gap-1.5 shrink-0"
          >
            <span>Review Inquiries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 3. Structured Operational KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Link
          href="/dashboard/supplier/rfqs"
          className="p-3.5 bg-white border border-[#E4E4E7] rounded-[8px] hover:border-[#0052CC] transition-colors shadow-tactile-card group block"
        >
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-semibold uppercase tracking-wider font-mono">
              Inquiries To Quote
            </span>
            {pendingRfqs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-[4px] bg-[#EFF6FF] text-[#0052CC] border border-[#BFDBFE] font-mono text-[10px] font-semibold">
                {pendingRfqs.length}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <strong className="text-xl font-bold font-mono text-[#0F172A] group-hover:text-[#0052CC]">
              {loading ? "—" : pendingRfqs.length}
            </strong>
            <span className="text-[11px] text-[#0052CC] font-mono">Respond →</span>
          </div>
        </Link>

        <Link
          href="/dashboard/supplier/orders"
          className="p-3.5 bg-white border border-[#E4E4E7] rounded-[8px] hover:border-[#0052CC] transition-colors shadow-tactile-card group block"
        >
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-semibold uppercase tracking-wider font-mono">
              Active Orders
            </span>
            <ShoppingCart className="w-3.5 h-3.5 group-hover:text-[#0052CC]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <strong className="text-xl font-bold font-mono text-[#0F172A] group-hover:text-[#0052CC]">
              {loading ? "—" : openOrders.length}
            </strong>
            <span className="text-[11px] text-[#059669] font-mono">In Dispatch</span>
          </div>
        </Link>

        <Link
          href="/dashboard/supplier/products"
          className="p-3.5 bg-white border border-[#E4E4E7] rounded-[8px] hover:border-[#0052CC] transition-colors shadow-tactile-card group block"
        >
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-semibold uppercase tracking-wider font-mono">
              Active Catalog
            </span>
            <Package className="w-3.5 h-3.5 group-hover:text-[#0052CC]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <strong className="text-xl font-bold font-mono text-[#0F172A] group-hover:text-[#0052CC]">
              {loading ? "—" : activeOfferings.length}
            </strong>
            <span className="text-[11px] text-[#64748B] font-mono">{offerings.length} Total</span>
          </div>
        </Link>

        <div className="p-3.5 bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-card block">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-semibold uppercase tracking-wider font-mono">
              Response SLA
            </span>
            <Clock className="w-3.5 h-3.5 text-[#64748B]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <strong className="text-xl font-bold font-mono text-[#0F172A]">
              {performance?.responseRate !== null && performance?.responseRate !== undefined
                ? `${performance.responseRate}%`
                : "New"}
            </strong>
            <span className="text-[11px] text-[#64748B] font-mono">
              {performance?.formattedResponseTime ? `~${performance.formattedResponseTime}` : "Verified"}
            </span>
          </div>
        </div>

        <Link
          href="/dashboard/supplier/products"
          className="p-3.5 bg-white border border-[#E4E4E7] rounded-[8px] hover:border-[#0052CC] transition-colors shadow-tactile-card group block col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-semibold uppercase tracking-wider font-mono">
              Moderation
            </span>
            <ShieldCheck className="w-3.5 h-3.5 group-hover:text-[#0052CC]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <strong className="text-xl font-bold font-mono text-[#0F172A] group-hover:text-[#0052CC]">
              {loading ? "—" : pendingReviewOfferings.length}
            </strong>
            <span className="text-[11px] text-[#64748B] font-mono">Under Review</span>
          </div>
        </Link>
      </div>

      {/* 4. Operational Inquiries and Orders Panels (Split 7 / 5 Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Incoming RFQs (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E4E4E7] flex items-center justify-between bg-[#FAFAFA]">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] font-mono">
                Incoming Sourcing Inquiries
              </h2>
              <span className="text-[11px] text-[#64748B]">Commercial RFQ requests awaiting quotation proposal</span>
            </div>
            <Link
              href="/dashboard/supplier/rfqs"
              className="text-xs font-medium text-[#0052CC] hover:underline font-mono flex items-center gap-1"
            >
              <span>View All ({rfqs.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#64748B] font-mono">Loading inquiries...</div>
          ) : rfqs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B]">
              No incoming buyer inquiries received yet.
            </div>
          ) : (
            <div className="divide-y divide-[#E4E4E7]">
              {rfqs.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  href={`/dashboard/supplier/rfqs/${r.id}`}
                  className="p-3.5 hover:bg-[#FAFAFA] transition-colors flex items-center justify-between gap-3 block group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-semibold text-[#0F172A] group-hover:text-[#0052CC] truncate">
                        {r.productName || "Chemical Monograph"}
                      </strong>
                      <span className="font-mono text-[10px] text-[#64748B] bg-[#F4F4F5] px-1.5 py-0.2 rounded-[4px] border border-[#E4E4E7]">
                        {r.rfqReference || r.id.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#64748B] mt-1">
                      <span>Volume: <strong className="text-[#0F172A]">{r.quantity} {r.unit || "kg"}</strong></span>
                      <span>•</span>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <StatusBadge status={r.status} size="sm" />
                    <ChevronRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0052CC]" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Purchase Orders to Fulfill (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E4E4E7] flex items-center justify-between bg-[#FAFAFA]">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] font-mono">
                Active Purchase Orders
              </h2>
              <span className="text-[11px] text-[#64748B]">Committed buyer contracts in fulfillment</span>
            </div>
            <Link
              href="/dashboard/supplier/orders"
              className="text-xs font-medium text-[#0052CC] hover:underline font-mono flex items-center gap-1"
            >
              <span>View All ({orders.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#64748B] font-mono">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B]">
              No active purchase contracts to fulfill yet.
            </div>
          ) : (
            <div className="divide-y divide-[#E4E4E7]">
              {orders.slice(0, 5).map((o) => (
                <Link
                  key={o.id}
                  href={`/dashboard/supplier/orders/${o.id}`}
                  className="p-3.5 hover:bg-[#FAFAFA] transition-colors flex items-center justify-between gap-3 block group"
                >
                  <div className="min-w-0">
                    <strong className="text-xs font-semibold font-mono text-[#0F172A] group-hover:text-[#0052CC] block truncate">
                      {o.poNumber}
                    </strong>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#64748B] mt-1">
                      <span className="font-semibold text-[#059669]">{o.currency} {o.totalAmount.toLocaleString()}</span>
                      <span>•</span>
                      <span>{new Date(o.placedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={o.status} size="sm" />
                    <ChevronRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0052CC]" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Sourcing Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/dashboard/supplier/products"
          className="p-3.5 bg-white border border-[#E4E4E7] hover:border-[#0052CC] rounded-[8px] transition-colors text-left shadow-tactile-card group flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-[4px] bg-[#EFF6FF] text-[#0052CC] flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-xs font-semibold text-[#0F172A] group-hover:text-[#0052CC] block">
              Manage Offerings & Lots
            </strong>
            <span className="text-[11px] text-[#64748B] mt-0.5 block">Update purity assays, pricing tiers, MOQ, & COAs</span>
          </div>
        </Link>

        <Link
          href="/dashboard/supplier/documents"
          className="p-3.5 bg-white border border-[#E4E4E7] hover:border-[#0052CC] rounded-[8px] transition-colors text-left shadow-tactile-card group flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-[4px] bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-xs font-semibold text-[#0F172A] group-hover:text-[#0052CC] block">
              Compliance & Document Vault
            </strong>
            <span className="text-[11px] text-[#64748B] mt-0.5 block">Audit licenses, GMP/ISO credentials & KYC files</span>
          </div>
        </Link>

        <Link
          href="/products"
          className="p-3.5 bg-white border border-[#E4E4E7] hover:border-[#0052CC] rounded-[8px] transition-colors text-left shadow-tactile-card group flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-[4px] bg-[#F4F4F5] text-[#64748B] flex items-center justify-center shrink-0">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-xs font-semibold text-[#0F172A] group-hover:text-[#0052CC] block">
              Chemical Marketplace
            </strong>
            <span className="text-[11px] text-[#64748B] mt-0.5 block">Browse live listings across the global marketplace</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
