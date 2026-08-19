"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Download, Trash2, Upload, AlertCircle, Loader2 } from "lucide-react";
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
      console.error(err);
      setError("Failed to load documents.");
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
    if (!confirm("Are you sure you want to delete this document?")) return;
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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-8">
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        
        {canUpload && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {allowedCategories.length > 0 && (
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent flex-1 sm:flex-none"
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
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm shadow-purple-200 disabled:opacity-70 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload
            </button>
          </div>
        )}
      </div>

      <div className="p-0">
        {error ? (
          <div className="mx-6 my-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{error}</div>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center p-12 text-slate-500 text-sm">
            {emptyMessage}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <li key={doc.id} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 break-all line-clamp-1">
                      {doc.originalFileName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {getCategoryLabel(doc.category)}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(doc.id, doc.originalFileName)}
                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
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
