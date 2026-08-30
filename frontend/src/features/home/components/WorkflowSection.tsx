import { Search, Scale, FileSpreadsheet, ShieldCheck, CheckCircle2 } from "lucide-react";

export function WorkflowSection() {
  const steps = [
    {
      step: 1,
      icon: Search,
      title: "Search Products",
      desc: "Query by CAS number, chemical name, or structure.",
    },
    {
      step: 2,
      icon: Scale,
      title: "Compare Suppliers",
      desc: "Evaluate audited manufacturers by purity, MOQ, & location.",
    },
    {
      step: 3,
      icon: FileSpreadsheet,
      title: "Request Quotes",
      desc: "Submit digital RFQs directly to factory sales teams.",
    },
    {
      step: 4,
      icon: ShieldCheck,
      title: "Verify Documentation",
      desc: "Inspect COA, MSDS, and GMP certifications.",
    },
    {
      step: 5,
      icon: CheckCircle2,
      title: "Finalize Procurement",
      desc: "Secure payment with guaranteed compliance logistics.",
    },
  ];

  return (
    <section id="workflow" className="py-16 md:py-24 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-500">
            Simplified Sourcing Process
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#0F172A] mt-1">
            How KemKendra Streamlines Chemical Procurement
          </h2>
          <p className="text-[#475569] text-base mt-2">
            A transparent 5-step workflow designed specifically for pharmaceutical and industrial buyers.
          </p>
        </div>

        {/* Stepper Timeline Container */}
        <div className="relative">
          {/* Desktop Connecting Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-[#E2E8F0] -translate-y-8 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="flex flex-col items-center text-center bg-white p-4 rounded-xl border border-[#E2E8F0] lg:border-none shadow-sm lg:shadow-none"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-md mb-4 relative">
                    <Icon className="w-6 h-6 text-white" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center font-extrabold border-2 border-white">
                      {s.step}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A] mb-1">
                    {s.title}
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
