import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { QuotationDecisionResponse } from "./acceptQuotation";

export async function acceptSupplierCounterOffer(
  rfqId: string,
  quotationId: string,
  decisionNotes?: string
): Promise<QuotationDecisionResponse> {
  const response = await authenticatedFetch(
    `/api/v1/rfqs/supplier/${rfqId}/quotations/${quotationId}/accept`,
    {
      method: "POST",
      body: JSON.stringify(decisionNotes ? { decisionNotes } : {}),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to accept counter-offer");
  }

  return response.json();
}
