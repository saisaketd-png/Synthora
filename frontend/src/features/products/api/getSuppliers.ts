import { SupplierSummary } from "../types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085";

export async function getSuppliers(): Promise<SupplierSummary[]> {
  try {
    const response = await fetch(`${API_URL}/api/v1/suppliers`, {
      cache: "no-store",
    });

    if (!response.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.error(`API error fetching suppliers: ${response.status}`);
      }
      return [];
    }

    // Assuming it returns an array or paginated object, handle it gracefully:
    const data = await response.json();
    return Array.isArray(data) ? data : (data.content || []);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Network error fetching suppliers:", error);
    }
    return [];
  }
}
