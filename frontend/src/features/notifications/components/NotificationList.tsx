"use client";

import React from "react";
import { BellOff, AlertCircle, RefreshCw } from "lucide-react";
import { NotificationResponse } from "../types/notification";
import { NotificationItem } from "./NotificationItem";

interface NotificationListProps {
  notifications: NotificationResponse[];
  loading: boolean;
  error: string | null;
  isSupplier: boolean;
  onNotificationSelect: (notification: NotificationResponse) => void;
  onRetry?: () => void;
}

export function NotificationList({
  notifications,
  loading,
  error,
  isSupplier,
  onNotificationSelect,
  onRetry,
}: NotificationListProps) {
  if (loading) {
    return (
      <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex gap-3.5 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex-shrink-0" />
            <div className="flex-1 space-y-2 py-0.5">
              <div className="flex justify-between">
                <div className="h-3.5 bg-slate-100 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-16" />
              </div>
              <div className="h-3 bg-slate-100 rounded w-4/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center shadow-xs">
        <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3 text-rose-600 border border-rose-100">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Failed to load notifications</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
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
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-400 border border-slate-200">
          <BellOff className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">No notifications found</h3>
        <p className="text-xs text-slate-500 mt-1">
          When important procurement events occur, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
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
