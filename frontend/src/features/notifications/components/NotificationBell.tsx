"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../api/notifications";
import { NotificationResponse } from "../types/notification";
import { NotificationDropdown } from "./NotificationDropdown";
import { resolveNotificationRoute } from "../utils/navigation";

interface NotificationBellProps {
  isSupplier: boolean;
}

export function NotificationBell({ isSupplier }: NotificationBellProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [recentNotifications, setRecentNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch unread count
  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Quietly ignore network/auth errors to keep UI resilient
    }
  }, []);

  // Fetch recent notifications when dropdown opens
  const fetchRecent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications(0, 5);
      setRecentNotifications(data.content || []);
    } catch {
      setRecentNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + lightweight polling (45s) + custom event synchronization
  useEffect(() => {
    refreshUnreadCount();

    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 45000);

    const handleUpdate = () => {
      refreshUnreadCount();
    };

    window.addEventListener("notifications-updated", handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("notifications-updated", handleUpdate);
    };
  }, [refreshUnreadCount]);

  const handleToggleDropdown = () => {
    if (!dropdownOpen) {
      fetchRecent();
      setDropdownOpen(true);
    } else {
      setDropdownOpen(false);
    }
  };

  const handleNotificationSelect = async (notification: NotificationResponse) => {
    // If unread, mark it as read immediately
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setRecentNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true, readAt: new Date().toISOString() } : n
          )
        );
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    }

    setDropdownOpen(false);

    // Route if target exists
    const targetRoute = resolveNotificationRoute(notification, isSupplier);
    if (targetRoute) {
      router.push(targetRoute);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setUnreadCount(0);
      setRecentNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleToggleDropdown}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-haspopup="dialog"
        aria-expanded={dropdownOpen}
        className={`relative p-2 rounded-lg transition-colors text-slate-600 hover:text-slate-900 hover:bg-slate-100 ${
          dropdownOpen ? "bg-slate-100 text-slate-900" : ""
        }`}
      >
        <Bell className="w-4 h-4" />

        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-extrabold text-white bg-blue-600 rounded-full border-2 border-white shadow-xs animate-in fade-in zoom-in-75 duration-150"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <NotificationDropdown
          notifications={recentNotifications}
          unreadCount={unreadCount}
          loading={loading}
          isSupplier={isSupplier}
          onNotificationSelect={handleNotificationSelect}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClose={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
}
