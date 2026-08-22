"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Lock,
  DollarSign,
  Package,
  Eye,
} from "lucide-react";
import {
  getSupplierOffering,
  updateSupplierOffering,
  SupplierOffering,
  UpdateSupplierOfferingPayload,
} from "@/features/supplier-products/api/masterCatalogApi";
import { GenericDocumentManager } from "@/features/documents/components/GenericDocumentManager";
import { OfferingImageManager } from "@/features/supplier-products/components/OfferingImageManager";

const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "JPY", "CNY"];

export default function EditSupplierOfferingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const offeringId = resolvedParams.id;
  const router = useRouter();

  const [offering, setOffering] = useState<SupplierOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [price, setPrice] = useState<string>("");
  const [currency, setCurrency] = useState<string>("INR");
  const [stock, setStock] = useState<string>("");
  const [purity, setPurity] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [moqKg, setMoqKg] = useState<string>("");
  const [packaging, setPackaging] = useState<string>("");
  const [leadTimeDays, setLeadTimeDays] = useState<string>("");
  const [coaAvailable, setCoaAvailable] = useState<boolean>(false);
  const [msdsAvailable, setMsdsAvailable] = useState<boolean>(false);
  const [exportReady, setExportReady] = useState<boolean>(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<string>("AVAILABLE");

  const loadOffering = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSupplierOffering(offeringId);
      setOffering(data);

      // Pre-fill form fields
      setPrice(data.price ? String(data.price) : "");
      setCurrency(data.currency || "INR");
      setStock(data.stock !== undefined && data.stock !== null ? String(data.stock) : "0");
      setPurity(data.purity ? String(data.purity) : "");
      setGrade(data.grade || "");
      setMoqKg(data.moqKg ? String(data.moqKg) : "");
      setPackaging(data.packaging || "");
      setLeadTimeDays(data.leadTimeDays ? String(data.leadTimeDays) : "");
      setCoaAvailable(Boolean(data.coaAvailable));
      setMsdsAvailable(Boolean(data.msdsAvailable));
      setExportReady(Boolean(data.exportReady));
      setAvailabilityStatus(data.availabilityStatus || "AVAILABLE");
    } catch (err: any) {
      setError(err.message || "Failed to load supplier offering details.");
    } finally {
      setIsLoading(false);
    }
  }, [offeringId]);

  useEffect(() => {
    loadOffering();
  }, [loadOffering]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

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

    const payload: UpdateSupplierOfferingPayload = {
      price: parsedPrice,
      currency,
      stock: parsedStock,
      purity: purity ? parseFloat(purity) : null,
      grade: grade.trim() || null,
      moqKg: moqKg ? parseFloat(moqKg) : null,
      packaging: packaging.trim() || null,
      leadTimeDays: leadTimeDays ? parseInt(leadTimeDays, 10) : null,
      coaAvailable,
      msdsAvailable,
      exportReady,
      availabilityStatus,
    };

    try {
      setIsSubmitting(true);
      const updated = await updateSupplierOffering(offeringId, payload);
      setOffering(updated);
      setSuccessMessage("Offering terms successfully updated!");
      setTimeout(() => {
        router.push("/dashboard/supplier/products");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to update supplier offering.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !offering) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <Link
          href="/dashboard/supplier/products"
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Supplier Catalog
        </Link>
        <div className="p-8 text-center bg-white rounded-3xl border border-rose-200 shadow-2xs">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <p className="text-slate-900 font-bold mb-1 text-sm">ACCESS DENIED / OFFERING NOT FOUND</p>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/supplier/products"
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Supplier Catalog
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Edit Chemical Offering</h1>
            <p className="text-xs text-slate-500 mt-1">
              Update commercial pricing, stock, lead time, and compliance terms for this product.
            </p>
          </div>
          {offering && (
            <Link
              href={`/products/${offering.masterProductId}`}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" /> View Public Listing
            </Link>
          )}
        </div>
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

      {/* READ-ONLY CANONICAL MASTER PRODUCT IDENTITY */}
      {offering && (
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
              <Lock className="w-4 h-4 text-slate-400" />
              Canonical Master Product Identity (Read-Only)
            </div>
            <span className="px-2.5 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-bold rounded-lg uppercase">
              {offering.masterProductCode}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Chemical Name</span>
              <strong className="text-slate-900 font-bold text-sm">{offering.masterProductName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">CAS Number</span>
              <strong className="text-slate-900 font-mono font-bold">{offering.casNumber || "N/A"}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
              <strong className="text-slate-900 font-bold">{offering.category?.replace("_", " ") || "N/A"}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Formula</span>
              <strong className="text-slate-900 font-mono font-bold">{offering.molecularFormula || "N/A"}</strong>
            </div>
          </div>

          {/* 3-Domain Status Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/60 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Master Product</span>
              <div className="flex items-center gap-1.5 font-bold text-emerald-700 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>ACTIVE</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Your Offering Review</span>
              <div className={`flex items-center gap-1.5 font-bold mt-0.5 ${
                offering.moderationStatus === "APPROVED" ? "text-emerald-700" :
                offering.moderationStatus === "FLAGGED" ? "text-purple-700" :
                offering.moderationStatus === "REJECTED" ? "text-rose-700" :
                "text-amber-700"
              }`}>
                <span>{(offering.moderationStatus || "PENDING_REVIEW").replace("_", " ")}</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Public Listing</span>
              <div className={`flex items-center gap-1.5 font-bold mt-0.5 ${
                offering.moderationStatus === "APPROVED" && offering.availabilityStatus === "AVAILABLE" && (offering.stock || 0) > 0 ? "text-emerald-700" :
                "text-slate-600"
              }`}>
                {offering.moderationStatus === "APPROVED" && offering.availabilityStatus === "AVAILABLE" && (offering.stock || 0) > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>LIVE ON CATALOG</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>NOT AVAILABLE YET</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDITABLE COMMERCIAL OFFERING FORM */}
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
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

            {/* Currency */}
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
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              Compliance & Export Availability
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Supplier declarations regarding documentation availability and export readiness.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-colors cursor-pointer ${
                coaAvailable ? "border-blue-300 bg-blue-50/50" : "border-slate-200 bg-slate-50 hover:bg-white"
              }`}>
                <input
                  type="checkbox"
                  checked={coaAvailable}
                  onChange={(e) => setCoaAvailable(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Certificate of Analysis (COA)</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Supplier indicates COA is available
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-colors cursor-pointer ${
                msdsAvailable ? "border-blue-300 bg-blue-50/50" : "border-slate-200 bg-slate-50 hover:bg-white"
              }`}>
                <input
                  type="checkbox"
                  checked={msdsAvailable}
                  onChange={(e) => setMsdsAvailable(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-900 block">MSDS / SDS</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Supplier indicates safety documentation is available
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-colors cursor-pointer ${
                exportReady ? "border-blue-300 bg-blue-50/50" : "border-slate-200 bg-slate-50 hover:bg-white"
              }`}>
                <input
                  type="checkbox"
                  checked={exportReady}
                  onChange={(e) => setExportReady(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Ready for Global Export</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Supplier indicates export availability
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTONS */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/dashboard/supplier/products"
            className="px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? "Saving Changes..." : "Save Offering Changes"}
          </button>
        </div>
      </form>

      {/* DEDICATED PRODUCT SAMPLE MEDIA SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <OfferingImageManager offeringId={offeringId} />
      </div>

      {/* DEDICATED OFFERING DOCUMENTS & EVIDENCE SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <GenericDocumentManager
          title="Offering Documents & Compliance Evidence"
          description="Upload COA, MSDS, Technical Specifications, and compliance certificates specific to this commercial offering."
          ownerType="SUPPLIER_OFFERING"
          ownerId={offeringId}
          canUpload={true}
          canDelete={true}
          allowedCategories={[
            { value: "COA", label: "Certificate of Analysis (COA)" },
            { value: "MSDS", label: "Safety Data Sheet (MSDS / SDS)" },
            { value: "SPECIFICATION", label: "Technical Specification Sheet" },
            { value: "COMPLIANCE", label: "Compliance / Certification" },
            { value: "OTHER", label: "Other Technical Document" },
          ]}
          emptyMessage="No documents attached to this offering yet. Upload COA, MSDS, or technical specifications above."
        />
      </div>
    </div>
  );
}
