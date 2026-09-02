import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

export type DocumentExpiryStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "NO_EXPIRY";

export interface DocumentResponse {
  id: string;
  documentGroupId?: string;
  ownerType: string;
  ownerId: string;
  category: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  documentNumber?: string;
  issuingAuthority?: string;
  issueDate?: string;
  expiryDate?: string;
  version?: number;
  checksum?: string;
  description?: string;
  isActive?: boolean;
  expiryStatus?: DocumentExpiryStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface UploadDocumentParams {
  ownerType: string;
  ownerId: string;
  category: string;
  file: File;
  documentGroupId?: string;
  documentNumber?: string;
  issuingAuthority?: string;
  issueDate?: string;
  expiryDate?: string;
  description?: string;
}

export async function getDocuments(
  ownerType: string,
  ownerId: string,
  includeHistory: boolean = false
): Promise<DocumentResponse[]> {
  const res = await authenticatedFetch(
    `/api/v1/documents?ownerType=${encodeURIComponent(ownerType)}&ownerId=${encodeURIComponent(ownerId)}&includeHistory=${includeHistory}`
  );
  if (!res.ok) {
    if (res.status === 403 || res.status === 404) return [];
    throw new Error("Failed to load documents");
  }
  return res.json();
}

export async function getDocumentVersions(documentGroupId: string): Promise<DocumentResponse[]> {
  const res = await authenticatedFetch(`/api/v1/documents/groups/${encodeURIComponent(documentGroupId)}/versions`);
  if (!res.ok) {
    if (res.status === 403 || res.status === 404) return [];
    throw new Error("Failed to load document version history");
  }
  return res.json();
}

export async function uploadDocument(
  paramsOrOwnerType: UploadDocumentParams | string,
  ownerId?: string,
  category?: string,
  file?: File
): Promise<DocumentResponse> {
  const formData = new FormData();

  if (typeof paramsOrOwnerType === "string") {
    formData.append("ownerType", paramsOrOwnerType);
    if (ownerId) formData.append("ownerId", ownerId);
    if (category) formData.append("category", category);
    if (file) formData.append("file", file);
  } else {
    const params = paramsOrOwnerType;
    formData.append("ownerType", params.ownerType);
    formData.append("ownerId", params.ownerId);
    formData.append("category", params.category);
    formData.append("file", params.file);

    if (params.documentGroupId) {
      formData.append("documentGroupId", params.documentGroupId);
    }
    if (params.documentNumber) {
      formData.append("documentNumber", params.documentNumber);
    }
    if (params.issuingAuthority) {
      formData.append("issuingAuthority", params.issuingAuthority);
    }
    if (params.issueDate) {
      formData.append("issueDate", params.issueDate);
    }
    if (params.expiryDate) {
      formData.append("expiryDate", params.expiryDate);
    }
    if (params.description) {
      formData.append("description", params.description);
    }
  }

  const res = await authenticatedFetch(`/api/v1/documents`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let err = "Failed to upload document";
    try {
      const data = await res.json();
      err = data.error || data.message || err;
    } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function deactivateDocument(documentId: string): Promise<DocumentResponse> {
  const res = await authenticatedFetch(`/api/v1/documents/${encodeURIComponent(documentId)}/deactivate`, {
    method: "PATCH",
  });
  if (!res.ok) {
    let err = "Failed to deactivate document";
    try {
      const data = await res.json();
      err = data.error || data.message || err;
    } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function deleteDocument(documentId: string): Promise<void> {
  const res = await authenticatedFetch(`/api/v1/documents/${encodeURIComponent(documentId)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    let err = "Failed to delete document";
    try {
      const data = await res.json();
      err = data.error || data.message || err;
    } catch {}
    throw new Error(err);
  }
}

export async function downloadDocument(documentId: string, filename: string): Promise<void> {
  const res = await authenticatedFetch(`/api/v1/documents/${encodeURIComponent(documentId)}/download`);
  if (!res.ok) {
    let err = "Failed to download document";
    try {
      const data = await res.json();
      err = data.error || data.message || err;
    } catch {}
    throw new Error(err);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
