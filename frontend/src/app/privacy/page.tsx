import Link from "next/link";
import { KemKendraLogo } from "@/shared/components/KemkendraLogo";
import { ArrowLeft, Shield, Lock, Eye, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | KemKendra B2B Marketplace",
  description: "KemKendra Privacy Policy, commercial data protection, and confidentiality standards.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <KemKendraLogo href="/" size="md" subtitle="Data Privacy & Compliance" />
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#0052CC] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Registration
          </Link>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 flex items-start gap-3">
          <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Notice: Data Protection & Governance Overview</p>
            <p className="text-amber-800">
              This document represents the platform privacy policy version 1.0. Commercial data handling complies with institutional security and commercial confidentiality requirements.
            </p>
          </div>
        </div>

        {/* Document Body */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8">
          <div className="space-y-2 border-b border-slate-100 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700">
              <Lock className="w-3.5 h-3.5 text-[#0052CC]" />
              Version 1.0 (Active)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-500 font-mono">Last Updated: August 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. Information We Collect</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              When registering as a Buyer or Supplier on the KemKendra platform, we collect corporate contact details, including your full name, business email address, phone number, company name, country, and city.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              For suppliers undergoing verification, we collect statutory company identifiers (e.g. GSTIN, VAT, business registration), quality certifications (ISO, GMP, COA), and company profiles.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. Commercial Purpose & Data Use</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We process account data to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
              <li>Authenticate enterprise users and maintain secure platform access.</li>
              <li>Facilitate RFQ transmission, supplier bids, and purchase order tracking.</li>
              <li>Verify supplier credibility and statutory chemical compliance.</li>
              <li>Send critical transactional notifications (order confirmation, shipment tracking, password recovery).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. Commercial Confidentiality & Pricing Protection</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Confidential trade parameters, quotation figures, negotiated incoterms, and supplier margin data are strictly encrypted and access-controlled. We never sell commercial transaction data to third-party advertisers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">4. Data Security & Retention</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              All credentials are cryptographically protected using salted one-way hashing (BCrypt). Data transmissions are secured over TLS. Audit logs of commercial actions are maintained for compliance and regulatory verification.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">5. User Rights & Data Contact</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Authorized account holders may review and update their personal profile data via the Dashboard Account Settings. For data privacy inquiries or corporate account deactivation, contact the platform security administration.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>KemKendra B2B Marketplace Platform</span>
            <span>Document ID: SYN-PRIVACY-V1.0</span>
          </div>
        </div>
      </div>
    </main>
  );
}
