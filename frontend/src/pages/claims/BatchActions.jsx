import React from 'react';

export function BatchActions() {
    return (
        <div className="flex h-full font-sans bg-[#f6f8f8] dark:bg-[#102222] text-slate-900 dark:text-white overflow-hidden p-6 custom-scrollbar">
            <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            Batch Actions Management
                        </h1>
                        <p className="text-[#9db9b9] text-sm mt-1">Monitor and control large-scale claim operations.</p>
                    </div>
                </div>

                {/* Active Job Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Job 1: Re-Scrub */}
                    <div className="bg-white dark:bg-[#111818] border border-[#3b5454] rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 text-primary rounded-lg border border-primary/20">
                                    <span className="material-symbols-outlined">cleaning_services</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Batch Re-Scrub: Medicare Block A</h3>
                                    <p className="text-xs text-[#9db9b9]">Started by: alex.rivera • 12 mins ago</p>
                                </div>
                            </div>
                            <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/20 animate-pulse">Running</span>
                        </div>
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                                <span>Progress</span>
                                <span>45% (4,210 / 9,350)</span>
                            </div>
                            <div className="h-4 bg-slate-200 dark:bg-[#283939] rounded-full overflow-hidden">
                                <div className="h-full bg-primary relative animate-[shimmer_2s_infinite_linear]" style={{ width: '45%' }}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transfrom -skew-x-12"></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex-1 py-2 rounded-lg border border-[#3b5454] text-slate-500 hover:text-white hover:bg-[#283939] text-sm font-bold transition-colors">Pause</button>
                            <button className="flex-1 py-2 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-sm font-bold transition-colors">Cancel</button>
                        </div>
                    </div>

                    {/* Job 2: Submission */}
                    <div className="bg-white dark:bg-[#111818] border border-[#3b5454] rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
                                    <span className="material-symbols-outlined">upload</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Payer Submission: BlueCross</h3>
                                    <p className="text-xs text-[#9db9b9]">Scheduled: Today at 2:00 PM</p>
                                </div>
                            </div>
                            <span className="px-2 py-1 rounded bg-slate-500/10 text-slate-500 text-xs font-bold border border-slate-500/20">Queued</span>
                        </div>
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                                <span>Est. Duration</span>
                                <span>~15 mins</span>
                            </div>
                            <div className="h-4 bg-slate-200 dark:bg-[#283939] rounded-full overflow-hidden relative">
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-500 tracking-widest uppercase">Waiting for start</div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex-1 py-2 rounded-lg bg-primary text-[#102222] text-sm font-bold hover:brightness-110 transition-colors">Run Now</button>
                            <button className="flex-1 py-2 rounded-lg border border-[#3b5454] text-slate-500 hover:text-white hover:bg-[#283939] text-sm font-bold transition-colors">Edit Schedule</button>
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <div className="bg-white dark:bg-[#111818] border border-[#3b5454] rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="p-6 border-b border-[#3b5454]">
                        <h3 className="text-lg font-bold">Recent Batch History</h3>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-[#1a2525] border-b border-[#3b5454]">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9db9b9]">Batch ID</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9db9b9]">Job Type</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9db9b9]">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9db9b9]">Volume</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9db9b9]">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9db9b9]">Success Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3b5454]/50">
                                <tr>
                                    <td className="px-6 py-4 font-mono text-xs font-bold">#JOB-2291</td>
                                    <td className="px-6 py-4 text-sm font-bold">Weekly Eligibility Check</td>
                                    <td className="px-6 py-4 text-sm text-[#9db9b9]">Oct 24, 09:15 AM</td>
                                    <td className="px-6 py-4 text-sm font-mono">12,500</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">Completed</span></td>
                                    <td className="px-6 py-4 text-sm font-bold text-emerald-500">99.8%</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 font-mono text-xs font-bold">#JOB-2290</td>
                                    <td className="px-6 py-4 text-sm font-bold">Submission: Aetna</td>
                                    <td className="px-6 py-4 text-sm text-[#9db9b9]">Oct 24, 08:30 AM</td>
                                    <td className="px-6 py-4 text-sm font-mono">450</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-rose-500/10 text-rose-500 text-xs font-bold border border-rose-500/20">Failed</span></td>
                                    <td className="px-6 py-4 text-sm font-bold text-rose-500">0% (API Error)</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 font-mono text-xs font-bold">#JOB-2289</td>
                                    <td className="px-6 py-4 text-sm font-bold">Nightly AI Scrub</td>
                                    <td className="px-6 py-4 text-sm text-[#9db9b9]">Oct 24, 02:00 AM</td>
                                    <td className="px-6 py-4 text-sm font-mono">8,200</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">Completed</span></td>
                                    <td className="px-6 py-4 text-sm font-bold text-emerald-500">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
