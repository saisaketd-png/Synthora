"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCheck, BellOff, ArrowRight } from "lucide-react";
import { NotificationResponse } from "../types/notification";
import { NotificationItem } from "./NotificationItem";

interface NotificationDropdownProps {
  notifications: NotificationResponse[];
  unreadCount: number;
  loading: boolean;
  isSupplier: boolean;
  onNotificationSelect: (notification: NotificationResponse) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  loading,
  isSupplier,
  onNotificationSelect,
  onMarkAllAsRead,
  onClose,
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
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
      className="absolute right-0 mt-2.5 w-[calc(100vw-2rem)] max-w-[400px] sm:w-[390px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-100"
      role="dialog"
      aria-label="Notifications Dropdown"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-slate-900 tracking-tight">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              {unreadCount} unread
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-md hover:bg-blue-50/50"
            title="Mark all as read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-1.5 py-0.5">
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                  <div className="h-2.5 bg-slate-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-2 text-slate-400 border border-slate-200">
              <BellOff className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700">No notifications</p>
            <p className="text-[11px] text-slate-400 mt-0.5">You're all caught up!</p>
          </div>
        ) : (
          notifications.slice(0, 5).map((n) => (
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

      {/* Footer */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
        <Link
          href="/dashboard/notifications"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 w-full py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <span>View all notifications</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
