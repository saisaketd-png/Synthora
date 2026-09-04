"use client";

import { FormEvent, useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerBuyer, getAuthUser } from "@/features/auth/api/auth";
import { ArrowRight, Mail, CheckCircle2, ShieldCheck } from "lucide-react";
import { KemKendraLogo } from "@/shared/components/KemkendraLogo";

function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      router.replace("/dashboard/buyer");
    }
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setError("You must agree to the Terms of Service and acknowledge the Privacy Policy.");
      return;
    }

    try {
      setLoading(true);
      await registerBuyer({
        name,
        email,
        phone: phone.trim() ? phone.trim() : undefined,
        password,
        termsAccepted,
        privacyAccepted,
      });
      // Do NOT auto-login. Require email verification before authenticated access.
      setRegisteredEmail(email);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Registration failed. Please check your inputs.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Registration Confirmation / Check Inbox State
  if (registeredEmail) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <KemKendraLogo href="/" size="lg" layout="stacked" subtitle="Account Provisioned" />
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-card p-6 sm:p-8 text-center space-y-5">
            <div className="w-12 h-12 rounded-[6px] bg-[#EFF6FF] border border-[#BFDBFE] text-[#0052CC] flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-lg font-bold text-[#0F172A] tracking-tight">
                Verify Your Email Address
              </h1>
              <p className="text-xs text-[#475569] leading-relaxed max-w-sm mx-auto">
                We have sent an activation link to <strong className="text-[#0F172A] font-mono">{registeredEmail}</strong>. Please check your inbox and click the link to activate your account.
              </p>
            </div>

            <div className="rounded-[6px] border border-[#E4E4E7] bg-[#FAFAFA] p-3 text-xs text-[#475569] space-y-1 text-left">
              <p className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                Security Policy
              </p>
              <p className="text-[11px] leading-relaxed text-[#64748B]">
                Institutional verification ensures that all procurement quotes and orders are handled with authorized personnel.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Link
                href="/login"
                className="w-full sm:w-auto h-9 px-4 bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-white text-xs font-medium rounded-[6px] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <KemKendraLogo
            href="/"
            size="lg"
            layout="stacked"
            subtitle="Buyer Procurement Account"
          />
        </div>

        <div className="bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-card p-6 sm:p-8 space-y-5">
          <div className="border-b border-[#E4E4E7] pb-4 space-y-1">
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              Create Buyer Account
            </h1>
            <p className="text-xs text-[#475569] leading-relaxed">
              Source verified raw materials, request quotations, and track chemical procurement orders.
            </p>
          </div>

          {error && (
            <div className="rounded-[6px] border border-[rgba(220,38,38,0.2)] bg-[#FEF2F2] p-3 text-xs text-[#DC2626] flex items-start gap-2">
              <span className="font-semibold shrink-0">ERROR:</span>
              <span className="text-[11px] text-[#991B1B]">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold text-[#0F172A]"
                >
                  Full Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full h-9 rounded-[6px] border border-[#E4E4E7] px-3 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-colors focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] bg-white disabled:bg-[#F4F4F5]"
                  placeholder="e.g. Dr. Aris Thorne"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-[#0F172A]"
                >
                  Work Email <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full h-9 rounded-[6px] border border-[#E4E4E7] px-3 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-colors focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] bg-white disabled:bg-[#F4F4F5]"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="phone"
                className="block text-xs font-semibold text-[#0F172A]"
              >
                Direct Phone (Optional)
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="w-full h-9 rounded-[6px] border border-[#E4E4E7] px-3 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-colors focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] bg-white disabled:bg-[#F4F4F5]"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[#0F172A]"
                >
                  Password <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full h-9 rounded-[6px] border border-[#E4E4E7] px-3 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-colors focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] bg-white disabled:bg-[#F4F4F5]"
                  placeholder="Min. 8 characters"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold text-[#0F172A]"
                >
                  Confirm Password <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full h-9 rounded-[6px] border border-[#E4E4E7] px-3 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-colors focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] bg-white disabled:bg-[#F4F4F5]"
                  placeholder="Repeat password"
                />
              </div>
            </div>

            {/* Terms of Service and Privacy Policy Required Checkboxes */}
            <div className="pt-2 pb-1 space-y-2 border-t border-[#E4E4E7]">
              <label className="flex items-start gap-2 text-xs text-[#475569] cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 h-3.5 w-3.5 rounded-[3px] border-[#E4E4E7] text-[#0052CC] focus:ring-1 focus:ring-[#0052CC]"
                />
                <span>
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="font-medium text-[#0052CC] hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  <span className="text-[#DC2626]">*</span>
                </span>
              </label>

              <label className="flex items-start gap-2 text-xs text-[#475569] cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 h-3.5 w-3.5 rounded-[3px] border-[#E4E4E7] text-[#0052CC] focus:ring-1 focus:ring-[#0052CC]"
                />
                <span>
                  I acknowledge the{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-medium text-[#0052CC] hover:underline"
                  >
                    Privacy Policy
                  </Link>{" "}
                  <span className="text-[#DC2626]">*</span>
                </span>
              </label>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading || !termsAccepted || !privacyAccepted}
                className="w-full h-9 rounded-[6px] bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-xs font-medium text-white transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Buyer Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Supplier Onboarding Callout */}
          <div className="pt-4 border-t border-[#E4E4E7] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-[#FAFAFA] -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-4 sm:p-5 rounded-b-[8px]">
            <div>
              <p className="font-semibold text-[#0F172A]">
                Chemical manufacturer or distributor?
              </p>
              <p className="text-[11px] text-[#64748B]">
                Register to list catalog monographs and receive commercial RFQs.
              </p>
            </div>
            <Link
              href="/register/supplier"
              className="shrink-0 h-8 px-3 bg-white border border-[#E4E4E7] hover:bg-[#FAFAFA] text-[#0F172A] text-xs font-medium rounded-[6px] transition-colors flex items-center shadow-xs"
            >
              Supplier Registration →
            </Link>
          </div>
        </div>

        {/* Existing user login link */}
        <p className="mt-6 text-center text-xs text-[#64748B]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#0052CC] hover:underline">
            Sign In here
          </Link>
        </p>

      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
