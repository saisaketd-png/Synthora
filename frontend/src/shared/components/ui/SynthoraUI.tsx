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
  variant?: "primary" | "secondary" | "navy" | "outline" | "subtle" | "danger" | "teal";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "sm",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-md transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none border";

  const sizeStyles = {
    xs: "px-2.5 py-1 text-[11px] gap-1",
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-3.5 py-2 text-xs gap-2",
    lg: "px-4 py-2.5 text-sm gap-2",
  };

  const variantStyles = {
    primary:
      "bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-white border-transparent focus-visible:outline-[#0052CC]",
    secondary:
      "bg-[#F4F5F7] hover:bg-[#EBECF0] active:bg-[#DFE1E6] text-[#172B4D] border-[#DFE1E6] focus-visible:outline-[#172B4D]",
    navy:
      "bg-[#091E42] hover:bg-[#0C2959] active:bg-[#051124] text-white border-transparent focus-visible:outline-[#091E42]",
    outline:
      "bg-white hover:bg-[#FAFBFC] active:bg-[#F4F5F7] text-[#172B4D] border-[#DFE1E6] focus-visible:outline-[#0052CC]",
    subtle:
      "bg-transparent hover:bg-[#F4F5F7] active:bg-[#EBECF0] text-[#5E6C84] hover:text-[#172B4D] border-transparent",
    danger:
      "bg-[#DE350B] hover:bg-[#BF2600] active:bg-[#991F00] text-white border-transparent focus-visible:outline-[#DE350B]",
    teal:
      "bg-[#00875A] hover:bg-[#006644] active:bg-[#004D34] text-white border-transparent focus-visible:outline-[#00875A]",
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
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 2. BADGES                                  */
/* -------------------------------------------------------------------------- */

export interface BadgeProps {
  children: ReactNode;
  variant?: "neutral" | "brand" | "navy" | "teal" | "success" | "warning" | "danger";
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
    md: "px-2.5 py-1 text-xs gap-1.5",
  };

  const variantStyles = {
    neutral: "bg-[#F4F5F7] text-[#42526E] border-[#DFE1E6]",
    brand: "bg-[#DEEBFF] text-[#0747A6] border-[#B3D4FF]",
    navy: "bg-[#091E42] text-white border-transparent",
    teal: "bg-[#E3FCEF] text-[#006644] border-[#ABF5D1]",
    success: "bg-[#E3FCEF] text-[#006644] border-[#ABF5D1]",
    warning: "bg-[#FFFAE6] text-[#974F0C] border-[#FFE380]",
    danger: "bg-[#FFEBE6] text-[#BF2600] border-[#FFBDAD]",
  };

  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight rounded border font-mono uppercase ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
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
      className={`border-b border-[#DFE1E6] pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${className}`}
    >
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl font-bold text-[#091E42] tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs text-[#5E6C84] leading-relaxed max-w-3xl">
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
/*                     5. INDUSTRIAL METRICS BAR                              */
/* -------------------------------------------------------------------------- */

export interface MetricData {
  label: string;
  value: string | number;
  subtext?: string;
  href?: string;
  badge?: string;
}

export const MetricsBar: React.FC<{
  metrics: MetricData[];
  className?: string;
}> = ({ metrics, className = "" }) => {
  return (
    <div
      className={`bg-white border border-[#DFE1E6] rounded-md grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${metrics.length} divide-y sm:divide-y-0 sm:divide-x divide-[#DFE1E6] ${className}`}
      style={{ gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))` }}
    >
      {metrics.map((m, idx) => {
        const Body = (
          <div
            className={`p-3.5 transition-colors ${
              m.href ? "hover:bg-[#FAFBFC] cursor-pointer group" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] truncate">
                {m.label}
              </span>
              {m.badge && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-[#FFFAE6] text-[#974F0C] border border-[#FFE380] rounded">
                  {m.badge}
                </span>
              )}
            </div>
            <div className="text-xl font-bold font-mono text-[#091E42] tracking-tight group-hover:text-[#0052CC] transition-colors">
              {m.value}
            </div>
            {m.subtext && (
              <span className="text-[10px] text-[#5E6C84] block mt-0.5 truncate">
                {m.subtext}
              </span>
            )}
          </div>
        );

        return m.href ? (
          <Link key={idx} href={m.href} className="block min-w-0">
            {Body}
          </Link>
        ) : (
          <div key={idx} className="min-w-0">
            {Body}
          </div>
        );
      })}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                       6. OPERATIONAL ACTION PANEL                          */
/* -------------------------------------------------------------------------- */

export interface ActionQueueItem {
  id: string;
  title: string;
  subtitle: string;
  count?: number;
  tag?: string;
  href: string;
  actionText?: string;
}

