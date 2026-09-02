"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Download,
  Trash2,
  Upload,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import {
  DocumentResponse,
  getDocuments,
  uploadDocument,
  deleteDocument,
  downloadDocument,
} from "../api/documentApi";

export interface CategoryOption {
  value: string;
  label: string;
}

export interface GenericDocumentManagerProps {
  title: string;
  description: string;
  ownerType: string;
  ownerId: string;
  canUpload: boolean;
  canDelete: boolean;
  allowedCategories: CategoryOption[];
  emptyMessage?: string;
}

export function GenericDocumentManager({
  title,
  description,
  ownerType,
  ownerId,
  canUpload,
  canDelete,
  allowedCategories,
  emptyMessage = "No documents attached to this dossier.",
}: GenericDocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState(allowedCategories[0]?.value || "");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!uploadCategory && allowedCategories.length > 0) {
      setUploadCategory(allowedCategories[0].value);
    }
  }, [allowedCategories, uploadCategory]);

  useEffect(() => {
    loadDocuments();
  }, [ownerType, ownerId]);

  const loadDocuments = async () => {
    if (!ownerType || !ownerId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const docs = await getDocuments(ownerType, ownerId);
      setDocuments(docs);
    } catch (err: any) {
      console.error("Document load error:", err);
      if (!canUpload) {
        setDocuments([]);
      } else {
        setError("Unable to load documents. Please check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(20);
      setError(null);
      setUploadSuccess(null);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 150);

      const categoryToUse = uploadCategory || allowedCategories[0]?.value || "TECHNICAL_SPECIFICATION";
      await uploadDocument(ownerType, ownerId, categoryToUse, file);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(`"${file.name}" uploaded successfully.`);

      await loadDocuments();

      setTimeout(() => {
        setUploadSuccess(null);
        setUploadProgress(0);
      }, 3500);
    } catch (err: any) {
      setError(err.message || "Failed to upload document.");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      setError(null);
      await deleteDocument(documentId);
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || "Failed to delete document.");
    }
  };

  const handleDownload = async (documentId: string, filename: string) => {
    try {
      setError(null);
      await downloadDocument(documentId, filename);
    } catch (err: any) {
      setError(err.message || "Failed to download document.");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const getCategoryLabel = (cat: string) => {
    return allowedCategories.find((c) => c.value === cat)?.label || cat.replace(/_/g, " ");
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-2xs h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#FAFBFC] space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1B33] font-mono">
              {title}
            </h3>
            <p className="text-[11px] text-[#526581] mt-0.5">{description}</p>
          </div>

          {canUpload && (
            <div className="flex items-center gap-2 w-full pt-1 flex-wrap sm:flex-nowrap">
              {allowedCategories.length > 1 && (
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg font-medium text-[#0B1B33] focus:outline-none focus:border-[#0052CC] flex-1 min-w-[140px] truncate"
                  disabled={isUploading}
                >
                  {allowedCategories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || allowedCategories.length === 0}
                className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0052CC] hover:bg-[#0747A6] rounded-lg shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed transition-all whitespace-nowrap cursor-pointer shrink-0"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    <span>Upload Document</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Progress & Notifications */}
        {isUploading && (
          <div className="p-4 bg-[#FAFBFC] border-b border-[#E2E8F0] space-y-2">
            <div className="flex justify-between text-xs font-medium text-[#0B1B33]">
              <span>Uploading document...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#0052CC] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3 bg-[#E3FCEF] border-b border-[#ABF5D1] flex items-center gap-2 text-[#006644] text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>✓ {uploadSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3 text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
            <button
              type="button"
              onClick={loadDocuments}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 rounded-md font-bold hover:bg-amber-100 transition-colors text-[11px] cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* Document List */}
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-[#526581]">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-xs font-medium">Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#526581] leading-relaxed bg-[#FAFBFC]">
              {emptyMessage}
            </div>
          ) : (
            <ul className="divide-y divide-[#E2E8F0]">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="p-3.5 sm:px-5 hover:bg-[#FAFBFC] transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-[#DEEBFF] text-[#0052CC] rounded-lg shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-semibold text-[#0B1B33] truncate">
                          {doc.originalFileName}
                        </h4>
                        {doc.version && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            v{doc.version}
                          </span>
                        )}
                        {doc.expiryStatus && doc.expiryStatus !== "NO_EXPIRY" && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                              doc.expiryStatus === "VALID"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : doc.expiryStatus === "EXPIRING_SOON"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {doc.expiryStatus === "VALID" ? "Valid" : doc.expiryStatus === "EXPIRING_SOON" ? "Expiring Soon" : "Expired"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#526581] flex-wrap">
                        <span className="font-semibold text-[#0B1B33] bg-[#F4F5F7] px-1.5 py-0.5 rounded text-[10px]">
                          {getCategoryLabel(doc.category)}
                        </span>
                        <span>•</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.createdAt)}</span>
                        {doc.checksum && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[9px] text-zinc-400" title={`SHA-256: ${doc.checksum}`}>
                              SHA-256: {doc.checksum.substring(0, 8)}...
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownload(doc.id, doc.originalFileName)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#0052CC] hover:bg-[#DEEBFF]/40 rounded-md transition-colors cursor-pointer"
                      title="Download Document"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-[#526581] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
