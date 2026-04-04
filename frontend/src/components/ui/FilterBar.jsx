import React from 'react';
import { cn } from '../../lib/utils';

export function FilterBar({ filters, onFilterChange, searchPlaceholder = 'Search...', searchValue, onSearchChange, actions, className }) {
    return (
        <div className={cn("flex items-center gap-3 px-8 py-2.5 bg-th-surface-raised border-b border-th-border", className)}>
            {onSearchChange && (
                <div className="relative flex-1 max-w-xs">
                    <span className="material-symbols-outlined absolute left-3 top-1.5 text-th-muted text-[16px]">search</span>
                    <input
                        type="text"
                        value={searchValue || ''}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full h-8 pl-9 pr-4 text-[13px] rounded-md border border-th-border bg-th-surface-overlay text-th-heading placeholder:text-th-muted focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))] focus:border-[rgb(var(--color-primary))] transition-colors duration-150"
                    />
                </div>
            )}
            {filters && filters.map((filter) => (
                <select
                    key={filter.key}
                    value={filter.value || ''}
                    onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                    className="h-8 px-3 text-[13px] rounded-md border border-th-border bg-th-surface-overlay text-th-secondary focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))] cursor-pointer transition-colors duration-150 hover:border-th-border-strong"
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
