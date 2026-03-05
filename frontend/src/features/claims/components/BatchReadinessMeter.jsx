import React from 'react';

export function BatchReadinessMeter({ percentage }) {
    // Determine color based on score
    let color = 'bg-red-500';
    if (percentage > 50) color = 'bg-amber-500';
    if (percentage > 85) color = 'bg-blue-500';
    if (percentage >= 98) color = 'bg-emerald-500';

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Batch Readiness</span>
                <span className={`text-lg font-black ${percentage >= 98 ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                    {percentage}%
                </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} transition-all duration-1000 ease-out relative`}
                    style={{ width: `${percentage}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
            </div>
            {percentage < 98 && (
                <p className="text-[10px] text-slate-400 mt-1 text-right">Target: 98% to submit</p>
            )}
        </div>
    );
}
