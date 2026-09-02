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
import { resolveApiUrl } from "@/lib/apiUrl";

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
      const token = localStorage.getItem("kemkendra_token") || localStorage.getItem("token");
      const res = await fetch(resolveApiUrl("/api/v1/admin/feature-controls"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
      const token = localStorage.getItem("kemkendra_token") || localStorage.getItem("token");
      const res = await fetch(resolveApiUrl(`/api/v1/admin/feature-controls/${key}`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Platform Feature Controls</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Live Runtime Switches
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Safely enable or disable marketplace interactions, registration flows, and trading capabilities in real-time.
          </p>
        </div>
        <button
          onClick={fetchFeatures}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
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

      {/* Emergency Platform Maintenance Card */}
      {maintenanceFlag && (
        <div
          className={`p-6 rounded-2xl border transition-all ${
            maintenanceFlag.enabled
              ? "bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg border-red-800"
              : "bg-gradient-to-r from-gray-900 to-slate-800 text-white border-gray-700"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-6 h-6 text-amber-400" />
                <h2 className="text-lg font-bold">Platform Maintenance Mode Guard</h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    maintenanceFlag.enabled
                      ? "bg-red-950 text-red-200 border border-red-400"
                      : "bg-emerald-950 text-emerald-300 border border-emerald-500"
                  }`}
                >
                  {maintenanceFlag.enabled ? "ACTIVE (MAINTENANCE)" : "INACTIVE (OPERATIONAL)"}
                </span>
              </div>
              <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                {maintenanceFlag.impactWarning}
              </p>
            </div>

            <button
              onClick={() => handleToggleClick(maintenanceFlag)}
              disabled={updating}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                maintenanceFlag.enabled
                  ? "bg-white text-red-700 hover:bg-red-50"
                  : "bg-amber-500 hover:bg-amber-400 text-gray-950"
              }`}
            >
              <Power className="w-4 h-4" />
              {maintenanceFlag.enabled ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
            </button>
          </div>
        </div>
      )}

      {/* Search & Statistics */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Active Features: {features.filter((f) => f.enabled).length}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Guarded Toggles: {features.filter((f) => f.dangerous || f.requiresConfirmation).length}</span>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search feature flags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Feature Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : nonMaintenanceFeatures.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
          <SlidersHorizontal className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900">No feature flags matched your search</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nonMaintenanceFeatures.map((flag) => (
            <div
              key={flag.key}
              className={`bg-white p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                flag.enabled
                  ? "border-gray-200 shadow-sm hover:border-blue-300"
                  : "border-gray-200 bg-gray-50/70 opacity-80"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-base">{flag.name}</h3>
                      {flag.dangerous && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Flame className="w-3 h-3 text-amber-600" />
                          High Impact
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-gray-400 mt-0.5 block">{flag.key}</span>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggleClick(flag)}
                    disabled={updating}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      flag.enabled ? "bg-emerald-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        flag.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{flag.description}</p>

                {/* Impact Warning Banner */}
                {flag.impactWarning && (
                  <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2 text-xs text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Marketplace Behavior: </span>
                      {flag.impactWarning}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Status: <strong className={flag.enabled ? "text-emerald-700" : "text-gray-600"}>{flag.enabled ? "ENABLED" : "DISABLED"}</strong>
                </span>
                <span>{flag.updatedBy ? `Modified by ${flag.updatedBy}` : "System Default"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

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
