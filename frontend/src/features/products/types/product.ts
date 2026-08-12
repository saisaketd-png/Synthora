export type ProductCategory =
  | "API"
  | "INTERMEDIATE"
  | "SOLVENT"
  | "SPECIALTY_CHEMICAL"
  | "FINE_CHEMICAL"
  | "AGROCHEMICAL"
  | string;

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  createdAt: string;
  updatedAt: string;
  sellerId: string;
  sellerName: string;
  // Optional enterprise fields for graceful degradation
  casNumber?: string;
  moq?: string;
  country?: string;
  purity?: string;
  verificationStatus?: string; // e.g. "GMP Certified", "ISO 9001"
  availability?: string; // e.g. "In Stock", "Made to Order"
}

export interface ProductPage {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ProductQueryParams {
  page?: number;
  size?: number;
  search?: string;
  category?: string;
  country?: string;
  verified?: boolean;
  sort?: string;
}