export const OperationalQueue: React.FC<{
  title: string;
  description?: string;
  items: ActionQueueItem[];
  emptyMessage?: string;
  className?: string;
}> = ({
  title,
  description,
  items,
  emptyMessage = "All operational queues are clear.",
  className = "",
}) => {
  return (
    <div className={`bg-white border border-[#DFE1E6] rounded-md ${className}`}>
      <div className="px-4 py-3 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#091E42]">
            {title}
          </h2>
          {description && (
            <p className="text-[11px] text-[#5E6C84] mt-0.5">{description}</p>
          )}
        </div>
        {items.length > 0 && (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#FFFAE6] text-[#974F0C] border border-[#FFE380] rounded">
            {items.length} Pending
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-6 text-center text-xs text-[#5E6C84]">
          {emptyMessage}
        </div>
      ) : (
        <div className="divide-y divide-[#DFE1E6]">
          {items.map((item) => (
            <div
              key={item.id}
              className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-[#FAFBFC] transition-colors"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#091E42] truncate">
                    {item.title}
                  </span>
                  {item.tag && (
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 bg-[#DEEBFF] text-[#0747A6] rounded">
                      {item.tag}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5E6C84] truncate">
                  {item.subtitle}
                </p>
              </div>

              <Link
                href={item.href}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0052CC] hover:underline shrink-0"
              >
                <span>{item.actionText || "Review"}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                7. DATA TABLE                               */
/* -------------------------------------------------------------------------- */

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => ReactNode);
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No operational records found",
  onRowClick,
  className = "",
}: DataTableProps<T>) {
  return (
    <div
      className={`overflow-x-auto border border-[#DFE1E6] rounded-md bg-white ${className}`}
    >
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-[#FAFBFC] border-b border-[#DFE1E6] text-[#5E6C84] uppercase tracking-wider font-mono text-[10px]">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={`px-3.5 py-2.5 font-bold ${col.className || ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#DFE1E6]">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-xs text-[#5E6C84]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${
                  onRowClick ? "hover:bg-[#F4F5F7] cursor-pointer" : "hover:bg-[#FAFBFC]"
                }`}
              >
                {columns.map((col, idx) => {
                  let content: ReactNode = null;
                  if (typeof col.accessor === "function") {
                    content = col.accessor(row);
                  } else if (col.accessor) {
                    content = (row[col.accessor] as unknown) as ReactNode;
                  }
                  return (
                    <td key={idx} className={`px-3.5 py-2.5 text-[#172B4D] ${col.className || ""}`}>
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               8. CARD CONTAINER                            */
/* -------------------------------------------------------------------------- */

export const Card: React.FC<{
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
}> = ({ title, subtitle, headerAction, children, className = "" }) => {
  return (
    <div className={`bg-white border border-[#DFE1E6] rounded-md ${className}`}>
      {(title || headerAction) && (
        <div className="px-4 py-3 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
          <div>
            {title && (
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#091E42]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-[11px] text-[#5E6C84] mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                         9. SKELETON LOADER                                 */
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
          className={`bg-[#EBECF0] rounded h-3.5 ${
            i === 0 ? "w-3/4" : i === lines - 1 ? "w-1/2" : "w-full"
          }`}
        />
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                       10. EMPTY / ERROR STATES                             */
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
      className={`border border-dashed border-[#DFE1E6] rounded-md p-8 text-center flex flex-col items-center justify-center space-y-2.5 bg-[#FAFBFC] ${className}`}
    >
      {icon && <div className="text-[#5E6C84] mb-1">{icon}</div>}
      <h3 className="text-xs font-bold text-[#091E42] uppercase tracking-wide">
        {title}
      </h3>
      <p className="text-xs text-[#5E6C84] max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = "Service Communication Error",
  message,
  onRetry,
  className = "",
}) => {
  return (
    <div
      className={`p-4 bg-[#FFEBE6] border border-[#FFBDAD] rounded-md text-[#BF2600] space-y-2 ${className}`}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[#DE350B] shrink-0" />
        <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
      </div>
      <p className="text-xs text-[#42526E]">{message}</p>
      {onRetry && (
        <Button size="xs" variant="secondary" onClick={onRetry}>
          Retry Query
        </Button>
      )}
    </div>
  );
};

export const LoadingState: React.FC<{
  label?: string;
  className?: string;
}> = ({ label = "Loading data...", className = "" }) => {
  return (
    <div
      className={`p-8 text-center flex flex-col items-center justify-center space-y-2 ${className}`}
    >
      <div className="w-5 h-5 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-[#5E6C84] font-mono">{label}</span>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                11. MODAL                                   */
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#091E42]/60 backdrop-blur-2xs animate-in fade-in duration-100">
      <div
        className={`bg-white rounded-lg border border-[#DFE1E6] shadow-md w-full ${maxWidthStyles[maxWidth]} overflow-hidden`}
        role="dialog"
      >
        <div className="px-4 py-3 border-b border-[#DFE1E6] flex items-start justify-between gap-4 bg-[#FAFBFC]">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-[#091E42] uppercase tracking-wider">
              {title}
            </h3>
            {description && (
              <p className="text-[11px] text-[#5E6C84]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#5E6C84] hover:text-[#091E42] rounded transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 text-xs text-[#172B4D]">{children}</div>

        {footer && (
          <div className="px-4 py-2.5 bg-[#FAFBFC] border-t border-[#DFE1E6] flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
