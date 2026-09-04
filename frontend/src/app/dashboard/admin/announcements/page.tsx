"use client";

import { useEffect, useState } from "react";
import {
  Megaphone,
  Plus,
  Send,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Users,
  Building2,
  Shield,
  Mail,
  Bell,
  Clock,
  Search,
  Filter,
} from "lucide-react";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { PageHeader } from "@/shared/components/ui/KemkendraUI";

interface PlatformAnnouncement {
  id: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  audience: "ALL" | "BUYERS" | "SUPPLIERS" | "ADMINS" | "VERIFIED_SUPPLIERS";
  status: "DRAFT" | "PUBLISHED" | "DEACTIVATED";
  startTime?: string;
  endTime?: string;
  sendInApp: boolean;
  sendEmail: boolean;
  publishedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface PreviewResponse {
  title: string;
  formattedMessage: string;
  severity: string;
  audience: string;
  estimatedRecipientCount: number;
  sendInApp: boolean;
  sendEmail: boolean;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [audienceFilter, setAudienceFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formSeverity, setFormSeverity] = useState<"INFO" | "WARNING" | "CRITICAL">("INFO");
  const [formAudience, setFormAudience] = useState<"ALL" | "BUYERS" | "SUPPLIERS" | "ADMINS" | "VERIFIED_SUPPLIERS">("ALL");
  const [formSendInApp, setFormSendInApp] = useState(true);
  const [formSendEmail, setFormSendEmail] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch("/api/v1/admin/announcements?size=100");

      if (!res.ok) throw new Error("Failed to load announcements");
      const data = await res.json();
      setAnnouncements(data.content || []);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to load announcements" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePreview = async () => {
    if (!formTitle || !formMessage) {
      setStatusMessage({ type: "error", text: "Please enter title and message to preview." });
      return;
    }

    try {
      setActionLoading(true);
      const res = await authenticatedFetch("/api/v1/admin/announcements/preview", {
        method: "POST",
        body: JSON.stringify({
          title: formTitle,
          message: formMessage,
          severity: formSeverity,
          audience: formAudience,
          sendInApp: formSendInApp,
          sendEmail: formSendEmail,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate preview");
      const data = await res.json();
      setPreviewData(data);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to generate preview" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAnnouncement = async (andPublish = false) => {
    if (!formTitle || !formMessage) {
      setStatusMessage({ type: "error", text: "Title and message are required." });
      return;
    }

    try {
      setActionLoading(true);
      const res = await authenticatedFetch("/api/v1/admin/announcements", {
        method: "POST",
        body: JSON.stringify({
          title: formTitle,
          message: formMessage,
          severity: formSeverity,
          audience: formAudience,
          sendInApp: formSendInApp,
          sendEmail: formSendEmail,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create announcement");
      }

      const created = await res.json();

      if (andPublish) {
        await handlePublish(created.id);
      } else {
        setStatusMessage({ type: "success", text: "Draft announcement saved successfully." });
      }

      setShowCreateModal(false);
      resetForm();
      await fetchAnnouncements();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to create announcement" });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      setActionLoading(true);
      const res = await authenticatedFetch(`/api/v1/admin/announcements/${id}/publish`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to publish announcement");
      setStatusMessage({ type: "success", text: "Announcement published and notifications dispatched!" });
      await fetchAnnouncements();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to publish announcement" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      setActionLoading(true);
      const res = await authenticatedFetch(`/api/v1/admin/announcements/${id}/deactivate`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to deactivate announcement");
      setStatusMessage({ type: "success", text: "Announcement deactivated." });
      await fetchAnnouncements();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to deactivate announcement" });
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormMessage("");
    setFormSeverity("INFO");
    setFormAudience("ALL");
    setFormSendInApp(true);
    setFormSendEmail(false);
    setPreviewData(null);
  };

  const filteredAnnouncements = announcements.filter((a) => {
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
    if (audienceFilter !== "ALL" && a.audience !== audienceFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q);
    }
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200">CRITICAL</span>;
      case "WARNING":
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">WARNING</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">INFO</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">PUBLISHED</span>;
      case "DEACTIVATED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">DEACTIVATED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">DRAFT</span>;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 text-[#0F172A] pb-12">
      {/* 1. Calm Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#E4E4E7] pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#0052CC] block mb-1">
            Broadcast Operations
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A]">
            Platform Announcements
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-xl">
            Participant broadcast bulletins, scheduled maintenance alerts, and compliance advisories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnnouncements}
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
            <span>New Announcement</span>
          </button>
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
          {["ALL", "DRAFT", "PUBLISHED", "DEACTIVATED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Audiences</option>
            <option value="BUYERS">Buyers</option>
            <option value="SUPPLIERS">Suppliers</option>
            <option value="VERIFIED_SUPPLIERS">Verified Suppliers</option>
            <option value="ADMINS">Admins</option>
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900">No announcements found</h3>
          <p className="text-sm text-gray-500 mt-1">Create a new broadcast announcement to notify users.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((a) => (
            <div
              key={a.id}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  {getSeverityBadge(a.severity)}
                  <h3 className="text-base font-bold text-gray-900">{a.title}</h3>
                  {getStatusBadge(a.status)}
                </div>

                <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">{a.message}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    Target: <strong>{a.audience}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5" />
                    In-App: {a.sendInApp ? "Yes" : "No"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    Email: {a.sendEmail ? "Yes" : "No"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {a.publishedAt ? `Published ${new Date(a.publishedAt).toLocaleDateString()}` : `Created ${new Date(a.createdAt).toLocaleDateString()}`}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end md:self-center">
                {a.status === "DRAFT" && (
                  <button
                    onClick={() => handlePublish(a.id)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Publish Now
                  </button>
                )}
                {a.status === "PUBLISHED" && (
                  <button
                    onClick={() => handleDeactivate(a.id)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">Create Platform Announcement</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-4 my-5">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Announcement Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Scheduled Platform Maintenance"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Message Content</label>
                <textarea
                  rows={4}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder="Detailed communication broadcast to users..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Severity</label>
                  <select
                    value={formSeverity}
                    onChange={(e: any) => setFormSeverity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="INFO">INFO (Standard Notice)</option>
                    <option value="WARNING">WARNING (Operational Impact)</option>
                    <option value="CRITICAL">CRITICAL (Urgent Platform Alert)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Target Audience</label>
                  <select
                    value={formAudience}
                    onChange={(e: any) => setFormAudience(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="ALL">All Marketplace Users</option>
                    <option value="BUYERS">Enterprise Buyers</option>
                    <option value="SUPPLIERS">All Suppliers</option>
                    <option value="VERIFIED_SUPPLIERS">Verified Suppliers Only</option>
                    <option value="ADMINS">Administrators Only</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSendInApp}
                    onChange={(e) => setFormSendInApp(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Dispatch In-App Notification</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSendEmail}
                    onChange={(e) => setFormSendEmail(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Send Email Broadcast</span>
                </label>
              </div>

              {/* Preview Box if requested */}
              {previewData && (
                <div className="mt-4 p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-purple-900 font-bold">
                    <span>Audience Preview</span>
                    <span>~{previewData.estimatedRecipientCount} Estimated Recipients</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-purple-100 text-gray-800">
                    <strong className="block text-sm">{previewData.title}</strong>
                    <p className="mt-1 text-gray-600">{previewData.formattedMessage}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handlePreview}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview Audience
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateAnnouncement(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateAnnouncement(true)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Publish & Broadcast
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
