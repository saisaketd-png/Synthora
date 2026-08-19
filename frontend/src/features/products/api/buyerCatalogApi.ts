import { MasterProduct, SupplierOffering } from "@/features/supplier-products/api/masterCatalogApi";

export interface PublicMasterProductPage {
  content: MasterProduct[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface MasterCatalogFilters {
  query?: string;
  category?: string;
  minPurity?: number;
  maxPurity?: number;
  currency?: string;
  maxPrice?: number;
  minMoq?: number;
  maxMoq?: number;
  maxLeadTime?: number;
  availabilityStatus?: string;
  minStock?: number;
  coaAvailable?: boolean;
  msdsAvailable?: boolean;
  exportReady?: boolean;
  verifiedSupplier?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export async function searchPublicMasterProducts(
  filters: MasterCatalogFilters = {}
): Promise<PublicMasterProductPage> {
  const params = new URLSearchParams();
  if (filters.query) params.append("query", filters.query);
  if (filters.category) params.append("category", filters.category);
  if (filters.minPurity !== undefined) params.append("minPurity", filters.minPurity.toString());
  if (filters.maxPurity !== undefined) params.append("maxPurity", filters.maxPurity.toString());
  if (filters.currency) params.append("currency", filters.currency);
  if (filters.maxPrice !== undefined) params.append("maxPrice", filters.maxPrice.toString());
  if (filters.minMoq !== undefined) params.append("minMoq", filters.minMoq.toString());
  if (filters.maxMoq !== undefined) params.append("maxMoq", filters.maxMoq.toString());
  if (filters.maxLeadTime !== undefined) params.append("maxLeadTime", filters.maxLeadTime.toString());
  if (filters.availabilityStatus) params.append("availabilityStatus", filters.availabilityStatus);
  if (filters.minStock !== undefined) params.append("minStock", filters.minStock.toString());
  if (filters.coaAvailable) params.append("coaAvailable", "true");
  if (filters.msdsAvailable) params.append("msdsAvailable", "true");
  if (filters.exportReady) params.append("exportReady", "true");
  if (filters.verifiedSupplier) params.append("verifiedSupplier", "true");
  params.append("page", (filters.page || 0).toString());
  params.append("size", (filters.size || 20).toString());
  if (filters.sort) params.append("sort", filters.sort);

  const res = await fetch(`/api/v1/public/master-products?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load catalog products");
  return res.json();
}

export async function getPublicMasterProductDetail(idOrCode: string): Promise<MasterProduct> {
  const res = await fetch(`/api/v1/public/master-products/${idOrCode}`);
  if (!res.ok) throw new Error("Failed to load chemical details");
  return res.json();
}

export async function getPublicMasterProductOfferings(masterProductId: string): Promise<SupplierOffering[]> {
  const res = await fetch(`/api/v1/public/master-products/${masterProductId}/offerings`);
  if (!res.ok) throw new Error("Failed to load supplier offerings");
  return res.json();
}
