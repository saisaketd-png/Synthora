import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

export interface QuotationDecisionResponse {
  rfqId: string;
  quotationId: string;
  quotationVersion: number;
  rfqStatus: string;
  decision: "ACCEPTED" | "REJECTED";
  decisionTimestamp: string;
}

export async function acceptQuotation(
  rfqId: string,
  quotationId: string,
  decisionNotes?: string
): Promise<QuotationDecisionResponse> {
  const response = await authenticatedFetch(
    `/api/v1/rfqs/${rfqId}/quotations/${quotationId}/accept`,
    {
      method: "POST",
      body: JSON.stringify(decisionNotes ? { decisionNotes } : {}),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to accept quotation");
  }

  return response.json();
}
