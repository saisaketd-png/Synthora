import { Search, ListFilter, FileEdit, FileText, Package } from "lucide-react";

export function ProcurementWorkflow() {
  const steps = [
    { step: "01", title: "Search", desc: "Find verified ingredients", icon: Search },
    { step: "02", title: "Compare", desc: "Specs, price & lead time", icon: ListFilter },
    { step: "03", title: "RFQ", desc: "Request quotes instantly", icon: FileEdit },
    { step: "04", title: "Documentation", desc: "COA, MSDS & compliance", icon: FileText },
    { step: "05", title: "Procurement", desc: "Order & track shipping", icon: Package },
  ];

  return (
    <div className="bg-[#0F172A] border border-[#1E293B] rounded-[8px] p-6 sm:p-8 flex flex-col h-full shadow-tactile-card">
      
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-[#1E293B]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#0052CC]" />
          <span className="text-[10px] font-mono font-medium text-[#60A5FA] uppercase tracking-wider">
            Operational Protocol
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-snug">
          Structured Procurement from Inquiry to Consignment
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed mt-1">
          Complete commercial lifecycle with binding quotation commitments, verified technical specifications, and end-to-end shipment custody.
        </p>
      </div>

      {/* Vertical Steps */}
      <div className="relative flex-1">
        {/* Vertical Line */}
        <div className="absolute left-[17px] top-4 bottom-4 w-px bg-slate-800" />
        
        <div className="space-y-6 relative">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="flex items-center gap-4 group">
                <div className="relative z-10 w-9 h-9 rounded-[6px] border border-slate-700 bg-[#1E293B] flex items-center justify-center group-hover:border-[#0052CC] transition-colors">
                  <Icon className="w-4 h-4 text-[#60A5FA]" />
                </div>
                
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-white text-xs mb-0.5">{s.title}</h3>
                    <p className="text-[11px] text-slate-400">{s.desc}</p>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 font-semibold">
                    {s.step}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
