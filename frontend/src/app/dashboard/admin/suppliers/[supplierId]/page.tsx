"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import {
  ArrowLeft,
  Building2,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Package,
  ShoppingBag,
  Globe,
  MapPin,
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Award,
  Truck
} from "lucide-react";

interface AdminSellerProfile {
  id: string;
  companyName: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  certifications?: string[];
  aboutCompany?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminSupplierDetail {
  id: number;
  name: string;
  slug: string;
  legalName?: string;
  businessType?: string;
  countryCode?: string;
  countryName?: string;
  logoUrl?: string;
  verified: boolean;
  verificationStatus: string;
  yearsInBusiness?: number;
  responseRate?: number;
  exportReady: boolean;
  createdAt: string;
  userId?: string;
  userEmail?: string;
  userStatus?: string;
  offeringCount: number;
  activeOfferingCount: number;
  rfqReceivedCount: number;
  poFulfilledCount: number;
  sellerProfile?: AdminSellerProfile;
}

export default function AdminSupplierDetailPage({
  params,
}: {
  params: Promise<{ supplierId: string }>;
}) {
  const resolvedParams = use(params);
  const supplierId = resolvedParams.supplierId;

  const [supplier, setSupplier] = useState<AdminSupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSupplier = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authenticatedFetch(`/api/v1/admin/suppliers/${supplierId}`);
      if (!res.ok) {
        throw new Error(res.status === 404 ? "Supplier not found" : "Failed to load supplier detail");
      }
      setSupplier(await res.json());
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplier();
  }, [supplierId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="h-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl"></div>
          <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Unable to Load Supplier</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{error || "Supplier profile not found."}</p>
        <Link
          href="/dashboard/admin/suppliers"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Supplier Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Back link */}
      <Link
        href="/dashboard/admin/suppliers"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Supplier Directory
      </Link>

      {/* Header Supplier Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-2xl shrink-0">
              {supplier.name ? supplier.name[0].toUpperCase() : "S"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{supplier.name}</h1>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    supplier.verified
                      ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  }`}
                >
                  {supplier.verified ? "VERIFIED SUPPLIER" : supplier.verificationStatus || "PENDING VERIFICATION"}
                </span>
                {supplier.exportReady && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Export Ready
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                  <Globe className="w-3.5 h-3.5" /> {supplier.countryName || supplier.countryCode || "Global"}
                </span>
                <span>•</span>
                <span>Type: {supplier.businessType || "MANUFACTURER"}</span>
                <span>•</span>
                <span>ID: #{supplier.id}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/admin/catalog/verification/${supplier.id}`}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition"
            >
              Verification Dossier
            </Link>
            <button
              onClick={fetchSupplier}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              title="Refresh Supplier Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Identity & Seller Profile */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-500" />
            Enterprise Registration & Identity
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750">
              <span className="text-slate-600 dark:text-slate-400">Legal Name</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {supplier.legalName || supplier.sellerProfile?.companyName || supplier.name}
              </span>
            </div>

            {supplier.sellerProfile?.gstNumber && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750">
                <span className="text-slate-600 dark:text-slate-400">Tax / GST Number</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {supplier.sellerProfile.gstNumber}
                </span>
              </div>
            )}

            {supplier.sellerProfile?.city && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750">
                <span className="text-slate-600 dark:text-slate-400">Location</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {supplier.sellerProfile.city}, {supplier.sellerProfile.state || ""}, {supplier.countryName}
                </span>
              </div>
            )}

            {supplier.sellerProfile?.website && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750">
                <span className="text-slate-600 dark:text-slate-400">Website</span>
                <a
                  href={supplier.sellerProfile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  {supplier.sellerProfile.website} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Linked User Account */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            Authorized Account Representative
          </h2>

          {supplier.userId ? (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 dark:text-indigo-200">{supplier.userEmail}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
                    {supplier.userStatus || "ACTIVE"}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">User Account ID: {supplier.userId}</p>
                <Link
                  href={`/dashboard/admin/users/${supplier.userId}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
                >
                  Inspect User Account Profile &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400">
              No authenticated user account currently mapped to this supplier entity.
            </div>
          )}
        </div>

        {/* Catalog Offerings Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-cyan-500" />
            Catalog Offerings Portfolio
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800">
              <span className="text-slate-500 dark:text-slate-400">Total Offerings</span>
              <div className="text-xl font-bold text-cyan-900 dark:text-cyan-200 mt-1">{supplier.offeringCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-slate-500 dark:text-slate-400">Active / Available</span>
              <div className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">{supplier.activeOfferingCount}</div>
            </div>
          </div>

          <Link
            href="/dashboard/admin/catalog"
            className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
          >
            Manage Catalog & Offerings &rarr;
          </Link>
        </div>

        {/* Marketplace Fulfilment */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-purple-500" />
            Marketplace Fulfillment
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
              <span className="text-slate-500 dark:text-slate-400">RFQs Received</span>
              <div className="text-xl font-bold text-purple-900 dark:text-purple-200 mt-1">{supplier.rfqReceivedCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
              <span className="text-slate-500 dark:text-slate-400">Orders Fulfilled</span>
              <div className="text-xl font-bold text-purple-900 dark:text-purple-200 mt-1">{supplier.poFulfilledCount}</div>
            </div>
          </div>

          <Link
            href="/dashboard/admin/marketplace"
            className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
          >
            View Marketplace Transactions &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
