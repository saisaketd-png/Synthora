import { resolveApiUrl } from "@/lib/apiUrl";

export async function getSuppliers(): Promise<string[]> {
  try {
    const response = await fetch(resolveApiUrl("/api/v1/suppliers"), {
      cache: "no-store",
    });

    if (!response.ok) {
      if (process.env.NODE_ENV !== "production" && response.status !== 404) {
        console.warn(`API error fetching suppliers list: ${response.status}`);
      }
      return [];
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map((s: any) => s.name || s.companyName).filter(Boolean);
    }
    if (data.content && Array.isArray(data.content)) {
      return data.content.map((s: any) => s.name || s.companyName).filter(Boolean);
    }
    return [];
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Network error fetching suppliers list:", error);
    }
    return [];
  }
}
