import React from 'react';

export function LidaAnalytics() {
    return (
        <div className="flex h-full font-sans bg-[#f6f6f8] dark:bg-[#101622] text-slate-900 dark:text-slate-100 overflow-hidden">
            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-x-hidden custom-scrollbar">
                {/* Top Navigation */}
                <header className="h-16 border-b border-slate-200 dark:border-[#2d3748] flex items-center justify-between px-8 bg-white/80 dark:bg-[#101622]/80 backdrop-blur-md sticky top-0 z-10 transition-colors">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">LIDA Predictive Analytics</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex justify-end items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-slate-900 dark:text-white">Admin User</p>
                                <p className="text-[10px] text-slate-500">Finance Director</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dynamic Content Area */}
                <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
                    {/* NLQ Search Bar Section */}
                    <section className="flex flex-col gap-4">
                        <div className="flex flex-col">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Natural Language Query</h3>
                            <p className="text-slate-500 text-sm">Ask LIDA anything about your organization's revenue data</p>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-primary group-focus-within:scale-110 transition-transform">bolt</span>
                            </div>
                            <input className="block w-full pl-12 pr-12 py-4 bg-white dark:bg-[#1a2231] border-2 border-transparent dark:border-[#2d3748] focus:border-primary dark:focus:border-primary rounded-xl text-lg shadow-xl dark:shadow-none placeholder:text-slate-400 focus:ring-0 transition-all outline-none text-slate-900 dark:text-white" placeholder="Show me revenue trends by payer for the last 6 months" type="text" />
                            <div className="absolute inset-y-0 right-4 flex items-center gap-2">
                                <button className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                                    <span className="material-symbols-outlined">search</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs font-medium text-slate-500 px-1">Suggested:</span>
                            {["Predict Q4 cash flow", "Top 3 denial reasons", "Medicare payment efficiency"].map((label, i) => (
                                <button key={i} className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#1a2231] text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors border border-slate-200 dark:border-[#2d3748]">{label}</button>
                            ))}
                        </div>
                    </section>

                    {/* AI Insight Grid */}
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Insight Card 1 */}
                        <div className="bg-white dark:bg-[#1a2231] border border-slate-200 dark:border-[#2d3748] p-6 rounded-xl flex flex-col gap-4 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue Trends</p>
                                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white">$4.2M</h4>
                                </div>
                                <span className="flex items-center text-emerald-500 text-xs font-bold gap-1 bg-emerald-500/10 px-2 py-1 rounded">
                                    <span className="material-symbols-outlined text-sm">trending_up</span> 12.5%
                                </span>
                            </div>
                            <div className="h-32 flex items-end gap-1 px-1">
                                {[40, 60, 45, 70, 85, 95].map((h, i) => (
                                    <div key={i} className={`flex-1 rounded-t-sm h-[${h}%] ${i === 5 ? 'bg-primary' : 'bg-primary/20'}`} style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span>
                            </div>
                        </div>

                        {/* Insight Card 2 */}
                        <div className="bg-white dark:bg-[#1a2231] border border-slate-200 dark:border-[#2d3748] p-6 rounded-xl flex flex-col gap-4 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collection Efficiency</p>
                                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white">92.4%</h4>
                                </div>
                                <span className="flex items-center text-rose-500 text-xs font-bold gap-1 bg-rose-500/10 px-2 py-1 rounded">
                                    <span className="material-symbols-outlined text-sm">trending_down</span> 2.1%
                                </span>
                            </div>
                            <div className="flex-1 flex items-center justify-center relative">
                                <div className="w-24 h-24 rounded-full border-[10px] border-slate-100 dark:border-[#101622] flex items-center justify-center relative">
                                    <div className="absolute w-24 h-24 rounded-full border-[10px] border-primary border-t-transparent -rotate-45"></div>
                                    <span className="text-lg font-bold text-slate-900 dark:text-white">92%</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                    <span className="text-[10px] font-medium text-slate-500">Collected</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-[#101622]"></div>
                                    <span className="text-[10px] font-medium text-slate-500">Outstanding</span>
                                </div>
                            </div>
                        </div>

                        {/* Insight Card 3 (LIDA AI Analysis) */}
                        <div className="bg-gradient-to-br from-primary to-blue-800 p-6 rounded-xl flex flex-col gap-4 text-white shadow-xl lg:col-span-1">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined">auto_awesome</span>
                                <h4 className="text-sm font-bold">LIDA AI Summary</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                                    <p className="text-xs leading-relaxed italic opacity-90">"Medicare payments are processing 5.2 days faster than average. Potential for $240k liquidity gain if optimized further."</p>
                                </div>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2 text-xs">
                                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                        <span>Denial rate down by 0.8% for BCBS</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-xs">
                                        <span className="material-symbols-outlined text-[16px]">warning</span>
                                        <span>Aetna lag increasing in Northeast</span>
                                    </li>
                                </ul>
                            </div>
                            <button className="mt-auto bg-white text-primary text-xs font-bold py-2 rounded-lg hover:bg-blue-50 transition-colors">Generate Full Report</button>
                        </div>
                    </section>

                    {/* Revenue Forecast Section */}
                    <section className="bg-white dark:bg-[#1a2231] border border-slate-200 dark:border-[#2d3748] p-6 rounded-xl shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">90-Day Revenue Forecast</h3>
                                <p className="text-slate-500 text-sm">Predictive confidence interval at 95%</p>
                            </div>
                            <div className="flex bg-slate-100 dark:bg-[#101622] p-1 rounded-lg">
                                <button className="px-4 py-1.5 rounded-md text-xs font-bold text-slate-400">30D</button>
                                <button className="px-4 py-1.5 rounded-md text-xs font-bold text-slate-400">60D</button>
                                <button className="px-4 py-1.5 rounded-md text-xs font-bold bg-white dark:bg-[#1a2231] text-primary shadow-sm">90D</button>
                            </div>
                        </div>
                        <div className="h-64 w-full relative">
                            {/* Forecast Chart SVG */}
                            <svg className="w-full h-full" preserveAspectRatio="none">
                                <path d="M500 120 L550 100 L600 110 L650 90 L700 85 L750 95 L800 105 L850 115 L900 120 L900 180 L850 190 L800 180 L750 170 L700 160 L650 150 L600 160 L550 170 L500 180 Z" fill="rgba(19, 91, 236, 0.1)" stroke="none"></path>
                                <path d="M0 200 L50 180 L100 190 L150 170 L200 160 L250 150 L300 170 L350 160 L400 140 L450 150 L500 150" fill="none" stroke="#135bec" strokeWidth="3"></path>
                                <path d="M500 150 L550 135 L600 145 L650 120 L700 125 L750 130 L800 145 L850 155 L900 150" fill="none" stroke="#135bec" strokeDasharray="6 4" strokeWidth="3"></path>
                                <line stroke="currentColor" strokeOpacity="0.05" x1="0" x2="100%" y1="50" y2="50"></line>
                                <line stroke="currentColor" strokeOpacity="0.05" x1="0" x2="100%" y1="100" y2="100"></line>
                                <line stroke="currentColor" strokeOpacity="0.05" x1="0" x2="100%" y1="150" y2="150"></line>
                                <line stroke="currentColor" strokeOpacity="0.05" x1="0" x2="100%" y1="200" y2="200"></line>
                                <line stroke="#135bec" strokeDasharray="2 2" strokeOpacity="0.2" x1="500" x2="500" y1="0" y2="100%"></line>
                            </svg>
                            <div className="absolute top-0 left-[50%] -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded">PRESENT DAY</div>
                        </div>
                        <div className="mt-4 flex justify-between text-xs font-bold text-slate-400">
                            <span>AUG 01</span><span>AUG 15</span><span>SEP 01</span><span>SEP 15</span><span>OCT 01 (PREDICTED)</span><span>OCT 15</span><span>NOV 01</span>
                        </div>
                    </section>

                    {/* Payer Performance Grid */}
                    <section className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Payer Performance</h3>
                            <button className="text-sm text-primary font-bold flex items-center gap-1">
                                View Detailed Grid <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#2d3748] bg-white dark:bg-[#1a2231]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-[#2d3748]">
                                        <th className="px-4 py-4">Payer Name</th>
                                        <th className="px-4 py-4">Efficiency Score</th>
                                        <th className="px-4 py-4">Avg. Days to Pay</th>
                                        <th className="px-4 py-4">Denial Rate</th>
                                        <th className="px-4 py-4">Monthly Volume</th>
                                        <th className="px-4 py-4 text-right">Trend</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-slate-900 dark:text-white">
                                    <tr className="border-b border-slate-100 dark:border-[#2d3748]/50 hover:bg-slate-50 dark:hover:bg-[#2d3748] transition-colors">
                                        <td className="px-4 py-5 font-bold">Medicare Part B</td>
                                        <td className="px-4 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 bg-slate-200 dark:bg-[#101622] h-1.5 rounded-full">
                                                    <div className="bg-emerald-500 h-full rounded-full w-[94%]"></div>
                                                </div>
                                                94.2%
                                            </div>
                                        </td>
                                        <td className="px-4 py-5">14.2 Days</td>
                                        <td className="px-4 py-5 text-emerald-500 font-bold">4.2%</td>
                                        <td className="px-4 py-5">$1.2M</td>
                                        <td className="px-4 py-5 text-right"><span className="material-symbols-outlined text-emerald-500">trending_up</span></td>
                                    </tr>
                                    <tr className="border-b border-slate-100 dark:border-[#2d3748]/50 hover:bg-slate-50 dark:hover:bg-[#2d3748] transition-colors">
                                        <td className="px-4 py-5 font-bold">BlueCross BlueShield</td>
                                        <td className="px-4 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 bg-slate-200 dark:bg-[#101622] h-1.5 rounded-full">
                                                    <div className="bg-primary h-full rounded-full w-[88%]"></div>
                                                </div>
                                                88.5%
                                            </div>
                                        </td>
                                        <td className="px-4 py-5">22.8 Days</td>
                                        <td className="px-4 py-5 text-slate-500 font-bold">8.4%</td>
                                        <td className="px-4 py-5">$940k</td>
                                        <td className="px-4 py-5 text-right"><span className="material-symbols-outlined text-slate-400">trending_flat</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
