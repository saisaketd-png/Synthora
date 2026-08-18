import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

export interface PurchaseOrderResponse {
  id: string;
  poNumber: string;
  rfqId: string;
  quotationId: string;
  buyerId: string;
  supplierId: number;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  agreedLeadTimeDays: number | null;
  shippingAddress: string;
  billingContact: string;
  notes: string | null;
  status: "PLACED" | "CONFIRMED" | "CANCELLED" | "PROCESSING" | "SHIPPED" | "DELIVERED";
  placedAt: string;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderRequest {
  rfqId: string;
  shippingAddress: string;
  billingContact: string;
  notes?: string;
}

export async function createOrder(
  data: CreatePurchaseOrderRequest
): Promise<PurchaseOrderResponse> {
  const response = await authenticatedFetch("/api/v1/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to create purchase order");
  }

  return response.json();
}
