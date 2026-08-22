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
  const loadNotifications = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const response = await getNotifications(page, pageSize);
      setData(response);
    } catch (err: unknown) {
      if (!silent) {
        const msg = err instanceof Error ? err.message : "Failed to load notifications";
        setError(msg);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [page, pageSize]);

  useEffect(() => {
    if (user) {
      loadNotifications(false);
    }

    // Visibility-aware polling for Notification Center
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible" && user) {
        loadNotifications(true);
      }
    }, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user) {
        loadNotifications(true);
      }
    };

    const handleWindowFocus = () => {
      if (user) {
        loadNotifications(true);
      }
    };

    const handleNotificationsUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ notification?: NotificationResponse }>;
      const newNotif = customEvt.detail?.notification;

      if (newNotif && page === 0) {
        // Prepend directly if on page 0 without flashing
        setData((prev) => {
          if (!prev) return prev;
          if (prev.content.some((n) => n.id === newNotif.id)) return prev;
          return {
            ...prev,
            totalElements: prev.totalElements + 1,
            content: [newNotif, ...prev.content],
          };
        });
      } else {
        loadNotifications(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("notifications-updated", handleNotificationsUpdate);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("notifications-updated", handleNotificationsUpdate);
    };
  }, [user, loadNotifications, page]);

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
  const totalElements = data?.totalElements || 0;
  const unreadCountOnPage = rawNotifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-[1240px] mx-auto py-2 sm:py-4 space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DFE1E6] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#091E42] tracking-tight">
            Notifications
          </h1>
          <p className="text-sm sm:text-[15px] text-[#526581] mt-1 leading-normal">
            Stay informed about RFQs, quotations, orders, documents, and procurement activity.
          </p>
        </div>

        {/* Header Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={markingAll || unreadCountOnPage === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-[#091E42] bg-white border border-[#DFE1E6] hover:bg-[#FAFBFC] rounded-lg transition-colors shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-[#0052CC]" />
            <span>Mark all as read</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER BAR & SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Segmented Filter Control */}
        <div className="inline-flex items-center p-1 bg-[#EBECF0]/70 rounded-lg border border-[#DFE1E6] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterUnreadOnly(false)}
            className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
              !filterUnreadOnly
                ? "bg-white text-[#0052CC] font-bold shadow-xs border border-[#DFE1E6]/80"
                : "text-[#5E6C84] hover:text-[#091E42]"
            }`}
          >
            All notifications
          </button>
          <button
            type="button"
            onClick={() => setFilterUnreadOnly(true)}
            className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              filterUnreadOnly
                ? "bg-white text-[#0052CC] font-bold shadow-xs border border-[#DFE1E6]/80"
                : "text-[#5E6C84] hover:text-[#091E42]"
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Unread</span>
            {unreadCountOnPage > 0 && (
              <span className="font-mono text-[10px] font-bold bg-[#DEEBFF] text-[#0747A6] px-1.5 py-0.2 rounded-full">
                {unreadCountOnPage}
              </span>
            )}
          </button>
        </div>

        {/* Right: Informative Summary */}
        {data && (
          <div className="text-xs sm:text-[13px] text-[#5E6C84] font-medium flex items-center gap-2">
            <span>
              <strong className="text-[#091E42]">{totalElements}</strong> {totalElements === 1 ? "notification" : "notifications"}
            </span>
            {unreadCountOnPage > 0 && (
              <>
                <span>•</span>
                <span className="text-[#0052CC] font-semibold">
                  {unreadCountOnPage} unread
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. UNIFIED NOTIFICATION PANEL */}
      <NotificationList
        notifications={displayedNotifications}
        loading={loading}
        error={error}
        isSupplier={isSupplier}
        filterUnreadOnly={filterUnreadOnly}
        onNotificationSelect={handleNotificationSelect}
        onRetry={loadNotifications}
      />

      {/* 4. PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#DFE1E6] pt-4 px-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#091E42] bg-white border border-[#DFE1E6] rounded-lg hover:bg-[#FAFBFC] disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-[#5E6C84] font-medium">
            Page <strong className="text-[#091E42] font-mono">{page + 1}</strong> of{" "}
            <strong className="text-[#091E42] font-mono">{totalPages}</strong>
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#091E42] bg-white border border-[#DFE1E6] rounded-lg hover:bg-[#FAFBFC] disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
