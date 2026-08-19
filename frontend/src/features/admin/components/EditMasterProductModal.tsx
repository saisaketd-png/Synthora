"use client";

import { useState } from "react";
import { X, Edit3, AlertCircle } from "lucide-react";
import { MasterProduct } from "@/features/supplier-products/api/masterCatalogApi";
import { UpdateMasterProductPayload } from "@/features/admin/api/adminCatalogApi";

interface Props {
  product: MasterProduct;
  onUpdate: (id: string, payload: UpdateMasterProductPayload) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

export function EditMasterProductModal({ product, onUpdate, onClose, isLoading }: Props) {
  const [name, setName] = useState(product.name);
  const [casNumber, setCasNumber] = useState(product.casNumber || "");
  const [molecularFormula, setMolecularFormula] = useState(product.molecularFormula || "");
  const [category, setCategory] = useState(product.category);
  const [description, setDescription] = useState(product.description || "");
  const [status, setStatus] = useState(product.status);
  const [updateReason, setUpdateReason] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErr("Chemical name is required");
      return;
    }
    try {
      setErr(null);
      await onUpdate(product.id, {
        name: name.trim(),
        casNumber: casNumber.trim() || undefined,
        molecularFormula: molecularFormula.trim() || undefined,
        category,
        description: description.trim() || undefined,
        status,
        updateReason: updateReason.trim() || undefined,
      });
    } catch (e: any) {
      setErr(e.message || "Failed to update Master Product");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">Edit Canonical Identity</h3>
              <span className="text-xs font-mono text-slate-500">{product.masterProductCode}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {err && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Chemical Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">CAS Number</label>
              <input
                type="text"
                value={casNumber}
                onChange={(e) => setCasNumber(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Molecular Formula</label>
              <input
                type="text"
                value={molecularFormula}
                onChange={(e) => setMolecularFormula(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="API">Active Pharmaceutical Ingredient (API)</option>
                <option value="EXCIPIENT">Excipient</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="SOLVENT">Solvent</option>
                <option value="FINE_CHEMICAL">Fine Chemical</option>
                <option value="HERBAL_EXTRACT">Herbal Extract</option>
                <option value="BIOLOGIC">Biologic</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                disabled={product.status === "MERGED"}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:opacity-50"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="INACTIVE">INACTIVE</option>
                {product.status === "MERGED" && <option value="MERGED">MERGED</option>}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason for Change / Audit Note</label>
            <input
              type="text"
              value={updateReason}
              onChange={(e) => setUpdateReason(e.target.value)}
              placeholder="e.g. Corrected IUPAC chemical formula"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-2xs disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
