import React from 'react';
import { cn } from '../../lib/utils';

export function KPICard({ label, value, trend, trendDirection, icon, subtitle, variant = 'default', accentColor, onClick, className }) {
    const isPositive = trendDirection === 'up';
    const trendGood = variant === 'inverse' ? !isPositive : isPositive;

    const ACCENT_CLASSES = {
        blue:   'border-t-[rgb(var(--color-primary))]',
        green:  'border-t-[rgb(var(--color-success))]',
        amber:  'border-t-[rgb(var(--color-warning))]',
        red:    'border-t-[rgb(var(--color-danger))]',
        purple: 'border-t-purple-500 dark:border-t-purple-400',
    };

    return (
        <div
            className={cn(
                'bg-th-surface-raised border border-th-border rounded-md p-4',
                accentColor ? `border-t-2 ${ACCENT_CLASSES[accentColor]}` : '',
                'shadow-card transition-colors duration-150 hover:border-th-border-strong',
                onClick ? 'cursor-pointer' : '',
                className
            )}
            onClick={onClick}
        >
            {/* Label row */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] text-th-muted uppercase tracking-wide">
                    {label}
                </span>
                {icon && (
                    <span className="material-symbols-outlined text-base text-th-muted">{icon}</span>
                )}
            </div>

            {/* Value row */}
            <div className="flex items-baseline gap-2">
                <span className="text-[22px] font-semibold text-th-heading tabular-nums">
                    {value}
                </span>
                {trend && (
                    <span className={cn(
                        'text-[11px] font-semibold flex items-center gap-0.5',
                        trendGood ? 'text-th-success' : 'text-th-danger'
                    )}>
                        <span className="material-symbols-outlined text-[14px]">
                            {isPositive ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                        {trend}
                    </span>
                )}
            </div>

            {/* Subtitle */}
            {subtitle && (
                <p className="text-xs text-th-muted mt-1.5 leading-relaxed">{subtitle}</p>
            )}
        </div>
    );
}

export function KPIRibbon({ children, className }) {
    return (
        <div className={cn(
            'grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-8 py-4 border-b border-th-border bg-th-surface-base',
            className
        )}>
            {children}
        </div>
    );
}
