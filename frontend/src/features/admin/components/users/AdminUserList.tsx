"use client";

import React, { useState } from "react";
import {
  Eye,
  Shield,
  UserX,
  UserCheck,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { AdminUserResponse, UserRole, UserStatus, PaginatedResponse } from "../../types";
import { EnterpriseTable, Column } from "@/shared/components/EnterpriseTable";
import { AdminBadge } from "../AdminBadge";
import { AdminPagination } from "../AdminPagination";
import { AdminSearchFilterBar } from "../AdminSearchFilterBar";
import { AdminConfirmModal } from "../AdminConfirmModal";
import { AdminUserDetailModal } from "./AdminUserDetailModal";
import { AdminUserRoleModal } from "./AdminUserRoleModal";
import {
  updateAdminUserStatus,
  updateAdminUserRole,
  deleteAdminUser,
} from "../../api/adminApi";

interface AdminUserListProps {
  data: PaginatedResponse<AdminUserResponse> | null;
  isLoading: boolean;
  page: number;
  pageSize: number;
  query: string;
  roleFilter: UserRole | "";
  statusFilter: UserStatus | "";
  includeDeleted: boolean;
  onPageChange: (newPage: number) => void;
  onSearchChange: (query: string) => void;
  onRoleFilterChange: (role: UserRole | "") => void;
  onStatusFilterChange: (status: UserStatus | "") => void;
  onIncludeDeletedChange: (includeDeleted: boolean) => void;
  onRefresh: () => void;
}

export function AdminUserList({
  data,
  isLoading,
  page,
  pageSize,
  query,
  roleFilter,
  statusFilter,
  includeDeleted,
  onPageChange,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onIncludeDeletedChange,
  onRefresh,
}: AdminUserListProps) {
  // Modal states
  const [selectedUser, setSelectedUser] = useState<AdminUserResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Status moderation confirm modal
  const [statusActionUser, setStatusActionUser] = useState<AdminUserResponse | null>(null);
  const [statusTarget, setStatusTarget] = useState<UserStatus>("SUSPENDED");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(false);

  // Soft delete confirm modal
  const [deleteActionUser, setDeleteActionUser] = useState<AdminUserResponse | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Toast / Feedback message
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleInspect = (user: AdminUserResponse) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  const handleOpenRoleModal = (user: AdminUserResponse) => {
    setSelectedUser(user);
    setIsRoleModalOpen(true);
  };

  const handleConfirmRoleChange = async (userId: string, newRole: UserRole) => {
    await updateAdminUserRole(userId, { role: newRole });
    showFeedback("success", `User role changed to ${newRole}. Action recorded in audit log.`);
    onRefresh();
  };

  const handleOpenStatusModal = (user: AdminUserResponse, target: UserStatus) => {
    setStatusActionUser(user);
    setStatusTarget(target);
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusActionUser) return;
    setIsStatusLoading(true);
    try {
      await updateAdminUserStatus(statusActionUser.id, { status: statusTarget });
      showFeedback(
        "success",
        `User account ${statusTarget === "SUSPENDED" ? "suspended" : "activated"} successfully. Recorded in audit log.`
      );
      setIsStatusModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to update user status");
    } finally {
      setIsStatusLoading(false);
    }
  };

  const handleOpenDeleteModal = (user: AdminUserResponse) => {
    setDeleteActionUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteActionUser) return;
    setIsDeleteLoading(true);
    try {
      await deleteAdminUser(deleteActionUser.id);
      showFeedback("success", `User account soft-deleted. Recorded in audit log.`);
      setIsDeleteModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to soft delete user");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const columns: Column<AdminUserResponse>[] = [
    {
      header: "User Identity",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">{user.name}</p>
            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">
              {user.id}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Email & Phone",
      cell: (user) => (
        <div>
          <p className="font-medium text-slate-800 break-all">{user.email}</p>
          <p className="text-[11px] text-slate-500 font-medium">{user.phone || "No phone"}</p>
        </div>
      ),
    },
    {
      header: "Role",
      cell: (user) => <AdminBadge type={user.role} />,
    },
    {
      header: "Status",
      cell: (user) => (
        <div className="flex flex-col items-start gap-1">
          <AdminBadge type={user.status} />
          {user.deletedAt && (
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
              Soft Deleted
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Created",
      cell: (user) => (
        <span className="text-xs text-slate-600 whitespace-nowrap font-medium">
          {new Date(user.createdAt).toLocaleDateString(undefined, {
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
      cell: (user) => {
        const isDeleted = Boolean(user.deletedAt);
        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* View Detail */}
            <button
              type="button"
              onClick={() => handleInspect(user)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Inspect User Detail"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Change Role */}
            <button
              type="button"
              onClick={() => handleOpenRoleModal(user)}
              disabled={isDeleted}
              className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Change User Role"
            >
              <Shield className="w-4 h-4" />
            </button>

            {/* Suspend / Activate */}
            {user.status === "ACTIVE" ? (
              <button
                type="button"
                onClick={() => handleOpenStatusModal(user, "SUSPENDED")}
                disabled={isDeleted}
                className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Suspend User"
              >
                <UserX className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenStatusModal(user, "ACTIVE")}
                disabled={isDeleted}
                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Activate User"
              >
                <UserCheck className="w-4 h-4" />
              </button>
            )}

            {/* Soft Delete */}
            <button
              type="button"
              onClick={() => handleOpenDeleteModal(user)}
              disabled={isDeleted}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={isDeleted ? "Account Already Deactivated" : "Soft-Delete User"}
            >
              <Trash2 className="w-4 h-4" />
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
        searchPlaceholder="Search by name or email..."
        searchValue={query}
        onSearchChange={onSearchChange}
        onReset={() => {
          onSearchChange("");
          onRoleFilterChange("");
          onStatusFilterChange("");
          onIncludeDeletedChange(false);
        }}
      >
        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value as UserRole | "")}
          className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
        >
          <option value="">All Roles</option>
          <option value="USER">Buyer (USER)</option>
          <option value="SUPPLIER">Supplier (SUPPLIER)</option>
          <option value="ADMIN">Admin (ADMIN)</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as UserStatus | "")}
          className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>

        {/* Include Deleted Toggle */}
        <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => onIncludeDeletedChange(e.target.checked)}
            className="rounded-sm text-teal-600 focus:ring-teal-500"
          />
          <span>Include Deleted</span>
        </label>
      </AdminSearchFilterBar>

      {/* Loading Skeleton or Table */}
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
            keyExtractor={(u) => u.id}
            emptyTitle="No users found"
            emptyDescription="No platform user accounts match the selected search or filter criteria."
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

      {/* User Detail Modal */}
      <AdminUserDetailModal
        user={selectedUser}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedUser(null);
        }}
      />

      {/* Role Change Modal */}
      <AdminUserRoleModal
        user={selectedUser}
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleConfirmRoleChange}
      />

      {/* Status Moderation Confirm Modal */}
      <AdminConfirmModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setStatusActionUser(null);
        }}
        onConfirm={handleConfirmStatusChange}
        isLoading={isStatusLoading}
        title={statusTarget === "SUSPENDED" ? "Suspend User Account" : "Activate User Account"}
        message={
          statusTarget === "SUSPENDED"
            ? `Are you sure you want to suspend ${statusActionUser?.name} (${statusActionUser?.email})? Suspended users cannot authenticate or perform marketplace transactions.`
            : `Are you sure you want to activate ${statusActionUser?.name} (${statusActionUser?.email})? The user will regain full platform access.`
        }
        confirmText={statusTarget === "SUSPENDED" ? "Suspend Account" : "Activate Account"}
        isDestructive={statusTarget === "SUSPENDED"}
      />

      {/* Soft Delete Confirm Modal */}
      <AdminConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteActionUser(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleteLoading}
        isDestructive={true}
        title="Soft-Delete User Account"
        message={`Are you sure you want to deactivate ${deleteActionUser?.name} (${deleteActionUser?.email})? This action soft-deletes the user from active platform workflows while strictly preserving all transaction, quotation, and purchase order history.`}
        confirmText="Deactivate Account"
      />
    </div>
  );
}
