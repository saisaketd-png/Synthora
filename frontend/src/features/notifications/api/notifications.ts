import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import {
  NotificationResponse,
  PaginatedNotifications,
  UnreadCountResponse,
} from "../types/notification";

/**
 * Fetches paginated notifications for the authenticated user.
 */
export async function getNotifications(
  page: number = 0,
  size: number = 20
): Promise<PaginatedNotifications> {
  const response = await authenticatedFetch(
    `/api/v1/notifications?page=${page}&size=${size}&sort=createdAt,desc`
  );

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
