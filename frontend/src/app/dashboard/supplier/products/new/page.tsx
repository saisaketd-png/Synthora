"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle } from "lucide-react";
import { ProductForm } from "@/features/products/components/ProductForm";
import { createProduct } from "@/features/products/api/manageProducts";
import { CreateProductRequest } from "@/features/products/types/product";

export default function CreateProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateProductRequest | any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await createProduct(data as CreateProductRequest);
      router.push("/dashboard/supplier/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create product. Please try again.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <Link 
          href="/dashboard/supplier/products" 
          className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Register
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Add New Product</h1>
        <p className="text-sm text-slate-500 mt-1">
          Create a new product listing in your supplier catalog.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      <ProductForm
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        submitLabel="Create Product"
      />
    </div>
  );
}
