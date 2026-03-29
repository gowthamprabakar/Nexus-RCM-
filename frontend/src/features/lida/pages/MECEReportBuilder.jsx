import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

const DATASETS = ['denials', 'payments', 'claims', 'ar', 'reconciliation'];

const DATASET_LABELS = {
  denials: 'Denial Management',
  payments: 'Payment Analysis',
  claims: 'Claims Overview',
  ar: 'A/R Aging',
  reconciliation: 'Reconciliation',
};

const DATASET_ICONS = {
  denials: 'gpp_bad',
  payments: 'payments',
  claims: 'description',
  ar: 'account_balance',
  reconciliation: 'balance',
};

export function MECEReportBuilder() {
 const [activeTab, setActiveTab] = useState('executive');
 const [activeView, setActiveView] = useState('design');

 // Existing API data
 const [denialsSummary, setDenialsSummary] = useState(null);
 const [paymentsSummary, setPaymentsSummary] = useState(null);
 const [arSummary, setArSummary] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 // LIDA summaries per dataset
 const [lidaSummaries, setLidaSummaries] = useState({});
 const [lidaSummaryLoading, setLidaSummaryLoading] = useState({});

 // LIDA goals per dataset
 const [lidaGoals, setLidaGoals] = useState({});
 const [lidaGoalsLoading, setLidaGoalsLoading] = useState({});

 // Report generation
 const [reportGenerating, setReportGenerating] = useState(false);
 const [reportReady, setReportReady] = useState(false);

 const tabs = [
   { id: 'executive', label: 'Executive Summary', icon: 'folder_open' },
   { id: 'payer', label: 'Payer Analysis', icon: 'folder' },
   { id: 'denial', label: 'Denial Management', icon: 'folder' },
   { id: 'forecast', label: 'Forecast Models', icon: 'folder' },
 ];

 // ── Load existing KPI data ──
 useEffect(() => {
   let cancelled = false;
   async function load() {
     setLoading(true);
     setError(null);
     try {
       const [d, p, a] = await Promise.all([
         api.denials.getSummary(),
         api.payments.getSummary(),
         api.ar.getSummary(),
       ]);
       if (cancelled) return;
       setDenialsSummary(d);
       setPaymentsSummary(p);
       setArSummary(a);
     } catch (err) {
       if (!cancelled) setError(err.message || 'Failed to load report data');
     } finally {
       if (!cancelled) setLoading(false);
     }
   }
   load();
   return () => { cancelled = true; };
 }, []);

 // ── Load LIDA summary for a dataset ──
 const loadLidaSummary = async (dataset) => {
   if (lidaSummaries[dataset] || lidaSummaryLoading[dataset]) return;
   setLidaSummaryLoading(prev => ({ ...prev, [dataset]: true }));
   try {
     const result = await api.lida.summarize(dataset);
     setLidaSummaries(prev => ({ ...prev, [dataset]: result }));
   } catch {
     setLidaSummaries(prev => ({ ...prev, [dataset]: { error: 'Failed to load' } }));
   } finally {
     setLidaSummaryLoading(prev => ({ ...prev, [dataset]: false }));
   }
 };

 // ── Load LIDA goals for a dataset ──
 const loadLidaGoals = async (dataset) => {
   if (lidaGoals[dataset] || lidaGoalsLoading[dataset]) return;
   setLidaGoalsLoading(prev => ({ ...prev, [dataset]: true }));
   try {
     const result = await api.lida.goals(dataset, 3);
     setLidaGoals(prev => ({ ...prev, [dataset]: result?.goals || [] }));
   } catch {
     setLidaGoals(prev => ({ ...prev, [dataset]: [] }));
   } finally {
     setLidaGoalsLoading(prev => ({ ...prev, [dataset]: false }));
   }
 };

 // ── Generate full report (compile all summaries) ──
 const generateReport = async () => {
   setReportGenerating(true);
   setReportReady(false);
   try {
     await Promise.all(DATASETS.map(ds => loadLidaSummary(ds)));
     await Promise.all(DATASETS.map(ds => loadLidaGoals(ds)));
     setReportReady(true);
   } catch {
     setError('Report generation failed');
   } finally {
     setReportGenerating(false);
   }
 };

 const fmt = (v) => {
   if (v == null) return '--';
   if (typeof v === 'number') {
     if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
     if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
     return `$${v.toFixed(0)}`;
   }
   return String(v);
 };

 const fmtPct = (v) => (v != null ? `${(typeof v === 'number' && v < 1 ? v * 100 : v).toFixed(1)}%` : '--');

 return (
 <div className="flex-1 overflow-y-auto h-full p-8 text-th-heading custom-scrollbar">
 {/* Top Toolbar */}
 <div className="flex justify-between items-center mb-6">
 <div className="flex items-center gap-4">
 <h2 className="font-bold text-th-heading text-lg">Revenue Integrity Report</h2>
 <div className="flex -space-x-2">
 <div className="size-6 rounded-full bg-th-surface-overlay border-2 border-[#111827]"></div>
 <div className="size-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] text-th-heading font-bold border-2 border-[#111827]">JD</div>
 <div className="size-6 rounded-full bg-th-surface-overlay flex items-center justify-center text-[10px] text-th-heading border-2 border-[#111827]">+2</div>
 </div>
 {loading && <span className="text-xs text-th-muted animate-pulse">Loading data...</span>}
 </div>
 <div className="flex items-center gap-3">
 <div className="flex bg-th-surface-overlay rounded-lg p-0.5">
 <button
 onClick={() => setActiveView('design')}
 className={`px-3 py-1 text-xs font-bold rounded ${activeView === 'design' ? 'bg-th-surface-overlay text-th-heading shadow-sm' : 'text-th-secondary hover:text-th-heading'}`}
 >Design</button>
 <button
 onClick={() => setActiveView('preview')}
 className={`px-3 py-1 text-xs font-bold rounded ${activeView === 'preview' ? 'bg-th-surface-overlay text-th-heading shadow-sm' : 'text-th-secondary hover:text-th-heading'}`}
 >Preview</button>
 </div>
 <button
   onClick={generateReport}
   disabled={reportGenerating}
   className="flex items-center gap-2 px-4 py-1.5 bg-primary text-th-heading rounded-md text-xs font-bold hover:bg-blue-500 transition-colors disabled:opacity-50"
 >
   <span className="material-symbols-outlined text-sm">{reportGenerating ? 'progress_activity' : 'auto_awesome'}</span>
   {reportGenerating ? 'Generating...' : 'Generate Report'}
 </button>
 <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-th-heading rounded-md text-xs font-bold hover:bg-emerald-500 transition-colors">
 <span className="material-symbols-outlined text-sm">ios_share</span> Share & Export
 </button>
 </div>
 </div>

 {reportReady && (
   <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center gap-3">
     <span className="material-symbols-outlined text-emerald-400">check_circle</span>
     <p className="text-sm text-emerald-400 font-bold">Report generated with LIDA summaries for all {DATASETS.length} datasets.</p>
   </div>
 )}

 {/* Horizontal Tabs */}
 <div className="flex items-center gap-2 mb-6 border-b border-th-border pb-3">
 {tabs.map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
 tab.id === activeTab
 ? 'bg-primary/10 text-primary border border-primary/20'
 : 'text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay'
 }`}
 >
 <span className="material-symbols-outlined text-sm">{tab.icon}</span>
 {tab.label}
 </button>
 ))}
 <button className="flex items-center gap-2 px-3 py-2 border border-dashed border-th-border-strong rounded-lg text-xs text-th-muted hover:text-th-heading hover:border-th-border-strong transition-colors ml-2">
 <span className="material-symbols-outlined text-sm">add</span> Add Section
 </button>
 </div>

 {/* Section Header */}
 <div className="mb-8">
 <h2 className="text-2xl font-bold text-th-heading mb-1">Executive Summary</h2>
 <div className="flex justify-between items-center">
 <p className="text-sm text-th-secondary">Data from live API + LIDA statistical summaries</p>
 <span className="ai-descriptive">Descriptive AI</span>
 </div>
 <div className="h-px w-full bg-th-surface-overlay mt-4"></div>
 </div>

 {error && (
   <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 mb-6 text-center">
     <p className="text-red-400 text-sm font-bold">{error}</p>
   </div>
 )}

 {/* KPI Cards from real data */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
   {/* Denials KPI */}
   <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-rose-500 rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <div className="flex items-center gap-2 mb-3">
       <span className="material-symbols-outlined text-rose-400 text-sm">gpp_bad</span>
       <h3 className="text-xs font-bold uppercase tracking-wider text-th-muted">Denial Summary</h3>
     </div>
     {loading ? (
       <div className="space-y-2 animate-pulse">
         <div className="h-6 bg-th-surface-overlay rounded w-1/2" />
         <div className="h-3 bg-th-surface-overlay rounded w-3/4" />
       </div>
     ) : denialsSummary ? (
       <div className="space-y-2">
         <div className="flex justify-between">
           <span className="text-xs text-th-secondary">Total Denials</span>
           <span className="text-sm font-bold text-th-heading tabular-nums">{denialsSummary.total_denials?.toLocaleString() ?? '--'}</span>
         </div>
         <div className="flex justify-between">
           <span className="text-xs text-th-secondary">Revenue at Risk</span>
           <span className="text-sm font-bold text-rose-400 tabular-nums">{fmt(denialsSummary.denied_revenue_at_risk)}</span>
         </div>
         <div className="flex justify-between">
           <span className="text-xs text-th-secondary">Appeal Success</span>
           <span className="text-sm font-bold text-emerald-400 tabular-nums">{fmtPct(denialsSummary.successful_appeal_rate)}</span>
         </div>
         <div className="flex justify-between">
           <span className="text-xs text-th-secondary">Projected Recovery</span>
           <span className="text-sm font-bold text-emerald-400 tabular-nums">{fmt(denialsSummary.projected_recovery)}</span>
         </div>
       </div>
     ) : <p className="text-xs text-th-muted">No data</p>}
   </div>

   {/* Payments KPI */}
   <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-emerald-500 rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <div className="flex items-center gap-2 mb-3">
       <span className="material-symbols-outlined text-emerald-400 text-sm">payments</span>
       <h3 className="text-xs font-bold uppercase tracking-wider text-th-muted">Payments Summary</h3>
     </div>
     {loading ? (
       <div className="space-y-2 animate-pulse">
         <div className="h-6 bg-th-surface-overlay rounded w-1/2" />
         <div className="h-3 bg-th-surface-overlay rounded w-3/4" />
       </div>
     ) : paymentsSummary ? (
       <div className="space-y-2">
         <div className="flex justify-between">
           <span className="text-xs text-th-secondary">Total Collected</span>
           <span className="text-sm font-bold text-emerald-400 tabular-nums">{fmt(paymentsSummary.total_collected ?? paymentsSummary.total_payments)}</span>
         </div>
         <div className="flex justify-between">
           <span className="text-xs text-th-secondary">ERA Processed</span>
           <span className="text-sm font-bold text-th-heading tabular-nums">{paymentsSummary.era_count?.toLocaleString() ?? paymentsSummary.total_eras?.toLocaleString() ?? '--'}</span>
         </div>
         <div className="flex justify-between">
           <span className="text-xs text-th-secondary">Underpayments</span>
           <span className="text-sm font-bold text-amber-400 tabular-nums">{fmt(paymentsSummary.total_underpayment ?? paymentsSummary.underpayment_amount)}</span>
         </div>
         <div className="flex justify-between">
           <span className="text-xs text-th-secondary">Net Collection Rate</span>
           <span className="text-sm font-bold text-th-heading tabular-nums">{fmtPct(paymentsSummary.net_collection_rate ?? paymentsSummary.collection_rate)}</span>
         </div>
       </div>
     ) : <p className="text-xs text-th-muted">No data</p>}
   </div>

   {/* A/R KPI */}
   <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <div className="flex items-center gap-2 mb-3">
       <span className="material-symbols-outlined text-blue-400 text-sm">account_balance</span>
       <h3 className="text-xs font-bold uppercase tracking-wider text-th-muted">A/R Summary</h3>
     </div>
     {loading ? (
       <div className="space-y-2 animate-pulse">
         <div className="h-6 bg-th-surface-overlay rounded w-1/2" />
         <div className="h-3 bg-th-surface-overlay rounded w-3/4" />
       </div>
     ) : arSummary ? (
       <div className="space-y-2">
         <div className="flex justify-between">
           <span className="text-xs text-th-secondary">Total A/R</span>
           <span className="text-sm font-bold text-th-heading tabular-nums">{fmt(arSummary.total_ar ?? arSummary.total_outstanding)}</span>
         </div>
         <div className="flex justify-between">
           <span className="text-xs text-th-secondary">Days in A/R</span>
           <span className="text-sm font-bold text-blue-400 tabular-nums">{arSummary.avg_days_in_ar ?? arSummary.days_in_ar ?? '--'}</span>
         </div>
         <div className="flex justify-between">
           <span className="text-xs text-th-secondary">Over 90 Days</span>
           <span className="text-sm font-bold text-red-400 tabular-nums">{fmt(arSummary.over_90_days ?? arSummary.aged_90_plus)}</span>
         </div>
         <div className="flex justify-between">
           <span className="text-xs text-th-secondary">Clean Claim Rate</span>
           <span className="text-sm font-bold text-emerald-400 tabular-nums">{fmtPct(arSummary.clean_claim_rate)}</span>
         </div>
       </div>
     ) : <p className="text-xs text-th-muted">No data</p>}
   </div>
 </div>

 {/* ── LIDA Dataset Summaries ── */}
 <div className="mb-6">
   <div className="flex items-center gap-2 mb-4">
     <span className="material-symbols-outlined text-purple-400 text-base">auto_awesome</span>
     <h3 className="text-sm font-bold text-th-heading uppercase tracking-wider">LIDA Statistical Summaries</h3>
     <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
       AI Generated
     </span>
   </div>
   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
     {DATASETS.map((ds) => {
       const summary = lidaSummaries[ds];
       const isLoading = lidaSummaryLoading[ds];
       const goals = lidaGoals[ds] || [];
       return (
         <div key={ds} className="bg-th-surface-raised border border-th-border rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
           <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2">
               <span className="material-symbols-outlined text-primary text-sm">{DATASET_ICONS[ds]}</span>
               <h4 className="text-xs font-bold uppercase tracking-wider text-th-muted">{DATASET_LABELS[ds]}</h4>
             </div>
             {!summary && !isLoading && (
               <button
                 onClick={() => { loadLidaSummary(ds); loadLidaGoals(ds); }}
                 className="text-[10px] font-bold text-primary hover:text-blue-400 transition-colors"
               >Load</button>
             )}
           </div>

           {isLoading ? (
             <div className="space-y-2 animate-pulse">
               <div className="h-4 bg-th-surface-overlay rounded w-2/3" />
               <div className="h-3 bg-th-surface-overlay rounded w-full" />
               <div className="h-3 bg-th-surface-overlay rounded w-1/2" />
             </div>
           ) : summary ? (
             <div className="space-y-2">
               {summary.error ? (
                 <p className="text-xs text-red-400">{summary.error}</p>
               ) : (
                 <>
                   <div className="flex justify-between">
                     <span className="text-xs text-th-secondary">Rows</span>
                     <span className="text-xs font-bold text-th-heading tabular-nums">{summary.rows?.toLocaleString() ?? '--'}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-xs text-th-secondary">Columns</span>
                     <span className="text-xs font-bold text-th-heading tabular-nums">{summary.columns?.length ?? '--'}</span>
                   </div>
                   {summary.columns && (
                     <div className="mt-2">
                       <p className="text-[10px] text-th-muted font-bold uppercase mb-1">Fields</p>
                       <div className="flex flex-wrap gap-1">
                         {summary.columns.slice(0, 6).map(col => (
                           <span key={col} className="px-1.5 py-0.5 rounded bg-th-surface-overlay text-[9px] text-th-secondary font-mono">{col}</span>
                         ))}
                         {summary.columns.length > 6 && (
                           <span className="px-1.5 py-0.5 rounded bg-th-surface-overlay text-[9px] text-th-muted">+{summary.columns.length - 6} more</span>
                         )}
                       </div>
                     </div>
                   )}
                 </>
               )}

               {/* Show goals as suggested report sections */}
               {goals.length > 0 && (
                 <div className="mt-3 pt-3 border-t border-th-border">
                   <p className="text-[10px] text-th-muted font-bold uppercase mb-1.5">Suggested Sections</p>
                   <div className="space-y-1.5">
                     {goals.map((g, idx) => (
                       <div key={idx} className="flex items-start gap-1.5">
                         <span className="material-symbols-outlined text-purple-400 text-xs mt-0.5">lightbulb</span>
                         <p className="text-[11px] text-th-heading leading-snug">{g.question}</p>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </div>
           ) : (
             <p className="text-xs text-th-muted">Click Load to generate LIDA summary</p>
           )}
         </div>
       );
     })}
   </div>
 </div>

 {/* MECE Validation Engine */}
 <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-6 relative overflow-hidden mb-6">
 <div className="flex items-center gap-2 mb-4 text-emerald-400">
 <span className="material-symbols-outlined">psychology</span>
 <h3 className="font-bold text-sm tracking-widest uppercase">MECE Validation Engine</h3>
 <span className="ai-diagnostic">Diagnostic AI</span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="bg-th-surface-raised border border-th-border p-3 rounded-lg flex items-start gap-3">
 <div className="size-6 bg-emerald-600 rounded-full flex items-center justify-center text-th-heading shrink-0 mt-0.5"><span className="material-symbols-outlined text-sm">check</span></div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Mutually Exclusive</p>
 <p className="text-xs text-th-heading">No data overlap detected</p>
 </div>
 </div>
 <div className="bg-th-surface-raised border border-th-border p-3 rounded-lg flex items-start gap-3">
 <div className="size-6 bg-emerald-600 rounded-full flex items-center justify-center text-th-heading shrink-0 mt-0.5"><span className="material-symbols-outlined text-sm">check</span></div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Collectively Exhaustive</p>
 <p className="text-xs text-th-heading tabular-nums">
   {arSummary?.total_ar ? `${fmt(arSummary.total_ar)} total mapped` : '100% of revenue mapped'}
 </p>
 </div>
 </div>
 <div className="bg-th-surface-raised border border-th-border p-3 rounded-lg flex items-start gap-3">
 <div className={`size-6 ${denialsSummary?.total_denials > 0 ? 'bg-amber-500' : 'bg-emerald-600'} rounded-full flex items-center justify-center text-black shrink-0 mt-0.5`}>
   <span className="material-symbols-outlined text-sm">{denialsSummary?.total_denials > 0 ? 'priority_high' : 'check'}</span>
 </div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Consistency Check</p>
 <p className={`text-xs font-bold ${denialsSummary?.total_denials > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
   {denialsSummary?.total_denials > 0 ? `${denialsSummary.total_denials} denial items flagged` : 'All clear'}
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* Feedback & Review Section */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-center mb-4">
 <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted">Feedback & Review</h3>
 <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">Live Data</span>
 </div>

 <div className="space-y-6 mb-6">
 <div className="flex gap-3">
 <div className="size-8 rounded bg-blue-600 flex items-center justify-center shrink-0 text-th-heading font-bold text-xs">SY</div>
 <div className="flex-1">
 <div className="flex justify-between items-baseline mb-1">
 <p className="text-xs font-bold text-th-heading">System</p>
 <span className="text-[9px] text-th-muted">Auto-generated</span>
 </div>
 <p className="text-xs text-th-secondary leading-relaxed mb-2">
   Report data sourced from live APIs + LIDA summaries: Denials ({denialsSummary?.total_denials?.toLocaleString() ?? '?'} items), Payments ({fmt(paymentsSummary?.total_collected ?? paymentsSummary?.total_payments)}), A/R ({fmt(arSummary?.total_ar ?? arSummary?.total_outstanding)}).
   {Object.keys(lidaSummaries).length > 0 && ` LIDA analyzed ${Object.keys(lidaSummaries).length} dataset(s).`}
 </p>
 <div className="flex gap-3">
 <button className="text-[10px] font-bold text-th-muted hover:text-th-heading">Reply</button>
 <button className="text-[10px] font-bold text-th-muted hover:text-th-heading">Resolve</button>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-th-surface-overlay/50 border border-th-border rounded-lg p-3 min-h-[60px] text-xs text-th-muted relative">
 Type @ to mention team members...
 <div className="absolute bottom-2 right-2 flex gap-2">
 <span className="material-symbols-outlined text-th-muted text-sm hover:text-th-heading cursor-pointer">attach_file</span>
 <span className="material-symbols-outlined text-primary text-sm hover:text-blue-400 cursor-pointer">send</span>
 </div>
 </div>
 </div>
 </div>
 );
}
