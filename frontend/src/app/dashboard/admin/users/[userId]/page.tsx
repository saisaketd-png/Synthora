"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import {
  ArrowLeft,
  User as UserIcon,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Building2,
  FileCheck,
  ShoppingBag,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Mail,
  Phone,
  Copy,
  Check
} from "lucide-react";

interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "USER" | "SUPPLIER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
  termsAccepted: boolean;
  termsVersion?: string;
  termsAcceptedAt?: string;
  privacyAccepted: boolean;
  privacyVersion?: string;
  privacyAcceptedAt?: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  supplierId?: number;
  supplierName?: string;
  supplierVerificationStatus?: string;
  suspended: boolean;
  suspensionReason?: string;
  suspensionDate?: string;
  openAppealId?: string;
  openAppealStatus?: string;
  rfqCount: number;
  orderCount: number;
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;
  const router = useRouter();

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authenticatedFetch(`/api/v1/admin/users/${userId}`);
      if (!res.ok) {
        throw new Error(res.status === 404 ? "User not found" : "Failed to load user detail");
      }
      setUser(await res.json());
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const copyId = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="h-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl"></div>
          <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Unable to Load User</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{error || "User record not found."}</p>
        <Link
          href="/dashboard/admin/users"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to User Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Back button */}
      <Link
        href="/dashboard/admin/users"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to User Directory
      </Link>

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl shrink-0">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h1>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    user.role === "ADMIN"
                      ? "bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      : user.role === "SUPPLIER"
                      ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  }`}
                >
                  {user.role}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    user.status === "ACTIVE"
                      ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : user.status === "SUSPENDED"
                      ? "bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      : "bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  }`}
                >
                  {user.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {user.phone}
                  </span>
                )}
                <button
                  onClick={copyId}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-mono text-[11px]"
                >
                  {user.id.substring(0, 8)}...
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUser}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              title="Refresh Record"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compliance & Legal Verification */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-500" />
            Legal & Compliance Verification
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750">
              <span className="text-slate-600 dark:text-slate-400">Terms of Service</span>
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                {user.termsAccepted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Accepted ({user.termsVersion || "v1.0"})
                  </>
                ) : (
                  <span className="text-amber-500">Not Accepted</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750">
              <span className="text-slate-600 dark:text-slate-400">Privacy Policy</span>
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                {user.privacyAccepted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Accepted ({user.privacyVersion || "v1.0"})
                  </>
                ) : (
                  <span className="text-amber-500">Not Accepted</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750">
              <span className="text-slate-600 dark:text-slate-400">Email Verification</span>
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                {user.emailVerified ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Verified ({user.emailVerifiedAt ? new Date(user.emailVerifiedAt).toLocaleDateString() : "Yes"})
                  </>
                ) : (
                  <span className="text-amber-500">Unverified</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Supplier Association */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            Supplier Entity Association
          </h2>

          {user.role !== "SUPPLIER" ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400">
              This user account is configured as a standard <strong>{user.role}</strong> and has no linked seller organization.
            </div>
          ) : user.supplierId ? (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">{user.supplierName}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
                    {user.supplierVerificationStatus || "PENDING"}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">Supplier ID: #{user.supplierId}</p>
                <Link
                  href={`/dashboard/admin/suppliers/${user.supplierId}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
                >
                  View Supplier Operational Dossier &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-300">
              Supplier role assigned but no linked supplier entity registered in the database yet.
            </div>
          )}
        </div>

        {/* Account Governance & Suspensions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            Account Governance & Appeals
          </h2>

          {user.suspended ? (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900 dark:text-rose-200">Account Suspended</span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                    {user.suspensionDate ? new Date(user.suspensionDate).toLocaleDateString() : ""}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300">{user.suspensionReason || "Administrative suspension."}</p>
                {user.openAppealId && (
                  <div className="pt-2 border-t border-rose-200 dark:border-rose-800">
                    <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">
                      Appeal Status: {user.openAppealStatus}
                    </span>
                  </div>
                )}
                <Link
                  href="/dashboard/admin/account-governance"
                  className="inline-block text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline pt-1"
                >
                  Manage Suspension in Governance &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Good standing. No active suspensions or pending disciplinary violations.</span>
            </div>
          )}
        </div>

        {/* Marketplace Transactions Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-purple-500" />
            Marketplace Activity
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
              <span className="text-slate-500 dark:text-slate-400">Total RFQs</span>
              <div className="text-xl font-bold text-purple-900 dark:text-purple-200 mt-1">{user.rfqCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
              <span className="text-slate-500 dark:text-slate-400">Total Orders</span>
              <div className="text-xl font-bold text-purple-900 dark:text-purple-200 mt-1">{user.orderCount}</div>
            </div>
          </div>

          <Link
            href="/dashboard/admin/marketplace"
            className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
          >
            Inspect Marketplace Transactions Hub &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
