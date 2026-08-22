// Generic Spring Data Page response
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ---------------------------------------------------------------------------
// 1. User Administration Types
// ---------------------------------------------------------------------------

export type UserRole = "USER" | "SUPPLIER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED";

export interface AdminUserResponse {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export type AdminUserDetailResponse = AdminUserResponse;

export interface UpdateUserStatusRequest {
  status: UserStatus;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface UserFilterParams {
  page?: number;
  size?: number;
  query?: string;
  role?: UserRole | "";
  status?: UserStatus | "";
  includeDeleted?: boolean;
}

// ---------------------------------------------------------------------------
// 2. Supplier Moderation Types
// ---------------------------------------------------------------------------

export interface AdminSupplierResponse {
  id: number;
  name: string;
  slug: string;
  countryCode?: string | null;
  countryName?: string | null;
  verified: boolean;
  exportReady: boolean;
  yearsInBusiness?: number | null;
  responseRate?: number | null;
  logoUrl?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  userStatus?: UserStatus | null;
  createdAt: string;
}

export interface AdminSellerProfileInfo {
  companyName?: string | null;
  aboutCompany?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  gstNumber?: string | null;
  certifications?: string | null;
  website?: string | null;
}

export interface AdminSupplierDetailResponse extends AdminSupplierResponse {
  sellerProfile?: AdminSellerProfileInfo | null;
}

export interface UpdateSupplierVerificationRequest {
  verified: boolean;
}

export interface UpdateSupplierExportReadyRequest {
  exportReady: boolean;
}

export interface UpdateSupplierStatusRequest {
  status: UserStatus;
}

export interface SupplierFilterParams {
  page?: number;
  size?: number;
  query?: string;
  country?: string;
  verified?: boolean;
  exportReady?: boolean;
  userStatus?: UserStatus | "";
}

// ---------------------------------------------------------------------------
// 3. Transaction Oversight Types (RFQs & Purchase Orders)
// ---------------------------------------------------------------------------

export type RfqStatus =
  | "PENDING"
  | "CONTACTED"
  | "QUOTED"
  | "ACCEPTED"
  | "REJECTED"
  | "CLOSED"
  | "CANCELLED";

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface AdminRfqResponse {
  id: string;
  rfqReference?: string | null;
  buyerId: string;
  buyerName?: string | null;
  buyerEmail?: string | null;
  productId?: string | null;
  masterProductId?: string | null;
  productName?: string | null;
  supplierId: number;
  supplierName?: string | null;
  quantity: number;
  unit: string;
  message?: string | null;
  status: RfqStatus;
  acceptedQuotationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminQuotationSummary {
  id: string;
  quotationVersion: number;
  unitPrice: number;
  currency: string;
  minimumOrderQuantity?: number | null;
  leadTimeDays?: number | null;
  validityDate: string;
  packagingDetails?: string | null;
  commercialNotes?: string | null;
  createdAt: string;
}

export interface AdminRfqDetailResponse extends AdminRfqResponse {
  quotations: AdminQuotationSummary[];
}

export interface UpdateAdminRfqStatusRequest {
  status: "CLOSED" | "CANCELLED";
  reason?: string;
}

export interface RfqFilterParams {
  page?: number;
  size?: number;
  status?: RfqStatus | "";
  buyerId?: string;
  supplierId?: number;
  productId?: string;
  query?: string;
}

export interface AdminShipmentSummary {
  id: string;
  carrier: string;
  trackingNumber: string;
  estimatedDeliveryDate?: string | null;
  shippedAt: string;
}

export interface AdminPurchaseOrderResponse {
  id: string;
  poNumber: string;
  rfqId: string;
  quotationId: string;
  buyerId: string;
  buyerName?: string | null;
  buyerEmail?: string | null;
  supplierId: number;
  supplierName?: string | null;
  productId: string;
  productName?: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  agreedLeadTimeDays?: number | null;
  shippingAddress: string;
  billingContact: string;
  notes?: string | null;
  status: OrderStatus;
  placedAt: string;
  confirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPurchaseOrderDetailResponse extends AdminPurchaseOrderResponse {
  shipment?: AdminShipmentSummary | null;
}

export interface CancelAdminPurchaseOrderRequest {
  reason: string;
}

export interface OrderFilterParams {
  page?: number;
  size?: number;
  status?: OrderStatus | "";
  buyerId?: string;
  supplierId?: number;
  productId?: string;
  poNumber?: string;
  query?: string;
}
