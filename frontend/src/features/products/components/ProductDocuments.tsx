"use client";

import { GenericDocumentManager } from "@/features/documents/components/GenericDocumentManager";

interface ProductDocumentsProps {
  productId: string;
  isSeller?: boolean;
}

const ALLOWED_CATEGORIES = [
  { value: "COA", label: "Certificate of Analysis (COA)" },
  { value: "MSDS", label: "Material Safety Data Sheet (MSDS)" },
  { value: "TECHNICAL_SPECIFICATION", label: "Technical Specification" },
  { value: "CERTIFICATION", label: "Quality Certification" },
];

export function ProductDocuments({ productId, isSeller = false }: ProductDocumentsProps) {
  return (
    <GenericDocumentManager
      title="Product Documents"
      description="Technical specifications, COAs, and safety data sheets."
      ownerType="PRODUCT"
      ownerId={productId}
      canUpload={isSeller}
      canDelete={isSeller}
      allowedCategories={ALLOWED_CATEGORIES}
      emptyMessage="No documents available for this product."
    />
  );
}
