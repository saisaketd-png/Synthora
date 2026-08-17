import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

export type SupplierRfq = {
  id: string;
  rfqReference?: string;
  buyerId: string;
  buyerName?: string;
  productId: string;
  productName?: string;
  supplierId: number;
  supplierName?: string;
  quantity: number;
  unit: string;
  message: string;
  status: string;
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