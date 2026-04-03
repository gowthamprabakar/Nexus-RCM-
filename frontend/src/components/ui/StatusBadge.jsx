import React from 'react';
import { cn } from '../../lib/utils';

const STATUS_STYLES = {
    // Claim statuses
    paid:        { bg: 'bg-[rgb(var(--color-success-bg))]', text: 'text-[rgb(var(--color-success))]' },
    won:         { bg: 'bg-[rgb(var(--color-success-bg))]', text: 'text-[rgb(var(--color-success))]' },
    approved:    { bg: 'bg-[rgb(var(--color-success-bg))]', text: 'text-[rgb(var(--color-success))]' },
    submitted:   { bg: 'bg-[rgb(var(--color-info-bg))]',    text: 'text-[rgb(var(--color-info))]' },
    denied:      { bg: 'bg-[rgb(var(--color-danger-bg))]',  text: 'text-[rgb(var(--color-danger))]' },
    rejected:    { bg: 'bg-[rgb(var(--color-danger-bg))]',  text: 'text-[rgb(var(--color-danger))]' },
    failed:      { bg: 'bg-[rgb(var(--color-danger-bg))]',  text: 'text-[rgb(var(--color-danger))]' },
    pending:     { bg: 'bg-[rgb(var(--color-warning-bg))]', text: 'text-[rgb(var(--color-warning))]' },
    in_process:  { bg: 'bg-[rgb(var(--color-warning-bg))]', text: 'text-[rgb(var(--color-warning))]' },
    in_review:   { bg: 'bg-[rgb(var(--color-warning-bg))]', text: 'text-[rgb(var(--color-warning))]' },
    appealed:    { bg: 'bg-[rgb(var(--color-info-bg))]',    text: 'text-[rgb(var(--color-info))]' },
    review:      { bg: 'bg-[rgb(var(--color-info-bg))]',    text: 'text-[rgb(var(--color-info))]' },
    hold:        { bg: 'bg-[rgb(var(--color-warning-bg))]', text: 'text-[rgb(var(--color-warning))]' },
    written_off: { bg: 'bg-th-surface-overlay',              text: 'text-th-secondary' },
    unbilled:    { bg: 'bg-th-surface-overlay',              text: 'text-th-secondary' },
    // Severity
    critical:    { bg: 'bg-[rgb(var(--color-danger-bg))]',  text: 'text-[rgb(var(--color-danger))]' },
    high:        { bg: 'bg-[rgb(var(--color-danger-bg))]',  text: 'text-[rgb(var(--color-danger))]' },
    medium:      { bg: 'bg-[rgb(var(--color-warning-bg))]', text: 'text-[rgb(var(--color-warning))]' },
    low:         { bg: 'bg-[rgb(var(--color-success-bg))]', text: 'text-[rgb(var(--color-success))]' },
    // EVV
    verified:    { bg: 'bg-[rgb(var(--color-success-bg))]', text: 'text-[rgb(var(--color-success))]' },
    exception:   { bg: 'bg-[rgb(var(--color-warning-bg))]', text: 'text-[rgb(var(--color-warning))]' },
};

export function StatusBadge({ status, label, size = 'sm', dot = true, className }) {
    const key = status?.toLowerCase().replace(/[\s-]/g, '_');
    const style = STATUS_STYLES[key] || { bg: 'bg-th-surface-overlay', text: 'text-th-secondary' };
    const displayLabel = label || status?.replace(/_/g, ' ');

    return (
        <span className={cn(
            'inline-flex items-center gap-1 rounded font-semibold uppercase tracking-wide',
            size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
            style.bg, style.text,
            className
        )}>
            {dot && <span className={cn('size-1.5 rounded-full bg-current opacity-70')} />}
            {displayLabel}
        </span>
    );
}
