import React, { useState, useRef } from "react";
import { uploadDocument, DocumentResponse } from "@/features/documents/api/documentApi";

interface DocumentUploadProps {
  ownerType: string;
  ownerId: string;
  defaultCategory?: string;
  availableCategories?: { value: string; label: string }[];
  targetLineageGroupId?: string;
  existingDocumentToRevise?: DocumentResponse | null;
  onSuccess: (document: DocumentResponse) => void;
  onCancel?: () => void;
}

const DEFAULT_CATEGORIES = [
  { value: "GST_CERTIFICATE", label: "GST Registration Certificate" },
  { value: "PAN_CARD", label: "PAN Card" },
  { value: "COMPANY_LICENSE", label: "Company Incorporation / Business License" },
  { value: "ISO_CERTIFICATE", label: "ISO / Quality Management Certificate" },
  { value: "GMP_CERTIFICATE", label: "GMP (Good Manufacturing Practice)" },
  { value: "REACH_COMPLIANCE", label: "REACH Compliance Certificate" },
  { value: "DRUG_LICENSE", label: "Drug / Manufacturing License" },
  { value: "FACTORY_LICENSE", label: "Factory / Operational License" },
  { value: "POLLUTION_CLEARANCE", label: "Pollution Control Board NOC" },
  { value: "TECHNICAL_DATA_SHEET", label: "Technical Data Sheet (TDS)" },
  { value: "SAFETY_DATA_SHEET", label: "Safety Data Sheet (MSDS/SDS)" },
  { value: "CERTIFICATE_OF_ANALYSIS", label: "Certificate of Analysis (COA)" },
  { value: "HALAL_CERTIFICATE", label: "Halal Certification" },
  { value: "KOSHER_CERTIFICATE", label: "Kosher Certification" },
  { value: "COMMERCIAL_INVOICE", label: "Commercial Invoice" },
  { value: "PACKING_LIST", label: "Packing List" },
  { value: "PURCHASE_ORDER", label: "Purchase Order Attachment" },
  { value: "RFQ_ATTACHMENT", label: "RFQ Specification Attachment" },
  { value: "QUOTATION_ATTACHMENT", label: "Quotation Spec Attachment" },
  { value: "DELIVERY_CONFIRMATION", label: "Delivery Confirmation / Proof of Delivery" },
  { value: "OTHER", label: "Other Governed Document" },
];

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  ownerType,
  ownerId,
  defaultCategory,
  availableCategories = DEFAULT_CATEGORIES,
  targetLineageGroupId,
  existingDocumentToRevise,
  onSuccess,
  onCancel,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>(
    existingDocumentToRevise?.category || defaultCategory || availableCategories[0]?.value || "OTHER"
  );
  const [documentNumber, setDocumentNumber] = useState<string>(existingDocumentToRevise?.documentNumber || "");
  const [issuingAuthority, setIssuingAuthority] = useState<string>(existingDocumentToRevise?.issuingAuthority || "");
  const [issueDate, setIssueDate] = useState<string>(existingDocumentToRevise?.issueDate || "");
  const [expiryDate, setExpiryDate] = useState<string>(existingDocumentToRevise?.expiryDate || "");
  const [description, setDescription] = useState<string>(
    existingDocumentToRevise ? `Updated revision of ${existingDocumentToRevise.originalFileName}` : ""
  );

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    // Platform file size validation check (10MB default)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File exceeds maximum allowed size of 10 MB.");
      return;
    }
    // Extension validation
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    const disallowed = ["exe", "bat", "cmd", "sh", "php", "js", "html", "svg", "vbs", "msi"];
    if (ext && disallowed.includes(ext)) {
      setError(`File format .${ext} is restricted for security reasons.`);
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const resolvedGroupId =
        targetLineageGroupId || existingDocumentToRevise?.documentGroupId || undefined;

      const doc = await uploadDocument({
        ownerType,
        ownerId,
        category,
        file,
        documentGroupId: resolvedGroupId,
        documentNumber: documentNumber.trim() || undefined,
        issuingAuthority: issuingAuthority.trim() || undefined,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
        description: description.trim() || undefined,
      });

      onSuccess(doc);
    } catch (err: any) {
      setError(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {existingDocumentToRevise ? "Upload New Document Version" : "Upload Document"}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {existingDocumentToRevise
              ? `Revising "${existingDocumentToRevise.originalFileName}" (will become v${(existingDocumentToRevise.version || 1) + 1})`
              : "Secure enterprise document upload with cryptographic SHA-256 integrity"}
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drop zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
              : file
              ? "border-emerald-400 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/10"
              : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/40"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            onChange={handleChange}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
          />

          {file ? (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold mb-2">
                ✓
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-md">
                {file.name}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {(file.size / (1024 * 1024)).toFixed(2)} MB — Click or drag to replace
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 mb-2">
                📁
              </div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Click to browse or drag & drop files here
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Supported formats: PDF, PNG, JPG, DOCX, XLSX (up to 10MB)
              </p>
            </div>
          )}
        </div>

        {/* Metadata Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Document Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={!!existingDocumentToRevise}
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
            >
              {availableCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Document / Certificate Number
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="e.g. 27AAAAA0000A1Z5"
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Issuing Authority
            </label>
            <input
              type="text"
              value={issuingAuthority}
              onChange={(e) => setIssuingAuthority(e.target.value)}
              placeholder="e.g. Govt of India / ISO Registrar"
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Notes / Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Additional context or revision remarks..."
            className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!file || uploading}
            className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            {uploading ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                <span>Uploading & Generating SHA-256...</span>
              </>
            ) : existingDocumentToRevise ? (
              "Submit Revision"
            ) : (
              "Upload Document"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
