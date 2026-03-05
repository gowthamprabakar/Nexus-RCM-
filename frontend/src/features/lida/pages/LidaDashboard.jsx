import React from 'react';

export function LidaDashboard() {
    return (
        <div className="flex-1 overflow-y-auto h-full bg-[#f6f8f8] dark:bg-[#0d1117] p-8 text-slate-900 dark:text-white custom-scrollbar">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Predictive Analytics Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">AI-driven insights for revenue optimization.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-[#161b22] px-3 py-1.5 rounded-full">
                        Admin User
                    </span>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors">
                        <span className="material-symbols-outlined text-lg">calendar_month</span>
                        Last 30 Days
                    </button>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-[#161b22] p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <span className="material-symbols-outlined text-6xl">attach_money</span>
                    </div>
                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">Predicted Revenue (30d)</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">$4.2M</h3>
                    <p className="text-xs text-emerald-500 font-bold flex items-center gap-1 mt-2"><span className="material-symbols-outlined text-sm">trending_up</span> +12% vs last month</p>
                </div>
                <div className="bg-white dark:bg-[#161b22] p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <span className="material-symbols-outlined text-6xl">warning</span>
                    </div>
                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">Denial Risk Alert</p>
                    <h3 className="text-3xl font-black text-rose-500">14%</h3>
                    <p className="text-xs text-rose-500 font-bold flex items-center gap-1 mt-2">Spike in 'Medical Necessity'</p>
                </div>
                <div className="bg-white dark:bg-[#161b22] p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <span className="material-symbols-outlined text-6xl">timelapse</span>
                    </div>
                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">Avg Days to Pay</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">28</h3>
                    <p className="text-xs text-emerald-500 font-bold flex items-center gap-1 mt-2"><span className="material-symbols-outlined text-sm">arrow_downward</span> -2 days improvement</p>
                </div>
                <div className="bg-white dark:bg-[#161b22] p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <span className="material-symbols-outlined text-6xl">auto_fix_high</span>
                    </div>
                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">AI Auto-Fix Rate</p>
                    <h3 className="text-3xl font-black text-primary">68%</h3>
                    <p className="text-xs text-primary font-bold flex items-center gap-1 mt-2">Target: 75%</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LIDA Insights Card */}
                <div className="lg:col-span-1 bg-gradient-to-br from-primary to-blue-800 p-6 rounded-xl flex flex-col gap-6 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined">auto_awesome</span>
                            <h3 className="font-bold text-lg">LIDA Observations</h3>
                        </div>
                        <p className="text-sm opacity-90 leading-relaxed mb-6">
                            "I've detected a significant anomaly in <strong className="text-amber-300">BlueCross PPO</strong> outpatient claims.
                            Rejections for code 99214 have increased by 45% this week due to missing modifier 25."
                        </p>
                        <div className="p-4 bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm">
                            <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-white/70">Recommended Actions</h4>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-amber-300 text-base mt-0.5">bolt</span>
                                    <span>Auto-append modifier 25 for qualifying visits.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-emerald-300 text-base mt-0.5">group</span>
                                    <span>Alert Coding Team Lead (Sarah M.)</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <button className="mt-auto w-full py-3 bg-white text-primary font-bold rounded-lg hover:bg-slate-100 transition-colors shadow-lg">
                        Execute Fixes
                    </button>
                    {/* Decorative Background Elements */}
                    <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                {/* Revenue Forecast Chart (Mock) */}
                <div className="lg:col-span-2 bg-white dark:bg-[#161b22] p-6 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold">90-Day Revenue Forecast</h3>
                            <p className="text-slate-500 text-sm">Predictive confidence interval at 95%</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500">
                                <div className="w-2 h-2 rounded-full bg-slate-300"></div> Historical
                            </span>
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-primary">
                                <div className="w-2 h-2 rounded-full bg-primary"></div> Predicted
                            </span>
                        </div>
                    </div>

                    {/* Simplified Chart Representation */}
                    <div className="h-64 flex items-end justify-between gap-2 relative">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-px bg-slate-100 dark:bg-gray-800"></div>)}
                        </div>

                        {/* Bars / Line Approximation */}
                        {[30, 45, 40, 50, 55, 60, 58, 65, 70, 72, 80, 85].map((h, i) => (
                            <div key={i} className="group relative w-full h-full flex items-end z-10">
                                <div
                                    style={{ height: `${h}%` }}
                                    className={`w-full rounded-t-sm transition-all hover:opacity-80 ${i > 7 ? 'bg-primary/80 dark:bg-primary custom-pattern' : 'bg-slate-300 dark:bg-slate-700'}`}
                                ></div>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap">
                                    ${h * 85}k
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions / Recents */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-4">Recent Inquiries</h3>
                    <div className="space-y-4">
                        {[
                            { q: "Why did A/R days spike in NY?", time: "2h ago", status: "Resolved" },
                            { q: "Top 5 denial reasons for CPT 73721", time: "5h ago", status: "Saved to Report" },
                            { q: "Predict cash flow for Q4", time: "Yesterday", status: "Shared" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#0d1117] transition-colors cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                        <span className="material-symbols-outlined text-sm">chat</span>
                                    </div>
                                    <span className="text-sm font-medium">{item.q}</span>
                                </div>
                                <span className="text-[10px] text-slate-500">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-4">System Health</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-500">Model Accuracy (Drift Monitor)</span>
                                <span className="font-bold text-emerald-500">98.2%</span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full w-[98.2%] bg-emerald-500 rounded-full"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-500">Data Freshness</span>
                                <span className="font-bold text-primary">Real-time</span>
                            </div>
                            <div className="flex gap-1">
                                {[1, 1, 1, 1, 1].map((_, i) => <div key={i} className="h-2 flex-1 bg-primary rounded-full animate-pulse"></div>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
