import React from 'react';

export function ClaimsAnalytics() {
    return (
        <div className="p-6 max-w-[1600px] mx-auto font-sans">
            {/* Page Heading */}
            <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Total Claims & Approval Analysis</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base font-normal">Real-time financial reconciliation and deep-dive lifecycle tracking powered by AI.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                        <span>Last 30 Days</span>
                    </button>
                    <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        <span>Export Report</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm">
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Claim Volume</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-slate-900 dark:text-white text-2xl font-bold">$4,281,450</p>
                        <span className="text-emerald-500 text-sm font-bold flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded"><span className="material-symbols-outlined text-[14px]">arrow_upward</span>12%</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm">
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Avg. Days to Pay</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-slate-900 dark:text-white text-2xl font-bold">14.2 Days</p>
                        <span className="text-emerald-500 text-sm font-bold flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded"><span className="material-symbols-outlined text-[14px]">arrow_downward</span>2%</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm">
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Current Denial Rate</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-slate-900 dark:text-white text-2xl font-bold">3.1%</p>
                        <span className="text-emerald-500 text-sm font-bold flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded"><span className="material-symbols-outlined text-[14px]">arrow_downward</span>0.5%</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm">
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Clean Claim Rate (CCR)</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-slate-900 dark:text-white text-2xl font-bold">89.4%</p>
                        <span className="text-emerald-500 text-sm font-bold flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded"><span className="material-symbols-outlined text-[14px]">arrow_upward</span>3.1%</span>
                    </div>
                </div>
            </div>

            {/* Claims Lifecycle Waterfall */}
            <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-slate-900 dark:text-white text-xl font-bold">Claims Lifecycle Waterfall</h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-primary rounded-sm"></span> Volume</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-300 dark:bg-slate-700 rounded-sm"></span> Drop-off</span>
                    </div>
                </div>
                <div className="grid grid-cols-5 gap-4 items-end min-h-[220px]">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center gap-4 group">
                        <div className="w-full bg-primary/20 dark:bg-primary/10 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-[220px]">
                            <div className="bg-primary w-full h-full transition-all group-hover:bg-primary/90"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">12,450</div>
                        </div>
                        <div className="text-center">
                            <p className="text-slate-900 dark:text-white text-sm font-bold">Initial</p>
                            <p className="text-slate-500 text-xs italic">100%</p>
                        </div>
                    </div>
                    {/* Step 2 */}
                    <div className="flex flex-col items-center gap-4 group">
                        <div className="w-full bg-primary/20 dark:bg-primary/10 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-[202px]">
                            <div className="bg-primary w-full h-full transition-all group-hover:bg-primary/90"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">11,454</div>
                        </div>
                        <div className="text-center">
                            <p className="text-slate-900 dark:text-white text-sm font-bold">Scrubbed</p>
                            <p className="text-slate-500 text-xs italic">92%</p>
                        </div>
                    </div>
                    {/* Step 3 */}
                    <div className="flex flex-col items-center gap-4 group">
                        <div className="w-full bg-primary/20 dark:bg-primary/10 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-[187px]">
                            <div className="bg-primary w-full h-full transition-all group-hover:bg-primary/90"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">10,582</div>
                        </div>
                        <div className="text-center">
                            <p className="text-slate-900 dark:text-white text-sm font-bold">Payer Rec.</p>
                            <p className="text-slate-500 text-xs italic">85%</p>
                        </div>
                    </div>
                    {/* Step 4 */}
                    <div className="flex flex-col items-center gap-4 group">
                        <div className="w-full bg-primary/20 dark:bg-primary/10 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-[171px]">
                            <div className="bg-primary w-full h-full transition-all group-hover:bg-primary/90"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">9,711</div>
                        </div>
                        <div className="text-center">
                            <p className="text-slate-900 dark:text-white text-sm font-bold">Adjudicated</p>
                            <p className="text-slate-500 text-xs italic">78%</p>
                        </div>
                    </div>
                    {/* Step 5 */}
                    <div className="flex flex-col items-center gap-4 group">
                        <div className="w-full bg-emerald-500/20 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-[158px]">
                            <div className="bg-emerald-500 w-full h-full transition-all group-hover:bg-emerald-600"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">8,964</div>
                        </div>
                        <div className="text-center">
                            <p className="text-slate-900 dark:text-white text-sm font-bold text-emerald-500">Approved</p>
                            <p className="text-slate-500 text-xs italic">72%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Split View: Claims Grid & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Claim Status Grid (8/12) */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm">
                        <div className="flex gap-2">
                            <select className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-primary py-2 pl-3 pr-8">
                                <option>Filter by Payer</option>
                                <option>Aetna</option>
                                <option>UnitedHealth</option>
                                <option>BlueCross</option>
                            </select>
                            <select className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-primary py-2 pl-3 pr-8">
                                <option>Tax ID / NPI</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-medium">Displaying 1-10 of 1,240</span>
                            <div className="flex gap-1">
                                <button className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                </button>
                                <button className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-border-dark">
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Claim ID</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Payer</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">NPI</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Amount</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">AI Prob.</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                                {/* Row 1 */}
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer">
                                    <td className="px-4 py-4 font-mono text-sm text-primary">#CLM-4921-X</td>
                                    <td className="px-4 py-4 text-sm font-medium">UnitedHealthcare</td>
                                    <td className="px-4 py-4 text-sm text-slate-500">1295810244</td>
                                    <td className="px-4 py-4 text-sm text-right font-bold">$12,400.00</td>
                                    <td className="px-4 py-4">
                                        <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500 uppercase">Scrubbed</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="bg-primary h-full" style={{ width: '82%' }}></div>
                                            </div>
                                            <span className="text-xs font-bold">82%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary">expand_more</span>
                                    </td>
                                </tr>
                                {/* Expanded Details for Row 1 */}
                                <tr className="bg-slate-50 dark:bg-slate-800/20">
                                    <td className="px-4 py-4" colSpan="7">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold uppercase text-slate-400">AI Approval Probability History</p>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-slate-500 uppercase">Current Variance</span>
                                                    <span className="text-xs font-bold text-emerald-500">+4.2% since submission</span>
                                                </div>
                                            </div>
                                            {/* Mock Sparkline */}
                                            <div className="h-16 flex items-end gap-1.5 px-2">
                                                <div className="flex-1 bg-primary/30 rounded-t h-[40%]" title="Day 1"></div>
                                                <div className="flex-1 bg-primary/30 rounded-t h-[45%]" title="Day 2"></div>
                                                <div className="flex-1 bg-primary/40 rounded-t h-[52%]" title="Day 3"></div>
                                                <div className="flex-1 bg-primary/50 rounded-t h-[65%]" title="Day 4"></div>
                                                <div className="flex-1 bg-primary/60 rounded-t h-[72%]" title="Day 5"></div>
                                                <div className="flex-1 bg-primary/80 rounded-t h-[78%]" title="Day 6"></div>
                                                <div className="flex-1 bg-primary h-[82%]" title="Current"></div>
                                            </div>
                                            <div className="flex gap-6 mt-2 border-t border-slate-200 dark:border-slate-800 pt-4">
                                                <div className="flex items-start gap-2">
                                                    <span className="material-symbols-outlined text-emerald-500 text-[18px]">verified</span>
                                                    <div>
                                                        <p className="text-xs font-bold">Patient Eligibility</p>
                                                        <p className="text-[11px] text-slate-500">Confirmed & Verified</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="material-symbols-outlined text-orange-400 text-[18px]">warning</span>
                                                    <div>
                                                        <p className="text-xs font-bold">Coding Accuracy</p>
                                                        <p className="text-[11px] text-slate-500">Modifier 25 Flagged</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                {/* Row 2 */}
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group">
                                    <td className="px-4 py-4 font-mono text-sm text-primary">#CLM-1205-A</td>
                                    <td className="px-4 py-4 text-sm font-medium">Aetna Medicare</td>
                                    <td className="px-4 py-4 text-sm text-slate-500">1023948571</td>
                                    <td className="px-4 py-4 text-sm text-right font-bold">$3,150.25</td>
                                    <td className="px-4 py-4">
                                        <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500 uppercase">Approved</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="bg-emerald-500 h-full" style={{ width: '98%' }}></div>
                                            </div>
                                            <span className="text-xs font-bold">98%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary">expand_more</span>
                                    </td>
                                </tr>

                                {/* Row 3 */}
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group cursor-pointer">
                                    <td className="px-4 py-4 font-mono text-sm text-primary">#CLM-8831-Z</td>
                                    <td className="px-4 py-4 text-sm font-medium">BlueCross BlueShield</td>
                                    <td className="px-4 py-4 text-sm text-slate-500">1948203394</td>
                                    <td className="px-4 py-4 text-sm text-right font-bold">$42,910.00</td>
                                    <td className="px-4 py-4">
                                        <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500 uppercase">Adjudicated</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="bg-primary h-full" style={{ width: '61%' }}></div>
                                            </div>
                                            <span className="text-xs font-bold">61%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary">expand_more</span>
                                    </td>
                                </tr>

                                {/* Row 4 */}
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b-0 cursor-pointer group">
                                    <td className="px-4 py-4 font-mono text-sm text-primary">#CLM-2033-Q</td>
                                    <td className="px-4 py-4 text-sm font-medium">Humana Inc.</td>
                                    <td className="px-4 py-4 text-sm text-slate-500">1442938477</td>
                                    <td className="px-4 py-4 text-sm text-right font-bold">$912.50</td>
                                    <td className="px-4 py-4">
                                        <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500 uppercase">Denied</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="bg-red-500 h-full" style={{ width: '14%' }}></div>
                                            </div>
                                            <span className="text-xs font-bold">14%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary">expand_more</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Dual Axis Chart & Insights (4/12) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* CCR vs Approval Rate Chart */}
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-slate-900 dark:text-white text-base font-bold">CCR vs. Approval Rate</h3>
                            <button className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-[18px]">info</span></button>
                        </div>
                        <div className="relative h-48 w-full flex items-end gap-3 px-2">
                            {/* Chart Background Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
                                <div className="border-t border-slate-100 dark:border-slate-800 w-full"></div>
                                <div className="border-t border-slate-100 dark:border-slate-800 w-full"></div>
                                <div className="border-t border-slate-100 dark:border-slate-800 w-full"></div>
                            </div>
                            {/* Dual Axis Data Bars/Points */}
                            <div className="flex-1 flex flex-col justify-end gap-1 relative group">
                                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-t h-[90%] group-hover:bg-primary/20 transition-colors" title="CCR: 89%"></div>
                                <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white dark:border-card-dark z-10 shadow-sm" title="Approval: 85%"></div>
                                <span className="text-[9px] text-slate-500 text-center mt-1 font-bold">W1</span>
                            </div>
                            <div className="flex-1 flex flex-col justify-end gap-1 relative group">
                                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-t h-[75%] group-hover:bg-primary/20 transition-colors" title="CCR: 75%"></div>
                                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white dark:border-card-dark z-10 shadow-sm" title="Approval: 68%"></div>
                                <span className="text-[9px] text-slate-500 text-center mt-1 font-bold">W2</span>
                            </div>
                            <div className="flex-1 flex flex-col justify-end gap-1 relative group">
                                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-t h-[82%] group-hover:bg-primary/20 transition-colors" title="CCR: 82%"></div>
                                <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white dark:border-card-dark z-10 shadow-sm" title="Approval: 79%"></div>
                                <span className="text-[9px] text-slate-500 text-center mt-1 font-bold">W3</span>
                            </div>
                            <div className="flex-1 flex flex-col justify-end gap-1 relative group">
                                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-t h-[95%] group-hover:bg-primary/20 transition-colors" title="CCR: 95%"></div>
                                <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white dark:border-card-dark z-10 shadow-sm" title="Approval: 91%"></div>
                                <span className="text-[9px] text-slate-500 text-center mt-1 font-bold">W4</span>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-slate-200 dark:bg-slate-800 rounded-sm"></span>
                                <span className="text-[11px] font-medium text-slate-500">Clean Claim Rate</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-primary rounded-full border border-white dark:border-card-dark shadow-sm"></span>
                                <span className="text-[11px] font-medium text-slate-500">Approval Rate</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Smart Insights */}
                    <div className="bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20 p-6">
                        <div className="flex items-center gap-2 mb-4 text-primary">
                            <span className="material-symbols-outlined text-[20px]">psychology</span>
                            <h3 className="text-base font-bold">AI Insights</h3>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <span className="material-symbols-outlined text-emerald-500 text-[18px]">trending_up</span>
                                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                    <strong className="text-slate-900 dark:text-white">High Correlation:</strong> Clean Claim Rate (CCR) is driving a 4.5% uptick in approval speed for Aetna claims.
                                </p>
                            </li>
                            <li className="flex gap-3">
                                <span className="material-symbols-outlined text-orange-400 text-[18px]">error</span>
                                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                    <strong className="text-slate-900 dark:text-white">Alert:</strong> NPI #1023948571 has a 12% higher denial rate due to missing documentation on 'Modifier 59' codes.
                                </p>
                            </li>
                            <li className="flex gap-3">
                                <span className="material-symbols-outlined text-primary text-[18px]">lightbulb</span>
                                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                    <strong className="text-slate-900 dark:text-white">Opportunity:</strong> Auto-scrubbing for UnitedHealth could improve net revenue by 2.1% if applied pre-submission.
                                </p>
                            </li>
                        </ul>
                        <button className="w-full mt-6 py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/20 hover:bg-primary/20 transition-colors">
                            Run Automated Reconciliation
                        </button>
                    </div>

                    {/* Payer Efficiency List */}
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm p-6">
                        <h3 className="text-slate-900 dark:text-white text-base font-bold mb-4">Payer Efficiency Score</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-700 dark:text-white">BlueCross</span>
                                    <span className="text-emerald-500">92.4%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92.4%' }}></div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-700 dark:text-white">Medicare</span>
                                    <span className="text-emerald-500">88.1%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '88.1%' }}></div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-700 dark:text-white">UnitedHealth</span>
                                    <span className="text-orange-500">76.5%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="bg-orange-500 h-full rounded-full" style={{ width: '76.5%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
