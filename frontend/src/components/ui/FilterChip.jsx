import React from 'react';
import { cn } from '../../lib/utils';

const COLOR_STYLES = {
    blue: {
        chip: 'bg-[rgb(var(--color-info-bg))] border-[rgb(var(--color-primary)/0.3)] text-[rgb(var(--color-info))]',
        remove: 'hover:bg-[rgb(var(--color-primary)/0.15)] text-[rgb(var(--color-primary))]',
        label: 'text-[rgb(var(--color-primary))]',
    },
    emerald: {
        chip: 'bg-[rgb(var(--color-success-bg))] border-[rgb(var(--color-success)/0.3)] text-[rgb(var(--color-success))]',
        remove: 'hover:bg-[rgb(var(--color-success)/0.15)] text-[rgb(var(--color-success))]',
        label: 'text-[rgb(var(--color-success))]',
    },
    amber: {
        chip: 'bg-[rgb(var(--color-warning-bg))] border-[rgb(var(--color-warning)/0.3)] text-[rgb(var(--color-warning))]',
        remove: 'hover:bg-[rgb(var(--color-warning)/0.15)] text-[rgb(var(--color-warning))]',
        label: 'text-[rgb(var(--color-warning))]',
    },
    red: {
        chip: 'bg-[rgb(var(--color-danger-bg))] border-[rgb(var(--color-danger)/0.3)] text-[rgb(var(--color-danger))]',
        remove: 'hover:bg-[rgb(var(--color-danger)/0.15)] text-[rgb(var(--color-danger))]',
        label: 'text-[rgb(var(--color-danger))]',
    },
    purple: {
        chip: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400',
        remove: 'hover:bg-purple-100 dark:hover:bg-purple-800/40 text-purple-500 dark:text-purple-400',
        label: 'text-purple-600 dark:text-purple-400',
    },
    slate: {
        chip: 'bg-th-surface-overlay border-th-border text-th-secondary',
        remove: 'hover:bg-th-surface-highlight text-th-muted',
        label: 'text-th-muted',
    },
};

export function FilterChip({ label, value, onRemove, color = 'blue', className }) {
    const styles = COLOR_STYLES[color] || COLOR_STYLES.blue;

    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-[12px] font-medium',
            'transition-colors duration-150',
            styles.chip,
            className
        )}>
            <span className={cn('font-semibold', styles.label)}>{label}:</span>
            <span>{value}</span>
            <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${label} filter`}
                className={cn(
                    'ml-0.5 -mr-1 size-3.5 rounded flex items-center justify-center',
                    'transition-colors duration-150',
                    styles.remove
                )}
            >
                <span className="material-symbols-outlined text-[11px] leading-none">close</span>
            </button>
        </span>
    );
}

export function FilterChipGroup({ filters = [], onRemove, onClearAll, className }) {
    if (!filters || filters.length === 0) return null;

    return (
        <div className={cn('flex flex-wrap items-center gap-2', className)}>
            {filters.map((filter) => (
                <FilterChip
                    key={filter.key}
                    label={filter.label}
                    value={filter.value}
                    color={filter.color || 'blue'}
                    onRemove={() => onRemove && onRemove(filter.key)}
                />
            ))}
            {onClearAll && (
                <button
                    type="button"
                    onClick={onClearAll}
                    className="text-[12px] font-medium text-th-muted hover:text-th-secondary transition-colors duration-150 underline underline-offset-2 ml-1"
                >
                    Clear all
                </button>
            )}
        </div>
    );
}

export default FilterChip;
