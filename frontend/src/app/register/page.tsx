"use client";

import { FormEvent, useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerBuyer, getAuthUser } from "@/features/auth/api/auth";
import { ArrowRight, Mail, CheckCircle2, ShieldCheck } from "lucide-react";
import { SynthoraLogo } from "@/shared/components/SynthoraLogo";

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
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <SynthoraLogo href="/" size="xl" subtitle="Account Provisioned" />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Verify Your Email Address
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                We have sent an activation link to <strong className="text-slate-900 font-mono">{registeredEmail}</strong>. Please check your inbox and click the link to activate your account.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500 space-y-1 text-left">
              <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Security Note
              </p>
              <p>
                Verification links expire in 24 hours. If you do not see the email in a few minutes, check your spam or junk folder.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/login"
                className="w-full rounded-lg bg-[#0A192F] hover:bg-slate-800 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md flex items-center justify-center gap-2"
              >
                Proceed to Sign In
                <ArrowRight className="w-4 h-4 text-teal-400" />
              </Link>
              <Link
                href="/verify-email"
                className="block text-xs font-semibold text-[#0052CC] hover:underline"
              >
                Need to resend verification link?
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <SynthoraLogo
            href="/"
            size="xl"
            subtitle="Buyer Procurement Portal"
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 md:p-10">
          <div className="border-b border-slate-100 pb-6 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Create Buyer Account
            </h1>
            <p className="mt-1.5 text-xs text-slate-500 font-sans leading-relaxed">
              Source verified raw materials, request quotations, and track chemical procurement orders.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-mono text-red-700 flex items-start gap-2.5">
              <span className="font-bold shrink-0">ERROR:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-100"
                  placeholder="e.g. Dr. Aris Thorne"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
                >
                  Work Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-100"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
              >
                Direct Phone (Optional)
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-100"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-100"
                  placeholder="Min. 8 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
                >
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-100"
                  placeholder="Repeat password"
                />
              </div>
            </div>

            {/* Terms of Service and Privacy Policy Required Checkboxes */}
            <div className="pt-3 pb-1 space-y-2.5 border-t border-slate-100">
              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20"
                />
                <span>
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="font-bold text-[#0052CC] hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20"
                />
                <span>
                  I acknowledge the{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-bold text-[#0052CC] hover:underline"
                  >
                    Privacy Policy
                  </Link>{" "}
                  <span className="text-red-500">*</span>
                </span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !termsAccepted || !privacyAccepted}
                className="w-full rounded-lg bg-[#0A192F] hover:bg-slate-800 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    CREATING ACCOUNT...
                  </>
                ) : (
                  <>
                    CREATE BUYER ACCOUNT
                    <ArrowRight className="w-4 h-4 text-teal-400" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Supplier Onboarding Callout */}
          <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50/70 -mx-8 md:-mx-10 -mb-8 md:-mb-10 p-6 md:p-8 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-800">
                Are you a chemical manufacturer or distributor?
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Register as a verified seller to list catalog products and receive RFQs.
              </p>
            </div>
            <Link
              href="/register/supplier"
              className="shrink-0 px-4 py-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors"
            >
              Become a Supplier →
            </Link>
          </div>
        </div>

        {/* Existing user login link */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-teal-600 hover:text-teal-700 underline">
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
