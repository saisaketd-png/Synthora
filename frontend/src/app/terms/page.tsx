import Link from "next/link";
import { SynthoraLogo } from "@/shared/components/SynthoraLogo";
import { ArrowLeft, FileText, ShieldAlert, CheckCircle } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Synthora B2B Marketplace",
  description: "Synthora Terms of Service for buyers and verified chemical suppliers.",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <SynthoraLogo href="/" size="md" subtitle="Commercial Governance" />
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
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Notice: Institutional Governance & Legal Review</p>
            <p className="text-amber-800">
              This document represents the platform terms of service version 1.0. All terms are subject to applicable commercial law, verified chemical trade regulations, and platform compliance guidelines.
            </p>
          </div>
        </div>

        {/* Document Body */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8">
          <div className="space-y-2 border-b border-slate-100 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700">
              <FileText className="w-3.5 h-3.5 text-[#0052CC]" />
              Version 1.0 (Active)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs text-slate-500 font-mono">Last Updated: August 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Platform Terms</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              By registering an account, accessing, or utilizing the Synthora B2B Marketplace platform (&quot;Synthora&quot;, &quot;Platform&quot;), whether as a Buyer, Supplier, or Authorized Representative, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not access or use the Platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. Commercial Eligibility & Verification</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Synthora is a specialized business-to-business (B2B) marketplace for industrial, chemical, and pharmaceutical procurement. Access is restricted to corporate entities, verified manufacturers, accredited distributors, and authorized enterprise buyers. Individual consumer transactions are strictly prohibited.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Suppliers must submit valid statutory registration details (e.g. GSTIN, VAT, or Commercial Registry certificates) and undergo verification review before chemical offerings can be published on the Master Catalog.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. RFQs, Quotations, and Purchase Orders</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              All Requests for Quotation (RFQs), supplier bids, and Purchase Orders (POs) generated through Synthora constitute commercial transactions governed by agreed incoterms, purity specifications, and commercial agreements between the contracting parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">4. Regulatory Compliance & Controlled Substances</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Buyers and Suppliers are solely responsible for ensuring that the trade, shipment, and receipt of listed chemical substances comply with international and local chemical laws (including REACH, OSHA, EPA, and customs trade controls). Controlled, hazardous, or restricted chemicals require verified licensing.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">5. Account Security & Auditability</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Users are responsible for safeguarding their login credentials. All commercial actions, RFQ submissions, quotation approvals, and order status updates are logged in platform audit registries.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">6. Modifications to Terms</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Synthora reserves the right to amend these Terms. Significant updates will be accompanied by an incremented version number and published on this page. Continued utilization of the platform after updates constitutes acceptance of the revised terms.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Synthora B2B Marketplace Platform</span>
            <span>Document ID: SYN-TOS-V1.0</span>
          </div>
        </div>
      </div>
    </main>
  );
}
