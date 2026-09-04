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
    <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-[#E4E4E7] p-5 sm:p-6 rounded-[8px] shadow-tactile-card text-[#0F172A]">
      <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-4">
        <div>
          <h2 className="text-base font-bold text-[#0F172A] tracking-tight">Organization Profile & Commercial Identity</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage your verified business identity, statutory registration, and chemical supply credentials.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="h-8 px-4 bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-white font-medium text-xs rounded-[6px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
        >
          {saving ? (
            "Saving Changes..."
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#FEF2F2] text-[#DC2626] text-xs flex items-start gap-2 rounded-[6px] border border-[rgba(220,38,38,0.2)]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">Company Legal Name <span className="text-[#DC2626]">*</span></label>
          <input
            type="text"
            name="companyName"
            required
            value={formData.companyName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">GST / Tax Identification Number</label>
          <input
            type="text"
            name="gstNumber"
            value={formData.gstNumber || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs font-mono text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">Registered Address</label>
          <input
            type="text"
            name="address"
            value={formData.address || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">City</label>
          <input
            type="text"
            name="city"
            value={formData.city || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">State / Province</label>
          <input
            type="text"
            name="state"
            value={formData.state || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">Country</label>
          <input
            type="text"
            name="country"
            value={formData.country || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">Corporate Website</label>
          <input
            type="url"
            name="website"
            value={formData.website || ""}
            onChange={handleChange}
            placeholder="https://www.example.com"
            className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">Accreditations & Certifications</label>
          <input
            type="text"
            name="certifications"
            value={formData.certifications || ""}
            onChange={handleChange}
            placeholder="e.g. ISO 9001, WHO-GMP, REACH (comma separated)"
            className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC]"
          />
        </div>

        <div className="md:col-span-2 space-y-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">Enterprise Description & Capabilities</label>
          <textarea
            name="aboutCompany"
            rows={4}
            value={formData.aboutCompany || ""}
            onChange={handleChange}
            placeholder="Provide a detailed description of manufacturing facilities, reaction capabilities, and batch capacities..."
            className="w-full px-3 py-2 border border-[#E4E4E7] rounded-[6px] text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#0052CC] resize-y"
          ></textarea>
        </div>
      </div>
    </form>
  );
}
