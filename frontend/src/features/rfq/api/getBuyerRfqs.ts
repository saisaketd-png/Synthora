const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085";

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

const DEMO_BUYER_ID = "59efa3ea-3329-43ff-9397-b20a00d6a0d7";

export async function getBuyerRfqs(): Promise<BuyerRfq[]> {
  const response = await fetch(
    `${API_URL}/api/v1/rfqs/buyer/${DEMO_BUYER_ID}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch RFQs");
  }

  return response.json();
}