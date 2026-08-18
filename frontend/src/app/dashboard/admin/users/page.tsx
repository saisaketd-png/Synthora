"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, UserCheck, UserX, Shield, RefreshCw, AlertTriangle } from "lucide-react";
import { AdminUserResponse, UserRole, UserStatus, PaginatedResponse } from "@/features/admin/types";
import { getAdminUsers } from "@/features/admin/api/adminApi";
import { AdminUserList } from "@/features/admin/components/users/AdminUserList";
import { AdminStatsCard } from "@/features/admin/components/AdminStatsCard";

export default function AdminUsersPage() {
  const [data, setData] = useState<PaginatedResponse<AdminUserResponse>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Pagination states
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAdminUsers({
        page,
        size: pageSize,
        query: query.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        includeDeleted,
      });
      setData(response);
    } catch (err: any) {
      setError(err.message || "Failed to load user accounts");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, query, roleFilter, statusFilter, includeDeleted]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Derived metrics from loaded page
  const totalUsers = data.totalElements;
  const activeUsers = data.content.filter((u) => u.status === "ACTIVE" && !u.deletedAt).length;
  const suspendedUsers = data.content.filter((u) => u.status === "SUSPENDED").length;
  const adminUsers = data.content.filter((u) => u.role === "ADMIN").length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              <Users className="w-3.5 h-3.5" />
              Account Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              User Administration
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Inspect, suspend, activate, assign roles, and soft-delete platform user accounts. All administrative actions are recorded to the immutable audit log.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchUsers()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-teal-600" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Total Users"
          value={totalUsers}
          subtitle="Matching criteria"
          icon={Users}
          color="blue"
        />
        <AdminStatsCard
          title="Active (Page)"
          value={activeUsers}
          subtitle="Operational accounts"
          icon={UserCheck}
          color="teal"
        />
        <AdminStatsCard
          title="Suspended (Page)"
          value={suspendedUsers}
          subtitle="Restricted accounts"
          icon={UserX}
          color="amber"
        />
        <AdminStatsCard
          title="Admins (Page)"
          value={adminUsers}
          subtitle="Governance accounts"
          icon={Shield}
          color="rose"
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchUsers()}
            className="px-3 py-1.5 bg-white text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 text-xs font-bold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* User List Component */}
      <AdminUserList
        data={data}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        query={query}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        includeDeleted={includeDeleted}
        onPageChange={(newPage) => setPage(newPage)}
        onSearchChange={(newQuery) => {
          setQuery(newQuery);
          setPage(0);
        }}
        onRoleFilterChange={(newRole) => {
          setRoleFilter(newRole);
          setPage(0);
        }}
        onStatusFilterChange={(newStatus) => {
          setStatusFilter(newStatus);
          setPage(0);
        }}
        onIncludeDeletedChange={(newIncludeDeleted) => {
          setIncludeDeleted(newIncludeDeleted);
          setPage(0);
        }}
        onRefresh={fetchUsers}
      />
    </div>
  );
}
