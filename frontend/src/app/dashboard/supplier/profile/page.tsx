"use client";

import { useEffect, useState, useCallback } from "react";
import { getMySellerProfile } from "@/features/suppliers/api";
import { SellerProfile } from "@/features/suppliers/types";
import { SupplierProfileForm } from "@/features/suppliers/components/SupplierProfileForm";
import { PageHeader, SkeletonLoader } from "@/shared/components/ui/KemkendraUI";
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
    <div className="max-w-[1440px] mx-auto space-y-5 text-[#0F172A]">
      <PageHeader
        title="Supplier Enterprise Profile"
        description="Manage your business identity, tax credentials, and manufacturing accreditations across the KemKendra network."
      />

      {error ? (
        <div className="p-3.5 rounded-[6px] bg-[#FEF2F2] border border-[rgba(220,38,38,0.2)] flex items-start gap-2 text-[#DC2626]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-xs font-medium">{error}</div>
        </div>
      ) : loading ? (
        <div className="bg-white p-5 border border-[#E4E4E7] rounded-[8px] shadow-tactile-card">
          <SkeletonLoader lines={5} />
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
