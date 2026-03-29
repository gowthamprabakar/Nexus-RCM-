import React, { useState } from 'react';
import { cn } from '../../lib/utils';

const SIZE_VARIANTS = {
    sm: {
        text: 'text-[10px]',
        score: 'text-xs',
        barHeight: 'h-1',
        gap: 'gap-1',
    },
    md: {
        text: 'text-xs',
        score: 'text-sm',
        barHeight: 'h-1.5',
        gap: 'gap-1.5',
    },
    lg: {
        text: 'text-sm',
        score: 'text-base',
        barHeight: 'h-2',
        gap: 'gap-2',
    },
};

function getBarColor(score) {
    if (score > 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
}

function getScoreColor(score) {
    if (score > 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
}

export function ConfidenceBar({
    score,
    label = 'AI Confidence',
    size = 'md',
    showBar = true,
    showLabel = true,
    factors,
    className,
}) {
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const variant = SIZE_VARIANTS[size] || SIZE_VARIANTS.md;
    const clampedScore = Math.min(100, Math.max(0, score ?? 0));
    const barColor = getBarColor(clampedScore);
    const scoreColor = getScoreColor(clampedScore);
    const hasFactor = factors && factors.length > 0;

    return (
        <div
            className={cn('relative inline-block w-full', className)}
            onMouseEnter={() => hasFactor && setTooltipVisible(true)}
            onMouseLeave={() => hasFactor && setTooltipVisible(false)}
        >
            <div className={cn('flex items-center justify-between', variant.gap, 'mb-1')}>
                {showLabel && (
                    <span className={cn('font-medium text-th-muted uppercase tracking-wider', variant.text)}>
                        {label}
                        {hasFactor && (
                            <span className="ml-1 text-th-muted opacity-60 cursor-help">&#9432;</span>
                        )}
                    </span>
                )}
                <span className={cn('font-semibold tabular-nums ml-auto', variant.score, scoreColor)}>
                    {clampedScore}%
                </span>
            </div>

            {showBar && (
                <div className={cn('w-full rounded-full bg-th-surface-overlay overflow-hidden', variant.barHeight)}>
                    <div
                        className={cn('h-full rounded-full transition-all duration-500', barColor)}
                        style={{ width: `${clampedScore}%` }}
                        role="progressbar"
                        aria-valuenow={clampedScore}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={label}
                    />
                </div>
            )}

            {/* Tooltip */}
            {hasFactor && tooltipVisible && (
                <div className="absolute z-50 bottom-full left-0 mb-2 w-56 rounded-lg bg-th-surface-raised border border-th-border shadow-lg p-3 pointer-events-none">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted mb-2">
                        Confidence Factors
                    </p>
                    <ul className="space-y-1">
                        {factors.slice(0, 5).map((factor, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                                <span className="mt-1 size-1.5 rounded-full bg-blue-500 shrink-0" />
                                <span className="text-xs text-th-secondary leading-tight">{factor}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default ConfidenceBar;
