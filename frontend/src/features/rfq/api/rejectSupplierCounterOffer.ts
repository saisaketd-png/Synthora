import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { QuotationDecisionResponse } from "./acceptQuotation";

export async function rejectSupplierCounterOffer(
  rfqId: string,
  quotationId: string,
  rejectionReason?: string
): Promise<QuotationDecisionResponse> {
  const response = await authenticatedFetch(
    `/api/v1/rfqs/supplier/${rfqId}/quotations/${quotationId}/reject`,
    {
      method: "POST",
      body: JSON.stringify(rejectionReason ? { rejectionReason } : {}),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to reject counter-offer");
  }

  return response.json();
}
