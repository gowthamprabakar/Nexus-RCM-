import React from 'react';

export function CollectionsCommand() {
    return (
        <div className="flex h-full font-sans bg-[#f6f8f8] dark:bg-[#101d22] text-slate-900 dark:text-white overflow-hidden custom-scrollbar">
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navigation Bar */}
                <header className="h-16 border-b border-[#283539] flex items-center justify-between px-8 bg-[#101d22]/50 backdrop-blur-sm z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Collections Command & Activity</h2>
                        <div className="flex items-center gap-2 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase">Live Systems</span>
                        </div>
                    </div>
                </header>

                {/* Dashboard Scrollable Section */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* KPI Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Weekly Revenue Forecast */}
                        <div className="bg-white dark:bg-[#16252b] border border-slate-200 dark:border-[#283539] p-6 rounded-xl shadow-sm dark:shadow-none">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Weekly Revenue Forecast</p>
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">On Track</span>
                            </div>
                            <div className="flex items-end gap-3">
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">$840,000</h3>
                                <p className="text-sm font-medium text-slate-500 mb-1.5">/ $1.2M Target</p>
                            </div>
                            <div className="mt-4 h-2 bg-slate-200 dark:bg-[#283539] rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: '70%' }}></div>
                            </div>
                            <p className="mt-3 text-xs text-slate-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px] text-emerald-500">trending_up</span>
                                <span className="text-emerald-500 font-bold">+12%</span> vs last week
                            </p>
                        </div>
                        {/* Expected Daily Payment */}
                        <div className="bg-white dark:bg-[#16252b] border border-slate-200 dark:border-[#283539] p-6 rounded-xl shadow-sm dark:shadow-none">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Expected Daily Payment</p>
                                <span className="material-symbols-outlined text-slate-500">payments</span>
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">$145,000</h3>
                            <p className="mt-3 text-xs text-slate-400">Today's target reached: <span className="text-slate-900 dark:text-white font-bold">82%</span></p>
                            <div className="mt-4 flex gap-1">
                                {[1, 1, 1, 1, 0].map((v, i) => (
                                    <div key={i} className={`h-1 flex-1 rounded-full ${v ? 'bg-primary' : 'bg-slate-200 dark:bg-[#283539]'}`}></div>
                                ))}
                            </div>
                        </div>
                        {/* AI Alert Panel */}
                        <div className="lg:col-span-1 bg-primary/5 border border-primary/20 p-6 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3">
                                <span className="material-symbols-outlined text-primary/40 text-4xl">auto_awesome</span>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-primary text-lg">psychology</span>
                                <p className="text-sm font-bold text-primary tracking-wide uppercase">AI Insight</p>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                Daily payments are <span className="text-primary font-bold">5% below forecast</span> due to a holiday delay in Medicare processing. Weekly variance alert: High volume of 'Pending Documentation' is delaying $45k in projected reconciliation.
                            </p>
                            <button className="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                View Root Cause Analysis <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>

                    {/* Waterfall & Main Chart */}
                    <div className="bg-white dark:bg-[#16252b] border border-slate-200 dark:border-[#283539] rounded-xl overflow-hidden shadow-sm dark:shadow-none">
                        <div className="p-6 border-b border-slate-200 dark:border-[#283539] flex justify-between items-center">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Financial Flow Waterfall</h3>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-[#283539] rounded text-[10px] font-bold text-slate-500 dark:text-slate-300">
                                    <span className="size-2 bg-slate-500 rounded-full"></span> PREDICTED
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded text-[10px] font-bold text-primary">
                                    <span className="size-2 bg-primary rounded-full"></span> ACTUAL POSTED
                                </div>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="flex items-end justify-between gap-4 h-64">
                                {/* Steps */}
                                {[{ label: 'Expected Revenue', val: '$1.8M', h: 100 }, { label: 'Daily Forecast', val: '$1.52M', h: 85 }, { label: 'Payment Posted (EHR)', val: '$1.1M', h: 65 }, { label: 'Bank Reconciled', val: '$840K', h: 45 }].map((s, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center group">
                                        <div className="w-full bg-slate-200/50 dark:bg-slate-700/50 border border-slate-300/50 dark:border-slate-600/50 rounded-t-lg relative" style={{ height: `${s.h}%` }}>
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-400">{s.val}</div>
                                            {i > 0 && <div className="absolute inset-x-0 bottom-0 bg-primary/40 border-t border-primary" style={{ height: i === 1 ? '80%' : i === 2 ? '88%' : '100%' }}></div>}
                                        </div>
                                        <div className="mt-4 text-[10px] font-bold text-slate-500 uppercase text-center">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-12 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-rose-500">warning</span>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">Reconciliation Gap Detected</p>
                                        <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">$260,000 variance between Posted and Reconciled amounts. Priority attention required.</p>
                                    </div>
                                </div>
                                <button className="bg-rose-500 text-white text-[10px] font-bold px-4 py-1.5 rounded uppercase hover:bg-rose-600 transition-colors">Resolve Gaps</button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Activity Tracker & Detailed Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Activity Tracker */}
                        <div className="lg:col-span-2 bg-white dark:bg-[#16252b] border border-slate-200 dark:border-[#283539] rounded-xl overflow-hidden flex flex-col shadow-sm dark:shadow-none">
                            <div className="p-6 border-b border-slate-200 dark:border-[#283539] flex justify-between items-center">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Agent Activity Tracker</h3>
                                <button className="text-[10px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider flex items-center gap-1">
                                    View Full Log <span className="material-symbols-outlined text-xs">open_in_new</span>
                                </button>
                            </div>
                            <div className="flex-1 p-0 overflow-y-auto max-h-[400px]">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-[#101d22]/30 sticky top-0">
                                        <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            <th className="px-6 py-3 border-b border-slate-200 dark:border-[#283539]">Time</th>
                                            <th className="px-6 py-3 border-b border-slate-200 dark:border-[#283539]">Agent / System</th>
                                            <th className="px-6 py-3 border-b border-slate-200 dark:border-[#283539]">Action</th>
                                            <th className="px-6 py-3 border-b border-slate-200 dark:border-[#283539]">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-[#283539]">
                                        <tr className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-xs text-slate-400 font-medium">14:02</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-6 rounded bg-primary/20 flex items-center justify-center text-primary">
                                                        <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">AI Agent #04</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-300">Completed 42 Medicare follow-up calls</td>
                                            <td className="px-6 py-4"><span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-tighter">Success</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Side Stats */}
                        <div className="bg-white dark:bg-[#16252b] border border-slate-200 dark:border-[#283539] rounded-xl p-6 shadow-sm dark:shadow-none">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-slate-400">Payer Recovery Velocity</h3>
                            <div className="space-y-6">
                                {[{ label: 'Medicare', val: 92, color: 'bg-emerald-500' }, { label: 'BCBS', val: 78, color: 'bg-primary' }, { label: 'Aetna', val: 64, color: 'bg-amber-500' }, { label: 'UHC', val: 41, color: 'bg-rose-500' }].map((p, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-300">{p.label}</span>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white">{p.val}%</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-200 dark:bg-[#283539] rounded-full">
                                            <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.val}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
