"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, ChevronRight } from "lucide-react";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

interface QueueItem {
  id: string;
  priority: string;
  entityType: string;
  entityIdentifier: string;
  entityName: string;
  issue: string;
  currentState: string;
  detectedAt: string;
  workflowName: string;
  actionUrl: string;
}

export default function GovernanceQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQueue() {
      try {
        const res = await authenticatedFetch("/api/v1/admin/operations/governance/queue");
        if (res.ok) {
          const data = await res.json();
          setItems(data.content || []);
        }
      } catch (err) {
        console.error("Failed to load governance queue", err);
      } finally {
        setLoading(false);
      }
    }
    fetchQueue();
  }, []);

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link href="/dashboard/admin/operations" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Operations
          </Link>
          <h1 className="text-3xl font-extrabold text-[#0A192F] tracking-tight">
            Governance Action Queue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consolidated operational queue prioritizing supplier verifications, offering moderations, and catalog quality issues.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold animate-pulse">
          Prioritizing governance queue items...
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Prioritized Action Queue ({items.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="py-3.5 px-6">Priority</th>
                  <th className="py-3.5 px-6">Entity</th>
                  <th className="py-3.5 px-6">Operational Issue</th>
                  <th className="py-3.5 px-6">Workflow</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{item.entityName}</div>
                      <div className="text-xs text-slate-400 font-mono">{item.entityType}: {item.entityIdentifier}</div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                      {item.issue}
                    </td>
                    <td className="py-4 px-6 text-xs font-bold text-blue-700 uppercase">
                      {item.workflowName}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={item.actionUrl}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Open Workflow <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
