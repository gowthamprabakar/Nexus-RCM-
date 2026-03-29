import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export function BankReconciliation() {
 const [selectedDeposit, setSelectedDeposit] = useState(null);
 const [filter, setFilter] = useState('all');
 const [deposits, setDeposits] = useState([]);
 const [metrics, setMetrics] = useState({ unreconciledAmount: 0, suspenseAccountBalance: 0 });
 const [loading, setLoading] = useState(true);

 useEffect(() => {
   Promise.all([
     api.reconciliation.getSummary(),
     api.payments.getERABankMatch()
   ]).then(([summary, bankMatch]) => {
     if (summary) {
       setMetrics({
         unreconciledAmount: summary.unreconciled_amount || summary.unreconciledAmount || 0,
         suspenseAccountBalance: summary.suspense_balance || summary.suspenseAccountBalance || 0
       });
     }
     setDeposits(bankMatch?.items || bankMatch || []);
     setLoading(false);
   }).catch(() => setLoading(false));
 }, []);

 const filteredDeposits = deposits.filter(d => {
 if (filter === 'all') return true;
 return d.status.toLowerCase() === filter;
 });

 const getStatusColor = (status) => {
 switch (status) {
 case 'Matched': return 'bg-emerald-900/30 text-emerald-400 border-emerald-800';
 case 'Partial Match': return 'bg-amber-900/30 text-amber-400 border-amber-800';
 case 'Unmatched': return 'bg-th-surface-overlay text-th-secondary border-th-border border-dashed border-2';
 case 'Flagged': return 'bg-red-900/30 text-red-400 border-red-800';
 default: return 'bg-th-surface-overlay text-th-secondary';
 }
 };

 if (loading) return (
   <div className="flex-1 flex items-center justify-center h-full">
     <div className="text-th-secondary text-sm">Loading reconciliation data...</div>
   </div>
 );

 return (
 <div className="flex-1 overflow-y-auto font-sans h-full p-6">
 <div className="max-w-[1600px] mx-auto space-y-6">

 {/* Header & KPI */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
 <div>
 <h1 className="text-2xl font-black text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">account_balance</span>
 Bank Reconciliation Center
 </h1>
 <p className="text-th-secondary mt-1">Real-time matching of Bank Feeds (Actual) vs System Postings (Book). <span className="ai-descriptive">Descriptive AI</span></p>
 </div>
 <div className="flex gap-4">
 <div className="bg-th-surface-raised px-4 py-2 rounded-lg border border-th-border text-right border-l-[3px] border-l-red-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="text-xs font-semibold uppercase tracking-wider text-th-muted">Unreconciled Cash</div>
 <div className="text-xl font-mono font-bold text-red-400 tabular-nums">${metrics.unreconciledAmount.toLocaleString()}</div>
 </div>
 <div className="bg-th-surface-raised px-4 py-2 rounded-lg border border-th-border text-right border-l-[3px] border-l-amber-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="text-xs font-semibold uppercase tracking-wider text-th-muted">Suspense Balance</div>
 <div className="text-xl font-mono font-bold text-amber-400 tabular-nums">${metrics.suspenseAccountBalance.toLocaleString()}</div>
 </div>
 </div>
 </div>

 {/* Main Content Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

 {/* Left Col: Deposit Feed */}
 <div className="lg:col-span-2 space-y-4">
 {/* Filters */}
 <div className="flex gap-2">
 {['all', 'matched', 'unmatched', 'flagged'].map(f => (
 <button
 key={f}
 onClick={() => setFilter(f)}
 className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-colors ${filter === f ? 'bg-primary text-th-heading shadow-lg shadow-primary/30' : 'bg-th-surface-raised text-th-heading hover:bg-th-surface-overlay'}`}
 >
 {f}
 </button>
 ))}
 </div>

 {/* List */}
 <div className="space-y-3">
 {filteredDeposits.map((deposit) => (
 <div
 key={deposit.id}
 onClick={() => setSelectedDeposit(deposit)}
 className={`group bg-th-surface-raised rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md relative overflow-hidden ${selectedDeposit?.id === deposit.id ? 'ring-2 ring-primary border-transparent' : 'border-th-border'}`}
 >
 {/* Status Line */}
 <div className={`absolute left-0 top-0 bottom-0 w-1 ${deposit.status === 'Matched' ? 'bg-emerald-500' : deposit.status === 'Unmatched' ? 'bg-slate-600' : 'bg-red-500'}`}></div>

 <div className="flex justify-between items-center pl-3">
 <div className="flex items-center gap-4">
 <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold ${deposit.amount > 10000 ? 'bg-violet-900/30 text-violet-400' : 'bg-th-surface-overlay text-th-secondary'}`}>
 {deposit.payer.charAt(0)}
 </div>
 <div>
 <div className="font-bold text-th-heading flex items-center gap-2">
 {deposit.payer}
 <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(deposit.status)}`}>
 {deposit.status}
 </span>
 </div>
 <div className="text-sm text-th-muted flex items-center gap-2">
 <span className="font-mono">{deposit.date}</span> -- {deposit.method} -- Ref: <span className="font-mono text-xs">{deposit.traceNumber}</span>
 </div>
 </div>
 </div>
 <div className="text-right">
 <div className="text-lg font-mono font-bold text-th-heading tabular-nums">${deposit.amount.toLocaleString()}</div>
 {deposit.matchVariance && (
 <div className="text-xs font-bold text-red-400 tabular-nums">Var: ${deposit.matchVariance}</div>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Right Col: Drill Down / Matcher */}
 <div className="lg:col-span-1">
 {selectedDeposit ? (
 <div className="bg-th-surface-raised rounded-xl border border-th-border shadow-xl sticky top-6 animate-slide-in-right">
 {/* Header */}
 <div className="p-6 border-b border-th-border bg-[#0f1623]">
 <div className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Drill-Through Analysis</div>
 <h2 className="text-xl font-black text-th-heading">{selectedDeposit.id}</h2>
 <div className="flex justify-between items-center mt-4">
 <div className="text-sm text-th-secondary">Bank Amount</div>
 <div className="font-mono font-bold text-lg text-th-heading tabular-nums">${selectedDeposit.amount.toLocaleString()}</div>
 </div>
 </div>

 {/* Content based on Status */}
 <div className="p-6 space-y-6">
 {selectedDeposit.status === 'Matched' && (
 <div className="text-center py-8">
 <div className="w-16 h-16 bg-emerald-900/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
 <span className="material-symbols-outlined text-3xl">check_circle</span>
 </div>
 <h3 className="font-bold text-th-heading mb-2">Fully Reconciled</h3>
 <p className="text-sm text-th-secondary">
 This deposit matches System Payment <span className="font-mono font-bold text-th-heading">PMT-8001</span> perfectly.
 </p>
 <div className="mt-6 border-t border-th-border pt-4 text-left">
 <div className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">Included Checks</div>
 {selectedDeposit.items.map(item => (
 <div key={item.id} className="flex justify-between text-sm py-1">
 <span className="font-mono text-th-secondary">{item.id}</span>
 <span className="font-mono text-th-heading tabular-nums">${item.amount.toLocaleString()}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {selectedDeposit.status === 'Unmatched' && (
 <div className="space-y-4">
 <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-3 text-sm text-amber-300 flex gap-2">
 <span className="material-symbols-outlined icon-filled">warning</span>
 <div>
 <div className="font-bold">Missing Allocation</div>
 Cash received in bank but no matching post found in RCM Pulse.
 </div>
 </div>
 <div className="flex items-center gap-2 mb-2">
 <span className="ai-diagnostic">Diagnostic AI</span>
 <span className="text-xs text-th-muted">Unmatched item analysis</span>
 </div>

 <div className="space-y-2">
 <button className="w-full py-3 bg-primary hover:bg-blue-700 text-th-heading rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2">
 <span className="material-symbols-outlined">search</span>
 Find Matching ERA
 </button>
 <button className="w-full py-3 bg-th-surface-overlay border border-th-border-strong hover:bg-slate-600 text-th-heading rounded-lg font-bold transition-all flex items-center justify-center gap-2">
 <span className="material-symbols-outlined">post_add</span>
 Post to Suspense
 </button>
 </div>
 </div>
 )}

 {selectedDeposit.status === 'Flagged' && (
 <div className="space-y-4">
 <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-sm text-red-300">
 <div className="font-bold flex items-center gap-2 mb-1">
 <span className="material-symbols-outlined icon-filled text-base">error</span>
 Anomaly Detected
 </div>
 {selectedDeposit.issue}
 </div>
 <div className="p-4 bg-th-surface-overlay rounded-lg border border-th-border">
 <h4 className="font-bold text-sm text-th-heading mb-2 flex items-center gap-2">AI Suggested Action <span className="ai-diagnostic">Diagnostic AI</span></h4>
 <p className="text-xs text-th-secondary mb-3">
 Based on payer history, this large round amount suggests a capitation or settling of multiple bulk claims.
 </p>
 <button className="text-xs font-bold text-primary hover:underline">View Historical Splits for Medicare</button>
 </div>
 </div>
 )}
 </div>
 </div>
 ) : (
 <div className="bg-th-surface-raised rounded-xl border border-th-border border-dashed p-10 text-center h-full flex flex-col items-center justify-center text-th-secondary">
 <span className="material-symbols-outlined text-4xl mb-4 opacity-50">touch_app</span>
 <p className="font-medium">Select a deposit to drill down</p>
 </div>
 )}
 </div>

 </div>
 </div>
 </div>
 );
}
