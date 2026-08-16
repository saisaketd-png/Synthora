"use client";

import { useEffect, useState } from "react";
import { getSupplierRfq } from "@/features/rfq/api/getSupplierRfq";
import { SupplierRfq } from "@/features/rfq/api/getSupplierRfqs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QuotationForm } from "@/features/rfq/components/QuotationForm";
import { QuotationResponse } from "@/features/rfq/api/submitQuotation";

export default function SupplierRfqDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [rfq, setRfq] = useState<SupplierRfq | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quotation, setQuotation] = useState<QuotationResponse | null>(null);

  useEffect(() => {
    async function loadRfq() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await getSupplierRfq(id);
        setRfq(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load supplier RFQ"
        );
      } finally {
        setLoading(false);
      }
    }

    loadRfq();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href="/dashboard/supplier/rfqs"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              &larr; Back to Inbox
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-6">
            RFQ Details
          </h1>

          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-slate-500">Loading RFQ...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href="/dashboard/supplier/rfqs"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              &larr; Back to Inbox
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-6">
            RFQ Details
          </h1>

          <div className="bg-white border border-red-200 rounded-xl p-10 text-center">
            <h2 className="text-lg font-semibold text-red-700">
              Unable to Load RFQ
            </h2>
            <p className="text-slate-500 mt-2">{error || "RFQ not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link
            href="/dashboard/supplier/rfqs"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            &larr; Back to Inbox
          </Link>
          <div className="mt-4">
            <p className="text-sm font-medium text-blue-600">
              Supplier Workspace
            </p>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">
              RFQ Details
            </h1>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Request Information
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Submitted on {new Date(rfq.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                {quotation ? "QUOTED" : rfq.status}
              </span>
            </div>
          </div>

          <div className="p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">RFQ ID</dt>
                <dd className="mt-1 text-sm text-slate-900 font-mono break-all">
                  {rfq.id}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">Product ID</dt>
                <dd className="mt-1 text-sm text-slate-900 font-mono break-all">
                  {rfq.productId}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">Buyer ID</dt>
                <dd className="mt-1 text-sm text-slate-900 font-mono break-all">
                  {rfq.buyerId}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">Requested Quantity</dt>
                <dd className="mt-1 text-sm text-slate-900 font-medium">
                  {rfq.quantity} {rfq.unit}
                </dd>
              </div>
              <div className="sm:col-span-2 border-t border-slate-200 pt-6 mt-2">
                <dt className="text-sm font-medium text-slate-500">Buyer Message</dt>
                <dd className="mt-2 text-sm text-slate-700 bg-slate-50 rounded-lg p-4 whitespace-pre-wrap border border-slate-100">
                  {rfq.message || <span className="italic text-slate-400">No message provided</span>}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {quotation ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-green-800 mb-4">Quotation Submitted</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-green-700">Quotation ID</dt>
                <dd className="mt-1 text-sm text-green-900 font-mono">{quotation.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-green-700">Version</dt>
                <dd className="mt-1 text-sm text-green-900 font-mono">{quotation.quotationVersion}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-green-700">Unit Price</dt>
                <dd className="mt-1 text-sm text-green-900">{quotation.unitPrice} {quotation.currency}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-green-700">Validity Date</dt>
                <dd className="mt-1 text-sm text-green-900">{quotation.validityDate}</dd>
              </div>
              {quotation.minimumOrderQuantity && (
                <div>
                  <dt className="text-sm font-medium text-green-700">Minimum Order Quantity</dt>
                  <dd className="mt-1 text-sm text-green-900">{quotation.minimumOrderQuantity}</dd>
                </div>
              )}
              {quotation.leadTimeDays && (
                <div>
                  <dt className="text-sm font-medium text-green-700">Lead Time</dt>
                  <dd className="mt-1 text-sm text-green-900">{quotation.leadTimeDays} days</dd>
                </div>
              )}
            </dl>
          </div>
        ) : (
          (rfq.status !== "CLOSED" && rfq.status !== "CANCELLED") && (
            <QuotationForm rfqId={rfq.id} onSuccess={(q) => setQuotation(q)} />
          )
        )}
      </div>
    </div>
  );
}
