import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { ProductImage } from "../types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const res = await fetch(`${API_URL}/api/v1/products/${productId}/images`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Failed to load product images: ${res.statusText}`);
  }

  return res.json();
}

export async function uploadProductImage(productId: string, file: File): Promise<ProductImage> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await authenticatedFetch(`/api/v1/products/${productId}/images`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errorMessage = `Upload failed: ${res.statusText}`;
    try {
      const errData = await res.json();
      errorMessage = errData.error || errData.message || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function setPrimaryProductImage(productId: string, imageId: string): Promise<ProductImage> {
  const res = await authenticatedFetch(`/api/v1/products/${productId}/images/${imageId}/primary`, {
    method: "PUT",
  });

  if (!res.ok) {
    let errorMessage = `Failed to set primary image: ${res.statusText}`;
    try {
      const errData = await res.json();
      errorMessage = errData.error || errData.message || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  const res = await authenticatedFetch(`/api/v1/products/${productId}/images/${imageId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    let errorMessage = `Failed to delete product image: ${res.statusText}`;
    try {
      const errData = await res.json();
      errorMessage = errData.error || errData.message || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }
}
