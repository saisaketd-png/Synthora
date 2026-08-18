import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { ProductPage, Product, CreateProductRequest, UpdateProductRequest } from "../types/product";

export async function getMyProducts(
  page: number = 0,
  size: number = 20,
  sortField: string = "createdAt",
  sortDir: string = "desc"
): Promise<ProductPage> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sortField,
  });

  const res = await authenticatedFetch(`/api/v1/products/my?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load products");
  return res.json();
}

export async function getProductDetail(id: string): Promise<Product> {
  const res = await authenticatedFetch(`/api/v1/products/${id}/detail`);
  if (!res.ok) throw new Error("Failed to load product details");
  return res.json();
}

export async function createProduct(payload: CreateProductRequest): Promise<Product> {
  const res = await authenticatedFetch(`/api/v1/products`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let err = "Failed to create product";
    try { err = (await res.json()).message || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function updateProduct(id: string, payload: UpdateProductRequest): Promise<Product> {
  const res = await authenticatedFetch(`/api/v1/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let err = "Failed to update product";
    try { err = (await res.json()).message || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await authenticatedFetch(`/api/v1/products/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    let err = "Failed to delete product";
    try { err = (await res.json()).message || err; } catch {}
    throw new Error(err);
  }
}
