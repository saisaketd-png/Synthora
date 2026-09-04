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
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { PageHeader } from "@/shared/components/ui/KemkendraUI";

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
      const res = await authenticatedFetch("/api/v1/admin/settings");

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
      const res = await authenticatedFetch(`/api/v1/admin/settings/${editingSetting.key}`, {
        method: "PUT",
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
  const allSettings = groups.flatMap((g) => g.settings);

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
    <div className="max-w-[1400px] mx-auto space-y-6 text-[#0F172A] pb-12">
      {/* 1. Calm Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#E4E4E7] pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#0052CC] block mb-1">
            System Policies
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A]">
            Platform Policies
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-xl">
            Active operational parameters governing transaction limits, quotation validities, and marketplace rules.
          </p>
        </div>

        <button
          onClick={fetchSettings}
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

      {/* Filters & Category Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#E4E4E7] pb-1">
        <div className="flex items-center gap-6 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`pb-2.5 text-xs font-semibold tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              selectedCategory === "ALL"
                ? "border-[#0052CC] text-[#0052CC]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            ALL POLICIES ({allSettings.length})
          </button>
          {allCategories.map((cat) => {
            const count = allSettings.filter((s: PlatformSetting) => s.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`pb-2.5 text-xs font-semibold tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "border-[#0052CC] text-[#0052CC]"
                    : "border-transparent text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {cat} ({count < 10 ? `0${count}` : count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64 mb-2 sm:mb-0">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search policies or parameters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2.5 py-1 text-xs bg-white border border-[#E4E4E7] rounded-[4px] text-[#0F172A] focus:outline-none focus:border-[#0052CC]"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#FAFAFA] border border-[#E4E4E7] rounded-[8px] animate-pulse" />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-[8px] border border-[#E4E4E7]">
          <Sliders className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
          <h3 className="text-xs font-medium text-[#0F172A]">No platform policies found</h3>
          <p className="text-[11px] text-[#64748B] mt-1">Try adjusting category or search parameters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <div key={group.category} className="space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] px-1">
                {group.category} Registry
              </div>

              <div className="bg-white border border-[#E4E4E7] rounded-[8px] divide-y divide-[#E4E4E7] overflow-hidden shadow-xs">
                {group.settings.map((setting) => (
                  <div
                    key={setting.key}
                    className="p-4 hover:bg-[#F8FAFC] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#0F172A]">
                          {setting.key}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[3px] bg-[#F4F4F5] text-[#64748B] border border-[#E4E4E7]">
                          {setting.dataType}
                        </span>
                      </div>
                      <p className="text-xs text-[#475569]">{setting.description}</p>
                      {setting.impactWarning && (
                        <div className="text-[11px] text-[#64748B] pt-0.5">
                          <span className="text-[#B45309] font-medium">Impact:</span> {setting.impactWarning}
                        </div>
                      )}
                      <div className="text-[10px] text-[#94A3B8] font-mono">
                        Updated {setting.updatedBy ? `by ${setting.updatedBy}` : "via system bootstrap"}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 self-start md:self-center">
                      <div className="text-right">
                        <div className="text-base font-bold font-mono text-[#0F172A]">
                          {setting.value}
                        </div>
                        <span className="text-[10px] text-[#64748B]">active threshold</span>
                      </div>
                      <button
                        onClick={() => handleOpenEdit(setting)}
                        className="h-7 px-3 text-xs font-medium text-[#475569] bg-white hover:bg-[#FAFAFA] border border-[#E4E4E7] rounded-[4px] transition-colors cursor-pointer shadow-xs"
                      >
                        Adjust
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
