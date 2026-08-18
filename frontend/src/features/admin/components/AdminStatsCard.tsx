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
  color = "teal",
}: AdminStatsCardProps) {
  const colorStyles = {
    teal: "bg-teal-50 text-teal-600 border-teal-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
  }[color];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
          {title}
        </p>
        <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </h4>
        {subtitle && (
          <p className="text-xs font-medium text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>

      <div className={`p-3.5 rounded-2xl border ${colorStyles}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
