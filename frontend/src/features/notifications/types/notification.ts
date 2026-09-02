export type NotificationType =
  | "RFQ_CREATED"
  | "RFQ_SUBMITTED"
  | "RFQ_RECEIVED"
  | "RFQ_CANCELLED"
  | "RFQ_EXPIRED"
  | "RFQ_UPDATED"
  | "RFQ_CLOSED"
  | "QUOTATION_SUBMITTED"
  | "QUOTATION_UPDATED"
  | "QUOTATION_REVISED"
  | "QUOTATION_ACCEPTED"
  | "QUOTATION_REJECTED"
  | "COUNTER_OFFER_RECEIVED"
  | "COUNTER_OFFER_ACCEPTED"
  | "COUNTER_OFFER_REJECTED"
  | "PURCHASE_ORDER_CREATED"
  | "PO_ISSUED"
  | "PO_CONFIRMED"
  | "PO_REJECTED"
  | "PURCHASE_ORDER_CONFIRMED"
  | "PURCHASE_ORDER_PROCESSING"
  | "PURCHASE_ORDER_SHIPPED"
  | "PURCHASE_ORDER_DELIVERED"
  | "PURCHASE_ORDER_CANCELLED"
  | "ORDER_PROCESSING_STARTED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "ORDER_RECEIPT_CONFIRMED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_VERIFICATION_REQUIRED"
  | "DOCUMENT_REJECTED"
  | "DOCUMENT_EXPIRED"
  | "PRODUCT_REQUEST_SUBMITTED"
  | "PRODUCT_INFO_RESPONDED"
  | "PRODUCT_REQUEST_APPROVED"
  | "PRODUCT_REQUEST_REJECTED"
  | "PRODUCT_REQUEST_INFORMATION_REQUIRED"
  | "MASTER_PRODUCT_CREATED"
  | "MASTER_PRODUCT_UPDATED"
  | "MASTER_PRODUCT_DEACTIVATED"
  | "MASTER_PRODUCT_MERGED"
  | "SUPPLIER_VERIFICATION_STARTED"
  | "SUPPLIER_VERIFICATION_SUBMITTED"
  | "SUPPLIER_INFORMATION_REQUIRED"
  | "VERIFICATION_INFO_REQUESTED"
  | "SUPPLIER_VERIFIED"
  | "SUPPLIER_REJECTED"
  | "SUPPLIER_SUSPENDED"
  | "SUPPLIER_OFFERING_SUBMITTED"
  | "SUPPLIER_OFFERING_UPDATED"
  | "SUPPLIER_OFFERING_INFORMATION_REQUIRED"
  | "SUPPLIER_OFFERING_APPROVED"
  | "SUPPLIER_OFFERING_FLAGGED"
  | "SUPPLIER_OFFERING_REJECTED"
  | "SUPPLIER_OFFERING_SUSPENDED"
  | "SUPPLIER_OFFERING_DEACTIVATED"
  | "SUPPLIER_OFFERING_MODERATED"
  | "USER_SUSPENDED"
  | "USER_REINSTATED"
  | "APPEAL_SUBMITTED"
  | "APPEAL_REVIEW_STARTED"
  | "APPEAL_INFORMATION_REQUIRED"
  | "APPEAL_APPROVED"
  | "APPEAL_REJECTED";

export type NotificationCategory =
  | "SECURITY"
  | "ACCOUNT"
  | "SUPPLIER_VERIFICATION"
  | "RFQ"
  | "QUOTATION"
  | "PURCHASE_ORDER"
  | "SHIPMENT"
  | "CATALOG"
  | "GOVERNANCE"
  | "SYSTEM";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export type NotificationEntityType =
  | "RFQ"
  | "QUOTATION"
  | "PURCHASE_ORDER"
  | "SHIPMENT"
  | "DOCUMENT"
  | "PRODUCT_REQUEST"
  | "MASTER_PRODUCT"
  | "SUPPLIER_OFFERING"
  | "SUPPLIER"
  | "ACCOUNT_SUSPENSION"
  | "ACCOUNT_SUSPENSION_APPEAL";

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  entityType: NotificationEntityType | null;
  entityId: string | null;
  targetRoute?: string;
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

export interface NotificationPreferenceItem {
  category: NotificationCategory;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  mandatory: boolean;
}

export interface NotificationPreferencesResponse {
  preferences: NotificationPreferenceItem[];
}

export interface UpdateNotificationPreferenceRequest {
  category: NotificationCategory;
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
}

export interface BulkUpdateNotificationPreferencesRequest {
  preferences: UpdateNotificationPreferenceRequest[];
}
