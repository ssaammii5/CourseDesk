"use client";
import type { ReactNode } from "react";
interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => ReactNode;
    className?: string;
    width?: string;
    truncate?: boolean;
}
interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string | number;
    emptyMessage?: string;
    tableLayout?: "auto" | "fixed";
    minWidthClassName?: string;
    onRowClick?: (item: T) => void;
}
export function DataTable<T>({
    columns,
    data,
    keyExtractor,
    emptyMessage = "No records found.",
    tableLayout = "auto",
    minWidthClassName = "min-w-[800px]",
    onRowClick,
}: DataTableProps<T>) {
    if (data.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
                <p className="text-sm text-gray-600">{emptyMessage}</p>
            </div>
        );
    }
    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table
                className={`w-full text-left ${tableLayout === "fixed" ? "table-fixed" : ""
                    } ${minWidthClassName}`}
            >
                <thead>
                    <tr className="border-b border-gray-200 bg-[#f8f9fa]">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                style={col.width ? { width: col.width } : undefined}
                                className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 ${col.className ?? ""
                                    }`}
                            >
                                {col.truncate ? (
                                    <div className="truncate" title={col.header}>
                                        {col.header}
                                    </div>
                                ) : (
                                    col.header
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map((item) => (
                        <tr
                            key={keyExtractor(item)}
                            onClick={onRowClick ? () => onRowClick(item) : undefined}
                            className={`transition-colors hover:bg-gray-50 ${onRowClick ? "cursor-pointer" : ""}`}
                        >
                            {columns.map((col) => {
                                const content = col.render
                                    ? col.render(item)
                                    : ((item as Record<string, unknown>)[col.key] as ReactNode);
                                const rawValue = col.render
                                    ? undefined
                                    : (item as Record<string, unknown>)[col.key];
                                const truncateTitle =
                                    typeof rawValue === "string" ? rawValue : undefined;
                                return (
                                    <td
                                        key={col.key}
                                        style={col.width ? { width: col.width } : undefined}
                                        className={`px-4 py-3.5 text-sm text-gray-800 ${col.truncate ? "" : "break-words"
                                            } ${col.className ?? ""}`}
                                    >
                                        {col.truncate ? (
                                            <div className="truncate" title={truncateTitle}>
                                                {content}
                                            </div>
                                        ) : (
                                            content
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}