import React, { useEffect, useState } from "react";
import { DocumentResponse, getDocumentVersions, downloadDocument } from "@/features/documents/api/documentApi";
import { DocumentStatusBadge } from "./DocumentStatusBadge";

interface DocumentVersionHistoryProps {
  documentGroupId: string;
  onClose: () => void;
  onPreview?: (doc: DocumentResponse) => void;
}

export const DocumentVersionHistory: React.FC<DocumentVersionHistoryProps> = ({
  documentGroupId,
  onClose,
  onPreview,
}) => {
  const [versions, setVersions] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [documentGroupId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDocumentVersions(documentGroupId);
      setVersions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load version history");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Document Version History</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Lineage Group: <span className="font-mono text-[11px]">{documentGroupId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading && (
            <div className="py-12 text-center text-zinc-400 text-sm">
              Loading revision lineage...
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          {!loading && versions.length === 0 && (
            <div className="py-12 text-center text-zinc-400 text-sm">
              No version history found for this lineage.
            </div>
          )}

          {!loading && versions.length > 0 && (
            <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 space-y-6">
              {versions.map((ver, idx) => (
                <div key={ver.id} className="relative pl-6">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ${
                      ver.isActive
                        ? "bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-950"
                        : "bg-zinc-400 dark:bg-zinc-600"
                    }`}
                  />

                  <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          Version {ver.version || (versions.length - idx)}
                        </span>
                        {ver.isActive ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                            Current Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                            Historical / Replaced
                          </span>
                        )}
                      </div>
                      <DocumentStatusBadge status={ver.expiryStatus} isActive={ver.isActive} />
                    </div>

                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate mb-1">
                      {ver.originalFileName}
                    </p>

                    {ver.description && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                        {ver.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 my-2">
                      <div>Uploaded: {new Date(ver.createdAt).toLocaleDateString()}</div>
                      <div>Size: {formatFileSize(ver.fileSize)}</div>
                      {ver.documentNumber && <div>Doc #: {ver.documentNumber}</div>}
                      {ver.expiryDate && <div>Expires: {ver.expiryDate}</div>}
                    </div>

                    {ver.checksum && (
                      <div className="text-[10px] font-mono text-zinc-400 bg-white dark:bg-zinc-900/80 p-1.5 rounded border border-zinc-100 dark:border-zinc-800 truncate">
                        SHA-256: {ver.checksum}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-end gap-2">
                      {onPreview && (
                        <button
                          onClick={() => onPreview(ver)}
                          className="px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                        >
                          Preview
                        </button>
                      )}
                      <button
                        onClick={() => downloadDocument(ver.id, ver.originalFileName)}
                        className="px-3 py-1 text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
