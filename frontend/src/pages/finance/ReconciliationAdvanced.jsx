import React from 'react';

export function ReconciliationAdvanced() {
    return (
        <div className="flex h-full font-sans bg-[#f6f6f8] dark:bg-[#101622] text-slate-900 dark:text-white">
            {/* Left Filter Sidebar */}
            <aside className="w-72 border-r border-[#e2e8f0] dark:border-[#282e39] bg-white dark:bg-[#101622] hidden xl:flex flex-col p-6 sticky top-0 h-full overflow-y-auto">
                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-lg font-bold">Slice & Dice</h1>
                        <p className="text-slate-500 dark:text-[#9da6b9] text-xs font-medium uppercase tracking-wider mt-1">Multi-Dimensional Analysis</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-slate-400 dark:text-[#9da6b9] text-[11px] font-bold uppercase mb-2">Filters</p>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 cursor-pointer">
                            <span className="material-symbols-outlined !text-[20px]">credit_card</span>
                            <p className="text-sm font-semibold">Payer Type</p>
                            <span className="material-symbols-outlined ml-auto !text-lg">expand_more</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-[#282e39] cursor-pointer transition-colors">
                            <span className="material-symbols-outlined !text-[20px]">map</span>
                            <p className="text-sm font-medium">Region</p>
                            <span className="material-symbols-outlined ml-auto !text-lg text-slate-400">expand_more</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-[#282e39] cursor-pointer transition-colors">
                            <span className="material-symbols-outlined !text-[20px]">medical_services</span>
                            <p className="text-sm font-medium">Provider Group</p>
                            <span className="material-symbols-outlined ml-auto !text-lg text-slate-400">expand_more</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-[#282e39] cursor-pointer transition-colors">
                            <span className="material-symbols-outlined !text-[20px]">calendar_today</span>
                            <p className="text-sm font-medium">Date Range</p>
                            <span className="material-symbols-outlined ml-auto !text-lg text-slate-400 text-primary">forward_30</span>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-[#282e39]">
                        <div className="bg-slate-50 dark:bg-[#1c222d] p-4 rounded-xl space-y-3 border border-slate-100 dark:border-[#282e39]">
                            <p className="text-slate-400 dark:text-[#9da6b9] text-[11px] font-bold uppercase">Quick Stats</p>
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-slate-500 dark:text-slate-400">Active Filters</span>
                                <span className="text-xs font-bold text-primary">3 Applied</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded">Commercial</span>
                                <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded">Northeast</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-auto pt-6">
                    <button className="w-full flex items-center justify-center rounded-lg h-11 px-4 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all">
                        Apply Filters
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 p-6 lg:p-8 space-y-6 bg-slate-50 dark:bg-[#101622]/50 overflow-y-auto custom-scrollbar">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-extrabold leading-tight tracking-tight">Interrelated Financial Reconciliation</h2>
                        <p className="text-slate-500 dark:text-[#9da6b9] mt-1">Analyzing cross-source variances for the last 30 days.</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-lg border border-slate-200 dark:border-[#3b4354] bg-white dark:bg-[#1c222d] text-slate-600 dark:text-white hover:bg-slate-50 dark:hover:bg-[#282e39]">
                            <span className="material-symbols-outlined">refresh</span>
                        </button>
                    </div>
                </div>

                {/* AI Narrative Action Panel */}
                <div className="relative overflow-hidden group rounded-xl">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-xl border border-primary/20 bg-white dark:bg-[#111318] p-6 shadow-sm">
                        <div className="flex items-center gap-5">
                            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined !text-3xl">auto_awesome</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-base font-bold flex items-center gap-2">
                                    AI Narrative Summary
                                    <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter">Real-time</span>
                                </p>
                                <p className="text-slate-600 dark:text-[#9da6b9] text-base font-medium leading-normal">
                                    Current <span className="text-rose-500 font-bold">3% variance</span> is driven by a weekend clearinghouse lag. Expected resolution: <span className="text-primary font-bold">Tuesday, Oct 24th</span>.
                                </p>
                            </div>
                        </div>
                        <a className="text-sm font-bold leading-normal tracking-wide flex items-center gap-2 text-primary hover:text-blue-700 transition-colors shrink-0" href="#">
                            View Details <span className="material-symbols-outlined">arrow_forward</span>
                        </a>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-3 rounded-xl p-6 border border-slate-200 dark:border-[#3b4354] bg-white dark:bg-[#111318] shadow-sm">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 dark:text-[#9da6b9] text-sm font-semibold">Total Forecasted</p>
                            <span className="material-symbols-outlined text-slate-400 !text-xl">trending_up</span>
                        </div>
                        <p className="tracking-tight text-3xl font-extrabold">$4.2M</p>
                        <div className="flex items-center gap-2">
                            <span className="text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                <span className="material-symbols-outlined !text-xs">arrow_upward</span> 2.1%
                            </span>
                            <span className="text-slate-400 text-[11px]">vs last month</span>
                        </div>
                    </div>
                    {/* Add other stat cards similar to above if needed */}
                    <div className="flex flex-col gap-3 rounded-xl p-6 border border-slate-200 dark:border-[#3b4354] bg-white dark:bg-[#111318] shadow-sm">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 dark:text-[#9da6b9] text-sm font-semibold">EHR Posted</p>
                            <span className="material-symbols-outlined text-slate-400 !text-xl">database</span>
                        </div>
                        <p className="tracking-tight text-3xl font-extrabold">$3.9M</p>
                        <div className="flex items-center gap-2">
                            <span className="text-rose-500 text-xs font-bold bg-rose-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                <span className="material-symbols-outlined !text-xs">arrow_downward</span> 3.4%
                            </span>
                            <span className="text-slate-400 text-[11px]">pending clearinghouse</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 rounded-xl p-6 border border-slate-200 dark:border-[#3b4354] bg-white dark:bg-[#111318] shadow-sm">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 dark:text-[#9da6b9] text-sm font-semibold">Bank Credits</p>
                            <span className="material-symbols-outlined text-slate-400 !text-xl">account_balance</span>
                        </div>
                        <p className="tracking-tight text-3xl font-extrabold">$3.8M</p>
                        <div className="flex items-center gap-2">
                            <span className="text-rose-500 text-xs font-bold bg-rose-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                <span className="material-symbols-outlined !text-xs">arrow_downward</span> 1.2%
                            </span>
                            <span className="text-slate-400 text-[11px]">variance gap</span>
                        </div>
                    </div>
                </div>

                {/* Multi-Series Area Chart */}
                <div className="rounded-xl border border-slate-200 dark:border-[#3b4354] bg-white dark:bg-[#111318] shadow-sm p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold">30-Day Trend Analysis</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2"><span className="size-3 rounded-full bg-purple-500"></span><span className="text-xs text-slate-500 dark:text-[#9da6b9] font-medium">Forecasted</span></div>
                            <div className="flex items-center gap-2"><span className="size-3 rounded-full bg-teal-500"></span><span className="text-xs text-slate-500 dark:text-[#9da6b9] font-medium">EHR Posted</span></div>
                            <div className="flex items-center gap-2"><span className="size-3 rounded-full bg-primary"></span><span className="text-xs text-slate-500 dark:text-[#9da6b9] font-medium">Bank Credits</span></div>
                        </div>
                    </div>
                    <div className="h-80 w-full relative">
                        {/* Faux Chart Implementation using SVGs from design */}
                        <div className="absolute inset-0 flex items-end justify-between px-2">
                            <div className="absolute inset-x-0 bottom-0 h-full overflow-hidden opacity-50"><svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300"><path d="M0,250 Q150,150 300,180 T600,100 T1000,50 L1000,300 L0,300 Z" fill="rgba(168, 85, 247, 0.1)" stroke="#a855f7" strokeDasharray="5,5" strokeWidth="2"></path></svg></div>
                            <div className="absolute inset-x-0 bottom-0 h-full overflow-hidden opacity-50"><svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300"><path d="M0,280 Q200,200 400,220 T700,140 T1000,110 L1000,300 L0,300 Z" fill="rgba(20, 184, 166, 0.1)" stroke="#14b8a6" strokeWidth="2.5"></path></svg></div>
                            <div className="absolute inset-x-0 bottom-0 h-full overflow-hidden"><svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300"><path d="M0,290 Q250,220 500,240 T800,160 T1000,150 L1000,300 L0,300 Z" fill="rgba(19, 91, 236, 0.2)" stroke="#135bec" strokeWidth="3"></path></svg></div>
                        </div>
                    </div>
                    <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-slate-400 dark:text-[#9da6b9] uppercase tracking-widest">
                        <span>Oct 01</span><span>Oct 07</span><span>Oct 14</span><span>Oct 21</span><span>Oct 30</span>
                    </div>
                </div>

                {/* Reconciliation Gap Matrix */}
                <div className="rounded-xl border border-slate-200 dark:border-[#3b4354] bg-white dark:bg-[#111318] shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-[#282e39] flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold">Reconciliation Gap Matrix</h3>
                            <p className="text-xs text-slate-500 dark:text-[#9da6b9]">Transactions requiring manual intervention or AI-matching verification.</p>
                        </div>
                        <button className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-[#3b4354] rounded-lg hover:bg-slate-50 dark:hover:bg-[#282e39]">Filter Matrix</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-[#1c222d] text-slate-500 dark:text-[#9da6b9] text-[11px] font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">Transaction ID</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Payer</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Status Gap</th>
                                    <th className="px-6 py-3">Variance Reason</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-[#282e39]">
                                {/* Row 1 */}
                                <tr className="hover:bg-slate-50 dark:hover:bg-[#1c222d] transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium">#TXN-984210</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-[#9da6b9]">Oct 22, 2023</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-[#9da6b9]">Medicare Part B</td>
                                    <td className="px-6 py-4 text-sm font-bold">$14,240.00</td>
                                    <td className="px-6 py-4"><span className="flex items-center gap-1.5 text-rose-500 font-bold text-xs uppercase"><span className="material-symbols-outlined !text-sm">error</span> EHR Only</span></td>
                                    <td className="px-6 py-4 text-sm text-slate-500">Clearinghouse Delay</td>
                                    <td className="px-6 py-4 text-right"><button className="text-primary font-bold text-xs hover:underline">Reconcile</button></td>
                                </tr>
                                {/* Row 2 */}
                                <tr className="hover:bg-slate-50 dark:hover:bg-[#1c222d] transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium">#TXN-984215</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-[#9da6b9]">Oct 21, 2023</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-[#9da6b9]">Aetna PPO</td>
                                    <td className="px-6 py-4 text-sm font-bold">$8,950.00</td>
                                    <td className="px-6 py-4"><span className="flex items-center gap-1.5 text-amber-500 font-bold text-xs uppercase"><span className="material-symbols-outlined !text-sm">pending</span> Bank Only</span></td>
                                    <td className="px-6 py-4 text-sm text-slate-500">Unposted Payment</td>
                                    <td className="px-6 py-4 text-right"><button className="text-primary font-bold text-xs hover:underline">Reconcile</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
