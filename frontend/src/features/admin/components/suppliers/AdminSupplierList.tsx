"use client";

import React, { useState } from "react";
import {
  Eye,
  CheckCircle2,
  XCircle,
  Globe,
  Globe2,
  UserX,
  UserCheck,
  AlertTriangle,
  Building2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { AdminSupplierResponse, UserStatus, PaginatedResponse } from "../../types";
import { EnterpriseTable, Column } from "@/shared/components/EnterpriseTable";
import { AdminBadge } from "../AdminBadge";
import { AdminPagination } from "../AdminPagination";
import { AdminSearchFilterBar } from "../AdminSearchFilterBar";
import { AdminConfirmModal } from "../AdminConfirmModal";
import { AdminSupplierDetailModal } from "./AdminSupplierDetailModal";
import {
  updateAdminSupplierVerification,
  updateAdminSupplierExportReady,
  updateAdminSupplierStatus,
} from "../../api/adminApi";

interface AdminSupplierListProps {
  data: PaginatedResponse<AdminSupplierResponse> | null;
  isLoading: boolean;
  page: number;
  pageSize: number;
  query: string;
  country: string;
  verifiedFilter: boolean | undefined;
  exportReadyFilter: boolean | undefined;
  userStatusFilter: UserStatus | "";
  onPageChange: (newPage: number) => void;
  onSearchChange: (query: string) => void;
  onCountryChange: (country: string) => void;
  onVerifiedFilterChange: (verified: boolean | undefined) => void;
  onExportReadyFilterChange: (exportReady: boolean | undefined) => void;
  onUserStatusFilterChange: (status: UserStatus | "") => void;
  onRefresh: () => void;
}

export function AdminSupplierList({
  data,
  isLoading,
  page,
  pageSize,
  query,
  country,
  verifiedFilter,
  exportReadyFilter,
  userStatusFilter,
  onPageChange,
  onSearchChange,
  onCountryChange,
  onVerifiedFilterChange,
  onExportReadyFilterChange,
  onUserStatusFilterChange,
  onRefresh,
}: AdminSupplierListProps) {
  // Detail Modal
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Verification Confirm Modal
  const [verifyActionSupplier, setVerifyActionSupplier] = useState<AdminSupplierResponse | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<boolean>(true);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);

  // Export Ready Confirm Modal
  const [exportActionSupplier, setExportActionSupplier] = useState<AdminSupplierResponse | null>(null);
  const [exportTarget, setExportTarget] = useState<boolean>(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExportLoading, setIsExportLoading] = useState(false);

  // Account Status Confirm Modal
  const [statusActionSupplier, setStatusActionSupplier] = useState<AdminSupplierResponse | null>(null);
  const [statusTarget, setStatusTarget] = useState<UserStatus>("SUSPENDED");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(false);

  // Toast Feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleInspect = (supplier: AdminSupplierResponse) => {
    setSelectedSupplierId(supplier.id);
    setIsDetailOpen(true);
  };

  // Verification Handler
  const handleOpenVerifyModal = (supplier: AdminSupplierResponse, target: boolean) => {
    setVerifyActionSupplier(supplier);
    setVerifyTarget(target);
    setIsVerifyModalOpen(true);
  };

  const handleConfirmVerify = async () => {
    if (!verifyActionSupplier) return;
    setIsVerifyLoading(true);
    try {
      await updateAdminSupplierVerification(verifyActionSupplier.id, { verified: verifyTarget });
      showFeedback(
        "success",
        `Supplier ${verifyTarget ? "verified" : "unverified"} successfully. Recorded in audit log.`
      );
      setIsVerifyModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to update supplier verification");
    } finally {
      setIsVerifyLoading(false);
    }
  };

  // Export Ready Handler
  const handleOpenExportModal = (supplier: AdminSupplierResponse, target: boolean) => {
    setExportActionSupplier(supplier);
    setExportTarget(target);
    setIsExportModalOpen(true);
  };

  const handleConfirmExport = async () => {
    if (!exportActionSupplier) return;
    setIsExportLoading(true);
    try {
      await updateAdminSupplierExportReady(exportActionSupplier.id, { exportReady: exportTarget });
      showFeedback(
        "success",
        `Supplier export readiness set to ${exportTarget ? "Export Ready" : "Domestic Only"}. Recorded in audit log.`
      );
      setIsExportModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to update export readiness");
    } finally {
      setIsExportLoading(false);
    }
  };

  // Status Handler
  const handleOpenStatusModal = (supplier: AdminSupplierResponse, target: UserStatus) => {
    setStatusActionSupplier(supplier);
    setStatusTarget(target);
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatus = async () => {
    if (!statusActionSupplier) return;
    setIsStatusLoading(true);
    try {
      await updateAdminSupplierStatus(statusActionSupplier.id, { status: statusTarget });
      showFeedback(
        "success",
        `Supplier account ${statusTarget === "SUSPENDED" ? "suspended" : "activated"} successfully. Recorded in audit log.`
      );
      setIsStatusModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to update supplier account status");
    } finally {
      setIsStatusLoading(false);
    }
  };

  const columns: Column<AdminSupplierResponse>[] = [
    {
      header: "Supplier Entity",
      cell: (supplier) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-2xl bg-purple-50 text-purple-700 font-bold flex items-center justify-center text-xs border border-purple-200">
            {supplier.name ? supplier.name.charAt(0).toUpperCase() : "S"}
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">{supplier.name}</p>
            <p className="text-[11px] text-slate-400 font-mono">
              {supplier.slug} (ID: {supplier.id})
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Country / Region",
      cell: (supplier) => (
        <div className="text-xs font-medium text-slate-800">
          <p className="font-bold">{supplier.countryName || "Unknown"}</p>
          <span className="text-[11px] text-slate-400 font-mono">{supplier.countryCode || "N/A"}</span>
        </div>
      ),
    },
    {
      header: "Verification",
      cell: (supplier) => (
        <AdminBadge
          type={supplier.verified ? "VERIFIED" : "UNVERIFIED"}
          label={supplier.verified ? "Verified" : "Unverified"}
        />
      ),
    },
    {
      header: "Export Ready",
      cell: (supplier) => (
        <AdminBadge
          type={supplier.exportReady ? "EXPORT_READY" : "NOT_EXPORT_READY"}
          label={supplier.exportReady ? "Export Ready" : "Domestic"}
        />
      ),
    },
    {
      header: "Account Standing",
      cell: (supplier) => (
        <div className="flex flex-col items-start gap-1">
          {supplier.userStatus ? (
            <AdminBadge type={supplier.userStatus} />
          ) : (
            <span className="text-xs text-slate-400 font-medium">Unlinked</span>
          )}
          {supplier.userEmail && (
            <span className="text-[11px] text-slate-500 truncate max-w-[140px]" title={supplier.userEmail}>
              {supplier.userEmail}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Onboarded",
      cell: (supplier) => (
        <span className="text-xs text-slate-600 whitespace-nowrap font-medium">
          {new Date(supplier.createdAt).toLocaleDateString(undefined, {
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
      cell: (supplier) => {
        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* View Detail */}
            <button
              type="button"
              onClick={() => handleInspect(supplier)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Inspect Supplier Profile"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Toggle Verification */}
            {supplier.verified ? (
              <button
                type="button"
                onClick={() => handleOpenVerifyModal(supplier, false)}
                className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                title="Remove Supplier Verification"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenVerifyModal(supplier, true)}
                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Verify Supplier"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}

            {/* Toggle Export Ready */}
            {supplier.exportReady ? (
              <button
                type="button"
                onClick={() => handleOpenExportModal(supplier, false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Remove Export-Ready Status"
              >
                <Globe className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenExportModal(supplier, true)}
                className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition-colors"
                title="Mark Export Ready"
              >
                <Globe2 className="w-4 h-4" />
              </button>
            )}

            {/* Suspend / Activate Account */}
            {supplier.userStatus === "ACTIVE" ? (
              <button
                type="button"
                onClick={() => handleOpenStatusModal(supplier, "SUSPENDED")}
                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                title="Suspend Supplier Account"
              >
                <UserX className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenStatusModal(supplier, "ACTIVE")}
                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Activate Supplier Account"
              >
                <UserCheck className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
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
        searchPlaceholder="Search supplier name, slug, email..."
        searchValue={query}
        onSearchChange={onSearchChange}
        onReset={() => {
          onSearchChange("");
          onCountryChange("");
          onVerifiedFilterChange(undefined);
          onExportReadyFilterChange(undefined);
          onUserStatusFilterChange("");
        }}
      >
        {/* Country Filter Input */}
        <input
          type="text"
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          placeholder="Filter country..."
          className="w-32 sm:w-36 px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
        />

        {/* Verification Filter */}
        <select
          value={verifiedFilter === undefined ? "" : String(verifiedFilter)}
          onChange={(e) => {
            const val = e.target.value;
            onVerifiedFilterChange(val === "" ? undefined : val === "true");
          }}
          className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
        >
          <option value="">All Verification</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>

        {/* Export Ready Filter */}
        <select
          value={exportReadyFilter === undefined ? "" : String(exportReadyFilter)}
          onChange={(e) => {
            const val = e.target.value;
            onExportReadyFilterChange(val === "" ? undefined : val === "true");
          }}
          className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
        >
          <option value="">All Export Standing</option>
          <option value="true">Export Ready</option>
          <option value="false">Domestic Only</option>
        </select>

        {/* User Account Status */}
        <select
          value={userStatusFilter}
          onChange={(e) => onUserStatusFilterChange(e.target.value as UserStatus | "")}
          className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
        >
          <option value="">All Account Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
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
            keyExtractor={(s) => String(s.id)}
            emptyTitle="No suppliers found"
            emptyDescription="No verified or pending supplier profiles match the selected filter criteria."
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
      <AdminSupplierDetailModal
        supplierId={selectedSupplierId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedSupplierId(null);
        }}
      />

      {/* Verification Confirm Modal */}
      <AdminConfirmModal
        isOpen={isVerifyModalOpen}
        onClose={() => {
          setIsVerifyModalOpen(false);
          setVerifyActionSupplier(null);
        }}
        onConfirm={handleConfirmVerify}
        isLoading={isVerifyLoading}
        title={verifyTarget ? "Verify Supplier" : "Remove Supplier Verification"}
        message={
          verifyTarget
            ? `Grant verified enterprise standing to ${verifyActionSupplier?.name}? This attaches the verified badge to their marketplace catalog offerings.`
            : `Remove verified status from ${verifyActionSupplier?.name}? The verified badge will be removed from marketplace listings.`
        }
        confirmText={verifyTarget ? "Verify Supplier" : "Remove Verification"}
        isDestructive={!verifyTarget}
      />

      {/* Export Ready Confirm Modal */}
      <AdminConfirmModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setExportActionSupplier(null);
        }}
        onConfirm={handleConfirmExport}
        isLoading={isExportLoading}
        title={exportTarget ? "Mark Export Ready" : "Remove Export Ready Status"}
        message={
          exportTarget
            ? `Enable global export-ready standing for ${exportActionSupplier?.name}?`
            : `Restrict ${exportActionSupplier?.name} to domestic distribution?`
        }
        confirmText={exportTarget ? "Set Export Ready" : "Remove Export Ready"}
      />

      {/* Account Status Confirm Modal */}
      <AdminConfirmModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setStatusActionSupplier(null);
        }}
        onConfirm={handleConfirmStatus}
        isLoading={isStatusLoading}
        title={statusTarget === "SUSPENDED" ? "Suspend Supplier Account" : "Activate Supplier Account"}
        message={
          statusTarget === "SUSPENDED"
            ? `Suspend ${statusActionSupplier?.name}'s linked user account? This restricts authentication and dynamically isolates supplier offerings from public catalog discovery.`
            : `Activate ${statusActionSupplier?.name}'s linked user account? The supplier will regain full platform and quotation capabilities.`
        }
        confirmText={statusTarget === "SUSPENDED" ? "Suspend Account" : "Activate Account"}
        isDestructive={statusTarget === "SUSPENDED"}
      />
    </div>
  );
}
