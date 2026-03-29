import React from 'react';

export function Scheduler() {
 return (
 <div className="flex h-full font-sans text-th-heading p-6 flex-col overflow-scroll">
 {/* Status Badge */}
 <div className="flex items-center gap-2 mb-6">
 <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
 <p className="text-th-secondary text-sm font-medium">System status: All high-frequency syncs operational (99.98% uptime)</p>
 </div>

 {/* Stats Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
 <div className="flex flex-col gap-2 rounded-xl p-5 border border-th-border bg-th-surface-raised border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Total Active Jobs</p>
 <span className="material-symbols-outlined text-blue-400">analytics</span>
 </div>
 <p className="text-3xl font-bold leading-tight text-th-heading tabular-nums">124</p>
 <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
 <span className="material-symbols-outlined text-xs">schedule</span> Active
 </div>
 </div>
 <div className="flex flex-col gap-2 rounded-xl p-5 border border-th-border bg-th-surface-raised border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Avg. Success Rate</p>
 <span className="material-symbols-outlined text-emerald-500">check_circle</span>
 </div>
 <p className="text-3xl font-bold leading-tight text-th-heading tabular-nums">99.85%</p>
 <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
 <span className="material-symbols-outlined text-xs">keyboard_arrow_up</span> 0.02% improvement
 </div>
 </div>
 <div className="flex flex-col gap-2 rounded-xl p-5 border border-th-border bg-th-surface-raised border-l-[3px] border-l-amber-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Records (24h)</p>
 <span className="material-symbols-outlined text-amber-500">database</span>
 </div>
 <p className="text-3xl font-bold leading-tight text-th-heading tabular-nums">4.2M</p>
 <div className="flex items-center gap-1 text-rose-500 text-xs font-bold">
 <span className="material-symbols-outlined text-xs">trending_down</span> -3% traffic dip
 </div>
 </div>
 <div className="flex flex-col gap-2 rounded-xl p-5 border border-th-border bg-th-surface-raised border-l-[3px] border-l-purple-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">System Uptime</p>
 <span className="material-symbols-outlined text-indigo-500">speed</span>
 </div>
 <p className="text-3xl font-bold leading-tight text-th-heading tabular-nums">14d 6h</p>
 <div className="flex items-center gap-1 text-th-secondary text-xs font-bold">
 Last restart: Oct 12
 </div>
 </div>
 </div>

 {/* Throughput Chart */}
 <div className="rounded-xl border border-th-border bg-th-surface-raised overflow-hidden mb-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="p-6 border-b border-th-border flex justify-between items-center">
 <div>
 <h3 className="text-lg font-bold text-th-heading">Job Throughput</h3>
 <p className="text-th-secondary text-sm">Records processed per minute across all active syncs</p>
 </div>
 <div className="flex bg-th-surface-overlay rounded-lg p-1">
 <button className="px-3 py-1 text-xs font-bold rounded-md bg-th-surface-overlay text-th-heading shadow-sm">24H</button>
 <button className="px-3 py-1 text-xs font-medium text-th-muted">7D</button>
 </div>
 </div>
 <div className="p-6">
 <div className="flex items-baseline gap-2 mb-4">
 <span className="text-4xl font-black tracking-tight text-th-heading tabular-nums">4,200,500</span>
 <span className="text-emerald-500 text-sm font-bold flex items-center tabular-nums">
 <span className="material-symbols-outlined text-xs">arrow_upward</span> 8.4%
 </span>
 </div>
 <div className="h-48 w-full relative">
 <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
 <defs>
 <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
 <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3"></stop>
 <stop offset="100%" stopColor="#2563eb" stopOpacity="0"></stop>
 </linearGradient>
 </defs>
 <path d="M0,150 Q50,140 100,160 T200,120 T300,100 T400,140 T500,80 T600,60 T700,90 T800,40 T900,70 T1000,50 V200 H0 Z" fill="url(#chartGradient)"></path>
 <path d="M0,150 Q50,140 100,160 T200,120 T300,100 T400,140 T500,80 T600,60 T700,90 T800,40 T900,70 T1000,50" fill="none" stroke="#2563eb" strokeWidth="3"></path>
 </svg>
 </div>
 </div>
 </div>

 {/* Active Cron Jobs Table */}
 <div className="space-y-4">
 <div className="flex items-center justify-between px-1">
 <h2 className="text-xl font-bold leading-tight text-th-heading">Active Cron Jobs</h2>
 <div className="flex gap-2">
 <select className="text-xs font-bold rounded-lg border border-th-border bg-th-surface-base text-th-heading h-8">
 <option>All Statuses</option>
 <option>Healthy</option>
 <option>Failing</option>
 </select>
 </div>
 </div>
 <div className="rounded-xl border border-th-border bg-th-surface-raised overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-th-surface-overlay/50 border-b border-th-border text-[11px] uppercase tracking-widest text-th-muted font-bold">
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4">Job Details</th>
 <th className="px-6 py-4">Schedule (Cron)</th>
 <th className="px-6 py-4">Last Run</th>
 <th className="px-6 py-4">Success</th>
 <th className="px-6 py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800 text-sm">
 {/* Row 1: Batch Submissions */}
 <tr className="hover:bg-th-surface-overlay/30 transition-colors">
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
 <span className="text-sm font-bold text-th-heading">Daily Batch Claim Submissions</span>
 <span className="text-xs text-th-muted">Source: CMS-Gateway-V4</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <code className="px-2 py-1 bg-th-surface-overlay rounded text-xs font-mono text-blue-400">0 0 * * *</code>
 </td>
 <td className="px-6 py-4">
 <span className="text-xs font-medium text-th-secondary">14m 22s</span>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-emerald-500 tabular-nums">99.8%</span>
 <div className="w-12 h-1 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="bg-emerald-500 h-full w-[99%]"></div>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex justify-end gap-1">
 <button className="p-1.5 rounded-md hover:bg-th-surface-overlay text-th-muted">
 <span className="material-symbols-outlined text-sm">play_arrow</span>
 </button>
 </div>
 </td>
 </tr>
 {/* Row 2: ERA Processing */}
 <tr className="hover:bg-th-surface-overlay/30 transition-colors">
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
 <span className="text-sm font-bold text-th-heading">ERA/835 Processing Pipeline</span>
 <span className="text-xs text-th-muted">Source: Clearinghouse-Availity</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <code className="px-2 py-1 bg-th-surface-overlay rounded text-xs font-mono text-blue-400">*/15 * * * *</code>
 </td>
 <td className="px-6 py-4">
 <span className="text-xs font-medium text-th-secondary">2m 45s</span>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-emerald-500 tabular-nums">99.95%</span>
 <div className="w-12 h-1 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="bg-emerald-500 h-full w-[99%]"></div>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex justify-end gap-1">
 <button className="p-1.5 rounded-md hover:bg-th-surface-overlay text-th-muted">
 <span className="material-symbols-outlined text-sm">play_arrow</span>
 </button>
 </div>
 </td>
 </tr>
 {/* Row 3: Report Generation */}
 <tr className="hover:bg-th-surface-overlay/30 transition-colors">
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
 <span className="text-xs font-bold text-emerald-500 uppercase">Scheduled</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-th-heading">Weekly Revenue Report Generation</span>
 <span className="text-xs text-th-muted">Dest: CFO Dashboard + Email</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <code className="px-2 py-1 bg-th-surface-overlay rounded text-xs font-mono text-blue-400">0 6 * * 1</code>
 </td>
 <td className="px-6 py-4">
 <span className="text-xs font-medium text-th-secondary">8m 10s</span>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-emerald-500 tabular-nums">100%</span>
 <div className="w-12 h-1 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="bg-emerald-500 h-full w-full"></div>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex justify-end gap-1">
 <button className="p-1.5 rounded-md hover:bg-th-surface-overlay text-th-muted">
 <span className="material-symbols-outlined text-sm">play_arrow</span>
 </button>
 </div>
 </td>
 </tr>
 {/* Row 4 - Failing */}
 <tr className="hover:bg-th-surface-overlay/30 transition-colors bg-rose-900/5">
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <span className="flex h-2 w-2 rounded-full bg-rose-500"></span>
 <span className="text-xs font-bold text-rose-500 uppercase">Failing</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-th-heading">Real-time Claims Scrubbing</span>
 <span className="text-xs text-rose-500 font-medium">Error: Timeout on API endpoint</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <code className="px-2 py-1 bg-th-surface-overlay rounded text-xs font-mono text-blue-400">*/5 * * * *</code>
 </td>
 <td className="px-6 py-4">
 <span className="text-xs font-medium text-th-secondary">--</span>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-rose-500 tabular-nums">62.4%</span>
 <div className="w-12 h-1 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="bg-rose-500 h-full w-[62%]"></div>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex justify-end gap-1">
 <button className="p-1.5 rounded-md hover:bg-rose-800 text-rose-500">
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
