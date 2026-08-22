import { resolveApiUrl } from "@/lib/apiUrl";

export async function getCountries(): Promise<string[]> {
  try {
    const response = await fetch(resolveApiUrl("/api/v1/countries"), {
      cache: "no-store",
    });

    if (!response.ok) {
      if (process.env.NODE_ENV !== "production" && response.status !== 404) {
        console.warn(`API error fetching countries: ${response.status}`);
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
