import { resolveApiUrl } from "@/lib/apiUrl";
import { ProductSearchResponse } from "../types/product";

export async function searchProducts(query: string): Promise<ProductSearchResponse> {
  try {
    const url = resolveApiUrl(`/api/v1/products/search?query=${encodeURIComponent(query)}`);

    const response = await fetch(url, {
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
