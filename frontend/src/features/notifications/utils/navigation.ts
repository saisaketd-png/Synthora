import { NotificationEntityType, NotificationResponse } from "../types/notification";

/**
 * Resolves the destination URL for a notification, accounting for user role and entity hierarchy.
 * Returns null if no safe navigation route exists (e.g. for Document uploads without a dedicated page).
 */
export function resolveNotificationRoute(
  notification: NotificationResponse,
  isSupplier: boolean
): string | null {
  const { entityType, entityId } = notification;

  if (!entityType || !entityId) {
    return null;
  }

  switch (entityType) {
    case "RFQ":
    case "QUOTATION":
      return isSupplier
        ? `/dashboard/supplier/rfqs/${entityId}`
        : `/dashboard/rfqs/${entityId}`;

    case "PURCHASE_ORDER":
    case "SHIPMENT":
      return isSupplier
        ? `/dashboard/supplier/orders/${entityId}`
        : `/dashboard/orders/${entityId}`;

    case "DOCUMENT":
    default:
      return null;
  }
}

/**
 * Formats an ISO date string into a user-friendly relative timestamp.
 */
export function formatNotificationTime(isoString: string): string {
  if (!isoString) return "";

  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) {
      return "Just now";
    }

    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) {
      return "Just now";
    }

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return `${diffMin}m ago`;
    }

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return isoString;
  }
}
