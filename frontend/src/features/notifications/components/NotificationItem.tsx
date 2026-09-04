"use client";

import React from "react";
import {
  FileText,
  FileCheck,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Truck,
  PackageCheck,
  FileUp,
  BadgeCheck,
  RefreshCw,
  AlertTriangle,
  Factory,
  ArrowRight,
  Shield,
  ShieldAlert,
  Layers,
  ChevronRight,
} from "lucide-react";
import { NotificationCategory, NotificationPriority, NotificationResponse, NotificationType } from "../types/notification";
import { formatNotificationTime, resolveNotificationRoute } from "../utils/navigation";

interface NotificationItemProps {
  notification: NotificationResponse;
  isSupplier: boolean;
  onSelect: (notification: NotificationResponse) => void;
  compact?: boolean;
}

function getNotificationIcon(type: NotificationType, category: NotificationCategory, isUnread: boolean) {
  const iconClass = isUnread ? "w-4 h-4 text-[#0052CC]" : "w-4 h-4 text-[#5E6C84]";

  if (category === "SECURITY" || category === "ACCOUNT") {
    return <ShieldAlert className={isUnread ? "w-4 h-4 text-[#DE350B]" : iconClass} />;
  }

  switch (type) {
    case "RFQ_CREATED":
    case "RFQ_SUBMITTED":
    case "RFQ_RECEIVED":
      return <FileText className={isUnread ? "w-4 h-4 text-[#0052CC]" : iconClass} />;
    case "QUOTATION_SUBMITTED":
    case "QUOTATION_UPDATED":
    case "QUOTATION_REVISED":
      return <FileCheck className={isUnread ? "w-4 h-4 text-[#0052CC]" : iconClass} />;
    case "COUNTER_OFFER_RECEIVED":
    case "COUNTER_OFFER_ACCEPTED":
      return <RefreshCw className={isUnread ? "w-4 h-4 text-[#B35C00]" : iconClass} />;
    case "QUOTATION_ACCEPTED":
    case "PO_CONFIRMED":
    case "PURCHASE_ORDER_CONFIRMED":
    case "ORDER_RECEIPT_CONFIRMED":
      return <CheckCircle2 className={isUnread ? "w-4 h-4 text-[#006644]" : iconClass} />;
    case "QUOTATION_REJECTED":
    case "PO_REJECTED":
    case "RFQ_CANCELLED":
    case "PURCHASE_ORDER_CANCELLED":
    case "PRODUCT_REQUEST_REJECTED":
    case "USER_SUSPENDED":
    case "APPEAL_REJECTED":
      return <XCircle className={isUnread ? "w-4 h-4 text-[#DE350B]" : iconClass} />;
    case "PO_ISSUED":
    case "PURCHASE_ORDER_CREATED":
      return <ClipboardList className={isUnread ? "w-4 h-4 text-[#403294]" : iconClass} />;
    case "ORDER_PROCESSING_STARTED":
    case "PURCHASE_ORDER_PROCESSING":
      return <Factory className={isUnread ? "w-4 h-4 text-[#0052CC]" : iconClass} />;
    case "ORDER_SHIPPED":
    case "PURCHASE_ORDER_SHIPPED":
      return <Truck className={isUnread ? "w-4 h-4 text-[#403294]" : iconClass} />;
    case "ORDER_DELIVERED":
    case "PURCHASE_ORDER_DELIVERED":
      return <PackageCheck className={isUnread ? "w-4 h-4 text-[#006644]" : iconClass} />;
    case "DOCUMENT_UPLOADED":
      return <FileUp className={isUnread ? "w-4 h-4 text-[#0052CC]" : iconClass} />;
    case "SUPPLIER_VERIFIED":
    case "SUPPLIER_OFFERING_APPROVED":
    case "USER_REINSTATED":
    case "APPEAL_APPROVED":
      return <BadgeCheck className={isUnread ? "w-4 h-4 text-[#006644]" : iconClass} />;
    case "SUPPLIER_INFORMATION_REQUIRED":
    case "DOCUMENT_VERIFICATION_REQUIRED":
    case "APPEAL_INFORMATION_REQUIRED":
      return <AlertTriangle className={isUnread ? "w-4 h-4 text-[#B35C00]" : iconClass} />;
    default:
      return <FileText className={iconClass} />;
  }
}

function getPriorityBadge(priority: NotificationPriority) {
  switch (priority) {
    case "CRITICAL":
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
          Critical
        </span>
      );
    case "HIGH":
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
          High
        </span>
      );
    case "LOW":
      return (
        <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
          Low
        </span>
      );
    default:
      return null;
  }
}

function formatEntityReference(entityType: string | null, entityId: string | null): string | null {
  if (!entityId || !entityType) return null;
  const shortId = entityId.length > 8 ? entityId.substring(0, 8).toUpperCase() : entityId.toUpperCase();
  switch (entityType) {
    case "RFQ":
      return `RFQ-${shortId}`;
    case "PURCHASE_ORDER":
      return `PO-${shortId}`;
    case "QUOTATION":
      return `QUOTE-${shortId}`;
    case "SHIPMENT":
      return `TRK-${shortId}`;
    case "MASTER_PRODUCT":
    case "SUPPLIER_OFFERING":
      return `PRD-${shortId}`;
    default:
      return null;
  }
}

