const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085";

export async function getCategories(): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/api/v1/categories`, {
      cache: "no-store",
    });

    if (!response.ok) {
      if (process.env.NODE_ENV !== "production" && response.status !== 404) {
        console.warn(`API error fetching categories: ${response.status}`);
      }
      return [];
    }

    return await response.json();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Network error fetching categories:", error);
    }
    return [];
  }
}
