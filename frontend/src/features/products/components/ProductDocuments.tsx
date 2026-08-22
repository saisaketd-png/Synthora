"use client";

import { GenericDocumentManager } from "@/features/documents/components/GenericDocumentManager";

interface ProductDocumentsProps {
  productId: string;
  isSeller?: boolean;
}

const ALLOWED_CATEGORIES = [
  { value: "TECHNICAL_SPECIFICATION", label: "Technical Specification (TDS)" },
  { value: "COA", label: "Certificate of Analysis (COA)" },
  { value: "MSDS", label: "Material Safety Data Sheet (MSDS)" },
  { value: "CERTIFICATION", label: "Quality / GMP Certification" },
];

export function ProductDocuments({ productId, isSeller = false }: ProductDocumentsProps) {
  return (
    <GenericDocumentManager
      title="Canonical Technical Documentation"
      description="Official chemical monographs, technical data sheets, and verified compound specifications."
      ownerType="MASTER_PRODUCT"
      ownerId={productId}
      canUpload={isSeller}
      canDelete={isSeller}
      allowedCategories={ALLOWED_CATEGORIES}
      emptyMessage="No canonical documentation currently attached to this Master Chemical monograph. Individual batch COAs, purity test records, and MSDS safety sheets are provided directly by verified suppliers in the marketplace section below."
    />
  );
}
