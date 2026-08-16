import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

export type BuyerRfq = {
  id: string;
  buyerId: string;
  productId: string;
  supplierId: number;
  quantity: number;
  unit: string;
  message: string;
  status: string;
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