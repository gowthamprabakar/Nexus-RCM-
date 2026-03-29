import React from 'react';
import { ConfidenceBar } from '../../../components/ui';
import RootCauseTree from '../components/RootCauseTree';

export function ClaimsAnalytics() {
 return (
 <div className="p-6 max-w-[1600px] mx-auto font-sans">
 {/* Page Heading */}
 <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
 <div className="flex flex-col gap-1">
 <h1 className="text-th-heading text-3xl font-black leading-tight tracking-tight flex items-center gap-3">
 Total Claims & Approval Analysis
 <span className="ai-diagnostic">Diagnostic AI</span>
 </h1>
 <p className="text-th-secondary text-base font-normal">Real-time financial reconciliation and deep-dive lifecycle tracking powered by AI.</p>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-th-surface-raised text-th-heading text-sm font-bold border border-th-border hover:bg-th-surface-overlay transition-colors">
 <span className="material-symbols-outlined text-[18px]">calendar_today</span>
 <span>Last 30 Days</span>
 </button>
 <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-th-heading text-sm font-bold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all">
 <span className="material-symbols-outlined text-[18px]">download</span>
 <span>Export Report</span>
 </button>
 </div>
 </div>

 {/* Stats Overview */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
 <div className="flex flex-col gap-2 rounded-xl p-6 bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-th-secondary text-sm font-medium">Total Claim Volume</p>
 <div className="flex items-baseline gap-2">
 <p className="text-th-heading text-2xl font-bold tabular-nums">$4,281,450</p>
 <span className="text-emerald-500 text-sm font-bold flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded tabular-nums"><span className="material-symbols-outlined text-[14px]">arrow_upward</span>12%</span>
 </div>
 </div>
 <div className="flex flex-col gap-2 rounded-xl p-6 bg-th-surface-raised border border-th-border border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-th-secondary text-sm font-medium">Avg. Days to Pay</p>
 <div className="flex items-baseline gap-2">
 <p className="text-th-heading text-2xl font-bold tabular-nums">14.2 Days</p>
 <span className="text-emerald-500 text-sm font-bold flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded tabular-nums"><span className="material-symbols-outlined text-[14px]">arrow_downward</span>2%</span>
 </div>
 </div>
 <div className="flex flex-col gap-2 rounded-xl p-6 bg-th-surface-raised border border-th-border border-l-[3px] border-l-amber-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-th-secondary text-sm font-medium">Current Denial Rate</p>
 <div className="flex items-baseline gap-2">
 <p className="text-th-heading text-2xl font-bold tabular-nums">3.1%</p>
 <span className="text-emerald-500 text-sm font-bold flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded tabular-nums"><span className="material-symbols-outlined text-[14px]">arrow_downward</span>0.5%</span>
 </div>
 </div>
 <div className="flex flex-col gap-2 rounded-xl p-6 bg-th-surface-raised border border-th-border border-l-[3px] border-l-purple-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-th-secondary text-sm font-medium">Clean Claim Rate (CCR)</p>
 <div className="flex items-baseline gap-2">
 <p className="text-th-heading text-2xl font-bold tabular-nums">89.4%</p>
 <span className="text-emerald-500 text-sm font-bold flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded tabular-nums"><span className="material-symbols-outlined text-[14px]">arrow_upward</span>3.1%</span>
 </div>
 </div>
 </div>

 {/* AI Root Cause Analysis */}
 <div className="mb-6">
   <RootCauseTree />
 </div>


 {/* Claims Lifecycle Waterfall */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-8 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between mb-8">
 <h2 className="text-th-heading text-xl font-bold">Claims Lifecycle Waterfall</h2>
 <div className="flex items-center gap-2 text-xs text-th-secondary">
 <span className="flex items-center gap-1"><span className="w-3 h-3 bg-primary rounded-sm"></span> Volume</span>
 <span className="flex items-center gap-1"><span className="w-3 h-3 bg-th-surface-overlay rounded-sm"></span> Drop-off</span>
 </div>
 </div>
 <div className="grid grid-cols-5 gap-4 items-end min-h-[220px]">
 {/* Step 1 */}
 <div className="flex flex-col items-center gap-4 group">
 <div className="w-full bg-primary/10 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-[220px]">
 <div className="bg-primary w-full h-full transition-all group-hover:bg-primary/90"></div>
 <div className="absolute inset-0 flex items-center justify-center text-th-heading font-bold text-sm tabular-nums">12,450</div>
 </div>
 <div className="text-center">
 <p className="text-th-heading text-sm font-bold">Initial</p>
 <p className="text-th-muted text-xs italic">100%</p>
 </div>
 </div>
 {/* Step 2 */}
 <div className="flex flex-col items-center gap-4 group">
 <div className="w-full bg-primary/10 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-[202px]">
 <div className="bg-primary w-full h-full transition-all group-hover:bg-primary/90"></div>
 <div className="absolute inset-0 flex items-center justify-center text-th-heading font-bold text-sm tabular-nums">11,454</div>
 </div>
 <div className="text-center">
 <p className="text-th-heading text-sm font-bold">Scrubbed</p>
 <p className="text-th-muted text-xs italic">92%</p>
 </div>
 </div>
 {/* Step 3 */}
 <div className="flex flex-col items-center gap-4 group">
 <div className="w-full bg-primary/10 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-[187px]">
 <div className="bg-primary w-full h-full transition-all group-hover:bg-primary/90"></div>
 <div className="absolute inset-0 flex items-center justify-center text-th-heading font-bold text-sm tabular-nums">10,582</div>
 </div>
 <div className="text-center">
 <p className="text-th-heading text-sm font-bold">Payer Rec.</p>
 <p className="text-th-muted text-xs italic">85%</p>
 </div>
 </div>
 {/* Step 4 */}
 <div className="flex flex-col items-center gap-4 group">
 <div className="w-full bg-primary/10 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-[171px]">
 <div className="bg-primary w-full h-full transition-all group-hover:bg-primary/90"></div>
 <div className="absolute inset-0 flex items-center justify-center text-th-heading font-bold text-sm tabular-nums">9,711</div>
 </div>
 <div className="text-center">
 <p className="text-th-heading text-sm font-bold">Adjudicated</p>
 <p className="text-th-muted text-xs italic">78%</p>
 </div>
 </div>
 {/* Step 5 */}
 <div className="flex flex-col items-center gap-4 group">
 <div className="w-full bg-emerald-500/20 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-[158px]">
 <div className="bg-emerald-500 w-full h-full transition-all group-hover:bg-emerald-600"></div>
 <div className="absolute inset-0 flex items-center justify-center text-th-heading font-bold text-sm tabular-nums">8,964</div>
 </div>
 <div className="text-center">
 <p className="text-emerald-500 text-sm font-bold">Approved</p>
 <p className="text-th-muted text-xs italic">72%</p>
 </div>
 </div>
 </div>
 </div>

 {/* Split View: Claims Grid & Analytics */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 {/* Left Column: Claim Status Grid (8/12) */}
 <div className="lg:col-span-8 flex flex-col gap-4">
 <div className="flex flex-wrap items-center justify-between gap-4 bg-th-surface-raised border border-th-border p-4 rounded-xl">
 <div className="flex gap-2">
 <select className="bg-th-surface-overlay/50 border border-th-border rounded-lg text-xs font-medium text-th-heading focus:ring-primary py-2 pl-3 pr-8">
 <option>Filter by Payer</option>
 <option>Aetna</option>
 <option>UnitedHealth</option>
 <option>BlueCross</option>
 </select>
 <select className="bg-th-surface-overlay/50 border border-th-border rounded-lg text-xs font-medium text-th-heading focus:ring-primary py-2 pl-3 pr-8">
 <option>Tax ID / NPI</option>
 </select>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-xs text-th-secondary font-medium">Displaying 1-10 of 1,240</span>
 <div className="flex gap-1">
 <button className="p-1 rounded bg-th-surface-overlay/50 text-th-secondary hover:text-primary transition-colors">
 <span className="material-symbols-outlined text-[20px]">chevron_left</span>
 </button>
 <button className="p-1 rounded bg-th-surface-overlay/50 text-th-secondary hover:text-primary transition-colors">
 <span className="material-symbols-outlined text-[20px]">chevron_right</span>
 </button>
 </div>
 </div>
 </div>
 <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-th-surface-overlay/50 border-b border-th-border">
 <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Claim ID</th>
 <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Payer</th>
 <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">NPI</th>
 <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted text-right">Amount</th>
 <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Status</th>
 <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">AI Prob.</th>
 <th className="px-4 py-3"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-700/30">
 {/* Row 1 */}
 <tr className="hover:bg-th-surface-overlay/30 transition-colors group cursor-pointer">
 <td className="px-4 py-4 font-mono text-sm text-primary">#CLM-4921-X</td>
 <td className="px-4 py-4 text-sm font-medium text-th-heading">UnitedHealthcare</td>
 <td className="px-4 py-4 text-sm text-th-secondary">1295810244</td>
 <td className="px-4 py-4 text-sm text-right font-bold text-th-heading tabular-nums">$12,400.00</td>
 <td className="px-4 py-4">
 <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 uppercase">Scrubbed</span>
 </td>
 <td className="px-4 py-4">
 <div className="flex items-center gap-2">
 <div className="w-12 h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="bg-primary h-full" style={{ width: '82%' }}></div>
 </div>
 <span className="text-xs font-bold text-th-heading tabular-nums">82%</span>
 </div>
 </td>
 <td className="px-4 py-4 text-right">
 <span className="material-symbols-outlined text-th-secondary group-hover:text-primary">expand_more</span>
 </td>
 </tr>
 {/* Expanded Details for Row 1 */}
 <tr className="bg-th-surface-overlay/20">
 <td className="px-4 py-4" colSpan="7">
 <div className="flex flex-col gap-4">
 <div className="flex items-center justify-between">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">AI Approval Probability History</p>
 <div className="flex flex-col items-end">
 <span className="text-[10px] text-th-muted uppercase">Current Variance</span>
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
 <div className="flex gap-6 mt-2 border-t border-th-border pt-4">
 <div className="flex items-start gap-2">
 <span className="material-symbols-outlined text-emerald-500 text-[18px]">verified</span>
 <div>
 <p className="text-xs font-bold text-th-heading">Patient Eligibility</p>
 <p className="text-[11px] text-th-secondary">Confirmed & Verified</p>
 </div>
 </div>
 <div className="flex items-start gap-2">
 <span className="material-symbols-outlined text-orange-400 text-[18px]">warning</span>
 <div>
 <p className="text-xs font-bold text-th-heading">Coding Accuracy</p>
 <p className="text-[11px] text-th-secondary">Modifier 25 Flagged</p>
 </div>
 </div>
 </div>
 </div>
 </td>
 </tr>

 {/* Row 2 */}
 <tr className="hover:bg-th-surface-overlay/30 transition-colors cursor-pointer group">
 <td className="px-4 py-4 font-mono text-sm text-primary">#CLM-1205-A</td>
 <td className="px-4 py-4 text-sm font-medium text-th-heading">Aetna Medicare</td>
 <td className="px-4 py-4 text-sm text-th-secondary">1023948571</td>
 <td className="px-4 py-4 text-sm text-right font-bold text-th-heading tabular-nums">$3,150.25</td>
 <td className="px-4 py-4">
 <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 uppercase">Approved</span>
 </td>
 <td className="px-4 py-4">
 <div className="flex items-center gap-2">
 <div className="w-12 h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="bg-emerald-500 h-full" style={{ width: '98%' }}></div>
 </div>
 <span className="text-xs font-bold text-th-heading tabular-nums">98%</span>
 </div>
 </td>
 <td className="px-4 py-4 text-right">
 <span className="material-symbols-outlined text-th-secondary group-hover:text-primary">expand_more</span>
 </td>
 </tr>

 {/* Row 3 */}
 <tr className="hover:bg-th-surface-overlay/30 transition-colors cursor-pointer group">
 <td className="px-4 py-4 font-mono text-sm text-primary">#CLM-8831-Z</td>
 <td className="px-4 py-4 text-sm font-medium text-th-heading">BlueCross BlueShield</td>
 <td className="px-4 py-4 text-sm text-th-secondary">1948203394</td>
 <td className="px-4 py-4 text-sm text-right font-bold text-th-heading tabular-nums">$42,910.00</td>
 <td className="px-4 py-4">
 <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-500 uppercase">Adjudicated</span>
 </td>
 <td className="px-4 py-4">
 <div className="flex items-center gap-2">
 <div className="w-12 h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="bg-primary h-full" style={{ width: '61%' }}></div>
 </div>
 <span className="text-xs font-bold text-th-heading tabular-nums">61%</span>
 </div>
 </td>
 <td className="px-4 py-4 text-right">
 <span className="material-symbols-outlined text-th-secondary group-hover:text-primary">expand_more</span>
 </td>
 </tr>

 {/* Row 4 */}
 <tr className="hover:bg-th-surface-overlay/30 transition-colors border-b-0 cursor-pointer group">
 <td className="px-4 py-4 font-mono text-sm text-primary">#CLM-2033-Q</td>
 <td className="px-4 py-4 text-sm font-medium text-th-heading">Humana Inc.</td>
 <td className="px-4 py-4 text-sm text-th-secondary">1442938477</td>
 <td className="px-4 py-4 text-sm text-right font-bold text-th-heading tabular-nums">$912.50</td>
 <td className="px-4 py-4">
 <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-red-500/10 text-red-500 uppercase">Denied</span>
 </td>
 <td className="px-4 py-4">
 <div className="flex items-center gap-2">
 <div className="w-12 h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="bg-red-500 h-full" style={{ width: '14%' }}></div>
 </div>
 <span className="text-xs font-bold text-th-heading tabular-nums">14%</span>
 </div>
 </td>
 <td className="px-4 py-4 text-right">
 <span className="material-symbols-outlined text-th-secondary group-hover:text-primary">expand_more</span>
 </td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 {/* Right Column: Dual Axis Chart & Insights (4/12) */}
 <div className="lg:col-span-4 flex flex-col gap-6">
 {/* CCR vs Approval Rate Chart */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-th-heading text-base font-bold">CCR vs. Approval Rate</h3>
 <button className="text-th-secondary hover:text-primary"><span className="material-symbols-outlined text-[18px]">info</span></button>
 </div>
 <div className="relative h-48 w-full flex items-end gap-3 px-2">
 {/* Chart Background Lines */}
 <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
 <div className="border-t border-th-border w-full"></div>
 <div className="border-t border-th-border w-full"></div>
 <div className="border-t border-th-border w-full"></div>
 </div>
 {/* Dual Axis Data Bars/Points */}
 <div className="flex-1 flex flex-col justify-end gap-1 relative group">
 <div className="w-full bg-th-surface-overlay rounded-t h-[90%] group-hover:bg-primary/20 transition-colors" title="CCR: 89%"></div>
 <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-[#111827] z-10 shadow-sm" title="Approval: 85%"></div>
 <span className="text-[9px] text-th-muted text-center mt-1 font-bold">W1</span>
 </div>
 <div className="flex-1 flex flex-col justify-end gap-1 relative group">
 <div className="w-full bg-th-surface-overlay rounded-t h-[75%] group-hover:bg-primary/20 transition-colors" title="CCR: 75%"></div>
 <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-[#111827] z-10 shadow-sm" title="Approval: 68%"></div>
 <span className="text-[9px] text-th-muted text-center mt-1 font-bold">W2</span>
 </div>
 <div className="flex-1 flex flex-col justify-end gap-1 relative group">
 <div className="w-full bg-th-surface-overlay rounded-t h-[82%] group-hover:bg-primary/20 transition-colors" title="CCR: 82%"></div>
 <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-[#111827] z-10 shadow-sm" title="Approval: 79%"></div>
 <span className="text-[9px] text-th-muted text-center mt-1 font-bold">W3</span>
 </div>
 <div className="flex-1 flex flex-col justify-end gap-1 relative group">
 <div className="w-full bg-th-surface-overlay rounded-t h-[95%] group-hover:bg-primary/20 transition-colors" title="CCR: 95%"></div>
 <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-[#111827] z-10 shadow-sm" title="Approval: 91%"></div>
 <span className="text-[9px] text-th-muted text-center mt-1 font-bold">W4</span>
 </div>
 </div>
 <div className="mt-6 flex justify-center gap-6">
 <div className="flex items-center gap-2">
 <span className="w-3 h-3 bg-th-surface-overlay rounded-sm"></span>
 <span className="text-[11px] font-medium text-th-secondary">Clean Claim Rate</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="w-3 h-3 bg-primary rounded-full border border-[#111827] shadow-sm"></span>
 <span className="text-[11px] font-medium text-th-secondary">Approval Rate</span>
 </div>
 </div>
 </div>

 {/* AI Smart Insights */}
 <div className="bg-primary/10 rounded-xl border border-primary/20 p-6">
 <div className="flex items-center gap-2 mb-4 text-primary">
 <span className="material-symbols-outlined text-[20px]">psychology</span>
 <h3 className="text-base font-bold">AI Insights</h3>
 <span className="ai-predictive">Predictive AI</span>
 </div>
 <ul className="space-y-4">
 <li className="flex gap-3">
 <span className="material-symbols-outlined text-emerald-500 text-[18px]">trending_up</span>
 <p className="text-xs leading-relaxed text-th-heading">
 <strong className="text-th-heading">High Correlation:</strong> Clean Claim Rate (CCR) is driving a 4.5% uptick in approval speed for Aetna claims.
 </p>
 </li>
 <li className="flex gap-3">
 <span className="material-symbols-outlined text-orange-400 text-[18px]">error</span>
 <p className="text-xs leading-relaxed text-th-heading">
 <strong className="text-th-heading">Alert:</strong> NPI #1023948571 has a 12% higher denial rate due to missing documentation on 'Modifier 59' codes.
 </p>
 </li>
 <li className="flex gap-3">
 <span className="material-symbols-outlined text-primary text-[18px]">lightbulb</span>
 <p className="text-xs leading-relaxed text-th-heading">
 <strong className="text-th-heading">Opportunity:</strong> Auto-scrubbing for UnitedHealth could improve net revenue by 2.1% if applied pre-submission.
 </p>
 </li>
 </ul>
 <button className="w-full mt-6 py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/20 hover:bg-primary/20 transition-colors">
 Run Automated Reconciliation
 </button>
 </div>

 {/* Payer Efficiency List */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <h3 className="text-th-heading text-base font-bold mb-4">Payer Efficiency Score</h3>
 <div className="space-y-4">
 <div className="flex flex-col gap-1.5">
 <div className="flex justify-between text-[11px] font-bold">
 <span className="text-th-heading">BlueCross</span>
 <span className="text-emerald-500 tabular-nums">92.4%</span>
 </div>
 <div className="w-full h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92.4%' }}></div>
 </div>
 </div>
 <div className="flex flex-col gap-1.5">
 <div className="flex justify-between text-[11px] font-bold">
 <span className="text-th-heading">Medicare</span>
 <span className="text-emerald-500 tabular-nums">88.1%</span>
 </div>
 <div className="w-full h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="bg-emerald-500 h-full rounded-full" style={{ width: '88.1%' }}></div>
 </div>
 </div>
 <div className="flex flex-col gap-1.5">
 <div className="flex justify-between text-[11px] font-bold">
 <span className="text-th-heading">UnitedHealth</span>
 <span className="text-orange-500 tabular-nums">76.5%</span>
 </div>
 <div className="w-full h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
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
