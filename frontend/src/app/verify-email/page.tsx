"use client";

import { useState, useEffect, Suspense, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyEmail, resendVerification } from "@/features/auth/api/auth";
import { KemKendraLogo } from "@/shared/components/KemkendraLogo";
import { CheckCircle2, AlertTriangle, Mail, ArrowRight, RefreshCw } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resend state
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (token && !verified && !errorMessage) {
      handleAutoVerify(token);
    }
  }, [token]);

  async function handleAutoVerify(rawToken: string) {
    setVerifying(true);
    setErrorMessage(null);
    try {
      await verifyEmail({ token: rawToken });
      setVerified(true);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Invalid or expired verification token. Please request a new link."
      );
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend(e: FormEvent) {
    e.preventDefault();
    setResendError(null);
    setResendSuccess(null);

    if (!resendEmail.trim()) {
      setResendError("Please enter your registered email address.");
      return;
    }

    try {
      setResending(true);
      const res = await resendVerification({ email: resendEmail.trim() });
      setResendSuccess(res.message || "Verification link sent. Please check your inbox.");
    } catch (err: unknown) {
      setResendError(
        err instanceof Error ? err.message : "Failed to resend verification link. Please try again."
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <KemKendraLogo href="/" size="xl" subtitle="Email Verification" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 sm:p-10 space-y-6">
        {/* Loading / Verifying State */}
        {verifying && (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <h1 className="text-xl font-bold text-slate-900">Verifying Your Email...</h1>
            <p className="text-xs text-slate-500">
              Please wait while we confirm your email ownership.
            </p>
          </div>
        )}

        {/* Success State */}
        {verified && !verifying && (
          <div className="text-center py-4 space-y-6">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Email Verified!
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your email address has been verified. Your account is activated and ready for use on the KemKendra marketplace.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full rounded-lg bg-[#0A192F] hover:bg-slate-800 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md flex items-center justify-center gap-2"
            >
              Sign In to Your Account
              <ArrowRight className="w-4 h-4 text-teal-400" />
            </Link>
          </div>
        )}

        {/* Error / Expired Token State or No Token Provided */}
        {!verified && !verifying && (
          <div className="space-y-6">
            {errorMessage ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-xs text-red-900 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Verification Failed</p>
                    <p className="text-red-700">{errorMessage}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 text-center">
                  Verification tokens expire in 24 hours and can only be used once. You can request a fresh verification email below.
                </p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold text-slate-900">Verify Your Account</h1>
                <p className="text-xs text-slate-500">
                  Please click the link in the verification email sent to your inbox.
                </p>
              </div>
            )}

            {/* Resend Verification Form */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-center">
                Need a new verification link?
              </h2>

              {resendSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{resendSuccess}</span>
                </div>
              )}

              {resendError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  {resendError}
                </div>
              )}

              <form onSubmit={handleResend} className="space-y-3">
                <div>
                  <label
                    htmlFor="resendEmail"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Registered Work Email
                  </label>
                  <input
                    id="resendEmail"
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    disabled={resending}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-100"
                    placeholder="name@company.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resending}
                  className="w-full rounded-lg bg-slate-800 hover:bg-slate-900 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {resending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    <>Resend Verification Email</>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        Already verified?{" "}
        <Link href="/login" className="font-bold text-teal-600 hover:text-teal-700 underline">
          Sign In here
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
