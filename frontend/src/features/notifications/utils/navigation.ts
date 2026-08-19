import { NotificationEntityType, NotificationResponse } from "../types/notification";

/**
 * Resolves the destination URL for a notification, accounting for user role (Admin, Supplier, Buyer) and entity hierarchy.
 * Returns null if no safe navigation route exists.
 */
export function resolveNotificationRoute(
  notification: NotificationResponse,
  isSupplier: boolean,
  isAdmin: boolean = false
): string | null {
  const { entityType, entityId } = notification;

  if (!entityType || !entityId) {
    return null;
  }

  if (isAdmin) {
    switch (entityType) {
      case "SUPPLIER_OFFERING":
        return `/dashboard/admin/catalog/offerings/${entityId}`;
      case "SUPPLIER":
        return `/dashboard/admin/catalog/verification/${entityId}`;
      case "PRODUCT_REQUEST":
        return `/dashboard/admin/catalog/requests`;
      case "MASTER_PRODUCT":
        return `/dashboard/admin/catalog/master-products/${entityId}`;
      case "RFQ":
      case "QUOTATION":
        return `/dashboard/admin/transactions/rfqs`;
      case "PURCHASE_ORDER":
      case "SHIPMENT":
        return `/dashboard/admin/transactions/orders`;
      default:
        return `/dashboard/admin/activity`;
    }
  }

  if (isSupplier) {
    switch (entityType) {
      case "RFQ":
      case "QUOTATION":
        return `/dashboard/supplier/rfqs/${entityId}`;
      case "PURCHASE_ORDER":
      case "SHIPMENT":
        return `/dashboard/supplier/orders/${entityId}`;
      case "SUPPLIER_OFFERING":
      case "PRODUCT_REQUEST":
        return `/dashboard/supplier/products`;
      case "SUPPLIER":
        return `/dashboard/supplier/verification`;
      default:
        return `/dashboard/supplier`;
    }
  }

  // Buyer Role
  switch (entityType) {
    case "RFQ":
    case "QUOTATION":
      return `/dashboard/rfqs/${entityId}`;
    case "PURCHASE_ORDER":
    case "SHIPMENT":
      return `/dashboard/orders/${entityId}`;
    case "MASTER_PRODUCT":
      return `/products/${entityId}`;
    default:
      return `/dashboard`;
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
