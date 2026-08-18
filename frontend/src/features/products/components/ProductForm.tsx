"use client";

import { useState } from "react";
import { CreateProductRequest, UpdateProductRequest, ProductCategory } from "@/features/products/types/product";

interface ProductFormProps {
  initialData?: Partial<UpdateProductRequest>;
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  isLoading: boolean;
  submitLabel: string;
}

export function ProductForm({ initialData, onSubmit, isLoading, submitLabel }: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<CreateProductRequest>>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || "API",
    casNumber: initialData?.casNumber || "",
    molecularFormula: initialData?.molecularFormula || "",
    purity: initialData?.purity || undefined,
    grade: initialData?.grade || "",
    packaging: initialData?.packaging || "",
    moqKg: initialData?.moqKg || undefined,
    price: initialData?.price || undefined,
    stock: initialData?.stock || undefined,
    leadTimeDays: initialData?.leadTimeDays || undefined,
    availabilityStatus: initialData?.availabilityStatus || "IN_STOCK",
    coaAvailable: initialData?.coaAvailable || false,
    msdsAvailable: initialData?.msdsAvailable || false,
    exportReady: initialData?.exportReady || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData(prev => ({ ...prev, [name]: value === "" ? undefined : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) newErrors.name = "Product name is required";
    if (!formData.description?.trim()) newErrors.description = "Description is required";
    else if (formData.description.length > 2000) newErrors.description = "Description cannot exceed 2000 characters";
    
    if (formData.stock === undefined || formData.stock < 0) newErrors.stock = "Stock must be 0 or greater";
    if (formData.price === undefined || formData.price < 0.01) newErrors.price = "Price must be at least 0.01";
    
    if (formData.purity !== undefined && (formData.purity < 0 || formData.purity > 100)) {
      newErrors.purity = "Purity must be between 0 and 100";
    }
    
    if (formData.casNumber && formData.casNumber.length > 100) newErrors.casNumber = "CAS Number cannot exceed 100 characters";
    if (formData.molecularFormula && formData.molecularFormula.length > 100) newErrors.molecularFormula = "Molecular Formula cannot exceed 100 characters";
    if (formData.grade && formData.grade.length > 100) newErrors.grade = "Grade cannot exceed 100 characters";
    if (formData.packaging && formData.packaging.length > 150) newErrors.packaging = "Packaging cannot exceed 150 characters";
    
    if (formData.moqKg !== undefined && formData.moqKg < 0) newErrors.moqKg = "MOQ must be 0 or greater";
    if (formData.leadTimeDays !== undefined && formData.leadTimeDays < 0) newErrors.leadTimeDays = "Lead time must be 0 or greater";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData as CreateProductRequest);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* 01 / PRODUCT IDENTITY */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">01 / Product Identity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1 md:col-span-2">
            <label htmlFor="name" className="text-xs font-bold text-slate-700">Product Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none transition-shadow ${errors.name ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-purple-500 focus:ring-purple-200'}`}
              placeholder="e.g. Ibuprofen API"
            />
            {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
          </div>

          <div className="space-y-1 md:col-span-2">
            <label htmlFor="description" className="text-xs font-bold text-slate-700">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              rows={4}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none transition-shadow ${errors.description ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-purple-500 focus:ring-purple-200'}`}
              placeholder="Detailed description of the product"
            />
            {errors.description && <p className="text-xs text-rose-600 mt-1">{errors.description}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="category" className="text-xs font-bold text-slate-700">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:border-purple-500 focus:ring-purple-200 focus:outline-none transition-shadow bg-white"
            >
              <option value="API">API</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="EXCIPIENT">Excipient</option>
              <option value="SOLVENT">Solvent</option>
              <option value="SPECIALTY_CHEMICAL">Specialty Chemical</option>
              <option value="LAB_CHEMICAL">Lab Chemical</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="casNumber" className="text-xs font-bold text-slate-700">CAS Number</label>
            <input
              type="text"
              id="casNumber"
              name="casNumber"
              value={formData.casNumber}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none transition-shadow ${errors.casNumber ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-purple-500 focus:ring-purple-200'}`}
              placeholder="e.g. 15687-27-1"
            />
            {errors.casNumber && <p className="text-xs text-rose-600 mt-1">{errors.casNumber}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="molecularFormula" className="text-xs font-bold text-slate-700">Molecular Formula</label>
            <input
              type="text"
              id="molecularFormula"
              name="molecularFormula"
              value={formData.molecularFormula}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none transition-shadow ${errors.molecularFormula ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-purple-500 focus:ring-purple-200'}`}
              placeholder="e.g. C13H18O2"
            />
            {errors.molecularFormula && <p className="text-xs text-rose-600 mt-1">{errors.molecularFormula}</p>}
          </div>
        </div>
      </div>

      {/* 02 / TECHNICAL SPECIFICATION */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">02 / Technical Specification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label htmlFor="purity" className="text-xs font-bold text-slate-700">Purity (%)</label>
            <input
              type="number"
              step="0.01"
              id="purity"
              name="purity"
              value={formData.purity === undefined ? "" : formData.purity}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none transition-shadow ${errors.purity ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-purple-500 focus:ring-purple-200'}`}
              placeholder="e.g. 99.5"
            />
            {errors.purity && <p className="text-xs text-rose-600 mt-1">{errors.purity}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="grade" className="text-xs font-bold text-slate-700">Grade</label>
            <input
              type="text"
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none transition-shadow ${errors.grade ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-purple-500 focus:ring-purple-200'}`}
              placeholder="e.g. USP, EP, Technical"
            />
            {errors.grade && <p className="text-xs text-rose-600 mt-1">{errors.grade}</p>}
          </div>

          <div className="space-y-1 md:col-span-2">
            <label htmlFor="packaging" className="text-xs font-bold text-slate-700">Packaging</label>
            <input
              type="text"
              id="packaging"
              name="packaging"
              value={formData.packaging}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none transition-shadow ${errors.packaging ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-purple-500 focus:ring-purple-200'}`}
              placeholder="e.g. 25kg Fiber Drum"
            />
            {errors.packaging && <p className="text-xs text-rose-600 mt-1">{errors.packaging}</p>}
          </div>
        </div>
      </div>

      {/* 03 / COMMERCIAL TERMS */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">03 / Commercial Terms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label htmlFor="price" className="text-xs font-bold text-slate-700">Unit Price (USD) *</label>
            <input
              type="number"
              step="0.01"
              id="price"
              name="price"
              value={formData.price === undefined ? "" : formData.price}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none transition-shadow ${errors.price ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-purple-500 focus:ring-purple-200'}`}
              placeholder="0.00"
            />
            {errors.price && <p className="text-xs text-rose-600 mt-1">{errors.price}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="stock" className="text-xs font-bold text-slate-700">Stock Quantity *</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock === undefined ? "" : formData.stock}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none transition-shadow ${errors.stock ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-purple-500 focus:ring-purple-200'}`}
              placeholder="0"
            />
            {errors.stock && <p className="text-xs text-rose-600 mt-1">{errors.stock}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="moqKg" className="text-xs font-bold text-slate-700">MOQ (kg)</label>
            <input
              type="number"
              step="0.01"
              id="moqKg"
              name="moqKg"
              value={formData.moqKg === undefined ? "" : formData.moqKg}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none transition-shadow ${errors.moqKg ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-purple-500 focus:ring-purple-200'}`}
              placeholder="Minimum Order Quantity"
            />
            {errors.moqKg && <p className="text-xs text-rose-600 mt-1">{errors.moqKg}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="leadTimeDays" className="text-xs font-bold text-slate-700">Lead Time (Days)</label>
            <input
              type="number"
              id="leadTimeDays"
              name="leadTimeDays"
              value={formData.leadTimeDays === undefined ? "" : formData.leadTimeDays}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none transition-shadow ${errors.leadTimeDays ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-purple-500 focus:ring-purple-200'}`}
              placeholder="Average delivery lead time"
            />
            {errors.leadTimeDays && <p className="text-xs text-rose-600 mt-1">{errors.leadTimeDays}</p>}
          </div>
        </div>
      </div>

      {/* 04 / AVAILABILITY & COMPLIANCE */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">04 / Availability & Compliance</h3>
        
        <div className="space-y-1">
          <label htmlFor="availabilityStatus" className="text-xs font-bold text-slate-700">Availability Status</label>
          <select
            id="availabilityStatus"
            name="availabilityStatus"
            value={formData.availabilityStatus}
            onChange={handleChange}
            disabled={isLoading}
            className={`w-full md:w-1/2 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none transition-shadow ${errors.availabilityStatus ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-purple-500 focus:ring-purple-200'} bg-white`}
          >
            <option value="IN_STOCK">In Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="MADE_TO_ORDER">Made to Order</option>
          </select>
          {errors.availabilityStatus && <p className="text-xs text-rose-600 mt-1">{errors.availabilityStatus}</p>}
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              id="coaAvailable"
              name="coaAvailable"
              checked={formData.coaAvailable}
              onChange={handleChange}
              disabled={isLoading}
              className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Certificate of Analysis (CoA) Available</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              id="msdsAvailable"
              name="msdsAvailable"
              checked={formData.msdsAvailable}
              onChange={handleChange}
              disabled={isLoading}
              className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Material Safety Data Sheet (MSDS) Available</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              id="exportReady"
              name="exportReady"
              checked={formData.exportReady}
              onChange={handleChange}
              disabled={isLoading}
              className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Export Ready / Compliant</span>
          </label>
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center min-w-[140px]"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
