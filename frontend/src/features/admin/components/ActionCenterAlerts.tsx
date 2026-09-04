"use client";

import React from "react";
import Link from "next/link";
import { ActionCenterCounterDto } from "../types";
import { AlertCircle, AlertTriangle, Info, ArrowRight, CheckCircle2 } from "lucide-react";

interface ActionCenterAlertsProps {
  items: ActionCenterCounterDto[];
}

export function ActionCenterAlerts({ items }: ActionCenterAlertsProps) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white border border-[#DFE1E6] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-5 h-5 text-[#00875A]" />
          <h3 className="text-base font-bold text-[#091E42]">Platform Action Center</h3>
        </div>
        <div className="py-6 text-center text-sm text-[#5E6C84]">
          All operational queues are clear. No pending items require immediate admin intervention.
        </div>
      </div>
    );
  }

  const severityStyles = {
    HIGH: {
      bg: "bg-[#FFEBE6] border-[#FFBDAD] hover:border-[#DE350B]",
      badge: "bg-[#FFBDAD] text-[#DE350B]",
      icon: AlertCircle,
      iconColor: "text-[#DE350B]",
    },
    MEDIUM: {
      bg: "bg-[#FFF0B3] border-[#FFE380] hover:border-[#FF8B00]",
      badge: "bg-[#FFE380] text-[#974F0C]",
      icon: AlertTriangle,
      iconColor: "text-[#FF8B00]",
    },
    LOW: {
      bg: "bg-[#DEEBFF] border-[#B3D4FF] hover:border-[#0052CC]",
      badge: "bg-[#B3D4FF] text-[#0747A6]",
      icon: Info,
      iconColor: "text-[#0052CC]",
    },
  };

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3 border-b border-[#E4E4E7] pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
            Review Queue
          </span>
          <h3 className="text-sm font-semibold text-[#0F172A] mt-0.5">
            Operational Attention
          </h3>
        </div>
        <span className="text-xs font-mono text-[#D97706] font-semibold">
          {items.length} {items.length === 1 ? "action queue" : "action queues"}
        </span>
      </div>

      <div className="divide-y divide-[#E4E4E7]">
        {items.map((item) => (
          <div
            key={item.id}
            className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[6px] bg-[#FFFBEB] border border-[rgba(217,119,6,0.3)] text-[#D97706] font-mono font-bold text-sm flex items-center justify-center shrink-0">
                {item.count}
              </div>
              <div>
                <div className="text-xs font-semibold text-[#0F172A]">{item.title}</div>
                <p className="text-[11px] text-[#64748B] line-clamp-1">{item.description}</p>
              </div>
            </div>

            <Link
              href={item.actionUrl}
              className="h-7 px-2.5 bg-white hover:bg-[#FAFAFA] text-[#0052CC] border border-[#BFDBFE] rounded-[4px] text-xs font-medium transition-colors shadow-xs inline-flex items-center gap-1 shrink-0"
            >
              <span>Review</span>
              <ArrowRight className="w-3 h-3 text-[#0052CC]" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
