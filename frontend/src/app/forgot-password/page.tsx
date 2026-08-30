"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/features/auth/api/auth";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { KemKendraLogo } from "@/shared/components/KemkendraLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to process password reset request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <KemKendraLogo
            href="/"
            size="xl"
            subtitle="Enterprise Chemical & Pharmaceutical Marketplace"
          />
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-8 space-y-6">
          {!submitted ? (
            <>
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Reset Password
                </h1>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter the email address associated with your KemKendra account and we&apos;ll send you a single-use reset link.
                </p>
              </div>

              {/* Error Notice */}
              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 flex items-start gap-2.5 shadow-2xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span>Request Failed</span>
                    <p className="text-[11px] font-normal text-rose-700">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Corporate Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 bg-slate-50/70 focus:bg-white disabled:bg-slate-100"
                      placeholder="procurement@company.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-xs font-bold text-white transition hover:bg-blue-700 shadow-xs disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Sending Reset Link...</span>
                  ) : (
                    <>
                      <span>Send Password Reset Link</span>
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
                  Check Your Inbox
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  If an account exists for <span className="font-semibold text-slate-900">{email}</span>, we have sent instructions to reset your password.
                </p>
                <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500 border border-slate-200/60 mt-3">
                  The link expires in <span className="font-semibold text-slate-700">15 minutes</span>. Be sure to check your spam or quarantine folders if it does not arrive promptly.
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                >
                  Didn&apos;t receive it? Try another email
                </button>
              </div>
            </div>
          )}

          {/* Navigation Back */}
          <div className="pt-6 border-t border-slate-100 text-center text-xs">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 font-bold text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>

        {/* Security Footer */}
        <p className="mt-8 text-center text-[11px] text-slate-400 font-medium">
          Protected by KemKendra Multi-Layered Authentication & Access Governance
        </p>
      </div>
    </main>
  );
}
