"use client";

import React from "react";
import { BellOff, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { NotificationResponse } from "../types/notification";
import { NotificationItem } from "./NotificationItem";

interface NotificationListProps {
  notifications: NotificationResponse[];
  loading: boolean;
  error: string | null;
  isSupplier: boolean;
  filterUnreadOnly?: boolean;
  onNotificationSelect: (notification: NotificationResponse) => void;
  onRetry?: () => void;
}

export function NotificationList({
  notifications,
  loading,
  error,
  isSupplier,
  filterUnreadOnly = false,
  onNotificationSelect,
  onRetry,
}: NotificationListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-2xs divide-y divide-[#F1F5F9]">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-5 sm:p-6 flex gap-4 sm:gap-5 animate-pulse">
            <div className="w-10 h-10 rounded-lg bg-[#E2E8F0] shrink-0" />
            <div className="flex-1 space-y-2.5 py-0.5">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-[#E2E8F0] rounded w-2/5" />
                <div className="h-3 bg-[#E2E8F0] rounded w-20" />
              </div>
              <div className="h-3.5 bg-[#F1F5F9] rounded w-4/5" />
              <div className="h-3 bg-[#F1F5F9] rounded w-28 mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-10 text-center shadow-2xs">
        <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center mx-auto mb-3 text-rose-600 border border-rose-200">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-[#091E42]">Unable to load notifications</h3>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-md mx-auto">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#091E42] bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 sm:p-16 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] flex items-center justify-center mx-auto mb-3.5 text-[#64748B] border border-[#E2E8F0]">
          {filterUnreadOnly ? (
            <CheckCircle2 className="w-6 h-6 text-[#00875A]" />
          ) : (
            <BellOff className="w-6 h-6" />
          )}
        </div>
        <h3 className="text-base font-bold text-[#091E42]">
          {filterUnreadOnly ? "No unread notifications" : "No notifications"}
        </h3>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-sm mx-auto">
          {filterUnreadOnly
            ? "You're all caught up on your procurement tasks and inquiries."
            : "You're all caught up. New procurement activity will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9] overflow-hidden shadow-2xs">
      {notifications.map((n) => (
        <NotificationItem
          key={n.id}
          notification={n}
          isSupplier={isSupplier}
          onSelect={onNotificationSelect}
        />
      ))}
    </div>
  );
}
