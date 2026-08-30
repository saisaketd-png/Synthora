"use client";

import { FormEvent, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/features/auth/api/auth";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, ShieldAlert, KeyRound } from "lucide-react";
import { SynthoraLogo } from "@/shared/components/SynthoraLogo";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing or invalid password reset token. Please request a new reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password.length > 128) {
      setError("Password must not exceed 128 characters.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to reset password. The link may have expired or already been used.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Missing token guard
  if (!token && !success) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-8 space-y-6 text-center">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            Invalid Reset Link
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            This password reset link is invalid or incomplete. Please initiate a new password reset request.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-blue-700 shadow-xs"
          >
            <span>Request New Reset Link</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-8 space-y-6">
      {!success ? (
        <>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Create New Password
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your new password must be at least 8 characters long.
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 flex items-start gap-2.5 shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span>Reset Failed</span>
                <p className="text-[11px] font-normal text-rose-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 bg-slate-50/70 focus:bg-white disabled:bg-slate-100"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 bg-slate-50/70 focus:bg-white disabled:bg-slate-100"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            {/* Password Validation Indicator */}
            {password && (
              <div className="text-[11px] space-y-1 pt-1">
                <p className={password.length >= 8 ? "text-emerald-600 flex items-center gap-1.5" : "text-slate-400 flex items-center gap-1.5"}>
                  <span className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? "bg-emerald-500" : "bg-slate-300"}`} />
                  At least 8 characters
                </p>
                {confirmPassword && (
                  <p className={password === confirmPassword ? "text-emerald-600 flex items-center gap-1.5" : "text-rose-500 flex items-center gap-1.5"}>
                    <span className={`w-1.5 h-1.5 rounded-full ${password === confirmPassword ? "bg-emerald-500" : "bg-rose-500"}`} />
                    {password === confirmPassword ? "Passwords match" : "Passwords do not match"}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || password.length < 8 || password !== confirmPassword}
              className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-xs font-bold text-white transition hover:bg-blue-700 shadow-xs disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>Updating Password...</span>
              ) : (
                <>
                  <span>Reset & Save Password</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        /* Success State */
        <div className="space-y-5 py-2 text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">
              Password Reset Complete
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Your password has been updated securely. You can now sign in to your Synthora workspace with your new password.
            </p>
          </div>

          <div className="pt-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold text-white transition hover:bg-blue-700 shadow-xs w-full"
            >
              <span>Sign In to Synthora</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Navigation Back */}
      <div className="pt-6 border-t border-slate-100 text-center text-xs">
        <Link
          href="/login"
          className="font-bold text-slate-600 hover:text-slate-900 transition"
        >
          Return to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <SynthoraLogo
            href="/"
            size="xl"
            subtitle="Enterprise Chemical & Pharmaceutical Marketplace"
          />
        </div>

        <Suspense fallback={
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-8 flex items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>

        {/* Security Footer */}
        <p className="mt-8 text-center text-[11px] text-slate-400 font-medium">
          Protected by Synthora Multi-Layered Authentication & Access Governance
        </p>
      </div>
    </main>
  );
}
