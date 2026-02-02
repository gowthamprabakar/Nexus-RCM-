import React from 'react';

export function CollectionsHub() {
    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark font-sans h-full">
            <div className="max-w-[1600px] mx-auto px-10 py-8">
                {/* Page Heading */}
                <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">A/R Aging Analysis & Collections Hub</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-base font-normal">Real-time enterprise accounts receivable tracking with AI-prioritized intervention workflows.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
                            <span className="material-symbols-outlined text-sm">filter_list</span>
                            <span>Filters</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors">
                            <span className="material-symbols-outlined text-sm">file_download</span>
                            <span>Export Report</span>
                        </button>
                    </div>
                </div>

                {/* KPI Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 rounded-xl shadow-sm">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">Total A/R Balance</p>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">$12,450,200</p>
                            <span className="text-green-600 dark:text-green-400 text-sm font-bold mb-1 flex items-center">
                                <span className="material-symbols-outlined text-sm mr-0.5">trending_up</span> 2.4%
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 font-medium">vs last month ($12.1M)</p>
                    </div>
                    <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 rounded-xl shadow-sm border-l-4 border-l-amber-500">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">Avg. Days Outstanding</p>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">42 Days</p>
                            <span className="text-red-500 text-sm font-bold mb-1 flex items-center">
                                <span className="material-symbols-outlined text-sm mr-0.5">trending_up</span> +3.1%
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 font-medium">Target: 35 Days</p>
                    </div>
                    <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 rounded-xl shadow-sm">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">Projected 30D Cash</p>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">$4.2M</p>
                            <span className="text-green-600 dark:text-green-400 text-sm font-bold mb-1 flex items-center">
                                <span className="material-symbols-outlined text-sm mr-0.5">check_circle</span> On Track
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 font-medium">Confidence level: 94%</p>
                    </div>
                    <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 rounded-xl shadow-sm border-l-4 border-l-red-500">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">AI Risk Flagged Claims</p>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">184</p>
                            <span className="text-red-500 text-sm font-bold mb-1 flex items-center">
                                <span className="material-symbols-outlined text-sm mr-0.5">priority_high</span> High Risk
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 font-medium">Potential Loss: $640k</p>
                    </div>
                </div>

                {/* Charts Grid Tier 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Aging Bucket Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">A/R Aging Buckets vs. Expected Collectability</h3>
                                <p className="text-sm text-slate-500">Current portfolio breakdown by aging category</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-primary/30"></span>
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Balance</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-0.5 bg-primary"></span>
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Collectability %</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative h-64 flex items-end justify-between px-8 pb-2">
                            {/* Collectability Line Overlay (Visual Representation) */}
                            <div className="absolute inset-0 pointer-events-none flex items-center px-16 mt-[-20px] z-10">
                                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                                    <path d="M 0 10 L 133 25 L 266 50 L 400 85" fill="none" stroke="#135bec" strokeLinecap="round" strokeWidth="3"></path>
                                    <circle cx="0" cy="10" fill="#135bec" r="4"></circle>
                                    <circle cx="133" cy="25" fill="#135bec" r="4"></circle>
                                    <circle cx="266" cy="50" fill="#135bec" r="4"></circle>
                                    <circle cx="400" cy="85" fill="#135bec" r="4"></circle>
                                </svg>
                            </div>
                            {/* Bars */}
                            <div className="flex flex-col items-center gap-2 w-20 z-0">
                                <div className="w-full bg-emerald-500 rounded-t-lg transition-all hover:opacity-80 cursor-pointer shadow-sm" style={{ height: '180px' }}></div>
                                <span className="text-xs font-bold text-slate-500">0-30d</span>
                                <span className="text-[10px] text-slate-400 font-bold">$6.2M (98%)</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 w-20 z-0">
                                <div className="w-full bg-amber-500 rounded-t-lg transition-all hover:opacity-80 cursor-pointer shadow-sm" style={{ height: '120px' }}></div>
                                <span className="text-xs font-bold text-slate-500">31-60d</span>
                                <span className="text-[10px] text-slate-400 font-bold">$3.1M (85%)</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 w-20 z-0">
                                <div className="w-full bg-orange-500 rounded-t-lg transition-all hover:opacity-80 cursor-pointer shadow-sm" style={{ height: '80px' }}></div>
                                <span className="text-xs font-bold text-slate-500">61-90d</span>
                                <span className="text-[10px] text-slate-400 font-bold">$1.9M (60%)</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 w-20 z-0">
                                <div className="w-full bg-red-500 rounded-t-lg transition-all hover:opacity-80 cursor-pointer shadow-sm" style={{ height: '50px' }}></div>
                                <span className="text-xs font-bold text-slate-500">90+d</span>
                                <span className="text-[10px] text-slate-400 font-bold">$1.2M (32%)</span>
                            </div>
                        </div>
                    </div>

                    {/* Payer Collection Velocity */}
                    <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white">Collection Velocity</h3>
                        <p className="text-sm text-slate-500 mb-6">Days to Settle by Top Payer</p>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                    <span>Medicare</span>
                                    <span>24 Days</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '45%' }}></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                    <span>Aetna</span>
                                    <span>32 Days</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '60%' }}></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                    <span>BCBS</span>
                                    <span>48 Days</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '75%' }}></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                    <span>United Health</span>
                                    <span>54 Days</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-orange-500 h-full rounded-full" style={{ width: '85%' }}></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                    <span>Cigna</span>
                                    <span>61 Days</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-red-500 h-full rounded-full" style={{ width: '95%' }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                            <button className="text-primary text-xs font-bold hover:underline">View All Payer Performance</button>
                        </div>
                    </div>
                </div>

                {/* Payer Treemap Section */}
                <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 rounded-xl shadow-sm mb-8">
                    <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white">Top Payers by A/R Balance</h3>
                    <p className="text-sm text-slate-500 mb-6">Treemap visualization of capital concentration</p>
                    <div className="grid grid-cols-12 grid-rows-2 h-72 gap-2 text-slate-900 dark:text-white">
                        <div className="col-span-6 row-span-2 bg-primary/10 border border-primary/20 rounded-lg p-6 flex flex-col justify-between hover:bg-primary/20 cursor-pointer transition-colors">
                            <div>
                                <p className="text-sm font-bold opacity-80">Medicare Advantage</p>
                                <p className="text-3xl font-black text-primary mt-1">$3.8M</p>
                            </div>
                            <p className="text-xs font-bold opacity-60">30.5% of Portfolio</p>
                        </div>
                        <div className="col-span-3 row-span-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-4 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex flex-col justify-center">
                            <p className="text-xs font-bold opacity-70">BCBS Texas</p>
                            <p className="text-xl font-bold">$1.4M</p>
                        </div>
                        <div className="col-span-3 row-span-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-4 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex flex-col justify-center">
                            <p className="text-xs font-bold opacity-70">Aetna National</p>
                            <p className="text-xl font-bold">$1.2M</p>
                        </div>
                        <div className="col-span-2 row-span-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-3 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex flex-col justify-center">
                            <p className="text-xs font-bold opacity-70">Cigna</p>
                            <p className="text-lg font-bold">$920k</p>
                        </div>
                        <div className="col-span-2 row-span-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-3 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex flex-col justify-center">
                            <p className="text-xs font-bold opacity-70">United</p>
                            <p className="text-lg font-bold">$840k</p>
                        </div>
                        <div className="col-span-2 row-span-1 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-3 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                            <p className="text-xs font-bold text-slate-400">14 Others</p>
                        </div>
                    </div>
                </div>

                {/* High-Value / High-Risk Worklist */}
                <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl shadow-sm overflow-hidden mb-12">
                    <div className="flex flex-wrap justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">High-Value/High-Risk Worklist</h3>
                            <p className="text-sm text-slate-500">AI-prioritized claims requiring immediate follow-up</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                <button className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-600 rounded-md shadow-sm text-slate-900 dark:text-white">By Risk Score</button>
                                <button className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">By Balance</button>
                                <button className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">By Aging</button>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Claim ID</th>
                                    <th className="px-6 py-4">Payer</th>
                                    <th className="px-6 py-4">Balance</th>
                                    <th className="px-6 py-4">Aging</th>
                                    <th className="px-6 py-4">AI Risk Analysis</th>
                                    <th className="px-6 py-4">Next Action</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">#CLM-90284</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-[10px] text-blue-600 font-bold">MC</div>
                                            <span className="text-slate-700 dark:text-slate-300">Medicare</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">$42,350.00</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold">94 Days</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                            <span className="font-bold text-slate-900 dark:text-white">Critical (92%)</span>
                                            <span className="material-symbols-outlined text-slate-400 text-sm cursor-help" title="High risk">info</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">Submit Clinical Appeal</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Execute Action</button>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">#CLM-88122</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-[10px] text-emerald-600 font-bold">BC</div>
                                            <span className="text-slate-700 dark:text-slate-300">BCBS TX</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">$18,120.50</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold">72 Days</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                            <span className="font-bold text-slate-900 dark:text-white">High Risk (74%)</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">Verify Authorization</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Execute Action</button>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">#CLM-91203</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-[10px] text-purple-600 font-bold">UN</div>
                                            <span className="text-slate-700 dark:text-slate-300">United Health</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">$12,400.00</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold">45 Days</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                            <span className="font-bold text-slate-900 dark:text-white">Medium (48%)</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">Payer Status Call</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Execute Action</button>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">#CLM-90041</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-[10px] text-blue-600 font-bold">MC</div>
                                            <span className="text-slate-700 dark:text-slate-300">Medicare</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">$8,900.00</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold">112 Days</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                            <span className="font-bold text-slate-900 dark:text-white">Critical (88%)</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">Legal Demand Letter</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Execute Action</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Floating Help & Action Button */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-3">
                <button className="w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined !text-3xl">smart_toy</span>
                </button>
            </div>
        </div>
    );
}
