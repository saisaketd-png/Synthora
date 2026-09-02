import React, { useEffect, useState } from "react";
import {
  DocumentResponse,
  getDocuments,
  deactivateDocument,
  DocumentExpiryStatus,
} from "@/features/documents/api/documentApi";
import { DocumentCard } from "./DocumentCard";
import { DocumentVersionHistory } from "./DocumentVersionHistory";
import { DocumentViewer } from "./DocumentViewer";
import { DocumentUpload } from "./DocumentUpload";

interface DocumentListProps {
  ownerType: string;
  ownerId: string;
  title?: string;
  description?: string;
  canUpload?: boolean;
  canManage?: boolean;
  availableCategories?: { value: string; label: string }[];
  defaultCategory?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  ownerType,
  ownerId,
  title = "Documents & Compliance Records",
  description = "Governed platform documents with cryptographic integrity and version history",
  canUpload = true,
  canManage = true,
  availableCategories,
  defaultCategory,
}) => {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [includeHistory, setIncludeHistory] = useState(false);

  // Modals & Panels
  const [showUpload, setShowUpload] = useState(false);
  const [selectedGroupIdForHistory, setSelectedGroupIdForHistory] = useState<string | null>(null);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<DocumentResponse | null>(null);
  const [documentToRevise, setDocumentToRevise] = useState<DocumentResponse | null>(null);

  useEffect(() => {
    loadDocs();
  }, [ownerType, ownerId, includeHistory]);

  const loadDocs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDocuments(ownerType, ownerId, includeHistory);
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (documentId: string) => {
    try {
      await deactivateDocument(documentId);
      await loadDocs();
    } catch (err: any) {
      alert(err.message || "Failed to deactivate document");
    }
  };

  const handleUploadSuccess = (newDoc: DocumentResponse) => {
    setShowUpload(false);
    setDocumentToRevise(null);
    loadDocs();
  };

  const handleUploadNewVersion = (doc: DocumentResponse) => {
    setDocumentToRevise(doc);
    setShowUpload(true);
  };

  // Filtered docs
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      search.trim() === "" ||
      doc.originalFileName.toLowerCase().includes(search.toLowerCase()) ||
      doc.documentNumber?.toLowerCase().includes(search.toLowerCase()) ||
      doc.description?.toLowerCase().includes(search.toLowerCase()) ||
      doc.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === "ALL" || doc.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter !== "ALL") {
      if (statusFilter === "ACTIVE") matchesStatus = doc.isActive === true;
      else if (statusFilter === "INACTIVE") matchesStatus = doc.isActive === false;
      else matchesStatus = doc.expiryStatus === statusFilter;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categoriesInDocs = Array.from(new Set(documents.map((d) => d.category)));

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>

        {canUpload && !showUpload && (
          <button
            onClick={() => {
              setDocumentToRevise(null);
              setShowUpload(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm"
          >
            <span>+</span>
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* Upload Panel */}
      {showUpload && (
        <DocumentUpload
          ownerType={ownerType}
          ownerId={ownerId}
          availableCategories={availableCategories}
          defaultCategory={defaultCategory}
          existingDocumentToRevise={documentToRevise}
          onSuccess={handleUploadSuccess}
          onCancel={() => {
            setShowUpload(false);
            setDocumentToRevise(null);
          }}
        />
      )}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename, document #, description..."
            className="w-full text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {categoriesInDocs.length > 1 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Categories</option>
            {categoriesInDocs.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        )}

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">All Expiry Statuses</option>
          <option value="VALID">Valid & Active</option>
          <option value="EXPIRING_SOON">Expiring Soon (≤30d)</option>
          <option value="EXPIRED">Expired</option>
          <option value="NO_EXPIRY">Perpetual / No Expiry</option>
        </select>

        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={includeHistory}
            onChange={(e) => setIncludeHistory(e.target.checked)}
            className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500"
          />
          <span>Show Archived / Replaced</span>
        </label>
      </div>

      {/* Content */}
      {loading && (
        <div className="py-16 text-center text-zinc-400 text-sm">
          Loading document repository...
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-sm rounded-xl border border-rose-200 dark:border-rose-800">
          {error}
        </div>
      )}

      {!loading && !error && filteredDocuments.length === 0 && (
        <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
          <div className="text-4xl mb-3">📁</div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            No Documents Found
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
            {search || categoryFilter !== "ALL" || statusFilter !== "ALL"
              ? "No documents match the current search filters."
              : "No compliance or commercial documents attached yet."}
          </p>
          {canUpload && (
            <button
              onClick={() => setShowUpload(true)}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm"
            >
              Upload First Document
            </button>
          )}
        </div>
      )}

      {!loading && !error && filteredDocuments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              canManage={canManage}
              onViewVersions={(groupId) => setSelectedGroupIdForHistory(groupId)}
              onPreview={(d) => setSelectedDocForPreview(d)}
              onDeactivate={handleDeactivate}
              onUploadNewVersion={handleUploadNewVersion}
            />
          ))}
        </div>
      )}

      {/* Version History Modal */}
      {selectedGroupIdForHistory && (
        <DocumentVersionHistory
          documentGroupId={selectedGroupIdForHistory}
          onClose={() => setSelectedGroupIdForHistory(null)}
          onPreview={(d) => setSelectedDocForPreview(d)}
        />
      )}

      {/* Preview Modal */}
      {selectedDocForPreview && (
        <DocumentViewer
          document={selectedDocForPreview}
          onClose={() => setSelectedDocForPreview(null)}
        />
      )}
    </div>
  );
};
