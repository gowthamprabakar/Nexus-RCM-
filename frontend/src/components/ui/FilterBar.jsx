import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export function FilterBar({ filters, onFilterChange, searchPlaceholder = 'Search...', searchValue, onSearchChange, actions, className }) {
    return (
        <div className={cn("flex items-center gap-3 px-8 py-3 bg-white dark:bg-th-surface-base border-b border-slate-200 dark:border-th-border", className)}>
            {onSearchChange && (
                <div className="relative flex-1 max-w-xs">
                    <span className="material-symbols-outlined absolute left-3 top-2 text-th-secondary text-lg">search</span>
                    <input
                        type="text"
                        value={searchValue || ''}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full h-9 pl-9 pr-4 text-sm rounded-lg border border-slate-200 dark:border-th-border bg-slate-50 dark:bg-th-surface-raised text-slate-900 dark:text-slate-100 placeholder:text-th-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                </div>
            )}
            {filters && filters.map((filter) => (
                <select
                    key={filter.key}
                    value={filter.value || ''}
                    onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                    className="h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-th-border bg-slate-50 dark:bg-th-surface-raised text-slate-700 dark:text-th-heading focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                    <option value="">{filter.label}</option>
                    {filter.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            ))}
            {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>
    );
}
