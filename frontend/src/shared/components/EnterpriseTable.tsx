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
    <div className={`overflow-x-auto rounded-[8px] border border-[#E4E4E7] bg-white shadow-tactile-card ${className}`}>
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#64748B] font-semibold uppercase tracking-wider text-[10px] font-mono sticky top-0 z-10">
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className={`py-2.5 px-4 font-semibold ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E4E4E7] text-[#0F172A] font-normal">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className="hover:bg-[#FAFAFA] transition-colors"
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
