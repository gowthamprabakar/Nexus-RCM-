import React from 'react';

export function RevenueReconciliation() {
    return (
        <div className="flex-1 flex flex-col p-6 max-w-[1600px] mx-auto w-full gap-6 bg-slate-50 dark:bg-background-dark font-sans h-full overflow-y-auto">
            {/* Breadcrumbs & Heading Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm">
                    <a className="text-slate-500 hover:text-primary transition-colors" href="#">Financial Management</a>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-900 dark:text-white font-medium">Revenue Reconciliation & Cash Posting</span>
                </div>
                <div className="flex flex-wrap justify-between items-end gap-6">
                    <div className="flex flex-col gap-1 max-w-2xl">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Revenue Reconciliation & Cash Posting</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Automated three-way matching between Billed, Adjudicated, and Deposited amounts with AI variance detection.</p>
                    </div>
                    {/* Cash Flow Forecast Mini Chart */}
                    <div className="flex flex-col items-end gap-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[300px]">
                        <div className="flex justify-between w-full items-center mb-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Liquidity Trend (30d)</span>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 rounded">+5.4%</span>
                        </div>
                        <div className="h-12 w-full flex items-end gap-0.5 relative">
                            {/* Simple CSS-based trend line substitute */}
                            <div className="w-full h-full bg-primary/5 rounded relative overflow-hidden">
                                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary/20 to-transparent"></div>
                                <svg className="w-full h-full absolute bottom-0 left-0" preserveAspectRatio="none" viewBox="0 0 100 100">
                                    <path d="M0 80 Q 25 20 50 50 T 100 30" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metric Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="flex justify-between items-start">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Reconciled</p>
                        <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                    </div>
                    <p className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight">$1,248,390</p>
                    <div className="flex items-center gap-1.5">
                        <span className="text-emerald-600 text-xs font-bold">+12.4%</span>
                        <span className="text-slate-400 text-xs">vs last month</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="flex justify-between items-start">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Unposted Cash</p>
                        <span className="material-symbols-outlined text-amber-500">pending_actions</span>
                    </div>
                    <p className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight">$45,210</p>
                    <div className="flex items-center gap-1.5">
                        <span className="text-rose-600 text-xs font-bold">-5.2%</span>
                        <span className="text-slate-400 text-xs">resolution rate</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-rose-500/10">
                    <div className="flex justify-between items-start">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Active Variances</p>
                        <span className="material-symbols-outlined text-rose-500">warning</span>
                    </div>
                    <p className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight">128</p>
                    <div className="flex items-center gap-1.5">
                        <span className="text-rose-600 text-xs font-bold">+8 new</span>
                        <span className="text-slate-400 text-xs">requires manual review</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="flex justify-between items-start">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Net Liquidity</p>
                        <span className="material-symbols-outlined text-primary">payments</span>
                    </div>
                    <p className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight">$890,442</p>
                    <div className="flex items-center gap-1.5">
                        <span className="text-emerald-600 text-xs font-bold">+8.1%</span>
                        <span className="text-slate-400 text-xs">current reserves</span>
                    </div>
                </div>
            </div>

            {/* Ledger Table Section */}
            <div className="flex flex-col flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
                {/* Filter Bar */}
                <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 gap-4">
                    <div className="flex flex-wrap gap-3 items-center">
                        <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                            <span className="material-symbols-outlined text-base">filter_list</span>
                            <span>Filters</span>
                        </button>
                        <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 group">
                            <span>Payer: BlueCross</span>
                            <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-red-500">close</span>
                        </button>
                        <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 group">
                            <span>Status: High Variance</span>
                            <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-red-500">close</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <span className="material-symbols-outlined text-base">download</span>
                            <span>Export CSV</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-primary/20">
                            <span className="material-symbols-outlined text-base">post_add</span>
                            <span>Batch Post Cash</span>
                        </button>
                    </div>
                </div>
                {/* Table Container */}
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 sticky top-0 uppercase text-[11px] font-bold tracking-widest border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-3 w-12 text-center"><input className="rounded border-slate-300 text-primary focus:ring-primary" type="checkbox" /></th>
                                <th className="p-3">Patient / Payer ID</th>
                                <th className="p-3">Service Date</th>
                                <th className="p-3 text-right">Billed Amount</th>
                                <th className="p-3 text-right">ERA/EOB Amount</th>
                                <th className="p-3 text-right">Bank Deposit</th>
                                <th className="p-3 text-right">Variance</th>
                                <th className="p-3 text-center">AI Confidence</th>
                                <th className="p-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {/* Row 1: High Variance */}
                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors bg-rose-50/20 dark:bg-rose-900/10">
                                <td className="p-3 text-center"><input className="rounded border-slate-300 text-primary" type="checkbox" /></td>
                                <td className="p-3">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 dark:text-white">John Doe</span>
                                        <span className="text-xs text-slate-400 font-mono">BCBS-882194</span>
                                    </div>
                                </td>
                                <td className="p-3 text-sm text-slate-600 dark:text-slate-300">Oct 12, 2023</td>
                                <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">$1,450.00</td>
                                <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">$1,200.00</td>
                                <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">$0.00</td>
                                <td className="p-3 text-right font-mono font-bold text-rose-600">-$1,200.00</td>
                                <td className="p-3 text-center">
                                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-[10px] font-bold">24% LOW</span>
                                </td>
                                <td className="p-3">
                                    <div className="flex justify-center gap-1.5">
                                        <button className="px-2.5 py-1 text-xs font-bold bg-primary text-white rounded hover:bg-blue-700 transition-colors">Adjust</button>
                                        <button className="px-2.5 py-1 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-300 dark:hover:bg-slate-600">Ignore</button>
                                    </div>
                                </td>
                            </tr>
                            {/* Row 2: Matched */}
                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="p-3 text-center"><input defaultChecked className="rounded border-slate-300 text-primary" type="checkbox" /></td>
                                <td className="p-3">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 dark:text-white">Sarah Smith</span>
                                        <span className="text-xs text-slate-400 font-mono">AET-009211</span>
                                    </div>
                                </td>
                                <td className="p-3 text-sm text-slate-600 dark:text-slate-300">Oct 11, 2023</td>
                                <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">$850.00</td>
                                <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">$850.00</td>
                                <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">$850.00</td>
                                <td className="p-3 text-right font-mono font-bold text-emerald-600">$0.00</td>
                                <td className="p-3 text-center">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">99% AUTO</span>
                                </td>
                                <td className="p-3">
                                    <div className="flex justify-center">
                                        <span className="material-symbols-outlined text-emerald-500 text-lg">verified</span>
                                    </div>
                                </td>
                            </tr>
                            {/* Row 3: Medium Variance */}
                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors bg-amber-50/10 dark:bg-amber-900/5">
                                <td className="p-3 text-center"><input className="rounded border-slate-300 text-primary" type="checkbox" /></td>
                                <td className="p-3">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 dark:text-white">Robert Johnson</span>
                                        <span className="text-xs text-slate-400 font-mono">UHC-227311</span>
                                    </div>
                                </td>
                                <td className="p-3 text-sm text-slate-600 dark:text-slate-300">Oct 10, 2023</td>
                                <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">$2,210.00</td>
                                <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">$2,100.00</td>
                                <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">$2,100.00</td>
                                <td className="p-3 text-right font-mono font-bold text-amber-600">-$110.00</td>
                                <td className="p-3 text-center">
                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold">78% CONF</span>
                                </td>
                                <td className="p-3">
                                    <div className="flex justify-center gap-1.5">
                                        <button className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors">Match</button>
                                        <button className="px-2.5 py-1 text-xs font-bold bg-primary text-white rounded hover:bg-blue-700 transition-colors">Adjust</button>
                                    </div>
                                </td>
                            </tr>
                            {/* Row 4 */}
                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="p-3 text-center"><input className="rounded border-slate-300 text-primary" type="checkbox" /></td>
                                <td className="p-3">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 dark:text-white">Alice Williams</span>
                                        <span className="text-xs text-slate-400 font-mono">BCBS-111029</span>
                                    </div>
                                </td>
                                <td className="p-3 text-sm text-slate-600 dark:text-slate-300">Oct 10, 2023</td>
                                <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">$445.00</td>
                                <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">$445.00</td>
                                <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">$445.00</td>
                                <td className="p-3 text-right font-mono font-bold text-emerald-600">$0.00</td>
                                <td className="p-3 text-center">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">99% AUTO</span>
                                </td>
                                <td className="p-3">
                                    <div className="flex justify-center">
                                        <span className="material-symbols-outlined text-emerald-500 text-lg">verified</span>
                                    </div>
                                </td>
                            </tr>
                            {/* Row 5 */}
                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="p-3 text-center"><input className="rounded border-slate-300 text-primary" type="checkbox" /></td>
                                <td className="p-3">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 dark:text-white">Michael Brown</span>
                                        <span className="text-xs text-slate-400 font-mono">CIG-992100</span>
                                    </div>
                                </td>
                                <td className="p-3 text-sm text-slate-600 dark:text-slate-300">Oct 09, 2023</td>
                                <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">$3,100.00</td>
                                <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">$2,800.00</td>
                                <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">$2,800.00</td>
                                <td className="p-3 text-right font-mono font-bold text-rose-600">-$300.00</td>
                                <td className="p-3 text-center">
                                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-[10px] font-bold">45% MED</span>
                                </td>
                                <td className="p-3">
                                    <div className="flex justify-center gap-1.5">
                                        <button className="px-2.5 py-1 text-xs font-bold bg-primary text-white rounded hover:bg-blue-700 transition-colors">Adjust</button>
                                        <button className="px-2.5 py-1 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-300 dark:hover:bg-slate-600">Details</button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Close Period Status Footer Bar */}
            <footer className="sticky bottom-0 bg-white dark:bg-card-dark border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] rounded-t-xl gap-4">
                <div className="flex flex-wrap items-center gap-8 flex-1">
                    <div className="flex flex-col gap-1 min-w-[200px]">
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                            <span>OCTOBER 2023 CLOSING</span>
                            <span>84%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full transition-all" style={{ width: '84%' }}></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-800 pl-8">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Period Balance</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">$142,402.00 Unmatched</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Days Remaining</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">4 Business Days</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors">
                        Run Audit Report
                    </button>
                    <button className="px-6 py-2 text-sm font-bold text-white bg-slate-900 dark:bg-primary rounded-lg hover:opacity-90 transition-all shadow-lg">
                        Finalize & Close Period
                    </button>
                </div>
            </footer>
        </div>
    );
}
