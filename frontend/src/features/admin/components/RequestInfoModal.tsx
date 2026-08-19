"use client";

import { useState } from "react";
import { X, HelpCircle, AlertCircle } from "lucide-react";
import { ProductRequest } from "@/features/supplier-products/api/masterCatalogApi";

interface Props {
  request: ProductRequest;
  onRequestInfo: (id: string, notes: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

export function RequestInfoModal({ request, onRequestInfo, onClose, isLoading }: Props) {
  const [adminNotes, setAdminNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNotes.trim()) {
      setErr("Reason / required information is mandatory");
      return;
    }
    try {
      setErr(null);
      await onRequestInfo(request.id, adminNotes.trim());
    } catch (e: any) {
      setErr(e.message || "Failed to submit request");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-bold text-slate-900">Request Information from Supplier</h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {err && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-xs text-amber-900">
          <strong className="font-bold block">Target Proposal:</strong> {request.proposedName} (Supplier: {request.supplierName})
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Required Information / Questions *</label>
            <textarea
              rows={4}
              required
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Please provide COA, purity analysis, or updated CAS registry reference..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors shadow-2xs disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Submit Information Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
