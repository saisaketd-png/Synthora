export interface RfqRequest {
  buyerId: string;
  productId: string;
  supplierId: number;
  quantity: number;
  unit: string;
  message?: string;
}

export interface RfqResponse extends RfqRequest {
  id: string;
  status: string;
  createdAt: string;
}
