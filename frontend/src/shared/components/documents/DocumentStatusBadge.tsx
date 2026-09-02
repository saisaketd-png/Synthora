import React from "react";
import { DocumentExpiryStatus } from "@/features/documents/api/documentApi";

interface DocumentStatusBadgeProps {
  status?: DocumentExpiryStatus;
  isActive?: boolean;
  className?: string;
}

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  status,
  isActive = true,
  className = "",
}) => {
  if (!isActive) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
        Archived / Replaced
      </span>
    );
  }

  switch (status) {
    case "VALID":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Valid & Active
        </span>
      );
    case "EXPIRING_SOON":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Expiring Soon (&le;30d)
        </span>
      );
    case "EXPIRED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Expired
        </span>
      );
    case "NO_EXPIRY":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Perpetual / Active
        </span>
      );
  }
};
