import { ProductSearchResponse } from "../types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085";

export async function searchProducts(query: string): Promise<ProductSearchResponse> {
  try {
    const url = new URL(`${API_URL}/api/v1/products/search`);
    url.searchParams.append("query", query);

    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      if (process.env.NODE_ENV !== "production" && response.status !== 404) {
        console.warn(`API error searching products: ${response.status}`);
      }
      return { mode: "NONE" };
    }

    return await response.json();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Network error searching products:", error);
    }
    return { mode: "NONE" };
  }
}
