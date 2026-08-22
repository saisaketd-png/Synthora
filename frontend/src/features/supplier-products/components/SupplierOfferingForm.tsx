"use client";

import { useState, useRef } from "react";
import {
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
  ShieldCheck,
  FlaskConical,
  Clock,
  Send,
  RefreshCw,
  Eye,
  Check,
} from "lucide-react";
import { MasterProduct, CreateSupplierOfferingPayload } from "../api/masterCatalogApi";
import {
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
  // Commercial parameters
  const [price, setPrice] = useState<string>("");
  const [currency, setCurrency] = useState<string>("INR");
  const [stock, setStock] = useState<string>("100");
  const [purity, setPurity] = useState<string>("99.5");
  const [grade, setGrade] = useState<string>("USP");
  const [moqKg, setMoqKg] = useState<string>("25");
  const [packaging, setPackaging] = useState<string>("Standard Drum (25kg)");
  const [leadTimeDays, setLeadTimeDays] = useState<string>("7");
  const [availabilityStatus, setAvailabilityStatus] = useState<string>("AVAILABLE");

  // Independent Compliance Declarations (Manually controlled)
  const [coaAvailable, setCoaAvailable] = useState<boolean>(false);
  const [msdsAvailable, setMsdsAvailable] = useState<boolean>(false);
  const [exportReady, setExportReady] = useState<boolean>(false);

  // Staged Media & Documents
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [stagedDocuments, setStagedDocuments] = useState<StagedDocument[]>([]);
  const [selectedDocCategory, setSelectedDocCategory] = useState<OfferingDocumentCategory>("COA");

  // Errors & Warnings
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Handle Image Selection
  const handleImageFilesSelected = (files: FileList | null) => {
    if (!files) return;
    setError(null);

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

  // Handle Document Selection
  const handleDocFilesSelected = (files: FileList | null) => {
    if (!files) return;
    setError(null);

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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);
    const parsedPurity = purity ? parseFloat(purity) : null;
    const parsedMoq = moqKg ? parseFloat(moqKg) : null;
    const parsedLeadTime = leadTimeDays ? parseInt(leadTimeDays, 10) : null;

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      errors.price = "Price must be a positive number greater than 0.";
    }

    if (isNaN(parsedStock) || parsedStock < 0) {
      errors.stock = "Available stock must be 0 or greater.";
    }

    if (parsedPurity !== null && (isNaN(parsedPurity) || parsedPurity <= 0 || parsedPurity > 100)) {
      errors.purity = "Purity percentage must be between 0.1% and 100.0%.";
    }

    if (parsedMoq !== null && (isNaN(parsedMoq) || parsedMoq <= 0)) {
      errors.moq = "Minimum Order Quantity must be greater than 0.";
    }

    if (parsedLeadTime !== null && (isNaN(parsedLeadTime) || parsedLeadTime < 0)) {
      errors.leadTime = "Lead time days cannot be negative.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      setError("Please resolve the highlighted field errors before submitting.");
      return;
    }

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);

    try {
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
      setError(err.message || "Failed to submit offering.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-[#DFE1E6]">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0052CC] hover:underline mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to Master Chemical Selection</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#091E42] tracking-tight">
            Add Commercial Chemical Offering
          </h1>
          <p className="text-xs text-[#5E6C84] mt-0.5">
            Configure commercial pricing, stock, lead times, upload verified media, and attach COA/MSDS documents.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION A: PRODUCT SELECTION & MONOGRAPH */}
      <section className="bg-white rounded-2xl border border-[#DFE1E6] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#DEEBFF] text-[#0052CC] font-bold text-xs flex items-center justify-center">
              A
            </span>
            <h2 className="text-sm font-extrabold text-[#091E42] uppercase tracking-wider">
              Selected Master Chemical Monograph
            </h2>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-bold text-[#0052CC] hover:underline"
          >
            Change Chemical
          </button>
        </div>

        <div className="bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase text-[#5E6C84] block">Chemical Name</span>
            <strong className="text-sm font-bold text-[#091E42] block truncate">
              {masterProduct.name}
            </strong>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-[#5E6C84] block">Master Code</span>
            <span className="font-mono text-xs font-bold text-[#0052CC] block">
              {masterProduct.masterProductCode}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-[#5E6C84] block">CAS Number</span>
            <span className="font-mono text-xs text-[#172B4D] block">
              {masterProduct.casNumber || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-[#5E6C84] block">Category</span>
            <span className="inline-block px-2 py-0.5 mt-0.5 rounded text-[10px] font-extrabold uppercase bg-[#DEEBFF] text-[#0052CC]">
              {masterProduct.category.replace("_", " ")}
            </span>
          </div>
        </div>
      </section>

      {/* SECTION B: COMMERCIAL SPECIFICATIONS */}
      <section className="bg-white rounded-2xl border border-[#DFE1E6] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#DEEBFF] text-[#0052CC] font-bold text-xs flex items-center justify-center">
            B
          </span>
          <h2 className="text-sm font-extrabold text-[#091E42] uppercase tracking-wider">
            Commercial Specifications & Pricing
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Price & Currency */}
          <div>
            <label className="font-bold text-[#172B4D] block mb-1">
              Unit Price *
            </label>
            <div className="flex rounded-lg border border-[#DFE1E6] overflow-hidden focus-within:border-[#0052CC] bg-[#FAFBFC]">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="px-2.5 py-2 bg-[#EBECF0] border-r border-[#DFE1E6] font-bold text-[#091E42] text-xs outline-none"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 1500.00"
                className="w-full px-3 py-2 bg-transparent text-[#091E42] font-semibold text-xs outline-none"
              />
            </div>
            {fieldErrors.price && (
              <span className="text-rose-600 text-[11px] mt-1 block">{fieldErrors.price}</span>
            )}
          </div>

          {/* Pharmacopoeial Grade */}
          <div>
            <label className="font-bold text-[#172B4D] block mb-1">
              Pharmacopoeial Grade *
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg font-medium text-[#091E42] text-xs outline-none focus:border-[#0052CC]"
            >
              <option value="USP">USP Grade</option>
              <option value="EP">EP (European Pharmacopoeia)</option>
              <option value="IP">IP (Indian Pharmacopoeia)</option>
              <option value="BP">BP (British Pharmacopoeia)</option>
              <option value="JP">JP (Japanese Pharmacopoeia)</option>
              <option value="HPLC">HPLC / Analytical Grade</option>
              <option value="TECH">Technical / Industrial Grade</option>
            </select>
          </div>

          {/* Purity % */}
          <div>
            <label className="font-bold text-[#172B4D] block mb-1">
              Assay / Purity (%) *
            </label>
            <input
              type="number"
              step="0.1"
              max="100"
              value={purity}
              onChange={(e) => setPurity(e.target.value)}
              placeholder="e.g. 99.5"
              className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg font-medium text-[#091E42] text-xs outline-none focus:border-[#0052CC]"
            />
            {fieldErrors.purity && (
              <span className="text-rose-600 text-[11px] mt-1 block">{fieldErrors.purity}</span>
            )}
          </div>

          {/* Stock Available */}
          <div>
            <label className="font-bold text-[#172B4D] block mb-1">
              Stock Available (kg/L) *
            </label>
            <input
              type="number"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="e.g. 500"
              className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg font-medium text-[#091E42] text-xs outline-none focus:border-[#0052CC]"
            />
            {fieldErrors.stock && (
              <span className="text-rose-600 text-[11px] mt-1 block">{fieldErrors.stock}</span>
            )}
          </div>

          {/* MOQ */}
          <div>
            <label className="font-bold text-[#172B4D] block mb-1">
              Minimum Order Quantity (MOQ kg) *
            </label>
            <input
              type="number"
              value={moqKg}
              onChange={(e) => setMoqKg(e.target.value)}
              placeholder="e.g. 25"
              className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg font-medium text-[#091E42] text-xs outline-none focus:border-[#0052CC]"
            />
            {fieldErrors.moq && (
              <span className="text-rose-600 text-[11px] mt-1 block">{fieldErrors.moq}</span>
            )}
          </div>

          {/* Lead Time */}
          <div>
            <label className="font-bold text-[#172B4D] block mb-1">
              Lead Time (Days) *
            </label>
            <input
              type="number"
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(e.target.value)}
              placeholder="e.g. 7"
              className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg font-medium text-[#091E42] text-xs outline-none focus:border-[#0052CC]"
            />
            {fieldErrors.leadTime && (
              <span className="text-rose-600 text-[11px] mt-1 block">{fieldErrors.leadTime}</span>
            )}
          </div>

          {/* Packaging */}
          <div>
            <label className="font-bold text-[#172B4D] block mb-1">
              Packaging Format
            </label>
            <input
              type="text"
              value={packaging}
              onChange={(e) => setPackaging(e.target.value)}
              placeholder="e.g. HDPE Drum 25kg, Fiber Drum, ISO Tank"
              className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg font-medium text-[#091E42] text-xs outline-none focus:border-[#0052CC]"
            />
          </div>

          {/* Availability Status */}
          <div>
            <label className="font-bold text-[#172B4D] block mb-1">
              Offering Availability
            </label>
            <select
              value={availabilityStatus}
              onChange={(e) => setAvailabilityStatus(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg font-medium text-[#091E42] text-xs outline-none focus:border-[#0052CC]"
            >
              <option value="AVAILABLE">Available for Immediate Sourcing</option>
              <option value="MADE_TO_ORDER">Made to Order / Custom Synthesis</option>
              <option value="OUT_OF_STOCK">Temporarily Out of Stock</option>
            </select>
          </div>
        </div>
      </section>

      {/* SECTION C: PRODUCT MEDIA */}
      <section className="bg-white rounded-2xl border border-[#DFE1E6] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#DEEBFF] text-[#0052CC] font-bold text-xs flex items-center justify-center">
              C
            </span>
            <h2 className="text-sm font-extrabold text-[#091E42] uppercase tracking-wider">
              Product Images & Sample Media
            </h2>
          </div>
          <span className="text-[11px] text-[#5E6C84]">
            {stagedImages.length} of 10 images staged
          </span>
        </div>

        {/* Dropzone */}
        <div
          onClick={() => imageInputRef.current?.click()}
          className="border-2 border-dashed border-[#DFE1E6] hover:border-[#0052CC] rounded-xl p-5 text-center cursor-pointer bg-[#FAFBFC] hover:bg-[#F4F5F7] transition-all"
        >
          <input
            ref={imageInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleImageFilesSelected(e.target.files)}
          />
          <ImageIcon className="w-6 h-6 text-[#0052CC] mx-auto mb-1" />
          <span className="text-xs font-bold text-[#091E42] block">
            Click to upload product compound images
          </span>
          <span className="text-[10px] text-[#5E6C84] block mt-0.5">
            Supported: JPG, PNG, WEBP (Max 5 MB each). Star icon designates primary thumbnail.
          </span>
        </div>

        {/* Image Grid */}
        {stagedImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {stagedImages.map((img, index) => (
              <div
                key={index}
                className="relative group rounded-xl border border-[#DFE1E6] bg-white overflow-hidden p-1 shadow-2xs"
              >
                <img
                  src={img.previewUrl}
                  alt="Product preview"
                  className="w-full h-24 object-cover rounded-lg"
                />
                <div className="absolute top-2 left-2">
                  <button
                    type="button"
                    onClick={() => setPrimaryStagedImage(index)}
                    className={`p-1 rounded-md text-[10px] font-bold flex items-center gap-0.5 shadow-2xs ${
                      img.isPrimary
                        ? "bg-[#0052CC] text-white"
                        : "bg-white/90 text-[#5E6C84] hover:bg-white"
                    }`}
                  >
                    <Star className="w-3 h-3 fill-current" />
                    {img.isPrimary ? "Primary" : "Set Primary"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeStagedImage(index)}
                  className="absolute top-2 right-2 p-1 bg-white/90 hover:bg-rose-50 text-rose-600 rounded-md shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION D: DOCUMENTATION VAULT */}
      <section className="bg-white rounded-2xl border border-[#DFE1E6] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#DEEBFF] text-[#0052CC] font-bold text-xs flex items-center justify-center">
              D
            </span>
            <h2 className="text-sm font-extrabold text-[#091E42] uppercase tracking-wider">
              Technical Documentation (COA / MSDS / Specs)
            </h2>
          </div>
          <span className="text-[11px] text-[#5E6C84]">
            {stagedDocuments.length} of 10 documents staged
          </span>
        </div>

        {/* Document Uploader */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedDocCategory}
            onChange={(e) => setSelectedDocCategory(e.target.value as OfferingDocumentCategory)}
            className="px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg text-xs font-bold text-[#091E42] outline-none focus:border-[#0052CC]"
          >
            <option value="COA">Certificate of Analysis (COA)</option>
            <option value="MSDS">Material Safety Data Sheet (MSDS)</option>
            <option value="TECHNICAL_SPEC">Technical Specification Sheet</option>
            <option value="CERTIFICATION">GMP / ISO Certification</option>
            <option value="OTHER">Other Compliance Document</option>
          </select>

          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            className="px-4 py-2 bg-[#DEEBFF] hover:bg-[#B3D4FF] text-[#0052CC] text-xs font-bold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Select PDF / Document</span>
          </button>
          <input
            ref={docInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => handleDocFilesSelected(e.target.files)}
          />
        </div>

        {/* Staged Docs List */}
        {stagedDocuments.length > 0 && (
          <div className="space-y-2 pt-2">
            {stagedDocuments.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2.5 bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-[#0052CC] shrink-0" />
                  <span className="font-bold text-[#091E42] truncate">{doc.file.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EBECF0] text-[#5E6C84]">
                    {doc.category}
                  </span>
                  <span className="text-[10px] text-[#5E6C84]">
                    ({formatFileSize(doc.file.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeStagedDocument(index)}
                  className="text-rose-600 hover:text-rose-800 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION E: COMPLIANCE DECLARATIONS (MANUALLY CONTROLLED) */}
      <section className="bg-white rounded-2xl border border-[#DFE1E6] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#DEEBFF] text-[#0052CC] font-bold text-xs flex items-center justify-center">
            E
          </span>
          <h2 className="text-sm font-extrabold text-[#091E42] uppercase tracking-wider">
            Regulatory Compliance Declarations
          </h2>
        </div>
        <p className="text-xs text-[#5E6C84]">
          Explicit declarations required for buyer RFP evaluation. Checkboxes remain under your manual confirmation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#DFE1E6] hover:border-[#0052CC] cursor-pointer bg-[#FAFBFC]">
            <input
              type="checkbox"
              checked={coaAvailable}
              onChange={(e) => setCoaAvailable(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-[#0052CC] border-[#DFE1E6]"
            />
            <div>
              <span className="block text-xs font-bold text-[#091E42]">COA Available</span>
              <span className="block text-[10px] text-[#5E6C84]">
                Batch Certificate of Analysis available for every shipment
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#DFE1E6] hover:border-[#0052CC] cursor-pointer bg-[#FAFBFC]">
            <input
              type="checkbox"
              checked={msdsAvailable}
              onChange={(e) => setMsdsAvailable(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-[#0052CC] border-[#DFE1E6]"
            />
            <div>
              <span className="block text-xs font-bold text-[#091E42]">MSDS Available</span>
              <span className="block text-[10px] text-[#5E6C84]">
                GHS-compliant safety data sheets provided on demand
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#DFE1E6] hover:border-[#0052CC] cursor-pointer bg-[#FAFBFC]">
            <input
              type="checkbox"
              checked={exportReady}
              onChange={(e) => setExportReady(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-[#0052CC] border-[#DFE1E6]"
            />
            <div>
              <span className="block text-xs font-bold text-[#091E42]">Export Ready</span>
              <span className="block text-[10px] text-[#5E6C84]">
                Complies with international shipping & customs clearance
              </span>
            </div>
          </label>
        </div>
      </section>

      {/* SECTION F: OFFERING REVIEW SUMMARY & SUBMISSION */}
      <section className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#0052CC] text-white font-bold text-xs flex items-center justify-center">
            F
          </span>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-100">
            Offering Pre-Flight Summary
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-800/80 p-4 rounded-xl border border-slate-700">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Unit Price</span>
            <strong className="text-emerald-400 font-extrabold text-sm">
              {price ? `${currency} ${price}` : "Not set"}
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Grade & Purity</span>
            <span className="font-semibold text-slate-200">
              {grade} • {purity ? `${purity}%` : "Standard"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">MOQ / Lead Time</span>
            <span className="font-semibold text-slate-200">
              {moqKg} kg • {leadTimeDays} days
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Attachments</span>
            <span className="font-semibold text-slate-200">
              {stagedImages.length} images • {stagedDocuments.length} docs
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Offering will be submitted for verification and published to the Master Catalog.</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-7 py-3 bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold text-xs rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Submitting Offering...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Offering to Catalog</span>
              </>
            )}
          </button>
        </div>
      </section>
    </form>
  );
}
