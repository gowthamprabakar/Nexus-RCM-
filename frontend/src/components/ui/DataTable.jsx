import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export function DataTable({ columns, data, onRowClick, emptyMessage = 'No data available', pageSize = 25, className }) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);

    const handleSort = (key) => {
        if (!key) return;
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedData = React.useMemo(() => {
        if (!sortConfig.key) return data;
        return [...data].sort((a, b) => {
            const aVal = sortConfig.key.split('.').reduce((obj, k) => obj?.[k], a);
            const bVal = sortConfig.key.split('.').reduce((obj, k) => obj?.[k], b);
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className={cn("bg-white dark:bg-th-surface-raised border border-slate-200 dark:border-th-border rounded-xl overflow-hidden", className)}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-th-border">
                            {columns.map((col) => (
                                <th
                                    key={col.key || col.label}
                                    onClick={() => col.sortable !== false && handleSort(col.key)}
                                    className={cn(
                                        "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-th-secondary dark:text-th-muted",
                                        col.sortable !== false && "cursor-pointer hover:text-slate-600 dark:hover:text-th-heading select-none",
                                        col.align === 'right' && "text-right"
                                    )}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.label}
                                        {sortConfig.key === col.key && (
                                            <span className="material-symbols-outlined text-xs text-primary">
                                                {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {paginatedData.length > 0 ? paginatedData.map((row, i) => (
                            <tr
                                key={row.id || i}
                                onClick={() => onRowClick?.(row)}
                                className={cn(
                                    "transition-colors",
                                    onRowClick && "cursor-pointer hover:bg-slate-50 dark:hover:bg-th-surface-overlay/30"
                                )}
                            >
                                {columns.map((col) => (
                                    <td key={col.key || col.label} className={cn("px-5 py-3.5 text-slate-700 dark:text-th-heading", col.align === 'right' && "text-right")}>
                                        {col.render ? col.render(row) : col.key?.split('.').reduce((obj, k) => obj?.[k], row)}
                                    </td>
                                ))}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={columns.length} className="px-5 py-12 text-center text-th-secondary dark:text-th-muted">
                                    <span className="material-symbols-outlined text-3xl mb-2 block">inbox</span>
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-th-border">
                    <span className="text-xs text-th-secondary dark:text-th-muted">
                        Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-2.5 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-th-surface-overlay text-th-muted dark:text-th-heading disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-th-surface-overlay transition-colors"
                        >
                            Previous
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let page;
                            if (totalPages <= 5) page = i + 1;
                            else if (currentPage <= 3) page = i + 1;
                            else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                            else page = currentPage - 2 + i;
                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "size-8 text-xs rounded-md transition-colors",
                                        page === currentPage
                                            ? "bg-primary text-th-heading font-semibold"
                                            : "text-th-muted dark:text-th-secondary hover:bg-slate-100 dark:hover:bg-th-surface-overlay"
                                    )}
                                >
                                    {page}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-2.5 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-th-surface-overlay text-th-muted dark:text-th-heading disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-th-surface-overlay transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
