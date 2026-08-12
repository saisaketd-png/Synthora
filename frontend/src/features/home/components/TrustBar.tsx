import { ShieldCheck, Award, FileCheck2, FileText, Globe2, Truck } from "lucide-react";

export function TrustBar() {
  const trustBadges = [
    { label: "GMP VERIFIED", icon: ShieldCheck },
    { label: "ISO 9001 CERTIFIED", icon: Award },
    { label: "COA AVAILABLE", icon: FileCheck2 },
    { label: "MSDS AVAILABLE", icon: FileText },
    { label: "EXPORT SUPPORT", icon: Globe2 },
    { label: "GLOBAL SHIPPING", icon: Truck },
  ];

  return (
    <div className="bg-white border-b border-slate-200 py-2.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center divide-x-0 sm:divide-x divide-slate-200">
          {trustBadges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.label}
                className="flex items-center justify-center gap-1.5 py-1 px-2 text-slate-500 font-semibold text-[10px] tracking-wider"
              >
                <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
