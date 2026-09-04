import { Activity } from "lucide-react";

export function MarketActivity() {
  const rfqs = [
    {
      id: "rfq-1",
      product: "Paracetamol API",
      quantity: "500 kg",
      country: "IN India",
      timeAgo: "2 min ago",
      color: "bg-blue-600"
    },
    {
      id: "rfq-2",
      product: "Acetic Acid",
      quantity: "2 MT",
      country: "AE UAE",
      timeAgo: "8 min ago",
      color: "bg-teal-500"
    },
    {
      id: "rfq-3",
      product: "4-Hydroxycarbazole",
      quantity: "25 kg",
      country: "DE Germany",
      timeAgo: "14 min ago",
      color: "bg-orange-500"
    },
    {
      id: "rfq-4",
      product: "Ibuprofen API",
      quantity: "1 MT",
      country: "CN China",
      timeAgo: "21 min ago",
      color: "bg-blue-600"
    },
    {
      id: "rfq-5",
      product: "Ethanol 99.9%",
      quantity: "5 MT",
      country: "US USA",
      timeAgo: "33 min ago",
      color: "bg-teal-500"
    },
  ];

  return (
    <div className="bg-white rounded-[8px] border border-[#E4E4E7] p-6 sm:p-8 flex flex-col h-full relative shadow-tactile-card">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b border-[#E4E4E7]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[6px] bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#0052CC]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#0F172A]">Market Sourcing Activity</h3>
            <p className="text-xs text-[#64748B]">Recent inbound requests for commercial quotations</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[rgba(5,150,105,0.2)] rounded-[4px]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider">Live Flow</span>
        </div>
      </div>

      {/* List */}
      <div className="relative flex-1">
        {/* Vertical Line */}
        <div className="absolute left-[5px] top-3 bottom-8 w-px bg-[#E4E4E7]" />
        
        <div className="space-y-6 relative">
          {rfqs.map((rfq) => (
            <div key={rfq.id} className="flex items-start gap-4 group">
              <div className="w-2.5 h-2.5 rounded-full mt-1.5 ring-4 ring-white bg-[#0052CC] relative z-10" />
              
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-semibold text-[#0F172A] text-xs">{rfq.product}</span>
                    <span className="text-[#94A3B8]">&middot;</span>
                    <span className="font-mono text-xs font-semibold text-[#0F172A]">{rfq.quantity}</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#64748B] uppercase">
                    {rfq.country}
                  </div>
                </div>
                
                <div className="text-[11px] font-mono text-[#64748B]">
                  {rfq.timeAgo}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
