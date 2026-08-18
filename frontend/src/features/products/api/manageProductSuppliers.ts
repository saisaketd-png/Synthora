import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

/**
 * Supplier-specific commercial offering for a product.
 * Supplier identity is derived server-side — never sent from the client.
 */
export interface ProductSupplierOfferingRequest {
  purity?: string;
  grade?: string;
  moqKg?: number;
  packaging?: string;
  leadTimeDays?: number;
  coaAvailable?: boolean;
  msdsAvailable?: boolean;
}

export interface ProductSupplierManageResponse {
  id: number;
  productId: string;
  productName: string;
  purity: string | null;
  grade: string | null;
  moqKg: number | null;
  packaging: string | null;
  leadTimeDays: number | null;
  coaAvailable: boolean | null;
  msdsAvailable: boolean | null;
  createdAt: string;
}

/**
 * Creates the authenticated supplier's commercial offering for the given product.
 * Returns 409 if the supplier already has an offering for this product.
 */
export async function createProductSupplierOffering(
  productId: string,
  request: ProductSupplierOfferingRequest
): Promise<ProductSupplierManageResponse> {
  const res = await authenticatedFetch(
    `/api/v1/products/${productId}/supplier-offering`,
    {
      method: "POST",
      body: JSON.stringify(request),
    }
  );

  if (res.status === 409) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "You already have an offering for this product.");
  }
  if (res.status === 404) {
    throw new Error("Product not found.");
  }
  if (!res.ok) {
    let err = "Failed to create offering";
    try { err = (await res.json()).error || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

/**
 * Retrieves the authenticated supplier's offering for the given product.
 * Returns null if no offering exists (404).
 */
export async function getMyProductSupplierOffering(
  productId: string
): Promise<ProductSupplierManageResponse | null> {
  const res = await authenticatedFetch(
    `/api/v1/products/${productId}/supplier-offering`
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    let err = "Failed to load offering";
    try { err = (await res.json()).error || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

/**
 * Updates the authenticated supplier's offering for the given product.
 * Only provided fields are applied — others are left unchanged.
 */
export async function updateProductSupplierOffering(
  productId: string,
  request: ProductSupplierOfferingRequest
): Promise<ProductSupplierManageResponse> {
  const res = await authenticatedFetch(
    `/api/v1/products/${productId}/supplier-offering`,
    {
      method: "PUT",
      body: JSON.stringify(request),
    }
  );

  if (res.status === 404) throw new Error("Offering not found.");
  if (!res.ok) {
    let err = "Failed to update offering";
    try { err = (await res.json()).error || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

/**
 * Deletes the authenticated supplier's offering for the given product.
 */
export async function deleteProductSupplierOffering(
  productId: string
): Promise<void> {
  const res = await authenticatedFetch(
    `/api/v1/products/${productId}/supplier-offering`,
    { method: "DELETE" }
  );

  if (res.status === 404) throw new Error("Offering not found.");
  if (!res.ok) {
    let err = "Failed to remove offering";
    try { err = (await res.json()).error || err; } catch {}
    throw new Error(err);
  }
}

/**
 * Returns all offerings the authenticated supplier has across all products.
 */
export async function getMyProductSupplierOfferings(): Promise<
  ProductSupplierManageResponse[]
> {
  const res = await authenticatedFetch("/api/v1/suppliers/me/product-offerings");
  if (!res.ok) {
    let err = "Failed to load your offerings";
    try { err = (await res.json()).error || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}
