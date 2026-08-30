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
    <div className="bg-white border border-[#DFE1E6] rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#DEEBFF] text-[#0052CC]">
            <Activity className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold text-[#091E42]">Recent Platform Activity</h3>
        </div>
        <span className="text-xs text-[#5E6C84] font-mono">
          Latest {activities.length} events
        </span>
      </div>

      <div className="divide-y divide-[#EBECF0]">
        {activities.map((item) => (
          <div key={item.id} className="py-3 flex items-start justify-between gap-3 group hover:bg-[#FAFBFC] px-2 rounded-lg transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#F4F5F7] border border-[#DFE1E6] shrink-0 mt-0.5">
                {getEventIcon(item.eventType)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#091E42]">{item.title}</span>
                  {item.entityType && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#EBECF0] text-[#172B4D] font-mono font-medium">
                      {item.entityType}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5E6C84] mt-0.5 line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-[#7A869A] mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(item.timestamp)}
                  </span>
                  <span>•</span>
                  <span>Actor: {item.actorName}</span>
                </div>
              </div>
            </div>

            {item.link && (
              <Link
                href={item.link}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-[#5E6C84] hover:text-[#0052CC] hover:bg-[#EBECF0] rounded-md shrink-0"
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
