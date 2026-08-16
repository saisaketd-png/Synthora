"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { getRfq, RfqDetail } from "@/features/rfq/api/getRfq";
import { getBuyerQuotations } from "@/features/rfq/api/getBuyerQuotations";
import { QuotationResponse } from "@/features/rfq/api/submitQuotation";
import { QuotationComparison } from "@/features/rfq/components/QuotationComparison";
import { getProductDetail } from "@/app/products/api/getProductDetail";
import { getProductSuppliers } from "@/app/products/api/getProductSuppliers";

type ProductDetail = {
  id: string;
  name: string;
  description: string;
  category: string;
  casNumber: string;
  molecularFormula: string;
  purity: number;
  grade: string;
  price: number;
  stock: number;
  moqKg: number;
  packaging: string;
  leadTimeDays: number;
  availabilityStatus: string;
  coaAvailable: boolean;
  msdsAvailable: boolean;
  exportReady: boolean;
  sellerId: string;
  sellerName: string;
  createdAt: string;
  updatedAt: string;
};

type Supplier = {
  supplierId: number;
  supplierName: string;
  countryName: string;
  verified: boolean;
  yearsInBusiness: number;
  responseRate: number;
  exportReady: boolean;
  purity: string;
  grade: string;
  moqKg: number;
  packaging: string;
  leadTimeDays: number;
  coaAvailable: boolean;
  msdsAvailable: boolean;
};

export default function RfqDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rfqId = params.id as string;

  const [rfq, setRfq] = useState<RfqDetail | null>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [quotations, setQuotations] = useState<QuotationResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRfqDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [rfqData, quotationsData] = await Promise.all([
        getRfq(rfqId),
        getBuyerQuotations(rfqId).catch(() => [] as QuotationResponse[]),
      ]);

      const [productData, suppliersData] = await Promise.all([
        getProductDetail(rfqData.productId),
        getProductSuppliers(rfqData.productId),
      ]);

      const matchingSupplier = suppliersData.find(
        (item: Supplier) => item.supplierId === rfqData.supplierId
      );

      setRfq(rfqData);
      setQuotations(quotationsData);
      setProduct(productData);
      setSupplier(matchingSupplier ?? null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load RFQ"
      );
    } finally {
      setLoading(false);
    }
  }, [rfqId]);

  useEffect(() => {
    if (rfqId) {
      loadRfqDetail();
    }
  }, [rfqId, loadRfqDetail]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-slate-500">
            Loading RFQ details...
          </p>
        </div>
      </main>
    );
  }

  if (error || !rfq) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-red-200 rounded-xl p-8">
            <h1 className="text-xl font-semibold text-red-700">
              Unable to Load RFQ
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error ?? "RFQ not found"}
            </p>

            <button
              onClick={() => router.push("/dashboard/rfqs")}
              className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Back to My RFQs
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}

        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push("/dashboard/rfqs")}
              className="text-sm text-slate-500 hover:text-slate-900 mb-3"
            >
              ← Back to My RFQs
            </button>

            <h1 className="text-3xl font-bold text-slate-900">
              RFQ Details
            </h1>

            <p className="mt-1 text-sm text-slate-500 font-mono">
              {rfq.id}
            </p>
          </div>

          <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
            {rfq.status}
          </span>
        </div>

        {/* Product */}

        <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Product
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {product?.name ?? "Product unavailable"}
              </h2>

              {product?.casNumber && (
                <p className="mt-2 text-sm text-slate-500">
                  CAS Number:{" "}
                  <span className="font-mono text-slate-700">
                    {product.casNumber}
                  </span>
                </p>
              )}
            </div>

            {product?.category && (
              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {product.category}
              </span>
            )}
          </div>

          {product?.molecularFormula && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-400">
                  Molecular Formula
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {product.molecularFormula}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-400">
                  Product Purity
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {product.purity}%
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-400">
                  Grade
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {product.grade}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Supplier */}

        <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Supplier
          </p>

          <div className="mt-2 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {supplier?.supplierName ?? "Supplier unavailable"}
              </h2>

              {supplier?.countryName && (
                <p className="mt-1 text-sm text-slate-500">
                  {supplier.countryName}
                </p>
              )}
            </div>

            {supplier?.verified && (
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Verified Supplier
              </span>
            )}
          </div>

          {supplier && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-400">
                  Response Rate
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {supplier.responseRate}%
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-400">
                  Years in Business
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {supplier.yearsInBusiness}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-400">
                  Supplier Purity
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {supplier.purity}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-400">
                  Lead Time
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {supplier.leadTimeDays} days
                </p>
              </div>
            </div>
          )}
        </section>

        {/* RFQ Requirement */}

        <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Your Requirement
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg bg-slate-50 p-5">
              <p className="text-xs text-slate-400">
                Quantity
              </p>

              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {rfq.quantity} {rfq.unit}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-5">
              <p className="text-xs text-slate-400">
                Submitted
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {new Date(rfq.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-5">
              <p className="text-xs text-slate-400">
                Status
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {rfq.status}
              </p>
            </div>
          </div>

          {rfq.message && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-700">
                Buyer Message
              </p>

              <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
                {rfq.message}
              </div>
            </div>
          )}
        </section>

        {/* Quotation & Version Comparison */}
        <QuotationComparison
          quotations={quotations}
          rfqStatus={rfq.status}
          rfqId={rfq.id}
          onDecisionSuccess={loadRfqDetail}
        />

        {/* Timeline */}

        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            RFQ Timeline
          </p>

          <div className="mt-6 space-y-6">
            <div className="flex gap-4">
              <div className="mt-1 h-3 w-3 rounded-full bg-[#17B5AE]" />

              <div>
                <p className="font-semibold text-slate-900">
                  RFQ Submitted
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {new Date(rfq.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className={`mt-1 h-3 w-3 rounded-full ${quotations.length > 0 || rfq.status !== "PENDING" ? "bg-[#17B5AE]" : "bg-slate-300"}`} />

              <div>
                <p className={`font-semibold ${quotations.length > 0 || rfq.status !== "PENDING" ? "text-slate-900" : "text-slate-400"}`}>
                  Supplier Review
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {quotations.length > 0
                    ? "Supplier reviewed RFQ and submitted commercial terms"
                    : rfq.status !== "PENDING"
                    ? "Supplier has contacted/reviewed your RFQ"
                    : "Waiting for supplier response"}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className={`mt-1 h-3 w-3 rounded-full ${quotations.length > 0 ? "bg-[#17B5AE]" : "bg-slate-300"}`} />

              <div>
                <p className={`font-semibold ${quotations.length > 0 ? "text-slate-900" : "text-slate-400"}`}>
                  Quotation
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {quotations.length > 0
                    ? `Quotation received (Version ${quotations[0].quotationVersion} active) — ${new Date(quotations[0].createdAt).toLocaleString()}`
                    : "No quotation available yet"}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className={`mt-1 h-3 w-3 rounded-full ${rfq.status === "ACCEPTED" ? "bg-emerald-500" : rfq.status === "REJECTED" ? "bg-rose-500" : "bg-slate-300"}`} />

              <div>
                <p className={`font-semibold ${rfq.status === "ACCEPTED" || rfq.status === "REJECTED" ? "text-slate-900" : "text-slate-400"}`}>
                  Order Decision
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {rfq.status === "ACCEPTED"
                    ? "Quotation accepted by buyer — ready for procurement order"
                    : rfq.status === "REJECTED"
                    ? "Quotation rejected by buyer — RFQ concluded"
                    : "Pending buyer review & decision"}
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}