"use client";

import { useEffect, useState, useCallback } from "react";
import { getMySellerProfile } from "@/features/suppliers/api";
import { SellerProfile } from "@/features/suppliers/types";
import { SupplierProfileForm } from "@/features/suppliers/components/SupplierProfileForm";
import { SectionHeader } from "@/shared/components/SectionHeader";
import { AlertCircle } from "lucide-react";

const EMPTY_PROFILE: SellerProfile = {
  id: "",
  companyName: "",
  gstNumber: null,
  address: null,
  city: null,
  state: null,
  country: "India",
  website: null,
  certifications: null,
  aboutCompany: null,
  createdAt: "",
  updatedAt: "",
};

export default function SupplierProfilePage() {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMySellerProfile();
      setProfile(data ?? EMPTY_PROFILE);
    } catch (err: any) {
      setError(err.message || "Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <SectionHeader
        title="Company Profile"
        subtitle="Manage your business identity, certifications, and commercial details"
      />

      {error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      ) : loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <SupplierProfileForm
          initialProfile={profile ?? EMPTY_PROFILE}
          onSuccess={(updated) => setProfile(updated)}
        />
      )}
    </div>
  );
}
