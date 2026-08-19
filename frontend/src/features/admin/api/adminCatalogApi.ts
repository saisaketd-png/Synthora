import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { ProductRequest, MasterProduct } from "@/features/supplier-products/api/masterCatalogApi";

export interface GovernanceStats {
  activeMasterProducts: number;
  draftMasterProducts?: number;
  pendingRequests: number;
  pendingProductRequests?: number;
  approvedRequests: number;
  rejectedRequests: number;
  potentialDuplicates: number;
  duplicateCandidatesCount?: number;
  totalOfferings: number;
  pendingSupplierVerifications?: number;
  verifiedSuppliersCount?: number;
  flaggedOfferingsCount?: number;
}

export interface DuplicateCandidate {
  masterProductIdA: string;
  codeA: string;
  nameA: string;
  casA: string | null;
  formulaA: string | null;
  masterProductIdB: string;
  codeB: string;
  nameB: string;
  casB: string | null;
  formulaB: string | null;
  confidenceLevel: string;
  reason: string;
}

export interface ApproveRequestPayload {
  canonicalName: string;
  casNumber?: string;
  molecularFormula?: string;
  category: string;
  description?: string;
}

export interface ApproveAndLinkPayload {
  existingMasterProductId: string;
  adminNotes?: string;
}

export interface RequestProductInfoPayload {
  adminNotes: string;
}

export interface RespondProductInfoPayload {
  supplierResponseNotes: string;
  correctedName?: string;
  correctedCas?: string;
  correctedFormula?: string;
}

export interface CreateMasterProductPayload {
  name: string;
  casNumber?: string;
  molecularFormula?: string;
  category: string;
  description?: string;
  status?: string;
}

export interface UpdateMasterProductPayload {
  name?: string;
  casNumber?: string;
  molecularFormula?: string;
  category?: string;
  description?: string;
  status?: string;
  updateReason?: string;
}

export interface MergePayload {
  sourceMasterProductId: string;
  targetMasterProductId: string;
  adminNotes?: string;
}

