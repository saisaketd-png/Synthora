import { ProductPage, ProductQueryParams } from "../types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085";

/**
 * API Client for GET /api/v1/public/master-products
 * Primary source for the public Chemical Catalog (/products).
 */
export async function getProducts(params: ProductQueryParams = {}): Promise<ProductPage> {
  const url = new URL(`${API_URL}/api/v1/public/master-products`);

  if (params.page !== undefined) url.searchParams.append("page", params.page.toString());
  if (params.size !== undefined) url.searchParams.append("size", params.size.toString());
  if (params.search) url.searchParams.append("query", params.search);
  if (params.category) url.searchParams.append("category", params.category);
  if (params.casNumber) url.searchParams.append("casNumber", params.casNumber);
  if (params.verified !== undefined) url.searchParams.append("verifiedSupplier", params.verified.toString());
  if (params.purityMin) url.searchParams.append("minPurity", params.purityMin);
  if (params.purityMax) url.searchParams.append("maxPurity", params.purityMax);
  if (params.moqMin) url.searchParams.append("minMoq", params.moqMin);
  if (params.moqMax) url.searchParams.append("maxMoq", params.moqMax);
  if (params.inStock) url.searchParams.append("minStock", "1");
  if (params.coa !== undefined) url.searchParams.append("coaAvailable", params.coa.toString());
  if (params.msds !== undefined) url.searchParams.append("msdsAvailable", params.msds.toString());
  if (params.exportReady !== undefined) url.searchParams.append("exportReady", params.exportReady.toString());
  if (params.availability) url.searchParams.append("availabilityStatus", params.availability);
  if (params.sort) url.searchParams.append("sort", params.sort);

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
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