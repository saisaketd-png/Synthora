const API_BASE = "http://localhost:8085";

export async function fetchProductDetail(id: string) {
  const res = await fetch(`${API_BASE}/api/v1/products/${id}/detail`);
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json();
}

export async function fetchProductSuppliers(id: string) {
  const res = await fetch(`${API_BASE}/api/v1/products/${id}/suppliers`);
  if (!res.ok) throw new Error("Failed to fetch suppliers");
  return res.json();
}