"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle } from "lucide-react";
import { ProductForm } from "@/features/products/components/ProductForm";
import { ProductDocuments } from "@/features/products/components/ProductDocuments";
import { ProductSupplierPanel } from "@/features/products/components/ProductSupplierPanel";
import { ProductImageManager } from "@/features/products/components/ProductImageManager";
import { updateProduct, getProductDetail } from "@/features/products/api/manageProducts";
import { Product, UpdateProductRequest } from "@/features/products/types/product";
import { getAuthUser } from "@/features/auth/api/auth";


export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    try {
      setIsLoading(true);
      setAccessError(null);
      const data = await getProductDetail(params.id);
      setProduct(data);
    } catch (err: any) {
      if (err.message?.includes("404")) {
        setAccessError("Product not found.");
      } else {
        setAccessError("Failed to load product details.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleSubmit = async (data: UpdateProductRequest | any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await updateProduct(params.id, data as UpdateProductRequest);
      router.push("/dashboard/supplier/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update product. Please try again.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (accessError) {
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
          <div className="p-8 text-center bg-white rounded-xl border border-rose-200">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
            <p className="text-slate-900 font-bold mb-2">ACCESS DENIED</p>
            <p className="text-sm text-slate-500">{accessError}</p>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Edit Product</h1>
          {product?.productCode && (
            <span className="px-3 py-1 bg-slate-900 text-teal-300 font-mono text-xs font-bold rounded-md shadow-xs">
              CODE: {product.productCode}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Update specifications and commercial terms for {product?.name}.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {/* 01. PRODUCT SPECIFICATIONS FORM */}
      {product && (
        <ProductForm
          initialData={{
            name: product.name,
            description: product.description,
            category: product.category as any,
            casNumber: product.casNumber,
            molecularFormula: product.molecularFormula,
            purity: product.purity ? Number(product.purity) : undefined,
            grade: product.grade,
            packaging: product.packaging,
            moqKg: product.moqKg ? Number(product.moqKg) : undefined,
            price: product.price ? Number(product.price) : undefined,
            stock: product.stock ? Number(product.stock) : undefined,
            leadTimeDays: product.leadTimeDays ? Number(product.leadTimeDays) : undefined,
            availabilityStatus: product.availabilityStatus,
            coaAvailable: product.coaAvailable,
            msdsAvailable: product.msdsAvailable,
            exportReady: product.exportReady,
          }}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          submitLabel="Save Changes"
        />
      )}

      {/* 02. PRODUCT IMAGES */}
      {product && (
        <ProductImageManager productId={params.id} />
      )}

      {/* 03. COMPLIANCE & QUALITY DOCUMENTS */}
      {product && (
        <ProductDocuments productId={params.id} isSeller={true} />
      )}

      {/* 04. MULTI-SUPPLIER OFFERING PANEL */}
      {product && (
        <ProductSupplierPanel productId={params.id} />
      )}
    </div>
  );
}
