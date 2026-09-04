"use client";

import { useEffect, useState } from "react";
import {
  ToggleLeft,
  ToggleRight,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Shield,
  Search,
  Lock,
  Flame,
  Info,
  Power,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { PageHeader } from "@/shared/components/ui/KemkendraUI";

interface PlatformFeatureFlag {
  key: string;
  name: string;
  description: string;
  impactWarning: string;
  enabled: boolean;
  requiresConfirmation: boolean;
  dangerous: boolean;
  updatedBy?: string;
  updatedAt: string;
}

export default function AdminFeatureControlsPage() {
  const [features, setFeatures] = useState<PlatformFeatureFlag[]>([]);
  const [maintenanceModeActive, setMaintenanceModeActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmModalFlag, setConfirmModalFlag] = useState<PlatformFeatureFlag | null>(null);
  const [targetNewState, setTargetNewState] = useState<boolean>(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [updating, setUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch("/api/v1/admin/feature-controls");

      if (!res.ok) throw new Error("Failed to load feature controls");
      const data = await res.json();
      setFeatures(data.features || []);
      setMaintenanceModeActive(!!data.maintenanceModeActive);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to load feature controls" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const handleToggleClick = (flag: PlatformFeatureFlag) => {
    const newState = !flag.enabled;
    if (flag.dangerous || flag.requiresConfirmation) {
      setConfirmModalFlag(flag);
      setTargetNewState(newState);
      setConfirmationInput("");
    } else {
      executeToggle(flag.key, newState, true);
    }
  };

  const executeToggle = async (key: string, enabled: boolean, confirmed: boolean) => {
    try {
      setUpdating(true);
      const res = await authenticatedFetch(`/api/v1/admin/feature-controls/${key}`, {
        method: "PUT",
        body: JSON.stringify({ enabled, confirmed }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to toggle feature");
      }

      const updated = await res.json();
      setStatusMessage({
        type: "success",
        text: `Feature '${updated.name}' is now ${updated.enabled ? "ENABLED" : "DISABLED"}.`,
      });
      setConfirmModalFlag(null);
      await fetchFeatures();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to update feature" });
    } finally {
      setUpdating(false);
    }
  };

  const filteredFeatures = features.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const maintenanceFlag = features.find((f) => f.key === "MAINTENANCE_MODE_ENABLED");
  const nonMaintenanceFeatures = filteredFeatures.filter((f) => f.key !== "MAINTENANCE_MODE_ENABLED");

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 text-[#0F172A] pb-12">
      {/* 1. Calm Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#E4E4E7] pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#0052CC] block mb-1">
            System Governance
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A]">
            Runtime Controls
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-xl">
            Platform capabilities, registration controls, and emergency operational gates.
          </p>
        </div>

        <button
          onClick={fetchFeatures}
          disabled={loading}
          className="h-8 px-3 text-xs font-medium text-[#475569] bg-white hover:bg-[#FAFAFA] border border-[#E4E4E7] rounded-[4px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0052CC]" : "text-[#64748B]"}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Maintenance Mode Guard Strip */}
      {maintenanceFlag && (
        <div className="p-3.5 rounded-[8px] bg-white border border-[#E4E4E7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${maintenanceFlag.enabled ? "bg-[#DC2626] animate-pulse" : "bg-[#059669]"}`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#0F172A]">Platform Maintenance Mode</span>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[4px] border ${
                  maintenanceFlag.enabled
                    ? "bg-[#FEF2F2] text-[#DC2626] border-[rgba(220,38,38,0.2)]"
                    : "bg-[#ECFDF5] text-[#059669] border-[rgba(5,150,105,0.2)]"
                }`}>
                  {maintenanceFlag.enabled ? "ACTIVE GUARD" : "OPERATIONAL"}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {maintenanceFlag.enabled
                  ? maintenanceFlag.impactWarning
                  : "Platform services and API endpoints are actively operating normally without maintenance restrictions."}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleToggleClick(maintenanceFlag)}
            disabled={updating}
            className={`h-7 px-3 text-xs font-medium rounded-[4px] border transition-colors cursor-pointer shrink-0 ${
              maintenanceFlag.enabled
                ? "bg-[#DC2626] text-white border-[#DC2626] hover:bg-[#B91C1C]"
                : "bg-white text-[#475569] border-[#E4E4E7] hover:bg-[#FAFAFA]"
            }`}
          >
            {maintenanceFlag.enabled ? "Disable Maintenance Mode" : "Enable Maintenance"}
          </button>
        </div>
      )}

      {/* Feature Registry Table */}
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] overflow-hidden shadow-xs">
        <div className="p-3 border-b border-[#E4E4E7] bg-[#FAFAFA] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs text-[#64748B]">
            <span>Active capabilities: <strong className="text-[#059669] font-mono">{features.filter((f) => f.enabled).length}</strong></span>
            <span>·</span>
            <span>Guarded gates: <strong className="text-[#D97706] font-mono">{features.filter((f) => f.dangerous || f.requiresConfirmation).length}</strong></span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Filter platform capabilities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1 text-xs bg-white border border-[#E4E4E7] rounded-[4px] text-[#0F172A] focus:outline-none focus:border-[#0052CC]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-[#E4E4E7] text-[#475569] font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-2.5">Capability / Key</th>
                <th className="px-4 py-2.5">Purpose & Behavioral Scope</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Modified By</th>
                <th className="px-4 py-2.5 text-right">Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7] text-[#0F172A]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#64748B]">Loading capability gates...</td>
                </tr>
              ) : nonMaintenanceFeatures.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#64748B]">No capability gates matched filter.</td>
                </tr>
              ) : (
                nonMaintenanceFeatures.map((flag) => (
                  <tr key={flag.key} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-[#0F172A]">{flag.name}</span>
                        {flag.dangerous && (
                          <span className="px-1.5 py-0.2 rounded-[3px] bg-[#FEF2F2] text-[#DC2626] border border-[rgba(220,38,38,0.2)] text-[10px] font-mono font-medium">
                            Guarded
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-[#64748B] block mt-0.5">{flag.key}</span>
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <p className="text-xs text-[#475569]">{flag.description}</p>
                      {flag.impactWarning && !flag.enabled && (
                        <span className="text-[11px] text-[#B45309] block mt-0.5">
                          Impact: {flag.impactWarning}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${flag.enabled ? "bg-[#059669]" : "bg-[#94A3B8]"}`} />
                        <span className={`font-medium ${flag.enabled ? "text-[#059669]" : "text-[#64748B]"}`}>
                          {flag.enabled ? "Active" : "Disabled"}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">
                      {flag.updatedBy ? flag.updatedBy : "System Bootstrap"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggleClick(flag)}
                        disabled={updating}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          flag.enabled ? "bg-[#059669]" : "bg-[#CBD5E1]"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            flag.enabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Guarded & Dangerous Flags */}
      {confirmModalFlag && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-red-600 pb-3 border-b border-gray-100">
              <AlertOctagon className="w-7 h-7 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Policy Change</h3>
                <p className="text-xs text-gray-500">High-Impact Platform Switch</p>
              </div>
            </div>

            <div className="space-y-3.5 my-4">
              <p className="text-sm text-gray-700">
                You are about to <strong>{targetNewState ? "ENABLE" : "DISABLE"}</strong>:
              </p>
              <div className="p-3 bg-gray-100 rounded-xl text-xs font-mono text-gray-900 font-semibold">
                {confirmModalFlag.name} ({confirmModalFlag.key})
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Operational Impact: </span>
                  {confirmModalFlag.impactWarning}
                </div>
              </div>

              {confirmModalFlag.dangerous && (
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Type <span className="font-mono text-red-600">CONFIRM</span> to proceed:
                  </label>
                  <input
                    type="text"
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    placeholder="CONFIRM"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setConfirmModalFlag(null)}
                disabled={updating}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeToggle(confirmModalFlag.key, targetNewState, true)}
                disabled={updating || (confirmModalFlag.dangerous && confirmationInput.trim() !== "CONFIRM")}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-lg transition-colors shadow-sm"
              >
                {updating ? "Updating..." : `Yes, ${targetNewState ? "Enable" : "Disable"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
