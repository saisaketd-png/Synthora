"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileCheck,
  ShieldCheck,
  Award,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FolderOpen,
  ArrowRight,
  RefreshCw,
  Search,
} from "lucide-react";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { DocumentList } from "@/shared/components/documents/DocumentList";
import { DocumentResponse, getDocuments } from "@/features/documents/api/documentApi";

const COMPLIANCE_CATEGORIES = [
  { value: "GST_CERTIFICATE", label: "GST Certificate" },
  { value: "PAN_CARD", label: "PAN Card" },
  { value: "COMPANY_LICENSE", label: "Business / Incorporation License" },
  { value: "DRUG_LICENSE", label: "Drug Manufacturing License" },
  { value: "FACTORY_LICENSE", label: "Factory Operational License" },
  { value: "POLLUTION_CLEARANCE", label: "Pollution Control Board NOC" },
];

const QUALITY_CATEGORIES = [
  { value: "ISO_CERTIFICATE", label: "ISO / Quality Management Certificate" },
  { value: "GMP_CERTIFICATE", label: "Good Manufacturing Practice (GMP)" },
  { value: "REACH_COMPLIANCE", label: "REACH Compliance" },
  { value: "HALAL_CERTIFICATE", label: "Halal Certification" },
  { value: "KOSHER_CERTIFICATE", label: "Kosher Certification" },
];

const TECHNICAL_CATEGORIES = [
  { value: "TECHNICAL_DATA_SHEET", label: "Technical Data Sheet (TDS)" },
  { value: "SAFETY_DATA_SHEET", label: "Safety Data Sheet (MSDS/SDS)" },
  { value: "CERTIFICATE_OF_ANALYSIS", label: "Certificate of Analysis (COA)" },
];

const COMMERCIAL_CATEGORIES = [
  { value: "COMMERCIAL_INVOICE", label: "Commercial Invoice" },
  { value: "PACKING_LIST", label: "Packing List" },
  { value: "PURCHASE_ORDER", label: "Purchase Order Attachment" },
  { value: "RFQ_ATTACHMENT", label: "RFQ Attachment" },
  { value: "QUOTATION_ATTACHMENT", label: "Quotation Spec Attachment" },
  { value: "DELIVERY_CONFIRMATION", label: "Delivery Confirmation / POD" },
];

export default function SupplierDocumentsVaultPage() {
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("Supplier Vault");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "COMPLIANCE" | "QUALITY" | "TECHNICAL" | "COMMERCIAL">("ALL");

  // Summary Metrics
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    expiringSoon: 0,
    expired: 0,
    versions: 0,
  });

  const loadSupplierProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch("/api/v1/supplier/profile");
      if (res.ok) {
        const data = await res.json();
        // Use user ID or supplier ID as ownerId
        const resolvedId = data.userId || data.id?.toString();
        setSupplierId(resolvedId);
        setCompanyName(data.companyName || data.name || "Supplier Documents");

        // Load all active documents for stats
        const docs = await getDocuments("SUPPLIER", resolvedId, true);
        setDocuments(docs);

        const activeDocs = docs.filter((d) => d.isActive);
        setStats({
          total: activeDocs.length,
          valid: activeDocs.filter((d) => d.expiryStatus === "VALID" || d.expiryStatus === "NO_EXPIRY").length,
          expiringSoon: activeDocs.filter((d) => d.expiryStatus === "EXPIRING_SOON").length,
          expired: activeDocs.filter((d) => d.expiryStatus === "EXPIRED").length,
          versions: docs.length,
        });
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSupplierProfile();
  }, [loadSupplierProfile]);

  const getFilteredCategories = () => {
    switch (activeTab) {
      case "COMPLIANCE":
        return COMPLIANCE_CATEGORIES;
      case "QUALITY":
        return QUALITY_CATEGORIES;
      case "TECHNICAL":
        return TECHNICAL_CATEGORIES;
      case "COMMERCIAL":
        return COMMERCIAL_CATEGORIES;
      default:
        return [
          ...COMPLIANCE_CATEGORIES,
          ...QUALITY_CATEGORIES,
          ...TECHNICAL_CATEGORIES,
          ...COMMERCIAL_CATEGORIES,
          { value: "OTHER", label: "Other Governed Document" },
        ];
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-800 to-indigo-950 text-white p-8 rounded-3xl shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/10 text-emerald-400">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Cryptographic Document Vault (SHA-256 Governed)</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Documents & Compliance Vault
          </h1>
          <p className="text-sm text-zinc-300 max-w-2xl">
            Central repository for {companyName}&apos;s statutory compliance certificates, quality assurances, technical datasheets, and commercial records with full revision lineages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/supplier/verification"
            className="px-4 py-2.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verification Center</span>
          </Link>
          <button
            onClick={loadSupplierProfile}
            className="p-2.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/10 transition-colors"
            title="Refresh documents"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Active Documents</span>
            <FolderOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.total}</div>
          <div className="text-[11px] text-zinc-400 mt-1">Current governed records</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Valid & Active</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.valid}</div>
          <div className="text-[11px] text-zinc-400 mt-1">Compliant & verified</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Expiring Soon</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.expiringSoon}</div>
          <div className="text-[11px] text-zinc-400 mt-1">Action within 30 days</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Expired</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.expired}</div>
          <div className="text-[11px] text-zinc-400 mt-1">Requires renewal</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Total Versions</span>
            <FileText className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.versions}</div>
          <div className="text-[11px] text-zinc-400 mt-1">Audit revision trail</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "ALL"
              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          All Vault Records
        </button>

        <button
          onClick={() => setActiveTab("COMPLIANCE")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "COMPLIANCE"
              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          Statutory & Compliance
        </button>

        <button
          onClick={() => setActiveTab("QUALITY")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "QUALITY"
              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          Quality & Accreditations (ISO/GMP)
        </button>

        <button
          onClick={() => setActiveTab("TECHNICAL")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "TECHNICAL"
              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          Technical Data (TDS/MSDS/COA)
        </button>

        <button
          onClick={() => setActiveTab("COMMERCIAL")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "COMMERCIAL"
              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          Commercial & Shipments
        </button>
      </div>

      {/* Main Document List Area */}
      {loading || !supplierId ? (
        <div className="py-20 text-center text-zinc-400 text-sm">
          Loading your document vault...
        </div>
      ) : (
        <DocumentList
          key={`${supplierId}-${activeTab}`}
          ownerType="SUPPLIER"
          ownerId={supplierId}
          title={
            activeTab === "COMPLIANCE"
              ? "Statutory & Compliance Certificates"
              : activeTab === "QUALITY"
              ? "Quality Management & Certifications"
              : activeTab === "TECHNICAL"
              ? "Technical Specifications & Safety Data"
              : activeTab === "COMMERCIAL"
              ? "Commercial Records & Shipment Deliveries"
              : "All Documents in Vault"
          }
          description="Governed records with SHA-256 integrity digest, revision histories, and dynamic expiry tracking"
          availableCategories={getFilteredCategories()}
          canUpload={true}
          canManage={true}
        />
      )}
    </div>
  );
}
