import React from 'react';
import { cn } from '../../lib/utils';

const COLOR_STYLES = {
    blue: {
        chip: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
        remove: 'hover:bg-blue-200 dark:hover:bg-blue-800/60 text-blue-500 dark:text-blue-400',
        label: 'text-blue-500 dark:text-blue-400',
    },
    emerald: {
        chip: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
        remove: 'hover:bg-emerald-200 dark:hover:bg-emerald-800/60 text-emerald-500 dark:text-emerald-400',
        label: 'text-emerald-500 dark:text-emerald-400',
    },
    amber: {
        chip: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
        remove: 'hover:bg-amber-200 dark:hover:bg-amber-800/60 text-amber-500 dark:text-amber-400',
        label: 'text-amber-500 dark:text-amber-400',
    },
    purple: {
        chip: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
        remove: 'hover:bg-purple-200 dark:hover:bg-purple-800/60 text-purple-500 dark:text-purple-400',
        label: 'text-purple-500 dark:text-purple-400',
    },
    slate: {
        chip: 'bg-slate-100 dark:bg-th-surface-overlay border-slate-200 dark:border-th-border text-th-secondary',
        remove: 'hover:bg-slate-200 dark:hover:bg-th-surface-overlay/80 text-th-muted',
        label: 'text-th-muted',
    },
};

export function FilterChip({ label, value, onRemove, color = 'blue', className }) {
    const styles = COLOR_STYLES[color] || COLOR_STYLES.blue;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
                'transition-all duration-200',
                styles.chip,
                className
            )}
        >
            <span className={cn('font-semibold', styles.label)}>{label}:</span>
            <span>{value}</span>
            <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${label} filter`}
                className={cn(
                    'ml-0.5 -mr-1 size-4 rounded-full flex items-center justify-center',
                    'transition-colors duration-150',
                    styles.remove
                )}
            >
                <span className="material-symbols-outlined text-[12px] leading-none">close</span>
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
                    className="text-xs font-medium text-th-muted hover:text-th-secondary transition-colors duration-150 underline underline-offset-2 ml-1"
                >
                    Clear all
                </button>
            )}
        </div>
    );
}

export default FilterChip;
