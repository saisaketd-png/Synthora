"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  Filter,
  RefreshCw,
  ShieldCheck,
  Building2,
  FileText,
  AlertTriangle
} from "lucide-react";
import { getAuthUser } from "@/features/auth/api/auth";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { resolveNotificationRoute, formatNotificationTime } from "@/features/notifications/utils/navigation";

export default function AdminActivityPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authenticatedFetch("/api/v1/notifications?size=50");
      if (!res.ok) throw new Error("Failed to fetch admin activity logs");
      const data = await res.json();
      setActivities(data.content || []);
    } catch (e: any) {
      setError(e.message || "Failed to load activity log");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = getAuthUser();
    if (!user || user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadActivities();
  }, [router, loadActivities]);

  const filteredActivities = activities.filter((act) => {
    if (filterType === "ALL") return true;
    if (filterType === "OFFERINGS") return act.type?.includes("OFFERING");
    if (filterType === "VERIFICATION") return act.type?.includes("VERIF");
    if (filterType === "REQUESTS") return act.type?.includes("REQUEST");
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin"
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-7 h-7 text-blue-600" />
              ADMIN GOVERNANCE ACTIVITY CENTER
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Operational audit stream of catalog submissions, verification requests, and moderation events.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadActivities()}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Activity Log
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold w-fit">
        {["ALL", "OFFERINGS", "VERIFICATION", "REQUESTS"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilterType(t)}
            className={`px-4 py-2 rounded-xl transition-all ${
              filterType === t
                ? "bg-white text-blue-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Activity Timeline */}
      {loading ? (
        <div className="p-8 bg-white border border-slate-200 rounded-3xl animate-pulse h-48"></div>
      ) : filteredActivities.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs divide-y divide-slate-100">
          {filteredActivities.map((act) => {
            const targetRoute = resolveNotificationRoute(act, false, true);

            return (
              <div key={act.id} className="p-5 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5 text-blue-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 font-extrabold text-sm">{act.title}</strong>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-black uppercase">
                        {act.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{act.message}</p>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {formatNotificationTime(act.createdAt)}
                    </span>
                  </div>
                </div>

                {targetRoute && (
                  <Link
                    href={targetRoute}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors shrink-0"
                  >
                    Inspect <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
          <Activity className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-900">NO RECENT GOVERNANCE ACTIVITY</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All catalog offerings, supplier verifications, and chemical requests are currently up to date.
          </p>
        </div>
      )}
    </div>
  );
}