export interface AdminCatalogSearchParams {
  query?: string;
  casNumber?: string;
  masterProductCode?: string;
  category?: string;
  status?: string;
  supplierId?: number;
  supplierVerified?: boolean;
  verifiedSupplier?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export type AdminMasterProductSearchCriteria = AdminCatalogSearchParams;

export async function searchAdminMasterProducts(params: AdminCatalogSearchParams = {}): Promise<PageResponse<MasterProduct>> {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.append("query", params.query);
  if (params.casNumber) searchParams.append("casNumber", params.casNumber);
  if (params.masterProductCode) searchParams.append("masterProductCode", params.masterProductCode);
  if (params.category) searchParams.append("category", params.category);
  if (params.status) searchParams.append("status", params.status);
  if (params.supplierId) searchParams.append("supplierId", params.supplierId.toString());
  if (params.supplierVerified !== undefined) searchParams.append("supplierVerified", params.supplierVerified.toString());
  if (params.page !== undefined) searchParams.append("page", params.page.toString());
  if (params.size !== undefined) searchParams.append("size", params.size.toString());
  if (params.sort) searchParams.append("sort", params.sort);

  const res = await authenticatedFetch(`/api/v1/admin/catalog/master-products?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to search admin catalog");
  return res.json();
}

export const getAdminMasterProducts = searchAdminMasterProducts;

export async function createMasterProduct(payload: CreateMasterProductPayload): Promise<MasterProduct> {
  const res = await authenticatedFetch("/api/v1/admin/catalog/master-products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let err = "Failed to create Master Product";
    try { err = (await res.json()).message || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function updateMasterProduct(id: string, payload: UpdateMasterProductPayload): Promise<MasterProduct> {
  const res = await authenticatedFetch(`/api/v1/admin/catalog/master-products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let err = "Failed to update Master Product";
    try { err = (await res.json()).message || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function getGovernanceStats(): Promise<GovernanceStats> {
  const res = await authenticatedFetch("/api/v1/admin/catalog/governance-stats");
  if (!res.ok) throw new Error("Failed to load governance stats");
  return res.json();
}

export async function getAdminProductRequests(status: string = "PENDING_REVIEW"): Promise<ProductRequest[]> {
  const params = new URLSearchParams({ status });
  const res = await authenticatedFetch(`/api/v1/admin/catalog/requests?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load product requests");
  const data = await res.json();
  return data.content || [];
}

export async function approveProductRequest(id: string, payload: ApproveRequestPayload): Promise<MasterProduct> {
  const res = await authenticatedFetch(`/api/v1/admin/catalog/requests/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let err = "Failed to approve request";
    try { err = (await res.json()).message || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function approveAndLinkProductRequest(id: string, payload: ApproveAndLinkPayload): Promise<MasterProduct> {
  const res = await authenticatedFetch(`/api/v1/admin/catalog/requests/${id}/approve-and-link`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let err = "Failed to approve and link request";
    try { err = (await res.json()).message || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function requestProductInfo(id: string, payload: RequestProductInfoPayload): Promise<ProductRequest> {
  const res = await authenticatedFetch(`/api/v1/admin/catalog/requests/${id}/request-info`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let err = "Failed to request information";
    try { err = (await res.json()).message || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function rejectProductRequest(id: string, rejectionReason: string): Promise<ProductRequest> {
  const res = await authenticatedFetch(`/api/v1/admin/catalog/requests/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ rejectionReason }),
  });
  if (!res.ok) {
    let err = "Failed to reject request";
    try { err = (await res.json()).message || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function getDuplicateCandidates(): Promise<DuplicateCandidate[]> {
  const res = await authenticatedFetch("/api/v1/admin/catalog/duplicates");
  if (!res.ok) throw new Error("Failed to load duplicate candidates");
  return res.json();
}

export async function mergeMasterProducts(payload: MergePayload): Promise<MasterProduct> {
  const res = await authenticatedFetch("/api/v1/admin/catalog/merge", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let err = "Failed to merge master products";
    try { err = (await res.json()).message || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function setMasterProductStatus(id: string, status: string): Promise<MasterProduct> {
  const params = new URLSearchParams({ status });
  const res = await authenticatedFetch(`/api/v1/admin/catalog/master-products/${id}/status?${params.toString()}`, {
    method: "PUT",
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

export async function getMasterProductDetail(id: string): Promise<any> {
  const res = await authenticatedFetch(`/api/v1/admin/catalog/master-products/${id}`);
  if (!res.ok) throw new Error("Failed to load master product details");
  return res.json();
}

export async function verifyChemicalField(id: string, payload: { fieldName: string; status: string; notes?: string }): Promise<MasterProduct> {
  const res = await authenticatedFetch(`/api/v1/admin/catalog/master-products/${id}/verify`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to verify chemical field");
  return res.json();
}

export async function getAdminOfferings(params: { query?: string; flagged?: boolean; page?: number; size?: number } = {}): Promise<PageResponse<any>> {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.append("query", params.query);
  if (params.flagged !== undefined) searchParams.append("flagged", params.flagged.toString());
  if (params.page !== undefined) searchParams.append("page", params.page.toString());
  if (params.size !== undefined) searchParams.append("size", params.size.toString());

  const res = await authenticatedFetch(`/api/v1/admin/catalog/offerings?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to load supplier offerings");
  return res.json();
}

export async function flagSupplierOffering(id: string, payload: { reason: string; flagged: boolean }): Promise<any> {
  const res = await authenticatedFetch(`/api/v1/admin/catalog/offerings/${id}/flag`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to flag supplier offering");
  return res.json();
}

export async function getAdminOfferingById(id: string): Promise<any> {
  const res = await authenticatedFetch(`/api/v1/admin/catalog/offerings/${id}`);
  if (!res.ok) throw new Error("Failed to load supplier offering detail");
  return res.json();
}

export async function approveOffering(id: string, notes?: string): Promise<any> {
  const params = notes ? `?notes=${encodeURIComponent(notes)}` : "";
  const res = await authenticatedFetch(`/api/v1/admin/catalog/offerings/${id}/approve${params}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to approve supplier offering");
  return res.json();
}

export async function rejectOffering(id: string, notes?: string): Promise<any> {
  const params = notes ? `?notes=${encodeURIComponent(notes)}` : "";
  const res = await authenticatedFetch(`/api/v1/admin/catalog/offerings/${id}/reject${params}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to reject supplier offering");
  return res.json();
}

export async function requestInfoOffering(id: string, notes?: string): Promise<any> {
  const params = notes ? `?notes=${encodeURIComponent(notes)}` : "";
  const res = await authenticatedFetch(`/api/v1/admin/catalog/offerings/${id}/request-info${params}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to request info for offering");
  return res.json();
}

export async function suspendOffering(id: string, notes?: string): Promise<any> {
  const params = notes ? `?notes=${encodeURIComponent(notes)}` : "";
  const res = await authenticatedFetch(`/api/v1/admin/catalog/offerings/${id}/suspend${params}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to suspend supplier offering");
  return res.json();
}

export async function getGlobalAuditLogs(params: { entityType?: string; page?: number; size?: number } = {}): Promise<PageResponse<any>> {
  const searchParams = new URLSearchParams();
  if (params.entityType) searchParams.append("entityType", params.entityType);
  if (params.page !== undefined) searchParams.append("page", params.page.toString());
  if (params.size !== undefined) searchParams.append("size", params.size.toString());

  const res = await authenticatedFetch(`/api/v1/admin/catalog/audit?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to load audit logs");
  return res.json();
}
