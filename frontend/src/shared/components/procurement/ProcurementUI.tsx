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
    <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-5 sm:p-6 shadow-tactile-card">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left Info */}
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#0052CC] bg-[#EFF6FF] px-2 py-0.5 rounded-[4px] border border-[#BFDBFE]">
              {eyebrow}
            </span>
            <span className="font-mono text-xs font-semibold text-[#64748B]">
              {referenceNumber}
            </span>
            {date && (
              <>
                <span className="text-[#E4E4E7]">•</span>
                <span className="text-xs text-[#64748B] flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                  {date}
                </span>
              </>
            )}
          </div>

          <div className="flex items-baseline gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              {title}
            </h1>
            <StatusBadge status={status} size="md" />
          </div>

          {subtitle && (
            <p className="text-xs text-[#475569] leading-relaxed">
              {subtitle}
            </p>
          )}

          {counterpartName && (
            <div className="pt-0.5 flex items-center gap-2 text-xs text-[#0F172A]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">
                {counterpartLabel}:
              </span>
              <span className="font-semibold">{counterpartName}</span>
              {counterpartVerified && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-[#ECFDF5] text-[#059669] text-[10px] font-semibold rounded-[4px] border border-[rgba(5,150,105,0.2)]">
                  <ShieldCheck className="w-3 h-3" />
                  VERIFIED
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Actions */}
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
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
    <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-3.5 sm:p-4 shadow-tactile-card">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E4E7]">
        {metrics.map((item, idx) => (
          <div key={idx} className={`${idx > 0 ? "pt-2.5 sm:pt-0 sm:pl-3.5" : ""}`}>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block mb-1 font-mono">
              {item.label}
            </span>
            <div
              className={`font-mono text-base sm:text-lg font-bold truncate ${
                item.highlight ? "text-[#059669]" : "text-[#0F172A]"
              }`}
            >
              {item.value}
            </div>
            {item.subtext && (
              <span className="text-[11px] text-[#64748B] block mt-0.5 truncate">
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
    { key: "PLACED", label: "Placed", description: "Issued by buyer" },
    { key: "CONFIRMED", label: "Confirmed", description: "Accepted by supplier" },
    { key: "PROCESSING", label: "Processing", description: "Synthesis in progress" },
    { key: "SHIPPED", label: "Shipped", description: "In transit" },
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
    <div className={`bg-white border border-[#E4E4E7] rounded-[8px] p-4 sm:p-5 shadow-tactile-card ${className}`}>
      <div className="flex items-center justify-between mb-4 border-b border-[#E4E4E7] pb-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] font-mono">
          Order Fulfillment Lifecycle
        </h2>
        <span className="text-[10px] font-mono font-medium text-[#0052CC] bg-[#EFF6FF] px-2 py-0.5 rounded-[4px] border border-[#BFDBFE]">
          {isCancelled ? currentStatus.toUpperCase() : `STEP ${currentIndex + 1} OF ${steps.length}`}
        </span>
      </div>

      {isCancelled ? (
        <div className="p-3 bg-[#FEF2F2] border border-[rgba(220,38,38,0.2)] rounded-[6px] text-[#DC2626] text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#DC2626]" />
          <span>This purchase order has been marked as {currentStatus}. Fulfillment terminated.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 relative">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={step.key}
                className={`p-3 rounded-[6px] border transition-colors relative ${
                  isCurrent
                    ? "bg-[#EFF6FF]/60 border-[#0052CC] shadow-xs"
                    : isCompleted
                    ? "bg-[#ECFDF5]/50 border-[rgba(5,150,105,0.2)]"
                    : "bg-[#FAFAFA] border-[#E4E4E7] opacity-65"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className={`w-5 h-5 rounded-[4px] flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isCompleted
                        ? "bg-[#059669] text-white"
                        : isCurrent
                        ? "bg-[#0052CC] text-white"
                        : "bg-[#E4E4E7] text-[#64748B]"
                    }`}
                  >
                    {isCompleted ? "✓" : idx + 1}
                  </div>
                  <span className="text-xs font-semibold text-[#0F172A]">{step.label}</span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-tight">{step.description}</p>
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
    <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-4 sm:p-5 shadow-tactile-card">
      <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[4px] bg-[#EFF6FF] text-[#0052CC] flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] font-mono">
              Logistics & Shipment Tracking
            </h2>
            <span className="text-[11px] text-[#64748B]">Carrier Dispatch Data</span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium uppercase px-2 py-0.5 bg-[#ECFDF5] text-[#059669] rounded-[4px] border border-[rgba(5,150,105,0.2)]">
          {status}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block font-mono">Carrier</span>
          <strong className="text-xs font-semibold text-[#0F172A] block mt-0.5">{carrier || "Standard Freight"}</strong>
        </div>

        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block font-mono">Tracking Number</span>
          <span className="font-mono text-xs font-semibold text-[#0052CC] block mt-0.5">{trackingNumber || "—"}</span>
        </div>

        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block font-mono">Dispatch Date</span>
          <span className="font-mono text-xs text-[#0F172A] block mt-0.5">
            {shippedAt ? new Date(shippedAt).toLocaleDateString("en-GB") : "Pending"}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block font-mono">Est. Delivery</span>
          <span className="font-mono text-xs text-[#0F172A] block mt-0.5">
            {deliveryDateDisplay ? new Date(deliveryDateDisplay).toLocaleDateString("en-GB") : "On Schedule"}
          </span>
        </div>
      </div>
    </div>
  );
}
