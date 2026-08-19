"use client";

import { FormEvent, useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerSupplier, getAuthUser } from "@/features/auth/api/auth";
import { Hexagon, ArrowRight, Shield, Award, Globe, Building2, CheckCircle2 } from "lucide-react";

function SupplierRegisterForm() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("India");
  const [countryCode, setCountryCode] = useState("IN");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [aboutCompany, setAboutCompany] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      if (user.role === "SUPPLIER") {
        router.push("/dashboard/supplier");
      } else {
        router.push("/dashboard");
      }
    }
  }, [router]);

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

    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }

    if (!country.trim()) {
      setError("Country is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await registerSupplier({
        name: name.trim(),
        email: email.trim(),
        password,
        companyName: companyName.trim(),
        country: country.trim(),
        countryCode: countryCode.trim() || undefined,
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        website: website.trim() || undefined,
        aboutCompany: aboutCompany.trim() || undefined,
      });

      // Save token and trigger reactive auth update
      localStorage.setItem("synthora_token", response.token);
      window.dispatchEvent(new Event("auth-changed"));

      router.push("/dashboard/supplier");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Supplier registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Top Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 focus:outline-none">
            <div className="relative flex items-center justify-center w-8 h-8 text-[#0A192F]">
              <Hexagon className="w-8 h-8 fill-current absolute" />
              <Hexagon className="w-3.5 h-3.5 text-purple-400 absolute" strokeWidth={3} />
            </div>
            <span className="font-extrabold tracking-tight text-2xl text-slate-900">
              Synthora
            </span>
          </Link>
          <span className="block text-[11px] font-bold uppercase tracking-widest text-purple-600 font-mono">
            SUPPLIER NETWORK ONBOARDING
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
            Expand Your Global Chemical Sales
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
            Connect directly with verified pharmaceutical and industrial buyers. Manage inquiries, quote pricing, and fulfill purchase orders in one platform.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10">
            <div className="border-b border-slate-100 pb-5 mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Supplier Registration Application
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your company and representative details to activate your seller workspace.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-mono text-red-700 flex items-start gap-2.5">
                <span className="font-bold shrink-0">ERROR:</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* SECTION A: COMPANY DETAILS */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-3 font-mono">
                  01 / COMPANY IDENTIFICATION
                </span>
                
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="companyName"
                      className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
                    >
                      Legal Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-100"
                      placeholder="e.g. Apex Fine Chemicals Ltd."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="country"
                        className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
                      >
                        Headquarters Country <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="country"
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-100"
                        placeholder="e.g. Germany, India, USA"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="countryCode"
                        className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
                      >
                        Country Code
                      </label>
                      <input
                        id="countryCode"
                        type="text"
                        maxLength={4}
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                        disabled={loading}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-100 uppercase"
                        placeholder="e.g. DE"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="city"
                        className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
                      >
                        Operating City
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-100"
                        placeholder="e.g. Mumbai / Frankfurt"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="website"
                        className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
                      >
                        Corporate Website
                      </label>
                      <input
                        id="website"
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-100"
                        placeholder="https://company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="aboutCompany"
                      className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
                    >
                      Business Overview & Capabilities
                    </label>
                    <textarea
                      id="aboutCompany"
                      rows={3}
                      value={aboutCompany}
                      onChange={(e) => setAboutCompany(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-100"
                      placeholder="Briefly describe your chemical manufacturing specialties, synthesis capabilities, or product categories..."
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: AUTHORIZED REPRESENTATIVE */}
              <div className="pt-4 border-t border-slate-100">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-3 font-mono">
                  02 / AUTHORIZED REPRESENTATIVE & LOGIN
                </span>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
                      >
                        Contact Person Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-100"
                        placeholder="e.g. Dr. Alex Vance"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
                      >
                        Contact Phone
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-100"
                        placeholder="+49 30 1234567"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
                    >
                      Official Business Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-100"
                      placeholder="sales@company.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="password"
                        className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
                      >
                        Account Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="password"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-100"
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
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-100"
                        placeholder="Repeat password"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ONBOARDING SUPPLIER...
                    </>
                  ) : (
                    <>
                      COMPLETE SUPPLIER ONBOARDING
                      <ArrowRight className="w-4 h-4 text-purple-200" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Benefits & Trust Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0A192F] text-white rounded-2xl p-6 sm:p-8 shadow-md">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-teal-400 font-mono mb-3">
                SUPPLIER ADVANTAGES
              </span>
              <h3 className="text-lg font-bold tracking-tight mb-4">
                Why Sell with Synthora?
              </h3>
              
              <ul className="space-y-4 text-xs text-slate-300">
                <li className="flex items-start gap-3">
                  <Globe className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>Reach verified buyers across pharmaceutical, agrochemical, and specialty chemical sectors worldwide.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>Receive structured RFQs with CAS numbers, purity specifications, and verified volume requirements.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Award className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>Manage end-to-end commercial document issuance (COA, MSDS, Invoices) and logistics fulfillment.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Need to source instead?
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                If you are a procurement manager or laboratory researcher looking to purchase materials:
              </p>
              <Link
                href="/register"
                className="block text-center py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                Create Buyer Account →
              </Link>
            </div>

            <div className="text-center">
              <p className="text-xs text-slate-500">
                Already registered as a supplier?{" "}
                <Link href="/login" className="font-bold text-purple-600 hover:text-purple-700 underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}

export default function SupplierRegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <SupplierRegisterForm />
    </Suspense>
  );
}
