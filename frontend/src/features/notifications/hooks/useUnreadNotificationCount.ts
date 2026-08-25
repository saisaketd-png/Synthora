"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getUnreadCount } from "../api/notifications";
import { resolveApiUrl } from "@/lib/apiUrl";
import { NotificationResponse } from "../types/notification";

// Global cache of processed notification IDs to prevent duplicate event processing across hooks
const seenNotificationIds = new Set<string>();

export function useUnreadNotificationCount(pollingIntervalMs = 15000) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("synthora_token") : null;
    if (!token) {
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Gracefully ignore network/auth errors to keep UI resilient
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const setupStreamAndPolling = () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("synthora_token") : null;

      // If unauthenticated, close existing SSE if any and reset unread count
      if (!token) {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        setUnreadCount(0);
        setIsLoading(false);
        return;
      }

      // Initial count fetch for authenticated user
      refreshUnreadCount();

      // 1. Setup Server-Sent Events (SSE) Real-Time Stream
      if (!eventSourceRef.current) {
        try {
          const streamUrl = resolveApiUrl(`/api/v1/notifications/stream?token=${encodeURIComponent(token)}`);
          const es = new EventSource(streamUrl);
          eventSourceRef.current = es;

          es.addEventListener("notification", (event: MessageEvent) => {
            try {
              const data = JSON.parse(event.data) as {
                notification: NotificationResponse;
                unreadCount?: number;
              };

              const notif = data.notification;

              // Deduplicate incoming event IDs
              if (notif && notif.id && !seenNotificationIds.has(notif.id)) {
                seenNotificationIds.add(notif.id);

                // Update unread count
                if (typeof data.unreadCount === "number") {
                  setUnreadCount(data.unreadCount);
                } else {
                  setUnreadCount((prev) => prev + 1);
                }

                // Dispatch global notifications update
                window.dispatchEvent(
                  new CustomEvent("notifications-updated", {
                    detail: { notification: notif, unreadCount: data.unreadCount },
                  })
                );

                // If notification is RFQ-related, dispatch targeted rfq-updated event
                if (notif.entityType === "RFQ" && notif.entityId) {
                  window.dispatchEvent(
                    new CustomEvent("rfq-updated", {
                      detail: { rfqId: notif.entityId },
                    })
                  );
                }

                // If notification is Order-related, dispatch targeted order-updated event
                if (
                  (notif.entityType === "PURCHASE_ORDER" || notif.entityType === "SHIPMENT") &&
                  notif.entityId
                ) {
                  window.dispatchEvent(
                    new CustomEvent("order-updated", {
                      detail: { orderId: notif.entityId },
                    })
                  );
                }
              }
            } catch (err) {
              console.debug("Failed to parse SSE notification payload", err);
            }
          });

          es.onerror = () => {
            // SSE will automatically attempt reconnection; fallback polling handles gap
          };
        } catch (err) {
          console.debug("Failed to initialize SSE connection", err);
        }
      }
    };

    setupStreamAndPolling();

    // 2. Visibility-Aware Polling Fallback & Heartbeat
    const interval = setInterval(() => {
      const token = typeof window !== "undefined" ? localStorage.getItem("synthora_token") : null;
      if (token && typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshUnreadCount();
      }
    }, pollingIntervalMs);

    // 3. Instant Revalidation on Focus & Visibility Change
    const handleVisibilityChange = () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("synthora_token") : null;
      if (token && document.visibilityState === "visible") {
        refreshUnreadCount();
      }
    };

    const handleWindowFocus = () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("synthora_token") : null;
      if (token) {
        refreshUnreadCount();
      }
    };

    const handleAuthChange = () => {
      setupStreamAndPolling();
    };

    const handleUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ unreadCount?: number }>;
      if (typeof customEvt.detail?.unreadCount === "number") {
        setUnreadCount(customEvt.detail.unreadCount);
      } else {
        refreshUnreadCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("auth-changed", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("notifications-updated", handleUpdate);

    return () => {
      clearInterval(interval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("auth-changed", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("notifications-updated", handleUpdate);
    };
  }, [refreshUnreadCount, pollingIntervalMs]);

  return { unreadCount, refreshUnreadCount, isLoading };
}
