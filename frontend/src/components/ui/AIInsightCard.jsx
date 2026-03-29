import React from 'react';
import { cn } from '../../lib/utils';

const IMPACT_STYLES = {
    high: {
        border: 'border-l-emerald-500',
        badge: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
        dot: 'bg-emerald-500',
    },
    medium: {
        border: 'border-l-amber-500',
        badge: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
        dot: 'bg-amber-500',
    },
    low: {
        border: 'border-l-rose-500',
        badge: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400',
        dot: 'bg-rose-500',
    },
};

const CATEGORY_STYLES = {
    Prescriptive: 'ai-prescriptive',
    Predictive: 'ai-predictive',
    Diagnostic: 'ai-diagnostic',
    Descriptive: 'ai-descriptive',
};

function getConfidenceColor(score) {
    if (score > 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
}

function getConfidenceTextColor(score) {
    if (score > 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
}

export function AIInsightCard({
    title,
    description,
    confidence,
    impact = 'medium',
    category,
    action,
    value,
    icon,
    onClick,
    className,
}) {
    const impactStyle = IMPACT_STYLES[impact] || IMPACT_STYLES.medium;
    const categoryClass = CATEGORY_STYLES[category] || 'ai-descriptive';
    const confidenceBarColor = getConfidenceColor(confidence);
    const confidenceTextColor = getConfidenceTextColor(confidence);

    return (
        <div
            className={cn(
                'bg-th-surface-raised border border-th-border rounded-xl p-5',
                'border-l-4',
                impactStyle.border,
                'transition-all duration-200',
                onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg',
                className
            )}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(e); } : undefined}
        >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                    {icon && (
                        <div className="shrink-0 size-8 rounded-lg bg-th-surface-overlay flex items-center justify-center">
                            <span className="material-symbols-outlined text-base text-th-secondary">{icon}</span>
                        </div>
                    )}
                    <h3 className="text-sm font-semibold text-th-heading leading-snug truncate">{title}</h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {category && (
                        <span className={categoryClass}>
                            {category}
                        </span>
                    )}
                    <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize',
                        impactStyle.badge
                    )}>
                        <span className={cn('size-1.5 rounded-full', impactStyle.dot)} />
                        {impact}
                    </span>
                </div>
            </div>

            {/* Description */}
            <p className="text-xs text-th-secondary leading-relaxed mb-4">{description}</p>

            {/* Value callout */}
            {value && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-th-surface-overlay border border-th-border">
                    <span className="text-sm font-bold text-th-heading tabular-nums">{value}</span>
                    <span className="text-xs text-th-muted ml-1">estimated recovery</span>
                </div>
            )}

            {/* Confidence bar */}
            {confidence != null && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-th-muted uppercase tracking-wider">AI Confidence</span>
                        <span className={cn('text-xs font-semibold tabular-nums', confidenceTextColor)}>
                            {confidence}%
                        </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-th-surface-overlay overflow-hidden">
                        <div
                            className={cn('h-full rounded-full transition-all duration-500', confidenceBarColor)}
                            style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Action button */}
            {action && (
                <div className="pt-3 border-t border-th-border">
                    <button
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 flex items-center gap-1"
                        onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }}
                    >
                        {action}
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export default AIInsightCard;
