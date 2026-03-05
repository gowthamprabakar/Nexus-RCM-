import React from 'react';

export function TopCPTCodesChart({ data }) {
    const maxRevenue = Math.max(...data.map(item => item.revenue));

    return (
        <div className="space-y-4">
            {data.map((cpt, index) => {
                const widthPercentage = (cpt.revenue / maxRevenue) * 100;
                const revenueColor = index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-blue-400' :
                        index === 2 ? 'bg-blue-300' : 'bg-slate-400';

                return (
                    <div key={cpt.code} className="group">
                        <div className="flex justify-between items-baseline mb-1">
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                    {cpt.code}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                    {cpt.description}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                    ${(cpt.revenue / 1000).toFixed(0)}k
                                </span>
                            </div>
                        </div>
                        <div className="relative w-full bg-slate-100 dark:bg-slate-800 h-8 rounded-lg overflow-hidden">
                            <div
                                className={`${revenueColor} h-full rounded-lg transition-all duration-500 flex items-center justify-between px-3 group-hover:opacity-90`}
                                style={{ width: `${widthPercentage}%` }}
                            >
                                <span className="text-xs font-bold text-white">
                                    {cpt.volume} claims
                                </span>
                                <span className="text-xs font-bold text-white">
                                    Avg: ${cpt.avgReimbursement.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
