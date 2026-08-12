import { Product } from "../types/product";

export function getUniqueCategories(products: Product[]): string[] {
  if (!products || products.length === 0) return [];
  const categories = products
    .map((p) => p.category)
    .filter((c): c is string => typeof c === "string" && c.trim().length > 0);
  return Array.from(new Set(categories)).sort();
}

export function getUniqueCountries(products: Product[]): string[] {
  if (!products || products.length === 0) return [];
  const countries = products
    .map((p) => p.supplier?.countryName || p.country)
    .filter((c): c is string => typeof c === "string" && c.trim().length > 0);
  return Array.from(new Set(countries)).sort();
}
