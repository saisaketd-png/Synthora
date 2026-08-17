import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { PurchaseOrderResponse } from "./createOrder";

export async function confirmOrder(orderId: string): Promise<PurchaseOrderResponse> {
  const response = await authenticatedFetch(`/api/v1/orders/supplier/${orderId}/confirm`, {
    method: "POST",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to confirm purchase order");
  }

  return response.json();
}
