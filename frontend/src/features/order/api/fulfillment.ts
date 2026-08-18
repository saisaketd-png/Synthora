import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { PurchaseOrderResponse } from "./createOrder";

export interface ShipOrderRequest {
  carrier: string;
  trackingNumber: string;
  estimatedDeliveryDate?: string;
}

export interface ShipmentResponse {
  id: string;
  carrier: string;
  trackingNumber: string;
  estimatedDeliveryDate: string | null;
  shippedAt: string;
}

export async function startProcessingSupplierOrder(orderId: string): Promise<PurchaseOrderResponse> {
  const response = await authenticatedFetch(`/api/v1/orders/supplier/${orderId}/process`, {
    method: "POST",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to start processing order");
  }

  return response.json();
}

export async function shipSupplierOrder(orderId: string, data: ShipOrderRequest): Promise<PurchaseOrderResponse> {
  const response = await authenticatedFetch(`/api/v1/orders/supplier/${orderId}/ship`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to ship order");
  }

  return response.json();
}

export async function getShipment(orderId: string): Promise<ShipmentResponse> {
  const response = await authenticatedFetch(`/api/v1/orders/${orderId}/shipment`, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to load shipment information");
  }

  return response.json();
}

export async function markOrderDeliveredSupplier(orderId: string): Promise<PurchaseOrderResponse> {
  const response = await authenticatedFetch(`/api/v1/orders/${orderId}/deliver`, {
    method: "POST",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to mark order as delivered");
  }

  return response.json();
}
