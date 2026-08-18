"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Globe,
  MapPin,
  FileCheck,
  Shield,
  Calendar,
  AlertCircle,
  Mail,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { AdminSupplierDetailResponse } from "../../types";
import { getAdminSupplier } from "../../api/adminApi";
import { AdminBadge } from "../AdminBadge";

interface AdminSupplierDetailModalProps {
  supplierId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSupplierDetailModal({
  supplierId,
  isOpen,
  onClose,
}: AdminSupplierDetailModalProps) {
  const [detail, setDetail] = useState<AdminSupplierDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && supplierId !== null) {
      setIsLoading(true);
      setError(null);
      getAdminSupplier(supplierId)
        .then((res) => setDetail(res))
        .catch((err) => setError(err.message || "Failed to load supplier details"))
        .finally(() => setIsLoading(false));
    } else {
      setDetail(null);
    }
  }, [isOpen, supplierId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-detail-title"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-base">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="supplier-detail-title" className="text-lg font-extrabold text-slate-900">
                {detail?.name || "Supplier Inspection"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {detail ? `Slug: ${detail.slug} (ID: ${detail.id})` : "Loading..."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {isLoading && (
            <div className="space-y-4 py-8">
              <div className="h-6 bg-slate-100 rounded-lg w-1/3 animate-pulse mx-auto" />
              <div className="h-32 bg-slate-50 rounded-2xl animate-pulse" />
              <div className="h-32 bg-slate-50 rounded-2xl animate-pulse" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {detail && !isLoading && (
            <>
              {/* Marketplace Status & Standing */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Marketplace Badges
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminBadge
                      type={detail.verified ? "VERIFIED" : "UNVERIFIED"}
                      label={detail.verified ? "Verified Supplier" : "Unverified"}
                    />
                    <AdminBadge
                      type={detail.exportReady ? "EXPORT_READY" : "NOT_EXPORT_READY"}
                      label={detail.exportReady ? "Export Ready" : "Domestic Only"}
                    />
                    {detail.userStatus && (
                      <AdminBadge type={detail.userStatus} label={`Account: ${detail.userStatus}`} />
                    )}
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500 font-medium">
                  <p>Years in Business: <span className="font-bold text-slate-900">{detail.yearsInBusiness || "N/A"}</span></p>
                  <p>Response Rate: <span className="font-bold text-slate-900">{detail.responseRate ? `${detail.responseRate}%` : "N/A"}</span></p>
                </div>
              </div>

              {/* Identity & Linked User Account */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-100 bg-white space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    Jurisdiction & Country
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {detail.countryName || "Unknown"} ({detail.countryCode || "N/A"})
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-100 bg-white space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Mail className="w-3.5 h-3.5" />
                    Linked User Email
                  </div>
                  <p className="text-sm font-bold text-slate-900 break-all">
                    {detail.userEmail || <span className="text-slate-400 font-normal">Unlinked profile</span>}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-100 bg-white space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5" />
                    Linked User Account Status
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {detail.userStatus || "N/A"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-100 bg-white space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" />
                    Onboarded On
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {new Date(detail.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* SellerProfile Commercial Metadata */}
              <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <FileCheck className="w-4 h-4 text-purple-600" />
                  Enterprise Seller Profile Information
                </div>

                {detail.sellerProfile ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-500">Legal Company Name:</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {detail.sellerProfile.companyName || "N/A"}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-500">GST / Tax ID:</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {detail.sellerProfile.gstNumber || "N/A"}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-500">Operating Address:</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {detail.sellerProfile.address || "N/A"},{" "}
                        {detail.sellerProfile.city || "N/A"},{" "}
                        {detail.sellerProfile.state || "N/A"},{" "}
                        {detail.sellerProfile.country || "N/A"}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-500">Website:</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {detail.sellerProfile.website ? (
                          <a
                            href={detail.sellerProfile.website.startsWith("http") ? detail.sellerProfile.website : `https://${detail.sellerProfile.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-purple-600 hover:text-purple-700 underline inline-flex items-center gap-1"
                          >
                            {detail.sellerProfile.website}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="font-semibold text-slate-500">Certifications:</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {detail.sellerProfile.certifications || "No certifications listed"}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="font-semibold text-slate-500">About Company:</span>
                      <p className="text-slate-700 mt-0.5 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60">
                        {detail.sellerProfile.aboutCompany || "No description provided."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    No linked SellerProfile metadata recorded for this supplier.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
