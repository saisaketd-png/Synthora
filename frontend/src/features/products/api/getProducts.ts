import { ProductPage, ProductQueryParams } from "../types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085";

/**
 * API Contract for GET /api/v1/products
 * 
 * Fetches a paginated list of products from the marketplace.
 * 
 * @param {Object} params - Query parameters for server-driven filtering, sorting, and pagination.
 * @param {number} [params.page=0] - The page number to fetch (0-indexed).
 * @param {number} [params.size=20] - Number of items per page.
 * @param {string} [params.search] - Full-text search query against product name or CAS number.
 * @param {string} [params.category] - Filter by exact ProductCategory enum.
 * @param {string} [params.country] - Filter by ISO country code of the supplier.
 * @param {boolean} [params.verified] - If true, only return products from verified suppliers (GMP/ISO).
 * @param {string} [params.sort] - Sort format "field,direction" (e.g., "createdAt,desc" or "price,asc").
 * 
 * @returns {Promise<ProductPage>} A page object containing the content array and pagination metadata.
 */
export async function getProducts(params: ProductQueryParams = {}): Promise<ProductPage> {
  const url = new URL(`${API_URL}/api/v1/products`);
  
  if (params.page !== undefined) url.searchParams.append("page", params.page.toString());
  if (params.size !== undefined) url.searchParams.append("size", params.size.toString());
  if (params.search) url.searchParams.append("search", params.search);
  if (params.category) url.searchParams.append("category", params.category);
  if (params.country) url.searchParams.append("country", params.country);
  if (params.verified !== undefined) url.searchParams.append("verified", params.verified.toString());
  if (params.sort) url.searchParams.append("sort", params.sort);

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("API error fetching products:", response.status, text);
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  return response.json();
}