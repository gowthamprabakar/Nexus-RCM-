import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BankReconciliation } from '../../denials/pages/BankReconciliation';
import { api } from '../../../services/api';

const fmt = (n) => n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(0)}K` : `$${Math.round(n).toLocaleString()}`;

export function RevenueReconciliation() {
 const navigate = useNavigate();
 const [activeTab, setActiveTab] = useState('revenue');
 const [recon, setRecon] = useState(null);
 const [eraRows, setEraRows] = useState([]);
 const [weeklyData, setWeeklyData] = useState([]);
 const [reconSummary, setReconSummary] = useState(null);
 const [reconInsights, setReconInsights] = useState([]);
 const [insightsLoading, setInsightsLoading] = useState(false);

 useEffect(() => {
   async function load() {
     const [r, era, weekly] = await Promise.all([
       api.reconciliation.getSummary(),
       api.reconciliation.getERATrail({ page: 1, size: 20 }),
       api.reconciliation.getWeekly().catch(() => []),
     ]);
     if (r) { setRecon(r); setReconSummary(r); }
     if (era?.items) setEraRows(era.items);
     const wk = Array.isArray(weekly) ? weekly : weekly?.weeks || weekly?.items || [];
     setWeeklyData(wk);
   }
   load();
   setInsightsLoading(true);
   api.ai.getInsights('reconciliation').then(r => {
     if (r?.insights?.length) setReconInsights(r.insights);
     setInsightsLoading(false);
   });
 }, []);

 return (
 <div className="flex-1 flex flex-col p-6 max-w-[1600px] mx-auto w-full gap-6 font-sans h-full overflow-y-auto">
 {/* Breadcrumbs & Heading Section */}
 <div className="flex flex-col gap-4">
 <div className="flex items-center gap-2 text-sm">
 <a className="text-th-muted hover:text-primary transition-colors" href="#">Financial Management</a>
 <span className="text-th-muted">/</span>
 <span className="text-th-heading font-medium">Reconciliation Center</span>
 </div>

 <div className="flex flex-wrap justify-between items-end gap-6">
 <div className="flex flex-col gap-1 max-w-2xl">
 <h1 className="text-3xl font-black text-th-heading tracking-tight">Reconciliation Center</h1>
 <p className="text-th-secondary text-sm">Unified control plane for Revenue Reconciliation, Cash Posting, and Bank Feeds.</p>
 </div>

 {/* Tab Navigation */}
 <div className="bg-[#1e293b] p-1 rounded-lg flex items-center gap-1">
 <button
 onClick={() => setActiveTab('revenue')}
 className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'revenue' ? 'bg-th-surface-raised text-th-heading shadow-sm' : 'text-th-muted hover:text-th-heading'}`}
 >
 Revenue & Cash Posting
 </button>
 <button
 onClick={() => setActiveTab('bank')}
 className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'bank' ? 'bg-th-surface-raised text-th-heading shadow-sm' : 'text-th-muted hover:text-th-heading'}`}
 >
 Bank Reconciliation
 </button>
 </div>
 </div>
 </div>

 {/* Content Area */}
 {activeTab === 'bank' ? (
 <div className="flex-1 border border-th-border rounded-xl overflow-hidden">
 <BankReconciliation />
 </div>
 ) : (
 <div className="flex flex-col gap-6 animate-fade-in">
 {/* Metric Ribbon */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <div className="flex flex-col gap-2 rounded-xl p-5 border border-th-border bg-th-surface-raised border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Payment Posted</p>
 </div>
 <span className="material-symbols-outlined text-emerald-500">check_circle</span>
 </div>
 <p className="text-th-heading text-2xl font-bold tracking-tight tabular-nums">{recon ? fmt(recon.total_era_received) : '$1,248,390'}</p>
 <div className="flex items-center gap-1.5">
 <span className="text-emerald-500 text-xs font-bold tabular-nums">{recon ? `${recon.reconciled_count} reconciled` : '--'}</span>
 <span className="text-th-secondary text-xs">Current period</span>
 </div>
 </div>
 <div className="flex flex-col gap-2 rounded-xl p-5 border border-th-border bg-th-surface-raised border-l-[3px] border-l-amber-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Expected (ERA/835)</p>
 </div>
 <span className="material-symbols-outlined text-amber-500">pending_actions</span>
 </div>
 <p className="text-th-heading text-2xl font-bold tracking-tight tabular-nums">{recon ? fmt(recon.total_forecasted) : '$1,293,600'}</p>
 <div className="flex items-center gap-1.5">
 <span className="text-amber-500 text-xs font-bold tabular-nums">{recon ? `${recon.pending_count} pending` : '$45,210 unposted'}</span>
 <span className="text-th-secondary text-xs">pending cash posting</span>
 </div>
 </div>
 <div className="flex flex-col gap-2 rounded-xl p-5 border border-th-border bg-th-surface-raised ring-2 ring-rose-500/20 border-l-[3px] border-l-red-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Active Variances</p>
 </div>
 <span className="material-symbols-outlined text-rose-500">warning</span>
 </div>
 <p className="text-th-heading text-2xl font-bold tracking-tight tabular-nums">{recon ? recon.variance_count : 128}</p>
 <div className="flex items-center gap-1.5">
 <span className="text-rose-500 text-xs font-bold tabular-nums">{recon ? `${recon.escalated_count} escalated` : '+8 new'}</span>
 <span className="text-th-secondary text-xs">requires manual review</span>
 </div>
 </div>
 <div className="flex flex-col gap-2 rounded-xl p-5 border border-th-border bg-th-surface-raised border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Bank Deposited</p>
 </div>
 <span className="material-symbols-outlined text-primary">payments</span>
 </div>
 <p className="text-th-heading text-2xl font-bold tracking-tight tabular-nums">{recon ? fmt(recon.total_bank_deposited) : '$890,442'}</p>
 <div className="flex items-center gap-1.5">
 <span className={`${(recon?.overall_variance || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'} text-xs font-bold tabular-nums`}>{recon ? `${recon.overall_variance_pct}% variance` : '+8.1%'}</span>
 <span className="text-th-secondary text-xs">vs ERA received</span>
 </div>
 </div>
 </div>

 {/* Ledger Table Section */}
 <div className="flex flex-col flex-1 bg-th-surface-raised rounded-xl border border-th-border overflow-hidden mb-8">
 {/* Filter Bar */}
 <div className="flex flex-wrap items-center justify-between p-4 border-b border-th-border bg-[#0f1623] gap-4">
 <div className="flex flex-wrap gap-3 items-center">
 <button className="flex items-center gap-2 bg-[#1e293b] border border-th-border px-3 py-1.5 rounded-lg text-sm font-medium text-th-heading hover:bg-th-surface-overlay">
 <span className="material-symbols-outlined text-base">filter_list</span>
 <span>Filters</span>
 </button>
 <button className="flex items-center gap-2 bg-[#1e293b] border border-th-border px-3 py-1.5 rounded-lg text-sm font-medium text-th-heading hover:bg-th-surface-overlay group">
 <span>Payer: BlueCross</span>
 <span className="material-symbols-outlined text-sm text-th-secondary group-hover:text-red-500">close</span>
 </button>
 <button className="flex items-center gap-2 bg-[#1e293b] border border-th-border px-3 py-1.5 rounded-lg text-sm font-medium text-th-heading hover:bg-th-surface-overlay group">
 <span>Status: High Variance</span>
 <span className="material-symbols-outlined text-sm text-th-secondary group-hover:text-red-500">close</span>
 </button>
 </div>
 <div className="flex items-center gap-3">
 <button className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] text-th-heading text-sm font-bold rounded-lg border border-th-border hover:bg-th-surface-overlay transition-colors">
 <span className="material-symbols-outlined text-base">download</span>
 <span>Export CSV</span>
 </button>
 <button className="flex items-center gap-2 px-4 py-2 bg-primary text-th-heading text-sm font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-primary/20">
 <span className="material-symbols-outlined text-base">post_add</span>
 <span>Batch Post Cash</span>
 </button>
 </div>
 </div>
 {/* Payer Reconciliation Table — LIVE from API */}
 <div className="overflow-x-auto flex-1">
 {weeklyData.length > 0 ? (
 <table className="w-full text-left border-collapse">
 <thead className="bg-[#0f1623] text-th-muted sticky top-0 uppercase text-[11px] font-bold tracking-widest border-b border-th-border">
 <tr>
 <th className="p-3">Payer</th>
 <th className="p-3">Week</th>
 <th className="p-3 text-right">Forecasted</th>
 <th className="p-3 text-right">ERA Received</th>
 <th className="p-3 text-right">Bank Deposited</th>
 <th className="p-3 text-right">ERA-Bank Variance</th>
 <th className="p-3 text-center">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-th-border">
 {weeklyData.slice(0, 20).map((row, i) => {
   const variance = row.era_bank_variance || 0;
   const isHighVar = Math.abs(variance) > (row.era_received_amount || 1) * 0.05;
   const isMedVar = Math.abs(variance) > (row.era_received_amount || 1) * 0.02;
   return (
   <tr key={row.recon_id || i} className={`hover:bg-th-surface-overlay/50 transition-colors cursor-pointer ${isHighVar ? 'bg-rose-900/10' : ''}`} onClick={() => navigate(`/analytics/revenue/reconciliation/payer-claims?payer=${encodeURIComponent(row.payer_name || row.payer_id)}&era=${Math.round(row.era_received_amount || 0)}&bank=${Math.round(row.bank_deposit_amount || 0)}&variance=${Math.round(variance)}`)}>
   <td className="p-3">
     <span className="font-bold text-primary text-sm underline decoration-primary/30">{row.payer_name || row.payer_id}</span>
   </td>
   <td className="p-3 text-sm text-th-secondary">{row.week_start_date || '—'}</td>
   <td className="p-3 text-right font-mono text-th-heading tabular-nums">${(row.forecasted_amount || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
   <td className="p-3 text-right font-mono text-th-heading tabular-nums">${(row.era_received_amount || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
   <td className="p-3 text-right font-mono text-th-heading tabular-nums">${(row.bank_deposit_amount || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
   <td className={`p-3 text-right font-mono font-bold tabular-nums ${isHighVar ? 'text-rose-500' : isMedVar ? 'text-amber-500' : 'text-emerald-500'}`}>
     ${Math.abs(variance).toLocaleString(undefined, {maximumFractionDigits: 0})}
   </td>
   <td className="p-3 text-center">
     <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
       row.reconciliation_status === 'RECONCILED' ? 'bg-emerald-900/40 text-emerald-400' :
       row.reconciliation_status === 'VARIANCE' ? 'bg-rose-900/40 text-rose-400' :
       'bg-amber-900/40 text-amber-400'
     }`}>{row.reconciliation_status || 'PENDING'}</span>
   </td>
   </tr>
   );
 })}
 </tbody>
 </table>
 ) : (
 <div className="p-12 text-center text-th-muted">
   <span className="material-symbols-outlined text-3xl mb-2">sync</span>
   <p className="text-sm">Loading reconciliation data...</p>
 </div>
 )}
 </div>
 </div>

 {/* Close Period Status Footer Bar */}
 <footer className="sticky bottom-0 bg-th-surface-raised border-t border-th-border px-6 py-4 flex flex-wrap items-center justify-between z-10 rounded-t-xl gap-4">
 <div className="flex flex-wrap items-center gap-8 flex-1">
 <div className="flex flex-col gap-1 min-w-[200px]">
 <div className="flex justify-between text-xs font-bold text-th-muted">
 <span>RECONCILIATION PROGRESS</span>
 <span>{reconSummary ? Math.round(reconSummary.reconciled_count / (reconSummary.reconciled_count + reconSummary.variance_count + 1) * 100) : 0}%</span>
 </div>
 <div className="w-full bg-th-surface-overlay h-2 rounded-full overflow-hidden">
 <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${reconSummary ? Math.round(reconSummary.reconciled_count / (reconSummary.reconciled_count + reconSummary.variance_count + 1) * 100) : 0}%` }}></div>
 </div>
 </div>
 <div className="flex items-center gap-4 border-l border-th-border pl-8">
 <div className="flex flex-col">
 <span className="text-[10px] font-bold text-th-muted uppercase tracking-widest">ERA-Bank Gap</span>
 <span className="text-sm font-bold text-th-heading tabular-nums">${reconSummary ? Math.abs(Math.round(reconSummary.total_era_received - reconSummary.total_bank_deposited)).toLocaleString() : '—'} Unmatched</span>
 </div>
 <div className="flex flex-col">
 <span className="text-[10px] font-bold text-th-muted uppercase tracking-widest">Days Remaining</span>
 <span className="text-sm font-bold text-th-heading tabular-nums">4 Business Days</span>
 </div>
 </div>
 </div>
 {/* AI Reconciliation Intelligence */}
 {(insightsLoading || reconInsights.length > 0) && (
 <div className="border-t border-th-border pt-4 mt-2">
   <div className="flex items-center gap-2 mb-3">
   <span className="material-icons text-purple-400 text-sm">auto_awesome</span>
   <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">AI Reconciliation Intelligence</span>
   {reconInsights.length > 0 && <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Live · Ollama</span>}
   </div>
   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
   {insightsLoading ? [0,1,2].map(i => (
     <div key={i} className="rounded-xl border border-th-border bg-th-surface-overlay p-3 animate-pulse">
     <div className="h-3 bg-th-border rounded w-2/3 mb-2" />
     <div className="h-2 bg-th-border rounded w-full" />
     </div>
   )) : reconInsights.map((ins, i) => (
     <div key={i} className="rounded-xl border border-th-border bg-th-surface-overlay p-3">
     <div className="flex items-center gap-2 mb-1">
       <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${ins.badge === 'Predictive' ? 'bg-purple-500/10 text-purple-400' : ins.badge === 'Prescriptive' ? 'bg-emerald-500/10 text-emerald-400' : ins.badge === 'Diagnostic' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>{ins.badge}</span>
       <span className={`text-[10px] font-bold uppercase ${ins.severity === 'critical' ? 'text-rose-400' : ins.severity === 'warning' ? 'text-amber-400' : 'text-th-muted'}`}>{ins.severity}</span>
     </div>
     <p className="text-xs font-semibold text-th-heading mb-1">{ins.title}</p>
     <p className="text-[11px] text-th-secondary leading-relaxed">{ins.body}</p>
     </div>
   ))}
   </div>
 </div>
 )}

 <div className="flex gap-4">
 <button className="px-4 py-2 text-sm font-bold text-th-heading hover:bg-th-surface-overlay rounded-lg border border-th-border transition-colors">
 Run Audit Report
 </button>
 <button className="px-6 py-2 text-sm font-bold text-th-heading bg-primary rounded-lg hover:opacity-90 transition-all shadow-lg">
 Finalize & Close Period
 </button>
 </div>
 </footer>
 </div>
 )}
 </div>
 );
}
