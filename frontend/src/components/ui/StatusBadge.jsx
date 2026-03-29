import React from 'react';
import { cn } from '../../lib/utils';

const STATUS_STYLES = {
    // Claim statuses
    paid: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    submitted: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
    denied: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
    rejected: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
    pending: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    in_review: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    appealed: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
    approved: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    unbilled: { bg: 'bg-slate-50 dark:bg-th-surface-overlay/50', text: 'text-th-muted dark:text-th-secondary', dot: 'bg-slate-400' },
    hold: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
    written_off: { bg: 'bg-slate-50 dark:bg-th-surface-overlay/50', text: 'text-th-muted dark:text-th-muted', dot: 'bg-slate-400' },
    // EVV
    verified: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    exception: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    critical: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
    // Severity
    high: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
    medium: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    low: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
};

export function StatusBadge({ status, label, size = 'sm', className }) {
    const key = status?.toLowerCase().replace(/[\s-]/g, '_');
    const style = STATUS_STYLES[key] || STATUS_STYLES.pending;
    const displayLabel = label || status?.replace(/_/g, ' ');

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full font-medium capitalize",
            size === 'xs' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
            style.bg, style.text,
            className
        )}>
            <span className={cn("size-1.5 rounded-full", style.dot)}></span>
            {displayLabel}
        </span>
    );
}
