"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Shield,
  FileText,
  Package,
  Layers,
  Award,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { getAuthUser, AuthUser } from "@/features/auth/api/auth";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/features/notifications/api/notifications";
import { PageHeader } from "@/shared/components/ui/KemkendraUI";
import {
  NotificationCategory,
  NotificationResponse,
  PaginatedNotifications,
} from "@/features/notifications/types/notification";
import { NotificationList } from "@/features/notifications/components/NotificationList";
import { resolveNotificationRoute } from "@/features/notifications/utils/navigation";

const CATEGORY_TABS: { label: string; value: NotificationCategory | "ALL"; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "All", value: "ALL", icon: Bell },
  { label: "Security & Account", value: "SECURITY", icon: Shield },
  { label: "RFQs", value: "RFQ", icon: FileText },
  { label: "Quotations", value: "QUOTATION", icon: FileText },
  { label: "Orders", value: "PURCHASE_ORDER", icon: Package },
  { label: "Shipments", value: "SHIPMENT", icon: Package },
  { label: "Verification", value: "SUPPLIER_VERIFICATION", icon: Award },
  { label: "Catalog", value: "CATALOG", icon: Layers },
  { label: "Governance", value: "GOVERNANCE", icon: AlertCircle },
];

export default function NotificationInboxPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(15);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | "ALL">("ALL");
  const [filterUnreadOnly, setFilterUnreadOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [data, setData] = useState<PaginatedNotifications | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
      const categoryParam = selectedCategory === "ALL" ? undefined : selectedCategory;
      const readParam = filterUnreadOnly ? false : undefined;
      const response = await getNotifications(page, pageSize, categoryParam, readParam);
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
  }, [page, pageSize, selectedCategory, filterUnreadOnly]);

  useEffect(() => {
    if (user) {
      loadNotifications(false);
    }

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

      if (newNotif && page === 0 && selectedCategory === "ALL") {
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
  }, [user, loadNotifications, page, selectedCategory]);

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

    const targetRoute = notification.targetRoute || resolveNotificationRoute(notification, isSupplier);
    if (targetRoute) {
      router.push(targetRoute);
    }
  };

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
  const filteredNotifications = useMemo(() => {
    if (!searchTerm.trim()) return rawNotifications;
    const term = searchTerm.toLowerCase();
    return rawNotifications.filter(
      (n) => n.title.toLowerCase().includes(term) || n.message.toLowerCase().includes(term)
    );
  }, [rawNotifications, searchTerm]);

  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;
  const unreadCountOnPage = rawNotifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-[1240px] mx-auto space-y-5 pb-16 text-[#0F172A]">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Notification Center"
        description="Real-time procurement alerts, commercial quotation updates, order dispatch notices, and compliance messages."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadNotifications(false)}
              disabled={loading}
              className="h-9 px-3 bg-white border border-[#E4E4E7] hover:bg-[#FAFAFA] text-[#0F172A] rounded-[6px] transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={markingAll || unreadCountOnPage === 0}
              className="h-9 px-3.5 bg-white border border-[#E4E4E7] hover:bg-[#FAFAFA] text-[#0F172A] rounded-[6px] transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>Mark all as read</span>
            </button>
          </div>
        }
      />

      {/* 2. CATEGORY FILTER TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#E4E4E7] text-xs">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setSelectedCategory(tab.value);
                setPage(0);
              }}
              className={`h-8 px-3 rounded-[6px] text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? "bg-[#EFF6FF] text-[#0052CC] font-semibold"
                  : "text-[#475569] hover:bg-[#FAFAFA] hover:text-[#0F172A]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. FILTER BAR & SEARCH */}
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-3 shadow-tactile-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter notifications by keyword..."
            className="w-full h-9 pl-8.5 pr-3 text-xs bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0052CC] focus:bg-white"
          />
        </div>

        {/* Right: Unread Filter & Count */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center p-0.5 bg-[#F4F4F5] rounded-[6px] text-xs border border-[#E4E4E7]">
            <button
              type="button"
              onClick={() => {
                setFilterUnreadOnly(false);
                setPage(0);
              }}
              className={`px-2.5 py-1 rounded-[4px] text-xs transition-colors cursor-pointer ${
                !filterUnreadOnly
                  ? "bg-white text-[#0052CC] font-semibold shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterUnreadOnly(true);
                setPage(0);
              }}
              className={`px-2.5 py-1 rounded-[4px] text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                filterUnreadOnly
                  ? "bg-white text-[#0052CC] font-semibold shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>Unread</span>
              {unreadCountOnPage > 0 && (
                <span className="font-mono text-[10px] font-medium bg-[#EFF6FF] text-[#0052CC] px-1.5 py-0.2 rounded-[4px] border border-[#BFDBFE]">
                  {unreadCountOnPage}
                </span>
              )}
            </button>
          </div>

          <span className="text-xs text-[#64748B] font-mono hidden md:inline">
            Total: <strong className="text-[#0F172A]">{totalElements}</strong>
          </span>
        </div>
      </div>

      {/* 4. MAIN NOTIFICATION LIST */}
      <NotificationList
        notifications={filteredNotifications}
        loading={loading}
        error={error}
        isSupplier={isSupplier}
        onNotificationSelect={handleNotificationSelect}
        onRetry={() => loadNotifications(false)}
      />

      {/* 5. SERVER PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#DFE1E6] pt-4">
          <div className="text-xs text-[#5E6C84] font-medium">
            Page {page + 1} of {totalPages} ({totalElements} total notifications)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#091E42] bg-white border border-[#DFE1E6] rounded-lg hover:bg-[#FAFBFC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#091E42] bg-white border border-[#DFE1E6] rounded-lg hover:bg-[#FAFBFC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
