import React from "react";
import Link from "next/link";
import { FileQuestion, Plus } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onActionClick?: () => void;
  className?: string;
}

export function EmptyState({
  title = "No listings found",
  description = "No items matched your search criteria or filters. Try adjusting your search query or submit a custom RFQ.",
  actionText = "Submit Custom RFQ",
  actionHref = "/rfq",
  onActionClick,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center my-4 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
        <FileQuestion className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
        {description}
      </p>

      <div className="mt-5 flex items-center justify-center gap-3">
        {actionHref ? (
          <Link
            href={actionHref}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full transition-colors shadow-sm inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{actionText}</span>
          </Link>
        ) : onActionClick ? (
          <button
            type="button"
            onClick={onActionClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full transition-colors shadow-sm inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{actionText}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
