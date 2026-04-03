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
   return trend === 'up' ? 'arrow_upward' : 'arrow_downward';
 };

 const getTrendColor = () => {
   if (!change) return '';
   // Positive change is good for revenue/collections
   if (title.includes('Balance') || title.includes('Cash')) {
     return change > 0 ? 'text-th-success' : 'text-th-danger';
   }
   // Negative change is good for days outstanding
   return change < 0 ? 'text-th-success' : 'text-th-danger';
 };

 const ACCENT_CLASSES = {
   blue:   'border-t-[rgb(var(--color-primary))]',
   green:  'border-t-[rgb(var(--color-success))]',
   amber:  'border-t-[rgb(var(--color-warning))]',
   red:    'border-t-[rgb(var(--color-danger))]',
   purple: 'border-t-purple-500 dark:border-t-purple-400',
 };

 const accentKey = accentColor?.replace(/^border-l-/, '').replace(/-\d+$/, '');
 const hasAccent = accentColor && ACCENT_CLASSES[accentKey];

 return (
   <div
     className={`bg-th-surface-raised border border-th-border rounded-md p-4 shadow-card transition-colors duration-150 hover:border-th-border-strong ${hasAccent ? `border-t-2 ${ACCENT_CLASSES[accentKey]}` : ''} ${onClick ? 'cursor-pointer' : ''}`}
     onClick={onClick}
   >
     <div className="flex justify-between items-center mb-3">
       <span className="text-[12px] text-th-muted uppercase tracking-wide">{title}</span>
       {icon && (
         <span className="material-symbols-outlined text-base text-th-muted">{icon}</span>
       )}
     </div>
     <div className="flex items-baseline gap-2">
       <span className="text-[22px] font-semibold text-th-heading tabular-nums">
         {value}
       </span>
       {change !== undefined && (
         <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${getTrendColor()}`}>
           {getTrendIcon() && (
             <span className="material-symbols-outlined text-[14px]">
               {getTrendIcon()}
             </span>
           )}
           {Math.abs(change)}%
         </span>
       )}
     </div>
     {subtitle && (
       <p className="text-xs text-th-muted mt-1.5 leading-relaxed">{subtitle}</p>
     )}
   </div>
 );
}
