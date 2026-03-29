import React from 'react';

export function StatusPill({ status, size = 'sm' }) {
 const styles = {
 'Predicted': 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-900/20 dark:text-purple-400',
 'In Review': 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-400',
 'Prevented': 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400',
 'Ignored': 'bg-th-surface-overlay/30 text-th-primary ring-slate-600/20 /20 ',
 'Critical': 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400',
 'Warning': 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-400',
 'Good': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400'
 };

 const defaultStyle = 'bg-th-surface-overlay/30 text-th-primary ring-slate-600/20 /20 ';
 const activeStyle = styles[status] || defaultStyle;

 const sizeClasses = {
 sm: 'px-2 py-1 text-xs',
 md: 'px-2.5 py-1 text-sm'
 };

 return (
 <span className={`inline-flex items-center rounded-full font-medium ring-1 ring-inset ${activeStyle} ${sizeClasses[size]}`}>
 {status}
 </span>
 );
}
