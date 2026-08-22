import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { resolveApiUrl } from "@/lib/apiUrl";
import {
  SupplierPublicProfile,
  SellerProfile,
  UpdateSellerProfileRequest,
  SupplierDiscoveryResponse,
  SupplierSearchParams,
  SupplierProductListResponse,
  SupplierProductQueryParams,
} from "../types";

export async function getSuppliers(params: SupplierSearchParams): Promise<SupplierDiscoveryResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.country) query.set("country", params.country);
  if (params.verified !== undefined) query.set("verified", String(params.verified));
  if (params.exportReady !== undefined) query.set("exportReady", String(params.exportReady));
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort) query.set("sort", params.sort);

  const targetUrl = resolveApiUrl(`/api/v1/suppliers?${query.toString()}`);

  const res = await fetch(targetUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store", // public discovery should be fresh
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch suppliers: ${res.statusText}`);
  }

  return res.json();
}

export async function getSupplierPublicProfile(id: string | number): Promise<SupplierPublicProfile | null> {
  const targetUrl = resolveApiUrl(`/api/v1/suppliers/${id}`);

  const res = await fetch(targetUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch public supplier: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch a specific supplier's product catalog (public read-only)
 */
export async function getSupplierProducts(
  supplierId: string,
  params?: SupplierProductQueryParams
): Promise<SupplierProductListResponse> {
  const defaultEmpty: SupplierProductListResponse = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: params?.size || 10,
  };

  try {
    const urlParams = new URLSearchParams();

    if (params) {
      if (params.page !== undefined) urlParams.append("page", params.page.toString());
      if (params.size !== undefined) urlParams.append("size", params.size.toString());
      if (params.sort !== undefined) urlParams.append("sort", params.sort);
    }

    const queryString = urlParams.toString();
    const targetUrl = resolveApiUrl(
      `/api/v1/suppliers/${supplierId}/products${queryString ? `?${queryString}` : ""}`
    );

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return defaultEmpty;
    }

    return res.json();
  } catch {
    return defaultEmpty;
  }
}

export async function getMySellerProfile(): Promise<SellerProfile | null> {
  const res = await authenticatedFetch("/api/v1/sellers/me", {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch seller profile: ${res.statusText}`);
  }

  return res.json();
}

export async function updateMySellerProfile(
  request: UpdateSellerProfileRequest
): Promise<SellerProfile> {
  const res = await authenticatedFetch("/api/v1/sellers/me", {
    method: "PUT",
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error(`Failed to update seller profile: ${res.statusText}`);
  }

  return res.json();
}
