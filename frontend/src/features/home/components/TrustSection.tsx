import { ShieldCheck, FileText, Truck } from "lucide-react";

export function TrustSection() {
  const pillars = [
    {
      icon: ShieldCheck,
      title: "Supplier Verification Process",
      description:
        "Every supplier undergoes rigorous multi-step auditing including ISO/GMP facility inspections, business license verification, and background compliance checks.",
      badge: "100% Audited",
    },
    {
      icon: FileText,
      title: "Technical & Regulatory Specs",
      description:
        "Instant access to verified COA (Certificate of Analysis), MSDS safety sheets, DMF (Drug Master Files), and batch testing documentation prior to order placement.",
      badge: "Compliant Specs",
    },
    {
      icon: Truck,
      title: "Global Export & Logistics",
      description:
        "End-to-end logistics support covering dangerous goods (DG) compliance, temperature-controlled cold chain, customs documentation, and INCOTERMS guarantees.",
      badge: "Worldwide Shipping",
    },
  ];

  return (
    <section id="suppliers" className="py-16 md:py-24 bg-gradient-to-b from-[#F0F5FD] to-[#EBF3FC] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-500">
            Enterprise Trust & Safety
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#0F172A] mt-1">
            Built for High-Stakes Chemical & Pharma Procurement
          </h2>
          <p className="text-[#475569] text-base mt-3">
            We eliminate counterparty risk with strict verification, verified compliance documents, and transparent trade financing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="px-3 py-1 bg-teal-500/10 text-teal-500 rounded-full text-xs font-bold">
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0F172A] mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-[#475569] leading-relaxed">
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
