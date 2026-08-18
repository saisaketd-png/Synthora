"use client";

import React, { useState } from "react";
import {
  Eye,
  Edit3,
  ShieldCheck,
  Boxes,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Package,
} from "lucide-react";
import {
  AdminProductResponse,
  ProductAvailability,
  PaginatedResponse,
  UpdateAdminProductRequest,
} from "../../types";
import { EnterpriseTable, Column } from "@/shared/components/EnterpriseTable";
import { AdminBadge } from "../AdminBadge";
import { AdminPagination } from "../AdminPagination";
import { AdminSearchFilterBar } from "../AdminSearchFilterBar";
import { AdminConfirmModal } from "../AdminConfirmModal";
import { AdminProductDetailModal } from "./AdminProductDetailModal";
import { AdminProductEditModal } from "./AdminProductEditModal";
import { AdminProductAvailabilityModal } from "./AdminProductAvailabilityModal";
import { AdminProductSupplierModal } from "./AdminProductSupplierModal";
import {
  updateAdminProduct,
  updateAdminProductAvailability,
  deactivateAdminProduct,
} from "../../api/adminApi";

interface AdminProductListProps {
  data: PaginatedResponse<AdminProductResponse> | null;
  isLoading: boolean;
  page: number;
  pageSize: number;
  query: string;
  category: string;
  availabilityFilter: ProductAvailability | "";
  onPageChange: (newPage: number) => void;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onAvailabilityChange: (status: ProductAvailability | "") => void;
  onRefresh: () => void;
}

