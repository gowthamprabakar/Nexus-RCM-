import React from 'react';
import { cn } from '../../lib/utils';

export function KPICard({ label, value, trend, trendDirection, icon, subtitle, variant = 'default', className }) {
    const isPositive = trendDirection === 'up';
    const trendColor = variant === 'inverse'
        ? (isPositive ? 'text-red-400' : 'text-emerald-400')
        : (isPositive ? 'text-emerald-400' : 'text-red-400');

    return (
        <div className={cn(
            "bg-white dark:bg-th-surface-raised border border-slate-200 dark:border-th-border rounded-xl p-5 transition-all hover:shadow-sm",
            className
        )}>
            <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-th-secondary dark:text-th-muted">{label}</span>
                {icon && (
                    <div className="size-8 rounded-lg bg-slate-100 dark:bg-th-surface-overlay flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg text-th-muted dark:text-th-secondary">{icon}</span>
                    </div>
                )}
            </div>
            <div className="flex items-end gap-3">
                <span className="text-2xl font-bold text-slate-900 dark:text-th-heading tracking-tight">{value}</span>
                {trend && (
                    <span className={cn("text-xs font-semibold flex items-center gap-0.5 mb-1", trendColor)}>
                        <span className="material-symbols-outlined text-sm">
                            {isPositive ? 'trending_up' : 'trending_down'}
                        </span>
                        {trend}
                    </span>
                )}
            </div>
            {subtitle && <p className="text-xs text-th-secondary dark:text-th-muted mt-1.5">{subtitle}</p>}
        </div>
    );
}

export function KPIRibbon({ children, className }) {
    return (
        <div className={cn("grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-8 py-5", className)}>
            {children}
        </div>
    );
}
