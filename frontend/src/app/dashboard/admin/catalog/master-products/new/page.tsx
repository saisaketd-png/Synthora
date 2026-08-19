"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FlaskConical, AlertTriangle, CheckCircle2, ShieldCheck, HelpCircle } from "lucide-react";
import { createMasterProduct, searchAdminMasterProducts } from "@/features/admin/api/adminCatalogApi";
import { MasterProduct } from "@/features/supplier-products/api/masterCatalogApi";

export default function CreateMasterProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [casNumber, setCasNumber] = useState("");
  const [molecularFormula, setMolecularFormula] = useState("");
  const [category, setCategory] = useState("API");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [overrideReason, setOverrideReason] = useState("");

  const [preValidationChecked, setPreValidationChecked] = useState(false);
  const [duplicateCandidate, setDuplicateCandidate] = useState<MasterProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreValidate = async () => {
    if (!name.trim() && !casNumber.trim()) {
      setError("Please provide a Chemical Name or CAS Number to pre-validate.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const results = await searchAdminMasterProducts({
        query: name.trim() || undefined,
        casNumber: casNumber.trim() || undefined,
        category,
        page: 0,
        size: 5,
      });

      if (results.content.length > 0) {
        setDuplicateCandidate(results.content[0]);
      } else {
        setDuplicateCandidate(null);
      }
      setPreValidationChecked(true);
    } catch (e: any) {
      setError(e.message || "Failed pre-validation check");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateCandidate && !overrideReason.trim()) {
      setError("Explicit governance override reason is required when creating despite potential duplicate.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await createMasterProduct({
        name: name.trim(),
        casNumber: casNumber.trim() || undefined,
        molecularFormula: molecularFormula.trim() || undefined,
        category,
        description: description.trim() || undefined,
        status,
      });

      router.push(`/dashboard/admin/catalog/master-products/${created.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create Master Product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/admin/catalog"
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-blue-600" />
            DIRECT MASTER PRODUCT CREATION
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure canonical chemical identity. The Master Product Code (API-MP-XXXXXX) will be generated server-side.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-800 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Pre-Validation Alert */}
      {duplicateCandidate && (
        <div className="p-5 bg-purple-50 border border-purple-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-purple-900 font-extrabold text-xs uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-purple-600" />
            POTENTIAL DUPLICATE DETECTED
          </div>
          <div className="p-3 bg-white border border-purple-100 rounded-xl text-xs space-y-1">
            <div className="font-bold text-slate-900">{duplicateCandidate.name} ({duplicateCandidate.masterProductCode})</div>
            <div className="text-slate-600">CAS: {duplicateCandidate.casNumber || "N/A"} | Category: {duplicateCandidate.category}</div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/admin/catalog/master-products/${duplicateCandidate.id}`}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors"
            >
              USE EXISTING MASTER PRODUCT
            </Link>
            <span className="text-xs text-purple-700 font-medium">or provide override reason below to proceed with creation.</span>
          </div>
        </div>
      )}

      {/* Creation Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="space-y-4 text-xs font-medium">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">Canonical Chemical Identity</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Canonical Chemical Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => { setName(e.target.value); setPreValidationChecked(false); }}
                placeholder="e.g. Paracetamol / Acetaminophen"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="API">API (Active Pharmaceutical Ingredient)</option>
                <option value="EXCIPIENT">Excipient</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="SOLVENT">Solvent</option>
                <option value="SPECIALTY_CHEMICAL">Specialty Chemical</option>
                <option value="HERBAL_EXTRACT">Herbal Extract</option>
                <option value="BIOLOGIC">Biologic</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">CAS Registry Number</label>
              <input
                type="text"
                value={casNumber}
                onChange={(e) => { setCasNumber(e.target.value); setPreValidationChecked(false); }}
                placeholder="e.g. 103-90-2"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Molecular Formula</label>
              <input
                type="text"
                value={molecularFormula}
                onChange={(e) => setMolecularFormula(e.target.value)}
                placeholder="e.g. C8H9NO2"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Technical Description / Specification</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide technical identity description, purity grade expectations, or standard monograph reference..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Initial Catalog Lifecycle Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="ACTIVE">ACTIVE (Published to Buyer Discovery)</option>
                <option value="DRAFT">DRAFT (Under Review / Non-Public)</option>
                <option value="INACTIVE">INACTIVE (Deactivated)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handlePreValidate}
                className="w-full py-2.5 bg-purple-50 border border-purple-200 text-purple-800 hover:bg-purple-100 rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                {preValidationChecked ? "Re-Run Pre-Validation" : "Pre-Validate Candidate"}
              </button>
            </div>
          </div>

          {duplicateCandidate && (
            <div>
              <label className="block font-bold text-rose-700 mb-1">Governance Duplicate Override Reason *</label>
              <textarea
                rows={2}
                required
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Provide explicit justification for creating a separate Master Product despite candidate duplicate..."
                className="w-full px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
          <Link
            href="/dashboard/admin/catalog"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? "Creating..." : "+ CREATE MASTER PRODUCT"}
          </button>
        </div>
      </form>
    </div>
  );
}
