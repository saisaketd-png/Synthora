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
    <div className="max-w-[1240px] mx-auto py-2 sm:py-4 space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DFE1E6] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#091E42] tracking-tight">
            Notification & Communication Center
          </h1>
          <p className="text-sm sm:text-[15px] text-[#526581] mt-1 leading-normal">
            Real-time administrative and marketplace updates across RFQs, orders, compliance, and governance.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => loadNotifications(false)}
            disabled={loading}
            className="p-2 text-[#5E6C84] hover:text-[#091E42] bg-white border border-[#DFE1E6] rounded-lg hover:bg-[#FAFBFC] transition-colors shadow-2xs cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
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

      {/* 2. CATEGORY FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-[#EBECF0]">
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
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[#0052CC] text-white shadow-xs"
                  : "bg-white text-[#5E6C84] hover:text-[#091E42] hover:bg-[#FAFBFC] border border-[#DFE1E6]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. FILTER BAR & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFBFC] p-3 rounded-xl border border-[#DFE1E6]">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#7A869A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter notifications by keyword..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-[#DFE1E6] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] text-[#091E42]"
          />
        </div>

        {/* Right: Unread Filter & Count */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center p-0.5 bg-[#EBECF0] rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setFilterUnreadOnly(false);
                setPage(0);
              }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                !filterUnreadOnly
                  ? "bg-white text-[#0052CC] font-bold shadow-xs"
                  : "text-[#5E6C84] hover:text-[#091E42]"
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
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                filterUnreadOnly
                  ? "bg-white text-[#0052CC] font-bold shadow-xs"
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

          <span className="text-xs text-[#5E6C84] font-medium hidden md:inline">
            Total: <strong>{totalElements}</strong>
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
