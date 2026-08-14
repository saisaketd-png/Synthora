import { ProductPage, ProductQueryParams } from "../types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085";

/**
 * API Contract for GET /api/v1/products
 */
export async function getProducts(params: ProductQueryParams = {}): Promise<ProductPage> {
  const url = new URL(`${API_URL}/api/v1/products`);
  
  if (params.page !== undefined) url.searchParams.append("page", params.page.toString());
  if (params.size !== undefined) url.searchParams.append("size", params.size.toString());
  if (params.search) url.searchParams.append("keyword", params.search);
  if (params.category) url.searchParams.append("category", params.category);
  if (params.country) url.searchParams.append("country", params.country);
  if (params.verified !== undefined) url.searchParams.append("verified", params.verified.toString());
  if (params.purityMin) url.searchParams.append("purityMin", params.purityMin);
  if (params.purityMax) url.searchParams.append("purityMax", params.purityMax);
  if (params.availability) url.searchParams.append("availability", params.availability);
  if (params.sort) {
    // Expected format: "price,asc" or "createdAt,desc"
    const [sortField, sortDir] = params.sort.split(",");
    if (sortField) url.searchParams.append("sortField", sortField);
    if (sortDir) url.searchParams.append("sortDir", sortDir);
  }

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.error(`API error fetching products: ${response.status}`);
      }
      return { content: [], totalElements: 0, totalPages: 0, number: 0, size: params.size || 20 };
    }

    return await response.json();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Network error fetching products:", error);
    }
    return { content: [], totalElements: 0, totalPages: 0, number: 0, size: params.size || 20 };
  }
}