export function NotificationItem({
  notification,
  isSupplier,
  onSelect,
  compact = false,
}: NotificationItemProps) {
  const isUnread = !notification.read;
  const targetRoute = notification.targetRoute || resolveNotificationRoute(notification, isSupplier);
  const hasRoute = Boolean(targetRoute);
  const reference = formatEntityReference(notification.entityType, notification.entityId);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(notification);
    }
  };

  // Compact Mode (for Header Dropdown preview)
  if (compact) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(notification)}
        onKeyDown={handleKeyDown}
        className={`group relative flex items-start gap-3 p-3 transition-colors text-left w-full outline-none focus-visible:bg-[#F4F5F7] cursor-pointer ${
          isUnread ? "bg-[#F4F8FF] hover:bg-[#EAF2FF]" : "bg-white hover:bg-[#FAFBFC]"
        }`}
      >
        <div
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border mt-0.5 ${
            isUnread
              ? "bg-white border-[#B3D4FF] text-[#0052CC]"
              : "bg-[#F4F5F7] border-[#DFE1E6] text-[#5E6C84]"
          }`}
        >
          {getNotificationIcon(notification.type, notification.category, isUnread)}
        </div>

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-baseline justify-between gap-1">
            <p
              className={`text-xs truncate ${
                isUnread ? "font-bold text-[#091E42]" : "font-medium text-[#172B4D]"
              }`}
            >
              {notification.title}
            </p>
            <span className="text-[10px] text-[#6B778C] font-mono whitespace-nowrap shrink-0">
              {formatNotificationTime(notification.createdAt)}
            </span>
          </div>

          <p
            className={`text-[11px] leading-relaxed line-clamp-2 ${
              isUnread ? "text-[#172B4D]" : "text-[#5E6C84]"
            }`}
          >
            {notification.message}
          </p>

          <div className="flex items-center gap-2 pt-0.5">
            {getPriorityBadge(notification.priority)}
            {reference && (
              <span className="font-mono text-[9px] font-bold text-[#5E6C84] bg-[#F4F5F7] px-1.5 py-0.2 rounded border border-[#DFE1E6]">
                {reference}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-center pl-1">
          {isUnread && (
            <span
              className="w-2 h-2 rounded-full bg-[#0052CC]"
              title="Unread notification"
              aria-hidden="true"
            />
          )}
          {hasRoute && (
            <ChevronRight className="w-3.5 h-3.5 text-[#A5ADBA] group-hover:text-[#091E42] transition-colors" />
          )}
        </div>
      </div>
    );
  }

  // Full Row Mode (for Notification Center Inbox Feed)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(notification)}
      onKeyDown={handleKeyDown}
      className={`group relative flex items-start gap-3.5 sm:gap-4 py-3.5 px-4 sm:py-4 sm:px-5 transition-colors text-left w-full outline-none focus-visible:bg-[#EFF6FF] cursor-pointer ${
        isUnread
          ? "bg-[#F8FAFC] hover:bg-[#F1F5F9]"
          : "bg-white hover:bg-[#FAFAFA]"
      }`}
      aria-label={`${notification.title} - ${isUnread ? "Unread" : "Read"}`}
    >
      {/* Semantic Icon Container (36px) */}
      <div
        className={`shrink-0 w-9 h-9 rounded-[6px] flex items-center justify-center border mt-0.5 transition-colors ${
          isUnread
            ? "bg-white border-[#BFDBFE] text-[#0052CC]"
            : "bg-[#F4F4F5] border-[#E4E4E7] text-[#64748B]"
        }`}
      >
        {getNotificationIcon(notification.type, notification.category, isUnread)}
      </div>

      {/* Main Content & Message Body */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Title + Priority + Time Row */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            {isUnread && (
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-[#0052CC] shrink-0"
                title="Unread notification"
                aria-hidden="true"
              />
            )}
            <h3
              className={`text-xs sm:text-[13px] leading-snug tracking-tight truncate ${
                isUnread ? "font-bold text-[#0F172A]" : "font-semibold text-[#334155]"
              }`}
            >
              {notification.title}
            </h3>
            {getPriorityBadge(notification.priority)}
          </div>

          <span className="text-[11px] text-[#64748B] font-mono whitespace-nowrap shrink-0">
            {formatNotificationTime(notification.createdAt)}
          </span>
        </div>

        {/* Description */}
        <p
          className={`text-xs leading-relaxed max-w-4xl ${
            isUnread ? "text-[#0F172A]" : "text-[#475569]"
          }`}
        >
          {notification.message}
        </p>

        {/* Reference Identifier & Category */}
        <div className="pt-0.5 flex items-center gap-2 flex-wrap">
          {notification.category && (
            <span className="text-[10px] font-mono font-medium text-[#0052CC] bg-[#EFF6FF] px-2 py-0.2 rounded-[4px] border border-[#BFDBFE]">
              {notification.category.replace(/_/g, " ")}
            </span>
          )}
          {reference && (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[#475569] bg-[#F4F4F5] px-1.5 py-0.2 rounded-[4px] border border-[#E4E4E7]">
              {reference}
            </span>
          )}
        </div>
      </div>

      {/* Trailing Action */}
      <div className="flex items-center gap-2 shrink-0 self-center pl-1">
        {hasRoute && (
          <div className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[#94A3B8] group-hover:text-[#0052CC] transition-colors">
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </div>
        )}
      </div>
    </div>
  );
}
