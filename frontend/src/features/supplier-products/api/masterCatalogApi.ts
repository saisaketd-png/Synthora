import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { resolveApiUrl } from "@/lib/apiUrl";

export interface ProductSynonym {
  id: string;
  masterProductId: string;
  synonym: string;
  source: "OFFICIAL" | "SUPPLIER";
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdById?: string | null;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MasterProduct {
  id: string;
  masterProductCode: string;
  name: string;
  casNumber: string | null;
  molecularFormula: string | null;
  category: string;
  description: string | null;
  status: string;
  offeringCount: number;
  synonyms?: ProductSynonym[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierOffering {
  id: string;
  masterProductId: string;
  masterProductCode: string;
  masterProductName: string;
  casNumber?: string | null;
  molecularFormula?: string | null;
  category?: string | null;
  supplierId: number;
  supplierName: string;
  price: number;
  currency: string;
  stock: number;
  purity: number | null;
  grade: string | null;
  moqKg: number | null;
  packaging: string | null;
  leadTimeDays: number | null;
  coaAvailable: boolean;
  msdsAvailable: boolean;
  exportReady: boolean;
  availabilityStatus: string;
  moderationStatus?: string;
  moderationNotes?: string | null;
  masterProductStatus?: string | null;
  supplierLogoUrl?: string | null;
  supplierVerified?: boolean;
  createdByRole?: string | null;
  createdByAdminId?: string | null;
  createdByAdminName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierOfferingPayload {
  masterProductId: string;
  price: number;
  currency?: string;
  stock: number;
  purity?: number | null;
  grade?: string | null;
  moqKg?: number | null;
  packaging?: string | null;
  leadTimeDays?: number | null;
  coaAvailable?: boolean;
  msdsAvailable?: boolean;
  exportReady?: boolean;
  availabilityStatus?: string;
}

export interface UpdateSupplierOfferingPayload {
  price?: number;
  currency?: string;
  stock?: number;
  purity?: number | null;
  grade?: string | null;
  moqKg?: number | null;
  packaging?: string | null;
  leadTimeDays?: number | null;
  coaAvailable?: boolean;
  msdsAvailable?: boolean;
  exportReady?: boolean;
  availabilityStatus?: string;
}

export interface ProductRequest {
  id: string;
  supplierId: number;
  supplierName: string;
  proposedName: string;
  casNumber: string | null;
  molecularFormula: string | null;
  category: string;
  description: string | null;
  supplierMessage: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequestPayload {
  proposedName: string;
  casNumber?: string;
  molecularFormula?: string;
  category: string;
  description?: string;
  supplierMessage?: string;
}

export async function searchMasterProducts(query: string = ""): Promise<MasterProduct[]> {
  const params = new URLSearchParams();
  if (query && query.trim()) params.append("query", query.trim());
  const res = await authenticatedFetch(`/api/v1/master-products?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to search master products");
  const data = await res.json();
  if (Array.isArray(data)) return data;
  return data.content || [];
}

export async function getMasterProduct(idOrCode: string): Promise<MasterProduct> {
  const res = await fetch(resolveApiUrl(`/api/v1/master-products/${encodeURIComponent(idOrCode)}`));
  if (!res.ok) throw new Error("Failed to load master product");
  return res.json();
}

export async function createSupplierOffering(payload: CreateSupplierOfferingPayload): Promise<SupplierOffering> {
  const res = await authenticatedFetch("/api/v1/supplier/offerings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let err = "Failed to create supplier offering";
    try { err = (await res.json()).message || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function getMySupplierOfferings(): Promise<SupplierOffering[]> {
  const res = await authenticatedFetch("/api/v1/supplier/offerings");
  if (!res.ok) throw new Error("Failed to load supplier offerings");
  return res.json();
}

export async function getSupplierOffering(id: string): Promise<SupplierOffering> {
  const res = await authenticatedFetch(`/api/v1/supplier/offerings/${id}`);
  if (!res.ok) {
    let err = "Failed to load supplier offering";
    try { err = (await res.json()).message || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function updateSupplierOffering(id: string, payload: UpdateSupplierOfferingPayload): Promise<SupplierOffering> {
  const res = await authenticatedFetch(`/api/v1/supplier/offerings/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let err = "Failed to update supplier offering";
    try { err = (await res.json()).message || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function deactivateSupplierOffering(id: string): Promise<SupplierOffering> {
  const res = await authenticatedFetch(`/api/v1/supplier/offerings/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    let err = "Failed to deactivate supplier offering";
    try { err = (await res.json()).message || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function createProductRequest(payload: CreateProductRequestPayload): Promise<ProductRequest> {
  const res = await authenticatedFetch("/api/v1/product-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let err = "Failed to submit chemical request";
    try { err = (await res.json()).message || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function getMyProductRequests(): Promise<ProductRequest[]> {
  const res = await authenticatedFetch("/api/v1/supplier/product-requests");
  if (!res.ok) throw new Error("Failed to load chemical requests");
  return res.json();
}

export async function getMasterProductSynonyms(idOrCode: string): Promise<ProductSynonym[]> {
  const res = await fetch(resolveApiUrl(`/api/v1/master-products/${encodeURIComponent(idOrCode)}/synonyms`));
  if (!res.ok) throw new Error("Failed to load master product synonyms");
  return res.json();
}

export async function suggestSupplierSynonym(idOrCode: string, synonym: string): Promise<ProductSynonym> {
  const res = await authenticatedFetch(`/api/v1/master-products/${idOrCode}/synonyms`, {
    method: "POST",
    body: JSON.stringify({ synonym }),
  });
  if (!res.ok) {
    let err = "Failed to suggest synonym";
    try { err = (await res.json()).message || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}
