import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const data = [
    { name: 'Mon', score: 82 },
    { name: 'Tue', score: 89 },
    { name: 'Wed', score: 85 },
    { name: 'Thu', score: 93 },
    { name: 'Fri', score: 94 },
    { name: 'Sat', score: 91 },
    { name: 'Sun', score: 96 },
];

export function AICodingCompliance() {
    return (
        <div className="flex w-full h-full font-sans">
            {/* Compliance Sidebar */}
            <aside className="w-64 border-r border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark flex flex-col justify-between p-4 shrink-0">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-base font-bold text-slate-900 dark:text-white">Compliance Monitor</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-1">Real-time Watchdog</p>
                    </div>
                    <nav className="flex flex-col gap-1">
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[20px]">dashboard</span>
                            <span className="text-sm font-medium">Overview</span>
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[20px]">warning</span>
                            <span className="text-sm font-bold">Violations (3)</span>
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[20px]">topic</span>
                            <span className="text-sm font-medium">Documentation</span>
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[20px]">assessment</span>
                            <span className="text-sm font-medium">Reports</span>
                        </a>
                    </nav>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-white">System Status</span>
                        <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">HIPAA Guidelines 2024: <span className="font-bold text-green-600">Active</span></p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Stark Law Checks: <span className="font-bold text-green-600">Active</span></p>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-background-dark/50">
                <header className="px-6 py-4 bg-white dark:bg-card-dark border-b border-slate-200 dark:border-border-dark flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 hover:text-primary cursor-pointer text-sm font-medium transition-colors">Compliance</span>
                        <span className="text-slate-300">/</span>
                        <h1 className="text-sm font-bold text-slate-900 dark:text-white">Daily Monitoring Dashboard</h1>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        Export Audit Log
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-12 gap-6 mb-6">
                        {/* Compliance Score Chart */}
                        <div className="col-span-8 bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm p-6 flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Compliance Score Trend</h2>
                                    <p className="text-sm text-slate-500">Trailing 7-day adherence to payer guidelines.</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-green-600">96.4%</div>
                                    <div className="text-xs font-bold text-green-600 flex items-center justify-end gap-1">
                                        <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                                        +2.1% this week
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#64748b' }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#64748b' }}
                                            domain={[60, 100]}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ color: '#16a34a', fontWeight: 'bold' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="score"
                                            stroke="#22c55e"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorScore)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Alerts */}
                        <div className="col-span-4 flex flex-col gap-4">
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900 rounded-xl p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="size-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-red-600 text-[18px]">gavel</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Stark Law Risk</h3>
                                        <p className="text-xs text-red-600/80 mt-1 mb-2">Potential self-referral pattern detected in Cardiology department.</p>
                                        <button className="text-[10px] font-bold text-white bg-red-600 px-3 py-1.5 rounded hover:bg-red-700 transition-colors">Investigate</button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900 rounded-xl p-4 shadow-sm flex-1">
                                <div className="flex items-start gap-3">
                                    <div className="size-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-amber-600 text-[18px]">update</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">Coding Lag Alert</h3>
                                        <p className="text-xs text-amber-600/80 mt-1">Average coding time increased by 14% over last 24hrs.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Violations Table */}
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden mb-6">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-border-dark flex justify-between items-center">
                            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500">warning</span>
                                Flagged Potential Violations
                            </h2>
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">3 Open</span>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Claim ID</th>
                                    <th className="px-6 py-4">Issue Type</th>
                                    <th className="px-6 py-4">Risk Level</th>
                                    <th className="px-6 py-4">Detected</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">CLM-2023-889</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Unbundling (CPT 80053)</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> High
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">2 hrs ago</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-primary font-bold text-xs hover:underline">Review Details</button>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">CLM-2023-892</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">modifier -59 Misuse</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Medium
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">4 hrs ago</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-primary font-bold text-xs hover:underline">Review Details</button>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">CLM-2023-901</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Medical Necessity (LCD)</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Low
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">5 hrs ago</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-primary font-bold text-xs hover:underline">Review Details</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Immutable Ledger Strip */}
                    <div className="bg-slate-900 text-slate-400 rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-[120px]">link</span>
                        </div>
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-purple-400">lock</span>
                                    Immutable Audit Ledger
                                </h3>
                                <p className="text-xs mt-1">Blockchain-verified compliance trail for regulatory bodies.</p>
                            </div>
                            <span className="text-[10px] font-mono bg-slate-800 px-3 py-1 rounded text-purple-300 border border-slate-700">
                                BLOCK #99281-A • HASH: 0x7f...3a2
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 relative z-10">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex flex-col gap-2">
                                    <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                                        Block {i}
                                    </div>
                                    <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 w-full animate-pulse"></div>
                                    </div>
                                    <span className="text-[9px] font-mono">0x...Verified</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
