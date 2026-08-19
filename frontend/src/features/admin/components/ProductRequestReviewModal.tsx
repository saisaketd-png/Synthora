"use client";

import { useState } from "react";
import { X, CheckCircle2, XCircle, AlertCircle, Building2, FlaskConical, HelpCircle, GitMerge } from "lucide-react";
import { ProductRequest } from "@/features/supplier-products/api/masterCatalogApi";
import { ApproveRequestPayload, ApproveAndLinkPayload } from "../api/adminCatalogApi";

interface ProductRequestReviewModalProps {
  request: ProductRequest;
  onApprove: (id: string, payload: ApproveRequestPayload) => Promise<void>;
  onApproveAndLink?: (id: string, payload: ApproveAndLinkPayload) => Promise<void>;
  onRequestInfo?: (request: ProductRequest) => void;
  onReject: (id: string, reason: string) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export function ProductRequestReviewModal({
  request,
  onApprove,
  onApproveAndLink,
  onRequestInfo,
  onReject,
  onClose,
  isLoading = false,
}: ProductRequestReviewModalProps) {
  const [mode, setMode] = useState<"VIEW" | "APPROVE" | "LINK" | "REJECT">("VIEW");
  const [canonicalName, setCanonicalName] = useState(request.proposedName);
  const [casNumber, setCasNumber] = useState(request.casNumber || "");
  const [molecularFormula, setMolecularFormula] = useState(request.molecularFormula || "");
  const [category, setCategory] = useState(request.category);
  const [description, setDescription] = useState(request.description || "");
  const [existingMpId, setExistingMpId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onApprove(request.id, {
        canonicalName: canonicalName.trim(),
        casNumber: casNumber.trim() || undefined,
        molecularFormula: molecularFormula.trim() || undefined,
        category,
        description: description.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || "Failed to approve request.");
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!existingMpId.trim() || !onApproveAndLink) {
      setError("Please provide an existing Master Product UUID to link.");
      return;
    }
    try {
      await onApproveAndLink(request.id, {
        existingMasterProductId: existingMpId.trim(),
        adminNotes: "Linked proposal to existing MasterProduct",
      });
    } catch (err: any) {
      setError(err.message || "Failed to link request.");
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejecting this proposal.");
      return;
    }
    try {
      await onReject(request.id, rejectionReason.trim());
    } catch (err: any) {
      setError(err.message || "Failed to reject request.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Review Chemical Request</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-rose-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Supplier Context */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1.5 text-xs text-blue-950">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Requesting Supplier: {request.supplierName}</span>
            </div>
            {request.supplierMessage && (
              <p className="text-slate-700 italic">
                &quot;{request.supplierMessage}&quot;
              </p>
            )}
          </div>

          {mode === "VIEW" && (
            <div className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Proposed Name</span>
                  <strong className="text-slate-900 font-bold text-sm">{request.proposedName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                  <strong className="text-slate-900 font-bold">{request.category.replace("_", " ")}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">CAS Number</span>
                  <strong className="text-slate-900 font-bold">{request.casNumber || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Molecular Formula</span>
                  <strong className="text-slate-900 font-bold">{request.molecularFormula || "N/A"}</strong>
                </div>
              </div>

              {request.description && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Description</span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {request.description}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onRequestInfo && onRequestInfo(request)}
                    className="px-3.5 py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    Request Information
                  </button>
                  {onApproveAndLink && (
                    <button
                      type="button"
                      onClick={() => setMode("LINK")}
                      className="px-3.5 py-2 bg-purple-50 text-purple-800 hover:bg-purple-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <GitMerge className="w-4 h-4 text-purple-600" />
                      Link to Existing MP
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("REJECT")}
                    className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("APPROVE")}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Create MP
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === "LINK" && (
            <form onSubmit={handleLinkSubmit} className="space-y-4 text-xs font-medium">
              <h4 className="text-sm font-extrabold text-slate-900">Link Proposal to Existing Canonical Master Product</h4>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Existing Master Product UUID *</label>
                <input
                  type="text"
                  required
                  value={existingMpId}
                  onChange={(e) => setExistingMpId(e.target.value)}
                  placeholder="Paste existing MasterProduct UUID"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMode("VIEW")}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {isLoading ? "Linking..." : "Confirm & Link"}
                </button>
              </div>
            </form>
          )}

          {mode === "APPROVE" && (
            <form onSubmit={handleApproveSubmit} className="space-y-4 text-xs font-medium">
              <h4 className="text-sm font-extrabold text-slate-900">Configure Canonical Master Product</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Canonical Chemical Name *</label>
                  <input
                    type="text"
                    required
                    value={canonicalName}
                    onChange={(e) => setCanonicalName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="API">API</option>
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="EXCIPIENT">EXCIPIENT</option>
                    <option value="SOLVENT">SOLVENT</option>
                    <option value="SPECIALTY_CHEMICAL">SPECIALTY CHEMICAL</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CAS Registry Number</label>
                  <input
                    type="text"
                    value={casNumber}
                    onChange={(e) => setCasNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Molecular Formula</label>
                  <input
                    type="text"
                    value={molecularFormula}
                    onChange={(e) => setMolecularFormula(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMode("VIEW")}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {isLoading ? "Creating..." : "Confirm & Create Master Product"}
                </button>
              </div>
            </form>
          )}

          {mode === "REJECT" && (
            <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs font-medium">
              <h4 className="text-sm font-extrabold text-slate-900 text-rose-800">Reject Chemical Request</h4>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Rejection Feedback *</label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide explicit feedback for the requesting supplier..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMode("VIEW")}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {isLoading ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
