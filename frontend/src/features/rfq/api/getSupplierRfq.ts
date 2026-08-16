import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { SupplierRfq } from "./getSupplierRfqs";

export async function getSupplierRfq(id: string): Promise<SupplierRfq> {
  const response = await authenticatedFetch(`/api/v1/rfqs/supplier/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Supplier authentication required");
    }

    if (response.status === 404) {
      throw new Error("RFQ not found");
    }

    throw new Error("Failed to fetch supplier RFQ");
  }

  return response.json();
}
