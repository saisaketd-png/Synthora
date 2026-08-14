export type ProductCategory =
  | "API"
  | "INTERMEDIATE"
  | "SOLVENT"
  | "SPECIALTY_CHEMICAL"
  | "FINE_CHEMICAL"
  | "AGROCHEMICAL"
  | string;

export interface SupplierSummary {
  id: string;
  name: string;
  countryCode?: string;
  countryName?: string;
  verified?: boolean;
  verificationLevel?: string;
  responseRate?: number;
}

export interface Product {
  id: string;
  slug?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  createdAt: string;
  updatedAt: string;
  
  // Extended Domain Model fields
  casNumber?: string;
  molecularFormula?: string;
  subcategory?: string;
  purity?: string;
  grade?: string;
  packaging?: string;
  moq?: string;
  moqKg?: number;
  availability?: string;
  availabilityStatus?: string;
  leadTime?: string;
  leadTimeDays?: number;
  exportReady?: boolean;
  coaAvailable?: boolean;
  msdsAvailable?: boolean;
  
  // Legacy flat fields (falling back if needed)
  sellerId?: string;
  sellerName?: string;
  country?: string; // Kept for legacy fallback
  verificationStatus?: string; // Kept for legacy fallback

  // Nested Supplier
  supplier?: SupplierSummary;
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
  purityMin?: string;
  purityMax?: string;
  availability?: string;
  sort?: string;
}

export interface ProductSearchSupplier {
  id: string;
  name: string;
  countryCode?: string;
  countryName?: string;
  verified?: boolean;
  verificationLevel?: string;
  yearsInBusiness?: number;
  responseRate?: number;
  purity?: string;
  grade?: string;
  packaging?: string;
  moq?: string;
  leadTime?: string;
  exportReady?: boolean;
  coaAvailable?: boolean;
  msdsAvailable?: boolean;
}

export interface ProductSearchResponse {
  mode: "EXACT" | "MULTIPLE" | "NONE";
  product?: Product;
  products?: Product[];
  suppliers?: ProductSearchSupplier[];
}