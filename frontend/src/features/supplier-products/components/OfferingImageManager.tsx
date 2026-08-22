"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  OfferingImageResponse,
  getOfferingImages,
  uploadOfferingImage,
  setPrimaryOfferingImage,
  deleteOfferingImage,
} from "../api/offeringMediaApi";
import {
  Upload,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  Loader2,
  Info,
} from "lucide-react";
import { resolveApiUrl } from "@/lib/apiUrl";

interface OfferingImageManagerProps {
  offeringId: string;
  onImagesChange?: (images: OfferingImageResponse[]) => void;
}

export function OfferingImageManager({
  offeringId,
  onImagesChange,
}: OfferingImageManagerProps) {
  const [images, setImages] = useState<OfferingImageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOfferingImages(offeringId);
      setImages(data);
      if (onImagesChange) onImagesChange(data);
    } catch (err: any) {
      setError(err.message || "Failed to load offering images.");
    } finally {
      setLoading(false);
    }
  }, [offeringId, onImagesChange]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= 10) {
      setError("Maximum 10 images allowed per offering.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image file exceeds 5MB size limit.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      await uploadOfferingImage(offeringId, file);
      setSuccess("Sample photograph uploaded successfully.");
      await loadImages();
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      setActionLoadingId(imageId);
      setError(null);
      setSuccess(null);
      await setPrimaryOfferingImage(offeringId, imageId);
      setSuccess("Primary image updated successfully.");
      await loadImages();
    } catch (err: any) {
      setError(err.message || "Failed to update primary image.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this sample image?")) return;

    try {
      setActionLoadingId(imageId);
      setError(null);
      setSuccess(null);
      await deleteOfferingImage(offeringId, imageId);
      setSuccess("Image removed successfully.");
      await loadImages();
    } catch (err: any) {
      setError(err.message || "Failed to delete image.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            Product Sample Media & Photographs
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload batch sample images, packaging photos, or laboratory photos (JPG, PNG, WEBP up to 5 MB).
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id={`offering-image-upload-${offeringId}`}
            disabled={uploading || loading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || loading || images.length >= 10}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Add Image
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-8 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-xs font-medium">Loading sample media...</span>
        </div>
      ) : images.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20"
        >
          <ImageIcon className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-xs font-bold text-slate-700">No product sample images uploaded</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click to upload genuine product or packaging photographs
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((image) => {
            const isBusy = actionLoadingId === image.id;
            const contentUrl = resolveApiUrl(
              `/api/v1/supplier/offerings/${offeringId}/images/${image.id}/content`
            );

            return (
              <div
                key={image.id}
                className={`relative group rounded-xl border overflow-hidden p-2 bg-white transition-all ${
                  image.isPrimary
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                  <img
                    src={contentUrl}
                    alt={image.altText || image.fileName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  {image.isPrimary && (
                    <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Primary
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between gap-1 text-[11px]">
                  <span className="text-slate-600 truncate font-medium max-w-[90px]">
                    {image.fileName}
                  </span>
                  <div className="flex items-center gap-1">
                    {!image.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(image.id)}
                        disabled={isBusy}
                        title="Set as primary image"
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(image.id)}
                      disabled={isBusy}
                      title="Delete image"
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
