import React from 'react';

export function Scheduler() {
    return (
        <div className="flex h-full font-sans bg-[#f6f6f8] dark:bg-[#101622] text-slate-900 dark:text-slate-100 p-6 flex-col overflow-scroll custom-scrollbar">
            {/* Page Header */}
            <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black leading-tight tracking-tight">Cron Job Scheduler & Monitor</h1>
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">System status: All high-frequency syncs operational (99.98% uptime)</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 h-10 rounded-lg bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-200 text-sm font-bold border border-slate-200 dark:border-slate-700">
                        <span className="material-symbols-outlined text-sm">history</span> View Audit Log
                    </button>
                    <button className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-sm">add</span> Create New Job
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b]/50">
                    <div className="flex items-center justify-between">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Total Active Jobs</p>
                        <span className="material-symbols-outlined text-primary">analytics</span>
                    </div>
                    <p className="text-3xl font-bold leading-tight">124</p>
                    <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                        <span className="material-symbols-outlined text-xs">trending_up</span> +12% vs last month
                    </div>
                </div>
                <div className="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b]/50">
                    <div className="flex items-center justify-between">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Avg. Success Rate</p>
                        <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                    </div>
                    <p className="text-3xl font-bold leading-tight">99.85%</p>
                    <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                        <span className="material-symbols-outlined text-xs">keyboard_arrow_up</span> 0.02% improvement
                    </div>
                </div>
                <div className="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b]/50">
                    <div className="flex items-center justify-between">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Records (24h)</p>
                        <span className="material-symbols-outlined text-amber-500">database</span>
                    </div>
                    <p className="text-3xl font-bold leading-tight">4.2M</p>
                    <div className="flex items-center gap-1 text-rose-500 text-xs font-bold">
                        <span className="material-symbols-outlined text-xs">trending_down</span> -3% traffic dip
                    </div>
                </div>
                <div className="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b]/50">
                    <div className="flex items-center justify-between">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">System Uptime</p>
                        <span className="material-symbols-outlined text-indigo-500">speed</span>
                    </div>
                    <p className="text-3xl font-bold leading-tight">14d 6h</p>
                    <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                        Last restart: Oct 12
                    </div>
                </div>
            </div>

            {/* Throughput Chart */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b]/50 overflow-hidden mb-6">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold">Job Throughput</h3>
                        <p className="text-slate-500 text-sm">Records processed per minute across all active syncs</p>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button className="px-3 py-1 text-xs font-bold rounded-md bg-white dark:bg-slate-700 shadow-sm">24H</button>
                        <button className="px-3 py-1 text-xs font-medium text-slate-500">7D</button>
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-black tracking-tight">4,200,500</span>
                        <span className="text-emerald-500 text-sm font-bold flex items-center">
                            <span className="material-symbols-outlined text-xs">arrow_upward</span> 8.4%
                        </span>
                    </div>
                    <div className="h-48 w-full relative">
                        {/* Simple SVG Chart Representation */}
                        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
                            <defs>
                                <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                    <stop offset="0%" stopColor="#135bec" stopOpacity="0.3"></stop>
                                    <stop offset="100%" stopColor="#135bec" stopOpacity="0"></stop>
                                </linearGradient>
                            </defs>
                            <path d="M0,150 Q50,140 100,160 T200,120 T300,100 T400,140 T500,80 T600,60 T700,90 T800,40 T900,70 T1000,50 V200 H0 Z" fill="url(#chartGradient)"></path>
                            <path d="M0,150 Q50,140 100,160 T200,120 T300,100 T400,140 T500,80 T600,60 T700,90 T800,40 T900,70 T1000,50" fill="none" stroke="#135bec" strokeWidth="3"></path>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Active Cron Jobs Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xl font-bold leading-tight">Active Cron Jobs</h2>
                    <div className="flex gap-2">
                        <select className="text-xs font-bold rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 h-8">
                            <option>All Statuses</option>
                            <option>Healthy</option>
                            <option>Failing</option>
                        </select>
                    </div>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b]/50 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Job Details</th>
                                    <th className="px-6 py-4">Schedule (Cron)</th>
                                    <th className="px-6 py-4">Last Run</th>
                                    <th className="px-6 py-4">Success</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            <span className="text-xs font-bold text-emerald-500 uppercase">Running</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">Daily Medicare Eligibility Sync</span>
                                            <span className="text-xs text-slate-500">Source: CMS-Gateway-V4</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-primary">0 0 * * *</code>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">14m 22s</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-emerald-500">99.8%</span>
                                            <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="bg-emerald-500 h-full w-[99%]"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
                                                <span className="material-symbols-outlined text-sm">play_arrow</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {/* Row 2 - Failing */}
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors bg-rose-50/20 dark:bg-rose-900/5">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-2 w-2 rounded-full bg-rose-500"></span>
                                            <span className="text-xs font-bold text-rose-500 uppercase">Failing</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">Real-time Claims Scrubbing</span>
                                            <span className="text-xs text-rose-500 font-medium">Error: Timeout on API endpoint</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-primary">*/5 * * * *</code>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-slate-400">--</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-rose-500">62.4%</span>
                                            <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="bg-rose-500 h-full w-[62%]"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button className="p-1.5 rounded-md hover:bg-rose-100 dark:hover:bg-rose-800 text-rose-500">
                                                <span className="material-symbols-outlined text-sm">refresh</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
