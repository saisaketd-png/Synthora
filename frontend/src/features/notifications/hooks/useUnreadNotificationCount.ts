"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getUnreadCount } from "../api/notifications";
import { resolveApiUrl } from "@/lib/apiUrl";
import { NotificationResponse } from "../types/notification";
import { getAuthToken } from "@/features/auth/api/auth";
import { subscribeSse, SseEvent } from "../utils/sseClient";
import { requestTokenRefresh } from "@/features/auth/api/authenticatedFetch";

// Global cache of processed notification IDs to prevent duplicate event processing across hooks
const seenNotificationIds = new Set<string>();

const INITIAL_BACKOFF_MS = 2000;
const MAX_BACKOFF_MS = 30000;

export function useUnreadNotificationCount(pollingIntervalMs = 15000) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backoffDelayRef = useRef<number>(INITIAL_BACKOFF_MS);
  const refreshRetryCountRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  const refreshUnreadCount = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      if (isMountedRef.current) {
        setUnreadCount(0);
        setIsLoading(false);
      }
      return;
    }

    try {
      const count = await getUnreadCount();
      if (isMountedRef.current) {
        setUnreadCount(count);
      }
    } catch {
      // Gracefully ignore network/auth errors to keep UI resilient
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const clearTimersAndStream = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };

    const scheduleReconnect = (delayMs: number) => {
      if (!isMountedRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        // Tab is hidden; wait for visibilitychange event rather than scheduling timers
        return;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        startSseStream();
      }, delayMs);
    };

    const handleSseNotification = (event: SseEvent) => {
      if (event.event !== "notification") {
        return;
      }

      try {
        const data = JSON.parse(event.data) as {
          notification: NotificationResponse;
          unreadCount?: number;
        };

        const notif = data.notification;

        // Deduplicate incoming event IDs
        if (notif && notif.id && !seenNotificationIds.has(notif.id)) {
          seenNotificationIds.add(notif.id);

          if (isMountedRef.current) {
            if (typeof data.unreadCount === "number") {
              setUnreadCount(data.unreadCount);
            } else {
              setUnreadCount((prev) => prev + 1);
            }
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
    };

    const startSseStream = async () => {
      if (!isMountedRef.current) return;

      const token = getAuthToken();
      if (!token) {
        clearTimersAndStream();
        if (isMountedRef.current) {
          setUnreadCount(0);
          setIsLoading(false);
        }
        return;
      }

      // Do not stream when tab is hidden
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      // Abort any existing stream before starting a new one
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Pure clean URL: ABSOLUTELY NO TOKEN in query string
      const streamUrl = resolveApiUrl("/api/v1/notifications/stream");

      await subscribeSse({
        url: streamUrl,
        token,
        signal: controller.signal,
        onOpen: () => {
          // Connection established successfully; reset backoffs and 401 retry count
          backoffDelayRef.current = INITIAL_BACKOFF_MS;
          refreshRetryCountRef.current = 0;
        },
        onEvent: (evt) => {
          if (evt.event === "connected" || evt.event === "ping") {
            backoffDelayRef.current = INITIAL_BACKOFF_MS;
            refreshRetryCountRef.current = 0;
          } else if (evt.event === "notification") {
            handleSseNotification(evt);
          }
        },
        onError: async (err, status) => {
          if (controller.signal.aborted || !isMountedRef.current) {
            return;
          }

          // Handle 401 Unauthorized: Attempt single-flight token refresh
          if (status === 401) {
            if (refreshRetryCountRef.current === 0) {
              refreshRetryCountRef.current = 1;
              try {
                const newToken = await requestTokenRefresh();
                if (newToken && isMountedRef.current) {
                  // Reconnect once with the refreshed access token
                  startSseStream();
                  return;
                }
              } catch {
                // Token refresh failed; fall back to polling without looping
                refreshRetryCountRef.current = 2;
              }
            } else {
              // Second 401 or refresh already failed: stop SSE reconnect loop, rely on polling
              return;
            }
          }

          // Network or server error: compute bounded exponential backoff
          const jitter = Math.random() * 1000;
          const currentDelay = backoffDelayRef.current;
          backoffDelayRef.current = Math.min(
            backoffDelayRef.current * 1.5 + jitter,
            MAX_BACKOFF_MS
          );

          scheduleReconnect(currentDelay);
        },
      });
    };

    const setupSession = () => {
      const token = getAuthToken();
      if (!token) {
        clearTimersAndStream();
        setUnreadCount(0);
        setIsLoading(false);
        return;
      }

      // Initial count fetch for authenticated user
      refreshUnreadCount();

      // Start SSE stream
      startSseStream();

      // Setup Fallback Polling (only when visible)
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      pollingIntervalRef.current = setInterval(() => {
        const currentToken = getAuthToken();
        if (
          currentToken &&
          typeof document !== "undefined" &&
          document.visibilityState === "visible"
        ) {
          refreshUnreadCount();
        }
      }, pollingIntervalMs);
    };

    setupSession();

    // Visibility change handler: pause on hide, resume on visible
    const handleVisibilityChange = () => {
      if (typeof document === "undefined") return;

      if (document.visibilityState === "visible") {
        const token = getAuthToken();
        if (token) {
          refreshUnreadCount();
          // Resume SSE if not actively running
          if (!abortControllerRef.current || abortControllerRef.current.signal.aborted) {
            startSseStream();
          }
        }
      } else {
        // Tab hidden: pause SSE stream to save server resources and battery
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      }
    };

    const handleWindowFocus = () => {
      const token = getAuthToken();
      if (token && typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshUnreadCount();
        if (!abortControllerRef.current || abortControllerRef.current.signal.aborted) {
          startSseStream();
        }
      }
    };

    const handleAuthChange = () => {
      refreshRetryCountRef.current = 0;
      backoffDelayRef.current = INITIAL_BACKOFF_MS;
      setupSession();
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
      isMountedRef.current = false;
      clearTimersAndStream();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("auth-changed", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("notifications-updated", handleUpdate);
    };
  }, [refreshUnreadCount, pollingIntervalMs]);

  return { unreadCount, refreshUnreadCount, isLoading };
}
