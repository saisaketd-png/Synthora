import React from "react";
import { LucideIcon } from "lucide-react";

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "teal" | "purple" | "blue" | "amber" | "rose" | "slate";
}

export function AdminStatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
}: AdminStatsCardProps) {
  const colorStyles = {
    teal: "text-[#059669] bg-[#ECFDF5] border-[rgba(5,150,105,0.2)]",
    purple: "text-[#7C3AED] bg-[#F5F3FF] border-[rgba(124,58,237,0.2)]",
    blue: "text-[#0052CC] bg-[#EFF6FF] border-[#BFDBFE]",
    amber: "text-[#D97706] bg-[#FFFBEB] border-[rgba(217,119,6,0.2)]",
    rose: "text-[#DC2626] bg-[#FEF2F2] border-[rgba(220,38,38,0.2)]",
    slate: "text-[#475569] bg-[#F4F4F5] border-[#E4E4E7]",
  }[color];

  return (
    <div className="bg-white p-4 rounded-[8px] border border-[#E4E4E7] shadow-tactile-card flex items-center justify-between gap-4">
      <div>
        <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider font-mono mb-1">
          {title}
        </p>
        <h4 className="text-xl sm:text-2xl font-bold font-mono text-[#0F172A] tracking-tight">
          {value}
        </h4>
        {subtitle && (
          <p className="text-[11px] text-[#64748B] mt-1">{subtitle}</p>
        )}
      </div>

      <div className={`p-2 rounded-[6px] border ${colorStyles} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

