import { resolveApiUrl } from "@/lib/apiUrl";
import { ProductPage, ProductQueryParams } from "../types/product";

/**
 * API Client for GET /api/v1/public/master-products
 * Primary source for the public Chemical Catalog (/products).
 */
export async function getProducts(params: ProductQueryParams = {}): Promise<ProductPage> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.append("page", params.page.toString());
  if (params.size !== undefined) searchParams.append("size", params.size.toString());
  if (params.search) searchParams.append("query", params.search);
  if (params.category && params.category !== "ALL") searchParams.append("category", params.category);
  if (params.casNumber) searchParams.append("casNumber", params.casNumber);
  if (params.purityMin) searchParams.append("minPurity", params.purityMin);
  if (params.purityMax) searchParams.append("maxPurity", params.purityMax);
  if (params.grade) searchParams.append("grade", params.grade);
  if (params.currency) searchParams.append("currency", params.currency);
  if (params.maxPrice) searchParams.append("maxPrice", params.maxPrice);
  if (params.moqMin) searchParams.append("minMoq", params.moqMin);
  if (params.moqMax) searchParams.append("maxMoq", params.moqMax);
  if (params.maxLeadTime) searchParams.append("maxLeadTime", params.maxLeadTime);
  if (params.inStock || (params.minStock && Number(params.minStock) > 0)) {
    searchParams.append("minStock", params.minStock || "1");
  }
  if (params.verified) searchParams.append("verifiedSupplier", "true");
  if (params.coa) searchParams.append("coaAvailable", "true");
  if (params.msds) searchParams.append("msdsAvailable", "true");
  if (params.exportReady) searchParams.append("exportReady", "true");
  if (params.availability) searchParams.append("availabilityStatus", params.availability);
  if (params.sort) searchParams.append("sort", params.sort);

  const queryStr = searchParams.toString();
  const url = resolveApiUrl(`/api/v1/public/master-products${queryStr ? `?${queryStr}` : ""}`);

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.error(`API error fetching master products: ${response.status}`);
      }
      return { content: [], totalElements: 0, totalPages: 0, number: 0, size: params.size || 20 };
    }

    const data = await response.json();
    
    // Map MasterProductResponse items to Product structure for UI consumption
    const content = (data.content || []).map((mp: any) => ({
      id: mp.id,
      productCode: mp.masterProductCode,
      slug: mp.masterProductCode,
      name: mp.name,
      description: mp.description || "",
      category: mp.category,
      casNumber: mp.casNumber,
      molecularFormula: mp.molecularFormula,
      status: mp.status,
      offeringCount: mp.offeringCount || 0,
      primaryImageUrl: mp.primaryImageUrl || null,
      price: mp.minPrice || 0,
      stock: mp.offeringCount > 0 ? 100 : 0,
      createdAt: mp.createdAt,
      updatedAt: mp.updatedAt,
      availabilityStatus: mp.offeringCount > 0 ? "AVAILABLE" : "ONBOARDING",
    }));

    return {
      content,
      totalElements: data.totalElements || 0,
      totalPages: data.totalPages || 0,
      number: data.number || 0,
      size: data.size || (params.size || 20),
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Network error fetching master products:", error);
    }
    return { content: [], totalElements: 0, totalPages: 0, number: 0, size: params.size || 20 };
  }
}