'use client';

import React, { useState } from 'react';
import { CreateQuotationRequest, QuotationResponse, submitQuotation } from '../api/submitQuotation';

interface QuotationFormProps {
  rfqId: string;
  onSuccess: (quotation: QuotationResponse) => void;
}

export const QuotationForm: React.FC<QuotationFormProps> = ({ rfqId, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<CreateQuotationRequest>>({
    unitPrice: undefined,
    currency: 'USD',
    minimumOrderQuantity: undefined,
    leadTimeDays: undefined,
    validityDate: '',
    packagingDetails: '',
    commercialNotes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (name === 'unitPrice' || name === 'minimumOrderQuantity' || name === 'leadTimeDays') 
                ? (value === '' ? undefined : Number(value)) 
                : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.unitPrice || formData.unitPrice <= 0) {
        throw new Error('Unit price must be greater than zero.');
      }
      if (!formData.currency) {
        throw new Error('Currency is required.');
      }
      if (!formData.validityDate) {
        throw new Error('Validity date is required.');
      }

      const response = await submitQuotation(rfqId, formData as CreateQuotationRequest);
      onSuccess(response);
    } catch (err: any) {
      setError(err.message || 'Failed to submit quotation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <h3 className="text-xl font-bold mb-4">Submit Quotation</h3>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md border border-red-200">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Unit Price *</label>
            <input
              type="number"
              name="unitPrice"
              step="0.0001"
              required
              value={formData.unitPrice || ''}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Currency *</label>
            <input
              type="text"
              name="currency"
              required
              maxLength={10}
              value={formData.currency || ''}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Minimum Order Quantity</label>
            <input
              type="number"
              name="minimumOrderQuantity"
              step="0.0001"
              value={formData.minimumOrderQuantity || ''}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lead Time (days)</label>
            <input
              type="number"
              name="leadTimeDays"
              min="1"
              step="1"
              value={formData.leadTimeDays || ''}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Validity Date *</label>
          <input
            type="date"
            name="validityDate"
            required
            value={formData.validityDate || ''}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Packaging Details</label>
          <input
            type="text"
            name="packagingDetails"
            value={formData.packagingDetails || ''}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Commercial Notes</label>
          <textarea
            name="commercialNotes"
            value={formData.commercialNotes || ''}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Quotation'}
        </button>
      </form>
    </div>
  );
};
