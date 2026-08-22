"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Download, Trash2, Upload, AlertCircle, Loader2, RefreshCw } from "lucide-react";
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
  emptyMessage = "No documents available."
}: GenericDocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState(allowedCategories[0]?.value || "");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, [ownerType, ownerId]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const docs = await getDocuments(ownerType, ownerId);
      setDocuments(docs);
    } catch (err: any) {
      console.error("Document load error:", err);
      // For public viewers, fail gracefully to empty list rather than loud error
      if (!canUpload) {
        setDocuments([]);
      } else {
        setError("Unable to load documents.");
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
      setError(null);
      await uploadDocument(ownerType, ownerId, uploadCategory, file);
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || "Failed to upload document.");
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
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getCategoryLabel = (cat: string) => {
    return allowedCategories.find((c) => c.value === cat)?.label || cat;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
      <div className="px-6 py-5 border-b border-[#F1F5F9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0F172A]">{title}</h3>
          <p className="text-xs text-[#64748B] mt-0.5">{description}</p>
        </div>
        
        {canUpload && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {allowedCategories.length > 0 && (
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#155EEF] flex-1 sm:flex-none"
                disabled={isUploading}
              >
                {allowedCategories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
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
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || allowedCategories.length === 0}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-[#155EEF] hover:bg-[#104EC6] rounded-xl shadow-2xs disabled:opacity-70 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 mr-1.5" />
              )}
              Upload Document
            </button>
          </div>
        )}
      </div>

      <div>
        {error ? (
          <div className="mx-6 my-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
            <button
              type="button"
              onClick={loadDocuments}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 rounded-lg font-bold hover:bg-amber-100 transition-colors text-[11px]"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center p-8 text-[#94A3B8]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-xs font-medium">Checking available technical documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#64748B] leading-relaxed bg-[#F8FAFC]">
            {emptyMessage}
          </div>
        ) : (
          <ul className="divide-y divide-[#F1F5F9]">
            {documents.map((doc) => (
              <li key={doc.id} className="p-4 sm:px-6 hover:bg-[#F8FAFC] transition-colors flex items-center justify-between group">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#EFF4FF] text-[#155EEF] rounded-xl shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A] break-all line-clamp-1">
                      {doc.originalFileName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#64748B]">
                      <span className="font-semibold text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded-md">
                        {getCategoryLabel(doc.category)}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(doc.id, doc.originalFileName)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#155EEF] bg-[#EFF4FF] hover:bg-[#DBEAFE] rounded-xl transition-colors"
                    title="Download Document"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
