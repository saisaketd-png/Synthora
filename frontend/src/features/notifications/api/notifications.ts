import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import {
  BulkUpdateNotificationPreferencesRequest,
  NotificationCategory,
  NotificationPreferencesResponse,
  NotificationResponse,
  PaginatedNotifications,
  UnreadCountResponse,
} from "../types/notification";

/**
 * Fetches paginated notifications for the authenticated user with optional category and read filter.
 */
export async function getNotifications(
  page: number = 0,
  size: number = 20,
  category?: NotificationCategory,
  read?: boolean
): Promise<PaginatedNotifications> {
  const params = new URLSearchParams();
  params.set("page", page.toString());
  params.set("size", Math.min(size, 100).toString());
  params.set("sort", "createdAt,desc");

  if (category) {
    params.set("category", category);
  }
  if (read !== undefined && read !== null) {
    params.set("read", read.toString());
  }

  const response = await authenticatedFetch(`/api/v1/notifications?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to load notifications: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches the unread notification count for the authenticated user.
 */
export async function getUnreadCount(): Promise<number> {
  const response = await authenticatedFetch("/api/v1/notifications/unread-count");

  if (!response.ok) {
    throw new Error(`Failed to load unread count: ${response.statusText}`);
  }

  const data: UnreadCountResponse = await response.json();
  return data.count;
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<NotificationResponse> {
  const response = await authenticatedFetch(
    `/api/v1/notifications/${notificationId}/read`,
    {
      method: "PUT",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to mark notification as read: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Marks all unread notifications for the authenticated user as read.
 */
export async function markAllNotificationsAsRead(): Promise<{ count: number }> {
  const response = await authenticatedFetch("/api/v1/notifications/read-all", {
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error(`Failed to mark all as read: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches notification channel preferences for the authenticated user.
 */
export async function getNotificationPreferences(): Promise<NotificationPreferencesResponse> {
  const response = await authenticatedFetch("/api/v1/users/me/notification-preferences");

  if (!response.ok) {
    throw new Error(`Failed to load notification preferences: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Updates notification channel preferences for the authenticated user.
 */
export async function updateNotificationPreferences(
  request: BulkUpdateNotificationPreferencesRequest
): Promise<NotificationPreferencesResponse> {
  const response = await authenticatedFetch("/api/v1/users/me/notification-preferences", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to update preferences: ${response.statusText}`);
  }

  return response.json();
}
