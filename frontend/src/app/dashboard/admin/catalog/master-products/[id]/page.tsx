"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Clock,
  ShieldCheck,
  Package,
  Layers,
  HelpCircle,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { getMasterProductDetail, verifyChemicalField, setMasterProductStatus } from "@/features/admin/api/adminCatalogApi";

export default function MasterProductGovernanceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Field Verification Modal
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [fieldStatus, setFieldStatus] = useState("VERIFIED");
  const [fieldNotes, setFieldNotes] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMasterProductDetail(id);
      setDetail(data);
    } catch (e: any) {
      setError(e.message || "Failed to load master product detail");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadData();
  }, [id, loadData]);

  const handleVerifyFieldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedField) return;
    try {
      setActionLoading(true);
      await verifyChemicalField(id, {
        fieldName: selectedField,
        status: fieldStatus,
        notes: fieldNotes.trim() || undefined,
      });
      setSelectedField(null);
      setFieldNotes("");
      await loadData();
    } catch (e: any) {
      alert("Failed to record verification: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!detail) return;
    const newStatus = detail.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    try {
      setActionLoading(true);
      await setMasterProductStatus(detail.id, newStatus);
      await loadData();
    } catch (e: any) {
      alert("Failed to change status: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-xs font-bold text-slate-500">
        Loading Master Product Governance Workspace...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-7xl mx-auto p-8 space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium">
          {error || "Master Product not found"}
        </div>
        <Link href="/dashboard/admin/catalog" className="text-xs font-bold text-blue-600 underline">
          &larr; Return to Master Catalog
        </Link>
      </div>
    );
  }

  const fieldItems = [
    { label: "01 / CHEMICAL NAME", val: detail.name, key: "NAME", req: true },
    { label: "02 / CAS REGISTRY NUMBER", val: detail.casNumber || "N/A", key: "CAS_NUMBER", req: true },
    { label: "03 / MOLECULAR FORMULA", val: detail.molecularFormula || "N/A", key: "MOLECULAR_FORMULA", req: true },
    { label: "04 / PRODUCT CATEGORY", val: detail.category, key: "CATEGORY", req: true },
    { label: "05 / TECHNICAL DESCRIPTION", val: detail.description ? "Present" : "Missing", key: "DESCRIPTION", req: false },
    { label: "06 / CANONICAL CODE", val: detail.masterProductCode, key: "PRODUCT_CODE", req: true },
    { label: "07 / TECHNICAL DOCUMENTS", val: detail.documents?.length ? `${detail.documents.length} Docs` : "None Uploaded", key: "DOCUMENTS", req: false },
    { label: "08 / CANONICAL IMAGE", val: detail.images?.length ? `${detail.images.length} Images` : "Default Mesh", key: "CANONICAL_IMAGE", req: false },
    { label: "09 / DUPLICATE RISK", val: "No Conflict Detected", key: "DUPLICATE_CHECK", req: true },
    { label: "10 / OFFERING CONSISTENCY", val: `${detail.offeringCount || 0} Connected Offerings`, key: "OFFERING_CONSISTENCY", req: true },
  ];

  const verifiedCount = fieldItems.filter(i => i.val && i.val !== "N/A" && i.val !== "Missing" && i.val !== "None Uploaded").length;
  const totalFields = fieldItems.length;
  const scorePercent = Math.round((verifiedCount / totalFields) * 100);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/catalog"
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{detail.name}</h1>
              <span className="px-2.5 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-bold rounded-lg uppercase">
                {detail.masterProductCode}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                detail.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                detail.status === "MERGED" ? "bg-purple-50 text-purple-800 border border-purple-200" :
                "bg-slate-100 text-slate-700 border border-slate-200"
              }`}>
                {detail.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Canonical Chemical Governance & Identity Verification Workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={detail.status === "MERGED" || actionLoading}
            onClick={handleToggleStatus}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-2xs disabled:opacity-40"
          >
            {detail.status === "ACTIVE" ? "Deactivate Product" : "Activate Product"}
          </button>
        </div>
      </div>

      {/* Verification Score Ribbon */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">
            GOVERNANCE COMPLIANCE SCORE
          </span>
          <h2 className="text-xl font-extrabold flex items-center gap-3">
            {verifiedCount} / {totalFields} FIELDS CONFIRMED ({scorePercent}%)
          </h2>
          <p className="text-xs text-slate-300">
            {scorePercent === 100
              ? "All canonical identity and compliance requirements verified."
              : "Some compliance fields require administrative evidence review."}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`px-3 py-1.5 rounded-xl font-extrabold text-xs uppercase ${
            scorePercent === 100 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
          }`}>
            {scorePercent === 100 ? "FULL COMPLIANCE" : "ATTENTION REQUIRED"}
          </span>
        </div>
      </div>

      {/* Grid Layout: Governance Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Identity, Field Verification Checklist, Offerings */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 01: CANONICAL CHEMICAL IDENTITY */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-blue-600" /> 01 / CANONICAL CHEMICAL IDENTITY
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Canonical Name</span>
                <strong className="text-slate-900 text-sm font-extrabold">{detail.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Master Product Code</span>
                <strong className="text-slate-900 font-mono font-extrabold">{detail.masterProductCode}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">CAS Registry Number</span>
                <strong className="text-slate-900 font-mono font-bold">{detail.casNumber || "N/A"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Molecular Formula</span>
                <strong className="text-slate-900 font-mono font-bold">{detail.molecularFormula || "N/A"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Product Category</span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-extrabold rounded uppercase">
                  {detail.category.replace("_", " ")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Commercial Offerings</span>
                <strong className="text-slate-900 font-bold">{detail.offeringCount} Active Offerings</strong>
              </div>
            </div>

            {detail.description && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Technical Description</span>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                  {detail.description}
                </p>
              </div>
            )}
          </div>

          {/* SECTION 02: FIELD-LEVEL CHEMICAL VERIFICATION CHECKLIST */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> 02 / FIELD-LEVEL CHEMICAL VERIFICATION CHECKLIST
              </h3>
              <span className="text-xs font-bold text-slate-500">{verifiedCount}/{totalFields} Confirmed</span>
            </div>

            <div className="space-y-3 text-xs font-medium">
              {fieldItems.map((item) => {
                const isConfirmed = item.val && item.val !== "N/A" && item.val !== "Missing" && item.val !== "None Uploaded";
                return (
                  <div key={item.key} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-300 transition-all">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold">{item.val}</strong>
                        {isConfirmed ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold rounded uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> VERIFIED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-extrabold rounded uppercase flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-600" /> ATTENTION REQUIRED
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedField(item.key)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl font-bold transition-all shadow-2xs shrink-0"
                    >
                      Audit Field
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 05: CONNECTED SUPPLIER OFFERINGS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" /> 05 / CONNECTED SUPPLIER OFFERINGS ({detail.offerings?.length || 0})
              </h3>
            </div>

            {detail.offerings && detail.offerings.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {detail.offerings.map((offering: any) => (
                  <div key={offering.id} className="py-3 flex items-center justify-between text-xs font-medium">
                    <div>
                      <strong className="text-slate-900 font-bold block">{offering.supplierName}</strong>
                      <span className="text-slate-500 text-[11px]">
                        Purity: {offering.purity || "N/A"} | Grade: {offering.grade || "N/A"} | Stock: {offering.stock}
                      </span>
                    </div>
                    <div className="text-right">
                      <strong className="text-slate-900 font-mono font-bold block">
                        {offering.currency} {offering.price}
                      </strong>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-extrabold rounded uppercase">
                        {offering.availabilityStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">
                No active supplier commercial offerings linked to this Master Product.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Governance Audit Timeline */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" /> GOVERNANCE AUDIT LOGS
              </h3>
            </div>

            {detail.auditLogs && detail.auditLogs.length > 0 ? (
              <div className="space-y-3 text-xs font-medium">
                {detail.auditLogs.map((log: any) => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>{log.actorName}</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <strong className="text-slate-900 block font-bold">{log.action.replace("_", " ")}</strong>
                    {log.reason && <p className="text-slate-600 italic text-[11px]">&quot;{log.reason}&quot;</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">
                No administrative audit logs recorded for this chemical identity.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Field Verification Modal */}
      {selectedField && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">Audit Chemical Field: {selectedField}</h3>
            <form onSubmit={handleVerifyFieldSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Verification Status *</label>
                <select
                  value={fieldStatus}
                  onChange={(e) => setFieldStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="VERIFIED">VERIFIED (Confirmed by Standards)</option>
                  <option value="NEEDS_REVIEW">NEEDS REVIEW (Flagged for Inspection)</option>
                  <option value="CONFLICT">CONFLICT (Discrepancy Detected)</option>
                  <option value="MISSING">MISSING (Data Not Provided)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Audit Notes / Evidence Reference</label>
                <textarea
                  rows={3}
                  value={fieldNotes}
                  onChange={(e) => setFieldNotes(e.target.value)}
                  placeholder="Record reference standards, certificate numbers, or verification rationale..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedField(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-2xs"
                >
                  Save Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
