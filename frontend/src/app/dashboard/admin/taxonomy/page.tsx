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
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { PageHeader } from "@/shared/components/ui/KemkendraUI";

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
      const res = await authenticatedFetch("/api/v1/admin/taxonomy");

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
      const res = await authenticatedFetch("/api/v1/admin/taxonomy", {
        method: "POST",
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
      const res = await authenticatedFetch(`/api/v1/admin/taxonomy/${editingItem.id}`, {
        method: "PUT",
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
      const endpoint = item.active ? "deactivate" : "activate";
      const res = await authenticatedFetch(`/api/v1/admin/taxonomy/${item.id}/${endpoint}`, {
        method: "PUT",
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
    <div className="max-w-[1400px] mx-auto space-y-6 text-[#0F172A] pb-12">
      {/* 1. Calm Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#E4E4E7] pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#0052CC] block mb-1">
            Catalog Taxonomy
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A]">
            Classification Standards
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-xl">
            Controlled chemical classifications, pharmacopoeial grades, packaging configurations, and measurement units.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTaxonomies}
            disabled={loading}
            className="h-8 px-3 text-xs font-medium text-[#475569] bg-white hover:bg-[#FAFAFA] border border-[#E4E4E7] rounded-[4px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0052CC]" : "text-[#64748B]"}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="h-8 px-3.5 text-xs font-medium text-white bg-[#0052CC] hover:bg-[#0747A6] rounded-[4px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Governance Notice Banner */}
      <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[8px] flex items-center gap-2.5 text-xs text-[#1E40AF]">
        <Info className="w-4 h-4 text-[#0052CC] shrink-0" />
        <div>
          <strong className="font-semibold text-[#0F172A] mr-1.5">Non-Destructive Soft Deactivation:</strong>
          <span>Deactivated taxonomy standards are omitted from new catalog/RFQ forms while historical transactions and audit trails remain preserved.</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-[8px] border border-[#E4E4E7] shadow-tactile-card">
        <div className="flex items-center p-0.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px] w-fit overflow-x-auto max-w-full">
          <button
            onClick={() => setSelectedType("ALL")}
            className={`flex items-center h-7 px-3 text-xs font-medium rounded-[4px] whitespace-nowrap transition-colors cursor-pointer ${
              selectedType === "ALL"
                ? "bg-[#0052CC] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4F4F5]"
            }`}
          >
            All Types
          </button>
          {allTypes.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`flex items-center h-7 px-3 text-xs font-medium rounded-[4px] whitespace-nowrap transition-colors cursor-pointer ${
                selectedType === t
                  ? "bg-[#0052CC] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4F4F5]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#475569] cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded-[4px] text-[#0052CC] focus:ring-[#0052CC]"
            />
            <span>Active Only</span>
          </label>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1 text-xs bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px] text-[#0F172A] focus:outline-none focus:border-[#0052CC]"
            />
          </div>
        </div>
      </div>

      {/* Taxonomies Table */}
      <div className="bg-white border border-[#E4E4E7] rounded-[8px] overflow-hidden shadow-tactile-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-[#E4E4E7] text-[#475569] font-mono font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Classification Name</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5">Order</th>
                <th className="px-4 py-2.5">State</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7] text-[#0F172A]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#64748B]">Loading taxonomy standards...</td>
                </tr>
              ) : filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#64748B]">No taxonomy items matched your filters.</td>
                </tr>
              ) : (
                filteredGroups.flatMap((group) =>
                  group.items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono text-[#64748B]">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#0F172A]">
                        {item.code}
                      </td>
                      <td className="px-4 py-3 font-medium text-xs text-[#0F172A]">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#475569] max-w-xs truncate">
                        {item.description || <span className="text-[#94A3B8]">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#64748B]">
                        {item.displayOrder}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full ${item.active ? "bg-[#059669]" : "bg-[#94A3B8]"}`} />
                          <span className={`font-medium ${item.active ? "text-[#059669]" : "text-[#64748B]"}`}>
                            {item.active ? "Active" : "Deactivated"}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            className="h-7 px-2 bg-white hover:bg-[#FAFAFA] text-[#0F172A] border border-[#E4E4E7] rounded-[4px] text-xs font-medium transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3 text-[#64748B]" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleToggleActive(item)}
                            disabled={actionLoading}
                            className={`h-7 px-2 border rounded-[4px] text-xs font-medium transition-colors shadow-xs cursor-pointer flex items-center gap-1 ${
                              item.active
                                ? "bg-white hover:bg-[#FEF2F2] text-[#DC2626] border-[rgba(220,38,38,0.3)]"
                                : "bg-white hover:bg-[#ECFDF5] text-[#059669] border-[rgba(5,150,105,0.3)]"
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            <span>{item.active ? "Deactivate" : "Activate"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

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
