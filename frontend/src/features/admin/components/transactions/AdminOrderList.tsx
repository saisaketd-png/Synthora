"use client";

import React, { useState } from "react";
import {
  Eye,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
} from "lucide-react";
import {
  AdminPurchaseOrderResponse,
  OrderStatus,
  PaginatedResponse,
  CancelAdminPurchaseOrderRequest,
} from "../../types";
import { EnterpriseTable, Column } from "@/shared/components/EnterpriseTable";
import { AdminBadge } from "../AdminBadge";
import { AdminPagination } from "../AdminPagination";
import { AdminSearchFilterBar } from "../AdminSearchFilterBar";
import { AdminPurchaseOrderDetailModal } from "./AdminPurchaseOrderDetailModal";
import { AdminOrderCancelModal } from "./AdminOrderCancelModal";
import { cancelAdminOrder } from "../../api/adminApi";

interface AdminOrderListProps {
  data: PaginatedResponse<AdminPurchaseOrderResponse> | null;
  isLoading: boolean;
  page: number;
  pageSize: number;
  query: string;
  statusFilter: OrderStatus | "";
  onPageChange: (newPage: number) => void;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: OrderStatus | "") => void;
  onRefresh: () => void;
}

export function AdminOrderList({
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
}: AdminOrderListProps) {
  // Detail Modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Cancel Modal
  const [cancellingOrder, setCancellingOrder] = useState<AdminPurchaseOrderResponse | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  // Toast Feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleInspect = (order: AdminPurchaseOrderResponse) => {
    setSelectedOrderId(order.id);
    setIsDetailOpen(true);
  };

  const handleOpenCancelModal = (order: AdminPurchaseOrderResponse) => {
    setCancellingOrder(order);
    setIsCancelOpen(true);
  };

  const handleConfirmCancel = async (
    orderId: string,
    reqData: CancelAdminPurchaseOrderRequest
  ) => {
    await cancelAdminOrder(orderId, reqData);
    showFeedback("success", "Purchase order cancelled. Action recorded in audit log.");
    onRefresh();
  };

  const columns: Column<AdminPurchaseOrderResponse>[] = [
    {
      header: "PO Reference & Product",
      cell: (order) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-2xl bg-sky-50 text-sky-700 font-bold flex items-center justify-center text-xs border border-sky-200">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">
              {order.poNumber}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {order.productName || (order.productId ? `Product ID: ${order.productId.substring(0, 8)}...` : order.poNumber || "—")}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Buyer Party",
      cell: (order) => (
        <div className="text-xs font-medium text-slate-800">
          <p className="font-bold text-slate-900">{order.buyerName || "Buyer"}</p>
          <span className="text-[11px] text-slate-400">{order.buyerEmail || (order.buyerId ? `ID: ${order.buyerId.substring(0, 8)}...` : "—")}</span>
        </div>
      ),
    },
    {
      header: "Supplier Party",
      cell: (order) => (
        <div className="text-xs font-medium text-slate-800">
          <p className="font-bold text-slate-900">{order.supplierName || "Supplier"}</p>
          <span className="text-[11px] text-slate-400">Supplier ID: {order.supplierId}</span>
        </div>
      ),
    },
    {
      header: "Contract Amount",
      cell: (order) => (
        <div className="text-xs">
          <p className="font-extrabold text-slate-900">
            {order.currency} ${order.totalAmount.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">
            {order.quantity} {order.unit}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (order) => <AdminBadge type={order.status} />,
    },
    {
      header: "Placed",
      cell: (order) => (
        <span className="text-xs text-slate-600 whitespace-nowrap font-medium">
          {new Date(order.placedAt || order.createdAt).toLocaleDateString(undefined, {
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
      cell: (order) => {
        const isNonCancellable =
          order.status === "SHIPPED" ||
          order.status === "DELIVERED" ||
          order.status === "CANCELLED";

        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Inspect Detail */}
            <button
              type="button"
              onClick={() => handleInspect(order)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Inspect Order & Shipment Details"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Cancel Order */}
            <button
              type="button"
              onClick={() => handleOpenCancelModal(order)}
              disabled={isNonCancellable}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={
                isNonCancellable
                  ? `Cannot cancel order in ${order.status} state`
                  : "Cancel Purchase Order"
              }
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
        searchPlaceholder="Search PO number or notes..."
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
          onChange={(e) => onStatusFilterChange(e.target.value as OrderStatus | "")}
          className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
        >
          <option value="">All Order Statuses</option>
          <option value="PLACED">PLACED</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="SHIPPED">SHIPPED</option>
          <option value="DELIVERED">DELIVERED</option>
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
            keyExtractor={(o) => o.id}
            emptyTitle="No purchase orders found"
            emptyDescription="No procurement orders match the specified PO number or status filter."
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
      <AdminPurchaseOrderDetailModal
        orderId={selectedOrderId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedOrderId(null);
        }}
      />

      {/* Cancel Modal */}
      <AdminOrderCancelModal
        order={cancellingOrder}
        isOpen={isCancelOpen}
        onClose={() => {
          setIsCancelOpen(false);
          setCancellingOrder(null);
        }}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}
