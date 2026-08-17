import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { PurchaseOrderResponse } from "./createOrder";

export async function getOrderByRfqId(rfqId: string): Promise<PurchaseOrderResponse | null> {
  try {
    const response = await authenticatedFetch(`/api/v1/orders/rfq/${rfqId}`, {
      method: "GET",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}
