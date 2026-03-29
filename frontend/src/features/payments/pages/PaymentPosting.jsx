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

const adjustmentTypes = ['Contractual (CO-45)', 'Write-Off (CO-253)', 'Refund', 'Takeback', 'Bad Debt', 'Charity', 'Small Balance'];

const takebackStatusColors = {
 'Pending Review': 'bg-amber-500/10 text-amber-400',
 'Disputed': 'bg-red-500/10 text-red-400',
 'Contested': 'bg-purple-500/10 text-purple-400',
 'Approved': 'bg-emerald-500/10 text-emerald-400',
};

export function PaymentPosting() {
 const [activeTab, setActiveTab] = useState('manual');
 const [selectedAdjType, setSelectedAdjType] = useState('');
 const [manualClaim, setManualClaim] = useState('');
 const [manualAmount, setManualAmount] = useState('');
 const [loading, setLoading] = useState(true);
 const [summary, setSummary] = useState(null);
 const [eraFiles, setEraFiles] = useState([]);

 useEffect(() => {
  let cancelled = false;
  async function fetchData() {
   setLoading(true);
   const [summaryResult, eraResult] = await Promise.all([
    api.payments.getSummary(),
    api.payments.getERABatchList({ size: 50 }),
   ]);
   if (cancelled) return;
   setSummary(summaryResult);
   setEraFiles(eraResult?.items || []);
   setLoading(false);
  }
  fetchData();
  return () => { cancelled = true; };
 }, []);

 // Derive batch items from ERA batch data
 const batchItems = eraFiles.map(era => ({
  eraId: era.id,
  payer: era.payer || era.payer_name || 'Unknown',
  total: era.amount || 0,
  matched: era.paid_lines || era.paidLines || 0,
  unmatched: era.denied_lines || era.deniedLines || 0,
  exceptions: era.adjusted_lines || era.adjustedLines || 0,
  progress: era.auto_match_rate || era.autoMatchRate || 0,
 }));

 if (loading) {
  return (
   <div className="flex-1 overflow-y-auto bg-th-surface-overlay/30 dark:bg-background-dark font-sans h-full">
    <div className="max-w-[1600px] mx-auto p-6 flex items-center justify-center h-64">
     <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-th-muted text-sm">Loading payment data...</p>
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
 <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
 <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Posting Engine Active</span>
 </div>
 <h1 className="text-th-heading text-3xl font-black leading-tight tracking-tight">Payment Posting</h1>
 <p className="text-th-muted text-sm max-w-2xl">Manual and batch payment posting, AI-assisted claim matching, adjustment management, and credit balance resolution.</p>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-white dark:bg-card-dark border border-th-border text-th-primary text-sm font-bold gap-2 hover:bg-th-surface-overlay/30 dark:hover:bg-th-surface-overlay transition-colors">
 <span className="material-symbols-outlined text-lg">history</span>
 Posting History
 </button>
 <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-th-heading text-sm font-bold gap-2 shadow-lg shadow-primary/20 hover:bg-blue-700 transition-colors">
 <span className="material-symbols-outlined text-lg">playlist_add_check</span>
 Batch Post
 </button>
 </div>
 </div>

 {/* Tab Navigation */}
 <div className="flex gap-1 p-1 bg-th-surface-overlay rounded-lg w-fit">
 {[
 { key: 'manual', label: 'Manual Posting' },
 { key: 'batch', label: 'Batch Posting' },
 ].map((tab) => (
 <button
 key={tab.key}
 onClick={() => setActiveTab(tab.key)}
 className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${
 activeTab === tab.key
 ? 'bg-white dark:bg-card-dark text-th-heading shadow-sm'
 : 'text-th-muted hover:text-th-primary dark:hover:text-th-heading'
 }`}
 >
 {tab.label}
 </button>
 ))}
 </div>

 {/* Manual Posting */}
 {activeTab === 'manual' && (
 <div className="grid grid-cols-12 gap-6">
 <div className="col-span-12 lg:col-span-7">
 <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark overflow-hidden shadow-sm">
 <div className="p-4 border-b border-th-border ">
 <h3 className="text-lg font-bold text-th-heading ">Post Payment</h3>
 <p className="text-xs text-th-muted mt-1">Enter payment details to post against a claim</p>
 </div>
 <div className="p-6 space-y-5">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-th-muted mb-1.5">Claim ID</label>
 <input
 type="text"
 placeholder="CLM-XXXXX"
 value={manualClaim}
 onChange={(e) => setManualClaim(e.target.value)}
 className="w-full h-10 px-3 rounded-lg border border-th-border -strong bg-white text-th-heading text-sm font-mono focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
 />
 </div>
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-th-muted mb-1.5">Payment Amount</label>
 <input
 type="text"
 placeholder="$0.00"
 value={manualAmount}
 onChange={(e) => setManualAmount(e.target.value)}
 className="w-full h-10 px-3 rounded-lg border border-th-border -strong bg-white text-th-heading text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
 />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-th-muted mb-1.5">Adjustment Type</label>
 <select
 value={selectedAdjType}
 onChange={(e) => setSelectedAdjType(e.target.value)}
 className="w-full h-10 px-3 rounded-lg border border-th-border -strong bg-white text-th-heading text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
 >
 <option value="">Select adjustment type...</option>
 {adjustmentTypes.map((t) => (
 <option key={t} value={t}>{t}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-th-muted mb-1.5">Adjustment Amount</label>
 <input
 type="text"
 placeholder="$0.00"
 className="w-full h-10 px-3 rounded-lg border border-th-border -strong bg-white text-th-heading text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
 />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-th-muted mb-1.5">Check / EFT Number</label>
 <input
 type="text"
 placeholder="Reference number"
 className="w-full h-10 px-3 rounded-lg border border-th-border -strong bg-white text-th-heading text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
 />
 </div>
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-th-muted mb-1.5">Payment Date</label>
 <input
 type="date"
 className="w-full h-10 px-3 rounded-lg border border-th-border -strong bg-white text-th-heading text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
 />
 </div>
 </div>
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-th-muted mb-1.5">Notes</label>
 <textarea
 rows={2}
 placeholder="Optional posting notes..."
 className="w-full px-3 py-2 rounded-lg border border-th-border -strong bg-white text-th-heading text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
 />
 </div>
 <div className="flex gap-3 pt-2">
 <button className="flex items-center justify-center rounded-lg h-10 px-6 bg-primary text-th-heading text-sm font-bold gap-2 shadow-lg shadow-primary/20 hover:bg-blue-700 transition-colors">
 <span className="material-symbols-outlined text-lg">check_circle</span>
 Post Payment
 </button>
 <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-white dark:bg-card-dark border border-th-border text-th-primary text-sm font-bold gap-2 hover:bg-th-surface-overlay/30 dark:hover:bg-th-surface-overlay transition-colors">
 Clear
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* Claim Preview / Summary Stats */}
 <div className="col-span-12 lg:col-span-5">
 <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark overflow-hidden shadow-sm">
 <div className="p-4 border-b border-th-border ">
 <h3 className="text-sm font-bold text-th-heading ">Payment Summary</h3>
 </div>
 <div className="p-4">
 {summary ? (
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-3">
 {Object.entries(summary).slice(0, 8).map(([key, value]) => (
  <div key={key}>
   <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted ">{key.replace(/_/g, ' ')}</p>
   <p className="text-sm text-th-heading font-bold mt-0.5 tabular-nums">
    {typeof value === 'number' ? (key.includes('rate') || key.includes('percent') ? `${value}%` : fmt(value)) : String(value)}
   </p>
  </div>
 ))}
 </div>
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center py-8 text-center">
 <span className="material-symbols-outlined text-4xl text-th-heading mb-2">info</span>
 <p className="text-sm text-th-muted ">No payment summary data available</p>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Batch Posting */}
 {activeTab === 'batch' && (
 <div className="space-y-4">
 {batchItems.length === 0 ? (
  <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark p-12 flex flex-col items-center justify-center text-center">
   <span className="material-symbols-outlined text-4xl text-th-muted mb-3">inbox</span>
   <h3 className="text-lg font-bold text-th-heading mb-1">No Batch Items</h3>
   <p className="text-th-muted text-sm">No ERA files available for batch posting.</p>
  </div>
 ) : (
 <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark overflow-hidden shadow-sm">
 <div className="p-4 border-b border-th-border ">
 <h3 className="text-lg font-bold text-th-heading ">Batch Posting from ERA</h3>
 <p className="text-xs text-th-muted mt-1">Post matched payments in bulk from processed ERA files</p>
 </div>
 <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
 {batchItems.map((batch) => (
 <div key={batch.eraId} className="p-4">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-3">
 <span className="text-sm font-mono text-primary font-bold">{batch.eraId}</span>
 <span className="text-sm text-th-heading font-medium">{batch.payer}</span>
 <span className="text-sm font-bold text-th-primary tabular-nums">{fmt(batch.total)}</span>
 </div>
 <div className="flex items-center gap-3">
 <div className="flex gap-4 text-xs">
 <span className="text-emerald-400 tabular-nums">{batch.matched} matched</span>
 <span className="text-red-400 tabular-nums">{batch.unmatched} unmatched</span>
 <span className="text-amber-400 tabular-nums">{batch.exceptions} exceptions</span>
 </div>
 <button className="px-3 py-1.5 rounded-lg bg-primary text-th-heading text-xs font-bold hover:bg-blue-700 transition-colors">
 Post Matched
 </button>
 </div>
 </div>
 <div className="h-2 w-full bg-th-surface-overlay rounded-full overflow-hidden">
 <div
 className="h-full rounded-full transition-all"
 style={{
 width: `${batch.progress}%`,
 background: batch.progress >= 80 ? '#10b981' : batch.progress >= 50 ? '#f59e0b' : '#ef4444',
 }}
 ></div>
 </div>
 <p className="text-xs text-th-muted mt-1 tabular-nums">{batch.progress}% ready to post</p>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 );
}
