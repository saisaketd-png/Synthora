"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  RefreshCw,
} from "lucide-react";
import {
  getMySupplierOfferings,
  deactivateSupplierOffering,
  SupplierOffering,
} from "@/features/supplier-products/api/masterCatalogApi";
import {
  Button,
  Badge,
  StatusBadge,
  PageHeader,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
} from "@/shared/components/ui/SynthoraUI";
import { useToast } from "@/shared/context/ToastContext";

export default function SupplierProductsPage() {
  const toast = useToast();
  const [offerings, setOfferings] = useState<SupplierOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  const loadOfferings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const offeringsData = await getMySupplierOfferings();
      setOfferings(offeringsData);
    } catch (err: any) {
      setError(err.message || "Failed to load supplier offerings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  const confirmDeactivate = async () => {
    if (!deactivateId) return;
    try {
      setActionLoading(deactivateId);
      await deactivateSupplierOffering(deactivateId);
      toast.success("Commercial offering deactivated successfully");
      setDeactivateId(null);
      await loadOfferings();
    } catch (err: any) {
      toast.error("Failed to deactivate offering: " + (err.message || "Unknown error"));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-5">
      {/* Header */}
      <PageHeader
        title="Commercial Chemical Offerings"
        description="Maintain active chemical inventory listings, commercial pricing tiers, grade specifications, and compliance documents."
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="outline"
              onClick={loadOfferings}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3 h-3" />}
            >
              Refresh
            </Button>
            <Link href="/dashboard/supplier/products/new">
              <Button size="xs" variant="primary" leftIcon={<Plus className="w-3 h-3" />}>
                Add Chemical Offering
              </Button>
            </Link>
          </div>
        }
      />

      {error ? (
        <ErrorState
          title="Unable to load chemical offerings"
          message={error}
          onRetry={loadOfferings}
        />
      ) : loading ? (
        <LoadingState label="Loading commercial offerings..." />
      ) : offerings.length > 0 ? (
        <div className="border border-[#DFE1E6] rounded-md bg-white overflow-hidden divide-y divide-[#DFE1E6]">
          {/* Table-List Header */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2.5 bg-[#FAFBFC] text-[#5E6C84] uppercase tracking-wider font-mono text-[10px] font-bold border-b border-[#DFE1E6]">
            <div className="col-span-4">Canonical Chemical Product</div>
            <div className="col-span-3">Commercial Terms</div>
            <div className="col-span-2">Documents & Badges</div>
            <div className="col-span-1">Review Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Offering Rows */}
          {offerings.map((off) => {
            const modStatus = off.moderationStatus || "PENDING_REVIEW";

            return (
              <div
                key={off.id}
                className="p-4 hover:bg-[#FAFBFC] transition-colors grid grid-cols-1 lg:grid-cols-12 gap-4 items-center"
              >
                {/* 1. Canonical Chemical Identity */}
                <div className="lg:col-span-4 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-xs font-bold text-[#091E42]">
                      {off.masterProductName}
                    </strong>
                    <span className="px-1.5 py-0.2 bg-[#091E42] text-white font-mono text-[9px] font-bold rounded">
                      {off.masterProductCode}
                    </span>
                    {off.category && (
                      <span className="px-1.5 py-0.2 bg-[#DEEBFF] text-[#0747A6] font-mono text-[9px] font-bold rounded uppercase">
                        {off.category.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-[#5E6C84] flex items-center gap-3">
                    <span>CAS: <strong className="text-[#172B4D]">{off.casNumber || "N/A"}</strong></span>
                    {off.molecularFormula && (
                      <span>Formula: <strong className="text-[#172B4D]">{off.molecularFormula}</strong></span>
                    )}
                  </div>
                </div>

                {/* 2. Commercial Terms */}
                <div className="lg:col-span-3 text-xs space-y-1">
                  <div className="flex items-baseline gap-2">
                    <strong className="text-sm font-bold font-mono text-[#091E42]">
                      {off.price > 0 ? `$${off.price.toFixed(2)} / kg` : "Inquiry Only"}
                    </strong>
                    <span className="text-[10px] text-[#5E6C84]">
                      MOQ: {off.moqKg ? `${off.moqKg} kg` : "N/A"}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#5E6C84] flex items-center gap-2 font-mono">
                    <span>{off.purity ? `${off.purity}% Purity` : "Standard Purity"}</span>
                    <span>·</span>
                    <span>{off.grade || "Standard Grade"}</span>
                    <span>·</span>
                    <span>Stock: {off.stock} kg</span>
                  </div>
                </div>

                {/* 3. Documents & Badges */}
                <div className="lg:col-span-2 flex items-center gap-1.5 flex-wrap">
                  {off.coaAvailable && (
                    <span className="px-1.5 py-0.2 bg-[#E3FCEF] text-[#006644] border border-[#ABF5D1] rounded font-mono text-[9px] font-bold">
                      COA
                    </span>
                  )}
                  {off.msdsAvailable && (
                    <span className="px-1.5 py-0.2 bg-[#DEEBFF] text-[#0747A6] border border-[#B3D4FF] rounded font-mono text-[9px] font-bold">
                      MSDS
                    </span>
                  )}
                  {off.exportReady && (
                    <span className="px-1.5 py-0.2 bg-[#E3FCEF] text-[#006644] border border-[#ABF5D1] rounded font-mono text-[9px] font-bold">
                      EXPORT
                    </span>
                  )}
                </div>

                {/* 4. Review Status */}
                <div className="lg:col-span-1">
                  <StatusBadge status={modStatus} size="sm" />
                </div>

                {/* 5. Actions */}
                <div className="lg:col-span-2 flex items-center justify-end gap-1.5">
                  <Link
                    href={`/products/${off.masterProductCode}`}
                    className="p-1.5 rounded border border-[#DFE1E6] text-[#5E6C84] hover:text-[#091E42] hover:bg-[#F4F5F7] transition-colors"
                    title="View Public Marketplace Page"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>

                  <Link href={`/dashboard/supplier/products/${off.id}`}>
                    <Button size="xs" variant="outline" leftIcon={<Edit className="w-3 h-3" />}>
                      Edit
                    </Button>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setDeactivateId(off.id)}
                    className="p-1.5 rounded border border-transparent hover:border-[#FFBDAD] text-[#5E6C84] hover:text-[#DE350B] hover:bg-[#FFEBE6] transition-colors"
                    title="Deactivate Offering"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Package className="w-6 h-6 text-[#5E6C84]" />}
          title="No Commercial Offerings Listed"
          description="Link your commercial inventory to canonical Master Chemical monographs to receive RFQs and purchase orders from verified buyers."
          action={
            <Link href="/dashboard/supplier/products/new">
              <Button size="xs" variant="primary" leftIcon={<Plus className="w-3 h-3" />}>
                Add Your First Offering
              </Button>
            </Link>
          }
        />
      )}

      {/* Deactivate Confirmation Modal */}
      <Modal
        isOpen={Boolean(deactivateId)}
        onClose={() => setDeactivateId(null)}
        title="Deactivate Chemical Offering"
        description="Are you sure you want to deactivate this listing? It will immediately be hidden from the public chemical catalog and buyer search results."
        footer={
          <>
            <Button variant="secondary" size="xs" onClick={() => setDeactivateId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="xs"
              isLoading={Boolean(actionLoading)}
              onClick={confirmDeactivate}
            >
              Confirm Deactivation
            </Button>
          </>
        }
      >
        <p className="text-xs text-[#5E6C84]">
          You can edit, update specifications, or re-list a new offering for this chemical compound at any time.
        </p>
      </Modal>
    </div>
  );
}
