import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

export type RfqDetail = {
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