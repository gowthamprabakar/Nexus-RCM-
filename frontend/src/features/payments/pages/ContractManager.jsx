import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

const AIBadge = ({ level }) => {
 const config = {
 Descriptive: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
 Diagnostic: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
 Predictive: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
 Prescriptive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
 };
 return (
 <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${config[level]}`}>
 {level}
 </span>
 );
};

const fmt = (n) => {
 if (n < 0) return '-$' + Math.abs(n).toLocaleString();
 return '$' + n.toLocaleString();
};

const statusColors = {
 'Active': 'bg-emerald-500/10 text-emerald-400',
 'Expiring Soon': 'bg-amber-500/10 text-amber-400',
 'Expired': 'bg-red-500/10 text-red-400',
};

export function ContractManager() {
 const [activeView, setActiveView] = useState('payers');
 const [selectedPayer, setSelectedPayer] = useState(null);
 const [loading, setLoading] = useState(true);
 const [underpaymentData, setUnderpaymentData] = useState({ items: [], total: 0, total_variance: 0 });
 const [summary, setSummary] = useState(null);
 const [payers, setPayers] = useState([]);

 useEffect(() => {
  let cancelled = false;
  async function fetchData() {
   setLoading(true);
   const [underpayResult, summaryResult, payersResult] = await Promise.all([
    api.payments.getSilentUnderpayments(),
    api.payments.getSummary(),
    api.payments.getPayerStats(),
   ]);
   if (cancelled) return;
   setUnderpaymentData(underpayResult || { items: [], total: 0, total_variance: 0 });
   setSummary(summaryResult);
   setPayers(Array.isArray(payersResult) ? payersResult : []);
   setLoading(false);
  }
  fetchData();
  return () => { cancelled = true; };
 }, []);

 const underpaymentAnalysis = underpaymentData.items || [];
 const totalUnderpayment = underpaymentData.total_variance || underpaymentAnalysis.reduce((s, u) => s + Math.abs(u.totalImpact || u.total_impact || u.variance || 0), 0);
 const appealableClaims = underpaymentAnalysis.filter(u => u.appealable).reduce((s, u) => s + (u.claims || u.claim_count || 0), 0);
 const appealableAmount = underpaymentAnalysis.filter(u => u.appealable).reduce((s, u) => s + Math.abs(u.totalImpact || u.total_impact || u.variance || 0), 0);

 if (loading) {
  return (
   <div className="flex-1 overflow-y-auto bg-th-surface-overlay/30 dark:bg-background-dark font-sans h-full">
    <div className="max-w-[1600px] mx-auto p-6 flex items-center justify-center h-64">
     <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-th-muted text-sm">Loading contract data...</p>
     </div>
    </div>
   </div>
  );
 }

 return (
 <div className="flex-1 overflow-y-auto bg-th-surface-overlay/30 dark:bg-background-dark font-sans h-full">
 <div className="max-w-[1600px] mx-auto p-6 space-y-6">

 {/* Header */}
 <div className="flex flex-wrap justify-between items-end gap-4">
 <div className="flex flex-col gap-1">
 <div className="flex items-center gap-2 mb-1">
 <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
 <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Contract Intelligence Active</span>
 </div>
 <h1 className="text-th-heading text-3xl font-black leading-tight tracking-tight">Contract Manager</h1>
 <p className="text-th-muted text-sm max-w-2xl">Payer contract management, fee schedule comparison, underpayment analysis, and renewal intelligence.</p>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-white dark:bg-card-dark border border-th-border text-th-primary text-sm font-bold gap-2 hover:bg-th-surface-overlay/30 dark:hover:bg-th-surface-overlay transition-colors">
 <span className="material-symbols-outlined text-lg">upload_file</span>
 Import Fee Schedule
 </button>
 <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-th-heading text-sm font-bold gap-2 shadow-lg shadow-primary/20 hover:bg-blue-700 transition-colors">
 <span className="material-symbols-outlined text-lg">gavel</span>
 Appeal Underpayments
 </button>
 </div>
 </div>

 {/* KPI Row */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {[
 { label: 'Active Contracts', value: String(payers.filter(p => (p.status || '').toLowerCase() === 'active').length || payers.length), icon: 'handshake', sub: `${payers.length} total payers` },
 { label: 'Total Underpayments (30d)', value: fmt(totalUnderpayment), icon: 'trending_down', sub: `${underpaymentAnalysis.reduce((s, u) => s + (u.claims || u.claim_count || 0), 0)} claims affected` },
 { label: 'Appealable Recovery', value: fmt(appealableAmount), icon: 'gavel', sub: `${appealableClaims} claims eligible` },
 { label: 'Total Payments', value: summary ? fmt(summary.total_payments || 0) : '--', icon: 'analytics', sub: summary ? 'From payment summary' : 'No data' },
 ].map((kpi) => (
 <div key={kpi.label} className={`flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-card-dark border border-th-border shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 ${
 kpi.label === 'Active Contracts' ? 'border-l-[3px] border-l-blue-500' :
 kpi.label.includes('Underpayments') ? 'border-l-[3px] border-l-red-500' :
 kpi.label.includes('Appealable') ? 'border-l-[3px] border-l-emerald-500' :
 'border-l-[3px] border-l-purple-500'
 }`}>
 <div className="flex justify-between items-start">
 <p className="text-th-muted text-xs font-bold uppercase tracking-wider">{kpi.label}</p>
 <span className="material-symbols-outlined text-th-secondary text-sm">{kpi.icon}</span>
 </div>
 <p className="text-th-heading text-2xl font-bold tabular-nums">{kpi.value}</p>
 <p className="text-th-muted text-xs tabular-nums">{kpi.sub}</p>
 </div>
 ))}
 </div>

 {/* Tabs */}
 <div className="flex gap-1 p-1 bg-th-surface-overlay rounded-lg w-fit">
 {[
 { key: 'payers', label: 'Payer Contracts' },
 { key: 'underpayments', label: 'Underpayment Analysis' },
 ].map((tab) => (
 <button
 key={tab.key}
 onClick={() => setActiveView(tab.key)}
 className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${
 activeView === tab.key
 ? 'bg-white dark:bg-card-dark text-th-heading shadow-sm'
 : 'text-th-muted hover:text-th-primary dark:hover:text-th-heading'
 }`}
 >
 {tab.label}
 </button>
 ))}
 </div>

 {/* Payer Contracts */}
 {activeView === 'payers' && (
 <div className="space-y-4">
 <div className="flex items-center gap-2">
 <AIBadge level="Descriptive" />
 <span className="text-th-muted text-xs">Payer contract terms and status</span>
 </div>

 {payers.length === 0 ? (
  <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark p-12 flex flex-col items-center justify-center text-center">
   <span className="material-symbols-outlined text-4xl text-th-muted mb-3">handshake</span>
   <h3 className="text-lg font-bold text-th-heading mb-1">No Payer Data</h3>
   <p className="text-th-muted text-sm">No payer contract information is available.</p>
  </div>
 ) : (
 <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark overflow-hidden shadow-sm">
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="border-b border-th-border ">
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted ">Payer</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted ">Plan Type</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted ">Status</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Claims YTD</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Revenue YTD</th>
 </tr>
 </thead>
 <tbody>
 {payers.map((p) => (
 <tr
 key={p.id || p.payer_id}
 className="border-b border-th-border-subtle hover:bg-th-surface-overlay/30 dark:hover:bg-th-surface-overlay/50 cursor-pointer"
 onClick={() => setSelectedPayer(selectedPayer === (p.id || p.payer_id) ? null : (p.id || p.payer_id))}
 >
 <td className="px-4 py-3 text-sm text-th-heading font-medium">{p.name || p.payer_name}</td>
 <td className="px-4 py-3 text-sm text-th-muted ">{p.planType || p.plan_type || p.type || '--'}</td>
 <td className="px-4 py-3">
 <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${statusColors[p.status] || 'bg-th-surface-overlay text-th-muted'}`}>{p.status || 'Active'}</span>
 </td>
 <td className="px-4 py-3 text-sm text-th-muted text-right tabular-nums">{(p.claimsYTD || p.claims_ytd || p.total_claims || 0).toLocaleString()}</td>
 <td className="px-4 py-3 text-sm text-th-heading font-bold text-right tabular-nums">{fmt(p.revenueYTD || p.revenue_ytd || p.total_paid || 0)}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Underpayment Analysis */}
 {activeView === 'underpayments' && (
 <div className="space-y-4">
 <div className="flex items-center gap-2">
 <AIBadge level="Diagnostic" />
 <AIBadge level="Prescriptive" />
 <span className="text-th-muted text-xs">Expected vs actual payment analysis with appeal recommendations</span>
 </div>

 {appealableAmount > 0 && (
 <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <span className="material-symbols-outlined text-emerald-400 text-2xl">gavel</span>
 <div>
 <p className="text-sm font-bold text-emerald-400">Appeal {fmt(appealableAmount)} in underpayments across {appealableClaims} claims</p>
 <p className="text-xs text-th-muted mt-0.5">AI has identified appealable underpayments based on contracted rates. Generate appeal letters with supporting documentation.</p>
 </div>
 </div>
 <button className="flex-shrink-0 px-4 py-2 rounded-lg bg-emerald-500 text-th-heading text-sm font-bold hover:bg-emerald-600 transition-colors">
 Generate Appeals
 </button>
 </div>
 )}

 {underpaymentAnalysis.length === 0 ? (
  <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark p-12 flex flex-col items-center justify-center text-center">
   <span className="material-symbols-outlined text-4xl text-emerald-400 mb-3">check_circle</span>
   <h3 className="text-lg font-bold text-th-heading mb-1">No Underpayments Detected</h3>
   <p className="text-th-muted text-sm">All payments are within contracted rates.</p>
  </div>
 ) : (
 <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark overflow-hidden shadow-sm">
 <div className="p-4 border-b border-th-border flex items-center justify-between">
 <div>
 <h3 className="text-lg font-bold text-th-heading ">Underpayment Detail</h3>
 <p className="text-xs text-th-muted mt-1">Claims paid below contracted rate in the last 30 days</p>
 </div>
 <div className="text-right">
 <p className="text-2xl font-bold text-red-400 tabular-nums">{fmt(-totalUnderpayment)}</p>
 <p className="text-xs text-th-muted ">Total variance</p>
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="border-b border-th-border ">
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted ">Payer</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted ">CPT</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Contracted</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Avg Paid</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Diff/Claim</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Claims</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Total Impact</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted ">Appealable</th>
 </tr>
 </thead>
 <tbody>
 {underpaymentAnalysis.map((u, i) => (
 <tr key={i} className="border-b border-th-border-subtle hover:bg-th-surface-overlay/30 dark:hover:bg-th-surface-overlay/50">
 <td className="px-4 py-3 text-sm text-th-heading font-medium">{u.payer || u.payer_name}</td>
 <td className="px-4 py-3 text-sm font-mono text-th-primary ">{u.cpt || u.cpt_code}</td>
 <td className="px-4 py-3 text-sm text-th-primary text-right tabular-nums">{fmt(u.contracted || u.contracted_rate || 0)}</td>
 <td className="px-4 py-3 text-sm text-th-primary text-right tabular-nums">{fmt(u.avgPaid || u.avg_paid || 0)}</td>
 <td className="px-4 py-3 text-sm font-bold text-red-400 text-right tabular-nums">{fmt(u.diff || u.variance || 0)}</td>
 <td className="px-4 py-3 text-sm text-th-muted text-right tabular-nums">{u.claims || u.claim_count || 0}</td>
 <td className="px-4 py-3 text-sm font-bold text-red-400 text-right tabular-nums">{fmt(u.totalImpact || u.total_impact || 0)}</td>
 <td className="px-4 py-3">
 {u.appealable ? (
 <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400">Yes</span>
 ) : (
 <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-th-surface-overlay text-th-secondary">No</span>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 );
}
