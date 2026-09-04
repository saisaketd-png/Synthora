"use client";

import React, { useState } from "react";
import { AnalyticsTrendsDto, MarketplaceFunnelDto, DataPointDto } from "../types";
import { TrendingUp, DollarSign, FileText, ShoppingCart, Users, Layers, ArrowDown } from "lucide-react";

interface PlatformTrendChartProps {
  trends: AnalyticsTrendsDto;
  periodLabel: string;
}

type TrendMetric = "gmv" | "orders" | "rfqs" | "quotations" | "users";

export function PlatformTrendChart({ trends, periodLabel }: PlatformTrendChartProps) {
  const [activeMetric, setActiveMetric] = useState<TrendMetric>("gmv");
  const [hoveredPoint, setHoveredPoint] = useState<{ date: string; value: number; x: number; y: number } | null>(null);

  const metricConfigs: Record<TrendMetric, {
    label: string;
    icon: React.ElementType;
    badgeBg: string;
    strokeColor: string;
    fillColor: string;
    isCurrency: boolean;
    data: DataPointDto[];
  }> = {
    gmv: {
      label: "Marketplace GMV",
      icon: DollarSign,
      badgeBg: "bg-[#ECFDF5] text-[#059669]",
      strokeColor: "#059669",
      fillColor: "rgba(5, 150, 105, 0.08)",
      isCurrency: true,
      data: trends.gmv || [],
    },
    orders: {
      label: "Orders",
      icon: ShoppingCart,
      badgeBg: "bg-[#EFF6FF] text-[#0052CC]",
      strokeColor: "#0052CC",
      fillColor: "rgba(0, 82, 204, 0.08)",
      isCurrency: false,
      data: trends.orders || [],
    },
    rfqs: {
      label: "RFQs",
      icon: FileText,
      badgeBg: "bg-[#FFFBEB] text-[#D97706]",
      strokeColor: "#D97706",
      fillColor: "rgba(217, 119, 6, 0.08)",
      isCurrency: false,
      data: trends.rfqs || [],
    },
    quotations: {
      label: "Quotations",
      icon: Layers,
      badgeBg: "bg-[#FAFAFA] text-[#0F172A]",
      strokeColor: "#0F172A",
      fillColor: "rgba(15, 23, 42, 0.06)",
      isCurrency: false,
      data: trends.quotations || [],
    },
    users: {
      label: "Registrations",
      icon: Users,
      badgeBg: "bg-[#EFF6FF] text-[#0052CC]",
      strokeColor: "#0284C7",
      fillColor: "rgba(2, 132, 199, 0.08)",
      isCurrency: false,
      data: trends.userRegistrations || [],
    },
  };

  const currentConfig = metricConfigs[activeMetric];
  const data = currentConfig.data;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

  // SVG Geometry - Compact and disciplined
  const width = 600;
  const height = 150;
  const paddingX = 35;
  const paddingY = 20;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data.map((d, index) => {
    const x = paddingX + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y = height - paddingY - (d.value / maxValue) * chartHeight;
    return { x, y, date: d.date, value: d.value };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`;
  }, "");

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`
    : "";

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-4 shadow-xs flex flex-col justify-between">
      {/* Header & Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-[#E4E4E7] pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
            Telemetry Stream
          </span>
          <div className="text-sm font-semibold text-[#0F172A] mt-0.5">
            {currentConfig.label}
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap gap-1 p-0.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px]">
          {(Object.keys(metricConfigs) as TrendMetric[]).map((key) => {
            const config = metricConfigs[key];
            const isSelected = activeMetric === key;
            return (
              <button
                key={key}
                onClick={() => setActiveMetric(key)}
                className={`px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#0052CC] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4F4F5]"
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>


      {/* Summary Total for Active Metric */}
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-xl font-bold font-mono text-[#0F172A] tracking-tight">
          {currentConfig.isCurrency
            ? `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : totalValue.toLocaleString("en-US")}
        </span>
        <span className="text-xs text-[#64748B]">
          window aggregate
        </span>
      </div>

      {/* Interactive SVG Area Chart */}
      <div className="relative w-full overflow-hidden">
        {data.length === 0 ? (
          <div className="h-36 flex items-center justify-center text-xs text-[#64748B]">
            No activity records found in this window.
          </div>
        ) : (
          <div className="relative">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-36 select-none"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = height - paddingY - ratio * chartHeight;
                const gridVal = (ratio * maxValue).toFixed(0);
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="#EBECF0"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="10"
                      fill="#7A869A"
                      fontFamily="monospace"
                    >
                      {currentConfig.isCurrency ? `$${gridVal}` : gridVal}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              {areaD && (
                <path
                  d={areaD}
                  fill={currentConfig.fillColor}
                  className="transition-all duration-300"
                />
              )}

              {/* Line Stroke */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={currentConfig.strokeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points & hover triggers */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint?.date === p.date ? 6 : 3.5}
                    fill={currentConfig.strokeColor}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredPoint(p)}
                  />
                  {/* Invisible wide hit target */}
                  <rect
                    x={p.x - 15}
                    y={0}
                    width={30}
                    height={height}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(p)}
                  />
                </g>
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div
                className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-[#091E42] text-white px-3 py-1.5 rounded-lg shadow-xl text-center z-10"
                style={{
                  left: `${(hoveredPoint.x / width) * 100}%`,
                  top: `${(hoveredPoint.y / height) * 100}%`,
                }}
              >
                <div className="text-[10px] text-[#8993A4] uppercase tracking-wider font-mono">
                  {hoveredPoint.date}
                </div>
                <div className="text-xs font-bold text-white font-mono">
                  {currentConfig.isCurrency
                    ? `$${hoveredPoint.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : hoveredPoint.value.toLocaleString("en-US")}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Date Axis Legend */}
      {points.length > 0 && (
        <div className="flex justify-between text-[11px] text-[#7A869A] font-mono mt-2 px-6">
          <span>{points[0]?.date}</span>
          {points.length > 2 && <span>{points[Math.floor(points.length / 2)]?.date}</span>}
          <span>{points[points.length - 1]?.date}</span>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Marketplace Funnel Visualization
// ===========================================================================

interface MarketplaceFunnelChartProps {
  funnel: MarketplaceFunnelDto;
}

export function MarketplaceFunnelChart({ funnel }: MarketplaceFunnelChartProps) {
  const stages = funnel.stages || [];

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-[#E4E4E7] pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
            Transaction Flow
          </span>
          <h3 className="text-sm font-semibold text-[#0F172A] mt-0.5">
            Commercial Conversion Pipeline
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B]">Pipeline Throughput:</span>
          <span className="text-xs font-bold font-mono text-[#0052CC] px-2 py-0.5 rounded-[4px] bg-[#EFF6FF] border border-[#BFDBFE]">
            {funnel.overallConversionRate.toFixed(1)}%
          </span>
        </div>
      </div>

      {stages.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#64748B]">
          No pipeline records available.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
          {stages.map((stage, idx) => {
            const isLast = idx === stages.length - 1;

            return (
              <React.Fragment key={stage.stage}>
                <div className="p-3 bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px] flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-1">
                    <span className="font-mono text-[10px] text-[#94A3B8]">0{idx + 1}</span>
                    {idx > 0 && (
                      <span className="font-mono text-[10px] text-[#0052CC] font-semibold">
                        {stage.conversionPercentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-[#0F172A] truncate">
                    {stage.label}
                  </div>
                  <div className="text-lg font-bold font-mono text-[#0F172A] mt-1">
                    {stage.count.toLocaleString("en-US")}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
