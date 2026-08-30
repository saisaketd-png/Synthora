"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Upload,
  RefreshCw,
  HelpCircle,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckSquare,
  AlertTriangle,
  ExternalLink,
  Lock,
  Globe,
  Phone,
  Mail,
  UserCheck,
  Award,
} from "lucide-react";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { useToast } from "@/shared/context/ToastContext";

interface ChecklistItem {
  id: string;
  type: string;
  status: "VERIFIED" | "UNVERIFIED" | "MISSING" | "FLAGGED" | "REJECTED" | "EXPIRED";
  mandatory: boolean;
  documentId?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

interface CompletenessDetails {
  companyIdentityPercentage: number;
  contactDetailsPercentage: number;
  businessProfilePercentage: number;
  documentationPercentage: number;
  overallPercentage: number;
  missingMandatoryFields: string[];
}

interface SupplierVerificationWorkspace {
  supplierId: number;
  companyName: string;
  legalName?: string;
  tradeName?: string;
  businessType?: string;
  logoUrl?: string;
  countryCode?: string;
  countryName?: string;
  stateProvince?: string;
  city?: string;
  postalCode?: string;
  registeredAddress?: string;
  businessEmail?: string;
  businessPhone?: string;
  authorizedRepresentativeName?: string;
  authorizedRepresentativeDesignation?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  website?: string;
  taxVatNumber?: string;
  companyRegistrationNumber?: string;
  businessDescription?: string;
  countriesServed?: string;
  primaryCategories?: string;
  yearsInBusiness?: number;
  exportReady?: boolean;
  verified?: boolean;
  verificationStatus: string;
  completenessPercentage: number;
  completenessDetails?: CompletenessDetails;
  checklist: ChecklistItem[];
  adminRequestNotes?: string;
  supplierResponseNotes?: string;
  verificationNotes?: string;
}

export default function SupplierVerificationCenterPage() {
  const toast = useToast();
  const [workspace, setWorkspace] = useState<SupplierVerificationWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active step (1..6)
  const [activeStep, setActiveStep] = useState<number>(1);
  const [savingProgress, setSavingProgress] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form edit states
  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    tradeName: "",
    businessType: "MANUFACTURER",
    registeredAddress: "",
    stateProvince: "",
    city: "",
    postalCode: "",
    countryCode: "US",
    countryName: "United States",
    businessEmail: "",
    businessPhone: "",
    authorizedRepresentativeName: "",
    authorizedRepresentativeDesignation: "",
    website: "",
    taxVatNumber: "",
    companyRegistrationNumber: "",
    businessDescription: "",
    countriesServed: "",
    primaryCategories: "",
    yearsInBusiness: 1,
    exportReady: false,
  });

  // Declarations
  const [declarationAccurate, setDeclarationAccurate] = useState(false);
  const [declarationAuthorized, setDeclarationAuthorized] = useState(false);

  // Information-required response notes
  const [responseNotes, setResponseNotes] = useState("");

  // Document Uploading State
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);

  const loadVerification = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authenticatedFetch("/api/v1/supplier/verification");
      if (!res.ok) throw new Error("Failed to load verification workspace");
      const data: SupplierVerificationWorkspace = await res.json();
      setWorkspace(data);

      setFormData({
        name: data.companyName || "",
        legalName: data.legalName || data.companyName || "",
        tradeName: data.tradeName || "",
        businessType: data.businessType || "MANUFACTURER",
        registeredAddress: data.registeredAddress || "",
        stateProvince: data.stateProvince || "",
        city: data.city || "",
        postalCode: data.postalCode || "",
        countryCode: data.countryCode || "US",
        countryName: data.countryName || "United States",
        businessEmail: data.businessEmail || "",
        businessPhone: data.businessPhone || "",
        authorizedRepresentativeName: data.authorizedRepresentativeName || "",
        authorizedRepresentativeDesignation: data.authorizedRepresentativeDesignation || "",
        website: data.website || "",
        taxVatNumber: data.taxVatNumber || "",
        companyRegistrationNumber: data.companyRegistrationNumber || "",
        businessDescription: data.businessDescription || "",
        countriesServed: data.countriesServed || "",
        primaryCategories: data.primaryCategories || "",
        yearsInBusiness: data.yearsInBusiness || 1,
        exportReady: Boolean(data.exportReady),
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load verification status";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVerification();
  }, [loadVerification]);

  const handleSaveProgress = async () => {
    try {
      setSavingProgress(true);
      const res = await authenticatedFetch("/api/v1/supplier/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save profile progress");
      toast.success("Progress saved successfully.");
      await loadVerification();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving progress";
      toast.error(msg);
    } finally {
      setSavingProgress(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, verificationType: string, documentCategory: string) => {
    const file = e.target.files?.[0];
    if (!file || !workspace) return;

    try {
      setUploadingCategory(verificationType);
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("category", documentCategory);
      uploadFormData.append("title", `${verificationType} Document - ${file.name}`);

      const docRes = await authenticatedFetch(`/api/v1/documents/upload/SUPPLIER/${workspace.supplierId}`, {
        method: "POST",
        body: uploadFormData,
      });

      if (!docRes.ok) throw new Error("Failed to upload document");
      const uploadedDoc = await docRes.json();

      // Attach document to verification requirement
      const attachRes = await authenticatedFetch(
        `/api/v1/supplier/verification/evidence/${verificationType}?documentId=${uploadedDoc.id}`,
        { method: "PUT" }
      );

      if (!attachRes.ok) throw new Error("Failed to link document to verification checklist");

      toast.success("Document uploaded and attached to verification item.");
      await loadVerification();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload error";
      toast.error(msg);
    } finally {
      setUploadingCategory(null);
    }
  };

  const handleSubmitInitialVerification = async () => {
    if (!declarationAccurate || !declarationAuthorized) {
      toast.error("Please acknowledge all compliance declarations before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      // Auto-save form first
      await authenticatedFetch("/api/v1/supplier/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const res = await authenticatedFetch("/api/v1/supplier/verification/submit", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit verification application");
      }

      toast.success("Verification application submitted successfully! Your account is now PENDING review.");
      await loadVerification();
      setActiveStep(6);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission error";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseNotes.trim()) {
      toast.error("Please enter details regarding your remediation submission.");
      return;
    }
    try {
      setSubmitting(true);
      // Auto-save form first
      await authenticatedFetch("/api/v1/supplier/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const res = await authenticatedFetch("/api/v1/supplier/verification/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseNotes: responseNotes.trim() }),
      });
      if (!res.ok) throw new Error("Failed to submit verification response");
      setResponseNotes("");
      toast.success("Response submitted successfully! Your account is now UNDER REVIEW.");
      await loadVerification();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission error";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto p-8 text-center text-xs font-mono font-bold text-[#5E6C84]">
        Loading Supplier Verification Center...
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="max-w-[1400px] mx-auto p-8 space-y-4">
        <div className="p-4 bg-[#FFEBE6] border border-[#FFBDAD] rounded-2xl text-[#DE350B] text-xs font-medium">
          {error || "Verification profile not found"}
        </div>
        <button onClick={loadVerification} className="text-xs font-bold text-[#0052CC] hover:underline cursor-pointer">
          Try Reloading
        </button>
      </div>
    );
  }

  const vStatus = workspace.verificationStatus;
  const isDraftOrInfo = vStatus === "DRAFT" || vStatus === "INFORMATION_REQUIRED";

  const steps = [
    { num: 1, title: "Company Identity" },
    { num: 2, title: "Business Contact" },
    { num: 3, title: "Business Profile" },
    { num: 4, title: "Compliance Docs" },
    { num: 5, title: "Declarations" },
    { num: 6, title: "Review & Status" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* 1. Header & Live Verification Status Banner */}
      <div className="bg-white border border-[#DFE1E6] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-[#0052CC] bg-[#DEEBFF] px-2 py-0.5 rounded uppercase">
              Supplier Compliance
            </span>
            <span className="text-xs text-[#7A869A]">•</span>
            <span className="text-xs font-mono text-[#5E6C84]">Tier 1 Enterprise Due-Diligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#091E42] mt-1">
            Supplier Verification Center
          </h1>
          <p className="text-xs sm:text-sm text-[#5E6C84] mt-0.5">
            Complete the 6-step guided compliance verification to activate enterprise chemical trading.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono text-[#5E6C84] font-semibold">Verification Status</div>
            <div className="flex items-center gap-1.5 mt-0.5 justify-end">
              {vStatus === "VERIFIED" && <ShieldCheck className="w-4 h-4 text-[#00875A]" />}
              {vStatus === "PENDING" && <Clock className="w-4 h-4 text-[#0052CC]" />}
              {vStatus === "UNDER_REVIEW" && <Clock className="w-4 h-4 text-[#FF8B00]" />}
              {vStatus === "INFORMATION_REQUIRED" && <AlertTriangle className="w-4 h-4 text-[#FF8B00]" />}
              {vStatus === "REJECTED" && <AlertCircle className="w-4 h-4 text-[#DE350B]" />}
              {vStatus === "SUSPENDED" && <Lock className="w-4 h-4 text-[#DE350B]" />}

              <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg ${
                vStatus === "VERIFIED" ? "bg-[#E3FCEF] text-[#006644]" :
                vStatus === "INFORMATION_REQUIRED" ? "bg-[#FFF0B3] text-[#974F0C]" :
                vStatus === "UNDER_REVIEW" ? "bg-[#FFF0B3] text-[#974F0C]" :
                vStatus === "PENDING" ? "bg-[#DEEBFF] text-[#0747A6]" :
                vStatus === "REJECTED" || vStatus === "SUSPENDED" ? "bg-[#FFEBE6] text-[#DE350B]" :
                "bg-[#F4F5F7] text-[#172B4D]"
              }`}>
                {vStatus}
              </span>
            </div>
          </div>

          {isDraftOrInfo && (
            <button
              onClick={handleSaveProgress}
              disabled={savingProgress}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#091E42] bg-white hover:bg-[#F4F5F7] border border-[#DFE1E6] rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>{savingProgress ? "Saving..." : "Save Progress"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Status Explanation Banners */}
      {vStatus === "INFORMATION_REQUIRED" && (
        <div className="p-5 rounded-2xl bg-[#FFF0B3] border border-[#FFE380] text-[#974F0C] space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold">
            <AlertTriangle className="w-5 h-5 text-[#FF8B00] shrink-0" />
            <span>Admin Action Required: Additional Information Requested</span>
          </div>
          <p className="text-xs text-[#7A5300] leading-relaxed">
            {workspace.adminRequestNotes || "Our compliance review team requested updates to your business information or documents."}
          </p>
          <div className="pt-1">
            <a href="#respond-section" className="text-xs font-bold text-[#0052CC] hover:underline flex items-center gap-1">
              <span>Jump to remediation response</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {vStatus === "VERIFIED" && (
        <div className="p-5 rounded-2xl bg-[#E3FCEF] border border-[#ABF5D1] text-[#006644] flex items-start gap-3 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-[#00875A] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold">Enterprise Verified Supplier</h3>
            <p className="text-xs text-[#006644] mt-0.5">
              Your company profile and compliance credentials have been verified by Synthora Operations. You are fully authorized for enterprise chemical cataloging and quotation participation.
            </p>
            {workspace.verificationNotes && (
              <p className="text-xs font-mono text-[#00875A] mt-2 bg-white/60 p-2 rounded-lg border border-[#ABF5D1]">
                Notes: {workspace.verificationNotes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 3. Guided Step Navigation Bar & Progress Indicator */}
      <div className="bg-white border border-[#DFE1E6] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#5E6C84] uppercase tracking-wider font-mono">
            Verification Progress: {workspace.completenessPercentage}% Complete
          </span>
          <span className="text-xs text-[#7A869A] font-mono">
            Step {activeStep} of 6
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#EBECF0] rounded-full h-2 overflow-hidden">
          <div
            className="bg-[#0052CC] h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(workspace.completenessPercentage, 100)}%` }}
          />
        </div>

        {/* Step Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
          {steps.map((step) => {
            const isCurrent = activeStep === step.num;
            return (
              <button
                key={step.num}
                onClick={() => setActiveStep(step.num)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-[#DEEBFF] border-[#0052CC] text-[#0052CC] font-bold shadow-2xs"
                    : "bg-[#FAFBFC] border-[#DFE1E6] text-[#172B4D] hover:bg-[#F4F5F7]"
                }`}
              >
                <div className="text-[10px] font-mono uppercase text-[#7A869A]">Step 0{step.num}</div>
                <div className="text-xs font-semibold truncate mt-0.5">{step.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Active Step Content */}
      <div className="bg-white border border-[#DFE1E6] rounded-2xl p-5 sm:p-7 shadow-sm">
        {/* STEP 1: Company Identity */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#091E42] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0052CC]" />
                <span>Step 1: Company Identity & Legal Information</span>
              </h3>
              <p className="text-xs text-[#5E6C84] mt-1">
                Enter your company&apos;s registered corporate name, trading name, and headquarters address.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Company Display Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isDraftOrInfo}
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Legal Registered Name *</label>
                <input
                  type="text"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  disabled={!isDraftOrInfo}
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Trading Name (DBA)</label>
                <input
                  type="text"
                  value={formData.tradeName}
                  onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                  disabled={!isDraftOrInfo}
                  placeholder="Optional trade name"
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Company Registration Number *</label>
                <input
                  type="text"
                  value={formData.companyRegistrationNumber}
                  onChange={(e) => setFormData({ ...formData, companyRegistrationNumber: e.target.value })}
                  disabled={!isDraftOrInfo}
                  placeholder="e.g. CRN-908123"
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Business Type *</label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  disabled={!isDraftOrInfo}
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs cursor-pointer"
                >
                  <option value="MANUFACTURER">Manufacturer / Synthesis Facility</option>
                  <option value="DISTRIBUTOR">Authorized Chemical Distributor</option>
                  <option value="TRADER">Chemical Trader / Stockist</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Corporate Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  disabled={!isDraftOrInfo}
                  placeholder="https://example.com"
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Registered Address *</label>
                <input
                  type="text"
                  value={formData.registeredAddress}
                  onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                  disabled={!isDraftOrInfo}
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!isDraftOrInfo}
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">State / Province</label>
                <input
                  type="text"
                  value={formData.stateProvince}
                  onChange={(e) => setFormData({ ...formData, stateProvince: e.target.value })}
                  disabled={!isDraftOrInfo}
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Country Name *</label>
                <input
                  type="text"
                  value={formData.countryName}
                  onChange={(e) => setFormData({ ...formData, countryName: e.target.value })}
                  disabled={!isDraftOrInfo}
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Postal / Zip Code</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  disabled={!isDraftOrInfo}
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Business Description</label>
                <textarea
                  rows={3}
                  value={formData.businessDescription}
                  onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                  disabled={!isDraftOrInfo}
                  placeholder="Summary of manufacturing operations, chemical specialties, and facilities..."
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Business Contact */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#091E42] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0052CC]" />
                <span>Step 2: Authorized Business Representative</span>
              </h3>
              <p className="text-xs text-[#5E6C84] mt-1">
                Designate the authorized corporate signatory responsible for trading operations and verification.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Authorized Representative Name *</label>
                <input
                  type="text"
                  value={formData.authorizedRepresentativeName}
                  onChange={(e) => setFormData({ ...formData, authorizedRepresentativeName: e.target.value })}
                  disabled={!isDraftOrInfo}
                  placeholder="Full Legal Name"
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Representative Designation / Title *</label>
                <input
                  type="text"
                  value={formData.authorizedRepresentativeDesignation}
                  onChange={(e) => setFormData({ ...formData, authorizedRepresentativeDesignation: e.target.value })}
                  disabled={!isDraftOrInfo}
                  placeholder="e.g. VP Commercial / Director of Sales"
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Business Email *</label>
                <input
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                  disabled={!isDraftOrInfo}
                  placeholder="corporate.contact@domain.com"
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Business Direct Phone *</label>
                <input
                  type="tel"
                  value={formData.businessPhone}
                  onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                  disabled={!isDraftOrInfo}
                  placeholder="+1 (555) 019-2834"
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Business Profile */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#091E42] flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#0052CC]" />
                <span>Step 3: Market Capabilities & Commercial Profile</span>
              </h3>
              <p className="text-xs text-[#5E6C84] mt-1">
                Define the chemical categories, target markets, operational history, and export capabilities.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Primary Chemical Categories *</label>
                <input
                  type="text"
                  value={formData.primaryCategories}
                  onChange={(e) => setFormData({ ...formData, primaryCategories: e.target.value })}
                  disabled={!isDraftOrInfo}
                  placeholder="e.g. Specialty Solvents, Organic Intermediates, Surfactants"
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Countries & Regions Served *</label>
                <input
                  type="text"
                  value={formData.countriesServed}
                  onChange={(e) => setFormData({ ...formData, countriesServed: e.target.value })}
                  disabled={!isDraftOrInfo}
                  placeholder="e.g. North America, EU, APAC, Global"
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Years in Commercial Operation</label>
                <input
                  type="number"
                  min={1}
                  value={formData.yearsInBusiness}
                  onChange={(e) => setFormData({ ...formData, yearsInBusiness: parseInt(e.target.value) || 1 })}
                  disabled={!isDraftOrInfo}
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="exportReady"
                  checked={formData.exportReady}
                  onChange={(e) => setFormData({ ...formData, exportReady: e.target.checked })}
                  disabled={!isDraftOrInfo}
                  className="w-4 h-4 text-[#0052CC] rounded focus:ring-0 cursor-pointer"
                />
                <label htmlFor="exportReady" className="text-xs font-semibold text-[#172B4D] cursor-pointer">
                  Export Ready (Possesses international chemical transport & customs compliance)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Compliance Documentation */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#091E42] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0052CC]" />
                <span>Step 4: Compliance Documentation & Tax Identity</span>
              </h3>
              <p className="text-xs text-[#5E6C84] mt-1">
                Provide corporate tax registrations and upload supporting compliance documents.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[#DFE1E6]">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Tax / VAT Identification Number *</label>
                <input
                  type="text"
                  value={formData.taxVatNumber}
                  onChange={(e) => setFormData({ ...formData, taxVatNumber: e.target.value })}
                  disabled={!isDraftOrInfo}
                  placeholder="e.g. US-EIN-12-3456789 or VAT-DE-998877"
                  className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:bg-white focus:outline-none focus:border-[#0052CC] font-mono shadow-2xs"
                />
              </div>
            </div>

            {/* Document Checklists Upload Matrix */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#5E6C84] uppercase tracking-wider font-mono">
                Required Verification Documents & Evidences
              </h4>

              <div className="space-y-2.5">
                {[
                  {
                    type: "LEGAL_IDENTITY",
                    label: "Business Registration Certificate (CRN)",
                    category: "COMPANY_REGISTRATION",
                    mandatory: true,
                  },
                  {
                    type: "TAX_IDENTITY",
                    label: "Tax / VAT / GST Registration Document",
                    category: "TAX_CERTIFICATE",
                    mandatory: true,
                  },
                  {
                    type: "COMPLIANCE_CERTIFICATION",
                    label: "ISO 9001 / Quality Compliance Certificate",
                    category: "ISO_CERTIFICATE",
                    mandatory: formData.businessType === "MANUFACTURER",
                  },
                  {
                    type: "BUSINESS_OPERATION",
                    label: "Manufacturing / Chemical Synthesis License",
                    category: "MANUFACTURING_LICENSE",
                    mandatory: formData.businessType === "MANUFACTURER",
                  },
                  {
                    type: "EXPORT_CAPABILITY",
                    label: "Export Authorization / Customs Certificate",
                    category: "EXPORT_CERTIFICATE",
                    mandatory: formData.exportReady,
                  },
                ].map((docItem) => {
                  const checkItem = workspace.checklist.find((c) => c.type === docItem.type);
                  const isUploaded = Boolean(checkItem?.documentId);
                  const isUploading = uploadingCategory === docItem.type;

                  return (
                    <div
                      key={docItem.type}
                      className="p-4 rounded-xl bg-[#FAFBFC] border border-[#DFE1E6] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#091E42]">{docItem.label}</span>
                          {docItem.mandatory && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#DEEBFF] text-[#0747A6] font-mono">
                              MANDATORY
                            </span>
                          )}
                          {isUploaded ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#E3FCEF] text-[#006644] font-mono flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              DOCUMENT ATTACHED
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FFF0B3] text-[#974F0C] font-mono">
                              AWAITING UPLOAD
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#5E6C84] mt-0.5">
                          Category: <span className="font-mono">{docItem.category}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isDraftOrInfo && (
                          <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-2xs ${
                            isUploading
                              ? "bg-[#EBECF0] text-[#7A869A]"
                              : "bg-white hover:bg-[#F4F5F7] border-[#DFE1E6] text-[#091E42]"
                          }`}>
                            <Upload className="w-3.5 h-3.5 text-[#0052CC]" />
                            <span>{isUploading ? "Uploading..." : isUploaded ? "Replace File" : "Upload File"}</span>
                            <input
                              type="file"
                              className="hidden"
                              disabled={isUploading}
                              onChange={(e) => handleFileUpload(e, docItem.type, docItem.category)}
                              accept=".pdf,.png,.jpg,.jpeg"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Declarations */}
        {activeStep === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#091E42] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#0052CC]" />
                <span>Step 5: Compliance Declarations & Authorization</span>
              </h3>
              <p className="text-xs text-[#5E6C84] mt-1">
                Please acknowledge that all information provided is accurate and authorized for platform due diligence.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAFBFC] border border-[#DFE1E6] space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="decl1"
                  checked={declarationAccurate}
                  onChange={(e) => setDeclarationAccurate(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-[#0052CC] rounded focus:ring-0 cursor-pointer"
                />
                <label htmlFor="decl1" className="text-xs text-[#172B4D] leading-relaxed cursor-pointer">
                  <strong>Accuracy of Business Information:</strong> I hereby declare that all company identity details, corporate registration certificates, tax identifiers, and compliance documents submitted in this application are genuine, true, and legally valid.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="decl2"
                  checked={declarationAuthorized}
                  onChange={(e) => setDeclarationAuthorized(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-[#0052CC] rounded focus:ring-0 cursor-pointer"
                />
                <label htmlFor="decl2" className="text-xs text-[#172B4D] leading-relaxed cursor-pointer">
                  <strong>Authorized Representative Consent:</strong> I confirm that I am legally authorized by the registered entity to execute supplier agreements, issue chemical commercial quotations, and represent the organization on the Synthora marketplace.
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Review & Final Submission */}
        {activeStep === 6 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#091E42] flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#0052CC]" />
                <span>Step 6: Application Review & Submission Desk</span>
              </h3>
              <p className="text-xs text-[#5E6C84] mt-1">
                Review your compliance readiness before submitting your verification application for admin review.
              </p>
            </div>

            {/* Checklist Overview */}
            <div className="p-5 rounded-2xl bg-[#FAFBFC] border border-[#DFE1E6] space-y-3">
              <h4 className="text-xs font-bold text-[#5E6C84] uppercase tracking-wider font-mono">
                Pre-Submission Readiness Checklist
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00875A]" />
                  <span>Company Identity: {formData.legalName ? "Completed" : "Incomplete"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00875A]" />
                  <span>Authorized Contact: {formData.authorizedRepresentativeName ? "Completed" : "Incomplete"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00875A]" />
                  <span>Business Profile: {formData.primaryCategories ? "Completed" : "Incomplete"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00875A]" />
                  <span>Tax Identification: {formData.taxVatNumber ? "Completed" : "Incomplete"}</span>
                </div>
              </div>
            </div>

            {/* Action Section based on Status */}
            {vStatus === "DRAFT" && (
              <div className="p-6 rounded-2xl bg-[#DEEBFF] border border-[#B3D4FF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[#0747A6]">Ready to Submit Application?</h4>
                  <p className="text-xs text-[#0052CC] mt-0.5">
                    Once submitted, our compliance review team will inspect your documentation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSubmitInitialVerification}
                  disabled={submitting || !declarationAccurate || !declarationAuthorized}
                  className="px-5 py-2.5 bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Submitting..." : "Submit for Verification"}</span>
                </button>
              </div>
            )}

            {vStatus === "INFORMATION_REQUIRED" && (
              <div id="respond-section" className="p-6 rounded-2xl bg-[#FFF0B3] border border-[#FFE380] space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-[#974F0C]">Remediation Response Desk</h4>
                  <p className="text-xs text-[#7A5300] mt-0.5">
                    Detail the updates and document corrections made in response to the administrative review notes.
                  </p>
                </div>

                <form onSubmit={handleSubmitResponse} className="space-y-3">
                  <textarea
                    rows={3}
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    placeholder="Describe changes made (e.g. 'Uploaded renewed ISO certificate and updated corporate address')..."
                    className="w-full bg-white border border-[#FFE380] rounded-xl p-3 text-xs text-[#091E42] focus:outline-none focus:border-[#FF8B00] font-mono shadow-2xs"
                    required
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting || !responseNotes.trim()}
                      className="px-5 py-2.5 bg-[#FF8B00] hover:bg-[#DE7000] text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submitting ? "Submitting..." : "Resubmit for Verification"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Step Navigation Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-[#DFE1E6] mt-6">
          <button
            type="button"
            onClick={() => setActiveStep((prev) => Math.max(prev - 1, 1))}
            disabled={activeStep === 1}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#5E6C84] hover:text-[#091E42] hover:bg-[#F4F5F7] rounded-xl border border-[#DFE1E6] transition-colors cursor-pointer disabled:opacity-30"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Step</span>
          </button>

          <div className="flex items-center gap-2">
            {isDraftOrInfo && (
              <button
                type="button"
                onClick={handleSaveProgress}
                disabled={savingProgress}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#091E42] bg-white hover:bg-[#F4F5F7] border border-[#DFE1E6] rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-[#0052CC]" />
                <span>Save Progress</span>
              </button>
            )}

            {activeStep < 6 && (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => Math.min(prev + 1, 6))}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
