"use client";

import { useState, useEffect, Suspense, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { verifyEmail, resendVerification, setAuthToken } from "@/features/auth/api/auth";
import { KemKendraLogo } from "@/shared/components/KemkendraLogo";
import { parseApiError } from "@/shared/utils/errorParser";
import { CheckCircle2, AlertCircle, Clock, Mail, ArrowRight, RefreshCw, KeyRound } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);

  // Manual token input state
  const [manualToken, setManualToken] = useState("");

  // Resend state & visibility
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState(emailParam || "");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam && !resendEmail) {
      setResendEmail(emailParam);
    }
  }, [emailParam, resendEmail]);

  useEffect(() => {
    if (token && !verified && !errorMessage) {
      handleAutoVerify(token);
    }
  }, [token]);

  async function handleAutoVerify(rawToken: string) {
    const cleanToken = rawToken.includes("token=")
      ? rawToken.split("token=")[1].split("&")[0]
      : rawToken.trim();

    if (!cleanToken) {
      setErrorMessage("Please enter a valid verification token.");
      return;
    }

    setVerifying(true);
    setErrorMessage(null);

    try {
      const res = await verifyEmail({ token: cleanToken });
      setVerified(true);

      // Hydrate session if JWT token returned
      if (res.token) {
        setAuthToken(res.token);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth-changed"));
        }

        const role = res.role?.toUpperCase();
        if (role === "SUPPLIER") {
          const status = res.verificationStatus?.toUpperCase() || "DRAFT";
          setRedirectTarget(status === "DRAFT" ? "/dashboard/supplier/onboarding" : "/dashboard/supplier");
        } else if (role === "ADMIN") {
          setRedirectTarget("/dashboard/admin");
        } else {
          setRedirectTarget("/products");
        }
      } else {
        setRedirectTarget("/login");
      }
    } catch (err: unknown) {
      const parsed = parseApiError(err, "We couldn't verify your email. Please request a new link.", "verification");
      setErrorMessage(parsed);
    } finally {
      setVerifying(false);
    }
  }

  async function handleManualVerify(e: FormEvent) {
    e.preventDefault();
    if (!manualToken.trim()) {
      setErrorMessage("Please enter your verification token or URL.");
      return;
    }
    await handleAutoVerify(manualToken.trim());
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
      setResendSuccess(res.message || "A new verification email has been sent. Please check your inbox.");
    } catch (err: unknown) {
      setResendError(parseApiError(err, "Failed to resend verification link. Please try again.", "verification"));
    } finally {
      setResending(false);
    }
  }

  // Determine specific error scenario for exact copy
  const isAlreadyUsed =
    errorMessage &&
    (errorMessage.toLowerCase().includes("already used") ||
      errorMessage.toLowerCase().includes("already been used"));

  const isExpired =
    errorMessage &&
    !isAlreadyUsed &&
    errorMessage.toLowerCase().includes("expired");

  return (
    <div className="w-full max-w-md">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <KemKendraLogo href="/" size="xl" layout="stacked" subtitle="Identity Verification" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
        {/* 1. Loading / Verifying State */}
        {verifying && (
          <div className="text-center py-8 space-y-4">
            <div className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h1 className="text-lg font-bold text-slate-900">Verifying Your Email...</h1>
              <p className="text-xs text-slate-500">
                Confirming token validity. Please wait a moment.
              </p>
            </div>
          </div>
        )}

        {/* 2. Success State */}
        {verified && !verifying && (
          <div className="text-center py-4 space-y-6">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Email verified successfully
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                Your email address has been verified. You can now sign in to your account.
              </p>
            </div>

            <Link
              href={redirectTarget || "/login"}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-xs"
            >
              <span>Continue to Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* 3. Already Used Link State */}
        {!verified && !verifying && isAlreadyUsed && (
          <div className="text-center py-3 space-y-6">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Verification link already used
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                This verification link has already been used or is no longer valid. Please sign in or request a new verification email.
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-xs"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => setShowResend(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Request New Verification Email</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. Expired Link State */}
        {!verified && !verifying && isExpired && (
          <div className="text-center py-3 space-y-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Verification link expired
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                This verification link has expired. Request a new verification email to continue.
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowResend(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Request New Verification Email</span>
              </button>

              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors"
              >
                <span>Sign In</span>
              </Link>
            </div>
          </div>
        )}

        {/* 5. Generic Error / Fallback State */}
        {!verified && !verifying && errorMessage && !isAlreadyUsed && !isExpired && (
          <div className="text-center py-3 space-y-5">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Verification Failed
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                {errorMessage}
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowResend(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Request New Verification Email</span>
              </button>

              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors"
              >
                <span>Sign In</span>
              </Link>
            </div>
          </div>
        )}

        {/* 6. Default Manual Entry Form (if no token in URL or user wants manual entry) */}
        {!verified && !verifying && !errorMessage && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-bold text-slate-900">Verify Your Account</h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Enter your verification token or paste the link from your email below.
              </p>
            </div>

            <form onSubmit={handleManualVerify} className="space-y-3">
              <div>
                <label htmlFor="manualToken" className="block text-xs font-bold text-slate-700 mb-1">
                  Verification Token or Link
                </label>
                <input
                  id="manualToken"
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  disabled={verifying}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 font-mono outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50"
                  placeholder="Paste token or verification link..."
                />
              </div>

              <button
                type="submit"
                disabled={verifying || !manualToken.trim()}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs py-2.5 transition-colors shadow-xs"
              >
                Verify Email
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowResend(!showResend)}
                className="text-xs text-slate-500 hover:text-slate-900 font-bold transition-colors"
              >
                {showResend ? "Hide resend options" : "Didn't receive an email? Request a new link"}
              </button>
            </div>
          </div>
        )}

        {/* Resend Verification Form Drawer / Section */}
        {showResend && !verified && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-slate-900">Request New Verification Link</h2>
              <p className="text-[11px] text-slate-500">
                Enter your registered email address and we will send a fresh verification link.
              </p>
            </div>

            {resendSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{resendSuccess}</span>
              </div>
            )}

            {resendError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{resendError}</span>
              </div>
            )}

            <form onSubmit={handleResend} className="space-y-2.5">
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                disabled={resending}
                placeholder="Enter your registered email..."
                required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />

              <button
                type="submit"
                disabled={resending || !resendEmail.trim()}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 transition-colors disabled:opacity-50"
              >
                {resending ? "Sending..." : "Send Verification Email"}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="text-center mt-6">
        <Link href="/login" className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
          Return to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 font-sans text-slate-900">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400 animate-pulse">
            Loading verification workspace...
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
