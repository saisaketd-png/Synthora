"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../api/notifications";
import { NotificationResponse } from "../types/notification";
import { NotificationDropdown } from "./NotificationDropdown";
import { resolveNotificationRoute } from "../utils/navigation";
import { useUnreadNotificationCount } from "../hooks/useUnreadNotificationCount";

interface NotificationBellProps {
  isSupplier: boolean;
}

export function NotificationBell({ isSupplier }: NotificationBellProps) {
  const router = useRouter();
  const { unreadCount, refreshUnreadCount } = useUnreadNotificationCount();
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [recentNotifications, setRecentNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent notifications when dropdown opens
  const fetchRecent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications(0, 6);
      setRecentNotifications(data.content || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
      setRecentNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleDropdown = () => {
    if (!dropdownOpen) {
      fetchRecent();
      setDropdownOpen(true);
    } else {
      setDropdownOpen(false);
    }
  };

  const handleNotificationSelect = async (notification: NotificationResponse) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
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

    const targetRoute = resolveNotificationRoute(notification, isSupplier);
    if (targetRoute) {
      router.push(targetRoute);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
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
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={dropdownOpen}
        className={`relative h-[38px] w-[38px] rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
          dropdownOpen
            ? "bg-[#EBECF0] text-[#091E42] border-[#C1C7D0]"
            : "bg-white hover:bg-[#FAFBFC] border-[#DFE1E6] text-[#5E6C84] hover:text-[#091E42] shadow-2xs"
        }`}
      >
        <Bell className="w-4 h-4" />

        {/* Clean, subtle unread indicator dot (counter is in sidebar) */}
        {unreadCount > 0 && (
          <span
            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0052CC] ring-2 ring-white"
            aria-hidden="true"
          />
        )}
      </button>

      {dropdownOpen && (
        <NotificationDropdown
          notifications={recentNotifications}
          unreadCount={unreadCount}
          loading={loading}
          error={error}
          isSupplier={isSupplier}
          onNotificationSelect={handleNotificationSelect}
          onMarkAllAsRead={handleMarkAllAsRead}
          onRetry={fetchRecent}
          onClose={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
}
