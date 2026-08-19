"use client";

import { FormEvent, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerBuyer, login, getAuthUser } from "@/features/auth/api/auth";
import { Hexagon, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      if (redirectParam && redirectParam.startsWith("/")) {
        router.push(redirectParam);
      } else if (user.role === "SUPPLIER") {
        router.push("/dashboard/supplier");
      } else {
        router.push("/dashboard");
      }
    }
  }, [router, redirectParam]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // 1. Register Buyer Account
      await registerBuyer({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() ? phone.trim() : undefined,
        password,
      });

      // 2. Auto-authenticate session
      const loginRes = await login({
        email: email.trim(),
        password,
      });

      localStorage.setItem("synthora_token", loginRes.token);
      window.dispatchEvent(new Event("auth-changed"));

      if (redirectParam && redirectParam.startsWith("/")) {
        router.push(redirectParam);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 focus:outline-none">
            <div className="relative flex items-center justify-center w-8 h-8 text-[#0A192F]">
              <Hexagon className="w-8 h-8 fill-current absolute" />
              <Hexagon className="w-3.5 h-3.5 text-teal-400 absolute" strokeWidth={3} />
            </div>
            <span className="font-extrabold tracking-tight text-2xl text-slate-900">
              Synthora
            </span>
          </Link>
          <span className="block text-[11px] font-bold uppercase tracking-widest text-teal-600 font-mono">
            BUYER PROCUREMENT PORTAL
          </span>
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
                  placeholder="e.g. Dr. Jane Doe"
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
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-100"
                  placeholder="jane@pharma-corp.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
              >
                Contact Phone <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-100"
                placeholder="+1 (555) 019-2834"
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
                  placeholder="Min 8 characters"
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#0A192F] hover:bg-slate-800 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
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
