import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionText?: string;
  className?: string;
  dark?: boolean;
}

export function SectionHeader({
  badge,
  title,
  subtitle,
  actionHref,
  actionText = "View All",
  className = "",
  dark = false,
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 ${className}`}>
      <div className="max-w-2xl">
        {badge && (
          <span className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${dark ? "text-teal-400" : "text-[#17B5AE]"}`}>
            {badge}
          </span>
        )}
        <h2 className={`font-serif text-3xl sm:text-4xl font-extrabold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`text-sm sm:text-base mt-2 leading-relaxed ${dark ? "text-slate-300" : "text-slate-600"}`}>
            {subtitle}
          </p>
        )}
      </div>

      {actionHref && actionText && (
        <Link
          href={actionHref}
          className={`text-sm font-bold flex items-center gap-1 shrink-0 group transition-colors ${dark ? "text-slate-300 hover:text-white" : "text-[#0F3D91] hover:text-[#0c3175]"}`}
        >
          <span>{actionText}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
