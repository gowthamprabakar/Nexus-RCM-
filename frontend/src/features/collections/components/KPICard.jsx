import React from 'react';

export function KPICard({
    title,
    value,
    change,
    trend,
    subtitle,
    icon,
    accentColor,
    onClick
}) {
    const getTrendIcon = () => {
        if (!trend) return null;
        return trend === 'up' ? 'trending_up' : 'trending_down';
    };

    const getTrendColor = () => {
        if (!change) return '';
        // Positive change is good for revenue/collections
        if (title.includes('Balance') || title.includes('Cash')) {
            return change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500';
        }
        // Negative change is good for days outstanding
        return change < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500';
    };

    const borderClass = accentColor ? `border-l-4 ${accentColor}` : '';

    return (
        <div
            className={`bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${borderClass} ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-2">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">{title}</p>
                {icon && (
                    <span className="material-symbols-outlined text-slate-400 text-xl">{icon}</span>
                )}
            </div>
            <div className="flex items-end gap-2 mt-2">
                <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {value}
                </p>
                {change !== undefined && (
                    <span className={`text-sm font-bold mb-1 flex items-center ${getTrendColor()}`}>
                        {getTrendIcon() && (
                            <span className="material-symbols-outlined text-sm mr-0.5">
                                {getTrendIcon()}
                            </span>
                        )}
                        {Math.abs(change)}%
                    </span>
                )}
            </div>
            {subtitle && (
                <p className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</p>
            )}
        </div>
    );
}
