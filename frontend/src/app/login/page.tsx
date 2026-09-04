"use client";

import { FormEvent, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, getAuthUser, setAuthToken } from "@/features/auth/api/auth";
import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";
import { Lock, Mail, ShieldAlert, ArrowRight } from "lucide-react";
import { KemKendraLogo } from "@/shared/components/KemkendraLogo";

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
        router.push("/products");
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

      setAuthToken(response.token);
      window.dispatchEvent(new Event("auth-changed"));

      if (response.message && response.message.toLowerCase().includes("suspended")) {
        router.push("/dashboard/account-review");
        return;
      }

      const user = getAuthUser();

      if (redirectParam && redirectParam.startsWith("/")) {
        router.push(redirectParam);
      } else if (user && user.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (user && user.role === "SUPPLIER") {
        try {
          const profileRes = await authenticatedFetch("/api/v1/supplier/profile");
          if (profileRes.ok) {
            const profile = await profileRes.json();
            if (profile.verificationStatus === "DRAFT" && (!profile.registeredAddress || !profile.legalName)) {
              router.push("/dashboard/supplier/onboarding");
              return;
            }
          }
        } catch {}
        router.push("/dashboard/supplier");
      } else {
        router.push("/products");
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
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8 space-y-2">
          <KemKendraLogo
            href="/"
            size="lg"
            layout="stacked"
            subtitle="Enterprise Chemical Sourcing Desk"
          />
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-card p-6 sm:p-8 space-y-5">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              Sign In to KemKendra
            </h1>
            <p className="text-xs text-[#475569] leading-relaxed">
              Enter your corporate credentials to access your procurement desk.
            </p>
          </div>

          {/* Session Expiration Notice */}
          {isExpired && !error && (
            <div className="rounded-[6px] border border-[rgba(217,119,6,0.2)] bg-[#FFFBEB] p-3 text-xs text-[#D97706] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0" />
              <span>Your session has expired. Please sign in again to continue.</span>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="rounded-[6px] border border-[rgba(220,38,38,0.2)] bg-[#FEF2F2] p-3.5 text-xs text-[#DC2626] flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Authentication Failure</span>
                <p className="text-[11px] text-[#991B1B]">{error}</p>
                {error.toLowerCase().includes("verify your email") && (
                  <Link
                    href="/verify-email"
                    className="inline-block mt-1 font-medium text-[#0052CC] hover:underline"
                  >
                    Resend verification link →
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#0F172A]"
              >
                Corporate Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  className="w-full h-9 rounded-[6px] border border-[#E4E4E7] pl-8.5 pr-3 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-colors focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] bg-white disabled:bg-[#F4F4F5]"
                  placeholder="procurement@company.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[#0F172A]"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-[#0052CC] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  className="w-full h-9 rounded-[6px] border border-[#E4E4E7] pl-8.5 pr-3 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-colors focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] bg-white disabled:bg-[#F4F4F5]"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 rounded-[6px] bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-xs font-medium text-white transition-colors shadow-xs disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-[0.99] mt-2"
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
          <div className="pt-4 border-t border-[#E4E4E7] space-y-1.5 text-center text-xs">
            <p className="text-[#475569]">
              New to KemKendra?{" "}
              <Link href="/register" className="font-semibold text-[#0052CC] hover:underline">
                Create Buyer Account
              </Link>
            </p>
            <p className="text-[#64748B] text-[11px]">
              Chemical manufacturer?{" "}
              <Link href="/register/supplier" className="font-semibold text-[#0052CC] hover:underline">
                Register as Verified Supplier
              </Link>
            </p>
          </div>
        </div>

        {/* Security Footer */}
        <p className="mt-6 text-center text-[11px] text-[#64748B]">
          Institutional Chemical Marketplace · TLS 1.3 Encryption
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