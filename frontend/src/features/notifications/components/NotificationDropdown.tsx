"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCheck, BellOff, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { NotificationResponse } from "../types/notification";
import { NotificationItem } from "./NotificationItem";

interface NotificationDropdownProps {
  notifications: NotificationResponse[];
  unreadCount: number;
  loading: boolean;
  error?: string | null;
  isSupplier: boolean;
  onNotificationSelect: (notification: NotificationResponse) => void;
  onMarkAllAsRead: () => void;
  onRetry?: () => void;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  loading,
  error,
  isSupplier,
  onNotificationSelect,
  onMarkAllAsRead,
  onRetry,
  onClose,
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-[410px] max-w-[420px] bg-white rounded-xl shadow-xl border border-[#DFE1E6] overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-100"
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#FAFBFC] border-b border-[#DFE1E6]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-[#091E42] tracking-tight">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-[#DEEBFF] text-[#0747A6] border border-[#B3D4FF]">
              {unreadCount} unread
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0052CC] hover:text-[#0747A6] transition-colors px-2 py-1 rounded hover:bg-[#DEEBFF]/40"
            title="Mark all notifications as read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Body Content */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-[#F1F5F9]">
        {error ? (
          <div className="p-6 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-[#091E42]">Unable to load notifications</p>
            <p className="text-[11px] text-[#5E6C84]">Please check your network and try again.</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0052CC] hover:underline pt-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        ) : loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse py-1">
                <div className="w-7 h-7 rounded-md bg-[#EBECF0] flex-shrink-0" />
                <div className="flex-1 space-y-1.5 py-0.5">
                  <div className="h-3 bg-[#EBECF0] rounded w-2/3" />
                  <div className="h-2.5 bg-[#F4F5F7] rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <div className="w-9 h-9 rounded-full bg-[#FAFBFC] flex items-center justify-center mx-auto mb-2 text-[#6B778C] border border-[#DFE1E6]">
              <BellOff className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-[#091E42]">You're all caught up</p>
            <p className="text-[11px] text-[#5E6C84] mt-0.5">No new notifications at this time.</p>
          </div>
        ) : (
          notifications.slice(0, 6).map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              isSupplier={isSupplier}
              onSelect={onNotificationSelect}
              compact
            />
          ))
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-2.5 bg-[#FAFBFC] border-t border-[#DFE1E6] text-center">
        <Link
          href="/dashboard/notifications"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#0052CC] hover:text-[#0747A6] w-full py-1.5 rounded-lg hover:bg-[#EBECF0]/60 transition-colors"
        >
          <span>View all notifications</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
