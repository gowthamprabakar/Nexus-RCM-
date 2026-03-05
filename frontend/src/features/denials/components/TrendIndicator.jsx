import React from 'react';

export function TrendIndicator({ direction, value, label, inverse = false, size = 'sm' }) {
    // direction: 'up', 'down', 'flat'
    // inverse: if true, 'up' is bad (red) and 'down' is good (green) - typical for Denial Rate

    let colorClass;
    let icon;

    const isGood = inverse ? direction === 'down' : direction === 'up';
    const isNeutral = direction === 'flat';

    if (isNeutral) {
        colorClass = 'text-slate-500 dark:text-slate-400';
        icon = 'remove';
    } else if (isGood) {
        colorClass = 'text-emerald-600 dark:text-emerald-400';
        icon = direction === 'up' ? 'trending_up' : 'trending_down';
    } else {
        colorClass = 'text-red-600 dark:text-red-400';
        icon = direction === 'up' ? 'trending_up' : 'trending_down';
    }

    const sizeClass = size === 'sm' ? 'text-xs' : 'text-sm';
    const iconSize = size === 'sm' ? 'text-sm' : 'text-base';

    return (
        <div className={`flex items-center gap-1 font-medium ${colorClass} ${sizeClass}`}>
            <span className={`material-symbols-outlined ${iconSize}`}>{icon}</span>
            <span>{value}</span>
            {label && <span className="text-slate-500 dark:text-slate-400 ml-1 font-normal">{label}</span>}
        </div>
    );
}
