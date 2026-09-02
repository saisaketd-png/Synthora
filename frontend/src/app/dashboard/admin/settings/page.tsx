"use client";

import { useEffect, useState } from "react";
import {
  Sliders,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Save,
  Info,
  Clock,
  Shield,
  Search,
  Filter,
  DollarSign,
  Users,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { resolveApiUrl } from "@/lib/apiUrl";

interface PlatformSetting {
  key: string;
  value: string;
  category: string;
  dataType: string;
  description: string;
  impactWarning: string;
  updatedBy?: string;
  updatedAt: string;
}

interface PlatformSettingsGroup {
  category: string;
  settings: PlatformSetting[];
}

export default function AdminSettingsPage() {
  const [groups, setGroups] = useState<PlatformSettingsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [editingSetting, setEditingSetting] = useState<PlatformSetting | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("kemkendra_token") || localStorage.getItem("token");
      const res = await fetch(resolveApiUrl("/api/v1/admin/settings"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to load platform settings");
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to load platform settings" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleOpenEdit = (setting: PlatformSetting) => {
    setEditingSetting(setting);
    setEditValue(setting.value);
    setStatusMessage(null);
  };

  const handleSaveSetting = async () => {
    if (!editingSetting) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("kemkendra_token") || localStorage.getItem("token");
      const res = await fetch(resolveApiUrl(`/api/v1/admin/settings/${editingSetting.key}`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: editValue }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update setting");
      }

      setStatusMessage({ type: "success", text: `Policy '${editingSetting.key}' successfully updated.` });
      setEditingSetting(null);
      await fetchSettings();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to update setting" });
    } finally {
      setSaving(false);
    }
  };

  const allCategories = Array.from(new Set(groups.map((g) => g.category)));

  const filteredGroups = groups
    .map((group) => {
      if (selectedCategory !== "ALL" && group.category !== selectedCategory) {
        return null;
      }
      const filteredSettings = group.settings.filter(
        (s) =>
          s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filteredSettings.length === 0) return null;
      return { ...group, settings: filteredSettings };
    })
    .filter(Boolean) as PlatformSettingsGroup[];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "COMMERCIAL":
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case "BUYER":
        return <Users className="w-4 h-4 text-blue-600" />;
      case "COMMUNICATION":
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      default:
        return <Sliders className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Platform Policies & Settings</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Admin Policy Center
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Configure dynamic commercial policies, buyer limits, and platform rules without code deployment.
          </p>
        </div>
        <button
          onClick={fetchSettings}
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

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === "ALL"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            All Policies
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search policies or keys..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
          <Sliders className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900">No platform policies found</h3>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your category filter or search terms.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <div key={group.category} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                {getCategoryIcon(group.category)}
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                  {group.category} POLICIES
                </h2>
                <span className="text-xs font-medium text-gray-400">
                  ({group.settings.length})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.settings.map((setting) => (
                  <div
                    key={setting.key}
                    className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-800 rounded border border-gray-200">
                            {setting.key}
                          </span>
                          <p className="text-sm text-gray-600 mt-2">{setting.description}</p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {setting.dataType}
                        </span>
                      </div>

                      {/* Current Value Display */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">Active Policy Value:</span>
                        <span className="font-mono text-sm font-bold text-gray-900">{setting.value}</span>
                      </div>

                      {/* Impact Warning Banner */}
                      {setting.impactWarning && (
                        <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Marketplace Impact: </span>
                            {setting.impactWarning}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {setting.updatedBy ? `By ${setting.updatedBy}` : "System Default"}
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenEdit(setting)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        Adjust Policy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Setting Modal */}
      {editingSetting && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Modify Platform Policy</h3>
              </div>
              <button
                onClick={() => setEditingSetting(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 my-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Policy Key</label>
                <div className="font-mono text-sm font-bold text-gray-800 mt-0.5">{editingSetting.key}</div>
                <p className="text-xs text-gray-500 mt-1">{editingSetting.description}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase">New Value ({editingSetting.dataType})</label>
                <input
                  type={editingSetting.dataType === "INTEGER" ? "number" : "text"}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder={`Enter ${editingSetting.dataType.toLowerCase()} value`}
                />
              </div>

              {editingSetting.impactWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Marketplace Behavior Warning: </span>
                    {editingSetting.impactWarning}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingSetting(null)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSetting}
                disabled={saving || editValue.trim() === ""}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                {saving ? "Applying Policy..." : "Confirm & Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
