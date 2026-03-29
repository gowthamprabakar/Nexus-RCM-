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

const statusColors = {
 'Queued': 'bg-blue-500/10 text-blue-400',
 'Processing': 'bg-amber-500/10 text-amber-400',
 'Auto-Posted': 'bg-emerald-500/10 text-emerald-400',
 'Exceptions': 'bg-red-500/10 text-red-400',
 'Paid': 'bg-emerald-500/10 text-emerald-400',
 'Denied': 'bg-red-500/10 text-red-400',
 'Adjusted': 'bg-amber-500/10 text-amber-400',
};

export function ERAProcessing() {
 const [expandedERA, setExpandedERA] = useState(null);
 const [activeView, setActiveView] = useState('queue');
 const [loading, setLoading] = useState(true);
 const [eraFiles, setEraFiles] = useState([]);
 const [summary, setSummary] = useState(null);
 const [underpayments, setUnderpayments] = useState([]);
 const [expandedDetail, setExpandedDetail] = useState(null);
 const [revenueLeakageFindings, setRevenueLeakageFindings] = useState(null);

 useEffect(() => {
  let cancelled = false;
  async function fetchData() {
   setLoading(true);
   const [eraResult, summaryResult, underpayResult] = await Promise.all([
    api.payments.getERABatchList({ size: 50 }),
    api.payments.getSummary(),
    api.payments.getSilentUnderpayments(),
   ]);
   if (cancelled) return;
   setEraFiles(eraResult?.items || []);
   setSummary(summaryResult);
   setUnderpayments(underpayResult?.items || []);
   setLoading(false);
  }
  fetchData();
  // Load revenue leakage diagnostics (non-blocking)
  api.diagnostics.getFindings({ category: 'REVENUE_LEAKAGE' }).catch(() => null).then(data => {
    if (data) setRevenueLeakageFindings(data);
  });
  return () => { cancelled = true; };
 }, []);

 // When a row is expanded, fetch ERA line detail for that payer batch
 useEffect(() => {
  if (!expandedERA) { setExpandedDetail(null); return; }
  let cancelled = false;
  async function fetchDetail() {
   // Find the batch to get payer_id
   const batch = eraFiles.find(e => e.id === expandedERA);
   if (!batch) return;
   // Fetch individual ERA records for this payer
   const result = await api.payments.getERAList({ page: 1, size: 20, payer_id: batch.payer_id });
   if (!cancelled && result?.items) {
    // Map individual ERA records to line-detail format
    const lines = result.items.map(item => ({
     claimId: item.claim_id || item.era_id,
     cpt: item.payment_method || 'ERA',
     billed: item.allowed_amount || 0,
     allowed: item.allowed_amount || 0,
     paid: item.payment_amount || 0,
     adj: (item.co_amount || 0) + (item.pr_amount || 0) + (item.oa_amount || 0),
     adjType: item.co_amount > 0 ? 'CO-45' : item.pr_amount > 0 ? 'PR-1' : '--',
     rarc: item.oa_amount > 0 ? 'N362' : '--',
     patResp: item.pr_amount || 0,
     status: item.payment_amount > 0 ? 'Paid' : 'Denied',
    }));
    setExpandedDetail({ lines });
   }
  }
  fetchDetail();
  return () => { cancelled = true; };
 }, [expandedERA, eraFiles]);

 const fmt = (n) => {
 if (n < 0) return '-$' + Math.abs(n).toLocaleString();
 return '$' + n.toLocaleString();
 };

 // Derive KPIs from summary + ERA batch data
 const filesInQueue = eraFiles.length;
 const totalPending = summary?.total_posted || eraFiles.reduce((s, e) => s + (e.amount || 0), 0);
 const totalLines = summary?.total_era_count || eraFiles.reduce((s, e) => s + (e.lineCount || e.line_count || 0), 0);
 const autoMatchRate = eraFiles.length > 0
   ? (eraFiles.reduce((s, e) => s + (e.autoMatchRate || e.auto_match_rate || 0), 0) / eraFiles.length).toFixed(1)
   : (summary?.avg_payment_rate || 0);
 const exceptionsCount = eraFiles.filter(e => (e.status || '').toLowerCase() === 'exceptions').length;
 const underpaymentTotal = underpayments.reduce((s, u) => s + Math.abs(u.totalImpact || u.total_impact || u.variance || 0), 0);

 if (loading) {
  return (
   <div className="flex-1 overflow-y-auto bg-th-surface-overlay/30 dark:bg-background-dark font-sans h-full">
    <div className="max-w-[1600px] mx-auto p-6 flex items-center justify-center h-64">
     <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-th-muted text-sm">Loading ERA data...</p>
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
 <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
 <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">ERA Processing Engine</span>
 </div>
 <h1 className="text-th-heading text-3xl font-black leading-tight tracking-tight">ERA / 835 Processing</h1>
 <p className="text-th-muted text-sm max-w-2xl">Process electronic remittance advice files, auto-match payments to claims, and manage exceptions with AI assistance.</p>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-white dark:bg-card-dark border border-th-border text-th-primary text-sm font-bold gap-2 hover:bg-th-surface-overlay/30 dark:hover:bg-th-surface-overlay transition-colors">
 <span className="material-symbols-outlined text-lg">upload_file</span>
 Import 835
 </button>
 <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-th-heading text-sm font-bold gap-2 shadow-lg shadow-primary/20 hover:bg-blue-700 transition-colors">
 <span className="material-symbols-outlined text-lg">bolt</span>
 Auto-Post All
 </button>
 </div>
 </div>

 {/* Summary KPIs */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {[
 { label: 'Files in Queue', value: String(filesInQueue), icon: 'inbox', sub: `${totalLines} lines` },
 { label: 'Total Pending Amount', value: fmt(totalPending), icon: 'attach_money', sub: `${totalLines} lines` },
 { label: 'Auto-Match Rate', value: `${autoMatchRate}%`, icon: 'auto_fix_high', sub: summary ? 'From payment summary' : 'Calculated from ERA' },
 { label: 'Exceptions Pending', value: String(exceptionsCount), icon: 'report_problem', sub: `${fmt(underpaymentTotal)} at risk` },
 ].map((kpi) => (
 <div key={kpi.label} className={`flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-card-dark border border-th-border shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 ${
 kpi.label === 'Files in Queue' ? 'border-l-[3px] border-l-blue-500' :
 kpi.label === 'Total Pending Amount' ? 'border-l-[3px] border-l-emerald-500' :
 kpi.label === 'Auto-Match Rate' ? 'border-l-[3px] border-l-purple-500' :
 'border-l-[3px] border-l-amber-500'
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

 {/* ── Underpayment Alert Banner ──────────────────────────────── */}
 {underpayments.length > 0 && (
   <div className="bg-gradient-to-r from-red-900/20 to-transparent border border-red-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
     <div className="flex items-center gap-3">
       <span className="material-symbols-outlined text-red-400 text-lg">warning</span>
       <div>
         <span className="text-th-heading text-sm font-bold">{underpayments.length} underpaid claims detected</span>
         <span className="text-red-400 font-black ml-2">— {fmt(underpaymentTotal)} variance</span>
       </div>
     </div>
     <button
       onClick={() => setActiveView('underpayments')}
       className="px-4 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors"
     >
       Review Underpayments
     </button>
   </div>
 )}

 {/* ── Revenue Leakage Diagnostics ──────────────────────────────── */}
 {revenueLeakageFindings && (revenueLeakageFindings.items?.length > 0 || revenueLeakageFindings.total > 0) && (() => {
   const findings = revenueLeakageFindings.items || revenueLeakageFindings.findings || [];
   const findingCount = revenueLeakageFindings.total || findings.length;
   return (
     <div className="bg-gradient-to-r from-purple-900/15 to-transparent border border-purple-500/20 rounded-xl p-4">
       <div className="flex items-center justify-between mb-3">
         <div className="flex items-center gap-3">
           <span className="material-symbols-outlined text-purple-400 text-lg">troubleshoot</span>
           <span className="text-th-heading text-sm font-bold">{findingCount} Revenue Leakage Finding{findingCount !== 1 ? 's' : ''}</span>
           <AIBadge level="Diagnostic" />
         </div>
       </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
         {findings.slice(0, 3).map((f, i) => (
           <div key={i} className="p-3 bg-white/5 dark:bg-th-surface-overlay/50 rounded-lg border border-th-border">
             <p className="text-xs font-bold text-th-heading mb-1">{f.title || f.finding || f.description || 'Revenue leakage detected'}</p>
             <p className="text-[10px] text-th-muted leading-snug">{f.detail || f.recommendation || f.summary || 'Review payment patterns for contract compliance'}</p>
             {(f.impact || f.amount) && (
               <p className="text-xs font-bold text-red-400 mt-1 tabular-nums">{fmt(f.impact || f.amount || 0)} impact</p>
             )}
           </div>
         ))}
       </div>
     </div>
   );
 })()}

 {/* Tab Navigation */}
 <div className="flex gap-1 p-1 bg-th-surface-overlay rounded-lg w-fit">
 {['queue', 'exceptions', 'underpayments'].map((tab) => (
 <button
 key={tab}
 onClick={() => setActiveView(tab)}
 className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${
 activeView === tab
 ? 'bg-white dark:bg-card-dark text-th-heading shadow-sm'
 : 'text-th-muted hover:text-th-primary dark:hover:text-th-heading'
 }`}
 >
 {tab === 'queue' ? 'ERA Queue' : tab === 'exceptions' ? 'Exception Queue' : 'Underpayment Detection'}
 </button>
 ))}
 </div>

 {/* ERA Queue */}
 {activeView === 'queue' && (
 <div className="space-y-4">
 <div className="flex items-center gap-2">
 <AIBadge level="Descriptive" />
 <AIBadge level="Prescriptive" />
 <span className="text-th-muted text-xs">Remittance detail with auto-post matching</span>
 </div>

 {eraFiles.length === 0 ? (
  <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark p-12 flex flex-col items-center justify-center text-center">
   <span className="material-symbols-outlined text-4xl text-th-muted mb-3">inbox</span>
   <h3 className="text-lg font-bold text-th-heading mb-1">No ERA Files</h3>
   <p className="text-th-muted text-sm">No electronic remittance advice files are currently in the queue.</p>
  </div>
 ) : (
 <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark overflow-hidden shadow-sm">
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="border-b border-th-border ">
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted w-8"></th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted ">File ID</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted ">Payer</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted ">Date</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Amount</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Lines</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-center">Paid / Denied / Adj</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Auto-Match</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted ">Status</th>
 </tr>
 </thead>
 <tbody>
 {eraFiles.map((era) => (
 <React.Fragment key={era.id}>
 <tr
 className="border-b border-th-border-subtle hover:bg-th-surface-overlay/30 dark:hover:bg-th-surface-overlay/50 cursor-pointer"
 onClick={() => setExpandedERA(expandedERA === era.id ? null : era.id)}
 >
 <td className="px-4 py-3">
 <span className="material-symbols-outlined text-sm text-th-secondary transition-transform" style={{ transform: expandedERA === era.id ? 'rotate(90deg)' : 'rotate(0deg)' }}>
 chevron_right
 </span>
 </td>
 <td className="px-4 py-3 text-sm font-mono text-primary">{era.id}</td>
 <td className="px-4 py-3 text-sm text-th-heading font-medium">{era.payer}</td>
 <td className="px-4 py-3 text-sm text-th-muted ">{era.date}</td>
 <td className="px-4 py-3 text-sm text-th-heading font-bold text-right tabular-nums">{fmt(era.amount || 0)}</td>
 <td className="px-4 py-3 text-sm text-th-muted text-right tabular-nums">{era.lineCount || era.line_count || 0}</td>
 <td className="px-4 py-3 text-sm text-center tabular-nums">
 <span className="text-emerald-400">{era.paidLines || era.paid_lines || 0}</span>
 <span className="text-th-muted mx-1">/</span>
 <span className="text-red-400">{era.deniedLines || era.denied_lines || 0}</span>
 <span className="text-th-muted mx-1">/</span>
 <span className="text-amber-400">{era.adjustedLines || era.adjusted_lines || 0}</span>
 </td>
 <td className="px-4 py-3 text-sm text-right">
 {(era.autoMatchRate || era.auto_match_rate) ? (
 <span className={`font-bold tabular-nums ${(era.autoMatchRate || era.auto_match_rate) >= 90 ? 'text-emerald-400' : (era.autoMatchRate || era.auto_match_rate) >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
 {era.autoMatchRate || era.auto_match_rate}%
 </span>
 ) : (
 <span className="text-th-muted ">--</span>
 )}
 </td>
 <td className="px-4 py-3">
 <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${statusColors[era.status] || 'bg-th-surface-overlay text-th-muted'}`}>{era.status}</span>
 </td>
 </tr>

 {/* Expanded Detail */}
 {expandedERA === era.id && expandedDetail && expandedDetail.lines && expandedDetail.lines.length > 0 && (
 <tr>
 <td colSpan={9} className="px-0 py-0">
 <div className="bg-th-surface-overlay/30 /30 border-b border-th-border ">
 <div className="px-6 py-3 flex items-center gap-3 border-b border-th-border /30">
 <span className="text-xs font-bold uppercase tracking-wider text-th-muted ">Line Detail</span>
 <AIBadge level="Diagnostic" />
 </div>
 <table className="w-full text-left">
 <thead>
 <tr className="border-b border-th-border /30">
 <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted ">Claim ID</th>
 <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted ">CPT</th>
 <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted text-right">Billed</th>
 <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted text-right">Allowed</th>
 <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted text-right">Paid</th>
 <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted text-right">Adj</th>
 <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted ">CARC</th>
 <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted ">RARC</th>
 <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted text-right">Pat Resp</th>
 <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted ">Status</th>
 </tr>
 </thead>
 <tbody>
 {expandedDetail.lines.map((line, idx) => (
 <tr key={line.claimId || line.claim_id || idx} className="border-b border-th-border-subtle /20 hover:bg-white dark:hover:bg-th-surface-overlay/50">
 <td className="px-6 py-2 text-xs font-mono text-primary">{line.claimId || line.claim_id}</td>
 <td className="px-3 py-2 text-xs font-mono text-th-primary ">{line.cpt}</td>
 <td className="px-3 py-2 text-xs text-th-primary text-right tabular-nums">{fmt(line.billed || 0)}</td>
 <td className="px-3 py-2 text-xs text-th-primary text-right tabular-nums">{fmt(line.allowed || 0)}</td>
 <td className="px-3 py-2 text-xs font-bold text-right text-emerald-500 tabular-nums">{fmt(line.paid || 0)}</td>
 <td className="px-3 py-2 text-xs text-red-400 text-right tabular-nums">{fmt(line.adj || 0)}</td>
 <td className="px-3 py-2 text-xs font-mono text-th-muted ">{line.adjType || line.adj_type || '--'}</td>
 <td className="px-3 py-2 text-xs font-mono text-th-muted ">{line.rarc || '--'}</td>
 <td className="px-3 py-2 text-xs text-th-primary text-right tabular-nums">{(line.patResp || line.pat_resp) ? fmt(line.patResp || line.pat_resp) : '--'}</td>
 <td className="px-3 py-2">
 <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[line.status] || 'bg-th-surface-overlay text-th-muted'}`}>{line.status}</span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </td>
 </tr>
 )}
 </React.Fragment>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Exception Queue */}
 {activeView === 'exceptions' && (
 <div className="space-y-4">
 <div className="flex items-center gap-2">
 <AIBadge level="Prescriptive" />
 <span className="text-th-muted text-xs">AI-suggested resolutions for unmatched payments</span>
 </div>

 {eraFiles.filter(e => (e.status || '').toLowerCase() === 'exceptions').length === 0 ? (
  <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark p-12 flex flex-col items-center justify-center text-center">
   <span className="material-symbols-outlined text-4xl text-emerald-400 mb-3">check_circle</span>
   <h3 className="text-lg font-bold text-th-heading mb-1">No Exceptions</h3>
   <p className="text-th-muted text-sm">All payments have been successfully matched to claims.</p>
  </div>
 ) : (
 <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark overflow-hidden shadow-sm">
 <div className="p-4 border-b border-th-border ">
 <h3 className="text-lg font-bold text-th-heading ">Exception Queue</h3>
 <p className="text-xs text-th-muted mt-1">Payments that could not be automatically matched to claims</p>
 </div>
 <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
 {eraFiles.filter(e => (e.status || '').toLowerCase() === 'exceptions').map((exc) => (
 <div key={exc.id} className="p-4 hover:bg-th-surface-overlay/30 dark:hover:bg-th-surface-overlay/30">
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1 space-y-2">
 <div className="flex items-center gap-3">
 <span className="text-sm font-mono text-primary font-bold">{exc.id}</span>
 <span className="text-xs text-th-muted ">{exc.payer}</span>
 <span className="text-sm font-bold text-th-heading tabular-nums">{fmt(exc.amount || 0)}</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-red-400 text-sm">error</span>
 <span className="text-sm text-red-400">Unmatched payment requires manual review</span>
 </div>
 </div>
 <div className="flex gap-2 flex-shrink-0">
 <button className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors">Accept</button>
 <button className="px-3 py-1.5 rounded-lg bg-th-surface-overlay text-th-muted text-xs font-bold hover:bg-th-surface-overlay dark:hover:bg-slate-600 transition-colors">Manual</button>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}

 {/* Underpayment Detection */}
 {activeView === 'underpayments' && (
 <div className="space-y-4">
 <div className="flex items-center gap-2">
 <AIBadge level="Predictive" />
 <AIBadge level="Diagnostic" />
 <span className="text-th-muted text-xs">Underpayment detection vs contracted fee schedule</span>
 </div>

 {underpayments.length === 0 ? (
  <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark p-12 flex flex-col items-center justify-center text-center">
   <span className="material-symbols-outlined text-4xl text-emerald-400 mb-3">check_circle</span>
   <h3 className="text-lg font-bold text-th-heading mb-1">No Underpayments Detected</h3>
   <p className="text-th-muted text-sm">All payments are within contracted rates.</p>
  </div>
 ) : (
 <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark overflow-hidden shadow-sm">
 <div className="p-4 border-b border-th-border flex items-center justify-between">
 <div>
 <h3 className="text-lg font-bold text-th-heading ">Underpayment Analysis</h3>
 <p className="text-xs text-th-muted mt-1">Claims paid below contracted rates in the last 30 days</p>
 </div>
 <div className="text-right">
 <p className="text-2xl font-bold text-red-400 tabular-nums">{fmt(-underpaymentTotal)}</p>
 <p className="text-xs text-th-muted ">Total underpayment impact</p>
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="border-b border-th-border ">
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted ">Payer</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted ">CPT</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Contracted</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Paid</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Diff/Claim</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Claims</th>
 <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Total Impact</th>
 </tr>
 </thead>
 <tbody>
 {underpayments.map((u, i) => (
 <tr key={i} className="border-b border-th-border-subtle hover:bg-th-surface-overlay/30 dark:hover:bg-th-surface-overlay/50">
 <td className="px-4 py-3 text-sm text-th-heading font-medium">{u.payer || u.payer_name}</td>
 <td className="px-4 py-3 text-sm font-mono text-th-primary ">{u.cpt || u.cpt_code}</td>
 <td className="px-4 py-3 text-sm text-th-primary text-right tabular-nums">{fmt(u.contracted || u.contracted_rate || 0)}</td>
 <td className="px-4 py-3 text-sm text-th-primary text-right tabular-nums">{fmt(u.paid || u.avg_paid || 0)}</td>
 <td className="px-4 py-3 text-sm font-bold text-red-400 text-right tabular-nums">{fmt(u.diff || u.variance || 0)}</td>
 <td className="px-4 py-3 text-sm text-th-muted text-right tabular-nums">{u.claims || u.claim_count || 0}</td>
 <td className="px-4 py-3 text-sm font-bold text-red-400 text-right tabular-nums">{fmt(u.totalImpact || u.total_impact || 0)}</td>
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
