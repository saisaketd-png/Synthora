"use client";

import { FormEvent, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, getAuthUser } from "@/features/auth/api/auth";
import { Lock, Mail, ShieldAlert, ArrowRight } from "lucide-react";
import { SynthoraLogo } from "@/shared/components/SynthoraLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      if (redirectParam && redirectParam.startsWith("/")) {
        router.push(redirectParam);
      } else if (user.role === "ADMIN") {
        router.push("/dashboard/admin");
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
    setLoading(true);

    try {
      const response = await login({
        email,
        password,
      });

      localStorage.setItem("synthora_token", response.token);
      window.dispatchEvent(new Event("auth-changed"));

      const user = getAuthUser();

      if (redirectParam && redirectParam.startsWith("/")) {
        router.push(redirectParam);
      } else if (user && user.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (user && user.role === "SUPPLIER") {
        router.push("/dashboard/supplier");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to authenticate credentials. Please verify your email and password."
      );
    } finally {
      setLoading(false);
    }
  }

  const isExpired = searchParams.get("expired") === "true" || searchParams.get("session_expired") === "true";

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8 space-y-3">
          <SynthoraLogo
            href="/"
            size="xl"
            subtitle="Enterprise Chemical & Pharmaceutical Marketplace"
          />
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Sign In to Synthora
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enter your institutional credentials to access your procurement desk.
            </p>
          </div>

          {/* Session Expiration Notice */}
          {isExpired && !error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900 flex items-center gap-2.5 shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Your session has expired. Please sign in again to continue.</span>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 flex items-start gap-2.5 shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span>Authentication Failure</span>
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

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 bg-slate-50/70 focus:bg-white disabled:bg-slate-100"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-xs font-bold text-white transition hover:bg-blue-700 shadow-xs disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Authenticating Credentials...</span>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Registration Options */}
          <div className="pt-6 border-t border-slate-100 space-y-2 text-center text-xs">
            <p className="text-slate-600">
              New to Synthora?{" "}
              <Link href="/register" className="font-bold text-blue-600 hover:text-blue-800 underline">
                Create Buyer Account
              </Link>
            </p>
            <p className="text-slate-500">
              Chemical manufacturer?{" "}
              <Link href="/register/supplier" className="font-bold text-purple-700 hover:text-purple-900 underline">
                Become a Verified Supplier
              </Link>
            </p>
          </div>
        </div>

        {/* Security Footer */}
        <p className="mt-8 text-center text-[11px] text-slate-400 font-medium">
          Protected by Synthora Multi-Layered Authentication & Access Governance
        </p>

      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}