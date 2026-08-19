"use client";

import { useState } from "react";
import { Lock, DollarSign, Package, CheckCircle2, ChevronLeft, AlertCircle } from "lucide-react";
import { MasterProduct, CreateSupplierOfferingPayload } from "../api/masterCatalogApi";

interface SupplierOfferingFormProps {
  masterProduct: MasterProduct;
  onSubmit: (data: CreateSupplierOfferingPayload) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
}

const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "JPY", "CNY"];

export function SupplierOfferingForm({
  masterProduct,
  onSubmit,
  onBack,
  isLoading = false,
}: SupplierOfferingFormProps) {
  const [price, setPrice] = useState<string>("");
  const [currency, setCurrency] = useState<string>("INR");
  const [stock, setStock] = useState<string>("100");
  const [purity, setPurity] = useState<string>("");
  const [grade, setGrade] = useState<string>("USP");
  const [moqKg, setMoqKg] = useState<string>("25");
  const [packaging, setPackaging] = useState<string>("Standard Drum");
  const [leadTimeDays, setLeadTimeDays] = useState<string>("7");
  const [coaAvailable, setCoaAvailable] = useState<boolean>(true);
  const [msdsAvailable, setMsdsAvailable] = useState<boolean>(true);
  const [exportReady, setExportReady] = useState<boolean>(true);
  const [availabilityStatus, setAvailabilityStatus] = useState<string>("AVAILABLE");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Please enter a valid price greater than 0.");
      return;
    }
    if (isNaN(parsedStock) || parsedStock < 0) {
      setError("Please enter a valid stock quantity (0 or greater).");
      return;
    }

    try {
      await onSubmit({
        masterProductId: masterProduct.id,
        price: parsedPrice,
        currency,
        stock: parsedStock,
        purity: purity ? parseFloat(purity) : null,
        grade: grade || null,
        moqKg: moqKg ? parseFloat(moqKg) : null,
        packaging: packaging || null,
        leadTimeDays: leadTimeDays ? parseInt(leadTimeDays, 10) : null,
        coaAvailable,
        msdsAvailable,
        exportReady,
        availabilityStatus,
      });
    } catch (err: any) {
      setError(err.message || "Failed to create offering.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Search
          </button>
          <h2 className="text-xl font-bold text-slate-900">Step 2: Add Commercial Offering</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your commercial pricing, stock, and specification terms for this chemical.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* READ-ONLY MASTER PRODUCT SUMMARY */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          Master Product Specifications (Read-Only)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Chemical Name</span>
            <strong className="text-slate-900 font-bold">{masterProduct.name}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">CAS Number</span>
            <strong className="text-slate-900 font-bold">{masterProduct.casNumber || "N/A"}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
            <strong className="text-slate-900 font-bold">{masterProduct.category.replace("_", " ")}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Master Code</span>
            <strong className="text-blue-600 font-extrabold">{masterProduct.masterProductCode}</strong>
          </div>
        </div>
      </div>

      {/* COMMERCIAL OFFERING FORM FIELDS */}
      <div className="space-y-6">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-blue-600" />
          Commercial Pricing & Inventory
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {/* Price */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Unit Price *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 120.00"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Currency Dropdown (Default INR) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Currency *
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c} {c === "INR" ? "(Indian Rupee - Default)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Stock */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Available Stock (kg) *
            </label>
            <input
              type="number"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="e.g. 500"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Purity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Purity (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={purity}
              onChange={(e) => setPurity(e.target.value)}
              placeholder="e.g. 99.80"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Grade */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Grade
            </label>
            <input
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g. USP, EP, Tech"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* MOQ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              MOQ (kg)
            </label>
            <input
              type="number"
              step="0.01"
              value={moqKg}
              onChange={(e) => setMoqKg(e.target.value)}
              placeholder="e.g. 25.00"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Packaging */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Packaging Type
            </label>
            <input
              type="text"
              value={packaging}
              onChange={(e) => setPackaging(e.target.value)}
              placeholder="e.g. 25kg Drum, HDPE Bag"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Lead Time */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Lead Time (Days)
            </label>
            <input
              type="number"
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(e.target.value)}
              placeholder="e.g. 7"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Availability Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Availability Status
            </label>
            <select
              value={availabilityStatus}
              onChange={(e) => setAvailabilityStatus(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="OUT_OF_STOCK">OUT OF STOCK</option>
              <option value="HIDDEN">HIDDEN</option>
            </select>
          </div>
        </div>

        {/* COMPLIANCE & EXPORT FLAGS */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            Compliance & Export Availability
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={coaAvailable}
                onChange={(e) => setCoaAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Certificate of Analysis (COA) Available</span>
            </label>
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={msdsAvailable}
                onChange={(e) => setMsdsAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>MSDS / SDS Document Available</span>
            </label>
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={exportReady}
                onChange={(e) => setExportReady(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Ready for Global Export</span>
            </label>
          </div>
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isLoading ? "Saving Offering..." : "Save Offering to Catalog"}
        </button>
      </div>
    </form>
  );
}
