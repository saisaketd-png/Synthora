import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

export type BuyerRfq = {
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

export async function getBuyerRfqs(): Promise<BuyerRfq[]> {
  const response = await authenticatedFetch("/api/v1/rfqs/my", {
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Authentication required");
    }

    throw new Error("Failed to fetch RFQs");
  }

  return response.json();
}