"use client";

import { useState, useRef } from "react";
import {
  Lock,
  DollarSign,
  Package,
  CheckCircle2,
  ChevronLeft,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  FileText,
  Trash2,
  Star,
  Info,
  ShieldCheck,
} from "lucide-react";
import { MasterProduct, CreateSupplierOfferingPayload } from "../api/masterCatalogApi";
import {
  uploadOfferingImage,
  uploadOfferingDocument,
  OfferingDocumentCategory,
} from "../api/offeringMediaApi";

interface SupplierOfferingFormProps {
  masterProduct: MasterProduct;
  onSubmit: (
    data: CreateSupplierOfferingPayload,
    stagedImages: File[],
    stagedDocuments: { file: File; category: OfferingDocumentCategory }[]
  ) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
}

const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "JPY", "CNY"];

interface StagedImage {
  file: File;
  previewUrl: string;
  isPrimary: boolean;
}

interface StagedDocument {
  file: File;
  category: OfferingDocumentCategory;
}

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

  // Independent Compliance Declarations (Explicitly default to false for new offerings)
  const [coaAvailable, setCoaAvailable] = useState<boolean>(false);
  const [msdsAvailable, setMsdsAvailable] = useState<boolean>(false);
  const [exportReady, setExportReady] = useState<boolean>(false);

  const [availabilityStatus, setAvailabilityStatus] = useState<string>("AVAILABLE");

  // Staged Media & Documents
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [stagedDocuments, setStagedDocuments] = useState<StagedDocument[]>([]);
  const [selectedDocCategory, setSelectedDocCategory] = useState<OfferingDocumentCategory>("COA");

  const [error, setError] = useState<string | null>(null);
  const [mediaWarning, setMediaWarning] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Handle Image Files Selection
  const handleImageFilesSelected = (files: FileList | null) => {
    if (!files) return;
    setError(null);
    setMediaWarning(null);

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

    const newImages: StagedImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!validTypes.includes(file.type.toLowerCase())) {
        setError(`Invalid image format: ${file.name}. Only JPG, PNG, and WEBP are supported.`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        setError(`Image file too large: ${file.name} exceeds 5 MB limit.`);
        continue;
      }
      if (stagedImages.length + newImages.length >= 10) {
        setError("Maximum limit of 10 images per offering reached.");
        break;
      }

      newImages.push({
        file,
        previewUrl: URL.createObjectURL(file),
        isPrimary: stagedImages.length === 0 && newImages.length === 0,
      });
    }

    if (newImages.length > 0) {
      setStagedImages((prev) => [...prev, ...newImages]);
    }
  };

  const removeStagedImage = (index: number) => {
    setStagedImages((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      if (removed?.isPrimary && next.length > 0) {
        next[0].isPrimary = true;
      }
      return next;
    });
  };

  const setPrimaryStagedImage = (index: number) => {
    setStagedImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  };

  // Handle Document Files Selection
  const handleDocFilesSelected = (files: FileList | null) => {
    if (!files) return;
    setError(null);
    setMediaWarning(null);

    const maxSizeBytes = 15 * 1024 * 1024; // 15 MB
    const newDocs: StagedDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxSizeBytes) {
        setError(`Document too large: ${file.name} exceeds 15 MB limit.`);
        continue;
      }
      if (stagedDocuments.length + newDocs.length >= 10) {
        setError("Maximum limit of 10 documents per offering reached.");
        break;
      }

      newDocs.push({
        file,
        category: selectedDocCategory,
      });
    }

    if (newDocs.length > 0) {
      setStagedDocuments((prev) => [...prev, ...newDocs]);
    }
  };

  const removeStagedDocument = (index: number) => {
    setStagedDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMediaWarning(null);

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
      // Order primary image first if present
      const sortedImages = [...stagedImages].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
      const imageFiles = sortedImages.map((i) => i.file);
      const documentPayloads = stagedDocuments.map((d) => ({
        file: d.file,
        category: d.category,
      }));

      await onSubmit(
        {
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
        },
        imageFiles,
        documentPayloads
      );
    } catch (err: any) {
      setError(err.message || "Failed to save offering.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Chemical Selection
          </button>
          <h2 className="text-xl font-bold text-slate-900">Add Chemical Offering</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure commercial terms, upload product sample media, and attach technical documentation.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {mediaWarning && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{mediaWarning}</span>
        </div>
      )}

      {/* READONLY MASTER PRODUCT BANNER */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-mono text-xs font-bold">
              {masterProduct.masterProductCode}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-xs">
              CAS: {masterProduct.casNumber || "N/A"}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold">
              {masterProduct.category}
            </span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900">{masterProduct.name}</h3>
          <p className="text-xs text-slate-500 line-clamp-1">
            {masterProduct.description || "Canonical chemical monograph from Synthora Master Registry."}
          </p>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 shrink-0 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <Lock className="w-3.5 h-3.5" />
          <span>Catalog Identity Locked</span>
        </div>
      </div>

      {/* COMMERCIAL & INVENTORY SPECIFICATIONS */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-blue-600" />
          Commercial & Logistics Terms
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* PRICE PER KG */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Unit Price (per kg) <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-24 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 24.50"
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* STOCK */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Available Inventory (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="e.g. 500"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* PURITY */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Batch Assay / Purity (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={purity}
              onChange={(e) => setPurity(e.target.value)}
              placeholder="e.g. 99.5"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* GRADE */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Grade Standard</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="USP">USP (United States Pharmacopeia)</option>
              <option value="BP">BP (British Pharmacopoeia)</option>
              <option value="EP">EP / Ph. Eur. (European Pharmacopoeia)</option>
              <option value="IP">IP (Indian Pharmacopoeia)</option>
              <option value="Pharma">Pharmaceutical Grade</option>
              <option value="Analytical">Analytical / AR Grade</option>
              <option value="Technical">Technical / Industrial Grade</option>
            </select>
          </div>

          {/* MOQ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Min. Order Quantity (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={moqKg}
              onChange={(e) => setMoqKg(e.target.value)}
              placeholder="e.g. 25"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* LEAD TIME */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lead Time (Days)</label>
            <input
              type="number"
              min="1"
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(e.target.value)}
              placeholder="e.g. 7"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* PACKAGING */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Packaging Format</label>
            <input
              type="text"
              value={packaging}
              onChange={(e) => setPackaging(e.target.value)}
              placeholder="e.g. 25kg Fiber Drum"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* AVAILABILITY STATUS */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Listing Status</label>
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

        {/* COMPLIANCE & EXPORT AVAILABILITY */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            Compliance & Export Availability
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Select the documentation and export credentials you can provide for this offering.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <label
              className={`flex items-start gap-2.5 p-3 rounded-xl border transition-colors cursor-pointer ${
                coaAvailable ? "border-blue-300 bg-blue-50/50" : "border-slate-200 bg-slate-50 hover:bg-white"
              }`}
            >
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

            <label
              className={`flex items-start gap-2.5 p-3 rounded-xl border transition-colors cursor-pointer ${
                msdsAvailable ? "border-blue-300 bg-blue-50/50" : "border-slate-200 bg-slate-50 hover:bg-white"
              }`}
            >
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

            <label
              className={`flex items-start gap-2.5 p-3 rounded-xl border transition-colors cursor-pointer ${
                exportReady ? "border-blue-300 bg-blue-50/50" : "border-slate-200 bg-slate-50 hover:bg-white"
              }`}
            >
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

        {/* PRODUCT SAMPLE MEDIA (IMAGES) */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Product Sample Images
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload batch sample or packaging photographs. Accepted formats: JPG, PNG, WEBP (Max 5 MB each, up to 10 images).
              </p>
            </div>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Images
            </button>
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleImageFilesSelected(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Staged Images Preview Grid */}
          {stagedImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
              {stagedImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative group rounded-xl border overflow-hidden p-2 bg-white transition-all ${
                    img.isPrimary ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200"
                  }`}
                >
                  <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                    <img
                      src={img.previewUrl}
                      alt={img.file.name}
                      className="w-full h-full object-cover"
                    />
                    {img.isPrimary && (
                      <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> Primary
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-1 text-[11px]">
                    <span className="text-slate-600 truncate font-medium max-w-[100px]">
                      {img.file.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimaryStagedImage(idx)}
                          title="Set as primary image"
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeStagedImage(idx)}
                        title="Remove image"
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              onClick={() => imageInputRef.current?.click()}
              className="mt-2 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20"
            >
              <ImageIcon className="w-7 h-7 mx-auto text-slate-400 mb-1.5" />
              <div className="text-xs font-semibold text-slate-700">Click or drag & drop sample images</div>
              <div className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, WEBP up to 5 MB each</div>
            </div>
          )}
        </div>

        {/* TECHNICAL & COMMERCIAL DOCUMENTATION */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Technical & Commercial Documentation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload COA, MSDS/SDS, Specifications, or Certificates (PDF, DOCX, up to 15 MB).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedDocCategory}
                onChange={(e) => setSelectedDocCategory(e.target.value as OfferingDocumentCategory)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
              >
                <option value="COA">Certificate of Analysis (COA)</option>
                <option value="MSDS">MSDS / SDS</option>
                <option value="TECHNICAL_SPECIFICATION">Technical Specification</option>
                <option value="CERTIFICATION">Quality / ISO / GMP Certificate</option>
                <option value="OTHER">Other Commercial Document</option>
              </select>
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Document
              </button>
              <input
                ref={docInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => handleDocFilesSelected(e.target.files)}
                className="hidden"
              />
            </div>
          </div>

          {/* Staged Documents List */}
          {stagedDocuments.length > 0 ? (
            <div className="space-y-2 mt-3">
              {stagedDocuments.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono text-[10px] font-bold rounded shrink-0">
                      {doc.category}
                    </span>
                    <span className="font-semibold text-slate-900 truncate">{doc.file.name}</span>
                    <span className="text-slate-400 font-mono text-[11px] shrink-0">
                      {formatFileSize(doc.file.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStagedDocument(idx)}
                    className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              onClick={() => docInputRef.current?.click()}
              className="mt-2 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20"
            >
              <FileText className="w-7 h-7 mx-auto text-slate-400 mb-1.5" />
              <div className="text-xs font-semibold text-slate-700">Click to attach supporting documents</div>
              <div className="text-[11px] text-slate-400 mt-0.5">PDF, DOCX, XLSX up to 15 MB each</div>
            </div>
          )}
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
          {isLoading ? "Saving Offering & Media..." : "Save Offering to Catalog"}
        </button>
      </div>
    </form>
  );
}
