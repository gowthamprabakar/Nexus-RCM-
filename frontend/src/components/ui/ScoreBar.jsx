import React from 'react';
import { cn } from '../../lib/utils';

/**
 * ScoreBar — Horizontal labeled score bar.
 *
 * Used for:
 *  - CRS 6-component breakdown (eligibility, authorization, coding, etc.)
 *  - Raw ML score display
 *  - Any "name + score out of max" pattern
 *
 * Props:
 *  - label           Left-aligned caption.
 *  - score           Current score (number).
 *  - maxScore        Upper bound for the bar fill (default 100).
 *  - colorThreshold  { danger, warning } cutoffs on the 0-100 normalized scale.
 *                    Default { danger: 40, warning: 70 } =>
 *                       <40 = red, 40-70 = amber, >=70 = green.
 *  - sublabel        Optional small helper text beneath.
 *  - className       Extra wrapper classes.
 */
export function ScoreBar({
    label,
    score,
    maxScore = 100,
    colorThreshold = { danger: 40, warning: 70 },
    sublabel,
    className,
}) {
    const safeMax = Math.max(1, Number(maxScore) || 1);
    const safeScore = Number(score) || 0;
    const pct = Math.max(0, Math.min(100, (safeScore / safeMax) * 100));

    const { danger = 40, warning = 70 } = colorThreshold || {};

    let fillClass = 'bg-th-success';
    let scoreClass = 'text-th-success';
    if (pct < danger) {
        fillClass = 'bg-th-danger';
        scoreClass = 'text-th-danger';
    } else if (pct < warning) {
        fillClass = 'bg-th-warning';
        scoreClass = 'text-th-warning';
    }

    // Display the raw score cleanly. Integers stay integers; decimals show one place.
    const displayScore = Number.isInteger(safeScore) ? safeScore : safeScore.toFixed(1);
    const displayMax = Number.isInteger(safeMax) ? safeMax : safeMax.toFixed(1);

    return (
        <div className={cn('w-full', className)}>
            <div className="flex items-center justify-between gap-2 mb-1">
                {label && (
                    <span className="text-xs font-medium text-th-secondary truncate">{label}</span>
                )}
                <span className={cn('text-xs font-semibold tabular-nums ml-auto', scoreClass)}>
                    {displayScore}
                    <span className="text-th-muted font-normal"> / {displayMax}</span>
                </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-th-surface-overlay overflow-hidden">
                <div
                    className={cn('h-full rounded-full transition-all duration-500', fillClass)}
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={safeScore}
                    aria-valuemin={0}
                    aria-valuemax={safeMax}
                    aria-label={label || 'score'}
                />
            </div>

            {sublabel && (
                <p className="mt-1 text-[11px] text-th-muted leading-relaxed">{sublabel}</p>
            )}
        </div>
    );
}

export default ScoreBar;
