import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import {
 AIInsightCard,
 FilterChipGroup,
 DateRangePicker,
 PrescriptiveAction,
} from '../../../components/ui';

const STATIC_FALLBACK_PAYER_INSIGHTS = [
  {
    title: 'Aetna Systematic Underpayment',
    description: 'AI detected Aetna reimbursing 94.2% of contracted rate for CPT 99213-99215. Pattern consistent across 847 claims. Estimated underpayment: $124K YTD.',
    confidence: 94,
    impact: 'high',
    category: 'Diagnostic',
    action: 'File underpayment dispute',
    value: '$124K underpayment',
    icon: 'request_quote',
  },
  {
    title: 'Medicaid Days-to-Pay Forecast',
    description: 'Medicaid processing times forecast to increase 8.2 days in Q1 based on state budget cycle patterns. Recommend pre-submission accuracy push.',
    confidence: 81,
    impact: 'medium',
    category: 'Predictive',
    action: 'Submit claims early',
    value: '+8.2 day forecast',
    icon: 'calendar_today',
  },
  {
    title: 'Contract Renegotiation Opportunity',
    description: 'BCBS current rate is 7.8% below CMS benchmark for your specialty mix. Market rate analysis supports 9-12% rate increase in next renewal.',
    confidence: 79,
    impact: 'high',
    category: 'Prescriptive',
    action: 'Prepare negotiation brief',
    value: '9-12% rate increase',
    icon: 'handshake',
  },
];

