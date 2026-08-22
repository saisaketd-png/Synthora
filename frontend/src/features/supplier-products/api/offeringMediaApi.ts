import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { resolveApiUrl } from "@/lib/apiUrl";
import {
  DocumentResponse,
  getDocuments,
  uploadDocument,
  deleteDocument,
  downloadDocument,
} from "@/features/documents/api/documentApi";

export interface OfferingImageResponse {
  id: string;
  masterProductId?: string;
  supplierOfferingId?: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  isPrimary: boolean;
  displayOrder: number;
  altText?: string | null;
  status: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export type OfferingDocumentCategory =
  | "COA"
  | "MSDS"
  | "TECHNICAL_SPECIFICATION"
  | "CERTIFICATION"
  | "OTHER";

export async function getOfferingImages(offeringId: string): Promise<OfferingImageResponse[]> {
  const res = await authenticatedFetch(`/api/v1/supplier/offerings/${offeringId}/images`);
  if (!res.ok) {
    if (res.status === 403 || res.status === 404) return [];
    throw new Error("Failed to load offering images");
  }
  return res.json();
}

export async function uploadOfferingImage(
  offeringId: string,
  file: File,
  altText?: string
): Promise<OfferingImageResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (altText) formData.append("altText", altText);

  const res = await authenticatedFetch(`/api/v1/supplier/offerings/${offeringId}/images`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let err = "Failed to upload offering image";
    try {
      const data = await res.json();
      err = data.message || data.error || err;
    } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function setPrimaryOfferingImage(
  offeringId: string,
  imageId: string
): Promise<OfferingImageResponse> {
  const res = await authenticatedFetch(
    `/api/v1/supplier/offerings/${offeringId}/images/${imageId}/primary`,
    { method: "PUT" }
  );

  if (!res.ok) {
    let err = "Failed to set primary image";
    try {
      const data = await res.json();
      err = data.message || data.error || err;
    } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function deleteOfferingImage(
  offeringId: string,
  imageId: string
): Promise<void> {
  const res = await authenticatedFetch(
    `/api/v1/supplier/offerings/${offeringId}/images/${imageId}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    let err = "Failed to delete offering image";
    try {
      const data = await res.json();
      err = data.message || data.error || err;
    } catch {}
    throw new Error(err);
  }
}

export async function getOfferingDocuments(offeringId: string): Promise<DocumentResponse[]> {
  return getDocuments("SUPPLIER_OFFERING", offeringId);
}

export async function uploadOfferingDocument(
  offeringId: string,
  category: OfferingDocumentCategory,
  file: File
): Promise<DocumentResponse> {
  return uploadDocument("SUPPLIER_OFFERING", offeringId, category, file);
}

export { deleteDocument as deleteOfferingDocument, downloadDocument as downloadOfferingDocument };
