import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

export type SupplierRfq = {
  id: string;
  rfqReference?: string;
  sourcingRequestId?: string;
  sourcingRequestReference?: string;
  buyerId: string;
  buyerName?: string;
  productId?: string | null;
  masterProductId?: string | null;
  supplierOfferingId?: string | null;
  productName?: string | null;
  supplierId: number;
  supplierName?: string | null;
  quantity: number;
  unit: string;
  message?: string | null;
  status: string;
  expiresAt?: string | null;
  createdAt: string;
};

export async function getSupplierRfqs(): Promise<SupplierRfq[]> {
  const response = await authenticatedFetch("/api/v1/rfqs/supplier", {
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Supplier authentication required");
    }

    throw new Error("Failed to fetch supplier RFQs");
  }

  return response.json();
}