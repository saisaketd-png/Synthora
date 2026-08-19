import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { QuotationResponse } from "./submitQuotation";

/**
 * Supplier-facing: fetch all quotation revisions for a given RFQ.
 * Returns revisions in descending version order (latest first).
 */
export async function getSupplierQuotations(rfqId: string): Promise<QuotationResponse[]> {
  const response = await authenticatedFetch(`/api/v1/rfqs/supplier/${rfqId}/quotations`, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to load supplier quotations");
  }

  return response.json();
}
