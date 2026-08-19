"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Filter, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { getGlobalAuditLogs } from "@/features/admin/api/adminCatalogApi";

export default function GlobalGovernanceAuditPage() {
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(0);

  const [logs, setLogs] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGlobalAuditLogs({
        entityType: entityType || undefined,
        page,
        size: 20,
      });
      setLogs(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (e: any) {
      setError(e.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [entityType, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/catalog"
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-6 h-6 text-slate-700" />
              GLOBAL GOVERNANCE AUDIT LOGS
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable administrative history tracking catalog edits, verification transitions, and merge operations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchLogs()}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Filter Options */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center gap-3 text-xs font-medium">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-500 font-bold">Filter Entity Type:</span>
        <select
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(0); }}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
        >
          <option value="">All Entities</option>
          <option value="MASTER_PRODUCT">Master Product</option>
          <option value="PRODUCT_REQUEST">Product Request</option>
          <option value="SUPPLIER_VERIFICATION">Supplier Verification</option>
          <option value="SUPPLIER_OFFERING">Supplier Offering</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity Type</th>
                <th className="px-4 py-3">Entity ID</th>
                <th className="px-4 py-3">State Transition</th>
                <th className="px-4 py-3">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Loading Audit Logs...</td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <strong className="text-slate-900 font-bold block">{log.actorName}</strong>
                      <span className="text-[11px] text-slate-500">{log.actorEmail}</span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {log.action.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-extrabold rounded uppercase">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                      {log.entityId}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {log.previousState || "N/A"} &rarr; {log.newState || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 italic">
                      {log.reason || "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">No governance audit logs recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium bg-slate-50/50">
            <span>Showing page <strong>{page + 1}</strong> of <strong>{totalPages}</strong> ({totalElements} items)</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
