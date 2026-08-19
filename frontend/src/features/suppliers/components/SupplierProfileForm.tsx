"use client";

import React, { useState } from "react";
import { SellerProfile, UpdateSellerProfileRequest } from "../types";
import { updateMySellerProfile } from "../api";
import { Save, AlertCircle } from "lucide-react";
import { useToast } from "@/shared/context/ToastContext";

export function SupplierProfileForm({
  initialProfile,
  onSuccess,
}: {
  initialProfile: SellerProfile;
  onSuccess: (updated: SellerProfile) => void;
}) {
  const [formData, setFormData] = useState<UpdateSellerProfileRequest>({
    companyName: initialProfile.companyName,
    gstNumber: initialProfile.gstNumber || "",
    address: initialProfile.address || "",
    city: initialProfile.city || "",
    state: initialProfile.state || "",
    country: initialProfile.country || "",
    website: initialProfile.website || "",
    certifications: initialProfile.certifications || "",
    aboutCompany: initialProfile.aboutCompany || "",
  });

  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updated = await updateMySellerProfile(formData);
      toast.success("Company profile saved successfully.");
      onSuccess(updated);
    } catch (err: any) {
      const msg = err.message || "An error occurred while saving the profile.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white border border-slate-200 p-8 rounded-sm shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif">Company Profile</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage your public business identity and commercial information.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-sm text-sm transition-colors disabled:opacity-50"
        >
          {saving ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Profile
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm flex items-start gap-3 rounded-sm border border-red-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900 uppercase tracking-wider">Company Name *</label>
          <input
            type="text"
            name="companyName"
            required
            value={formData.companyName}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-sm px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900 uppercase tracking-wider">GST Number</label>
          <input
            type="text"
            name="gstNumber"
            value={formData.gstNumber || ""}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-sm px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900 uppercase tracking-wider">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address || ""}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-sm px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900 uppercase tracking-wider">City</label>
          <input
            type="text"
            name="city"
            value={formData.city || ""}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-sm px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900 uppercase tracking-wider">State / Province</label>
          <input
            type="text"
            name="state"
            value={formData.state || ""}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-sm px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900 uppercase tracking-wider">Country</label>
          <input
            type="text"
            name="country"
            value={formData.country || ""}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-sm px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900 uppercase tracking-wider">Website</label>
          <input
            type="url"
            name="website"
            value={formData.website || ""}
            onChange={handleChange}
            placeholder="https://www.example.com"
            className="w-full border border-slate-300 rounded-sm px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900 uppercase tracking-wider">Certifications</label>
          <input
            type="text"
            name="certifications"
            value={formData.certifications || ""}
            onChange={handleChange}
            placeholder="e.g. ISO 9001, CE, GMP (comma separated)"
            className="w-full border border-slate-300 rounded-sm px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-bold text-slate-900 uppercase tracking-wider">About Company</label>
          <textarea
            name="aboutCompany"
            rows={5}
            value={formData.aboutCompany || ""}
            onChange={handleChange}
            placeholder="Provide a detailed description of your company, history, and capabilities..."
            className="w-full border border-slate-300 rounded-sm px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
          ></textarea>
        </div>
      </div>
    </form>
  );
}
