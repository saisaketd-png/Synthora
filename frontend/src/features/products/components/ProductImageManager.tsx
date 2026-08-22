"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ProductImage } from "../types/product";
import {
  getProductImages,
  uploadProductImage,
  setPrimaryProductImage,
  deleteProductImage,
} from "../api/productImages";
import {
  Upload,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  Loader2,
} from "lucide-react";

interface ProductImageManagerProps {
  productId: string;
  onImagesChange?: (images: ProductImage[]) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function ProductImageManager({
  productId,
  onImagesChange,
}: ProductImageManagerProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
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
      const data = await getProductImages(productId);
      setImages(data);
      if (onImagesChange) onImagesChange(data);
    } catch (err: any) {
      setError(err.message || "Failed to load product images.");
    } finally {
      setLoading(false);
    }
  }, [productId, onImagesChange]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= 5) {
      setError("Maximum 5 images allowed per product.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate size client-side (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file exceeds 5MB size limit.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      await uploadProductImage(productId, file);
      setSuccess("Product image uploaded successfully.");
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
      await setPrimaryProductImage(productId, imageId);
      setSuccess("Primary image updated successfully.");
      await loadImages();
    } catch (err: any) {
      setError(err.message || "Failed to update primary image.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      setActionLoadingId(imageId);
      setError(null);
      setSuccess(null);
      await deleteProductImage(productId, imageId);
      setSuccess("Product image removed successfully.");
      await loadImages();
    } catch (err: any) {
      setError(err.message || "Failed to delete product image.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-teal-600" />
            Product Gallery & Visual Assets
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload up to 5 high-resolution chemical package or sample images (JPEG, PNG, WebP up to 5MB).
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full shrink-0">
          {images.length} / 5 Images
        </span>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <div>{success}</div>
        </div>
      )}

      {/* Image Grid */}
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {images.map((img) => {
            const isTargetLoading = actionLoadingId === img.id;
            const fullUrl = `${API_URL}${img.imageUrl}`;

            return (
              <div
                key={img.id}
                className={`relative group rounded-xl border overflow-hidden bg-slate-50 aspect-square flex flex-col justify-between p-2 transition-all ${
                  img.isPrimary
                    ? "border-teal-500 ring-2 ring-teal-500/20 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Background Image Preview */}
                <div className="absolute inset-0 z-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fullUrl}
                    alt={img.fileName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/30 transition-colors" />
                </div>

                {/* Top Badge: Primary Status */}
                <div className="relative z-10 flex justify-between items-start">
                  {img.isPrimary ? (
                    <span className="inline-flex items-center gap-1 bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      PRIMARY
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isTargetLoading}
                      onClick={() => handleSetPrimary(img.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm hover:text-teal-700"
                    >
                      Set Primary
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    disabled={isTargetLoading}
                    onClick={() => handleDelete(img.id)}
                    className="p-1 rounded-full bg-white/80 hover:bg-rose-600 hover:text-white text-slate-700 transition-colors shadow-sm"
                    title="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bottom Filename */}
                <div className="relative z-10 bg-slate-900/80 backdrop-blur-xs text-white px-2 py-1 rounded text-[10px] truncate">
                  {img.fileName}
                </div>
              </div>
            );
          })}

          {/* Upload Dropzone Tile */}
          {images.length < 5 && (
            <label
              className={`border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl aspect-square flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-teal-50/20 ${
                uploading ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600 mb-2" />
                  <span className="text-[11px] font-bold text-slate-600">Uploading...</span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-teal-600 mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Add Image</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP</span>
                </>
              )}
            </label>
          )}
        </div>
      )}
    </div>
  );
}
