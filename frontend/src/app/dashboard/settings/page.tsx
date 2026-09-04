"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  getCurrentUserProfile,
  updateUserProfile,
  changePassword,
  UserProfile,
} from "@/features/auth/api/auth";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/features/notifications/api/notifications";
import {
  NotificationPreferenceItem,
} from "@/features/notifications/types/notification";
import { PageHeader } from "@/shared/components/ui/KemkendraUI";
import {
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Save,
  ShieldCheck,
  Bell,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Profile Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Notification Preferences State
  const [preferences, setPreferences] = useState<NotificationPreferenceItem[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState(false);
  const [prefError, setPrefError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingProfile(true);
        setProfileError(null);
        const data = await getCurrentUserProfile();
        setProfile(data);
        setName(data.name || "");
        setPhone(data.phone || "");
      } catch (err: unknown) {
        if (err instanceof Error) {
          setProfileError(err.message);
        } else {
          setProfileError("Failed to load user profile information.");
        }
      } finally {
        setLoadingProfile(false);
      }

      try {
        setLoadingPreferences(true);
        setPrefError(null);
        const prefData = await getNotificationPreferences();
        setPreferences(prefData.preferences || []);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setPrefError(err.message);
        } else {
          setPrefError("Failed to load notification preferences.");
        }
      } finally {
        setLoadingPreferences(false);
      }
    }

    loadData();
  }, []);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    if (!name.trim()) {
      setProfileError("Full Name cannot be empty.");
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await updateUserProfile({
        name: name.trim(),
        phone: phone.trim() ? phone.trim() : undefined,
      });
      setProfile(updated);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setProfileError(err.message);
      } else {
        setProfileError("Failed to update profile settings.");
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPasswordError(err.message);
      } else {
        setPasswordError("Failed to update password. Please check your current password.");
      }
    } finally {
      setSavingPassword(false);
    }
  }

  const togglePreference = (category: string, channel: "inApp" | "email") => {
    setPreferences((prev) =>
      prev.map((item) => {
        if (item.category === category) {
          if (item.mandatory) return item; // Cannot modify mandatory categories
          return {
            ...item,
            inAppEnabled: channel === "inApp" ? !item.inAppEnabled : item.inAppEnabled,
            emailEnabled: channel === "email" ? !item.emailEnabled : item.emailEnabled,
          };
        }
        return item;
      })
    );
  };

  async function handlePreferencesSubmit(e: FormEvent) {
    e.preventDefault();
    setPrefError(null);
    setPrefSuccess(false);

    try {
      setSavingPreferences(true);
      const req = {
        preferences: preferences.map((p) => ({
          category: p.category,
          inAppEnabled: p.inAppEnabled,
          emailEnabled: p.emailEnabled,
        })),
      };
      const res = await updateNotificationPreferences(req);
      setPreferences(res.preferences || []);
      setPrefSuccess(true);
      setTimeout(() => setPrefSuccess(false), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPrefError(err.message);
      } else {
        setPrefError("Failed to update notification preferences.");
      }
    } finally {
      setSavingPreferences(false);
    }
  }

  const formatCategoryLabel = (category: string) => {
    switch (category) {
      case "SECURITY":
        return "Security & Authentication";
      case "ACCOUNT":
        return "Account & Terms";
      case "SUPPLIER_VERIFICATION":
        return "Supplier Verification";
      case "RFQ":
        return "RFQ Activity";
      case "QUOTATION":
        return "Quotation Activity";
      case "PURCHASE_ORDER":
        return "Purchase Orders";
      case "SHIPMENT":
        return "Shipments & Logistics";
      case "CATALOG":
        return "Catalog & Offerings";
      case "GOVERNANCE":
        return "Governance & Appeals";
      case "SYSTEM":
        return "System & Platform";
      default:
        return category.replace(/_/g, " ");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 text-[#0F172A]">
      <PageHeader
        title="Account Settings"
        description="Manage your verified profile details, configure granular notification channels, and update access credentials."
      />

      {/* 1. PROFILE DETAILS CARD */}
      <div className="bg-white rounded-[8px] border border-[#E4E4E7] shadow-tactile-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E4E4E7] bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#EFF6FF] text-[#0052CC] flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A]">Personal & Authorized Contact</h2>
              <p className="text-xs text-[#64748B]">Update your commercial display name and authorized contact number</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="p-5 space-y-5">
          {profileSuccess && (
            <div className="rounded-[6px] bg-[#ECFDF5] border border-[rgba(5,150,105,0.2)] p-3 flex items-center gap-2.5 text-[#059669] text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
              <span>Profile information updated successfully.</span>
            </div>
          )}

          {profileError && (
            <div className="rounded-[6px] bg-[#FEF2F2] border border-[rgba(220,38,38,0.2)] p-3 flex items-center gap-2.5 text-[#DC2626] text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email (Read Only) */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ""}
                  className="w-full rounded-[6px] border border-[#E4E4E7] pl-9 pr-3 py-2 text-xs text-[#64748B] bg-[#F4F4F5] cursor-not-allowed outline-none font-mono"
                />
              </div>
              <p className="text-[10px] text-[#94A3B8]">Email address cannot be modified once registered.</p>
            </div>

            {/* Account Role & Verification */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">
                Account Role & Verification
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="w-full rounded-[6px] border border-[#E4E4E7] pl-9 pr-3 py-2 text-xs text-[#0F172A] bg-[#F4F4F5] flex items-center justify-between">
                  <span className="font-semibold">{profile?.role || "USER"}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#059669] bg-[#ECFDF5] border border-[rgba(5,150,105,0.2)] px-1.5 py-0.2 rounded-[4px]">
                    <Check className="w-3 h-3" /> Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1">
              <label htmlFor="name" className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">
                Full Name <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loadingProfile || savingProfile}
                  className="w-full rounded-[6px] border border-[#E4E4E7] pl-9 pr-3 py-2 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition focus:border-[#0052CC] bg-white"
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label htmlFor="phone" className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loadingProfile || savingProfile}
                  className="w-full rounded-[6px] border border-[#E4E4E7] pl-9 pr-3 py-2 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition focus:border-[#0052CC] bg-white"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E4E4E7] flex justify-end">
            <button
              type="submit"
              disabled={loadingProfile || savingProfile}
              className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#0052CC] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#0747A6] active:bg-[#003884] shadow-xs disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProfile ? "Saving..." : "Save Details"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. NOTIFICATION PREFERENCES CARD */}
      <div className="bg-white rounded-[8px] border border-[#E4E4E7] shadow-tactile-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E4E4E7] bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#EFF6FF] text-[#0052CC] flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A]">Notification Preferences</h2>
              <p className="text-xs text-[#64748B]">Configure which channels you receive notifications for across commercial and administrative workflows.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePreferencesSubmit} className="p-5 space-y-5">
          {prefSuccess && (
            <div className="rounded-[6px] bg-[#ECFDF5] border border-[rgba(5,150,105,0.2)] p-3 flex items-center gap-2.5 text-[#059669] text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
              <span>Notification preferences updated successfully.</span>
            </div>
          )}

          {prefError && (
            <div className="rounded-[6px] bg-[#FEF2F2] border border-[rgba(220,38,38,0.2)] p-3 flex items-center gap-2.5 text-[#DC2626] text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{prefError}</span>
            </div>
          )}

          {loadingPreferences ? (
            <div className="py-6 text-center text-xs text-[#64748B]">Loading communication preferences...</div>
          ) : (
            <div className="divide-y divide-[#E4E4E7]">
              {preferences.map((item) => (
                <div
                  key={item.category}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#0F172A]">
                        {formatCategoryLabel(item.category)}
                      </span>
                      {item.mandatory && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.2 rounded-[4px] border border-[rgba(217,119,6,0.2)]">
                          <Lock className="w-2.5 h-2.5" /> Mandatory
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      {item.mandatory
                        ? "Critical security and account-integrity notifications cannot be disabled."
                        : `Receive updates for ${formatCategoryLabel(item.category).toLowerCase()}.`}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {/* In-App Toggle */}
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-[#0F172A]">
                      <input
                        type="checkbox"
                        checked={item.inAppEnabled}
                        disabled={item.mandatory || savingPreferences}
                        onChange={() => togglePreference(item.category, "inApp")}
                        className="rounded-[4px] border-[#E4E4E7] text-[#0052CC] focus:ring-[#0052CC] disabled:opacity-50 cursor-pointer"
                      />
                      <span>In-App</span>
                    </label>

                    {/* Email Toggle */}
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-[#0F172A]">
                      <input
                        type="checkbox"
                        checked={item.emailEnabled}
                        disabled={item.mandatory || savingPreferences}
                        onChange={() => togglePreference(item.category, "email")}
                        className="rounded-[4px] border-[#E4E4E7] text-[#0052CC] focus:ring-[#0052CC] disabled:opacity-50 cursor-pointer"
                      />
                      <span>Email</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-[#E4E4E7] flex justify-end">
            <button
              type="submit"
              disabled={loadingPreferences || savingPreferences}
              className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#0052CC] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#0747A6] active:bg-[#003884] shadow-xs disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingPreferences ? "Saving..." : "Save Preferences"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. CHANGE PASSWORD CARD */}
      <div className="bg-white rounded-[8px] border border-[#E4E4E7] shadow-tactile-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E4E4E7] bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A]">Change Password</h2>
              <p className="text-xs text-[#64748B]">Ensure your account is protected with a strong, distinct password.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="p-5 space-y-5">
          {passwordSuccess && (
            <div className="rounded-[6px] bg-[#ECFDF5] border border-[rgba(5,150,105,0.2)] p-3 flex items-center gap-2.5 text-[#059669] text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
              <span>Your password has been changed successfully.</span>
            </div>
          )}

          {passwordError && (
            <div className="rounded-[6px] bg-[#FEF2F2] border border-[rgba(220,38,38,0.2)] p-3 flex items-center gap-2.5 text-[#DC2626] text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="space-y-3.5 max-w-lg">
            {/* Current Password */}
            <div className="space-y-1">
              <label htmlFor="currentPassword" className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">
                Current Password <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={savingPassword}
                  className="w-full rounded-[6px] border border-[#E4E4E7] pl-9 pr-9 py-2 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition focus:border-[#0052CC] bg-white"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-[#0F172A] transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label htmlFor="newPassword" className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">
                New Password <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={savingPassword}
                  className="w-full rounded-[6px] border border-[#E4E4E7] pl-9 pr-9 py-2 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition focus:border-[#0052CC] bg-white"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-[#0F172A] transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">
                Confirm New Password <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <input
                  id="confirmPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={savingPassword}
                  className="w-full rounded-[6px] border border-[#E4E4E7] pl-9 pr-3 py-2 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition focus:border-[#0052CC] bg-white"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            {/* Password Validation Requirements */}
            {newPassword && (
              <div className="text-[11px] space-y-1 pt-1">
                <p className={newPassword.length >= 8 ? "text-[#059669] flex items-center gap-1.5" : "text-[#94A3B8] flex items-center gap-1.5"}>
                  <span className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 8 ? "bg-[#059669]" : "bg-[#CBD5E1]"}`} />
                  At least 8 characters
                </p>
                {confirmPassword && (
                  <p className={newPassword === confirmPassword ? "text-[#059669] flex items-center gap-1.5" : "text-[#DC2626] flex items-center gap-1.5"}>
                    <span className={`w-1.5 h-1.5 rounded-full ${newPassword === confirmPassword ? "bg-[#059669]" : "bg-[#DC2626]"}`} />
                    {newPassword === confirmPassword ? "Passwords match" : "Passwords do not match"}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#E4E4E7] flex justify-end">
            <button
              type="submit"
              disabled={
                savingPassword ||
                !currentPassword ||
                newPassword.length < 8 ||
                newPassword !== confirmPassword
              }
              className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#0052CC] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#0747A6] active:bg-[#003884] shadow-xs disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{savingPassword ? "Updating..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
