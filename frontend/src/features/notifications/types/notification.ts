export type NotificationType =
  | "RFQ_SUBMITTED"
  | "QUOTATION_SUBMITTED"
  | "QUOTATION_ACCEPTED"
  | "QUOTATION_REJECTED"
  | "PO_ISSUED"
  | "PO_CONFIRMED"
  | "ORDER_PROCESSING_STARTED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "DOCUMENT_UPLOADED";

export type NotificationEntityType =
  | "RFQ"
  | "QUOTATION"
  | "PURCHASE_ORDER"
  | "SHIPMENT"
  | "DOCUMENT";

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: NotificationEntityType;
  entityId: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface PaginatedNotifications {
  content: NotificationResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
