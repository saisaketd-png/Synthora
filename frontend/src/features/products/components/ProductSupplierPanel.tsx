"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Store, Edit2, Trash2, Plus, AlertCircle, CheckCircle, Loader2, X } from "lucide-react";
import {
  createProductSupplierOffering,
  getMyProductSupplierOffering,
  updateProductSupplierOffering,
  deleteProductSupplierOffering,
  ProductSupplierManageResponse,
  ProductSupplierOfferingRequest,
} from "../api/manageProductSuppliers";

type PanelState =
  | "LOADING"
  | "NOT_ASSOCIATED"
  | "ASSOCIATED"
  | "EDITING"
  | "SAVING"
  | "DELETING";

interface Props {
  productId: string;
}

const EMPTY_FORM: ProductSupplierOfferingRequest = {
  purity: "",
  grade: "",
  moqKg: undefined,
  packaging: "",
  leadTimeDays: undefined,
  coaAvailable: false,
  msdsAvailable: false,
};

/**
 * ProductSupplierPanel — Phase 2E.4
 *
 * Allows the authenticated supplier to manage their commercial offering
 * for the given product. State machine: LOADING → NOT_ASSOCIATED | ASSOCIATED.
 * Supplier identity is derived server-side; no IDs are sent from the client.
 */
export function ProductSupplierPanel({ productId }: Props) {
  const [panelState, setPanelState] = useState<PanelState>("LOADING");
  const [offering, setOffering] = useState<ProductSupplierManageResponse | null>(null);
  const [form, setForm] = useState<ProductSupplierOfferingRequest>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadOffering = useCallback(async () => {
    try {
      setPanelState("LOADING");
      setError(null);
      const data = await getMyProductSupplierOffering(productId);
      if (data) {
        setOffering(data);
        setPanelState("ASSOCIATED");
      } else {
        setOffering(null);
        setPanelState("NOT_ASSOCIATED");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load offering status.");
      setPanelState("NOT_ASSOCIATED");
    }
  }, [productId]);

  useEffect(() => {
    loadOffering();
  }, [loadOffering]);

  const startEditing = () => {
    setForm({
      purity: offering?.purity ?? "",
      grade: offering?.grade ?? "",
      moqKg: offering?.moqKg ?? undefined,
      packaging: offering?.packaging ?? "",
      leadTimeDays: offering?.leadTimeDays ?? undefined,
      coaAvailable: offering?.coaAvailable ?? false,
      msdsAvailable: offering?.msdsAvailable ?? false,
    });
    setError(null);
    setSuccess(null);
    setPanelState("EDITING");
  };

  const cancelEditing = () => {
    setError(null);
    setPanelState(offering ? "ASSOCIATED" : "NOT_ASSOCIATED");
  };

  const handleSave = async () => {
    try {
      setPanelState("SAVING");
      setError(null);
      setSuccess(null);

      const payload: ProductSupplierOfferingRequest = {
        purity: form.purity || undefined,
        grade: form.grade || undefined,
        moqKg: form.moqKg || undefined,
        packaging: form.packaging || undefined,
        leadTimeDays: form.leadTimeDays || undefined,
        coaAvailable: form.coaAvailable,
        msdsAvailable: form.msdsAvailable,
      };

      let saved: ProductSupplierManageResponse;
      if (offering) {
        saved = await updateProductSupplierOffering(productId, payload);
        setSuccess("Offering updated successfully.");
      } else {
        saved = await createProductSupplierOffering(productId, payload);
        setSuccess("You are now listed as a supplier for this product.");
      }

      setOffering(saved);
      setPanelState("ASSOCIATED");
    } catch (err: any) {
      setError(err.message || "Failed to save offering.");
      setPanelState("EDITING");
    }
  };

  const handleDelete = async () => {
    try {
      setPanelState("DELETING");
      setError(null);
      setSuccess(null);
      await deleteProductSupplierOffering(productId);
      setOffering(null);
      setSuccess("Offering removed successfully.");
      setPanelState("NOT_ASSOCIATED");
    } catch (err: any) {
      setError(err.message || "Failed to remove offering.");
      setPanelState("ASSOCIATED");
    }
  };

  const updateField = (key: keyof ProductSupplierOfferingRequest, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const renderHeader = () => (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
        <Store className="w-5 h-5 text-purple-600" />
      </div>
      <div>
        <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
          Marketplace Offering
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Your supplier-specific commercial terms for this product
        </p>
      </div>
    </div>
  );

  const renderFeedback = () => (
    <>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-100 flex items-start gap-2 text-rose-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-start gap-2 text-emerald-800">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}
    </>
  );

  const renderOfferingForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Purity
          </label>
          <input
            id="offering-purity"
            type="text"
            value={form.purity ?? ""}
            onChange={e => updateField("purity", e.target.value)}
            placeholder="e.g. ≥99.5%"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Grade
          </label>
          <input
            id="offering-grade"
            type="text"
            value={form.grade ?? ""}
            onChange={e => updateField("grade", e.target.value)}
            placeholder="e.g. USP Grade"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            MOQ (kg)
          </label>
          <input
            id="offering-moq"
            type="number"
            min={0}
            step={0.001}
            value={form.moqKg ?? ""}
            onChange={e => updateField("moqKg", e.target.value ? Number(e.target.value) : undefined)}
            placeholder="e.g. 25"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Packaging
          </label>
          <input
            id="offering-packaging"
            type="text"
            value={form.packaging ?? ""}
            onChange={e => updateField("packaging", e.target.value)}
            placeholder="e.g. 25kg Fiber Drum"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Lead Time (days)
          </label>
          <input
            id="offering-lead-time"
            type="number"
            min={1}
            value={form.leadTimeDays ?? ""}
            onChange={e => updateField("leadTimeDays", e.target.value ? Number(e.target.value) : undefined)}
            placeholder="e.g. 14"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
          />
        </div>
        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="offering-coa"
              type="checkbox"
              checked={form.coaAvailable ?? false}
              onChange={e => updateField("coaAvailable", e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-400"
            />
            <span className="text-sm font-medium text-slate-700">COA Available</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="offering-msds"
              type="checkbox"
              checked={form.msdsAvailable ?? false}
              onChange={e => updateField("msdsAvailable", e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-400"
            />
            <span className="text-sm font-medium text-slate-700">MSDS Available</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
        <button
          id="offering-save-btn"
          onClick={handleSave}
          disabled={panelState === "SAVING"}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition-colors disabled:opacity-60"
        >
          {panelState === "SAVING" ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><CheckCircle className="w-4 h-4" /> Save Offering</>
          )}
        </button>
        <button
          id="offering-cancel-btn"
          onClick={cancelEditing}
          disabled={panelState === "SAVING"}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors"
        >
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </div>
  );

  const renderAssociated = () => (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Purity</div>
          <div className="text-sm font-semibold text-slate-900">{offering?.purity ?? "—"}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Grade</div>
          <div className="text-sm font-semibold text-slate-900">{offering?.grade ?? "—"}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">MOQ</div>
          <div className="text-sm font-semibold text-slate-900">
            {offering?.moqKg != null ? `${offering.moqKg} kg` : "—"}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Packaging</div>
          <div className="text-sm font-semibold text-slate-900">{offering?.packaging ?? "—"}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Lead Time</div>
          <div className="text-sm font-semibold text-slate-900">
            {offering?.leadTimeDays != null ? `${offering.leadTimeDays} days` : "—"}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Docs</div>
          <div className="text-sm font-semibold text-slate-900 flex gap-2">
            {offering?.coaAvailable && <span className="text-emerald-600">COA</span>}
            {offering?.msdsAvailable && <span className="text-emerald-600">MSDS</span>}
            {!offering?.coaAvailable && !offering?.msdsAvailable && "—"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          id="offering-edit-btn"
          onClick={startEditing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold transition-colors border border-blue-200"
        >
          <Edit2 className="w-3.5 h-3.5" /> Edit Offering
        </button>
        <button
          id="offering-remove-btn"
          onClick={handleDelete}
          disabled={panelState === "DELETING"}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-bold transition-colors border border-rose-200 disabled:opacity-60"
        >
          {panelState === "DELETING" ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Removing...</>
          ) : (
            <><Trash2 className="w-3.5 h-3.5" /> Remove Offering</>
          )}
        </button>
      </div>
    </div>
  );

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      {renderHeader()}
      {renderFeedback()}

      {panelState === "LOADING" && (
        <div className="flex items-center gap-3 text-slate-500 py-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Checking marketplace status...</span>
        </div>
      )}

      {panelState === "NOT_ASSOCIATED" && (
        <div>
          <p className="text-sm text-slate-600 mb-4">
            You are not currently listed as a supplier for this product. Add your offering to appear in the marketplace supplier comparison for buyers.
          </p>
          <button
            id="offering-add-btn"
            onClick={startEditing}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add to Marketplace
          </button>
        </div>
      )}

      {(panelState === "EDITING" || panelState === "SAVING") && renderOfferingForm()}

      {(panelState === "ASSOCIATED" || panelState === "DELETING") && renderAssociated()}
    </div>
  );
}
