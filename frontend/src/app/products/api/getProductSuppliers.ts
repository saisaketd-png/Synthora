import { resolveApiUrl } from "@/lib/apiUrl";

export async function getProductSuppliers(productId: string) {
  const targetUrl = resolveApiUrl(`/api/v1/products/${productId}/suppliers`);
  const response = await fetch(targetUrl, {
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}