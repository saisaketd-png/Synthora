"use client";

import { FormEvent, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, getAuthUser } from "@/features/auth/api/auth";

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
      } else if (user && user.role === "SUPPLIER") {
        router.push("/dashboard/supplier");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold text-[#17B5AE] mb-2">
              SYNTHORA
            </p>

            <h1 className="text-3xl font-semibold text-slate-900">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to manage your procurement requests.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#17B5AE] focus:ring-2 focus:ring-[#17B5AE]/20 disabled:bg-slate-100"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#17B5AE] focus:ring-2 focus:ring-[#17B5AE]/20 disabled:bg-slate-100"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#17B5AE] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#149d97] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Synthora B2B Chemicals & Pharma Marketplace
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#17B5AE] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}