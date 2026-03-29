import React from 'react';

export function RiskScoreBadge({ score, size = 'md' }) {
 let colorClass, bgClass, ringClass;

 if (score >= 90) {
 colorClass = 'text-red-600 dark:text-red-400';
 bgClass = 'bg-red-50 dark:bg-red-900/20';
 ringClass = 'ring-red-500/30';
 } else if (score >= 70) {
 colorClass = 'text-orange-600 dark:text-orange-400';
 bgClass = 'bg-orange-50 dark:bg-orange-900/20';
 ringClass = 'ring-orange-500/30';
 } else if (score >= 40) {
 colorClass = 'text-yellow-600 dark:text-yellow-400';
 bgClass = 'bg-yellow-50 dark:bg-yellow-900/20';
 ringClass = 'ring-yellow-500/30';
 } else {
 colorClass = 'text-green-600 dark:text-green-400';
 bgClass = 'bg-green-50 dark:bg-green-900/20';
 ringClass = 'ring-green-500/30';
 }

 const sizeClasses = {
 sm: 'px-1.5 py-0.5 text-xs',
 md: 'px-2.5 py-1 text-sm',
 lg: 'px-3 py-1.5 text-base'
 };

 return (
 <span className={`inline-flex items-center rounded-md font-bold ring-1 ring-inset ${bgClass} ${colorClass} ${ringClass} ${sizeClasses[size]}`}>
 {score}
 {score >= 90 && (
 <span className="ml-1.5 relative flex h-2 w-2">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
 </span>
 )}
 </span>
 );
}
