"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, AlertCircle, RefreshCw, CheckCircle2, XCircle, HelpCircle, GitMerge } from "lucide-react";
import { ProductRequest } from "@/features/supplier-products/api/masterCatalogApi";
import {
  getAdminProductRequests,
  approveProductRequest,
  approveAndLinkProductRequest,
  requestProductInfo,
  rejectProductRequest,
  ApproveRequestPayload,
  ApproveAndLinkPayload,
} from "@/features/admin/api/adminCatalogApi";
import { ProductRequestReviewModal } from "@/features/admin/components/ProductRequestReviewModal";
import { RequestInfoModal } from "@/features/admin/components/RequestInfoModal";

export default function ProductRequestsQueuePage() {
  const [status, setStatus] = useState("PENDING_REVIEW");
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null);
  const [requestInfoTarget, setRequestInfoTarget] = useState<ProductRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminProductRequests(status);
      setRequests(data);
    } catch (e: any) {
      setError(e.message || "Failed to load product requests");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id: string, payload: ApproveRequestPayload) => {
    try {
      setActionLoading(true);
      await approveProductRequest(id, payload);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (e: any) {
      alert("Failed to approve request: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveAndLink = async (id: string, payload: ApproveAndLinkPayload) => {
    try {
      setActionLoading(true);
      await approveAndLinkProductRequest(id, payload);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (e: any) {
      alert("Failed to link request: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInfo = async (id: string, notes: string) => {
    try {
      setActionLoading(true);
      await requestProductInfo(id, { adminNotes: notes });
      setRequestInfoTarget(null);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (e: any) {
      alert("Failed to request info: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      setActionLoading(true);
      await rejectProductRequest(id, reason);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (e: any) {
      alert("Failed to reject request: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

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
              <Clock className="w-6 h-6 text-amber-600" />
              PRODUCT REQUEST REVIEW QUEUE
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review supplier uncatalogued chemical proposals, run duplicate checks, request clarification, and approve/link.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchRequests()}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" /> {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs font-bold">
        <span className="text-slate-500">Filter Status:</span>
        {["PENDING_REVIEW", "INFORMATION_REQUIRED", "APPROVED", "REJECTED", "ALL"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              status === s ? "bg-slate-900 text-white shadow-2xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Product Requests...</div>
        ) : requests.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {requests.map((req) => (
              <div key={req.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-base">{req.proposedName}</span>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-extrabold rounded-lg uppercase">
                      {req.category.replace("_", " ")}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                      req.status === "PENDING_REVIEW" ? "bg-amber-50 text-amber-800 border border-amber-200" :
                      req.status === "INFORMATION_REQUIRED" ? "bg-purple-50 text-purple-800 border border-purple-200" :
                      req.status === "APPROVED" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                      "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}>
                      {req.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                    <span>Supplier: <strong className="text-slate-800">{req.supplierName}</strong></span>
                    <span>CAS: <strong className="text-slate-800">{req.casNumber || "N/A"}</strong></span>
                    <span>Formula: <strong className="text-slate-800">{req.molecularFormula || "N/A"}</strong></span>
                    <span>Submitted: <strong className="text-slate-800">{new Date(req.createdAt).toLocaleDateString()}</strong></span>
                  </div>

                  {req.supplierMessage && (
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      &quot;{req.supplierMessage}&quot;
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRequest(req)}
                  className="px-5 py-2.5 bg-white border border-slate-300 text-slate-800 hover:bg-blue-50 hover:border-blue-600 hover:text-blue-700 rounded-xl text-xs font-bold transition-all shadow-2xs self-start sm:self-auto shrink-0"
                >
                  Review Request
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            No chemical requests found for status &quot;{status}&quot;.
          </div>
        )}
      </div>

      {selectedRequest && (
        <ProductRequestReviewModal
          request={selectedRequest}
          onApprove={handleApprove}
          onApproveAndLink={handleApproveAndLink}
          onRequestInfo={(req) => setRequestInfoTarget(req)}
          onReject={handleReject}
          onClose={() => setSelectedRequest(null)}
          isLoading={actionLoading}
        />
      )}

      {requestInfoTarget && (
        <RequestInfoModal
          request={requestInfoTarget}
          onRequestInfo={handleRequestInfo}
          onClose={() => setRequestInfoTarget(null)}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
}