export function AdminProductList({
  data,
  isLoading,
  page,
  pageSize,
  query,
  category,
  availabilityFilter,
  onPageChange,
  onSearchChange,
  onCategoryChange,
  onAvailabilityChange,
  onRefresh,
}: AdminProductListProps) {
  // Inspect Modal
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Edit Modal
  const [editingProduct, setEditingProduct] = useState<AdminProductResponse | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Availability Modal
  const [availabilityProduct, setAvailabilityProduct] = useState<AdminProductResponse | null>(null);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);

  // Supplier Offerings Modal
  const [supplierOfferingsProductId, setSupplierOfferingsProductId] = useState<string | null>(null);
  const [supplierOfferingsProductName, setSupplierOfferingsProductName] = useState<string | undefined>(undefined);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Deactivate Confirm Modal
  const [deactivatingProduct, setDeactivatingProduct] = useState<AdminProductResponse | null>(null);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isDeactivateLoading, setIsDeactivateLoading] = useState(false);

  // Toast Feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleInspect = (product: AdminProductResponse) => {
    setSelectedProductId(product.id);
    setIsDetailOpen(true);
  };

  const handleEdit = (product: AdminProductResponse) => {
    setEditingProduct(product);
    setIsEditOpen(true);
  };

  const handleSaveProduct = async (id: string, reqData: UpdateAdminProductRequest) => {
    await updateAdminProduct(id, reqData);
    showFeedback("success", "Product metadata and specifications updated. Recorded in audit log.");
    onRefresh();
  };

  const handleAvailability = (product: AdminProductResponse) => {
    setAvailabilityProduct(product);
    setIsAvailabilityOpen(true);
  };

  const handleConfirmAvailability = async (
    productId: string,
    status: ProductAvailability,
    reason?: string
  ) => {
    await updateAdminProductAvailability(productId, { availabilityStatus: status, reason });
    showFeedback("success", `Product availability updated to ${status}. Recorded in audit log.`);
    onRefresh();
  };

  const handleOpenSuppliers = (productId: string, productName?: string) => {
    setSupplierOfferingsProductId(productId);
    setSupplierOfferingsProductName(productName);
    setIsSupplierModalOpen(true);
  };

  const handleDeactivate = (product: AdminProductResponse) => {
    setDeactivatingProduct(product);
    setIsDeactivateOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingProduct) return;
    setIsDeactivateLoading(true);
    try {
      await deactivateAdminProduct(deactivatingProduct.id);
      showFeedback(
        "success",
        `Product marked as DISCONTINUED. Catalog visibility disabled. Recorded in audit log.`
      );
      setIsDeactivateOpen(false);
      onRefresh();
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to deactivate product");
    } finally {
      setIsDeactivateLoading(false);
    }
  };

  const columns: Column<AdminProductResponse>[] = [
    {
      header: "Product / Chemical",
      cell: (product) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-2xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs border border-emerald-200">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">{product.name}</p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span className="font-mono text-slate-400">CAS: {product.casNumber || "N/A"}</span>
              <span>•</span>
              <span className="font-semibold text-slate-600">{product.category}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Price & Stock",
      cell: (product) => (
        <div className="text-xs font-medium text-slate-800">
          <p className="font-bold text-slate-900">${product.price.toFixed(2)}</p>
          <span className="text-[11px] text-slate-500">{product.stock} units in stock</span>
        </div>
      ),
    },
    {
      header: "Availability",
      cell: (product) => <AdminBadge type={product.availabilityStatus} />,
    },
    {
      header: "Catalog Owner",
      cell: (product) => (
        <div className="text-xs">
          <p className="font-bold text-slate-800 truncate max-w-[140px]">
            {product.sellerName || "Synthora Direct"}
          </p>
          <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
            {product.sellerEmail || `ID: ${product.sellerId.substring(0, 8)}...`}
          </p>
        </div>
      ),
    },
    {
      header: "Specs & Compliance",
      cell: (product) => (
        <div className="flex flex-wrap items-center gap-1 max-w-[160px]">
          {product.purity && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
              {product.purity}
            </span>
          )}
          {product.grade && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
              {product.grade}
            </span>
          )}
          {product.coaAvailable && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              COA
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Created",
      cell: (product) => (
        <span className="text-xs text-slate-600 whitespace-nowrap font-medium">
          {new Date(product.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (product) => {
        const isDiscontinued = product.availabilityStatus === "DISCONTINUED";
        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Inspect Detail */}
            <button
              type="button"
              onClick={() => handleInspect(product)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Inspect Product Detail"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Edit Metadata */}
            <button
              type="button"
              onClick={() => handleEdit(product)}
              className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors"
              title="Edit Product Metadata"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Availability */}
            <button
              type="button"
              onClick={() => handleAvailability(product)}
              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              title="Moderate Catalog Availability"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>

            {/* Supplier Offerings */}
            <button
              type="button"
              onClick={() => handleOpenSuppliers(product.id, product.name)}
              className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
              title="Manage Supplier Offerings"
            >
              <Boxes className="w-4 h-4" />
            </button>

            {/* Deactivate */}
            <button
              type="button"
              onClick={() => handleDeactivate(product)}
              disabled={isDiscontinued}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={isDiscontinued ? "Product Already Discontinued" : "Deactivate (Discontinue) Product"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border text-xs sm:text-sm font-bold shadow-xs animate-in slide-in-from-top duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <AdminSearchFilterBar
        searchPlaceholder="Search product name or CAS number..."
        searchValue={query}
        onSearchChange={onSearchChange}
        onReset={() => {
          onSearchChange("");
          onCategoryChange("");
          onAvailabilityChange("");
        }}
      >
        {/* Category Filter Input */}
        <input
          type="text"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          placeholder="Filter category..."
          className="w-32 sm:w-36 px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
        />

        {/* Availability Filter */}
        <select
          value={availabilityFilter}
          onChange={(e) => onAvailabilityChange(e.target.value as ProductAvailability | "")}
          className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
        >
          <option value="">All Availabilities</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="OUT_OF_STOCK">OUT OF STOCK</option>
          <option value="HIDDEN">HIDDEN</option>
          <option value="DISCONTINUED">DISCONTINUED</option>
        </select>
      </AdminSearchFilterBar>

      {/* Table / Skeletons */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4 shadow-2xs">
          <div className="h-6 bg-slate-100 rounded-lg w-1/4 animate-pulse" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <EnterpriseTable
            columns={columns}
            data={data?.content || []}
            keyExtractor={(p) => p.id}
            emptyTitle="No products found"
            emptyDescription="No chemical products match the specified query, category, or availability status."
          />

          {data && (
            <AdminPagination
              page={page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              pageSize={pageSize}
              onPageChange={onPageChange}
              disabled={isLoading}
            />
          )}
        </div>
      )}

      {/* Inspect Modal */}
      <AdminProductDetailModal
        productId={selectedProductId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedProductId(null);
        }}
        onOpenSuppliers={(pId) => {
          setIsDetailOpen(false);
          handleOpenSuppliers(pId);
        }}
      />

      {/* Edit Modal */}
      <AdminProductEditModal
        product={editingProduct}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />

      {/* Availability Modal */}
      <AdminProductAvailabilityModal
        product={availabilityProduct}
        isOpen={isAvailabilityOpen}
        onClose={() => {
          setIsAvailabilityOpen(false);
          setAvailabilityProduct(null);
        }}
        onConfirm={handleConfirmAvailability}
      />

      {/* Supplier Offerings Modal */}
      <AdminProductSupplierModal
        productId={supplierOfferingsProductId}
        productName={supplierOfferingsProductName}
        isOpen={isSupplierModalOpen}
        onClose={() => {
          setIsSupplierModalOpen(false);
          setSupplierOfferingsProductId(null);
          setSupplierOfferingsProductName(undefined);
        }}
        onOfferingsChanged={onRefresh}
      />

      {/* Deactivate Confirm Modal */}
      <AdminConfirmModal
        isOpen={isDeactivateOpen}
        onClose={() => {
          setIsDeactivateOpen(false);
          setDeactivatingProduct(null);
        }}
        onConfirm={handleConfirmDeactivate}
        isLoading={isDeactivateLoading}
        isDestructive={true}
        title="Deactivate Product"
        message={`Mark ${deactivatingProduct?.name} as DISCONTINUED? This deactivates public catalog visibility while strictly preserving historical RFQs, quotations, purchase orders, documents, and database relationships.`}
        confirmText="Deactivate Product"
      />
    </div>
  );
}
