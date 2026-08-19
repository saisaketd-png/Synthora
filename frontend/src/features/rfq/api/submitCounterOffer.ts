import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { QuotationResponse } from "./submitQuotation";

export interface CreateCounterOfferRequest {
  unitPrice: number;
  currency: string;
  minimumOrderQuantity?: number;
  leadTimeDays?: number;
  packagingDetails?: string;
  commercialMessage: string;
}

export async function submitCounterOffer(
  rfqId: string,
  data: CreateCounterOfferRequest
): Promise<QuotationResponse> {
  const response = await authenticatedFetch(`/api/v1/rfqs/${rfqId}/counter-offer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to submit counter offer");
  }

  return response.json();
}
