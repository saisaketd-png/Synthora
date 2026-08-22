import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import {
  AdminUserResponse,
  AdminUserDetailResponse,
  UpdateUserStatusRequest,
  UpdateUserRoleRequest,
  UserFilterParams,
  AdminSupplierResponse,
  AdminSupplierDetailResponse,
  UpdateSupplierVerificationRequest,
  UpdateSupplierExportReadyRequest,
  UpdateSupplierStatusRequest,
  SupplierFilterParams,
  AdminRfqResponse,
  AdminRfqDetailResponse,
  UpdateAdminRfqStatusRequest,
  RfqFilterParams,
  AdminPurchaseOrderResponse,
  AdminPurchaseOrderDetailResponse,
  CancelAdminPurchaseOrderRequest,
  OrderFilterParams,
  PaginatedResponse,
} from "../types";

async function parseResponse<T>(res: Response, fallbackError: string): Promise<T> {
  if (!res.ok) {
    let errorMessage = `${fallbackError} (HTTP ${res.status})`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // Ignore non-JSON error bodies
    }
    if (process.env.NODE_ENV !== "production") {
      console.error(`[adminApi] Request failed with HTTP ${res.status}:`, errorMessage);
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// 1. User Administration API Client
// ---------------------------------------------------------------------------

export async function getAdminUsers(
  params: UserFilterParams = {}
): Promise<PaginatedResponse<AdminUserResponse>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.query) query.set("query", params.query);
  if (params.role) query.set("role", params.role);
  if (params.status) query.set("status", params.status);
  if (params.includeDeleted !== undefined)
    query.set("includeDeleted", String(params.includeDeleted));

  const res = await authenticatedFetch(`/api/v1/admin/users?${query.toString()}`);
  return parseResponse<PaginatedResponse<AdminUserResponse>>(res, "Failed to fetch users");
}

export async function getAdminUser(id: string): Promise<AdminUserDetailResponse> {
  const res = await authenticatedFetch(`/api/v1/admin/users/${id}`);
  return parseResponse<AdminUserDetailResponse>(res, "Failed to fetch user details");
}