export function PayerPerformance() {
 const [payerAiInsights, setPayerAiInsights] = useState(STATIC_FALLBACK_PAYER_INSIGHTS);
 const [aiLoading, setAiLoading] = useState(false);

 useEffect(() => {
   setAiLoading(true);
   api.ai.getInsights('payer-performance').then(r => {
     if (r?.insights?.length) setPayerAiInsights(r.insights);
     setAiLoading(false);
   }).catch(() => setAiLoading(false));
 }, []);

 /* ── Filter state ──────────────────────────────────── */
 const [filterDateRange, setFilterDateRange] = useState(null);
 const [filterPayer, setFilterPayer] = useState('All');
 const [filterMetric, setFilterMetric] = useState('All Metrics');
 const [filterComparison, setFilterComparison] = useState('vs Prior Period');

 const activeChips = [
  ...(filterDateRange ? [{ key: 'dateRange', label: 'Date', value: filterDateRange.label, color: 'blue' }] : []),
  ...(filterPayer !== 'All' ? [{ key: 'payer', label: 'Payer', value: filterPayer, color: 'blue' }] : []),
  ...(filterMetric !== 'All Metrics' ? [{ key: 'metric', label: 'Metric', value: filterMetric, color: 'purple' }] : []),
  ...(filterComparison !== 'vs Prior Period' ? [{ key: 'comparison', label: 'Compare', value: filterComparison, color: 'emerald' }] : []),
 ];

 const handleChipRemove = (key) => {
  if (key === 'dateRange') setFilterDateRange(null);
  if (key === 'payer') setFilterPayer('All');
  if (key === 'metric') setFilterMetric('All Metrics');
  if (key === 'comparison') setFilterComparison('vs Prior Period');
 };

 const clearAllFilters = () => {
  setFilterDateRange(null);
  setFilterPayer('All');
  setFilterMetric('All Metrics');
  setFilterComparison('vs Prior Period');
 };

 const FilterSelect = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-1">
   <label className="text-xs font-semibold uppercase tracking-wider text-th-muted">{label}</label>
   <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="bg-th-surface-base border border-th-border text-th-heading text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
   >
    {options.map((o) => <option key={o} value={o}>{o}</option>)}
   </select>
  </div>
 );

 return (
 <div className="flex-1 overflow-y-auto font-sans h-full">
 <div className="max-w-[1600px] mx-auto p-6 space-y-6">
 {/* Page Heading */}
 <div className="flex flex-wrap justify-between items-end gap-4">
 <div className="flex flex-col gap-1">
 <div className="flex items-center gap-2 mb-1">
 <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
 <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">System Status: AI Pulse Active</span>
 </div>
 <h1 className="text-th-heading text-3xl font-black leading-tight tracking-tight">Payer Intelligence & Performance</h1>
 <p className="text-th-secondary text-sm max-w-2xl">Real-time AI-native revenue cycle insights and contract performance monitoring across the enterprise network.</p>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-th-heading text-sm font-bold gap-2 shadow-lg shadow-primary/20 hover:bg-blue-700 transition-colors">
 <span className="material-symbols-outlined text-lg">ios_share</span>
 Export Intelligence
 </button>
 </div>
 </div>

 {/* ── Enhanced Filter Bar ─────────────────────────── */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-5 space-y-3">
 <div className="flex flex-wrap items-end gap-3">
 <div className="flex flex-col gap-1">
 <label className="text-xs font-semibold uppercase tracking-wider text-th-muted">Date Range</label>
 <DateRangePicker value={filterDateRange?.label} onChange={setFilterDateRange} />
 </div>
 <FilterSelect
 label="Payer"
 value={filterPayer}
 onChange={setFilterPayer}
 options={['All', 'Medicare', 'Medicaid', 'UnitedHealthcare', 'Aetna', 'BCBS', 'Cigna', 'Humana']}
 />
 <FilterSelect
 label="Metric View"
 value={filterMetric}
 onChange={setFilterMetric}
 options={['All Metrics', 'Denial Rate', 'Days to Pay', 'Clean Claim Rate', 'Underpayment']}
 />
 <FilterSelect
 label="Comparison Period"
 value={filterComparison}
 onChange={setFilterComparison}
 options={['vs Prior Period', 'vs Budget', 'vs MGMA Benchmark']}
 />
 </div>
 {activeChips.length > 0 && (
 <FilterChipGroup
 filters={activeChips}
 onRemove={handleChipRemove}
 onClearAll={clearAllFilters}
 />
 )}
 </div>

 {/* ── AI Payer Intelligence ──────────────────────── */}
 <div className="mb-6">
 <div className="flex items-center gap-2 mb-3">
 <span className="material-icons text-purple-400 text-sm">auto_awesome</span>
 <span className="text-th-secondary text-xs font-semibold uppercase tracking-wider">AI Intelligence</span>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
 {aiLoading ? (
   [1, 2, 3].map(i => (
     <div key={i} className="bg-th-surface-raised border border-th-border rounded-xl p-5 space-y-3 animate-pulse">
       <div className="h-4 w-3/4 bg-th-surface-overlay rounded" />
       <div className="h-3 w-full bg-th-surface-overlay rounded" />
       <div className="h-3 w-1/2 bg-th-surface-overlay rounded" />
     </div>
   ))
 ) : (
   payerAiInsights.map((insight, i) => (
     <AIInsightCard key={i} {...insight} />
   ))
 )}
 </div>
 <PrescriptiveAction
 title="AI Recommended Actions"
 actions={[
 { title: 'File Aetna Underpayment Dispute', description: 'Submit systematic underpayment dispute for 847 claims across CPT 99213-99215', priority: 'critical', effort: 'short-term', impact: '$124K recovery', icon: 'gavel', tag: 'AI Recommended' },
 { title: 'BCBS Contract Renegotiation', description: 'Leverage 7.8% below-benchmark data to negotiate 9–12% rate increase at next renewal', priority: 'high', effort: 'long-term', impact: '9–12% rate increase', icon: 'handshake', tag: 'Strategic' },
 ]}
 />
 </div>

 {/* KPI Stats */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <div className="flex flex-col gap-2 rounded-xl p-5 bg-th-surface-raised border border-th-border border-l-[3px] border-l-red-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Weighted Denial Rate</p>
 <span className="ai-descriptive">Descriptive AI</span>
 </div>
 <div className="flex items-baseline gap-2">
 <p className="text-th-heading text-2xl font-bold tabular-nums">12.4%</p>
 <p className="text-rose-500 text-xs font-bold flex items-center tabular-nums">-1.2% <span className="material-symbols-outlined text-[10px]">arrow_downward</span></p>
 </div>
 <div className="mt-2 h-1 w-full bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="h-full bg-rose-500 rounded-full" style={{ width: '72%' }}></div>
 </div>
 </div>
 <div className="flex flex-col gap-2 rounded-xl p-5 bg-th-surface-raised border border-th-border border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Underpayment Leakage</p>
 <span className="ai-descriptive">Descriptive AI</span>
 </div>
 <div className="flex items-baseline gap-2">
 <p className="text-th-heading text-2xl font-bold tabular-nums">-$2.41M</p>
 <p className="text-emerald-500 text-xs font-bold flex items-center tabular-nums">+4.5% <span className="material-symbols-outlined text-[10px]">arrow_upward</span></p>
 </div>
 <div className="mt-2 h-1 w-full bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }}></div>
 </div>
 </div>
 <div className="flex flex-col gap-2 rounded-xl p-5 bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Avg. Days to Pay</p>
 <span className="ai-descriptive">Descriptive AI</span>
 </div>
 <div className="flex items-baseline gap-2">
 <p className="text-th-heading text-2xl font-bold tabular-nums">34 Days</p>
 <p className="text-rose-500 text-xs font-bold flex items-center tabular-nums">-2.4 <span className="material-symbols-outlined text-[10px]">arrow_downward</span></p>
 </div>
 <div className="mt-2 h-1 w-full bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="h-full bg-primary rounded-full" style={{ width: '65%' }}></div>
 </div>
 </div>
 <div className="flex flex-col gap-2 rounded-xl p-5 bg-th-surface-raised border border-th-border border-l-[3px] border-l-purple-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Clean Claim Rate</p>
 <span className="ai-descriptive">Descriptive AI</span>
 </div>
 <div className="flex items-baseline gap-2">
 <p className="text-th-heading text-2xl font-bold tabular-nums">92.8%</p>
 <p className="text-emerald-500 text-xs font-bold flex items-center tabular-nums">+0.8% <span className="material-symbols-outlined text-[10px]">arrow_upward</span></p>
 </div>
 <div className="mt-2 h-1 w-full bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="h-full bg-primary rounded-full" style={{ width: '92%' }}></div>
 </div>
 </div>
 </div>

 {/* Main Content Grid */}
 <div className="grid grid-cols-12 gap-6">
 {/* Left/Center Column */}
 <div className="col-span-12 lg:col-span-9 space-y-6">
 {/* Payer Comparison Matrix */}
 <div className="rounded-xl border border-th-border bg-th-surface-raised overflow-hidden">
 <div className="flex items-center justify-between p-4 border-b border-th-border">
 <h3 className="text-lg font-bold text-th-heading flex items-center gap-2">
 Payer Comparison Matrix
 <span className="ai-diagnostic">Diagnostic AI</span>
 </h3>
 <div className="flex gap-2">
 <button className="text-xs font-semibold px-3 py-1 bg-th-surface-overlay rounded-md text-th-heading">Aggregated View</button>
 <button className="text-xs font-semibold px-3 py-1 text-th-secondary hover:text-th-heading">By Facility</button>
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-[#0f1623]">
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Payer Name</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Approval Rate</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Avg. Days to Pay</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Denial Rate</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted text-right">Yield Trend</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-th-border">
 <tr className="hover:bg-th-surface-overlay/30 transition-colors">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center font-bold text-xs">M</div>
 <span className="font-bold text-sm text-th-heading">Medicare (CMS)</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-900/30 text-emerald-400 text-xs font-bold border border-emerald-900/50 tabular-nums">
 94.2%
 </div>
 </td>
 <td className="px-6 py-4 text-sm font-medium text-th-heading tabular-nums">28 Days</td>
 <td className="px-6 py-4">
 <span className="text-xs px-2 py-0.5 rounded bg-th-surface-overlay text-th-secondary font-semibold uppercase">5.8% Low</span>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-3">
 <div className="w-24 h-2 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="h-full bg-primary" style={{ width: '92%' }}></div>
 </div>
 <span className="text-sm font-bold text-th-heading tabular-nums">92</span>
 </div>
 </td>
 </tr>
 <tr className="hover:bg-th-surface-overlay/30 transition-colors">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-indigo-900/30 text-indigo-400 flex items-center justify-center font-bold text-xs">U</div>
 <span className="font-bold text-sm text-th-heading">UnitedHealthcare</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-900/30 text-amber-400 text-xs font-bold border border-amber-900/50 tabular-nums">
 88.5%
 </div>
 </td>
 <td className="px-6 py-4 text-sm font-medium text-th-heading tabular-nums">42 Days</td>
 <td className="px-6 py-4">
 <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold uppercase">11.5% Medium</span>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-3">
 <div className="w-24 h-2 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="h-full bg-primary" style={{ width: '84%' }}></div>
 </div>
 <span className="text-sm font-bold text-th-heading tabular-nums">84</span>
 </div>
 </td>
 </tr>
 <tr className="hover:bg-th-surface-overlay/30 transition-colors">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-rose-900/30 text-rose-400 flex items-center justify-center font-bold text-xs">A</div>
 <span className="font-bold text-sm text-th-heading">Aetna Health</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-900/30 text-rose-400 text-xs font-bold border border-rose-900/50 tabular-nums">
 82.1%
 </div>
 </td>
 <td className="px-6 py-4 text-sm font-medium text-th-heading tabular-nums">38 Days</td>
 <td className="px-6 py-4">
 <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-semibold uppercase">17.9% High</span>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-3">
 <div className="w-24 h-2 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="h-full bg-primary" style={{ width: '76%' }}></div>
 </div>
 <span className="text-sm font-bold text-th-heading tabular-nums">76</span>
 </div>
 </td>
 </tr>
 <tr className="hover:bg-th-surface-overlay/30 transition-colors">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-cyan-900/30 text-cyan-400 flex items-center justify-center font-bold text-xs">B</div>
 <span className="font-bold text-sm text-th-heading">BCBS Network</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-900/30 text-emerald-400 text-xs font-bold border border-emerald-900/50 tabular-nums">
 91.8%
 </div>
 </td>
 <td className="px-6 py-4 text-sm font-medium text-th-heading tabular-nums">31 Days</td>
 <td className="px-6 py-4">
 <span className="text-xs px-2 py-0.5 rounded bg-th-surface-overlay text-th-secondary font-semibold uppercase">8.2% Low</span>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-3">
 <div className="w-24 h-2 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="h-full bg-primary" style={{ width: '90%' }}></div>
 </div>
 <span className="text-sm font-bold text-th-heading tabular-nums">90</span>
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
 <div className="rounded-xl border border-th-border bg-th-surface-raised p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between mb-6">
 <h3 className="font-bold flex items-center gap-2 text-th-heading">
 <span className="material-symbols-outlined text-primary">gavel</span>
 Contract Compliance
 </h3>
 <button className="text-primary text-xs font-bold hover:underline">View All Variances</button>
 </div>
 <div className="space-y-6">
 <div className="space-y-2">
 <div className="flex justify-between text-xs font-bold">
 <span className="text-th-secondary">Medicare Outpatient</span>
 <span className="text-rose-500 tabular-nums">-$420k Variance</span>
 </div>
 <div className="relative h-4 w-full bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="absolute h-full bg-primary/20" style={{ width: '100%' }}></div>
 <div className="absolute h-full bg-primary shadow-[0_0_10px_rgba(19,91,236,0.3)]" style={{ width: '82%' }}></div>
 <div className="absolute right-[18%] top-0 h-full w-0.5 bg-rose-500 z-10"></div>
 </div>
 <div className="flex justify-between text-[10px] font-medium text-th-secondary">
 <span>Actual: $1.82M</span>
 <span>Target: $2.24M</span>
 </div>
 </div>
 <div className="space-y-2">
 <div className="flex justify-between text-xs font-bold">
 <span className="text-th-secondary">UnitedHealth Inpatient</span>
 <span className="text-emerald-500 tabular-nums">+$112k Surplus</span>
 </div>
 <div className="relative h-4 w-full bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="absolute h-full bg-primary/20" style={{ width: '100%' }}></div>
 <div className="absolute h-full bg-primary" style={{ width: '96%' }}></div>
 <div className="absolute right-[4%] top-0 h-full w-0.5 bg-emerald-500 z-10"></div>
 </div>
 <div className="flex justify-between text-[10px] font-medium text-th-secondary">
 <span>Actual: $4.1M</span>
 <span>Target: $3.9M</span>
 </div>
 </div>
 <div className="space-y-2">
 <div className="flex justify-between text-xs font-bold">
 <span className="text-th-secondary">BCBS Professional</span>
 <span className="text-th-secondary">On Track</span>
 </div>
 <div className="relative h-4 w-full bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="absolute h-full bg-primary/20" style={{ width: '100%' }}></div>
 <div className="absolute h-full bg-primary" style={{ width: '99%' }}></div>
 </div>
 <div className="flex justify-between text-[10px] font-medium text-th-secondary">
 <span>Actual: $840k</span>
 <span>Target: $845k</span>
 </div>
 </div>
 </div>
 </div>
 {/* AI Payer Behavior */}
 <div className="rounded-xl border border-th-border bg-th-surface-raised p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between mb-6">
 <h3 className="font-bold flex items-center gap-2 text-th-heading">
 <span className="material-symbols-outlined text-primary">psychology</span>
 AI Payer Behavior
 <span className="ai-predictive">Predictive AI</span>
 </h3>
 <div className="flex gap-1">
 <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
 <span className="h-1.5 w-1.5 rounded-full bg-primary/30"></span>
 </div>
 </div>
 <div className="space-y-4">
 <div className="p-3 bg-th-surface-overlay/50 rounded-lg border-l-4 border-primary">
 <p className="text-xs font-bold text-primary uppercase mb-1 flex items-center gap-2">
 <span className="material-symbols-outlined text-sm">trending_up</span>
 Policy Shift Predicted
 </p>
 <p className="text-sm font-medium leading-relaxed text-th-heading">
 <span className="font-bold">Medicare Advantage</span> is showing a <span className="text-rose-500">22% surge</span> in Orthopedic pre-auth denials. Shift in adjudication patterns detected for CPT 27447.
 </p>
 <p className="text-[10px] text-th-muted mt-2">Predicted Impact: -$140k/month -- Confidence: <span className="tabular-nums">88%</span></p>
 </div>
 <div className="p-3 bg-th-surface-overlay/50 rounded-lg border-l-4 border-emerald-500">
 <p className="text-xs font-bold text-emerald-500 uppercase mb-1 flex items-center gap-2">
 <span className="material-symbols-outlined text-sm">task_alt</span>
 Payment Acceleration
 </p>
 <p className="text-sm font-medium leading-relaxed text-th-heading">
 <span className="font-bold">Aetna</span> claims cycle time decreased by 4.2 days following EDI 835 optimization. AI projects sustained performance through Q3.
 </p>
 <p className="text-[10px] text-th-muted mt-2">Cash Flow Impact: +$210k Liquidity -- Confidence: <span className="tabular-nums">94%</span></p>
 </div>
 <div className="p-3 bg-th-surface-overlay/50 rounded-lg border-l-4 border-amber-500">
 <p className="text-xs font-bold text-amber-500 uppercase mb-1 flex items-center gap-2">
 <span className="material-symbols-outlined text-sm">bolt</span>
 Renewal Trigger
 </p>
 <p className="text-sm font-medium leading-relaxed text-th-heading">
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
 <div className="rounded-xl border border-th-border bg-primary/5 p-5 border-t-4 border-t-primary">
 <div className="flex items-center gap-2 mb-4">
 <div className="bg-primary text-th-heading p-1.5 rounded-lg">
 <span className="material-symbols-outlined text-xl">insights</span>
 </div>
 <div>
 <h3 className="font-bold text-sm text-th-heading">Negotiation Insights</h3>
 <p className="text-[10px] text-primary font-bold uppercase tracking-tighter">AI Renewal Engine</p>
 </div>
 </div>
 <div className="space-y-4">
 <div className="p-4 bg-th-surface-raised rounded-xl border border-primary/20 relative overflow-hidden">
 <div className="absolute top-0 right-0 p-2 opacity-10">
 <span className="material-symbols-outlined text-4xl">contract</span>
 </div>
 <h4 className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">Upcoming Expiry</h4>
 <p className="font-bold text-lg mb-1 text-th-heading">Aetna Commercial</p>
 <p className="text-xs font-medium text-th-muted mb-3">Expires: Oct 12, 2024 (64 Days)</p>
 <div className="space-y-3 pt-3 border-t border-th-border">
 <div className="flex items-start gap-2">
 <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
 <p className="text-xs font-medium leading-tight text-th-heading">Propose 4.2% increase in Level 4/5 E&M rates based on volume shifts.</p>
 </div>
 <div className="flex items-start gap-2">
 <span className="material-symbols-outlined text-emerald-500 text-lg">payments</span>
 <p className="text-xs font-medium leading-tight text-th-heading">Projected annual revenue lift: <span className="text-emerald-500 font-bold tabular-nums">+$840,000</span></p>
 </div>
 <div className="flex items-start gap-2">
 <span className="material-symbols-outlined text-rose-500 text-lg">warning_amber</span>
 <p className="text-xs font-medium leading-tight text-th-heading">Action required: Audit high-cost imaging outlier payments before Aug 20.</p>
 </div>
 </div>
 <button className="w-full mt-4 bg-primary text-th-heading py-2.5 rounded-lg text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
 Start Negotiation Prep
 <span className="material-symbols-outlined text-sm">arrow_forward</span>
 </button>
 </div>
 {/* Secondary Insights */}
 <div className="space-y-3">
 <h4 className="text-[10px] font-black text-th-muted uppercase tracking-widest px-1">Network Stability Monitoring</h4>
 <div className="flex items-center gap-3 p-3 bg-th-surface-raised rounded-lg border border-th-border hover:border-th-border-strong transition-colors cursor-pointer">
 <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
 <div className="flex-1">
 <p className="text-xs font-bold text-th-heading">UHC Contract Status</p>
 <p className="text-[10px] text-th-muted">Compliance at <span className="tabular-nums">98.4%</span> -- Green Zone</p>
 </div>
 <span className="material-symbols-outlined text-th-secondary text-sm">chevron_right</span>
 </div>
 <div className="flex items-center gap-3 p-3 bg-th-surface-raised rounded-lg border border-th-border hover:border-th-border-strong transition-colors cursor-pointer">
 <div className="h-2 w-2 rounded-full bg-amber-500"></div>
 <div className="flex-1">
 <p className="text-xs font-bold text-th-heading">BCBS Rate Parity</p>
 <p className="text-[10px] text-th-muted"><span className="tabular-nums">3.2%</span> deviation detected in Region 4</p>
 </div>
 <span className="material-symbols-outlined text-th-secondary text-sm">chevron_right</span>
 </div>
 </div>
 </div>
 </div>
 {/* System Load / Data Freshness */}
 <div className="rounded-xl border border-th-border bg-th-surface-raised p-4">
 <p className="text-[10px] font-bold text-th-muted uppercase mb-3">Real-time Data Ingestion</p>
 <div className="flex items-center gap-4">
 <div className="flex-1 space-y-1">
 <div className="flex justify-between text-[10px]">
 <span className="text-th-muted">Claim Streams</span>
 <span className="text-primary font-bold tabular-nums">99.9%</span>
 </div>
 <div className="h-1 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="h-full bg-primary" style={{ width: '99.9%' }}></div>
 </div>
 </div>
 <div className="flex-1 space-y-1">
 <div className="flex justify-between text-[10px]">
 <span className="text-th-muted">AI Processing</span>
 <span className="text-emerald-500 font-bold">Optimal</span>
 </div>
 <div className="h-1 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="h-full bg-emerald-500" style={{ width: '85%' }}></div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
