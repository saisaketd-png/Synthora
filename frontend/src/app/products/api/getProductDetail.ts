const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085";

export async function getProductDetail(id: string) {
  const response = await fetch(
    `${API_URL}/api/v1/products/${id}/detail`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}