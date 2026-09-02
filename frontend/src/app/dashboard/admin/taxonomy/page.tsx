"use client";

import { useEffect, useState } from "react";
import {
  Layers,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Tag,
  ShieldCheck,
  Package,
  Scale,
  Edit2,
  Power,
  Info,
} from "lucide-react";
import { resolveApiUrl } from "@/lib/apiUrl";

interface CatalogTaxonomy {
  id: string;
  type: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface TaxonomyGroup {
  type: string;
  items: CatalogTaxonomy[];
}

export default function AdminTaxonomyPage() {
  const [groups, setGroups] = useState<TaxonomyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogTaxonomy | null>(null);

  // Form State
  const [formType, setFormType] = useState("CATEGORY");
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);

  const fetchTaxonomies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("kemkendra_token") || localStorage.getItem("token");
      const res = await fetch(resolveApiUrl("/api/v1/admin/taxonomy"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to load catalog taxonomies");
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to load taxonomies" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxonomies();
  }, []);

  const handleCreate = async () => {
    if (!formName || !formCode) {
      setStatusMessage({ type: "error", text: "Name and Code are required." });
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem("kemkendra_token") || localStorage.getItem("token");
      const res = await fetch(resolveApiUrl("/api/v1/admin/taxonomy"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: formType,
          name: formName,
          code: formCode,
          description: formDescription,
          displayOrder: formDisplayOrder,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create taxonomy item");
      }

      setStatusMessage({ type: "success", text: `Taxonomy '${formName}' created successfully.` });
      setShowCreateModal(false);
      resetForm();
      await fetchTaxonomies();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to create taxonomy item" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem || !formName) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem("kemkendra_token") || localStorage.getItem("token");
      const res = await fetch(resolveApiUrl(`/api/v1/admin/taxonomy/${editingItem.id}`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          displayOrder: formDisplayOrder,
        }),
      });

      if (!res.ok) throw new Error("Failed to update taxonomy item");
      setStatusMessage({ type: "success", text: `Taxonomy '${formName}' updated successfully.` });
      setEditingItem(null);
      resetForm();
      await fetchTaxonomies();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to update taxonomy item" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (item: CatalogTaxonomy) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("kemkendra_token") || localStorage.getItem("token");
      const endpoint = item.active ? "deactivate" : "activate";
      const res = await fetch(resolveApiUrl(`/api/v1/admin/taxonomy/${item.id}/${endpoint}`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Failed to ${endpoint} taxonomy item`);
      setStatusMessage({
        type: "success",
        text: `Taxonomy item '${item.name}' is now ${item.active ? "DEACTIVATED" : "ACTIVE"}.`,
      });
      await fetchTaxonomies();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to update status" });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (item: CatalogTaxonomy) => {
    setEditingItem(item);
    setFormType(item.type);
    setFormName(item.name);
    setFormCode(item.code);
    setFormDescription(item.description || "");
    setFormDisplayOrder(item.displayOrder);
  };

  const resetForm = () => {
    setFormType("CATEGORY");
    setFormName("");
    setFormCode("");
    setFormDescription("");
    setFormDisplayOrder(1);
    setEditingItem(null);
  };

  const allTypes = Array.from(new Set(groups.map((g) => g.type)));

  const filteredGroups = groups
    .map((group) => {
      if (selectedType !== "ALL" && group.type !== selectedType) return null;
      const items = group.items.filter((item) => {
        if (activeOnly && !item.active) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
        }
        return true;
      });
      if (items.length === 0) return null;
      return { ...group, items };
    })
    .filter(Boolean) as TaxonomyGroup[];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "CATEGORY":
        return <Layers className="w-4 h-4 text-blue-600" />;
      case "GRADE":
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case "PACKAGING":
        return <Package className="w-4 h-4 text-purple-600" />;
      case "UNIT":
        return <Scale className="w-4 h-4 text-amber-600" />;
      default:
        return <Tag className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Catalog Taxonomy & Metadata</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Taxonomy Master
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage chemical categories, pharmacopoeia grades, packaging specifications, and units with safe reference deactivation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTaxonomies}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Taxonomy Item
          </button>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="block text-sm">Non-Destructive Soft-Deactivation Standard</strong>
          <span>
            Deactivating a taxonomy item hides it from new catalog and RFQ dropdowns while safely preserving existing products, historical transactions, and audit records.
          </span>
        </div>
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
          <button onClick={() => setStatusMessage(null)} className="text-xs opacity-70 hover:opacity-100 font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setSelectedType("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedType === "ALL"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            All Types
          </button>
          {allTypes.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedType === t
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Active Only</span>
          </label>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search taxonomy code / name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Taxonomies Grid */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900">No taxonomy items matched your filters</h3>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <div key={group.type} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                {getTypeIcon(group.type)}
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                  {group.type} TAXONOMY
                </h2>
                <span className="text-xs font-medium text-gray-400">({group.items.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white p-5 rounded-xl border transition-all flex flex-col justify-between ${
                      item.active
                        ? "border-gray-200 shadow-sm hover:border-blue-300"
                        : "border-gray-200 bg-gray-50/80 opacity-75"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-800 rounded border border-gray-200">
                          {item.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            item.active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {item.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 text-sm mt-2">{item.name}</h3>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Order: {item.displayOrder}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(item)}
                          disabled={actionLoading}
                          className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                            item.active
                              ? "text-amber-700 hover:bg-amber-50"
                              : "text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {item.active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(showCreateModal || editingItem) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingItem ? "Edit Taxonomy Item" : "New Taxonomy Item"}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingItem(null);
                }}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 my-5">
              {!editingItem && (
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Taxonomy Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CATEGORY">CATEGORY (Chemical Family)</option>
                    <option value="GRADE">GRADE (Pharmacopoeia / Purity)</option>
                    <option value="PACKAGING">PACKAGING (Container / Drums / IBC)</option>
                    <option value="UNIT">UNIT (Measurement Unit)</option>
                    <option value="CERTIFICATION">CERTIFICATION (GMP / ISO / Halal)</option>
                    <option value="APPLICATION">APPLICATION (Industry Sector)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Display Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. USP Grade / IBC Tote (1000L)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {!editingItem && (
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">System Code</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. USP / IBC_TOTE"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Industry specification details..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Display Priority Order</label>
                <input
                  type="number"
                  value={formDisplayOrder}
                  onChange={(e) => setFormDisplayOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingItem(null);
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={editingItem ? handleUpdate : handleCreate}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                {actionLoading ? "Saving..." : editingItem ? "Save Changes" : "Create Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
