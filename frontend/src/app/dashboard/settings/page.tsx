"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  getCurrentUserProfile,
  updateUserProfile,
  changePassword,
  UserProfile,
} from "@/features/auth/api/auth";
import { SectionHeader } from "@/shared/components/SectionHeader";
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

  useEffect(() => {
    async function loadProfile() {
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
    }

    loadProfile();
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
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword.length > 128) {
      setPasswordError("New password must not exceed 128 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError("New password cannot be the same as your current password.");
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword({ currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPasswordError(err.message);
      } else {
        setPasswordError("Failed to change password. Please check your credentials.");
      }
    } finally {
      setSavingPassword(false);
    }
  }

  if (loadingProfile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <SectionHeader
          title="Account Settings & Security"
          subtitle="Manage your personal profile information and authentication credentials"
        />
        <div className="bg-white border border-[#DFE1E6] rounded-2xl p-12 flex justify-center items-center">
          <div className="w-8 h-8 border-3 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <SectionHeader
        title="Account Settings & Security"
        subtitle="Manage your personal profile details, contact preferences, and login credentials"
      />

      {/* 1. PERSONAL PROFILE SECTION */}
      <div className="bg-white border border-[#DFE1E6] rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-[#DFE1E6] bg-[#FAFBFC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DEEBFF] flex items-center justify-center text-[#0052CC]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#091E42]">Personal Profile Information</h2>
              <p className="text-xs text-[#5E6C84]">Update your public name and notification phone number</p>
            </div>
          </div>
          {profile?.role && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#EBECF0] text-[#091E42] border border-[#DFE1E6]">
              <Shield className="w-3.5 h-3.5 text-[#0052CC]" />
              {profile.role}
            </span>
          )}
        </div>

        <form onSubmit={handleProfileSubmit} className="p-6 sm:p-8 space-y-6">
          {profileError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Personal profile details saved successfully.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-[#172B4D]">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5E6C84]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={savingProfile}
                  className="w-full rounded-xl border border-[#DFE1E6] pl-10 pr-3.5 py-2.5 text-sm text-[#091E42] placeholder:text-[#5E6C84] outline-none transition focus:border-[#0052CC] focus:ring-3 focus:ring-[#0052CC]/10 bg-white"
                  placeholder="e.g. Johnathan Doe"
                />
              </div>
            </div>

            {/* Corporate Email (Read-Only) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#172B4D]">
                  Corporate Email
                </label>
                <span className="text-[10px] font-mono text-[#5E6C84] uppercase">Primary Login</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5E6C84]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  readOnly
                  disabled
                  value={profile?.email || ""}
                  className="w-full rounded-xl border border-[#DFE1E6] pl-10 pr-10 py-2.5 text-sm text-[#5E6C84] bg-[#F4F5F7] cursor-not-allowed outline-none font-mono"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#5E6C84]" title="Email cannot be changed directly">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-[#172B4D]">
                Phone Number
              </label>
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5E6C84]">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={savingProfile}
                  className="w-full rounded-xl border border-[#DFE1E6] pl-10 pr-3.5 py-2.5 text-sm text-[#091E42] placeholder:text-[#5E6C84] outline-none transition focus:border-[#0052CC] focus:ring-3 focus:ring-[#0052CC]/10 bg-white"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <p className="text-[11px] text-[#5E6C84]">
                Used for urgent shipment logistics, verification inquiries, and delivery updates.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#DFE1E6] flex justify-end">
            <button
              type="submit"
              disabled={savingProfile || !name.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0052CC] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#0747A6] shadow-xs disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProfile ? "Saving Details..." : "Save Profile Details"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. SECURITY & CHANGE PASSWORD SECTION */}
      <div className="bg-white border border-[#DFE1E6] rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-[#DFE1E6] bg-[#FAFBFC] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAE6FF] flex items-center justify-center text-[#5243AA]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#091E42]">Security & Authentication Credentials</h2>
            <p className="text-xs text-[#5E6C84]">Update your account password to maintain institutional security</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="p-6 sm:p-8 space-y-6">
          {passwordError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Your password has been changed successfully.</span>
            </div>
          )}

          <div className="max-w-md space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label htmlFor="currentPassword" className="block text-xs font-bold uppercase tracking-wider text-[#172B4D]">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5E6C84]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={savingPassword}
                  className="w-full rounded-xl border border-[#DFE1E6] pl-10 pr-10 py-2.5 text-sm text-[#091E42] placeholder:text-[#5E6C84] outline-none transition focus:border-[#0052CC] focus:ring-3 focus:ring-[#0052CC]/10 bg-white"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5E6C84] hover:text-[#172B4D] transition"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label htmlFor="newPassword" className="block text-xs font-bold uppercase tracking-wider text-[#172B4D]">
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5E6C84]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={savingPassword}
                  className="w-full rounded-xl border border-[#DFE1E6] pl-10 pr-10 py-2.5 text-sm text-[#091E42] placeholder:text-[#5E6C84] outline-none transition focus:border-[#0052CC] focus:ring-3 focus:ring-[#0052CC]/10 bg-white"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5E6C84] hover:text-[#172B4D] transition"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-[#172B4D]">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5E6C84]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="confirmPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={savingPassword}
                  className="w-full rounded-xl border border-[#DFE1E6] pl-10 pr-3.5 py-2.5 text-sm text-[#091E42] placeholder:text-[#5E6C84] outline-none transition focus:border-[#0052CC] focus:ring-3 focus:ring-[#0052CC]/10 bg-white"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            {/* Password Validation Requirements */}
            {newPassword && (
              <div className="text-[11px] space-y-1 pt-1">
                <p className={newPassword.length >= 8 ? "text-emerald-600 flex items-center gap-1.5" : "text-slate-400 flex items-center gap-1.5"}>
                  <span className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 8 ? "bg-emerald-500" : "bg-slate-300"}`} />
                  At least 8 characters
                </p>
                {confirmPassword && (
                  <p className={newPassword === confirmPassword ? "text-emerald-600 flex items-center gap-1.5" : "text-rose-500 flex items-center gap-1.5"}>
                    <span className={`w-1.5 h-1.5 rounded-full ${newPassword === confirmPassword ? "bg-emerald-500" : "bg-rose-500"}`} />
                    {newPassword === confirmPassword ? "Passwords match" : "Passwords do not match"}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#DFE1E6] flex justify-end">
            <button
              type="submit"
              disabled={
                savingPassword ||
                !currentPassword ||
                newPassword.length < 8 ||
                newPassword !== confirmPassword
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#0052CC] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#0747A6] shadow-xs disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{savingPassword ? "Updating Password..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
