"use client";

import { useEffect, useState } from "react";
import { getBuyerRfqs, BuyerRfq } from "@/features/rfq/api/getBuyerRfqs";

export default function BuyerRfqsPage() {
  const [rfqs, setRfqs] = useState<BuyerRfq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRfqs() {
      try {
        setLoading(true);
        setError(null);

        const data = await getBuyerRfqs();
        setRfqs(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load RFQs"
        );
      } finally {
        setLoading(false);
      }
    }

    loadRfqs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">
            My RFQs
          </h1>

          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-slate-500">
              Loading your RFQs...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">
            My RFQs
          </h1>

          <div className="bg-white border border-red-200 rounded-xl p-10 text-center">
            <h2 className="text-lg font-semibold text-red-700">
              Unable to Load RFQs
            </h2>

            <p className="text-slate-500 mt-2">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">
          My RFQs
        </h1>

        {rfqs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              No RFQs submitted yet
            </h2>

            <p className="text-slate-500 mt-2">
              Your submitted RFQs will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">RFQ ID</th>
                  <th className="px-4 py-3 text-left">Product ID</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-left">Quantity</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Created</th>
                </tr>
              </thead>

              <tbody>
                {rfqs.map((rfq) => (
                  <tr
                    key={rfq.id}
                    className="border-t border-slate-200"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {rfq.id}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs">
                      {rfq.productId}
                    </td>

                    <td className="px-4 py-3">
                      #{rfq.supplierId}
                    </td>

                    <td className="px-4 py-3">
                      {rfq.quantity} {rfq.unit}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        {rfq.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {new Date(rfq.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}