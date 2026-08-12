import React from "react";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface EnterpriseTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function EnterpriseTable<T>({
  columns,
  data,
  keyExtractor,
  emptyTitle,
  emptyDescription,
  className = "",
}: EnterpriseTableProps<T>) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px] sticky top-0 z-10">
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className={`py-3 px-4 font-bold ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className="hover:bg-slate-50/90 transition-colors h-14"
            >
              {columns.map((col, idx) => (
                <td key={idx} className={`py-2.5 px-4 align-middle ${col.className || ""}`}>
                  {col.cell
                    ? col.cell(item)
                    : col.accessorKey
                    ? (item[col.accessorKey] as React.ReactNode)
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
