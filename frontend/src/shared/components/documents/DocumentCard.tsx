import React from "react";
import { DocumentResponse, downloadDocument } from "@/features/documents/api/documentApi";
import { DocumentStatusBadge } from "./DocumentStatusBadge";

interface DocumentCardProps {
  document: DocumentResponse;
  onViewVersions?: (documentGroupId: string) => void;
  onDeactivate?: (documentId: string) => void;
  onPreview?: (document: DocumentResponse) => void;
  onUploadNewVersion?: (document: DocumentResponse) => void;
  canManage?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onViewVersions,
  onDeactivate,
  onPreview,
  onUploadNewVersion,
  canManage = false,
}) => {
  const [downloading, setDownloading] = React.useState(false);
  const [deactivating, setDeactivating] = React.useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatCategory = (cat: string) => {
    return cat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadDocument(document.id, document.originalFileName);
    } catch (err: any) {
      alert(err.message || "Failed to download document");
    } finally {
      setDownloading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm(`Are you sure you want to deactivate "${document.originalFileName}"? It will be archived for audit.`)) {
      return;
    }
    try {
      setDeactivating(true);
      if (onDeactivate) {
        await onDeactivate(document.id);
      }
    } finally {
      setDeactivating(false);
    }
  };

  const isPdfOrImage =
    document.mimeType?.includes("pdf") ||
    document.mimeType?.includes("image") ||
    document.originalFileName.toLowerCase().endsWith(".pdf") ||
    document.originalFileName.toLowerCase().endsWith(".png") ||
    document.originalFileName.toLowerCase().endsWith(".jpg");

  return (
    <div className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {formatCategory(document.category)}
            </span>
            {document.version && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                v{document.version}
              </span>
            )}
          </div>
          <DocumentStatusBadge status={document.expiryStatus} isActive={document.isActive} />
        </div>

        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate mb-1" title={document.originalFileName}>
          {document.originalFileName}
        </h4>

        {document.description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">
            {document.description}
          </p>
        )}

        <div className="space-y-1 my-3 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
          {document.documentNumber && (
            <div className="flex justify-between">
              <span className="text-zinc-400">Doc #:</span>
              <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[160px]">{document.documentNumber}</span>
            </div>
          )}
          {document.issuingAuthority && (
            <div className="flex justify-between">
              <span className="text-zinc-400">Issuer:</span>
              <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[160px]">{document.issuingAuthority}</span>
            </div>
          )}
          {document.expiryDate && (
            <div className="flex justify-between">
              <span className="text-zinc-400">Expires:</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{document.expiryDate}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-400">Size:</span>
            <span>{formatFileSize(document.fileSize)}</span>
          </div>
          {document.checksum && (
            <div className="flex justify-between items-center" title={`SHA-256 Checksum: ${document.checksum}`}>
              <span className="text-zinc-400">SHA-256:</span>
              <span className="font-mono text-[10px] text-zinc-500 max-w-[130px] truncate">{document.checksum}</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-1.5">
          {isPdfOrImage && onPreview && (
            <button
              onClick={() => onPreview(document)}
              className="px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            >
              Preview
            </button>
          )}
          {document.documentGroupId && onViewVersions && (
            <button
              onClick={() => onViewVersions(document.documentGroupId!)}
              className="px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors"
            >
              Versions
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {canManage && document.isActive && onUploadNewVersion && (
            <button
              onClick={() => onUploadNewVersion(document)}
              title="Upload new version of this document"
              className="px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded transition-colors"
            >
              New Version
            </button>
          )}
          {canManage && document.isActive && onDeactivate && (
            <button
              onClick={handleDeactivate}
              disabled={deactivating}
              title="Soft deactivate document"
              className="px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors disabled:opacity-50"
            >
              {deactivating ? "Archiving..." : "Archive"}
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-3 py-1 text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded transition-colors disabled:opacity-50"
          >
            {downloading ? "Downloading..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
};
