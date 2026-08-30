"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { MasterProductSearchStep } from "@/features/supplier-products/components/MasterProductSearchStep";
import { SupplierOfferingForm } from "@/features/supplier-products/components/SupplierOfferingForm";
import { ProductRequestForm } from "@/features/supplier-products/components/ProductRequestForm";
import {
  MasterProduct,
  CreateSupplierOfferingPayload,
  CreateProductRequestPayload,
  createSupplierOffering,
  createProductRequest,
} from "@/features/supplier-products/api/masterCatalogApi";
import {
  uploadOfferingImage,
  uploadOfferingDocument,
  OfferingDocumentCategory,
} from "@/features/supplier-products/api/offeringMediaApi";

type WizardStep = "SEARCH" | "ADD_OFFERING" | "REQUEST_CHEMICAL";

export default function CreateProductPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("SEARCH");
  const [selectedMasterProduct, setSelectedMasterProduct] = useState<MasterProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSelectMasterProduct = (mp: MasterProduct) => {
    setSelectedMasterProduct(mp);
    setStep("ADD_OFFERING");
  };

  const handleCreateOffering = async (
    payload: CreateSupplierOfferingPayload,
    stagedImages: File[],
    stagedDocuments: { file: File; category: OfferingDocumentCategory }[]
  ) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setWarningMessage(null);

      // 1. Create the offering entity
      const offering = await createSupplierOffering(payload);

      // 2. Upload staged images
      const failedImages: string[] = [];
      for (const img of stagedImages) {
        try {
          await uploadOfferingImage(offering.id, img);
        } catch (err: any) {
          failedImages.push(img.name);
        }
      }

      // 3. Upload staged documents
      const failedDocs: string[] = [];
      for (const doc of stagedDocuments) {
        try {
          await uploadOfferingDocument(offering.id, doc.category, doc.file);
        } catch (err: any) {
          failedDocs.push(doc.file.name);
        }
      }

      if (failedImages.length > 0 || failedDocs.length > 0) {
        const issues = [
          ...failedImages.map((n) => `Image "${n}"`),
          ...failedDocs.map((n) => `Document "${n}"`),
        ].join(", ");
        setWarningMessage(
          `Offering created successfully, but some files could not be uploaded (${issues}). You can re-upload them from the offering edit page.`
        );
        setTimeout(() => {
          router.push(`/dashboard/supplier/products/${offering.id}`);
          router.refresh();
        }, 3000);
      } else {
        setSuccessMessage("Offering and media successfully added to your catalog!");
        setTimeout(() => {
          router.push("/dashboard/supplier/products");
          router.refresh();
        }, 1200);
      }
    } catch (err: any) {
      if (err.message && err.message.includes("already have an offering")) {
        setError(
          "An offering for this product already exists in your catalog. You can edit your existing offering from your inventory."
        );
      } else {
        setError(err.message || "Failed to create offering. Please try again.");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProductRequest = async (payload: CreateProductRequestPayload) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await createProductRequest(payload);
      setSuccessMessage("Chemical request submitted! KemKendra Verification Team will review your request.");
      setTimeout(() => {
        router.push("/dashboard/supplier/products");
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to submit request. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <Link
          href="/dashboard/supplier/products"
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Supplier Catalog
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Add Chemical to Catalog</h1>
        <p className="text-xs text-slate-500 mt-1">
          Search KemKendra Master Catalog to attach a commercial offering, upload media/documents, or propose a new chemical compound.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-900 text-xs font-bold shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>{successMessage}</div>
        </div>
      )}

      {warningMessage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-900 text-xs font-bold shadow-sm">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>{warningMessage}</div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-800 text-xs font-medium shadow-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {step === "SEARCH" && (
        <MasterProductSearchStep
          onSelectMasterProduct={handleSelectMasterProduct}
          onRequestNewChemical={() => setStep("REQUEST_CHEMICAL")}
        />
      )}

      {step === "ADD_OFFERING" && selectedMasterProduct && (
        <SupplierOfferingForm
          masterProduct={selectedMasterProduct}
          onSubmit={handleCreateOffering}
          onBack={() => setStep("SEARCH")}
          isLoading={isSubmitting}
        />
      )}

      {step === "REQUEST_CHEMICAL" && (
        <ProductRequestForm
          onSubmit={handleCreateProductRequest}
          onCancel={() => setStep("SEARCH")}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
