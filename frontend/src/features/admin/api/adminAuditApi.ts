import { resolveApiUrl } from "@/lib/apiUrl";

export type AuditAction =
  | "USER_CREATED"
  | "USER_SUSPENDED"
  | "USER_ACTIVATED"
  | "USER_REINSTATED"
  | "USER_ROLE_CHANGED"
  | "USER_DELETED"
  | "APPEAL_SUBMITTED"
  | "APPEAL_REVIEW_STARTED"
  | "APPEAL_INFORMATION_REQUESTED"
  | "APPEAL_INFORMATION_RESPONDED"
  | "APPEAL_APPROVED"
  | "APPEAL_REJECTED"
  | "SUPPLIER_VERIFICATION_SUBMITTED"
  | "SUPPLIER_REVIEW_STARTED"
  | "SUPPLIER_INFORMATION_REQUESTED"
  | "SUPPLIER_VERIFIED"
  | "SUPPLIER_UNVERIFIED"
  | "SUPPLIER_REJECTED"
  | "SUPPLIER_EXPORT_READY_CHANGED"
  | "SUPPLIER_SUSPENDED"
  | "SUPPLIER_ACTIVATED"
  | "SUPPLIER_LOGO_UPLOADED"
  | "SUPPLIER_EVIDENCE_UPDATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_DELETED"
  | "DOCUMENT_DELETED"
  | "PRODUCT_REQUEST_APPROVED"
  | "PRODUCT_REQUEST_REJECTED"
  | "MASTER_PRODUCT_CREATED"
  | "MASTER_PRODUCT_UPDATED"
  | "MASTER_PRODUCT_ACTIVATED"
  | "MASTER_PRODUCT_DEACTIVATED"
  | "MASTER_PRODUCT_MERGED"
  | "SUPPLIER_OFFERING_CREATED"
  | "SUPPLIER_OFFERING_CREATED_BY_ADMIN"
  | "SUPPLIER_OFFERING_UPDATED"
  | "SUPPLIER_OFFERING_ACTIVATED"
  | "SUPPLIER_OFFERING_DEACTIVATED"
  | "SUPPLIER_OFFERING_APPROVED"
  | "SUPPLIER_OFFERING_REJECTED"
  | "SUPPLIER_OFFERING_FLAGGED"
  | "RFQ_STATUS_CHANGED"
  | "ORDER_CANCELLED"
  | "PO_CONFIRMED"
  | "PO_PROCESSING_STARTED"
  | "PO_SHIPPED"
  | "PO_DELIVERED"
  | "PO_REJECTED";

export type AuditTargetType =
  | "USER"
  | "SUPPLIER"
  | "SELLER_PROFILE"
  | "PRODUCT"
  | "MASTER_PRODUCT"
  | "PRODUCT_REQUEST"
  | "PRODUCT_SUPPLIER"
  | "SUPPLIER_OFFERING"
  | "DOCUMENT"
  | "RFQ"
  | "PURCHASE_ORDER"
  | "ACCOUNT_SUSPENSION"
  | "ACCOUNT_SUSPENSION_APPEAL";

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditKpiSummary {
  totalEvents: number;
  todayEvents: number;
  userGovernanceEvents: number;
  supplierGovernanceEvents: number;
  catalogGovernanceEvents: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface GetAuditLogsParams {
  action?: string;
  adminId?: string;
  targetType?: string;
  targetId?: string;
  from?: string;
  to?: string;
  query?: string;
  page?: number;
  size?: number;
}

export async function getAuditLogs(params: GetAuditLogsParams = {}): Promise<PageResponse<AdminAuditLog>> {
  const query = new URLSearchParams();
  if (params.action) query.set("action", params.action);
  if (params.adminId) query.set("adminId", params.adminId);
  if (params.targetType) query.set("targetType", params.targetType);
  if (params.targetId) query.set("targetId", params.targetId);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.query && params.query.trim()) query.set("query", params.query.trim());
  if (typeof params.page === "number") query.set("page", params.page.toString());
  if (typeof params.size === "number") query.set("size", params.size.toString());

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("kemkendra_token") || localStorage.getItem("token")
      : null;
  const res = await fetch(resolveApiUrl(`/api/v1/admin/audit?${query.toString()}`), {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch audit logs (${res.status})`);
  }

  return res.json();
}

export async function getAuditSummary(): Promise<AuditKpiSummary> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("kemkendra_token") || localStorage.getItem("token")
      : null;
  const res = await fetch(resolveApiUrl("/api/v1/admin/audit/summary"), {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch audit summary (${res.status})`);
  }

  return res.json();
}
