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
    <div className="bg-white border border-[#DFE1E6] rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#FFF0B3] text-[#974F0C]">
            <AlertCircle className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold text-[#091E42]">Admin Attention Required</h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFFAE6] text-[#974F0C] border border-[#FFE380] font-mono">
          {items.length} {items.length === 1 ? "Queue" : "Queues"}
        </span>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => {
          const style = severityStyles[item.severity] || severityStyles.LOW;
          const Icon = style.icon;

          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-all ${style.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs`}
            >
              <div className="flex items-start gap-2.5">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.iconColor}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-[#091E42]">{item.title}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase font-mono ${style.badge}`}>
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-xs text-[#5E6C84] mt-0.5">{item.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="text-base font-bold text-[#091E42] font-mono">
                  {item.count.toLocaleString("en-US")}
                </span>
                <Link
                  href={item.actionUrl}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#091E42] bg-white hover:bg-[#F4F5F7] border border-[#DFE1E6] rounded-lg transition-colors shadow-2xs"
                >
                  <span>Review</span>
                  <ArrowRight className="w-3 h-3 text-[#5E6C84]" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
