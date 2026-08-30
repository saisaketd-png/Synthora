"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  FlaskConical,
  Package,
  Building2,
  Truck,
  FileText,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { StatusBadge } from "@/shared/components/ui/KemkendraUI";

/* -------------------------------------------------------------------------- */
/*                           1. PROCUREMENT BREADCRUMB                        */
/* -------------------------------------------------------------------------- */

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function ProcurementBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-[#5E6C84]">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#8993A4] shrink-0" />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-[#0052CC] transition-colors truncate max-w-[200px]"
              >
                {item.label}
              </Link>
            ) : (
              <span className={`truncate max-w-[250px] ${isLast ? "text-[#091E42] font-bold" : ""}`}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*                             2. PROCUREMENT HERO                            */
/* -------------------------------------------------------------------------- */

export interface ProcurementHeroProps {
  eyebrow?: string;
  referenceNumber: string;
  title: string;
  subtitle?: string;
  status: string;
  date?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  counterpartLabel?: string;
  counterpartName?: string;
  counterpartVerified?: boolean;
}

export function ProcurementHero({
  eyebrow = "PROCUREMENT DOSSIER",
  referenceNumber,
  title,
  subtitle,
  status,
  date,
  primaryAction,
  secondaryAction,
  counterpartLabel = "COUNTERPART",
  counterpartName,
  counterpartVerified,
}: ProcurementHeroProps) {
  return (
    <div className="bg-white border border-[#DFE1E6] rounded-2xl p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Info */}
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#0052CC] bg-[#DEEBFF] px-2.5 py-0.5 rounded">
              {eyebrow}
            </span>
            <span className="font-mono text-xs font-bold text-[#5E6C84]">
              {referenceNumber}
            </span>
            {date && (
              <>
                <span className="text-[#DFE1E6]">•</span>
                <span className="text-xs text-[#5E6C84] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#6B778C]" />
                  {date}
                </span>
              </>
            )}
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#091E42] tracking-tight">
              {title}
            </h1>
            <StatusBadge status={status} size="md" />
          </div>

          {subtitle && (
            <p className="text-xs sm:text-sm text-[#5E6C84] font-medium leading-relaxed">
              {subtitle}
            </p>
          )}

          {counterpartName && (
            <div className="pt-1 flex items-center gap-2 text-xs text-[#172B4D]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84]">
                {counterpartLabel}:
              </span>
              <span className="font-bold">{counterpartName}</span>
              {counterpartVerified && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-[#E3FCEF] text-[#006644] text-[10px] font-bold rounded">
                  <ShieldCheck className="w-3 h-3" />
                  VERIFIED
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Actions */}
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-wrap items-center gap-3 shrink-0 self-start lg:self-center">
            {secondaryAction}
            {primaryAction}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                        3. COMMERCIAL METRIC RIBBON                         */
/* -------------------------------------------------------------------------- */

export interface MetricItem {
  label: string;
  value: string;
  subtext?: string;
  highlight?: boolean;
}

export function CommercialMetricRibbon({ metrics }: { metrics: MetricItem[] }) {
  return (
    <div className="bg-white border border-[#DFE1E6] rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#DFE1E6]">
        {metrics.map((item, idx) => (
          <div key={idx} className={`${idx > 0 ? "pt-3 sm:pt-0 sm:pl-4" : ""}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block mb-1">
              {item.label}
            </span>
            <div
              className={`font-mono text-lg sm:text-xl font-bold truncate ${
                item.highlight ? "text-[#006644]" : "text-[#091E42]"
              }`}
            >
              {item.value}
            </div>
            {item.subtext && (
              <span className="text-[11px] text-[#5E6C84] block mt-0.5 truncate">
                {item.subtext}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         4. CHEMICAL IDENTITY CARD                          */
/* -------------------------------------------------------------------------- */

export interface ChemicalIdentityProps {
  name: string;
  casNumber?: string | null;
  molecularFormula?: string | null;
  purity?: number | string | null;
  grade?: string | null;
  packaging?: string | null;
  category?: string | null;
  productCode?: string | null;
}

export function ChemicalIdentityCard({
  name,
  casNumber,
  molecularFormula,
  purity,
  grade,
  packaging,
  category,
  productCode,
}: ChemicalIdentityProps) {
  return (
    <div className="bg-white border border-[#DFE1E6] rounded-2xl overflow-hidden shadow-xs">
      <div className="px-5 py-4 border-b border-[#DFE1E6] bg-[#FAFBFC] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#DEEBFF] text-[#0052CC] flex items-center justify-center font-bold">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#091E42]">
              Chemical Specification & Monograph
            </h2>
            <span className="text-[11px] text-[#5E6C84]">Technical & Regulatory Identity</span>
          </div>
        </div>
        {productCode && (
          <span className="font-mono text-xs font-bold text-[#5E6C84] bg-white border border-[#DFE1E6] px-2 py-0.5 rounded">
            {productCode}
          </span>
        )}
      </div>

      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block">
            Chemical Compound
          </span>
          <strong className="text-sm font-bold text-[#091E42] block mt-0.5">{name}</strong>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block">
            CAS Registry Number
          </span>
          <span className="font-mono font-bold text-[#091E42] block mt-0.5">
            {casNumber || "—"}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block">
            Molecular Formula
          </span>
          <span className="font-mono font-bold text-[#091E42] block mt-0.5">
            {molecularFormula || "—"}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block">
            Assay / Purity
          </span>
          <span className="font-bold text-[#091E42] block mt-0.5">
            {purity ? `${purity}% min` : "Standard Industrial"}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block">
            Material Grade
          </span>
          <span className="font-bold text-[#091E42] block mt-0.5 uppercase">
            {grade || "Industrial / Tech"}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block">
            Standard Packaging
          </span>
          <span className="font-bold text-[#091E42] block mt-0.5 uppercase truncate">
            {packaging || "Drum / Tote"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                        5. FULFILLMENT WORKFLOW STEPPER                     */
/* -------------------------------------------------------------------------- */

export type OrderWorkflowStep = "PLACED" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED";

export interface WorkflowStepperProps {
  currentStatus: string;
  className?: string;
}

export function WorkflowStepper({ currentStatus, className = "" }: WorkflowStepperProps) {
  const steps: { key: OrderWorkflowStep; label: string; description: string }[] = [
    { key: "PLACED", label: "Placed", description: "Order issued by buyer" },
    { key: "CONFIRMED", label: "Confirmed", description: "Accepted by manufacturer" },
    { key: "PROCESSING", label: "Processing", description: "Batch in preparation" },
    { key: "SHIPPED", label: "Shipped", description: "Consignment dispatched" },
    { key: "DELIVERED", label: "Delivered", description: "Receipt acknowledged" },
  ];

  const statusOrder: Record<string, number> = {
    PLACED: 0,
    CONFIRMED: 1,
    PROCESSING: 2,
    SHIPPED: 3,
    DELIVERED: 4,
  };

  const currentIndex = statusOrder[currentStatus.toUpperCase()] ?? 0;
  const isCancelled = currentStatus.toUpperCase() === "CANCELLED" || currentStatus.toUpperCase() === "REJECTED";

  return (
    <div className={`bg-white border border-[#DFE1E6] rounded-2xl p-5 sm:p-6 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-5 border-b border-[#DFE1E6] pb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#091E42]">
          Order Fulfillment Lifecycle
        </h2>
        <span className="text-[11px] font-mono font-bold text-[#0052CC] bg-[#DEEBFF] px-2 py-0.5 rounded">
          {isCancelled ? currentStatus.toUpperCase() : `STEP ${currentIndex + 1} OF ${steps.length}`}
        </span>
      </div>

      {isCancelled ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>This purchase order has been marked as {currentStatus}. Fulfillment stopped.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isPending = idx > currentIndex;

            return (
              <div
                key={step.key}
                className={`p-3.5 rounded-xl border transition-all relative ${
                  isCurrent
                    ? "bg-[#DEEBFF]/40 border-[#0052CC] ring-1 ring-[#0052CC]/30"
                    : isCompleted
                    ? "bg-[#E3FCEF]/40 border-[#ABF5D1]"
                    : "bg-[#FAFBFC] border-[#DFE1E6] opacity-70"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCompleted
                        ? "bg-[#00875A] text-white"
                        : isCurrent
                        ? "bg-[#0052CC] text-white animate-pulse"
                        : "bg-[#DFE1E6] text-[#5E6C84]"
                    }`}
                  >
                    {isCompleted ? "✓" : idx + 1}
                  </div>
                  <span className="text-xs font-bold text-[#091E42]">{step.label}</span>
                </div>
                <p className="text-[11px] text-[#5E6C84] leading-tight mt-1">{step.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          6. SHIPMENT TRACKING CARD                         */
/* -------------------------------------------------------------------------- */

export interface ShipmentTrackingProps {
  carrier?: string | null;
  trackingNumber?: string | null;
  shippedAt?: string | null;
  estimatedDeliveryDate?: string | null;
  estimatedDelivery?: string | null;
  status: string;
}

export function ShipmentTrackingCard({
  carrier,
  trackingNumber,
  shippedAt,
  estimatedDeliveryDate,
  estimatedDelivery,
  status,
}: ShipmentTrackingProps) {
  const deliveryDateDisplay = estimatedDeliveryDate || estimatedDelivery;

  return (
    <div className="bg-white border border-[#DFE1E6] rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#DFE1E6] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#DEEBFF] text-[#0052CC] flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#091E42]">
              Logistics & Shipment Tracking
            </h2>
            <span className="text-[11px] text-[#5E6C84]">Carrier Dispatch Data</span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 bg-[#E3FCEF] text-[#006644] rounded">
          {status}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block">Carrier</span>
          <strong className="text-sm font-bold text-[#091E42] block mt-0.5">{carrier || "Standard Freight"}</strong>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block">Tracking Number</span>
          <span className="font-mono font-bold text-sm text-[#0052CC] block mt-0.5">{trackingNumber || "—"}</span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block">Dispatch Date</span>
          <span className="font-mono font-bold text-[#091E42] block mt-0.5">
            {shippedAt ? new Date(shippedAt).toLocaleDateString("en-GB") : "Pending"}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block">Est. Delivery</span>
          <span className="font-mono font-bold text-[#091E42] block mt-0.5">
            {deliveryDateDisplay ? new Date(deliveryDateDisplay).toLocaleDateString("en-GB") : "On Schedule"}
          </span>
        </div>
      </div>
    </div>
  );
}
