import { resolveApiUrl } from "@/lib/apiUrl";

export async function getProductDetail(id: string) {
  const targetUrl = resolveApiUrl(`/api/v1/products/${id}/detail`);
  const response = await fetch(targetUrl, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}