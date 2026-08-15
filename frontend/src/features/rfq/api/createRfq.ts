import { RfqRequest, RfqResponse } from "../types/rfq";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

export async function createRfq(data: RfqRequest): Promise<RfqResponse> {
  const response = await authenticatedFetch("/api/v1/rfqs", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = "Failed to submit RFQ";

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Ignored
    }

    if (response.status === 400) {
      throw new Error(`Validation Error: ${errorMessage}`);
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(`Unauthorized: ${errorMessage}`);
    }

    if (response.status >= 500) {
      throw new Error(`Server Error: ${errorMessage}`);
    }

    throw new Error(errorMessage);
  }

  return response.json();
}