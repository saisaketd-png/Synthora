"use client";

import React, { useState } from "react";
import {
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Lock,
  Ban,
} from "lucide-react";
import {
  AdminRfqResponse,
  RfqStatus,
  PaginatedResponse,
  UpdateAdminRfqStatusRequest,
} from "../../types";
import { EnterpriseTable, Column } from "@/shared/components/EnterpriseTable";
import { AdminBadge } from "../AdminBadge";
import { AdminPagination } from "../AdminPagination";
import { AdminSearchFilterBar } from "../AdminSearchFilterBar";
import { AdminRfqDetailModal } from "./AdminRfqDetailModal";
import { AdminRfqStatusModal } from "./AdminRfqStatusModal";
import { updateAdminRfqStatus } from "../../api/adminApi";

interface AdminRfqListProps {
  data: PaginatedResponse<AdminRfqResponse> | null;
  isLoading: boolean;
  page: number;
  pageSize: number;
  query: string;
  statusFilter: RfqStatus | "";
  onPageChange: (newPage: number) => void;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: RfqStatus | "") => void;
  onRefresh: () => void;
}

export function AdminRfqList({
  data,
  isLoading,
  page,
  pageSize,
  query,
  statusFilter,
  onPageChange,
  onSearchChange,
  onStatusFilterChange,
  onRefresh,
}: AdminRfqListProps) {
  // Detail Modal
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Status Moderation Modal
  const [statusTargetRfq, setStatusTargetRfq] = useState<AdminRfqResponse | null>(null);
  const [targetStatus, setTargetStatus] = useState<"CLOSED" | "CANCELLED">("CLOSED");
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // Toast Feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleInspect = (rfq: AdminRfqResponse) => {
    setSelectedRfqId(rfq.id);
    setIsDetailOpen(true);
  };

  const handleOpenStatusModal = (rfq: AdminRfqResponse, target: "CLOSED" | "CANCELLED") => {
    setStatusTargetRfq(rfq);
    setTargetStatus(target);
    setIsStatusOpen(true);
  };

  const handleConfirmStatus = async (rfqId: string, reqData: UpdateAdminRfqStatusRequest) => {
    await updateAdminRfqStatus(rfqId, reqData);
    showFeedback("success", `RFQ status changed to ${reqData.status}. Recorded in audit log.`);
    onRefresh();
  };

  const columns: Column<AdminRfqResponse>[] = [
    {
      header: "RFQ / Product Inquiry",
      cell: (rfq) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-2xl bg-amber-50 text-amber-700 font-bold flex items-center justify-center text-xs border border-amber-200">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">
              {rfq.productName || "Product Inquiry"}
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              ID: {rfq.id.substring(0, 13)}...
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Buyer Party",
      cell: (rfq) => (
        <div className="text-xs font-medium text-slate-800">
          <p className="font-bold text-slate-900">{rfq.buyerName || "Buyer"}</p>
          <span className="text-[11px] text-slate-400">{rfq.buyerEmail || `ID: ${rfq.buyerId.substring(0, 8)}...`}</span>
        </div>
      ),
    },
    {
      header: "Supplier Party",
      cell: (rfq) => (
        <div className="text-xs font-medium text-slate-800">
          <p className="font-bold text-slate-900">{rfq.supplierName || "Supplier"}</p>
          <span className="text-[11px] text-slate-400">Supplier ID: {rfq.supplierId}</span>
        </div>
      ),
    },
    {
      header: "Volume",
      cell: (rfq) => (
        <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
          {rfq.quantity} {rfq.unit}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (rfq) => (
        <div className="flex flex-col items-start gap-1">
          <AdminBadge type={rfq.status} />
          {rfq.acceptedQuotationId && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Quoted
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Created",
      cell: (rfq) => (
        <span className="text-xs text-slate-600 whitespace-nowrap font-medium">
          {new Date(rfq.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (rfq) => {
        const isTerminal = rfq.status === "CLOSED" || rfq.status === "CANCELLED";
        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Inspect Detail */}
            <button
              type="button"
              onClick={() => handleInspect(rfq)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Inspect RFQ Details & Quotation History"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Close RFQ */}
            <button
              type="button"
              onClick={() => handleOpenStatusModal(rfq, "CLOSED")}
              disabled={isTerminal}
              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={isTerminal ? "RFQ Already in Terminal State" : "Close RFQ"}
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Cancel RFQ */}
            <button
              type="button"
              onClick={() => handleOpenStatusModal(rfq, "CANCELLED")}
              disabled={isTerminal}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={isTerminal ? "RFQ Already in Terminal State" : "Cancel RFQ"}
            >
              <Ban className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border text-xs sm:text-sm font-bold shadow-xs animate-in slide-in-from-top duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <AdminSearchFilterBar
        searchPlaceholder="Search message or units..."
        searchValue={query}
        onSearchChange={onSearchChange}
        onReset={() => {
          onSearchChange("");
          onStatusFilterChange("");
        }}
      >
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as RfqStatus | "")}
          className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="CONTACTED">CONTACTED</option>
          <option value="QUOTED">QUOTED</option>
          <option value="ACCEPTED">ACCEPTED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="CLOSED">CLOSED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </AdminSearchFilterBar>

      {/* Table / Skeletons */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4 shadow-2xs">
          <div className="h-6 bg-slate-100 rounded-lg w-1/4 animate-pulse" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <EnterpriseTable
            columns={columns}
            data={data?.content || []}
            keyExtractor={(r) => r.id}
            emptyTitle="No RFQs found"
            emptyDescription="No procurement requests match the specified query or lifecycle filter criteria."
          />

          {data && (
            <AdminPagination
              page={page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              pageSize={pageSize}
              onPageChange={onPageChange}
              disabled={isLoading}
            />
          )}
        </div>
      )}

      {/* Detail Modal */}
      <AdminRfqDetailModal
        rfqId={selectedRfqId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRfqId(null);
        }}
      />

      {/* Status Modal */}
      <AdminRfqStatusModal
        rfq={statusTargetRfq}
        targetStatus={targetStatus}
        isOpen={isStatusOpen}
        onClose={() => {
          setIsStatusOpen(false);
          setStatusTargetRfq(null);
        }}
        onConfirm={handleConfirmStatus}
      />
    </div>
  );
}
