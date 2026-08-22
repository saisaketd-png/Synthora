import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

export type RfqDetail = {
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

export async function getRfq(id: string): Promise<RfqDetail> {
  const response = await authenticatedFetch(`/api/v1/rfqs/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Authentication required");
    }

    if (response.status === 404) {
      throw new Error("RFQ not found");
    }

    throw new Error("Failed to fetch RFQ");
  }

  return response.json();
}