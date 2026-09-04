"use client";

import React from "react";
import Link from "next/link";
import { RecentActivityDto } from "../types";
import { Activity, ExternalLink, Clock, FileText, ShoppingCart, UserCheck, Truck } from "lucide-react";

interface RecentActivityFeedProps {
  activities: RecentActivityDto[];
}

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white border border-[#DFE1E6] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-[#0052CC]" />
          <h3 className="text-base font-bold text-[#091E42]">Recent Platform Activity</h3>
        </div>
        <div className="py-8 text-center text-sm text-[#5E6C84]">
          No platform activities recorded yet.
        </div>
      </div>
    );
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "RFQ_CREATED":
      case "RFQ":
        return <FileText className="w-4 h-4 text-[#FF8B00]" />;
      case "QUOTATION_SUBMITTED":
      case "QUOTATION":
        return <FileText className="w-4 h-4 text-[#6554C0]" />;
      case "PURCHASE_ORDER_CREATED":
      case "ORDER":
        return <ShoppingCart className="w-4 h-4 text-[#00875A]" />;
      case "SHIPMENT_CREATED":
      case "SHIPMENT":
        return <Truck className="w-4 h-4 text-[#00A3BF]" />;
      case "USER_REGISTERED":
      case "USER":
        return <UserCheck className="w-4 h-4 text-[#0052CC]" />;
      default:
        return <Activity className="w-4 h-4 text-[#5E6C84]" />;
    }
  };

  const formatTimeAgo = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr);
      const now = new Date();
      const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSeconds < 60) return "just now";
      if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
      if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
      return `${Math.floor(diffSeconds / 86400)}d ago`;
    } catch {
      return timestampStr;
    }
  };

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3 border-b border-[#E4E4E7] pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
            Event Stream
          </span>
          <h3 className="text-sm font-semibold text-[#0F172A] mt-0.5">
            Operational Activity
          </h3>
        </div>
        <span className="text-xs text-[#64748B] font-mono">
          Last {activities.length} actions
        </span>
      </div>

      <div className="divide-y divide-[#E4E4E7]">
        {activities.map((item) => (
          <div key={item.id} className="py-2.5 flex items-start justify-between gap-3 group">
            <div className="flex items-start gap-3">
              <span className="text-[11px] font-mono text-[#64748B] mt-0.5 shrink-0 w-14">
                {formatTimeAgo(item.timestamp)}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#0F172A]">{item.title}</span>
                  {item.entityType && (
                    <span className="px-1.5 py-0.2 rounded-[3px] text-[10px] bg-[#F4F4F5] text-[#475569] font-mono">
                      {item.entityType}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">{item.description}</p>
                <div className="text-[10px] text-[#94A3B8] mt-0.5">
                  Actor: {item.actorName} ({item.actorRole})
                </div>
              </div>
            </div>

            {item.link && (
              <Link
                href={item.link}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#64748B] hover:text-[#0052CC] shrink-0"
                title="View entity"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
