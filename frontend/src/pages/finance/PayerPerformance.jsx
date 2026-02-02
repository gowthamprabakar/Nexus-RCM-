import React from 'react';

export function PayerPerformance() {
    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark font-sans h-full">
            <div className="max-w-[1600px] mx-auto p-6 space-y-6">
                {/* Page Heading */}
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">System Status: AI Pulse Active</span>
                        </div>
                        <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Payer Intelligence & Performance</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">Real-time AI-native revenue cycle insights and contract performance monitoring across the enterprise network.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark text-slate-700 dark:text-slate-200 text-sm font-bold gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <span className="material-symbols-outlined text-lg">calendar_today</span>
                            Last 30 Days
                        </button>
                        <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold gap-2 shadow-lg shadow-primary/20 hover:bg-blue-700 transition-colors">
                            <span className="material-symbols-outlined text-lg">ios_share</span>
                            Export Intelligence
                        </button>
                    </div>
                </div>

                {/* KPI Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Weighted Denial Rate</p>
                            <span className="material-symbols-outlined text-slate-400 text-sm">info</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-slate-900 dark:text-white text-2xl font-bold">12.4%</p>
                            <p className="text-rose-500 text-xs font-bold flex items-center">-1.2% <span className="material-symbols-outlined text-[10px]">arrow_downward</span></p>
                        </div>
                        <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: '72%' }}></div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Underpayment Leakage</p>
                            <span className="material-symbols-outlined text-slate-400 text-sm">warning</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-slate-900 dark:text-white text-2xl font-bold">-$2.41M</p>
                            <p className="text-emerald-500 text-xs font-bold flex items-center">+4.5% <span className="material-symbols-outlined text-[10px]">arrow_upward</span></p>
                        </div>
                        <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Avg. Days to Pay</p>
                            <span className="material-symbols-outlined text-slate-400 text-sm">history</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-slate-900 dark:text-white text-2xl font-bold">34 Days</p>
                            <p className="text-rose-500 text-xs font-bold flex items-center">-2.4 <span className="material-symbols-outlined text-[10px]">arrow_downward</span></p>
                        </div>
                        <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '65%' }}></div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Compliance Score</p>
                            <span className="material-symbols-outlined text-slate-400 text-sm">verified</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-slate-900 dark:text-white text-2xl font-bold">92.8%</p>
                            <p className="text-emerald-500 text-xs font-bold flex items-center">+0.8% <span className="material-symbols-outlined text-[10px]">arrow_upward</span></p>
                        </div>
                        <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '92%' }}></div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Left/Center Column */}
                    <div className="col-span-12 lg:col-span-9 space-y-6">
                        {/* Payer Comparison Matrix */}
                        <div className="rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-border-dark">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payer Comparison Matrix</h3>
                                <div className="flex gap-2">
                                    <button className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-300">Aggregated View</button>
                                    <button className="text-xs font-semibold px-3 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">By Facility</button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Payer Name</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Approval Rate</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Avg. Days to Pay</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Denial Frequency</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Yield Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">M</div>
                                                    <span className="font-bold text-sm text-slate-900 dark:text-white">Medicare (CMS)</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-900/50">
                                                    94.2%
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">28 Days</td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-semibold uppercase">Low</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="w-24 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary" style={{ width: '92%' }}></div>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">92</span>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">U</div>
                                                    <span className="font-bold text-sm text-slate-900 dark:text-white">UnitedHealthcare</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-900/50">
                                                    88.5%
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">42 Days</td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold uppercase">Medium</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="w-24 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary" style={{ width: '84%' }}></div>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">84</span>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">A</div>
                                                    <span className="font-bold text-sm text-slate-900 dark:text-white">Aetna Health</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-900/50">
                                                    82.1%
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">38 Days</td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-semibold uppercase">High</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="w-24 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary" style={{ width: '76%' }}></div>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">76</span>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">B</div>
                                                    <span className="font-bold text-sm text-slate-900 dark:text-white">BCBS Network</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-900/50">
                                                    91.8%
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">31 Days</td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-semibold uppercase">Low</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="w-24 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary" style={{ width: '90%' }}></div>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">90</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Compliance and Behavior Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Contract Compliance Tracker */}
                            <div className="rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                        <span className="material-symbols-outlined text-primary">gavel</span>
                                        Contract Compliance
                                    </h3>
                                    <button className="text-primary text-xs font-bold hover:underline">View All Variances</button>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-500 dark:text-slate-400">Medicare Outpatient</span>
                                            <span className="text-rose-500">-$420k Variance</span>
                                        </div>
                                        <div className="relative h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="absolute h-full bg-primary/20" style={{ width: '100%' }}></div>
                                            <div className="absolute h-full bg-primary shadow-[0_0_10px_rgba(19,91,236,0.3)]" style={{ width: '82%' }}></div>
                                            <div className="absolute right-[18%] top-0 h-full w-0.5 bg-rose-500 z-10"></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-medium text-slate-400">
                                            <span>Actual: $1.82M</span>
                                            <span>Target: $2.24M</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-500 dark:text-slate-400">UnitedHealth Inpatient</span>
                                            <span className="text-emerald-500">+$112k Surplus</span>
                                        </div>
                                        <div className="relative h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="absolute h-full bg-primary/20" style={{ width: '100%' }}></div>
                                            <div className="absolute h-full bg-primary" style={{ width: '96%' }}></div>
                                            <div className="absolute right-[4%] top-0 h-full w-0.5 bg-emerald-500 z-10"></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-medium text-slate-400">
                                            <span>Actual: $4.1M</span>
                                            <span>Target: $3.9M</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-500 dark:text-slate-400">BCBS Professional</span>
                                            <span className="text-slate-400">On Track</span>
                                        </div>
                                        <div className="relative h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="absolute h-full bg-primary/20" style={{ width: '100%' }}></div>
                                            <div className="absolute h-full bg-primary" style={{ width: '99%' }}></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-medium text-slate-400">
                                            <span>Actual: $840k</span>
                                            <span>Target: $845k</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* AI Payer Behavior */}
                            <div className="rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                        <span className="material-symbols-outlined text-primary">psychology</span>
                                        AI Payer Behavior
                                    </h3>
                                    <div className="flex gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary/30"></span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-l-4 border-primary">
                                        <p className="text-xs font-bold text-primary uppercase mb-1 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">trending_up</span>
                                            Policy Shift Predicted
                                        </p>
                                        <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-gray-300">
                                            <span className="font-bold">Medicare Advantage</span> is showing a <span class="text-rose-500">22% surge</span> in Orthopedic pre-auth denials. Shift in adjudication patterns detected for CPT 27447.
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-2">Predicted Impact: -$140k/month • Confidence: 88%</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-l-4 border-emerald-500">
                                        <p className="text-xs font-bold text-emerald-500 uppercase mb-1 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">task_alt</span>
                                            Payment Acceleration
                                        </p>
                                        <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-gray-300">
                                            <span className="font-bold">Aetna</span> claims cycle time decreased by 4.2 days following EDI 835 optimization. AI projects sustained performance through Q3.
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-2">Cash Flow Impact: +$210k Liquidity • Confidence: 94%</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-l-4 border-amber-500">
                                        <p className="text-xs font-bold text-amber-500 uppercase mb-1 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">bolt</span>
                                            Renewal Trigger
                                        </p>
                                        <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-gray-300">
                                            <span className="font-bold">Humana</span> contract audit reveals 14% variance in cardiac bundling. Ideal window for rate renegotiation opens in 14 days.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column/Sidebar */}
                    <div className="col-span-12 lg:col-span-3 space-y-6">
                        {/* Negotiation Insights Widget */}
                        <div className="rounded-xl border border-slate-200 dark:border-border-dark bg-primary/5 dark:bg-primary/10 p-5 shadow-sm border-t-4 border-t-primary">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-primary text-white p-1.5 rounded-lg">
                                    <span className="material-symbols-outlined text-xl">insights</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Negotiation Insights</h3>
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-tighter">AI Renewal Engine</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-white dark:bg-card-dark rounded-xl border border-primary/20 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <span className="material-symbols-outlined text-4xl">contract</span>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Upcoming Expiry</h4>
                                    <p className="font-bold text-lg mb-1 text-slate-900 dark:text-white">Aetna Commercial</p>
                                    <p className="text-xs font-medium text-slate-500 mb-3">Expires: Oct 12, 2024 (64 Days)</p>
                                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-border-dark">
                                        <div className="flex items-start gap-2">
                                            <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
                                            <p className="text-xs font-medium leading-tight text-slate-700 dark:text-slate-300">Propose 4.2% increase in Level 4/5 E&M rates based on volume shifts.</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="material-symbols-outlined text-emerald-500 text-lg">payments</span>
                                            <p className="text-xs font-medium leading-tight text-slate-700 dark:text-slate-300">Projected annual revenue lift: <span className="text-emerald-500 font-bold">+$840,000</span></p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="material-symbols-outlined text-rose-500 text-lg">warning_amber</span>
                                            <p className="text-xs font-medium leading-tight text-slate-700 dark:text-slate-300">Action required: Audit high-cost imaging outlier payments before Aug 20.</p>
                                        </div>
                                    </div>
                                    <button className="w-full mt-4 bg-primary text-white py-2.5 rounded-lg text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                                        Start Negotiation Prep
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>
                                </div>
                                {/* Secondary Insights */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Network Stability Monitoring</h4>
                                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-card-dark rounded-lg border border-slate-200 dark:border-border-dark hover:border-slate-300 transition-colors cursor-pointer">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">UHC Contract Status</p>
                                            <p className="text-[10px] text-slate-500">Compliance at 98.4% • Green Zone</p>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-card-dark rounded-lg border border-slate-200 dark:border-border-dark hover:border-slate-300 transition-colors cursor-pointer">
                                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">BCBS Rate Parity</p>
                                            <p className="text-[10px] text-slate-500">3.2% deviation detected in Region 4</p>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* System Load / Data Freshness */}
                        <div className="rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark p-4 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Real-time Data Ingestion</p>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500">Claim Streams</span>
                                        <span className="text-primary font-bold">99.9%</span>
                                    </div>
                                    <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: '99.9%' }}></div>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500">AI Processing</span>
                                        <span className="text-emerald-500 font-bold">Optimal</span>
                                    </div>
                                    <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: '85%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating AI Assistant Button */}
                <button className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group z-50">
                    <span className="material-symbols-outlined text-3xl">chat_bubble</span>
                    <div className="absolute bottom-full right-0 mb-4 w-48 p-3 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        <p className="text-xs font-bold mb-1 text-slate-900 dark:text-white">AI Assistant</p>
                        <p className="text-[10px] leading-tight text-slate-500">Ask me about underpayment trends or contract variances.</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
