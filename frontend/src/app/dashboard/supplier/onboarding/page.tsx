"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import {
  Building2,
  MapPin,
  Globe,
  FileText,
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Save,
  Send,
  Loader2,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  UserCheck,
  Check,
  Sparkles,
  Info,
  Lock
} from "lucide-react";

interface SupplierProfile {
  supplierId: number;
  userId: string;
  name: string;
  slug: string;
  legalName: string;
  tradeName?: string;
  businessType: string;
  registeredAddress?: string;
  stateProvince?: string;
  city?: string;
  postalCode?: string;
  countryCode?: string;
  countryName?: string;
  businessEmail?: string;
  businessPhone?: string;
  authorizedRepresentativeName?: string;
  authorizedRepresentativeDesignation?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  website?: string;
  taxVatNumber?: string;
  companyRegistrationNumber?: string;
  businessDescription?: string;
  countriesServed?: string;
  primaryCategories?: string;
  logoUrl?: string;
  verified: boolean;
  yearsInBusiness?: number;
  exportReady: boolean;
  verificationStatus: string;
  verificationNotes?: string;
  adminRequestInfoNotes?: string;
  supplierResponseNotes?: string;
}

interface UploadedDocument {
  id: string;
  fileName: string;
  documentType: string;
  uploadedAt: string;
}

const STEPS = [
  { id: 1, label: "Company Identity", desc: "Legal details & Logo" },
  { id: 2, label: "Registered Address", desc: "Headquarters location" },
  { id: 3, label: "Business Profile", desc: "Operations & Markets" },
  { id: 4, label: "Official Contact", desc: "Contacts & Verification" },
  { id: 5, label: "Documents & Submit", desc: "KYC & Verification" },
];

