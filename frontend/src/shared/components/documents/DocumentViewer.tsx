import React, { useState } from "react";
import { DocumentResponse, downloadDocument } from "@/features/documents/api/documentApi";
import { DocumentStatusBadge } from "./DocumentStatusBadge";

interface DocumentViewerProps {
  document: DocumentResponse;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onClose }) => {
  const [downloading, setDownloading] = useState(false);

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

  const isPdf =
    document.mimeType?.includes("pdf") || document.originalFileName.toLowerCase().endsWith(".pdf");
  const isImage =
    document.mimeType?.includes("image") ||
    document.originalFileName.toLowerCase().endsWith(".png") ||
    document.originalFileName.toLowerCase().endsWith(".jpg") ||
    document.originalFileName.toLowerCase().endsWith(".jpeg");

  // Since we use secure authenticated endpoint for content, generate secure download url or stream preview
  const streamUrl = `/api/v1/documents/${document.id}/download`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-md">
              {document.originalFileName}
            </h3>
            {document.version && (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                v{document.version}
              </span>
            )}
            <DocumentStatusBadge status={document.expiryStatus} isActive={document.isActive} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg transition-colors"
            >
              {downloading ? "Downloading..." : "Download Original"}
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 p-4 flex items-center justify-center overflow-hidden">
          {isPdf ? (
            <iframe
              src={streamUrl}
              title={document.originalFileName}
              className="w-full h-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white"
            />
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={streamUrl}
                alt={document.originalFileName}
                className="max-w-full max-h-full object-contain rounded-xl shadow-md"
              />
            </div>
          ) : (
            <div className="text-center p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-md">
              <div className="text-4xl mb-3">📄</div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                Preview Not Supported
              </h4>
              <p className="text-xs text-zinc-500 mb-4">
                This file type cannot be previewed in browser. Please download the original file to view its contents.
              </p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl"
              >
                Download Document
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <div>Category: {document.category}</div>
          {document.checksum && (
            <div className="font-mono text-[11px] truncate max-w-sm">
              SHA-256: {document.checksum}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
