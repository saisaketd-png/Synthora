export interface SupplierPublicProfile {
  id: number;
  name: string;
  slug: string;
  countryCode: string | null;
  countryName: string;
  logoUrl: string | null;
  verified: boolean;
  yearsInBusiness: number;
  responseRate: number;
  exportReady: boolean;
  aboutCompany: string | null;
  website: string | null;
  certifications: string | null;
}

export interface SellerProfile {
  id: string; // UUID
  companyName: string;
  gstNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  certifications: string | null;
  aboutCompany: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSellerProfileRequest {
  companyName: string;
  gstNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  website?: string | null;
  certifications?: string | null;
  aboutCompany?: string | null;
}

export interface SupplierProductPublicResponse {
    id: string;
    name: string;
    description: string | null;
    category: string;
    casNumber: string | null;
    molecularFormula: string | null;
    purity: number | null;
    grade: string | null;
    moqKg: number | null;
    packaging: string | null;
    leadTimeDays: number | null;
    availabilityStatus: string | null;
    exportReady: boolean;
}

export interface SupplierProductListResponse {
    content: SupplierProductPublicResponse[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface SupplierProductQueryParams {
    page?: number;
    size?: number;
    sort?: string;
}

export interface SupplierDiscoveryResponse {
  content: SupplierPublicProfile[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

export interface SupplierSearchParams {
  search?: string;
  country?: string;
  verified?: boolean;
  exportReady?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
