"use client";

import { useState } from "react";
import { FilePlus, ChevronLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { CreateProductRequestPayload } from "../api/masterCatalogApi";

interface ProductRequestFormProps {
  onSubmit: (data: CreateProductRequestPayload) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const CATEGORIES = [
  { value: "API", label: "Active Pharmaceutical Ingredient (API)" },
  { value: "INTERMEDIATE", label: "Pharma / Fine Intermediate" },
  { value: "EXCIPIENT", label: "Excipient" },
  { value: "SOLVENT", label: "Industrial Solvent" },
  { value: "SPECIALTY_CHEMICAL", label: "Specialty Chemical" },
  { value: "LAB_CHEMICAL", label: "Laboratory Reagent" },
];

export function ProductRequestForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: ProductRequestFormProps) {
  const [proposedName, setProposedName] = useState("");
  const [casNumber, setCasNumber] = useState("");
  const [molecularFormula, setMolecularFormula] = useState("");
  const [category, setCategory] = useState("API");
  const [description, setDescription] = useState("");
  const [supplierMessage, setSupplierMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!proposedName.trim()) {
      setError("Please enter a proposed chemical name.");
      return;
    }

    try {
      await onSubmit({
        proposedName: proposedName.trim(),
        casNumber: casNumber.trim() || undefined,
        molecularFormula: molecularFormula.trim() || undefined,
        category,
        description: description.trim() || undefined,
        supplierMessage: supplierMessage.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || "Failed to submit chemical request.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Catalog Search
        </button>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FilePlus className="w-5 h-5 text-amber-500" />
          Request New Chemical Addition
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Can&apos;t find a chemical compound in our Master Catalog? Propose a new addition for Synthora Admin review.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-medium">
        {/* Proposed Name */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Proposed Chemical Name *
          </label>
          <input
            type="text"
            required
            value={proposedName}
            onChange={(e) => setProposedName(e.target.value)}
            placeholder="e.g. Sodium Valproate Tech Grade"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        {/* CAS Number */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            CAS Registry Number (if known)
          </label>
          <input
            type="text"
            value={casNumber}
            onChange={(e) => setCasNumber(e.target.value)}
            placeholder="e.g. 1069-66-5"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        {/* Molecular Formula */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Molecular Formula (if known)
          </label>
          <input
            type="text"
            value={molecularFormula}
            onChange={(e) => setMolecularFormula(e.target.value)}
            placeholder="e.g. C8H15NaO2"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Chemical Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Technical Description */}
        <div className="sm:col-span-2">
          <label className="block font-bold text-slate-700 mb-1">
            Technical Description / Chemical Specifications
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe technical purity, grade, or synthesis application..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        {/* Supplier Message */}
        <div className="sm:col-span-2">
          <label className="block font-bold text-slate-700 mb-1">
            Note to Synthora Verification Team
          </label>
          <textarea
            rows={2}
            value={supplierMessage}
            onChange={(e) => setSupplierMessage(e.target.value)}
            placeholder="Provide context regarding supply capacity, target launch date, or customer inquiries..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isLoading ? "Submitting..." : "Submit Chemical Request"}
        </button>
      </div>
    </form>
  );
}
