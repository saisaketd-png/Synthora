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
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-10 flex flex-col h-full relative">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#0A192F]">Market Activity</h3>
            <p className="text-[13px] font-medium text-slate-500">Live requests for quotation</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-600 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wide">Live</span>
        </div>
      </div>

      {/* List */}
      <div className="relative flex-1">
        {/* Vertical Line */}
        <div className="absolute left-[5px] top-3 bottom-8 w-px bg-slate-100" />
        
        <div className="space-y-8 relative">
          {rfqs.map((rfq) => (
            <div key={rfq.id} className="flex items-start gap-6 group">
              <div className={`w-3 h-3 rounded-full mt-1.5 ring-4 ring-white ${rfq.color} relative z-10`} />
              
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-[#0A192F] text-[15px]">{rfq.product}</span>
                    <span className="text-slate-300">&middot;</span>
                    <span className="font-mono text-[13px] font-bold text-slate-500">{rfq.quantity}</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    {rfq.country}
                  </div>
                </div>
                
                <div className="text-[12px] font-mono text-slate-400 mt-1">
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