export default function SupplierOnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Form State
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [businessType, setBusinessType] = useState("MANUFACTURER");
  const [companyRegistrationNumber, setCompanyRegistrationNumber] = useState("");
  const [taxVatNumber, setTaxVatNumber] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState<number | "">("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Address
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateProvince, setStateProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const [countryName, setCountryName] = useState("India");

  // Business Profile
  const [website, setWebsite] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [primaryCategories, setPrimaryCategories] = useState("");
  const [countriesServed, setCountriesServed] = useState("");
  const [exportReady, setExportReady] = useState(false);

  // Contacts
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [authorizedRepresentativeName, setAuthorizedRepresentativeName] = useState("");
  const [authorizedRepresentativeDesignation, setAuthorizedRepresentativeDesignation] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Documents
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState("COMPANY_REGISTRATION");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);

      const res = await authenticatedFetch("/api/v1/supplier/profile");

      if (!res.ok) {
        throw new Error("Failed to load supplier profile data.");
      }

      const data: SupplierProfile = await res.json();
      setProfile(data);

      setName(data.name || "");
      setLegalName(data.legalName || data.name || "");
      setTradeName(data.tradeName || "");
      setBusinessType(data.businessType || "MANUFACTURER");
      setCompanyRegistrationNumber(data.companyRegistrationNumber || "");
      setTaxVatNumber(data.taxVatNumber || "");
      setYearsInBusiness(data.yearsInBusiness !== undefined && data.yearsInBusiness !== null ? data.yearsInBusiness : "");
      setLogoUrl(data.logoUrl || null);

      setRegisteredAddress(data.registeredAddress || "");
      setCity(data.city || "");
      setStateProvince(data.stateProvince || "");
      setPostalCode(data.postalCode || "");
      setCountryCode(data.countryCode || "IN");
      setCountryName(data.countryName || "India");

      setWebsite(data.website || "");
      setBusinessDescription(data.businessDescription || "");
      setPrimaryCategories(data.primaryCategories || "");
      setCountriesServed(data.countriesServed || "");
      setExportReady(Boolean(data.exportReady));

      setBusinessEmail(data.businessEmail || "");
      setBusinessPhone(data.businessPhone || "");
      setAuthorizedRepresentativeName(data.authorizedRepresentativeName || "");
      setAuthorizedRepresentativeDesignation(data.authorizedRepresentativeDesignation || "");
      setEmailVerified(Boolean(data.emailVerified));
      setPhoneVerified(Boolean(data.phoneVerified));

      // Load documents if ownerId available
      if (data.userId) {
        loadDocuments(data.userId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }

  async function loadDocuments(userId: string) {
    try {
      const res = await authenticatedFetch(`/api/v1/documents?ownerType=SUPPLIER&ownerId=${userId}`);
      if (res.ok) {
        const docs = await res.json();
        setDocuments(docs.map((d: any) => ({
          id: d.id,
          fileName: d.originalFileName || d.fileName,
          documentType: d.documentType,
          uploadedAt: d.createdAt,
        })));
      }
    } catch {
      // Ignored non-critical failure
    }
  }

  async function handleSaveDraft(silent = false) {
    try {
      setSaving(true);
      setError(null);
      if (!silent) setSuccessMessage(null);

      const payload = {
        name,
        legalName,
        tradeName,
        businessType,
        companyRegistrationNumber,
        taxVatNumber,
        yearsInBusiness: yearsInBusiness === "" ? null : Number(yearsInBusiness),
        registeredAddress,
        city,
        stateProvince,
        postalCode,
        countryCode,
        countryName,
        website,
        businessDescription,
        primaryCategories,
        countriesServed,
        exportReady,
        businessEmail,
        businessPhone,
        authorizedRepresentativeName,
        authorizedRepresentativeDesignation,
      };

      const res = await authenticatedFetch("/api/v1/supplier/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to save profile draft.");
      }

      const updated = await res.json();
      setProfile(updated);
      if (!silent) {
        setSuccessMessage("Onboarding draft saved successfully.");
        setTimeout(() => setSuccessMessage(null), 3500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Logo image file size must be less than 5 MB.");
      return;
    }

    try {
      setLogoUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await authenticatedFetch("/api/v1/supplier/profile/logo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to upload company logo.");
      }

      const updated = await res.json();
      setProfile(updated);
      setLogoUrl(updated.logoUrl);
      setSuccessMessage("Company logo uploaded and updated successfully.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload logo.");
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveLogo() {
    try {
      setLogoUploading(true);
      setError(null);

      const res = await authenticatedFetch("/api/v1/supplier/profile/logo", {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to remove logo.");
      }

      const updated = await res.json();
      setProfile(updated);
      setLogoUrl(null);
      setSuccessMessage("Company logo removed successfully.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove logo.");
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleVerifyEmail() {
    try {
      setError(null);
      const res = await authenticatedFetch("/api/v1/supplier/verification/verify-email", {
        method: "POST",
      });
      if (res.ok) {
        setEmailVerified(true);
        setSuccessMessage("Business email verified successfully.");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError("Email verification failed.");
    }
  }

  async function handleVerifyPhone() {
    try {
      setError(null);
      const res = await authenticatedFetch("/api/v1/supplier/verification/verify-phone", {
        method: "POST",
      });
      if (res.ok) {
        setPhoneVerified(true);
        setSuccessMessage("Business phone number verified successfully.");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError("Phone verification failed.");
    }
  }

  async function handleDocumentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile?.userId) return;

    try {
      setDocUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("ownerType", "SUPPLIER");
      formData.append("ownerId", profile.userId);
      formData.append("documentType", selectedDocType);

      const res = await authenticatedFetch("/api/v1/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to upload document.");
      }

      await loadDocuments(profile.userId);
      setSuccessMessage("Verification document uploaded successfully.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Document upload failed.");
    } finally {
      setDocUploading(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  }

  async function handleSubmitVerification() {
    if (!name.trim() || !legalName.trim()) {
      setError("Company Name and Legal Entity Name are mandatory for verification.");
      setCurrentStep(1);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // First save draft silently
      await handleSaveDraft(true);

      const res = await authenticatedFetch("/api/v1/supplier/verification/submit", {
        method: "POST",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to submit verification request.");
      }

      const updated = await res.json();
      setProfile(updated);
      setSubmittedSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit verification application.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
            Loading Supplier Onboarding Workspace...
          </p>
        </div>
      </div>
    );
  }

  if (submittedSuccess || profile?.verificationStatus === "PENDING" || profile?.verificationStatus === "UNDER_REVIEW") {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 text-center space-y-6">
          <div className="w-16 h-16 bg-purple-50 border border-purple-200 rounded-full flex items-center justify-center mx-auto text-purple-600 shadow-sm">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-purple-600 font-mono">
              APPLICATION SUBMITTED &bull; STATUS: {profile?.verificationStatus || "PENDING"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Company Verification in Review
            </h1>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Thank you, <strong className="text-slate-900">{profile?.name}</strong>. Your official company identity and KYC documents have been submitted to KemKendra Compliance administrators.
            </p>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-3 text-xs text-slate-700">
            <div className="flex items-center justify-between font-bold border-b border-slate-200 pb-2">
              <span>Marketplace Verification Checklist</span>
              <span className="text-purple-600 font-mono">Awaiting Review</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Company Information & Registered Address Recorded</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Official Company Logo: {logoUrl ? "Uploaded" : "Standard Icon"}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>KYC Compliance Documents: {documents.length} File(s) Attached</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard/supplier"
              className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-2"
            >
              Go to Supplier Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => { setSubmittedSuccess(false); setCurrentStep(1); }}
              className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition"
            >
              Edit Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (profile?.verified || profile?.verificationStatus === "VERIFIED") {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-emerald-200 shadow-xl p-8 sm:p-12 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 font-mono">
              VERIFIED SUPPLIER PARTNER
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Company Identity Fully Verified
            </h1>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Your company profile is fully accredited. Your listings and verified logo are eligible for public display across the Chemical Catalog.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-xl border border-emerald-200 bg-white p-1" />
            )}
            <div className="text-left">
              <span className="font-extrabold text-slate-900 text-base block">{profile.name}</span>
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Official KemKendra Verified Accreditation
              </span>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/dashboard/supplier"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md"
            >
              Enter Supplier Workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-purple-600 font-mono">
              SUPPLIER ONBOARDING &bull; STEP {currentStep} OF {STEPS.length}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Company Verification Profile
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Provide your official business identity, company logo, and verification documents to activate your verified supplier status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveDraft(false)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition shadow-2xs disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-slate-500" />}
              <span>{saving ? "SAVING..." : "SAVE DRAFT"}</span>
            </button>

            <Link
              href="/dashboard/supplier"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition"
            >
              Exit
            </Link>
          </div>
        </div>

        {/* Notifications / Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {profile?.adminRequestInfoNotes && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
            <span className="font-extrabold text-amber-800 uppercase tracking-wider block">
              Attention: Admin Verification Feedback
            </span>
            <p>{profile.adminRequestInfoNotes}</p>
          </div>
        )}

        {/* Multi-step Progress Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isActive
                    ? "bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-600/20"
                    : isCompleted
                    ? "bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100/50"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono font-bold uppercase ${isActive ? "text-purple-200" : isCompleted ? "text-purple-600" : "text-slate-400"}`}>
                    0{step.id}
                  </span>
                  {isCompleted && <Check className="w-3.5 h-3.5 text-purple-600" />}
                </div>
                <div className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-slate-800"}`}>
                  {step.label}
                </div>
                <div className={`text-[10px] truncate ${isActive ? "text-purple-100" : "text-slate-400"}`}>
                  {step.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Wizard Form Workspace */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
          
          {/* STEP 1: COMPANY IDENTITY & LOGO */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 font-mono">
                  SECTION 01 / LEGAL IDENTITY & LOGO
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  Company Identity & Visual Branding
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your legal corporate entity and public company logo displayed to verified buyers in the Chemical Catalog.
                </p>
              </div>

              {/* Logo Upload Box */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs group">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building2 className="w-8 h-8 text-slate-400" />
                  )}
                  {logoUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Company Logo</span>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">Public Asset</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Upload your high-resolution company emblem (PNG, JPG, or WEBP &le; 5 MB). This logo will appear next to your name across public search listings and offering drawers.
                  </p>
                  <div className="pt-1 flex items-center gap-2 justify-center sm:justify-start">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-purple-600" />
                      <span>{logoUrl ? "Replace Logo" : "Upload Logo"}</span>
                    </label>
                    {logoUrl && (
                      <button
                        type="button"
                        disabled={logoUploading}
                        onClick={handleRemoveLogo}
                        className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Marketplace Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Apex Fine Chemicals Ltd."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Legal Registered Entity Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="e.g. Apex Fine Chemicals Private Limited"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Trading / Brand Name
                  </label>
                  <input
                    type="text"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    placeholder="e.g. Apex Chem"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Primary Business Classification
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none bg-white"
                  >
                    <option value="MANUFACTURER">Manufacturer / Chemical Producer</option>
                    <option value="DISTRIBUTOR">Authorized Chemical Distributor</option>
                    <option value="TRADER">Specialty Chemical Trader / Wholesaler</option>
                    <option value="CUSTOM_SYNTHESIS">Custom Synthesis / CRO / CDMO</option>
                    <option value="EXPORTER">Export Trading House</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Company Registration / CIN Number
                  </label>
                  <input
                    type="text"
                    value={companyRegistrationNumber}
                    onChange={(e) => setCompanyRegistrationNumber(e.target.value)}
                    placeholder="e.g. U24110MH2012PTC234567"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tax / VAT / GST Number
                  </label>
                  <input
                    type="text"
                    value={taxVatNumber}
                    onChange={(e) => setTaxVatNumber(e.target.value)}
                    placeholder="e.g. 27AABCA1234F1Z5"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Years in Business
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={yearsInBusiness}
                    onChange={(e) => setYearsInBusiness(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 15"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: REGISTERED ADDRESS */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 font-mono">
                  SECTION 02 / OFFICIAL LOCATION
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  Registered Headquarters & Facility Address
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official corporate headquarters and manufacturing plant location for compliance and logistics verification.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Registered Street Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={registeredAddress}
                    onChange={(e) => setRegisteredAddress(e.target.value)}
                    placeholder="e.g. Plot No. 42, MIDC Industrial Area, Phase II"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      State / Province
                    </label>
                    <input
                      type="text"
                      value={stateProvince}
                      onChange={(e) => setStateProvince(e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Postal / ZIP Code
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 400001"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={countryName}
                      onChange={(e) => setCountryName(e.target.value)}
                      placeholder="e.g. India"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BUSINESS PROFILE & CAPABILITIES */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 font-mono">
                  SECTION 03 / CAPABILITIES & OPERATIONS
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  Business Operations, Markets & Export
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Describe your manufacturing portfolio, export readiness, and specialized chemical categories.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official Website URL
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.apexchemicals.example.com"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Company Overview & Technical Capabilities
                  </label>
                  <textarea
                    rows={4}
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="Describe your production facility, synthesis reactors, purity standards, and market history..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Primary Chemical Categories (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={primaryCategories}
                      onChange={(e) => setPrimaryCategories(e.target.value)}
                      placeholder="e.g. APIs, Intermediates, Fine Chemicals, Solvents"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Export Markets Served (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={countriesServed}
                      onChange={(e) => setCountriesServed(e.target.value)}
                      placeholder="e.g. USA, Germany, Japan, United Kingdom"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">Export Capability Ready</span>
                    <span className="text-[11px] text-slate-500">
                      Does your facility hold export licenses, hazmat packaging certifications, and international shipping logistics?
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportReady}
                      onChange={(e) => setExportReady(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: OFFICIAL CONTACT & VERIFICATION */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 font-mono">
                  SECTION 04 / CONTACTS & IDENTITY VERIFICATION
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  Official Representatives & Contact Verification
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify your authorized corporate contact email and phone number for secure marketplace communications.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Authorized Representative Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={authorizedRepresentativeName}
                      onChange={(e) => setAuthorizedRepresentativeName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Kumar"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Designation / Role in Company
                    </label>
                    <input
                      type="text"
                      value={authorizedRepresentativeDesignation}
                      onChange={(e) => setAuthorizedRepresentativeDesignation(e.target.value)}
                      placeholder="e.g. Managing Director / Head of Sales"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    />
                  </div>
                </div>

                {/* Email Verification Box */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 w-full">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Official Business Email <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-400" /> Bound to account
                      </span>
                    </div>
                    <input
                      type="email"
                      value={businessEmail}
                      readOnly
                      disabled
                      aria-readonly="true"
                      aria-disabled="true"
                      placeholder="Loading verified account email..."
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-slate-100/90 cursor-not-allowed select-all font-mono font-medium focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Populated from your authenticated KemKendra registration account. This email is permanently linked to your workspace.
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 pt-2 sm:pt-5">
                    {emailVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 shadow-2xs">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> EMAIL VERIFIED ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleVerifyEmail}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-2xs flex items-center gap-1.5"
                      >
                        Verify Email Now
                      </button>
                    )}
                  </div>
                </div>

                {/* Phone Verification Box */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Official Business Mobile / Phone
                    </label>
                    <input
                      type="tel"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none bg-white font-mono"
                    />
                  </div>

                  <div className="shrink-0 flex items-center gap-2 pt-2 sm:pt-5">
                    {phoneVerified ? (
                      <span className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> PHONE VERIFIED ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleVerifyPhone}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-2xs"
                      >
                        Verify Phone Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: DOCUMENTS & SUBMIT */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 font-mono">
                  SECTION 05 / KYC COMPLIANCE & SUBMISSION
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  Upload Verification Evidence & Submit
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload government incorporation certificates, GST/tax filings, or manufacturing licenses. These documents are securely encrypted and accessible ONLY by KemKendra administrators.
                </p>
              </div>

              {/* Document Upload Widget */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Attach KYC Evidence Document
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-semibold">
                    Confidential &bull; Admin & Owner Access Only
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <select
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 bg-white font-medium outline-none focus:border-purple-500"
                    >
                      <option value="COMPANY_REGISTRATION">Certificate of Incorporation / Registration</option>
                      <option value="TAX_ID">Tax / GST / VAT Registration Document</option>
                      <option value="MANUFACTURING_LICENSE">Drug / Chemical Manufacturing License</option>
                      <option value="ISO_CERTIFICATE">ISO / GMP Quality Accreditation</option>
                      <option value="EXPORT_LICENSE">Import Export Code (IEC) / Trade Permit</option>
                    </select>
                  </div>

                  <div>
                    <input
                      ref={docInputRef}
                      type="file"
                      accept=".pdf, image/png, image/jpeg"
                      onChange={handleDocumentUpload}
                      className="hidden"
                      id="kyc-doc-upload"
                    />
                    <label
                      htmlFor="kyc-doc-upload"
                      className={`cursor-pointer w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-2xs ${
                        docUploading ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      {docUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>{docUploading ? "UPLOADING..." : "UPLOAD DOCUMENT"}</span>
                    </label>
                  </div>
                </div>

                {/* Attached Document List */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Attached Verification Documents ({documents.length})
                  </span>

                  {documents.length === 0 ? (
                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-400">
                      No verification documents attached yet. Upload registration certificates to speed up compliance verification.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate">{doc.fileName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {doc.documentType} &bull; {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <a
                            href={`/api/v1/documents/${doc.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-purple-600 hover:bg-purple-50 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Download
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Overview */}
              <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-3">
                <div className="flex items-center gap-2 text-purple-900 font-extrabold text-sm">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Ready to Submit Application</span>
                </div>
                <p className="text-xs text-purple-800 leading-relaxed">
                  Upon submission, your application will transition to <strong className="font-mono">PENDING VERIFICATION</strong>. KemKendra marketplace compliance officers will review your documents within 1 business day.
                </p>
              </div>
            </div>
          )}

          {/* Stepper Navigation Footer */}
          <div className="pt-8 border-t border-slate-100 flex items-center justify-between gap-4">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous Step
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md"
                >
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitVerification}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition shadow-lg disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      SUBMITTING VERIFICATION...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-purple-200" />
                      SUBMIT FOR VERIFICATION
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
