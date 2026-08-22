"use client";

import { useState, useEffect, useCallback } from "react";
import { X, CheckCircle2, XCircle, AlertCircle, Building2, FlaskConical, HelpCircle, GitMerge, Search, Check, RefreshCw } from "lucide-react";
import { ProductRequest, MasterProduct, searchMasterProducts } from "@/features/supplier-products/api/masterCatalogApi";
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
  
  // Link to Existing Master Product State
  const [searchQuery, setSearchQuery] = useState(request.casNumber || request.proposedName || "");
  const [searchResults, setSearchResults] = useState<MasterProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMasterProduct, setSelectedMasterProduct] = useState<MasterProduct | null>(null);

  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Search master products when entering LINK mode or changing query
  const executeMasterProductSearch = useCallback(async (query: string) => {
    try {
      setIsSearching(true);
      const results = await searchMasterProducts(query);
      setSearchResults(results.filter((mp) => mp.status === "ACTIVE"));
    } catch (e: any) {
      console.error("Failed to search master products for linking:", e);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (mode === "LINK") {
      executeMasterProductSearch(searchQuery);
    }
  }, [mode, executeMasterProductSearch, searchQuery]);

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
    if (!selectedMasterProduct || !onApproveAndLink) {
      setError("Please select an existing Master Product from the list below.");
      return;
    }
    try {
      await onApproveAndLink(request.id, {
        existingMasterProductId: selectedMasterProduct.id,
        adminNotes: `Linked proposal '${request.proposedName}' to canonical Master Product ${selectedMasterProduct.masterProductCode} (${selectedMasterProduct.name})`,
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

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === "VIEW" && (
            <div className="space-y-6">
              {/* Proposal Details */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Supplier Proposed Chemical
                  </span>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">
                    {request.status.replace("_", " ")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Proposed Name:</span>
                    <strong className="text-slate-900 font-bold text-sm">{request.proposedName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Category:</span>
                    <strong className="text-slate-900 font-bold">{request.category}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">CAS Number:</span>
                    <strong className="text-slate-900 font-mono">{request.casNumber || "Not Specified"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Molecular Formula:</span>
                    <strong className="text-slate-900 font-mono">{request.molecularFormula || "Not Specified"}</strong>
                  </div>
                </div>
                {request.description && (
                  <div className="text-xs pt-2 border-t border-slate-200/60">
                    <span className="text-slate-500 block mb-0.5">Description:</span>
                    <p className="text-slate-700">{request.description}</p>
                  </div>
                )}
                {request.supplierMessage && (
                  <div className="text-xs pt-2 border-t border-slate-200/60">
                    <span className="text-slate-500 block mb-0.5">Supplier Message:</span>
                    <p className="text-slate-700 italic">&ldquo;{request.supplierMessage}&rdquo;</p>
                  </div>
                )}
                <div className="text-xs pt-2 border-t border-slate-200/60 flex items-center justify-between text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Submitted by: <strong>{request.supplierName}</strong></span>
                  </div>
                  <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {onRequestInfo && (
                  <button
                    type="button"
                    onClick={() => onRequestInfo(request)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-500" />
                    Request Info
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  {onApproveAndLink && (
                    <button
                      type="button"
                      onClick={() => setMode("LINK")}
                      className="px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-purple-200"
                    >
                      <GitMerge className="w-4 h-4 text-purple-600" />
                      Link to Existing
                    </button>
                  )}
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
                    Approve & Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === "LINK" && (
            <form onSubmit={handleLinkSubmit} className="space-y-5 text-xs font-medium">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-purple-600" />
                  Select Existing Canonical Master Product
                </h4>
                <p className="text-slate-500 text-xs mt-0.5">
                  Link this proposal to an already verified Master Product. The supplier will be notified with the canonical code.
                </p>
              </div>

              {/* If a MasterProduct is already selected, show confirmation card */}
              {selectedMasterProduct ? (
                <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-purple-700" /> Selected Master Product
                    </span>
                    <span className="px-2.5 py-0.5 bg-purple-600 text-white font-mono text-[10px] font-bold rounded-lg uppercase">
                      {selectedMasterProduct.masterProductCode}
                    </span>
                  </div>
                  <div>
                    <h5 className="text-base font-extrabold text-slate-900">{selectedMasterProduct.name}</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">CAS Number</span>
                        <strong className="text-slate-800 font-mono">{selectedMasterProduct.casNumber || "N/A"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Formula</span>
                        <strong className="text-slate-800 font-mono">{selectedMasterProduct.molecularFormula || "N/A"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Category</span>
                        <strong className="text-slate-800">{selectedMasterProduct.category}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedMasterProduct(null)}
                      className="text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline"
                    >
                      ← Change Selection
                    </button>
                    <span className="text-[11px] text-purple-600 font-medium">Ready to link</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Search Canonical Catalog
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          executeMasterProductSearch(e.target.value);
                        }}
                        placeholder="Search by product name, CAS, code (e.g. API-MP-696203), formula..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-xs"
                      />
                    </div>
                  </div>

                  {/* Results List */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
                    {isSearching ? (
                      <div className="p-6 text-center text-slate-400 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                        <span>Searching catalog...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((mp) => (
                        <div
                          key={mp.id}
                          onClick={() => setSelectedMasterProduct(mp)}
                          className="p-3 hover:bg-purple-50/50 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <strong className="text-slate-900 font-bold group-hover:text-purple-700 transition-colors">
                                {mp.name}
                              </strong>
                              <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-[9px] font-bold rounded">
                                {mp.masterProductCode}
                              </span>
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded">
                                {mp.category}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-3">
                              <span>CAS: <strong>{mp.casNumber || "N/A"}</strong></span>
                              {mp.molecularFormula && (
                                <span>Formula: <strong>{mp.molecularFormula}</strong></span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMasterProduct(mp);
                            }}
                            className="px-3 py-1 bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white rounded-lg text-xs font-bold transition-colors shrink-0"
                          >
                            Select
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-400">
                        No active Master Products matched &quot;{searchQuery}&quot;. Try searching another name, CAS, or formula.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMasterProduct(null);
                    setMode("VIEW");
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !selectedMasterProduct}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
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
