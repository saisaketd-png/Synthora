import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

export interface DocumentResponse {
  id: string;
  ownerType: string;
  ownerId: string;
  category: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

export async function getProductDocuments(productId: string): Promise<DocumentResponse[]> {
  const res = await authenticatedFetch(`/api/v1/documents?ownerType=PRODUCT&ownerId=${productId}`);
  if (!res.ok) {
    if (res.status === 403) return []; // Graceful fallback if not authorized to list
    throw new Error("Failed to load documents");
  }
  return res.json();
}

export async function uploadProductDocument(
  productId: string, 
  category: string, 
  file: File
): Promise<DocumentResponse> {
  const formData = new FormData();
  formData.append("ownerType", "PRODUCT");
  formData.append("ownerId", productId);
  formData.append("category", category);
  formData.append("file", file);

  const res = await authenticatedFetch(`/api/v1/documents`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let err = "Failed to upload document";
    try { err = (await res.json()).error || err; } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function deleteProductDocument(documentId: string): Promise<void> {
  const res = await authenticatedFetch(`/api/v1/documents/${documentId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    let err = "Failed to delete document";
    try { err = (await res.json()).error || err; } catch {}
    throw new Error(err);
  }
}

export async function downloadProductDocument(documentId: string, filename: string): Promise<void> {
  const res = await authenticatedFetch(`/api/v1/documents/${documentId}/download`);
  if (!res.ok) {
    let err = "Failed to download document";
    try { err = (await res.json()).error || err; } catch {}
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
