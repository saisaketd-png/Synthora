import React from "react";
import { UserRole, UserStatus, RfqStatus, OrderStatus } from "../types";

export type BadgeType =
  | UserRole
  | UserStatus
  | RfqStatus
  | OrderStatus
  | "VERIFIED"
  | "UNVERIFIED"
  | "EXPORT_READY"
  | "NOT_EXPORT_READY"
  | string;

interface AdminBadgeProps {
  type: BadgeType;
  label?: string;
  className?: string;
}

export function AdminBadge({ type, label, className = "" }: AdminBadgeProps) {
  const displayLabel = label || formatLabel(type);
  const colorStyles = getBadgeStyles(type);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold tracking-wider border uppercase ${colorStyles} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {displayLabel}
    </span>
  );
}

function formatLabel(type: string): string {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function getBadgeStyles(type: string): string {
  switch (type) {
    // Roles
    case "ADMIN":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "SUPPLIER":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "USER":
      return "bg-blue-50 text-blue-700 border-blue-200";

    // Statuses
    case "ACTIVE":
    case "VERIFIED":
    case "EXPORT_READY":
    case "AVAILABLE":
    case "ACCEPTED":
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "PENDING":
    case "PLACED":
    case "CONTACTED":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "CONFIRMED":
    case "PROCESSING":
    case "QUOTED":
    case "SHIPPED":
      return "bg-sky-50 text-sky-700 border-sky-200";

    case "SUSPENDED":
    case "UNVERIFIED":
    case "NOT_EXPORT_READY":
    case "OUT_OF_STOCK":
    case "HIDDEN":
    case "CLOSED":
      return "bg-slate-100 text-slate-700 border-slate-300";

    case "DISCONTINUED":
    case "REJECTED":
    case "CANCELLED":
      return "bg-rose-50 text-rose-700 border-rose-200";

    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}
