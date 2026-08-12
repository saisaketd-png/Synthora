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
    <div className="bg-[#0A192F] rounded-[2.5rem] p-10 flex flex-col h-full shadow-2xl">
      
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">
            How it works
          </span>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight mb-4 leading-tight">
          A guided path from search to shipment
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-md">
          Move through a single, transparent procurement journey — every step tracked, documented, and audit-ready.
        </p>
      </div>

      {/* Vertical Steps */}
      <div className="relative flex-1">
        {/* Vertical Line */}
        <div className="absolute left-[23px] top-6 bottom-6 w-px bg-slate-800" />
        
        <div className="space-y-8 relative">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="flex items-center gap-6 group">
                <div className="relative z-10 w-12 h-12 rounded-full border border-slate-700 bg-[#0A192F] flex items-center justify-center group-hover:border-teal-500 group-hover:shadow-[0_0_15px_rgba(23,181,174,0.2)] transition-all">
                  <Icon className="w-5 h-5 text-teal-500" />
                </div>
                
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-white text-[15px] mb-1">{s.title}</h3>
                    <p className="text-[13px] text-slate-400">{s.desc}</p>
                  </div>
                  <div className="text-[10px] font-mono font-bold text-slate-500">
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
