import { ProductPage } from "../types/product";

export async function getProducts(): Promise<ProductPage> {
  const response = await fetch(
    "http://127.0.0.1:8085/api/v1/products",
    {
      cache: "no-store",
    }
  );

  console.log("Status:", response.status);

  if (!response.ok) {
    const text = await response.text();
    console.error("API error:", text);
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  return response.json();
}