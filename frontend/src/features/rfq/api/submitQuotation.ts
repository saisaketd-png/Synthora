import { authenticatedFetch } from '@/features/auth/api/authenticatedFetch';

export interface CreateQuotationRequest {
  unitPrice: number;
  currency: string;
  minimumOrderQuantity?: number;
  leadTimeDays?: number;
  validityDate: string;
  packagingDetails?: string;
  commercialNotes?: string;
}

export interface QuotationResponse {
  id: string;
  rfqId: string;
  quotationVersion: number;
  unitPrice: number;
  currency: string;
  minimumOrderQuantity: number | null;
  leadTimeDays: number | null;
  validityDate: string;
  packagingDetails: string | null;
  commercialNotes: string | null;
  actorType?: string | null;
  actionType?: string | null;
  commercialMessage?: string | null;
  createdAt: string;
}

export async function submitQuotation(rfqId: string, data: CreateQuotationRequest): Promise<QuotationResponse> {
  const response = await authenticatedFetch(`/api/v1/rfqs/supplier/${rfqId}/quotations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to submit quotation');
  }

  return response.json();
}
