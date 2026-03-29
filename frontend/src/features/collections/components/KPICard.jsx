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
 return change > 0 ? 'text-emerald-500' : 'text-rose-500';
 }
 // Negative change is good for days outstanding
 return change < 0 ? 'text-emerald-500' : 'text-rose-500';
 };

 const borderClass = accentColor ? `border-l-[3px] ${accentColor}` : 'border-l-[3px] border-l-blue-500';

 return (
 <div
 className={`bg-th-surface-raised border border-th-border p-5 rounded-xl shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${borderClass} ${onClick ? 'cursor-pointer' : ''}`}
 onClick={onClick}
 >
 <div className="flex justify-between items-start mb-2">
 <p className="text-th-secondary text-sm font-bold">{title}</p>
 {icon && (
 <span className="material-symbols-outlined text-th-secondary text-xl">{icon}</span>
 )}
 </div>
 <div className="flex items-end gap-2 mt-2">
 <p className="text-2xl font-black tracking-tight text-th-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>
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
 <p className="text-xs text-th-secondary mt-2 font-medium">{subtitle}</p>
 )}
 </div>
 );
}
