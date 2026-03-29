import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-th-border rounded ${className}`} />;
}

function fmt$(n) {
  if (n == null) return '$0';
  const a = Math.abs(n);
  if (a >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function PatientAccounts() {
 const [activeTab, setActiveTab] = useState('registration');
 const [loading, setLoading] = useState(true);
 const [arSummary, setArSummary] = useState(null);
 const [collectionsSummary, setCollectionsSummary] = useState(null);

 useEffect(() => {
   Promise.all([
     api.ar.getSummary(),
     api.collections.getSummary(),
   ]).then(([ar, col]) => {
     if (ar) setArSummary(ar);
     if (col) setCollectionsSummary(col);
   }).catch(err => console.error('PatientAccounts load error:', err))
     .finally(() => setLoading(false));
 }, []);

 // ── Derive financial overview from AR + Collections ─────────────────────
 const financial = (() => {
   const balance = arSummary?.total_ar || arSummary?.total_outstanding || 342.50;
   const collected = collectionsSummary?.total_collected || collectionsSummary?.collections_mtd || 0;
   const pending = collectionsSummary?.total_pending || collectionsSummary?.open_tasks || 0;
   const rate = collectionsSummary?.collection_rate || collectionsSummary?.success_rate || 0;
   const score = rate >= 80 ? 842 : rate >= 60 ? 680 : 520;
   const likelihood = rate >= 80 ? 'High' : rate >= 60 ? 'Medium' : 'Low';
   return { balance, collected, pending, rate, score, likelihood };
 })();

 // ── Derive AR breakdown for billing tab ─────────────────────────────────
 const arBreakdown = (() => {
   if (!arSummary?.buckets && !arSummary?.aging_buckets) return [];
   const buckets = arSummary.buckets || arSummary.aging_buckets || [];
   return buckets.map(b => ({
     label: b.bucket || b.label || b.range,
     amount: b.amount || b.total || 0,
     count: b.count || b.claim_count || 0,
   }));
 })();

 return (
 <div className="flex flex-col h-full overflow-y-auto font-sans">
 {/* Top Patient Header Card */}
 <div className="bg-th-surface-raised border-b border-th-border p-6 pb-0">
 <div className="flex flex-wrap justify-between items-start gap-6 max-w-7xl mx-auto">
 <div className="flex items-center gap-6">
 <div className="relative">
 <div className="size-20 rounded-full bg-th-surface-overlay border-4 border-th-border shadow-sm flex items-center justify-center">
 <span className="material-symbols-outlined text-3xl text-th-secondary">person</span>
 </div>
 <div className="absolute -bottom-1 -right-1 size-6 bg-emerald-500 rounded-full border-2 border-[#111827] flex items-center justify-center">
 <span className="material-symbols-outlined text-th-heading text-[14px] font-bold">check</span>
 </div>
 </div>
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <h1 className="text-2xl font-bold text-th-heading">Johnathan Davis Doe</h1>
 <span className="px-2.5 py-0.5 rounded-full bg-th-surface-overlay text-th-secondary text-xs font-bold border border-th-border">MRN: 8472-192</span>
 </div>
 <div className="flex items-center gap-4 text-sm text-th-secondary font-medium">
 <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">cake</span> 05/12/1980 (43y)</span>
 <span className="w-1 h-1 rounded-full bg-th-surface-overlay"></span>
 <span>Male</span>
 <span className="w-1 h-1 rounded-full bg-th-surface-overlay"></span>
 <span>English</span>
 </div>
 </div>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center gap-2 px-4 py-2 bg-th-surface-raised border border-th-border text-th-heading rounded-lg text-sm font-bold shadow-sm hover:bg-th-surface-overlay transition-all">
 <span className="material-symbols-outlined text-[20px]">print</span>
 Print Forms
 </button>
 <button className="flex items-center gap-2 px-5 py-2 bg-primary text-th-heading rounded-lg text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all">
 <span className="material-symbols-outlined text-[20px]">bolt</span>
 Quick Actions
 </button>
 </div>
 </div>

 {/* Navigation Tabs */}
 <div className="flex items-center gap-8 mt-8 border-b border-th-border max-w-7xl mx-auto">
 {['Registration', 'Insurance', 'History', 'Documents', 'Billing', 'Appointments'].map((tab) => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab.toLowerCase())}
 className={`pb-4 text-sm font-semibold border-b-2 transition-all ${activeTab === tab.toLowerCase()
 ? 'border-primary text-primary'
 : 'border-transparent text-th-secondary hover:text-th-heading'
 }`}
 >
 {tab}
 </button>
 ))}
 </div>
 </div>

 {/* Main Scrollable Content */}
 <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Left Column (2/3) */}
 <div className="lg:col-span-2 space-y-6">
 {/* Status Chips */}
 <div className="flex flex-wrap gap-3">
 {loading ? (
   [1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-44" />)
 ) : (
 <>
 <div className="flex h-10 items-center gap-2 rounded-lg bg-th-surface-raised border border-th-border px-4">
 <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
 <p className="text-th-heading text-sm font-semibold">BlueCross BlueShield</p>
 </div>
 <div className="flex h-10 items-center gap-2 rounded-lg bg-th-surface-raised border border-th-border px-4">
 <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
 <p className="text-th-heading text-sm font-semibold">Coverage: Active</p>
 </div>
 <div className="flex h-10 items-center gap-2 rounded-lg bg-th-surface-raised border border-th-border px-4">
 <span className="material-symbols-outlined text-amber-500 text-[20px]">history_edu</span>
 <p className="text-th-heading text-sm font-semibold">Pre-Auth: {collectionsSummary?.open_tasks ?? 2} Pending</p>
 </div>
 <div className="flex h-10 items-center gap-2 rounded-lg bg-th-surface-raised border border-th-border px-4">
 <span className="material-symbols-outlined text-primary text-[20px]">medical_information</span>
 <p className="text-th-heading text-sm font-semibold">PCP: Dr. Sarah Chen</p>
 </div>
 </>
 )}
 </div>

 {/* AR Aging Breakdown (from live data) */}
 {arBreakdown.length > 0 && (
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 hover:shadow-lg transition-all duration-200">
   <div className="flex justify-between items-center mb-6">
     <h3 className="text-th-heading text-lg font-bold tracking-tight flex items-center gap-2">
       <span className="material-symbols-outlined text-primary">bar_chart</span>
       A/R Aging Breakdown
     </h3>
     <span className="text-xs font-bold text-th-muted uppercase">From live AR data</span>
   </div>
   <div className="space-y-3">
     {arBreakdown.map((b, i) => (
       <div key={i} className="flex items-center gap-4">
         <span className="text-xs font-bold text-th-secondary w-24 truncate">{b.label}</span>
         <div className="flex-1 bg-th-surface-overlay rounded-full h-2.5">
           <div
             className={`h-2.5 rounded-full ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-primary' : i === 2 ? 'bg-amber-500' : 'bg-red-500'}`}
             style={{ width: `${Math.min(100, (b.amount / (arSummary?.total_ar || 1)) * 100)}%` }}
           ></div>
         </div>
         <span className="text-sm font-bold text-th-heading tabular-nums w-24 text-right">{fmt$(b.amount)}</span>
         <span className="text-xs text-th-muted tabular-nums">{b.count} claims</span>
       </div>
     ))}
   </div>
 </div>
 )}

 {/* Medical History Timeline */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-th-heading text-lg font-bold tracking-tight">Medical History</h3>
 <button className="text-primary text-sm font-semibold hover:underline">View Full Record</button>
 </div>
 <div className="relative overflow-x-auto pb-2">
 <div className="flex min-w-[600px] items-center gap-0">
 <div className="flex flex-col items-center flex-1 relative group cursor-pointer text-center">
 <div className="w-full h-0.5 bg-th-surface-overlay absolute top-4 left-1/2"></div>
 <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center relative z-10 border-2 border-primary group-hover:scale-110 transition-transform bg-th-surface-raised">
 <span className="material-symbols-outlined text-primary text-[18px]">emergency</span>
 </div>
 <p className="text-[10px] font-bold text-th-muted mt-2 uppercase">OCT 12</p>
 <p className="text-xs font-bold text-th-heading mt-0.5">ER Visit</p>
 </div>
 <div className="flex flex-col items-center flex-1 relative group cursor-pointer text-center">
 <div className="w-full h-0.5 bg-th-surface-overlay absolute top-4"></div>
 <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center relative z-10 border-2 border-emerald-500 group-hover:scale-110 transition-transform bg-th-surface-raised">
 <span className="material-symbols-outlined text-emerald-500 text-[18px]">content_paste_search</span>
 </div>
 <p className="text-[10px] font-bold text-th-muted mt-2 uppercase">NOV 02</p>
 <p className="text-xs font-bold text-th-heading mt-0.5">Follow-up</p>
 </div>
 <div className="flex flex-col items-center flex-1 relative group cursor-pointer text-center">
 <div className="w-full h-0.5 bg-th-surface-overlay absolute top-4"></div>
 <div className="size-8 rounded-full bg-primary flex items-center justify-center relative z-10 shadow-lg shadow-primary/40 group-hover:scale-110 transition-transform">
 <span className="material-symbols-outlined text-th-heading text-[18px]">event</span>
 </div>
 <p className="text-[10px] font-bold text-primary mt-2 uppercase">TODAY</p>
 <p className="text-xs font-bold text-th-heading mt-0.5">MRI Imaging</p>
 </div>
 <div className="flex flex-col items-center flex-1 relative opacity-50 text-center">
 <div className="w-full h-0.5 bg-th-surface-overlay absolute top-4 right-1/2"></div>
 <div className="size-8 rounded-full bg-th-surface-overlay flex items-center justify-center relative z-10 border-2 border-th-border-strong">
 <span className="material-symbols-outlined text-th-secondary text-[18px]">calendar_today</span>
 </div>
 <p className="text-[10px] font-bold text-th-muted mt-2 uppercase">DEC 20</p>
 <p className="text-xs font-bold text-th-heading mt-0.5">Routine Lab</p>
 </div>
 </div>
 </div>
 </div>

 {/* Recent Documents */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-th-heading text-lg font-bold tracking-tight">Recent Documents</h3>
 <button className="flex items-center gap-1.5 px-3 py-1.5 bg-th-surface-overlay text-th-heading rounded-lg text-xs font-bold hover:bg-th-surface-overlay transition-colors">
 <span className="material-symbols-outlined text-[18px]">upload</span>
 Upload New
 </button>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 <div className="group relative aspect-[1.4/1] rounded-xl overflow-hidden bg-th-surface-overlay/50 border border-th-border cursor-pointer hover:ring-2 ring-primary ring-offset-2 ring-offset-[#111827] transition-all flex items-center justify-center">
 <div className="absolute top-2 right-2 z-10"><span className="px-1.5 py-0.5 rounded bg-emerald-500 text-th-heading text-[9px] font-bold uppercase">OCR: 99%</span></div>
 <span className="material-symbols-outlined text-th-secondary text-4xl group-hover:text-primary transition-colors">badge</span>
 <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
 <p className="text-th-heading text-[10px] font-bold truncate">Driver's License</p>
 </div>
 </div>
 <div className="group relative aspect-[1.4/1] rounded-xl overflow-hidden bg-th-surface-overlay/50 border border-th-border cursor-pointer hover:ring-2 ring-primary ring-offset-2 ring-offset-[#111827] transition-all flex items-center justify-center">
 <div className="absolute top-2 right-2 z-10"><span className="px-1.5 py-0.5 rounded bg-emerald-500 text-th-heading text-[9px] font-bold uppercase">OCR: 94%</span></div>
 <span className="material-symbols-outlined text-th-secondary text-4xl group-hover:text-primary transition-colors">credit_card</span>
 <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
 <p className="text-th-heading text-[10px] font-bold truncate">Insurance Card</p>
 </div>
 </div>
 <div className="group relative aspect-[1.4/1] rounded-xl overflow-hidden bg-th-surface-overlay/50 border border-th-border cursor-pointer hover:ring-2 ring-primary ring-offset-2 ring-offset-[#111827] transition-all flex items-center justify-center">
 <span className="material-symbols-outlined text-th-secondary text-4xl group-hover:text-primary transition-colors">picture_as_pdf</span>
 <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
 <p className="text-th-heading text-[10px] font-bold truncate">Referral.pdf</p>
 </div>
 </div>
 <div className="aspect-[1.4/1] rounded-xl border-2 border-dashed border-th-border hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center group">
 <span className="material-symbols-outlined text-th-muted group-hover:text-primary mb-1">add_circle</span>
 <p className="text-th-muted group-hover:text-primary text-[10px] font-bold uppercase">Add Doc</p>
 </div>
 </div>
 </div>
 </div>

 {/* Right Column (1/3) */}
 <div className="space-y-6">
 {/* Financial Counselor Card */}
 <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center gap-2 mb-6">
 <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
 <h3 className="text-th-heading text-lg font-bold tracking-tight">Financial Overview</h3>
 </div>

 {loading ? (
   <div className="space-y-4">
     <Skeleton className="h-24 w-full" />
     <Skeleton className="h-16 w-full" />
     <Skeleton className="h-10 w-full" />
   </div>
 ) : (
 <>
 <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 mb-6">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-xs font-bold text-primary/80 uppercase tracking-wide mb-1">Financial Health</p>
 <div className="flex items-baseline gap-1">
 <span className="text-3xl font-black text-primary tabular-nums">{financial.score}</span>
 <span className="text-xs font-bold text-th-muted tabular-nums">/ 1000</span>
 </div>
 </div>
 <div className="p-2 bg-th-surface-raised rounded-lg shadow-sm">
 <span className="material-symbols-outlined text-emerald-500">security</span>
 </div>
 </div>
 <p className="text-[11px] text-th-secondary mt-2 font-medium">Likelihood to pay: <span className={`font-bold ${financial.likelihood === 'High' ? 'text-emerald-500' : financial.likelihood === 'Medium' ? 'text-amber-500' : 'text-red-500'}`}>{financial.likelihood}</span></p>
 </div>

 <div className="space-y-4 mb-6">
 <div className="flex justify-between items-center">
 <p className="text-xs font-bold text-th-muted uppercase">Current Balance</p>
 <p className="text-xl font-black text-th-heading tabular-nums">{fmt$(financial.balance)}</p>
 </div>
 <div className="bg-th-surface-overlay/50 rounded-lg p-3 space-y-2">
 <div className="flex justify-between text-sm">
 <span className="text-th-secondary">Total Collected (MTD)</span>
 <span className="text-emerald-500 font-bold tabular-nums">{fmt$(financial.collected)}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-th-secondary">Pending Tasks</span>
 <span className="text-th-heading font-bold tabular-nums">{typeof financial.pending === 'number' ? financial.pending.toLocaleString() : financial.pending}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-th-secondary">Collection Rate</span>
 <span className="text-th-heading font-bold tabular-nums">{typeof financial.rate === 'number' ? `${financial.rate.toFixed(1)}%` : financial.rate}</span>
 </div>
 </div>
 </div>

 <div className="space-y-3">
 <button className="w-full py-2.5 bg-primary text-th-heading rounded-lg text-sm font-bold shadow-sm shadow-primary/20 hover:scale-[1.02] transition-transform">Online Payment</button>
 <button className="w-full py-2.5 border border-th-border text-th-heading rounded-lg text-sm font-bold hover:bg-th-surface-overlay/50 transition-colors">Establish Plan</button>
 </div>
 </>
 )}
 </div>

 {/* Scheduling Mini-Widget */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-center mb-4">
 <h3 className="text-th-heading text-lg font-bold tracking-tight">Provider Availability</h3>
 <span className="text-xs font-bold text-th-muted">NOV 20-24</span>
 </div>
 <div className="space-y-3">
 <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-th-surface-overlay/50 transition-colors cursor-pointer border border-transparent hover:border-th-border">
 <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">SC</div>
 <div className="flex-1">
 <p className="text-sm font-bold text-th-heading">Dr. Sarah Chen</p>
 <p className="text-[10px] text-emerald-500 font-bold">3 Slots Available</p>
 </div>
 <span className="material-symbols-outlined text-th-muted text-sm">chevron_right</span>
 </div>
 <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-th-surface-overlay/50 transition-colors cursor-pointer border border-transparent hover:border-th-border">
 <div className="size-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold text-xs">RM</div>
 <div className="flex-1">
 <p className="text-sm font-bold text-th-heading">Dr. Robert Mills</p>
 <p className="text-[10px] text-amber-500 font-bold">Limited Availability</p>
 </div>
 <span className="material-symbols-outlined text-th-muted text-sm">chevron_right</span>
 </div>
 <div className="flex items-center gap-3 p-2 rounded-lg opacity-60">
 <div className="size-8 rounded-full bg-th-surface-overlay flex items-center justify-center text-th-secondary font-bold text-xs">AG</div>
 <div className="flex-1">
 <p className="text-sm font-bold text-th-heading">Dr. Amy Grant</p>
 <p className="text-[10px] text-th-muted font-bold">Unavailable</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </main>
 </div>
 );
}
