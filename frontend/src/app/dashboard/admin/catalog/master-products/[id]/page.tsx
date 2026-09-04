"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FlaskConical,
  CheckCircle2,
  Building2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
  Tag,
  FileText,
  Download,
  DollarSign,
  Package,
  Layers,
  Edit2,
  Power,
  Shield,
  X,
  Copy,
  Check,
} from "lucide-react";
import { getCategoryAbbreviation, getCategoryDisplayName } from "@/features/categories/utils/categoryUtils";
import {
  getMasterProductDetail,
  updateMasterProduct,
  verifyChemicalField,
  setMasterProductStatus,
  addOfficialSynonym,
  addOfficialSynonymsBulk,
  deleteSynonym,
  reviewSynonym,
  uploadMasterProductImage,
  deleteMasterProductImage,
  setPrimaryMasterProductImage,
  uploadMasterProductDocument,
  deleteMasterProductDocument,
  createOfferingOnBehalfOfSupplier,
  updateAdminOffering,
  setAdminOfferingStatus,
  getAdminSuppliersList,
} from "@/features/admin/api/adminCatalogApi";
import { SupplierSearchCombobox } from "@/features/admin/components/SupplierSearchCombobox";
import { parseApiError } from "@/shared/utils/errorParser";
import { useToast } from "@/shared/context/ToastContext";

