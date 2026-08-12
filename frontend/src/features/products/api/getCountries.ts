const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085";

export async function getCountries(): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/api/v1/countries`, {
      cache: "no-store",
    });

    if (!response.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.error(`API error fetching countries: ${response.status}`);
      }
      return [];
    }

    return await response.json();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Network error fetching countries:", error);
    }
    return [];
  }
}
