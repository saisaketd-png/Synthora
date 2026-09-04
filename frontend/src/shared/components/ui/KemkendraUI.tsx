"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Package,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                1. BUTTONS                                  */
/* -------------------------------------------------------------------------- */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-[6px] transition-all duration-100 select-none border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052CC] focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]";

  const sizeStyles = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-9 px-3.5 text-xs gap-2",
    lg: "h-10 px-4 text-sm gap-2",
  };

  const variantStyles = {
    primary:
      "bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-white border-transparent shadow-xs",
    secondary:
      "bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#0F172A] border-transparent",
    outline:
      "bg-white hover:bg-[#FAFAFA] text-[#0F172A] border-[#E4E4E7] shadow-xs hover:border-[#D4D4D8]",
    ghost:
      "bg-transparent hover:bg-[#F4F4F5] text-[#475569] hover:text-[#0F172A] border-transparent",
    danger:
      "bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white border-transparent shadow-xs",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 2. BADGES                                  */
/* -------------------------------------------------------------------------- */

export interface BadgeProps {
  children: ReactNode;
  variant?: "neutral" | "brand" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  className?: string;
  icon?: ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "sm",
  className = "",
  icon,
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-0.5 text-xs gap-1.5",
  };

  const variantStyles = {
    neutral: "bg-[#F4F4F5] text-[#475569] border-[#E4E4E7]",
    brand: "bg-[#EFF6FF] text-[#0052CC] border-[#BFDBFE]",
    success: "bg-[#ECFDF5] text-[#059669] border-[rgba(5,150,105,0.2)]",
    warning: "bg-[#FFFBEB] text-[#D97706] border-[rgba(217,119,6,0.2)]",
    danger: "bg-[#FEF2F2] text-[#DC2626] border-[rgba(220,38,38,0.2)]",
  };

  return (
    <span
      className={`inline-flex items-center font-medium font-mono uppercase tracking-wider rounded-[4px] border ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/*                           3. STATUS BADGE                                  */
/* -------------------------------------------------------------------------- */

export interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "sm",
  className = "",
}) => {
  const norm = (status || "").toUpperCase();

  let variant: "success" | "warning" | "danger" | "brand" | "neutral" = "neutral";
  let label = norm.replace(/_/g, " ");

  if (
    [
      "APPROVED",
      "ACTIVE",
      "AVAILABLE",
      "VERIFIED",
      "CONFIRMED",
      "DELIVERED",
      "COMPLETED",
      "ACCEPTED",
      "SUCCESS",
    ].includes(norm)
  ) {
    variant = "success";
  } else if (
    [
      "PENDING",
      "PENDING_REVIEW",
      "UNDER_REVIEW",
      "INFORMATION_REQUIRED",
      "QUOTED",
      "COUNTERED",
      "COUNTER_OFFER_RECEIVED",
      "PROCESSING",
      "SHIPPED",
      "CONTACTED",
      "SUBMITTED",
      "PLACED",
    ].includes(norm)
  ) {
    variant = "warning";
  } else if (
    [
      "REJECTED",
      "FLAGGED",
      "SUSPENDED",
      "DEACTIVATED",
      "CANCELLED",
      "FAILED",
      "HIDDEN",
      "OUT_OF_STOCK",
    ].includes(norm)
  ) {
    variant = "danger";
  } else if (["DRAFT", "INACTIVE", "CLOSED"].includes(norm)) {
    variant = "neutral";
  }

  return (
    <Badge variant={variant} size={size} className={className}>
      {label}
    </Badge>
  );
};

/* -------------------------------------------------------------------------- */
/*                             4. PAGE HEADER                                 */
/* -------------------------------------------------------------------------- */

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  actions,
  className = "",
}) => {
  return (
    <div
      className={`border-b border-[#E4E4E7] pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${className}`}
    >
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs text-[#475569] leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                5. CARD                                     */
/* -------------------------------------------------------------------------- */

export const Card: React.FC<{
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
}> = ({ title, subtitle, headerAction, children, className = "" }) => {
  return (
    <div className={`bg-white border border-[#E4E4E7] rounded-[8px] shadow-tactile-card ${className}`}>
      {(title || headerAction) && (
        <div className="px-5 py-3.5 border-b border-[#E4E4E7] flex items-center justify-between bg-[#FAFAFA] rounded-t-[8px]">
          <div>
            {title && (
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] font-mono">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-[#475569] mt-0.5 leading-normal">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                6. MODAL                                    */
/* -------------------------------------------------------------------------- */

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}> = ({ isOpen, onClose, title, description, children, footer, maxWidth = "md" }) => {
  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-[2px] animate-in fade-in duration-100">
      <div
        className={`bg-white rounded-[8px] border border-[#E4E4E7] shadow-tactile-modal w-full ${maxWidthStyles[maxWidth]} overflow-hidden`}
        role="dialog"
      >
        <div className="px-5 py-4 border-b border-[#E4E4E7] flex items-start justify-between gap-4 bg-[#FAFAFA]">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-[#0F172A]">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[#475569]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#64748B] hover:text-[#0F172A] rounded transition-colors focus-visible:ring-2 focus-visible:ring-[#0052CC]"
            aria-label="Close dialog"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 text-xs text-[#0F172A]">{children}</div>

        {footer && (
          <div className="px-5 py-3 bg-[#FAFAFA] border-t border-[#E4E4E7] flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              7. FORM CONTROLS                              */
/* -------------------------------------------------------------------------- */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-[#0F172A]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-[#64748B] pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full h-9 px-3 text-xs text-[#0F172A] bg-white border border-[#E4E4E7] rounded-[6px] placeholder:text-[#94A3B8] transition-colors focus-visible:outline-none focus-visible:border-[#0052CC] focus-visible:ring-1 focus-visible:ring-[#0052CC] disabled:bg-[#F4F4F5] disabled:cursor-not-allowed ${
            leftIcon ? "pl-9" : ""
          } ${error ? "border-[#DC2626] focus-visible:ring-[#DC2626]" : ""} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-[#DC2626]">{error}</p>}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                         8. SKELETON LOADER                                 */
/* -------------------------------------------------------------------------- */

export const SkeletonLoader: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = "" }) => {
  return (
    <div className={`space-y-2 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`bg-[#E4E4E7] rounded-[4px] h-3.5 ${
            i === 0 ? "w-3/4" : i === lines - 1 ? "w-1/2" : "w-full"
          }`}
        />
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                       9. EMPTY & ERROR STATES                              */
/* -------------------------------------------------------------------------- */

export const EmptyState: React.FC<{
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}> = ({ title, description, icon, action, className = "" }) => {
  return (
    <div
      className={`border border-dashed border-[#E4E4E7] rounded-[8px] p-8 text-center flex flex-col items-center justify-center space-y-2 bg-[#FAFAFA] ${className}`}
    >
      {icon && <div className="text-[#64748B] mb-1">{icon}</div>}
      <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider font-mono">
        {title}
      </h3>
      <p className="text-xs text-[#475569] max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};

export const ErrorState: React.FC<{
  title: string;
  description?: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}> = ({ title, description, message, action, className = "" }) => {
  const resolvedDesc = description || message || "An unexpected error occurred.";
  return (
    <div
      className={`border border-[#FEF2F2] rounded-[8px] p-8 text-center flex flex-col items-center justify-center space-y-2 bg-[#FEF2F2]/50 ${className}`}
    >
      <AlertTriangle className="w-5 h-5 text-[#DC2626] mb-1" />
      <h3 className="text-xs font-semibold text-[#DC2626] uppercase tracking-wider font-mono">
        {title}
      </h3>
      <p className="text-xs text-[#7F1D1D] max-w-sm leading-relaxed">
        {resolvedDesc}
      </p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
