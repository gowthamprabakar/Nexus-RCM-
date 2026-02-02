import React from 'react';

export function ClaimsOverview() {
    return (
        <div className="flex h-full font-sans bg-[#f6f8f8] dark:bg-[#102222] text-slate-900 dark:text-white overflow-hidden p-6 custom-scrollbar">
            <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            Claims Pipeline Overview
                            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded uppercase tracking-wider border border-primary/20">Executive View</span>
                        </h1>
                        <p className="text-[#9db9b9] text-sm mt-1">End-to-end visualization of claim lifecycle and throughput velocity.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 h-10 rounded-lg bg-[#283939]/50 border border-[#3b5454] text-white text-sm font-bold hover:bg-[#283939] transition-colors">
                            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                            <span>This Month</span>
                        </button>
                        <button className="flex items-center gap-2 px-6 h-10 rounded-lg bg-primary text-[#102222] text-sm font-bold hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(19,236,236,0.2)]">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            <span>Export Report</span>
                        </button>
                    </div>
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { title: 'Total Throughput', val: '$14.2M', sub: 'Claims Processed', color: 'bg-primary' },
                        { title: 'Clean Claim Rate', val: '94.8%', sub: '+2.4% vs Baseline', color: 'bg-emerald-500' },
                        { title: 'Avg. Days in AR', val: '24.2', sub: '-3.1 Days Improvement', color: 'bg-indigo-500' },
                        { title: 'Denial Rate', val: '4.1%', sub: 'Within Target (<5%)', color: 'bg-rose-500' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-[#111818] border border-[#3b5454] p-5 rounded-xl shadow-sm relative overflow-hidden group hover:border-primary/50 transition-colors">
                            <div className={`absolute top-0 left-0 w-1 h-full ${stat.color}`}></div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[#9db9b9] mb-1">{stat.title}</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stat.val}</h3>
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{stat.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Main Funnel Chart Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
                    <div className="lg:col-span-2 bg-white dark:bg-[#111818] border border-[#3b5454] rounded-xl p-6 flex flex-col shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-lg font-bold">Claims Conversion Funnel</h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-[#9db9b9]">
                                    <span className="size-2 rounded-full bg-slate-600"></span> Received
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-[#9db9b9]">
                                    <span className="size-2 rounded-full bg-emerald-500"></span> Paid
                                </div>
                            </div>
                        </div>
                        {/* Funnel Visual */}
                        <div className="flex-1 flex flex-col justify-center relative px-10">
                            {[
                                { label: 'Intake / Received', val: '12,482 Claims', width: '100%', color: 'from-slate-700 to-slate-800' },
                                { label: 'Scrubbed Clean', val: '11,850 (95%)', width: '90%', color: 'from-blue-600 to-blue-700' },
                                { label: 'Submitted to Payer', val: '11,800 (99%)', width: '80%', color: 'from-indigo-600 to-indigo-700' },
                                { label: 'Accepted (EDI 277)', val: '11,200 (94%)', width: '70%', color: 'from-violet-600 to-violet-700' },
                                { label: 'Paid (Zero Denial)', val: '10,840 (96%)', width: '60%', color: 'from-emerald-600 to-emerald-700' },
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-4 mb-3 relative group">
                                    <div className="w-32 text-right text-xs font-bold text-[#9db9b9] uppercase">{step.label}</div>
                                    <div className="flex-1 h-12 bg-[#1a2e2e] rounded relative overflow-hidden flex items-center">
                                        <div className={`h-full bg-gradient-to-r ${step.color} rounded relative z-10 flex items-center px-4 transition-all duration-500 group-hover:brightness-110`} style={{ width: step.width }}>
                                            <span className="text-white font-bold text-sm shadow-black drop-shadow-md">{step.val}</span>
                                        </div>
                                        {/* Guide Lines */}
                                        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiAvPgo8L3N2Zz4=')]"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Productivity & Alerts */}
                    <div className="flex flex-col gap-6">
                        {/* Team Productivity */}
                        <div className="bg-white dark:bg-[#111818] border border-[#3b5454] rounded-xl p-6 flex flex-col flex-1 shadow-sm">
                            <h3 className="text-lg font-bold mb-4">Staff Productivity</h3>
                            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                {[
                                    { name: 'Sarah J.', claims: 450, speed: '2m 14s', eff: 98, img: 'https://i.pravatar.cc/150?u=1' },
                                    { name: 'Mike R.', claims: 412, speed: '2m 30s', eff: 95, img: 'https://i.pravatar.cc/150?u=2' },
                                    { name: 'Emily W.', claims: 389, speed: '2m 45s', eff: 94, img: 'https://i.pravatar.cc/150?u=3' },
                                    { name: 'David L.', claims: 350, speed: '3m 10s', eff: 91, img: 'https://i.pravatar.cc/150?u=4' },
                                ].map((user, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-[#1a2525] border border-slate-100 dark:border-[#283939]">
                                        <img src={user.img} className="size-8 rounded-full border border-[#3b5454]" alt={user.name} />
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</span>
                                                <span className="text-xs font-mono text-primary font-bold">{user.eff}% Eff.</span>
                                            </div>
                                            <div className="w-full bg-[#111818] h-1.5 rounded-full">
                                                <div className="bg-primary h-full rounded-full" style={{ width: `${user.eff}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Critical Alert */}
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-5">
                            <div className="flex gap-3">
                                <div className="p-2 bg-rose-500 rounded-lg text-white h-fit">
                                    <span className="material-symbols-outlined">warning</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">Untimely Filing Risk</h4>
                                    <p className="text-xs text-rose-200 leading-relaxed mb-3">
                                        142 claims are approaching the 90-day filing deadline. Immediate action recommended to avoid write-offs.
                                    </p>
                                    <button className="text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold px-3 py-1.5 rounded transition-colors uppercase">
                                        View At-Risk Queue
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
