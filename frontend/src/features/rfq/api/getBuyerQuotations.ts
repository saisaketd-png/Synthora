import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { QuotationResponse } from "./submitQuotation";

export async function getBuyerQuotations(rfqId: string): Promise<QuotationResponse[]> {
  const response = await authenticatedFetch(`/api/v1/rfqs/${rfqId}/quotations`, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to load quotations");
  }

  return response.json();
}
