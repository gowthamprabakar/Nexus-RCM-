import React from 'react';

export function Reporting() {
 return (
 <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 max-w-[1600px] mx-auto font-sans">
 {/* Page Heading */}
 <div className="flex justify-between items-end">
 <div>
 <h1 className="text-3xl font-black tracking-tight text-th-heading">Revenue Forecasting & Modeling</h1>
 <p className="text-th-secondary mt-2 flex items-center gap-2">
 <span className="material-symbols-outlined text-primary text-lg">verified_user</span>
 AI-powered 90-day predictive analysis with +/-2% confidence interval
 </p>
 </div>
 <div className="flex gap-3">
 <button className="bg-th-surface-raised border border-th-border text-th-heading px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-th-surface-overlay transition-colors">
 <span className="material-symbols-outlined text-sm">calendar_month</span> Last 90 Days
 </button>
 <button className="bg-th-surface-raised border border-th-border text-th-heading px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-th-surface-overlay transition-colors">
 <span className="material-symbols-outlined text-sm">filter_alt</span> Global Filters
 </button>
 </div>
 </div>

 {/* Main Chart Section */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 shadow-sm">
 <div className="flex justify-between items-start mb-6">
 <div>
 <div className="flex items-center gap-3 mb-1">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">90-Day Revenue Forecast</p>
 <span className="ai-predictive">Predictive AI</span>
 </div>
 <h3 className="text-3xl font-bold text-th-heading mt-1 tabular-nums">$12.4M Projected</h3>
 </div>
 <div className="flex gap-4 items-center">
 <div className="flex items-center gap-2">
 <span className="size-3 rounded-full bg-primary"></span>
 <span className="text-xs font-bold text-th-muted">Baseline</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="size-3 rounded-full bg-[#0bda5e]"></span>
 <span className="text-xs font-bold text-th-muted">Optimistic</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="size-3 rounded-full bg-orange-500"></span>
 <span className="text-xs font-bold text-th-muted">Pessimistic</span>
 </div>
 </div>
 </div>
 <div className="relative h-[320px] w-full">
 <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
 <path d="M0 210 Q 150 180, 300 200 T 600 150 T 1000 120 L 1000 160 Q 700 190, 600 180 T 300 230 T 0 240 Z" fill="rgba(19, 91, 236, 0.08)"></path>
 <path d="M0 250 Q 150 240, 300 260 T 600 220 T 1000 200" fill="none" opacity="0.6" stroke="#f97316" strokeDasharray="4 4" strokeWidth="2"></path>
 <path d="M0 180 Q 150 160, 300 140 T 600 100 T 1000 70" fill="none" opacity="0.6" stroke="#0bda5e" strokeDasharray="4 4" strokeWidth="2"></path>
 <path className="drop-shadow-[0_0_8px_rgba(19,91,236,0.4)]" d="M0 220 Q 150 210, 300 225 T 600 170 T 1000 140" fill="none" stroke="#135bec" strokeWidth="4"></path>
 <line stroke="rgba(100,116,139,0.2)" strokeWidth="1" x1="250" x2="250" y1="0" y2="300"></line>
 <line stroke="rgba(100,116,139,0.2)" strokeWidth="1" x1="500" x2="500" y1="0" y2="300"></line>
 <line stroke="rgba(100,116,139,0.2)" strokeWidth="1" x1="750" x2="750" y1="0" y2="300"></line>
 </svg>
 <div className="flex justify-between mt-4 text-xs font-bold text-th-muted uppercase tracking-widest px-2">
 <span>Current (Day 0)</span>
 <span>Day 30</span>
 <span>Day 60</span>
 <span>Day 90 (Forecast)</span>
 </div>
 </div>
 </div>

 {/* Scenario Modeling Section */}
 <div>
 <h2 className="text-2xl font-bold mb-4 text-th-heading">Scenario Modeling</h2>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {/* Optimistic Card */}
 <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-emerald-500 p-5 rounded-xl group hover:border-[#0bda5e]/50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start mb-6">
 <div className="size-10 bg-[#0bda5e]/10 text-[#0bda5e] rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined">trending_up</span>
 </div>
 <span className="bg-[#0bda5e]/20 text-[#0bda5e] text-[10px] font-bold px-2 py-1 rounded uppercase">Active</span>
 </div>
 <h4 className="text-th-heading font-bold text-lg">Optimistic</h4>
 <p className="text-th-secondary text-sm mb-4">+8.5% Above Baseline</p>
 <div className="space-y-4">
 <div>
 <div className="flex justify-between text-xs mb-2">
 <span className="text-th-secondary">Denial Reduction</span>
 <span className="text-[#0bda5e] font-bold tabular-nums">-4.2%</span>
 </div>
 <input className="w-full h-1.5 bg-th-surface-overlay rounded-lg appearance-none cursor-pointer accent-[#0bda5e]" type="range" />
 </div>
 <div>
 <div className="flex justify-between text-xs mb-2">
 <span className="text-th-secondary">Payer Mix Shift</span>
 <span className="text-[#0bda5e] font-bold tabular-nums">+2.0%</span>
 </div>
 <input className="w-full h-1.5 bg-th-surface-overlay rounded-lg appearance-none cursor-pointer accent-[#0bda5e]" type="range" />
 </div>
 </div>
 </div>
 {/* Baseline Card */}
 <div className="bg-primary/5 border border-primary/30 p-5 rounded-xl ring-2 ring-primary relative overflow-hidden">
 <div className="flex justify-between items-start mb-6">
 <div className="size-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined">check_circle</span>
 </div>
 <span className="bg-primary text-th-heading text-[10px] font-bold px-2 py-1 rounded uppercase">Current</span>
 </div>
 <h4 className="text-th-heading font-bold text-lg">Baseline</h4>
 <p className="text-th-secondary text-sm mb-4">Standard Projection</p>
 <div className="space-y-4">
 <div className="bg-black/20 p-3 rounded-lg flex items-center justify-between">
 <span className="text-xs text-th-secondary">AI Confidence</span>
 <span className="text-xs font-bold text-primary tabular-nums">98.4%</span>
 </div>
 <div className="bg-black/20 p-3 rounded-lg flex items-center justify-between">
 <span className="text-xs text-th-secondary">Standard Variance</span>
 <span className="text-xs font-bold text-th-heading tabular-nums">+/-$240k</span>
 </div>
 </div>
 </div>
 {/* Pessimistic Card */}
 <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-amber-500 p-5 rounded-xl group hover:border-orange-500/50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start mb-6">
 <div className="size-10 bg-orange-500/10 text-orange-500 rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined">trending_down</span>
 </div>
 </div>
 <h4 className="text-th-heading font-bold text-lg">Pessimistic</h4>
 <p className="text-th-secondary text-sm mb-4">-3.2% Below Baseline</p>
 <div className="space-y-4">
 <div>
 <div className="flex justify-between text-xs mb-2">
 <span className="text-th-secondary">Staffing Shortage</span>
 <span className="text-orange-500 font-bold tabular-nums">+15% Impact</span>
 </div>
 <input className="w-full h-1.5 bg-th-surface-overlay rounded-lg appearance-none cursor-pointer accent-orange-500" type="range" />
 </div>
 <div>
 <div className="flex justify-between text-xs mb-2">
 <span className="text-th-secondary">Policy Shift</span>
 <span className="text-orange-500 font-bold tabular-nums">-1.5%</span>
 </div>
 <input className="w-full h-1.5 bg-th-surface-overlay rounded-lg appearance-none cursor-pointer accent-orange-500" type="range" />
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Monthly Breakdown Table */}
 <div className="lg:col-span-2 bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
 <div className="p-6 border-b border-th-border flex justify-between items-center">
 <div className="flex items-center gap-3">
 <h3 className="font-bold text-lg text-th-heading">Monthly Breakdown & Variance</h3>
 <span className="ai-descriptive">Descriptive AI</span>
 </div>
 <button className="text-primary text-sm font-bold flex items-center gap-1 hover:text-primary/80">
 <span className="material-symbols-outlined text-sm">download</span> Full CSV Export
 </button>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead>
 <tr className="bg-th-surface-overlay/50 text-th-secondary font-bold">
 <th className="px-6 py-4">Month</th>
 <th className="px-6 py-4">Projected Revenue</th>
 <th className="px-6 py-4">Actual Revenue</th>
 <th className="px-6 py-4">Variance ($)</th>
 <th className="px-6 py-4">Variance (%)</th>
 <th className="px-6 py-4">Trend</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-th-border">
 <tr className="hover:bg-th-surface-overlay/30 transition-colors">
 <td className="px-6 py-4 font-bold text-th-heading">October 2023</td>
 <td className="px-6 py-4 text-th-heading tabular-nums">$4,120,000</td>
 <td className="px-6 py-4 text-th-heading tabular-nums">$4,285,400</td>
 <td className="px-6 py-4 text-[#0bda5e] tabular-nums">+$165,400</td>
 <td className="px-6 py-4 text-[#0bda5e] font-bold tabular-nums">+4.01%</td>
 <td className="px-6 py-4">
 <svg className="w-16 h-6" viewBox="0 0 100 40">
 <path d="M0 30 Q 25 10, 50 25 T 100 5" fill="none" stroke="#0bda5e" strokeWidth="2"></path>
 </svg>
 </td>
 </tr>
 <tr className="hover:bg-th-surface-overlay/30 transition-colors">
 <td className="px-6 py-4 font-bold text-th-heading">November 2023</td>
 <td className="px-6 py-4 text-th-heading tabular-nums">$4,250,000</td>
 <td className="px-6 py-4 text-th-heading tabular-nums">$4,198,000</td>
 <td className="px-6 py-4 text-orange-500 tabular-nums">-$52,000</td>
 <td className="px-6 py-4 text-orange-500 font-bold tabular-nums">-1.22%</td>
 <td className="px-6 py-4">
 <svg className="w-16 h-6" viewBox="0 0 100 40">
 <path d="M0 10 Q 25 35, 50 15 T 100 30" fill="none" stroke="#f97316" strokeWidth="2"></path>
 </svg>
 </td>
 </tr>
 <tr className="hover:bg-th-surface-overlay/30 transition-colors">
 <td className="px-6 py-4 font-bold text-primary italic">December 2023 (Est.)</td>
 <td className="px-6 py-4 text-th-heading tabular-nums">$4,350,000</td>
 <td className="px-6 py-4 text-th-muted">--</td>
 <td className="px-6 py-4 text-th-muted">--</td>
 <td className="px-6 py-4 text-th-muted">--</td>
 <td className="px-6 py-4">--</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 {/* Right Sidebar: Predictive Drivers */}
 <aside className="bg-th-surface-raised border border-th-border p-6 flex flex-col gap-6 rounded-xl">
 <div>
 <h3 className="text-xl font-bold flex items-center gap-2 text-th-heading">
 <span className="material-symbols-outlined text-primary">psychology</span>
 Predictive Drivers
 </h3>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mt-1">Top AI Insights</p>
 </div>
 <div className="space-y-4">
 <div className="p-4 rounded-xl bg-th-surface-overlay/40 border border-th-border hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center gap-3 mb-2">
 <span className="material-symbols-outlined text-blue-400">ac_unit</span>
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Seasonal</span>
 </div>
 <p className="text-sm font-bold text-th-heading">Respiratory Surge Projection</p>
 <p className="text-xs text-th-secondary mt-2 leading-relaxed">
 Seasonal patterns indicate a 15% increase in respiratory-related visits over next 30 days. Estimated impact: <span className="text-[#0bda5e] tabular-nums">+$420k</span>.
 </p>
 </div>
 <div className="p-4 rounded-xl bg-th-surface-overlay/40 border border-th-border hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center gap-3 mb-2">
 <span className="material-symbols-outlined text-purple-400">gavel</span>
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Policy Update</span>
 </div>
 <p className="text-sm font-bold text-th-heading">Medicare Part B Revision</p>
 <p className="text-xs text-th-secondary mt-2 leading-relaxed">
 New Medicare reimbursement rates for outpatient services effective Q1. Predictive model adjusts baseline by <span className="text-orange-400 tabular-nums">-0.8%</span>.
 </p>
 </div>
 <div className="p-4 rounded-xl bg-th-surface-overlay/40 border border-th-border hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center gap-3 mb-2">
 <span className="material-symbols-outlined text-green-400">groups</span>
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Operational</span>
 </div>
 <p className="text-sm font-bold text-th-heading">Staffing Efficiency Gains</p>
 <p className="text-xs text-th-secondary mt-2 leading-relaxed">
 Optimized scheduling at North Wing reduced overtime by 12%. Projected quarterly savings: <span className="text-[#0bda5e] tabular-nums">$85,000</span>.
 </p>
 </div>
 </div>
 {/* AI Recommendations */}
 <div className="mt-auto pt-6 border-t border-th-border">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-4">AI Recommendations</p>
 <div className="space-y-3">
 <button className="w-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold p-3 rounded-lg flex items-center justify-between transition-all">
 Review Denial Hotspots
 <span className="material-symbols-outlined text-sm">chevron_right</span>
 </button>
 <button className="w-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold p-3 rounded-lg flex items-center justify-between transition-all">
 Optimize Payer Outreach
 <span className="material-symbols-outlined text-sm">chevron_right</span>
 </button>
 </div>
 </div>
 </aside>
 </div>
 </div>
 );
}
