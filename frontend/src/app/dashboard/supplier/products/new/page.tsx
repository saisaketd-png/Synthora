"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle, CheckCircle2 } from "lucide-react";
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

type WizardStep = "SEARCH" | "ADD_OFFERING" | "REQUEST_CHEMICAL";

export default function CreateProductPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("SEARCH");
  const [selectedMasterProduct, setSelectedMasterProduct] = useState<MasterProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSelectMasterProduct = (mp: MasterProduct) => {
    setSelectedMasterProduct(mp);
    setStep("ADD_OFFERING");
  };

  const handleCreateOffering = async (payload: CreateSupplierOfferingPayload) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await createSupplierOffering(payload);
      setSuccessMessage("Offering successfully added to your catalog!");
      setTimeout(() => {
        router.push("/dashboard/supplier/products");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      if (err.message && err.message.includes("already have an offering")) {
        setError("An offering for this product already exists in your catalog. You can edit your existing offering from your inventory.");
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
      setSuccessMessage("Chemical request submitted! Synthora Verification Team will review your request.");
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
          Search Synthora Master Catalog to attach a commercial offering, or propose a new chemical compound.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-900 text-xs font-bold shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>{successMessage}</div>
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
