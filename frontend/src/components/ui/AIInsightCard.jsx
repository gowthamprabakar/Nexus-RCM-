import React from 'react';
import { cn } from '../../lib/utils';

const IMPACT_STYLES = {
    high: {
        border: 'border-l-[rgb(var(--color-success))]',
        badge: 'bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))]',
        dot: 'bg-[rgb(var(--color-success))]',
    },
    medium: {
        border: 'border-l-[rgb(var(--color-warning))]',
        badge: 'bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))]',
        dot: 'bg-[rgb(var(--color-warning))]',
    },
    low: {
        border: 'border-l-[rgb(var(--color-danger))]',
        badge: 'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))]',
        dot: 'bg-[rgb(var(--color-danger))]',
    },
};

const CATEGORY_STYLES = {
    Prescriptive: 'ai-prescriptive',
    Predictive:   'ai-predictive',
    Diagnostic:   'ai-diagnostic',
    Descriptive:  'ai-descriptive',
};

function getBarColor(score) {
    if (score > 80) return 'bg-[rgb(var(--color-success))]';
    if (score >= 60) return 'bg-[rgb(var(--color-warning))]';
    return 'bg-[rgb(var(--color-danger))]';
}

function getScoreColor(score) {
    if (score > 80) return 'text-[rgb(var(--color-success))]';
    if (score >= 60) return 'text-[rgb(var(--color-warning))]';
    return 'text-[rgb(var(--color-danger))]';
}

export function AIInsightCard({
    title, description, confidence, impact = 'medium', category,
    action, value, icon, onClick, className,
}) {
    const impactStyle = IMPACT_STYLES[impact] || IMPACT_STYLES.medium;
    const categoryClass = CATEGORY_STYLES[category] || 'ai-descriptive';
    const barColor = getBarColor(confidence);
    const scoreColor = getScoreColor(confidence);

    return (
        <div
            className={cn(
                'bg-th-surface-raised border border-th-border rounded-lg p-4',
                'border-l-4', impactStyle.border,
                'transition-colors duration-150',
                onClick && 'cursor-pointer hover:border-th-border-strong',
                className
            )}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(e); } : undefined}
        >
            <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                    {icon && (
                        <div className="shrink-0 size-7 rounded-md bg-th-surface-overlay flex items-center justify-center">
                            <span className="material-symbols-outlined text-[15px] text-th-secondary">{icon}</span>
                        </div>
                    )}
                    <h3 className="text-[13px] font-semibold text-th-heading leading-snug truncate">{title}</h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {category && <span className={categoryClass}>{category}</span>}
                    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize', impactStyle.badge)}>
                        <span className={cn('size-1.5 rounded-full', impactStyle.dot)} />
                        {impact}
                    </span>
                </div>
            </div>
            <p className="text-[12px] text-th-secondary leading-relaxed mb-3">{description}</p>
            {value && (
                <div className="mb-3 px-3 py-2 rounded-md bg-th-surface-overlay border border-th-border">
                    <span className="text-[13px] font-semibold text-th-heading tabular-nums">{value}</span>
                    <span className="text-[11px] text-th-muted ml-1">estimated recovery</span>
                </div>
            )}
            {confidence != null && (
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-th-muted uppercase tracking-wide">AI Confidence</span>
                        <span className={cn('text-[11px] font-semibold tabular-nums', scoreColor)}>{confidence}%</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-th-surface-overlay overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all duration-500', barColor)}
                            style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }} />
                    </div>
                </div>
            )}
            {action && (
                <div className="pt-2.5 border-t border-th-border">
                    <button className="text-[12px] font-semibold text-[rgb(var(--color-primary))] hover:opacity-80 transition-opacity flex items-center gap-1"
                        onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }}>
                        {action}
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export default AIInsightCard;