export async function updateAdminUserStatus(
  id: string,
  data: UpdateUserStatusRequest
): Promise<AdminUserResponse> {
  const res = await authenticatedFetch(`/api/v1/admin/users/${id}/status`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return parseResponse<AdminUserResponse>(res, "Failed to update user status");
}

export async function updateAdminUserRole(
  id: string,
  data: UpdateUserRoleRequest
): Promise<AdminUserResponse> {
  const res = await authenticatedFetch(`/api/v1/admin/users/${id}/role`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return parseResponse<AdminUserResponse>(res, "Failed to update user role");
}

export async function deleteAdminUser(id: string): Promise<void> {
  const res = await authenticatedFetch(`/api/v1/admin/users/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    let errorMessage = "Failed to delete user";
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // Ignore non-JSON error
    }
    throw new Error(errorMessage);
  }
}

// ---------------------------------------------------------------------------
// 2. Supplier Moderation API Client
// ---------------------------------------------------------------------------

export async function getAdminSuppliers(
  params: SupplierFilterParams = {}
): Promise<PaginatedResponse<AdminSupplierResponse>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.query) query.set("query", params.query);
  if (params.country) query.set("country", params.country);
  if (params.verified !== undefined) query.set("verified", String(params.verified));
  if (params.exportReady !== undefined) query.set("exportReady", String(params.exportReady));
  if (params.userStatus) query.set("userStatus", params.userStatus);

  const res = await authenticatedFetch(`/api/v1/admin/suppliers?${query.toString()}`);
  return parseResponse<PaginatedResponse<AdminSupplierResponse>>(res, "Failed to fetch suppliers");
}

export async function getAdminSupplier(id: number | string): Promise<AdminSupplierDetailResponse> {
  const res = await authenticatedFetch(`/api/v1/admin/suppliers/${id}`);
  return parseResponse<AdminSupplierDetailResponse>(res, "Failed to fetch supplier details");
}

export async function updateAdminSupplierVerification(
  id: number | string,
  data: UpdateSupplierVerificationRequest
): Promise<AdminSupplierResponse> {
  const res = await authenticatedFetch(`/api/v1/admin/suppliers/${id}/verification`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return parseResponse<AdminSupplierResponse>(res, "Failed to update supplier verification");
}

export async function updateAdminSupplierExportReady(
  id: number | string,
  data: UpdateSupplierExportReadyRequest
): Promise<AdminSupplierResponse> {
  const res = await authenticatedFetch(`/api/v1/admin/suppliers/${id}/export-ready`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return parseResponse<AdminSupplierResponse>(res, "Failed to update export readiness");
}

export async function updateAdminSupplierStatus(
  id: number | string,
  data: UpdateSupplierStatusRequest
): Promise<AdminSupplierResponse> {
  const res = await authenticatedFetch(`/api/v1/admin/suppliers/${id}/status`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return parseResponse<AdminSupplierResponse>(res, "Failed to update supplier account status");
}

// ---------------------------------------------------------------------------
// 3. Transaction Oversight API Client (RFQs & Purchase Orders)
// ---------------------------------------------------------------------------

export async function getAdminRfqs(
  params: RfqFilterParams = {}
): Promise<PaginatedResponse<AdminRfqResponse>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.status) query.set("status", params.status);
  if (params.buyerId) query.set("buyerId", params.buyerId);
  if (params.supplierId !== undefined) query.set("supplierId", String(params.supplierId));
  if (params.productId) query.set("productId", params.productId);
  if (params.query) query.set("query", params.query);

  const res = await authenticatedFetch(`/api/v1/admin/transactions/rfqs?${query.toString()}`);
  return parseResponse<PaginatedResponse<AdminRfqResponse>>(res, "Failed to fetch RFQs");
}

export async function getAdminRfq(id: string): Promise<AdminRfqDetailResponse> {
  const res = await authenticatedFetch(`/api/v1/admin/transactions/rfqs/${id}`);
  return parseResponse<AdminRfqDetailResponse>(res, "Failed to fetch RFQ details");
}

export async function updateAdminRfqStatus(
  id: string,
  data: UpdateAdminRfqStatusRequest
): Promise<AdminRfqResponse> {
  const res = await authenticatedFetch(`/api/v1/admin/transactions/rfqs/${id}/status`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return parseResponse<AdminRfqResponse>(res, "Failed to update RFQ status");
}

export async function getAdminOrders(
  params: OrderFilterParams = {}
): Promise<PaginatedResponse<AdminPurchaseOrderResponse>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.status) query.set("status", params.status);
  if (params.buyerId) query.set("buyerId", params.buyerId);
  if (params.supplierId !== undefined) query.set("supplierId", String(params.supplierId));
  if (params.productId) query.set("productId", params.productId);
  if (params.poNumber) query.set("poNumber", params.poNumber);
  if (params.query) query.set("query", params.query);

  const res = await authenticatedFetch(`/api/v1/admin/transactions/orders?${query.toString()}`);
  return parseResponse<PaginatedResponse<AdminPurchaseOrderResponse>>(
    res,
    "Failed to fetch purchase orders"
  );
}

export async function getAdminOrder(id: string): Promise<AdminPurchaseOrderDetailResponse> {
  const res = await authenticatedFetch(`/api/v1/admin/transactions/orders/${id}`);
  return parseResponse<AdminPurchaseOrderDetailResponse>(
    res,
    "Failed to fetch purchase order details"
  );
}

export async function cancelAdminOrder(
  id: string,
  data: CancelAdminPurchaseOrderRequest
): Promise<AdminPurchaseOrderResponse> {
  const res = await authenticatedFetch(`/api/v1/admin/transactions/orders/${id}/cancel`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return parseResponse<AdminPurchaseOrderResponse>(res, "Failed to cancel purchase order");
}
