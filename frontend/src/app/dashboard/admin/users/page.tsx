"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, UserCheck, UserX, Shield, RefreshCw, AlertTriangle } from "lucide-react";
import { AdminUserResponse, UserRole, UserStatus, PaginatedResponse } from "@/features/admin/types";
import { getAdminUsers } from "@/features/admin/api/adminApi";
import { AdminUserList } from "@/features/admin/components/users/AdminUserList";
import { AdminStatsCard } from "@/features/admin/components/AdminStatsCard";

import { PageHeader } from "@/shared/components/ui/KemkendraUI";

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
    <div className="max-w-[1400px] mx-auto space-y-6 text-[#0F172A] pb-12">
      {/* 1. Calm Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#E4E4E7] pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#0052CC] block mb-1">
            Access Governance
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A]">
            User Accounts
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-xl">
            Participant identities, role assignments, activation states, and account status controls.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchUsers()}
          disabled={isLoading}
          className="h-8 px-3 text-xs font-medium text-[#475569] bg-white hover:bg-[#FAFAFA] border border-[#E4E4E7] rounded-[4px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#0052CC]" : "text-[#64748B]"}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Horizontal Overview Band */}
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-4 shadow-xs">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] mb-3">
          Directory Summary
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E4E7]">
          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Total Users</span>
            <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5">{totalUsers}</div>
          </div>
          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Active Accounts</span>
            <div className="text-lg font-bold font-mono text-[#059669] mt-0.5">{activeUsers}</div>
          </div>
          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Suspended</span>
            <div className="text-lg font-bold font-mono text-[#DC2626] mt-0.5">{suspendedUsers}</div>
          </div>
          <div className="sm:px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
            <span className="text-[11px] text-[#64748B] block">Administrators</span>
            <div className="text-lg font-bold font-mono text-[#0052CC] mt-0.5">{adminUsers}</div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between p-3.5 rounded-[6px] bg-[#FEF2F2] border border-[rgba(220,38,38,0.2)] text-[#DC2626] text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchUsers()}
            className="px-2.5 py-1 bg-white text-[#DC2626] border border-[#E4E4E7] rounded-[4px] hover:bg-[#FAFAFA] text-xs font-medium transition-colors cursor-pointer"
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