export default function MasterProductGovernanceDetailPage() {
  const toast = useToast();
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Synonyms Form State
  const [newSynonym, setNewSynonym] = useState("");
  const [synonymSubmitting, setSynonymSubmitting] = useState(false);

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  // Document Upload State
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docCategory, setDocCategory] = useState("PRODUCT_SPECIFICATION");
  const [docNumber, setDocNumber] = useState("");
  const [docUploading, setDocUploading] = useState(false);

  // Field Verification Modal
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [fieldStatus, setFieldStatus] = useState("VERIFIED");
  const [fieldNotes, setFieldNotes] = useState("");

  // Create Offering on Behalf of Supplier Modal State
  const [showCreateOfferingModal, setShowCreateOfferingModal] = useState(false);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | "">("");
  const [offeringPrice, setOfferingPrice] = useState("");
  const [offeringCurrency, setOfferingCurrency] = useState("INR");
  const [offeringStock, setOfferingStock] = useState("");
  const [offeringPurity, setOfferingPurity] = useState("");
  const [offeringGrade, setOfferingGrade] = useState("");
  const [offeringMoq, setOfferingMoq] = useState("");
  const [offeringPackaging, setOfferingPackaging] = useState("");
  const [offeringLeadTime, setOfferingLeadTime] = useState("");
  const [offeringCoa, setOfferingCoa] = useState(true);
  const [offeringMsds, setOfferingMsds] = useState(true);
  const [offeringExportReady, setOfferingExportReady] = useState(true);
  const [offeringAdminNotes, setOfferingAdminNotes] = useState("");
  const [createOfferingSubmitting, setCreateOfferingSubmitting] = useState(false);

  // Edit Offering Modal State
  const [editingOffering, setEditingOffering] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editPurity, setEditPurity] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editAvailabilityStatus, setEditAvailabilityStatus] = useState("AVAILABLE");
  const [editModerationStatus, setEditModerationStatus] = useState("APPROVED");
  const [editNotes, setEditNotes] = useState("");
  const [editOfferingSubmitting, setEditOfferingSubmitting] = useState(false);

  // Edit Master Product State
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editProductName, setEditProductName] = useState("");
  const [editProductCategory, setEditProductCategory] = useState("API");
  const [editProductCas, setEditProductCas] = useState("");
  const [editProductFormula, setEditProductFormula] = useState("");
  const [editProductStatus, setEditProductStatus] = useState("ACTIVE");
  const [editProductDescription, setEditProductDescription] = useState("");
  const [editProductReason, setEditProductReason] = useState("");
  const [editProductSubmitting, setEditProductSubmitting] = useState(false);
  const [editProductErrors, setEditProductErrors] = useState<Record<string, string>>({});

  // Bulk Synonyms State
  const [showBulkSynonymsModal, setShowBulkSynonymsModal] = useState(false);
  const [bulkSynonymsInput, setBulkSynonymsInput] = useState("");
  const [parsedSynonyms, setParsedSynonyms] = useState<string[]>([]);
  const [bulkSynonymsSubmitting, setBulkSynonymsSubmitting] = useState(false);

  // Delete Synonym Confirmation Modal State
  const [synonymToDelete, setSynonymToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteSynonymSubmitting, setDeleteSynonymSubmitting] = useState(false);

  // Copy code feedback state
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = async () => {
    if (!detail?.masterProductCode) return;
    try {
      await navigator.clipboard.writeText(detail.masterProductCode);
      setCopiedCode(true);
      toast.success("Master Product Code copied to clipboard");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Failed to copy product code");
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMasterProductDetail(id);
      setDetail(data);
    } catch (e: any) {
      setError(e.message || "Failed to load master product detail");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadData();
  }, [id, loadData]);

  const handleVerifyFieldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedField) return;
    try {
      setActionLoading(true);
      await verifyChemicalField(id, {
        fieldName: selectedField,
        status: fieldStatus,
        notes: fieldNotes.trim() || undefined,
      });
      setSelectedField(null);
      setFieldNotes("");
      toast.success("Field verification recorded");
      await loadData();
    } catch (e: any) {
      toast.error("Failed to record verification: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!detail) return;
    const newStatus = detail.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      setActionLoading(true);
      await setMasterProductStatus(detail.id, newStatus);
      toast.success(`Master Chemical status updated to ${newStatus}`);
      await loadData();
    } catch (e: any) {
      toast.error("Failed to change status: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSynonym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSynonym.trim()) return;
    try {
      setSynonymSubmitting(true);
      await addOfficialSynonym(id, newSynonym.trim());
      setNewSynonym("");
      toast.success("Official synonym added");
      await loadData();
    } catch (e: any) {
      toast.error("Failed to add synonym: " + e.message);
    } finally {
      setSynonymSubmitting(false);
    }
  };

  const handleDeleteSynonym = async (synonymId: string) => {
    try {
      setActionLoading(true);
      await deleteSynonym(id, synonymId);
      toast.success("Synonym deleted");
      await loadData();
    } catch (e: any) {
      toast.error("Failed to delete synonym: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const parseSynonymsFromText = (input: string): string[] => {
    if (!input) return [];
    const items = input.split(/[\r\n,;]+/);
    const seen = new Set<string>();
    const result: string[] = [];

    for (const raw of items) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const lower = trimmed.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        result.push(trimmed);
      }
    }
    return result;
  };

  const handleBulkSynonymsInputChange = (text: string) => {
    setBulkSynonymsInput(text);
    setParsedSynonyms(parseSynonymsFromText(text));
  };

  const handleRemovePreviewSynonym = (indexToRemove: number) => {
    setParsedSynonyms((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const openEditProductModal = () => {
    if (!detail) return;
    setEditProductName(detail.name || "");
    setEditProductCategory(detail.category || "API");
    setEditProductCas(detail.casNumber || "");
    setEditProductFormula(detail.molecularFormula || "");
    setEditProductStatus(detail.status || "ACTIVE");
    setEditProductDescription(detail.description || "");
    setEditProductReason("");
    setEditProductErrors({});
    setShowEditProductModal(true);
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!editProductName.trim()) {
      newErrors.name = "Canonical chemical name is required";
    }
    if (!editProductCategory) {
      newErrors.category = "Category is required";
    }
    if (editProductCas.trim()) {
      const casRegex = /^\d{2,7}-\d{2}-\d$/;
      if (!casRegex.test(editProductCas.trim())) {
        newErrors.casNumber = "Invalid CAS format (e.g. 103-90-2)";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setEditProductErrors(newErrors);
      return;
    }

    try {
      setEditProductSubmitting(true);
      setEditProductErrors({});
      await updateMasterProduct(id, {
        name: editProductName.trim(),
        category: editProductCategory,
        casNumber: editProductCas.trim() || undefined,
        molecularFormula: editProductFormula.trim() || undefined,
        status: editProductStatus,
        description: editProductDescription.trim() || undefined,
        updateReason: editProductReason.trim() || undefined,
      });
      toast.success("Master Product updated successfully");
      setShowEditProductModal(false);
      await loadData();
    } catch (err: any) {
      const errMsg = parseApiError(err, "Failed to update master product", "general");
      toast.error(errMsg);
      setEditProductErrors({ general: errMsg });
    } finally {
      setEditProductSubmitting(false);
    }
  };

  const handleBulkSynonymsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedSynonyms.length === 0) {
      toast.error("Please provide at least one valid synonym");
      return;
    }

    try {
      setBulkSynonymsSubmitting(true);
      const res = await addOfficialSynonymsBulk(id, parsedSynonyms);
      toast.success(
        `Added ${res.addedCount || parsedSynonyms.length} synonym(s)${
          res.skippedCount && res.skippedCount > 0 ? ` (${res.skippedCount} skipped as duplicate)` : ""
        }`
      );
      setShowBulkSynonymsModal(false);
      setBulkSynonymsInput("");
      setParsedSynonyms([]);
      await loadData();
    } catch (err: any) {
      toast.error(parseApiError(err, "Failed to bulk add synonyms", "general"));
    } finally {
      setBulkSynonymsSubmitting(false);
    }
  };

  const handleConfirmDeleteSynonym = async () => {
    if (!synonymToDelete) return;
    try {
      setDeleteSynonymSubmitting(true);
      await deleteSynonym(id, synonymToDelete.id);
      toast.success(`Synonym "${synonymToDelete.name}" removed`);
      setSynonymToDelete(null);
      await loadData();
    } catch (err: any) {
      toast.error(parseApiError(err, "Failed to delete synonym", "general"));
    } finally {
      setDeleteSynonymSubmitting(false);
    }
  };

  const handleReviewSynonym = async (synonymId: string, status: "APPROVED" | "REJECTED") => {
    try {
      setActionLoading(true);
      await reviewSynonym(synonymId, status);
      toast.success(`Synonym ${status.toLowerCase()}`);
      await loadData();
    } catch (e: any) {
      toast.error(`Failed to ${status.toLowerCase()} synonym: ` + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;
    try {
      setImageUploading(true);
      await uploadMasterProductImage(id, imageFile, imageAlt.trim() || undefined);
      setImageFile(null);
      setImageAlt("");
      toast.success("Chemical structure image uploaded");
      await loadData();
    } catch (e: any) {
      toast.error("Failed to upload image: " + e.message);
    } finally {
      setImageUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      setActionLoading(true);
      await deleteMasterProductImage(id, imageId);
      toast.success("Product image removed");
      await loadData();
    } catch (e: any) {
      toast.error("Failed to delete image: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    try {
      setActionLoading(true);
      await setPrimaryMasterProductImage(id, imageId);
      toast.success("Primary image updated");
      await loadData();
    } catch (e: any) {
      toast.error("Failed to set primary image: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) return;
    try {
      setDocUploading(true);
      await uploadMasterProductDocument(id, docFile, docCategory, docNumber.trim() || undefined);
      setDocFile(null);
      setDocNumber("");
      toast.success("Technical document uploaded");
      await loadData();
    } catch (e: any) {
      toast.error("Failed to upload document: " + e.message);
    } finally {
      setDocUploading(false);
    }
  };

  const handleDeleteDoc = async (documentId: string) => {
    try {
      setActionLoading(true);
      await deleteMasterProductDocument(documentId);
      toast.success("Technical document removed");
      await loadData();
    } catch (e: any) {
      toast.error("Failed to delete document: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateOfferingModal = async () => {
    setShowCreateOfferingModal(true);
    try {
      setSuppliersLoading(true);
      const suppliers = await getAdminSuppliersList();
      setSuppliersList(suppliers);
    } catch (e: any) {
      toast.error(parseApiError(e, "Failed to load suppliers", "general"));
    } finally {
      setSuppliersLoading(false);
    }
  };

  const handleCreateOfferingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      toast.error("Please select a verified supplier partner");
      return;
    }
    const parsedPrice = parseFloat(offeringPrice);
    if (!offeringPrice || isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error("Please enter a valid unit price greater than 0");
      return;
    }
    try {
      setCreateOfferingSubmitting(true);
      await createOfferingOnBehalfOfSupplier({
        supplierId: Number(selectedSupplierId),
        masterProductId: id,
        price: parsedPrice,
        currency: offeringCurrency,
        stock: offeringStock ? parseInt(offeringStock, 10) : 0,
        purity: offeringPurity ? parseFloat(offeringPurity) : undefined,
        grade: offeringGrade.trim() || undefined,
        moqKg: offeringMoq ? parseFloat(offeringMoq) : undefined,
        packaging: offeringPackaging.trim() || undefined,
        leadTimeDays: offeringLeadTime ? parseInt(offeringLeadTime, 10) : undefined,
        coaAvailable: offeringCoa,
        msdsAvailable: offeringMsds,
        exportReady: offeringExportReady,
        availabilityStatus: "AVAILABLE",
        moderationStatus: "APPROVED",
        adminNotes: offeringAdminNotes.trim() || "Created by KemKendra Admin on behalf of supplier",
      });
      toast.success("Commercial offering created on behalf of supplier");
      setShowCreateOfferingModal(false);
      setSelectedSupplierId("");
      setOfferingPrice("");
      setOfferingStock("");
      setOfferingPurity("");
      setOfferingGrade("");
      setOfferingMoq("");
      setOfferingPackaging("");
      setOfferingLeadTime("");
      setOfferingAdminNotes("");
      await loadData();
    } catch (e: any) {
      toast.error(parseApiError(e, "Failed to create commercial offering", "offering"));
    } finally {
      setCreateOfferingSubmitting(false);
    }
  };

  const handleToggleOfferingStatus = async (offering: any) => {
    const newStatus = offering.availabilityStatus === "AVAILABLE" ? "HIDDEN" : "AVAILABLE";
    try {
      setActionLoading(true);
      await setAdminOfferingStatus(offering.id, newStatus);
      toast.success(`Offering status updated to ${newStatus}`);
      await loadData();
    } catch (e: any) {
      toast.error("Failed to update status: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditOfferingModal = (offering: any) => {
    setEditingOffering(offering);
    setEditPrice(offering.price?.toString() || "");
    setEditStock(offering.stock?.toString() || "0");
    setEditPurity(offering.purity?.toString() || "");
    setEditGrade(offering.grade || "");
    setEditAvailabilityStatus(offering.availabilityStatus || "AVAILABLE");
    setEditModerationStatus(offering.moderationStatus || "APPROVED");
    setEditNotes(offering.moderationNotes || "");
  };

  const handleEditOfferingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffering) return;
    try {
      setEditOfferingSubmitting(true);
      await updateAdminOffering(editingOffering.id, {
        price: editPrice ? parseFloat(editPrice) : undefined,
        stock: editStock ? parseInt(editStock, 10) : undefined,
        purity: editPurity ? parseFloat(editPurity) : undefined,
        grade: editGrade.trim() || undefined,
        availabilityStatus: editAvailabilityStatus,
        moderationStatus: editModerationStatus,
        moderationNotes: editNotes.trim() || undefined,
      });
      toast.success("Offering updated successfully");
      setEditingOffering(null);
      await loadData();
    } catch (e: any) {
      toast.error("Failed to update offering: " + e.message);
    } finally {
      setEditOfferingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-xs font-bold text-slate-500">
        Loading Master Product Governance Workspace...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-7xl mx-auto p-8 space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium">
          {error || "Master Product not found"}
        </div>
        <Link href="/dashboard/admin/catalog" className="text-xs font-bold text-blue-600 underline">
          &larr; Return to Master Catalog
        </Link>
      </div>
    );
  }

  const verifiedFieldsMap = detail.verifiedFields || {};

  const fieldItems = [
    {
      label: "01 / CHEMICAL NAME",
      val: detail.name,
      key: "NAME",
      req: true,
      isVerified: verifiedFieldsMap.NAME === "VERIFIED" || Boolean(detail.name && detail.name.trim()),
    },
    {
      label: "02 / CAS REGISTRY NUMBER",
      val: detail.casNumber || "N/A",
      key: "CAS_NUMBER",
      req: true,
      isVerified: verifiedFieldsMap.CAS_NUMBER === "VERIFIED" || Boolean(detail.casNumber && detail.casNumber !== "N/A"),
    },
    {
      label: "03 / MOLECULAR FORMULA",
      val: detail.molecularFormula || "N/A",
      key: "MOLECULAR_FORMULA",
      req: true,
      isVerified: verifiedFieldsMap.MOLECULAR_FORMULA === "VERIFIED" || Boolean(detail.molecularFormula && detail.molecularFormula !== "N/A"),
    },
    {
      label: "04 / PRODUCT CATEGORY",
      val: detail.category,
      key: "CATEGORY",
      req: true,
      isVerified: verifiedFieldsMap.CATEGORY === "VERIFIED" || Boolean(detail.category),
    },
    {
      label: "05 / TECHNICAL DESCRIPTION",
      val: detail.description ? "Present" : "Missing",
      key: "DESCRIPTION",
      req: false,
      isVerified: verifiedFieldsMap.DESCRIPTION === "VERIFIED" || Boolean(detail.description && detail.description.trim()),
    },
    {
      label: "06 / CANONICAL CODE",
      val: detail.masterProductCode,
      key: "PRODUCT_CODE",
      req: true,
      isVerified: verifiedFieldsMap.PRODUCT_CODE === "VERIFIED" || Boolean(detail.masterProductCode),
    },
    {
      label: "07 / TECHNICAL DOCUMENTS",
      val: detail.documents?.length ? `${detail.documents.length} Docs` : (verifiedFieldsMap.DOCUMENTS === "VERIFIED" ? "Verified Standard" : "None Uploaded"),
      key: "DOCUMENTS",
      req: false,
      isVerified: verifiedFieldsMap.DOCUMENTS === "VERIFIED" || (detail.documents && detail.documents.length > 0),
    },
    {
      label: "08 / CANONICAL IMAGE",
      val: detail.images?.length ? `${detail.images.length} Images` : (verifiedFieldsMap.CANONICAL_IMAGE === "VERIFIED" ? "Verified Mesh" : "Default Mesh"),
      key: "CANONICAL_IMAGE",
      req: false,
      isVerified: verifiedFieldsMap.CANONICAL_IMAGE === "VERIFIED" || (detail.images && detail.images.length > 0),
    },
    {
      label: "09 / DUPLICATE RISK",
      val: verifiedFieldsMap.DUPLICATE_CHECK === "REJECTED" ? "Conflict Detected" : "No Conflict Detected",
      key: "DUPLICATE_CHECK",
      req: true,
      isVerified: verifiedFieldsMap.DUPLICATE_CHECK !== "REJECTED" && verifiedFieldsMap.DUPLICATE_CHECK !== "ATTENTION_REQUIRED",
    },
    {
      label: "10 / OFFERING CONSISTENCY",
      val: `${detail.offeringCount || 0} Connected Offerings`,
      key: "OFFERING_CONSISTENCY",
      req: true,
      isVerified: verifiedFieldsMap.OFFERING_CONSISTENCY !== "REJECTED" && verifiedFieldsMap.OFFERING_CONSISTENCY !== "ATTENTION_REQUIRED",
    },
  ];

  const verifiedCount = fieldItems.filter(i => i.isVerified).length;
  const totalFields = fieldItems.length;
  const scorePercent = Math.round((verifiedCount / totalFields) * 100);

  const approvedSynonyms = detail.synonyms?.filter((s: any) => s.status === "APPROVED") || [];
  const pendingSynonyms = detail.synonyms?.filter((s: any) => s.status === "PENDING") || [];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/catalog"
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{detail.name}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-900 text-white font-mono text-[11px] font-bold rounded-lg shadow-2xs">
                <span>{detail.masterProductCode}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="hover:text-blue-400 transition-colors p-0.5 rounded cursor-pointer"
                  title="Copy Master Product Code"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-300 hover:text-white" />}
                </button>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                detail.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                detail.status === "MERGED" ? "bg-purple-50 text-purple-800 border border-purple-200" :
                "bg-slate-100 text-slate-700 border border-slate-200"
              }`}>
                {detail.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Canonical Chemical Governance & Identity Verification Workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openEditProductModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Product
          </button>
          <button
            type="button"
            disabled={detail.status === "MERGED" || actionLoading}
            onClick={handleToggleStatus}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-2xs disabled:opacity-40 cursor-pointer"
          >
            {detail.status === "ACTIVE" ? "Deactivate Product" : "Activate Product"}
          </button>
        </div>
      </div>

      {/* Verification Score Ribbon */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">
            GOVERNANCE COMPLIANCE SCORE
          </span>
          <h2 className="text-xl font-extrabold flex items-center gap-3">
            {verifiedCount} / {totalFields} FIELDS CONFIRMED ({scorePercent}%)
          </h2>
          <p className="text-xs text-slate-300">
            {scorePercent === 100
              ? "All canonical identity and compliance requirements verified."
              : "Some compliance fields require administrative evidence review."}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`px-3 py-1.5 rounded-xl font-extrabold text-xs uppercase ${
            scorePercent === 100 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
          }`}>
            {scorePercent === 100 ? "FULL COMPLIANCE" : "ATTENTION REQUIRED"}
          </span>
        </div>
      </div>

      {/* Grid Layout: Governance Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Identity, Synonyms, Images, Documents, Checklist, Offerings */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 01: CANONICAL CHEMICAL IDENTITY */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-blue-600" /> 01 / CANONICAL CHEMICAL IDENTITY
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Canonical Name</span>
                <strong className="text-slate-900 text-sm font-extrabold">{detail.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Master Product Code</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <strong className="text-slate-900 font-mono text-sm font-extrabold">{detail.masterProductCode}</strong>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Copy Master Product Code"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">CAS Registry Number</span>
                <strong className="text-slate-900 font-mono font-bold block mt-0.5">{detail.casNumber || "N/A"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Molecular Formula</span>
                <strong className="text-slate-900 font-mono font-bold block mt-0.5">{detail.molecularFormula || "N/A"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Product Category</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-extrabold rounded uppercase tracking-wide border border-blue-200">
                    {getCategoryAbbreviation(detail.category)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({getCategoryDisplayName(detail.category)})
                  </span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Commercial Offerings</span>
                <strong className="text-slate-900 font-bold">{detail.offeringCount} Active Offerings</strong>
              </div>
            </div>

            {detail.description && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Technical Description</span>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                  {detail.description}
                </p>
              </div>
            )}
          </div>

          {/* SECTION 02: PRODUCT SYNONYMS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" /> 02 / PRODUCT SYNONYMS & TRADE NAMES
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">
                  {approvedSynonyms.length} Official / {pendingSynonyms.length} Pending
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBulkSynonymsInput("");
                    setParsedSynonyms([]);
                    setShowBulkSynonymsModal(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Bulk Add Synonyms
                </button>
              </div>
            </div>

            {/* Approved Synonyms Tags */}
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-2">
                Active Catalog Synonyms (Globally Searchable)
              </span>
              <div className="flex flex-wrap gap-2">
                {approvedSynonyms.length > 0 ? (
                  approvedSynonyms.map((syn: any) => (
                    <span
                      key={syn.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl"
                    >
                      <span>{syn.synonym}</span>
                      {syn.source === "SUPPLIER" && (
                        <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1 rounded">Supplier</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setSynonymToDelete({ id: syn.id, name: syn.synonym })}
                        disabled={actionLoading}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                        title="Remove Synonym"
                      >
                        &times;
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No official synonyms configured yet.</p>
                )}
              </div>
            </div>

            {/* Add Official Synonym Inline Form */}
            <form onSubmit={handleAddSynonym} className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={newSynonym}
                onChange={(e) => setNewSynonym(e.target.value)}
                placeholder="Add official synonym (e.g. Aspirin, ASA, 2-Acetoxybenzoic acid)..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
              />
              <button
                type="submit"
                disabled={synonymSubmitting || !newSynonym.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs disabled:opacity-40 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Synonym
              </button>
            </form>

            {/* Pending Supplier Suggestions Review */}
            {pendingSynonyms.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <span className="text-slate-400 block text-[10px] uppercase font-bold text-amber-600">
                  Pending Supplier Synonym Suggestions ({pendingSynonyms.length})
                </span>
                <div className="space-y-2">
                  {pendingSynonyms.map((syn: any) => (
                    <div
                      key={syn.id}
                      className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl flex items-center justify-between gap-4"
                    >
                      <div>
                        <strong className="text-slate-900 text-xs font-bold block">{syn.synonym}</strong>
                        <span className="text-[10px] text-slate-500">
                          Suggested by {syn.createdByName || "Supplier User"} &bull; {new Date(syn.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleReviewSynonym(syn.id, "APPROVED")}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-all"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleReviewSynonym(syn.id, "REJECTED")}
                          className="px-3 py-1 bg-white border border-slate-300 hover:bg-rose-50 text-rose-700 text-[11px] font-bold rounded-lg transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 03: CANONICAL CHEMICAL IMAGES */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" /> 03 / CANONICAL PRODUCT IMAGES & MOLECULAR MESH
              </h3>
              <span className="text-xs font-bold text-slate-500">{detail.images?.length || 0} / 10 Assets</span>
            </div>

            {/* Images Grid / Gallery */}
            {detail.images && detail.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {detail.images.map((img: any) => (
                  <div
                    key={img.id}
                    className={`relative p-3 rounded-2xl border ${
                      img.isPrimary ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 bg-slate-50"
                    } flex flex-col items-center justify-between gap-2 text-center group`}
                  >
                    <div className="w-full h-24 bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
                      <img
                        src={`/api/v1/master-products/${id}/images/${img.id}/content`}
                        alt={img.altText || detail.name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as any).src = "";
                          (e.target as any).className = "hidden";
                        }}
                      />
                    </div>
                    <div className="w-full">
                      <span className="text-[11px] font-bold text-slate-900 truncate block">
                        {img.fileName}
                      </span>
                      {img.isPrimary && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold rounded uppercase">
                          PRIMARY IMAGE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 w-full justify-center pt-1 border-t border-slate-200/60">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleSetPrimaryImage(img.id)}
                          className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-[10px] font-bold rounded-lg text-slate-700"
                        >
                          Make Primary
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleDeleteImage(img.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                        title="Delete Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                No canonical product image uploaded. Master Catalog will display default molecular mesh.
              </div>
            )}

            {/* Image Upload Form */}
            <form onSubmit={handleImageUpload} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Upload New Canonical Image
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                />
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Image alt text / description..."
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={imageUploading || !imageFile}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Asset
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 04: TECHNICAL COMPLIANCE DOCUMENTS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> 04 / CANONICAL TECHNICAL COMPLIANCE DOCUMENTS
              </h3>
              <span className="text-xs font-bold text-slate-500">{detail.documents?.length || 0} Documents</span>
            </div>

            {/* Documents List */}
            {detail.documents && detail.documents.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {detail.documents.map((doc: any) => (
                  <div key={doc.id} className="py-3 flex items-center justify-between text-xs font-medium">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold">{doc.originalFileName}</strong>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-extrabold rounded uppercase">
                          {doc.category?.replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-slate-500 text-[11px] block">
                        {(doc.fileSize / 1024).toFixed(1)} KB &bull; Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                        {doc.documentNumber && ` &bull; Ref #${doc.documentNumber}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/v1/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                No canonical technical specifications or MSDS documents uploaded.
              </div>
            )}

            {/* Document Upload Form */}
            <form onSubmit={handleDocUpload} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Upload New Specification / MSDS / TDS Document
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                />
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                >
                  <option value="PRODUCT_SPECIFICATION">Product Specification</option>
                  <option value="MSDS">Material Safety Data Sheet (MSDS)</option>
                  <option value="TECHNICAL_DATA_SHEET">Technical Data Sheet (TDS)</option>
                  <option value="COA">Certificate of Analysis (COA Template)</option>
                  <option value="OTHER">Other Compliance Document</option>
                </select>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="Doc / Spec Number..."
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={docUploading || !docFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Document
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 05: FIELD-LEVEL CHEMICAL VERIFICATION CHECKLIST */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> 05 / FIELD-LEVEL CHEMICAL VERIFICATION CHECKLIST
              </h3>
              <span className="text-xs font-bold text-slate-500">{verifiedCount}/{totalFields} Confirmed</span>
            </div>

            <div className="space-y-3 text-xs font-medium">
              {fieldItems.map((item) => {
                return (
                  <div key={item.key} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-300 transition-all">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold">{item.val}</strong>
                        {item.isVerified ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold rounded uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> VERIFIED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-extrabold rounded uppercase flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-600" /> ATTENTION REQUIRED
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedField(item.key)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl font-bold transition-all shadow-2xs shrink-0"
                    >
                      Audit Field
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 06: CONNECTED SUPPLIER OFFERINGS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" /> 06 / CONNECTED SUPPLIER OFFERINGS ({detail.offerings?.length || 0})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Commercial listings active across verified supplier partners for this chemical identity.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateOfferingModal}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Create Offering on Behalf of Supplier
              </button>
            </div>

            {detail.offerings && detail.offerings.length > 0 ? (
              <div className="space-y-3">
                {detail.offerings.map((offering: any) => (
                  <div
                    key={offering.id}
                    className="p-4 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-2xl transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-slate-900 font-bold text-xs">{offering.supplierName}</strong>
                          {offering.supplierVerified && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold rounded">
                              VERIFIED
                            </span>
                          )}
                          {offering.createdByRole === "ADMIN" ? (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-extrabold rounded-md flex items-center gap-1">
                              <Shield className="w-3 h-3 text-purple-600" /> Created by KemKendra Admin ({offering.createdByAdminName || "Admin"})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-200/70 text-slate-700 text-[10px] font-extrabold rounded-md flex items-center gap-1">
                              🏢 Created by Supplier
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 text-[11px] flex-wrap">
                          <span>Purity: <strong className="text-slate-700 font-semibold">{offering.purity ? `${offering.purity}%` : "N/A"}</strong></span>
                          <span>&bull;</span>
                          <span>Grade: <strong className="text-slate-700 font-semibold">{offering.grade || "N/A"}</strong></span>
                          <span>&bull;</span>
                          <span>Stock: <strong className="text-slate-700 font-semibold">{offering.stock} kg</strong></span>
                          <span>&bull;</span>
                          <span>MOQ: <strong className="text-slate-700 font-semibold">{offering.moqKg ? `${offering.moqKg} kg` : "N/A"}</strong></span>
                          {offering.leadTimeDays && (
                            <>
                              <span>&bull;</span>
                              <span>Lead Time: <strong className="text-slate-700 font-semibold">{offering.leadTimeDays}d</strong></span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="text-right">
                          <strong className="text-slate-900 font-mono font-bold text-sm block">
                            {offering.currency} {offering.price?.toLocaleString()}
                          </strong>
                          <div className="flex items-center gap-1.5 justify-end mt-0.5">
                            <span
                              className={`px-2 py-0.5 text-[9px] font-extrabold rounded uppercase ${
                                offering.availabilityStatus === "AVAILABLE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {offering.availabilityStatus}
                            </span>
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded uppercase">
                              {offering.moderationStatus || "APPROVED"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => openEditOfferingModal(offering)}
                            className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs"
                            title="Edit Offering Parameters"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleToggleOfferingStatus(offering)}
                            className={`p-1.5 border rounded-lg text-xs font-bold transition-all shadow-2xs ${
                              offering.availabilityStatus === "AVAILABLE"
                                ? "bg-white border-slate-300 hover:bg-rose-50 text-rose-700"
                                : "bg-emerald-50 border-emerald-300 hover:bg-emerald-100 text-emerald-800"
                            }`}
                            title={offering.availabilityStatus === "AVAILABLE" ? "Deactivate Offering" : "Activate Offering"}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {offering.moderationNotes && (
                      <div className="p-2.5 bg-white border border-slate-200/60 rounded-xl text-[11px] text-slate-600 italic">
                        &quot;{offering.moderationNotes}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-2xl space-y-2">
                <p className="font-semibold text-slate-700">No supplier offerings linked to this Master Chemical yet.</p>
                <p className="text-[11px]">You can list an offering on behalf of an authorized supplier partner.</p>
                <button
                  type="button"
                  onClick={openCreateOfferingModal}
                  className="mt-2 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Create First Offering
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Governance Audit Timeline */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" /> GOVERNANCE AUDIT LOGS
              </h3>
            </div>

            {detail.auditLogs && detail.auditLogs.length > 0 ? (
              <div className="space-y-3 text-xs font-medium">
                {detail.auditLogs.map((log: any) => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>{log.actorName}</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <strong className="text-slate-900 block font-bold">{log.action?.replace("_", " ")}</strong>
                    {log.reason && <p className="text-slate-600 italic text-[11px]">&quot;{log.reason}&quot;</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">
                No administrative audit logs recorded for this chemical identity.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Field Verification Modal */}
      {selectedField && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">Audit Chemical Field: {selectedField}</h3>
            <form onSubmit={handleVerifyFieldSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Verification Status *</label>
                <select
                  value={fieldStatus}
                  onChange={(e) => setFieldStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="VERIFIED">VERIFIED (Confirmed by Standards)</option>
                  <option value="NEEDS_REVIEW">NEEDS REVIEW (Flagged for Inspection)</option>
                  <option value="CONFLICT">CONFLICT (Discrepancy Detected)</option>
                  <option value="MISSING">MISSING (Data Not Provided)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Audit Notes / Evidence Reference</label>
                <textarea
                  rows={3}
                  value={fieldNotes}
                  onChange={(e) => setFieldNotes(e.target.value)}
                  placeholder="Record reference standards, certificate numbers, or verification rationale..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedField(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-2xs"
                >
                  Save Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Offering on Behalf of Supplier */}
      {showCreateOfferingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden my-8 animate-in fade-in-50 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Create Commercial Offering
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Listing chemical offering for <span className="font-semibold text-slate-700">{detail.name}</span> ({detail.masterProductCode}).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateOfferingModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOfferingSubmit} className="p-6 space-y-5 text-xs font-medium text-slate-900">
              {/* Section 1: Supplier Partner (Main Focus) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">
                    Supplier Partner <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-normal">Legal commercial owner</span>
                </div>
                <SupplierSearchCombobox
                  value={selectedSupplierId}
                  onChange={(id) => setSelectedSupplierId(id)}
                  initialSuppliers={suppliersList}
                  disabled={createOfferingSubmitting}
                  required
                />
              </div>

              {/* Section 2: Commercial Details */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Commercial Terms
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Unit Price (per kg) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={offeringPrice}
                      onChange={(e) => setOfferingPrice(e.target.value)}
                      placeholder="e.g. 1250.00"
                      className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Currency *</label>
                    <select
                      value={offeringCurrency}
                      onChange={(e) => setOfferingCurrency(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Availability & Quality */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Availability & Specifications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Stock (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={offeringStock}
                      onChange={(e) => setOfferingStock(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Purity (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={offeringPurity}
                      onChange={(e) => setOfferingPurity(e.target.value)}
                      placeholder="e.g. 99.5"
                      className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Quality Grade</label>
                    <input
                      type="text"
                      value={offeringGrade}
                      onChange={(e) => setOfferingGrade(e.target.value)}
                      placeholder="e.g. Pharma / USP"
                      className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lead Time (days)</label>
                    <input
                      type="number"
                      min="0"
                      value={offeringLeadTime}
                      onChange={(e) => setOfferingLeadTime(e.target.value)}
                      placeholder="e.g. 7"
                      className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">MOQ (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={offeringMoq}
                      onChange={(e) => setOfferingMoq(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Packaging Description</label>
                    <input
                      type="text"
                      value={offeringPackaging}
                      onChange={(e) => setOfferingPackaging(e.target.value)}
                      placeholder="e.g. 200L HDPE Drums"
                      className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Documentation & Compliance */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Documentation & Compliance
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50/60 border border-slate-200 rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={offeringCoa}
                      onChange={(e) => setOfferingCoa(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span>COA Available</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={offeringMsds}
                      onChange={(e) => setOfferingMsds(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span>MSDS Available</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={offeringExportReady}
                      onChange={(e) => setOfferingExportReady(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span>Export Ready</span>
                  </label>
                </div>
              </div>

              {/* Section 5: Administrative Notes */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-700">
                  Administrative Notes
                </label>
                <textarea
                  rows={2}
                  value={offeringAdminNotes}
                  onChange={(e) => setOfferingAdminNotes(e.target.value)}
                  placeholder="Record onboarding agreements, sourcing reference, or internal governance notes..."
                  className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all text-xs"
                />
              </div>

              {/* Ownership & Governance Notice (Subtle, neutral design) */}
              <div className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800">Ownership & Governance</p>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    The selected supplier will remain the legal commercial owner of this offering. Administrator creation will be preserved in the audit ledger.
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateOfferingModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOfferingSubmitting || !selectedSupplierId || !offeringPrice}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {createOfferingSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Listing Offering...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>List Commercial Offering</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Offering */}
      {editingOffering && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">
              Edit Offering: {editingOffering.supplierName}
            </h3>
            <form onSubmit={handleEditOfferingSubmit} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Price ({editingOffering.currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock (kg)</label>
                  <input
                    type="number"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Purity (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPurity}
                    onChange={(e) => setEditPurity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grade</label>
                  <input
                    type="text"
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Availability Status</label>
                  <select
                    value={editAvailabilityStatus}
                    onChange={(e) => setEditAvailabilityStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="HIDDEN">HIDDEN</option>
                    <option value="FLAGGED">FLAGGED</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Moderation Status</label>
                  <select
                    value={editModerationStatus}
                    onChange={(e) => setEditModerationStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="APPROVED">APPROVED</option>
                    <option value="PENDING_REVIEW">PENDING REVIEW</option>
                    <option value="DEACTIVATED">DEACTIVATED</option>
                    <option value="FLAGGED">FLAGGED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Moderation / Governance Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Record adjustment reason..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOffering(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editOfferingSubmitting}
                  className="px-5 py-2 bg-purple-600 text-white font-bold rounded-xl shadow-2xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Master Product */}
      {showEditProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                  Edit Master Product
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update chemical identity, categorization, and technical metadata.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditProductModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editProductErrors.general && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editProductErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleEditProductSubmit} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Canonical Name */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Canonical Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editProductName}
                    onChange={(e) => {
                      setEditProductName(e.target.value);
                      if (editProductErrors.name) {
                        setEditProductErrors((prev) => {
                          const c = { ...prev };
                          delete c.name;
                          return c;
                        });
                      }
                    }}
                    placeholder="e.g. Paracetamol / Acetaminophen"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      editProductErrors.name ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                    }`}
                    required
                  />
                  {editProductErrors.name && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">{editProductErrors.name}</p>
                  )}
                </div>

                {/* Master Product Code (Immutable) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Master Product Code</span>
                    <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">Immutable</span>
                  </label>
                  <input
                    type="text"
                    value={detail.masterProductCode}
                    disabled
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono font-bold cursor-not-allowed select-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Product codes are permanent identifiers and do not change when category details are updated.
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Product Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editProductCategory}
                    onChange={(e) => setEditProductCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                    required
                  >
                    <option value="API">Active Pharmaceutical Ingredient (API)</option>
                    <option value="INTERMEDIATE">Chemical Intermediate</option>
                    <option value="EXCIPIENT">Pharmaceutical Excipient</option>
                    <option value="SOLVENT">Industrial Solvent</option>
                    <option value="SPECIALTY_CHEMICAL">Specialty Chemical</option>
                    <option value="LAB_CHEMICAL">Laboratory Chemical</option>
                  </select>
                </div>

                {/* CAS Registry Number */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    CAS Registry Number
                  </label>
                  <input
                    type="text"
                    value={editProductCas}
                    onChange={(e) => {
                      setEditProductCas(e.target.value);
                      if (editProductErrors.casNumber) {
                        setEditProductErrors((prev) => {
                          const c = { ...prev };
                          delete c.casNumber;
                          return c;
                        });
                      }
                    }}
                    placeholder="e.g. 103-90-2"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      editProductErrors.casNumber ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                    }`}
                  />
                  {editProductErrors.casNumber && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">{editProductErrors.casNumber}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    Standard format: 2 to 7 digits, hyphen, 2 digits, hyphen, 1 check digit.
                  </p>
                </div>

                {/* Molecular Formula */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Molecular Formula
                  </label>
                  <input
                    type="text"
                    value={editProductFormula}
                    onChange={(e) => setEditProductFormula(e.target.value)}
                    placeholder="e.g. C8H9NO2"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Hill system notation recommended.</p>
                </div>

                {/* Governance Status */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Governance Status
                  </label>
                  <select
                    value={editProductStatus}
                    onChange={(e) => setEditProductStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE (Published to marketplace)</option>
                    <option value="INACTIVE">INACTIVE (Hidden from general search)</option>
                  </select>
                </div>

                {/* Technical Description */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Technical Description & Synoptic Profile
                  </label>
                  <textarea
                    rows={3}
                    value={editProductDescription}
                    onChange={(e) => setEditProductDescription(e.target.value)}
                    placeholder="Enter comprehensive chemical specifications, applications, and handling notes..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-normal"
                  />
                </div>

                {/* Reason for Change / Audit Trail */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Reason for Change <span className="text-slate-400 font-normal">(Recorded in Compliance Audit Log)</span>
                  </label>
                  <input
                    type="text"
                    value={editProductReason}
                    onChange={(e) => setEditProductReason(e.target.value)}
                    placeholder="e.g. Corrected IUPAC nomenclature and updated formula per regulatory spec"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditProductModal(false)}
                  disabled={editProductSubmitting}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editProductSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {editProductSubmitting ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Add Synonyms */}
      {showBulkSynonymsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-indigo-600" />
                  Add Synonyms in Bulk
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste or type multiple trade names, IUPAC aliases, or research identifiers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkSynonymsModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkSynonymsSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Paste Synonyms
                </label>
                <textarea
                  rows={6}
                  value={bulkSynonymsInput}
                  onChange={(e) => handleBulkSynonymsInputChange(e.target.value)}
                  placeholder={`4-Carbazolol\n4-Hydroxy Carbazole\n4-Hydroxy-9H-carbazole\n9H-Carbazol-4-ol\n\nOr comma/semicolon separated:\n4-Carbazolol, 4-Hydroxy Carbazole; 9H-Carbazol-4-ol`}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-normal leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports newlines, commas, and semicolons. Whitespace is automatically trimmed and duplicates are discarded.
                </p>
              </div>

              {/* Preview Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-700">
                    Preview ({parsedSynonyms.length} item{parsedSynonyms.length === 1 ? "" : "s"})
                  </span>
                  {parsedSynonyms.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setParsedSynonyms([]);
                        setBulkSynonymsInput("");
                      }}
                      className="text-[10px] text-rose-600 hover:underline font-bold cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {parsedSynonyms.length > 0 ? (
                  <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {parsedSynonyms.map((syn, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-lg shadow-2xs group"
                      >
                        <span>{syn}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePreviewSynonym(idx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs italic">
                    Paste or type synonyms above to preview items before adding.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBulkSynonymsModal(false)}
                  disabled={bulkSynonymsSubmitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkSynonymsSubmitting || parsedSynonyms.length === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {bulkSynonymsSubmitting
                    ? "Adding Synonyms..."
                    : `Add ${parsedSynonyms.length} Synonym${parsedSynonyms.length === 1 ? "" : "s"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Synonym */}
      {synonymToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Delete Synonym?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm removal from catalog search index.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              Are you sure you want to remove <strong className="text-slate-900 font-bold">"{synonymToDelete.name}"</strong>?
              Once removed, buyer searches matching this exact synonym will no longer resolve to this master product.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSynonymToDelete(null)}
                disabled={deleteSynonymSubmitting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSynonym}
                disabled={deleteSynonymSubmitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
              >
                {deleteSynonymSubmitting ? "Deleting..." : "Delete Synonym"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
