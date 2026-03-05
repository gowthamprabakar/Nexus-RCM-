import React from 'react';

export function DailyAnalysisPanel({ date, onClose, data }) {
    if (!date) return null;

    // Mock breakdown data based on the selected date
    // In a real app, this would query based on the date ID
    const breakdown = {
        topPayer: 'BCBS',
        topService: 'Radiology',
        claimVolume: 142,
        avgLag: '3.2 Days'
    };

    return (
        <div className="absolute top-0 right-0 h-full w-80 bg-white dark:bg-[#1c222d] border-l border-slate-200 dark:border-[#3b4354] shadow-2xl transform transition-transform duration-300 ease-in-out z-20 flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-[#3b4354] flex justify-between items-center bg-slate-50 dark:bg-[#111318]">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-[#9da6b9]">Daily Analysis</h3>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{date}</p>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-[#282e39] rounded-full transition-colors">
                    <span className="material-symbols-outlined text-slate-500">close</span>
                </button>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto flex-1">
                {/* Variance Indicator */}
                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-xl">
                    <p className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-1">Forecast Variance</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">-$1,240</span>
                        <span className="text-xs font-bold text-rose-500 mb-1">▼ 3.2%</span>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-[#111318] rounded-lg border border-slate-100 dark:border-[#282e39]">
                        <p className="text-[10px] uppercase font-bold text-slate-500">Volume</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{breakdown.claimVolume}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-[#111318] rounded-lg border border-slate-100 dark:border-[#282e39]">
                        <p className="text-[10px] uppercase font-bold text-slate-500">Avg Lag</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{breakdown.avgLag}</p>
                    </div>
                </div>

                {/* Service Mix */}
                <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-primary">pie_chart</span>
                        Service Mix
                    </h4>
                    <div className="space-y-2">
                        <div className="text-xs">
                            <div className="flex justify-between mb-1">
                                <span>{breakdown.topService}</span>
                                <span className="font-bold">45%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[45%]"></div>
                            </div>
                        </div>
                        <div className="text-xs">
                            <div className="flex justify-between mb-1">
                                <span>Physical Therapy</span>
                                <span className="font-bold">30%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500 w-[30%]"></div>
                            </div>
                        </div>
                        <div className="text-xs">
                            <div className="flex justify-between mb-1">
                                <span>Lab Tests</span>
                                <span className="font-bold">25%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 w-[25%]"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Insight for this day */}
                <div className="p-3 border border-slate-200 dark:border-[#3b4354] rounded-lg bg-white dark:bg-[#1c222d] shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="size-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[14px]">auto_awesome</span>
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">AI Optimization</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Re-allocating 3 billing staff to work on the <strong>{breakdown.topPayer}</strong> queue could reduce variance by 12% tomorrow.
                    </p>
                    <button className="mt-3 w-full py-1.5 bg-slate-100 dark:bg-[#282e39] text-xs font-bold text-slate-700 dark:text-white rounded hover:bg-slate-200 dark:hover:bg-[#3b4354] transition-colors">
                        Assign Task
                    </button>
                </div>
            </div>
        </div>
    );
}
