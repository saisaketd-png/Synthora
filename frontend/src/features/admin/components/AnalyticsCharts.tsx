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
      label: "GMV / Value",
      icon: DollarSign,
      badgeBg: "bg-[#E3FCEF] text-[#006644]",
      strokeColor: "#00875A",
      fillColor: "rgba(0, 135, 90, 0.12)",
      isCurrency: true,
      data: trends.gmv || [],
    },
    orders: {
      label: "Orders",
      icon: ShoppingCart,
      badgeBg: "bg-[#DEEBFF] text-[#0747A6]",
      strokeColor: "#0052CC",
      fillColor: "rgba(0, 82, 204, 0.12)",
      isCurrency: false,
      data: trends.orders || [],
    },
    rfqs: {
      label: "RFQs",
      icon: FileText,
      badgeBg: "bg-[#FFF0B3] text-[#974F0C]",
      strokeColor: "#FF8B00",
      fillColor: "rgba(255, 139, 0, 0.12)",
      isCurrency: false,
      data: trends.rfqs || [],
    },
    quotations: {
      label: "Quotations",
      icon: Layers,
      badgeBg: "bg-[#EAE6FF] text-[#403294]",
      strokeColor: "#6554C0",
      fillColor: "rgba(101, 84, 192, 0.12)",
      isCurrency: false,
      data: trends.quotations || [],
    },
    users: {
      label: "Registrations",
      icon: Users,
      badgeBg: "bg-[#E6FCFF] text-[#006580]",
      strokeColor: "#00A3BF",
      fillColor: "rgba(0, 163, 191, 0.12)",
      isCurrency: false,
      data: trends.userRegistrations || [],
    },
  };

  const currentConfig = metricConfigs[activeMetric];
  const data = currentConfig.data;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

  // SVG Geometry
  const width = 800;
  const height = 240;
  const paddingX = 45;
  const paddingY = 30;
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
    <div className="bg-white border border-[#DFE1E6] rounded-2xl p-5 sm:p-6 shadow-sm">
      {/* Header & Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#DEEBFF] text-[#0052CC]">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-[#091E42]">Platform Activity Trends</h3>
          </div>
          <p className="text-xs text-[#5E6C84] mt-1">
            Aggregated metric telemetry for window ({periodLabel})
          </p>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex flex-wrap gap-1 p-1 bg-[#F4F5F7] border border-[#DFE1E6] rounded-xl">
          {(Object.keys(metricConfigs) as TrendMetric[]).map((key) => {
            const cfg = metricConfigs[key];
            const Icon = cfg.icon;
            const isSelected = activeMetric === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveMetric(key);
                  setHoveredPoint(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0052CC] text-white shadow-xs"
                    : "text-[#5E6C84] hover:text-[#091E42] hover:bg-[#EBECF0]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Total for Active Metric */}
      <div className="mb-4 flex items-baseline gap-3">
        <span className="text-2xl sm:text-3xl font-bold font-mono text-[#091E42] tracking-tight">
          {currentConfig.isCurrency
            ? `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : totalValue.toLocaleString("en-US")}
        </span>
        <span className="text-xs text-[#5E6C84] font-medium">
          Total in current period
        </span>
      </div>

      {/* Interactive SVG Area Chart */}
      <div className="relative w-full overflow-hidden">
        {data.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-[#5E6C84]">
            No activity records found in this window.
          </div>
        ) : (
          <div className="relative">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-56 select-none"
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
    <div className="bg-white border border-[#DFE1E6] rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#EAE6FF] text-[#403294]">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-[#091E42]">Marketplace Conversion Funnel</h3>
          </div>
          <p className="text-xs text-[#5E6C84] mt-1">
            End-to-end transaction pipeline efficiency from RFQ creation to order completion
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#5E6C84] font-medium">Overall Efficiency</div>
          <div className="text-xl font-bold font-mono text-[#0052CC]">
            {funnel.overallConversionRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {stages.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#5E6C84]">
          No pipeline data available.
        </div>
      ) : (
        <div className="space-y-2.5">
          {stages.map((stage, idx) => {
            const isLast = idx === stages.length - 1;
            const progressWidth = Math.max(stage.conversionPercentage, stage.count > 0 ? 6 : 0);

            return (
              <div key={stage.stage} className="relative">
                <div className="p-3.5 bg-[#FAFBFC] border border-[#DFE1E6] rounded-xl hover:border-[#B3BAC5] transition-colors">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2 font-semibold text-[#091E42]">
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#EBECF0] text-[10px] font-mono text-[#172B4D]">
                        {idx + 1}
                      </span>
                      <span>{stage.label}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-[#091E42] font-mono">
                        {stage.count.toLocaleString("en-US")}
                      </span>
                      {idx > 0 && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#DEEBFF] text-[#0747A6] font-mono">
                          {stage.conversionPercentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full bg-[#EBECF0] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#0052CC] to-[#00875A] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progressWidth, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Funnel Step Drop-off Connector */}
                {!isLast && stage.dropOffPercentage > 0 && (
                  <div className="flex items-center justify-center py-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-[#DE350B] font-mono font-medium">
                      <ArrowDown className="w-3 h-3" />
                      <span>{stage.dropOffPercentage.toFixed(1)}% drop-off</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
