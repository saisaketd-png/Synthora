"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { getAuthUser, AuthUser } from "@/features/auth/api/auth";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/features/notifications/api/notifications";
import {
  NotificationResponse,
  PaginatedNotifications,
} from "@/features/notifications/types/notification";
import { NotificationList } from "@/features/notifications/components/NotificationList";
import { resolveNotificationRoute } from "@/features/notifications/utils/navigation";

export default function NotificationInboxPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(15);
  const [data, setData] = useState<PaginatedNotifications | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState<boolean>(false);
  const [markingAll, setMarkingAll] = useState<boolean>(false);

  const isSupplier = user?.role === "SUPPLIER";

  // Check auth
  useEffect(() => {
    const currentUser = getAuthUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
  }, [router]);

  // Load paginated notifications
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getNotifications(page, pageSize);
      setData(response);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load notifications";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  // Handle clicking on an individual notification
  const handleNotificationSelect = async (notification: NotificationResponse) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            content: prev.content.map((n) =>
              n.id === notification.id
                ? { ...n, read: true, readAt: new Date().toISOString() }
                : n
            ),
          };
        });
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    }

    const targetRoute = resolveNotificationRoute(notification, isSupplier);
    if (targetRoute) {
      router.push(targetRoute);
    }
  };

  // Handle Mark All As Read
  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: prev.content.map((n) => ({
            ...n,
            read: true,
            readAt: new Date().toISOString(),
          })),
        };
      });
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const rawNotifications = data?.content || [];
  const displayedNotifications = filterUnreadOnly
    ? rawNotifications.filter((n) => !n.read)
    : rawNotifications;

  const totalPages = data?.totalPages || 0;
  const unreadCountOnPage = rawNotifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Bell className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Notification Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Stay updated with real-time procurement alerts, RFQ quotations, and order updates.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={markingAll || unreadCountOnPage === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Mark all read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-slate-100/80 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterUnreadOnly(false)}
            className={`px-3 py-1.5 rounded-md transition-all ${
              !filterUnreadOnly
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Notifications
          </button>
          <button
            type="button"
            onClick={() => setFilterUnreadOnly(true)}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              filterUnreadOnly
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Unread</span>
          </button>
        </div>

        {data && (
          <span className="text-xs text-slate-500 font-medium">
            Showing {displayedNotifications.length} of {data.totalElements} items
          </span>
        )}
      </div>

      {/* Notification List */}
      <NotificationList
        notifications={displayedNotifications}
        loading={loading}
        error={error}
        isSupplier={isSupplier}
        onNotificationSelect={handleNotificationSelect}
        onRetry={loadNotifications}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 px-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-slate-600 font-medium">
            Page <span className="font-bold text-slate-900">{page + 1}</span> of{" "}
            <span className="font-bold text-slate-900">{totalPages}</span>
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
