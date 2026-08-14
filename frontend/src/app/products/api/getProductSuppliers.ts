const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085";

export async function getProductSuppliers(productId: string) {
  const response = await fetch(
    `${API_URL}/api/v1/products/${productId}/suppliers`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    return [];
  }

  return response.json();
}