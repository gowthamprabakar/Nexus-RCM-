import React from 'react';

export function BenefitAnalytics() {
    return (
        <div className="flex-1 overflow-y-auto h-full bg-[#f6f6f8] dark:bg-[#101622] p-6 text-slate-900 dark:text-white custom-scrollbar">
            <div className="max-w-[1600px] mx-auto space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            Benefit Analytics & Limits
                        </h1>
                        <p className="text-[#9db9b9] text-sm mt-1">Visualize utilization against plan limits and caps.</p>
                    </div>
                </div>

                {/* Utilization Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-[#111818] border border-[#3b5454] rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <span className="material-symbols-outlined">physical_therapy</span>
                            </div>
                            <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded">High Usage</span>
                        </div>
                        <h3 className="font-bold text-lg mb-1">Physical Therapy</h3>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-3xl font-black">18</span>
                            <span className="text-sm text-[#9db9b9] font-medium mb-1">/ 20 Visits</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-[#283939] h-2 rounded-full overflow-hidden">
                            <div className="bg-rose-500 h-full w-[90%]"></div>
                        </div>
                        <p className="text-xs text-rose-500 mt-2 font-bold">2 Visits Remaining</p>
                    </div>

                    <div className="bg-white dark:bg-[#111818] border border-[#3b5454] rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                <span className="material-symbols-outlined">psychology</span>
                            </div>
                            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Good Standing</span>
                        </div>
                        <h3 className="font-bold text-lg mb-1">Mental Health</h3>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-3xl font-black">4</span>
                            <span className="text-sm text-[#9db9b9] font-medium mb-1">/ Unlimited</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-[#283939] h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[10%]"></div>
                        </div>
                        <p className="text-xs text-[#9db9b9] mt-2">No hard cap.</p>
                    </div>

                    <div className="bg-white dark:bg-[#111818] border border-[#3b5454] rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                                <span className="material-symbols-outlined">home_health</span>
                            </div>
                            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded">Approaching Limit</span>
                        </div>
                        <h3 className="font-bold text-lg mb-1">Home Health</h3>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-3xl font-black">25</span>
                            <span className="text-sm text-[#9db9b9] font-medium mb-1">/ 30 Days</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-[#283939] h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full w-[83%]"></div>
                        </div>
                        <p className="text-xs text-amber-500 mt-2 font-bold">5 Days Remaining</p>
                    </div>
                </div>

                {/* Risk Alert Panel */}
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-6 flex gap-4">
                    <span className="material-symbols-outlined text-rose-500 text-3xl">notification_important</span>
                    <div>
                        <h4 className="font-bold text-rose-500 text-lg">Coverage Risk Alert</h4>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">Patient enters the "Coverage Gap" (Donut Hole) after $520 more in prescription spend. Estimated date: Nov 14th.</p>
                        <button className="mt-3 px-4 py-2 bg-rose-500 text-white font-bold rounded-lg text-xs hover:bg-rose-600">Notify Financial Counselor</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
