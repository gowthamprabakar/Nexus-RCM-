import React from 'react';

export function ValidationStatusBadge({ status, size = 'md' }) {
 const config = {
 'Passed': { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', icon: 'check_circle' },
 'Auto-Fixed': { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800', icon: 'auto_fix_high' },
 'Review Required': { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800', icon: 'assignment_late' },
 'Blocked': { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800', icon: 'block' }
 };

 const style = config[status] || config['Review Required'];
 const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

 return (
 <span className={`inline-flex items-center gap-1.5 rounded-full font-bold border ${style.color} ${sizeClasses}`}>
 <span className="material-symbols-outlined text-[1.2em]">{style.icon}</span>
 {status}
 </span>
 );
}
