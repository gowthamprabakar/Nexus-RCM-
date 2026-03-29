import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export function BatchActions() {
 const [loading, setLoading] = useState(true);
 const [claims, setClaims] = useState([]);
 const [crsSummary, setCrsSummary] = useState(null);

 useEffect(() => {
  let cancelled = false;
  async function fetchData() {
   setLoading(true);
   const [claimsResult, summaryResult] = await Promise.all([
    api.claims.list(),
    api.crs.getSummary(),
   ]);
   if (cancelled) return;
   setClaims(Array.isArray(claimsResult) ? claimsResult : []);
   setCrsSummary(summaryResult);
   setLoading(false);
  }
  fetchData();
  return () => { cancelled = true; };
 }, []);

 const fmt = (n) => {
  if (n == null) return '--';
  if (typeof n === 'number') return n.toLocaleString();
  return String(n);
 };

 const fmtCurrency = (n) => {
  if (n == null) return '$0';
  if (n < 0) return '-$' + Math.abs(n).toLocaleString();
  return '$' + n.toLocaleString();
 };

 // Derive batch stats from claims
 const totalClaims = claims.length;
 const submittedClaims = claims.filter(c => (c.status || '').toLowerCase() === 'submitted').length;
 const deniedClaims = claims.filter(c => (c.status || '').toLowerCase() === 'denied').length;
 const paidClaims = claims.filter(c => (c.status || '').toLowerCase() === 'paid').length;

 if (loading) {
  return (
   <div className="flex h-full font-sans text-th-heading overflow-hidden p-6">
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full items-center justify-center h-64">
     <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-th-muted text-sm">Loading batch data...</p>
     </div>
    </div>
   </div>
  );
 }

 return (
 <div className="flex h-full font-sans text-th-heading overflow-hidden p-6 custom-scrollbar">
 <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
 {/* Header */}
 <div className="flex justify-between items-end">
 <div>
 <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-th-heading">
 Batch Actions Management
 <span className="ai-diagnostic">Diagnostic AI</span>
 </h1>
 <p className="text-th-secondary text-sm mt-1">Monitor and control large-scale claim operations.</p>
 </div>
 </div>

 {/* KPI Cards from CRS Summary */}
 {crsSummary && (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
   <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
    <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Total Claims</p>
    <p className="text-2xl font-black text-th-heading mt-1 tabular-nums">{fmt(crsSummary.totalClaims || crsSummary.total_claims || totalClaims)}</p>
   </div>
   <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-emerald-500 rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
    <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Pass Rate</p>
    <p className="text-2xl font-black text-emerald-400 mt-1 tabular-nums">{crsSummary.passRate || crsSummary.pass_rate || 0}%</p>
   </div>
   <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-purple-500 rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
    <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Auto-Fix Rate</p>
    <p className="text-2xl font-black text-purple-400 mt-1 tabular-nums">{crsSummary.autoFixRate || crsSummary.auto_fix_rate || 0}%</p>
   </div>
   <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-amber-500 rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
    <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Batch Readiness</p>
    <p className="text-2xl font-black text-amber-400 mt-1 tabular-nums">{crsSummary.batchReadiness || crsSummary.batch_readiness || 0}%</p>
   </div>
  </div>
 )}

 {/* Claims for Batch Selection */}
 {claims.length === 0 ? (
  <div className="bg-th-surface-raised border border-th-border rounded-xl p-12 flex flex-col items-center justify-center text-center">
   <span className="material-symbols-outlined text-4xl text-th-muted mb-3">inbox</span>
   <h3 className="text-lg font-bold text-th-heading mb-1">No Claims Available</h3>
   <p className="text-th-muted text-sm">No claims are available for batch operations.</p>
  </div>
 ) : (
  <>
   {/* Batch Status Summary */}
   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Batch Selection */}
    <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
       <div className="p-3 bg-primary/10 text-primary rounded-lg border border-primary/20">
        <span className="material-symbols-outlined">cleaning_services</span>
       </div>
       <div>
        <h3 className="font-bold text-lg text-th-heading">Batch Re-Scrub</h3>
        <p className="text-xs text-th-secondary">{totalClaims} claims loaded from API</p>
       </div>
      </div>
      <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">Ready</span>
     </div>
     <div className="space-y-2 mb-6">
      <div className="flex justify-between text-xs font-bold text-th-secondary">
       <span>Claims Breakdown</span>
       <span className="tabular-nums">{submittedClaims} submitted / {deniedClaims} denied / {paidClaims} paid</span>
      </div>
      <div className="h-4 bg-th-surface-overlay rounded-full overflow-hidden flex">
       {submittedClaims > 0 && <div className="h-full bg-blue-500" style={{ width: `${(submittedClaims / totalClaims) * 100}%` }}></div>}
       {deniedClaims > 0 && <div className="h-full bg-red-500" style={{ width: `${(deniedClaims / totalClaims) * 100}%` }}></div>}
       {paidClaims > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(paidClaims / totalClaims) * 100}%` }}></div>}
      </div>
     </div>
     <div className="flex gap-3">
      <button className="flex-1 py-2 rounded-lg bg-primary text-[#0B1120] text-sm font-bold hover:brightness-110 transition-colors">Run Batch Scrub</button>
      <button className="flex-1 py-2 rounded-lg border border-th-border text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay text-sm font-bold transition-colors">Configure</button>
     </div>
    </div>

    {/* Payer Submission */}
    <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-emerald-500 rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
       <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
        <span className="material-symbols-outlined">upload</span>
       </div>
       <div>
        <h3 className="font-bold text-lg text-th-heading">Payer Submission</h3>
        <p className="text-xs text-th-secondary">{submittedClaims} claims ready for submission</p>
       </div>
      </div>
      <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">Ready</span>
     </div>
     <div className="space-y-2 mb-6">
      <div className="flex justify-between text-xs font-bold text-th-secondary">
       <span>Total Value</span>
       <span className="tabular-nums">{fmtCurrency(claims.filter(c => (c.status || '').toLowerCase() === 'submitted').reduce((s, c) => s + (c.amount || 0), 0))}</span>
      </div>
      <div className="h-4 bg-th-surface-overlay rounded-full overflow-hidden relative">
       <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-th-muted tracking-widest uppercase">Ready to submit</div>
      </div>
     </div>
     <div className="flex gap-3">
      <button className="flex-1 py-2 rounded-lg bg-primary text-[#0B1120] text-sm font-bold hover:brightness-110 transition-colors">Submit Batch</button>
      <button className="flex-1 py-2 rounded-lg border border-th-border text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay text-sm font-bold transition-colors">Edit Selection</button>
     </div>
    </div>
   </div>

   {/* Claims Table */}
   <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden flex-1 flex flex-col">
    <div className="p-6 border-b border-th-border">
     <h3 className="text-lg font-bold text-th-heading">Claims for Batch Operations ({totalClaims})</h3>
    </div>
    <div className="flex-1 overflow-auto custom-scrollbar">
     <table className="w-full text-left border-collapse">
      <thead className="bg-th-surface-overlay/50 border-b border-th-border">
       <tr>
        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Claim ID</th>
        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Patient</th>
        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Payer</th>
        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Amount</th>
        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Status</th>
        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Risk Score</th>
       </tr>
      </thead>
      <tbody className="divide-y divide-slate-700/30">
       {claims.slice(0, 20).map((claim) => (
        <tr key={claim.id} className="hover:bg-th-surface-overlay/50 transition-colors">
         <td className="px-6 py-4 font-mono text-xs font-bold text-th-secondary">{claim.id}</td>
         <td className="px-6 py-4 text-sm font-bold text-th-heading">{claim.patient?.name || claim.patient_name || '--'}</td>
         <td className="px-6 py-4 text-sm text-th-secondary">{claim.payer?.name || claim.payer_name || '--'}</td>
         <td className="px-6 py-4 text-sm font-mono text-th-heading tabular-nums">{fmtCurrency(claim.amount || 0)}</td>
         <td className="px-6 py-4">
          <span className={`px-2 py-1 rounded text-xs font-bold border ${
           (claim.status || '').toLowerCase() === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
           (claim.status || '').toLowerCase() === 'denied' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
           (claim.status || '').toLowerCase() === 'submitted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
           'bg-th-surface-overlay text-th-secondary border-th-border'
          }`}>{claim.status}</span>
         </td>
         <td className="px-6 py-4 text-sm font-bold tabular-nums">
          <span className={
           (claim.risk_score || 0) >= 80 ? 'text-rose-500' :
           (claim.risk_score || 0) >= 50 ? 'text-amber-400' :
           'text-emerald-400'
          }>{claim.risk_score || '--'}</span>
         </td>
        </tr>
       ))}
      </tbody>
     </table>
     {totalClaims > 20 && (
      <div className="p-4 text-center text-xs text-th-muted">
       Showing 20 of {totalClaims} claims
      </div>
     )}
    </div>
   </div>
  </>
 )}
 </div>
 </div>
 );
}
