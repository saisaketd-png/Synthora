import { ShieldCheck, FileText, Truck, ArrowRight } from "lucide-react";
import Link from "next/link";

export function TrustSection() {
  const pillars = [
    {
      icon: ShieldCheck,
      title: "Supplier Verification & Audit",
      description:
        "Every seller undergoes multi-step regulatory vetting including business licenses, facility verification, and compliance checks before quotation privileges are activated.",
      badge: "Verified Entity",
    },
    {
      icon: FileText,
      title: "Technical & Regulatory Monograph Specs",
      description:
        "Direct access to authentic Certificates of Analysis (COA), safety dossiers (MSDS), Drug Master Files (DMF), and batch assay records prior to commercial order execution.",
      badge: "Full Documentation",
    },
    {
      icon: Truck,
      title: "Auditable Commercial Lifecycle",
      description:
        "End-to-end custody tracking across RFQ inquiries, binding quotation commitments, legally valid purchase orders, and dispatched shipment tracking records.",
      badge: "Complete Custody",
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-[#FAFAFA] border-b border-[#E4E4E7]">
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0052CC] font-mono bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1 rounded-[4px]">
            Procurement Governance
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] mt-2.5">
            Engineered for Regulated Chemical Procurement
          </h2>
          <p className="text-[#64748B] text-xs sm:text-sm mt-1.5 leading-relaxed">
            Eliminating counterparty risk through identity-verified manufacturers, transparent technical dossiers, and audit-ready commercial transactions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="bg-white p-6 rounded-[8px] border border-[#E4E4E7] shadow-tactile-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-[6px] bg-[#EFF6FF] text-[#0052CC] border border-[#BFDBFE] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[rgba(5,150,105,0.2)] rounded-[4px] text-[10px] font-mono font-medium uppercase">
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#0F172A] mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
