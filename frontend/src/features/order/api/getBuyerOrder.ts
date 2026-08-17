import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { PurchaseOrderResponse } from "./createOrder";

export async function getBuyerOrder(orderId: string): Promise<PurchaseOrderResponse> {
  const response = await authenticatedFetch(`/api/v1/orders/${orderId}`, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to load purchase order");
  }

  return response.json();
}
