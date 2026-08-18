"use client";

import React from "react";
import {
  FileText,
  FileCheck,
  CheckCircle,
  XCircle,
  ClipboardList,
  CheckSquare,
  Clock,
  Truck,
  PackageCheck,
  File,
  ChevronRight,
} from "lucide-react";
import { NotificationResponse, NotificationType } from "../types/notification";
import { formatNotificationTime, resolveNotificationRoute } from "../utils/navigation";

interface NotificationItemProps {
  notification: NotificationResponse;
  isSupplier: boolean;
  onSelect: (notification: NotificationResponse) => void;
  compact?: boolean;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "RFQ_SUBMITTED":
      return <FileText className="w-4 h-4 text-blue-600" />;
    case "QUOTATION_SUBMITTED":
      return <FileCheck className="w-4 h-4 text-emerald-600" />;
    case "QUOTATION_ACCEPTED":
      return <CheckCircle className="w-4 h-4 text-teal-600" />;
    case "QUOTATION_REJECTED":
      return <XCircle className="w-4 h-4 text-rose-600" />;
    case "PO_ISSUED":
      return <ClipboardList className="w-4 h-4 text-indigo-600" />;
    case "PO_CONFIRMED":
      return <CheckSquare className="w-4 h-4 text-sky-600" />;
    case "ORDER_PROCESSING_STARTED":
      return <Clock className="w-4 h-4 text-amber-600" />;
    case "ORDER_SHIPPED":
      return <Truck className="w-4 h-4 text-purple-600" />;
    case "ORDER_DELIVERED":
      return <PackageCheck className="w-4 h-4 text-emerald-600" />;
    case "DOCUMENT_UPLOADED":
    default:
      return <File className="w-4 h-4 text-slate-600" />;
  }
}

export function NotificationItem({
  notification,
  isSupplier,
  onSelect,
  compact = false,
}: NotificationItemProps) {
  const hasRoute = resolveNotificationRoute(notification, isSupplier) !== null;
  const isUnread = !notification.read;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(notification);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(notification)}
      onKeyDown={handleKeyDown}
      className={`group relative flex items-start gap-3.5 transition-all text-left w-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg cursor-pointer ${
        compact ? "p-3 hover:bg-slate-50" : "p-4 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
      } ${isUnread ? "bg-blue-50/40" : "bg-white"}`}
      aria-label={`${notification.title} - ${isUnread ? "Unread" : "Read"}`}
    >
      {/* Type Icon Container */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${
          isUnread
            ? "bg-white border-blue-200 shadow-xs"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p
            className={`text-xs truncate ${
              isUnread ? "font-bold text-slate-900" : "font-medium text-slate-700"
            }`}
          >
            {notification.title}
          </p>
          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap flex-shrink-0">
            {formatNotificationTime(notification.createdAt)}
          </span>
        </div>

        <p
          className={`text-xs leading-relaxed line-clamp-2 ${
            isUnread ? "text-slate-800" : "text-slate-500"
          }`}
        >
          {notification.message}
        </p>
      </div>

      {/* Trailing indicator / affordance */}
      <div className="flex items-center gap-1.5 flex-shrink-0 self-center">
        {isUnread && (
          <span
            className="w-2 h-2 rounded-full bg-blue-600"
            title="Unread"
            aria-hidden="true"
          />
        )}
        {hasRoute && (
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
        )}
      </div>
    </div>
  );
}
