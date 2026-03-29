import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

const fmt = (n) => {
 if (n == null) return '--';
 if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
 if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
 return '$' + n.toLocaleString();
};

export function CollectionsCommand() {
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [forecastData, setForecastData] = useState(null);
 const [collSummary, setCollSummary] = useState(null);
 const [arSummary, setArSummary] = useState(null);
 const [queueItems, setQueueItems] = useState([]);
 const [aiInsights, setAiInsights] = useState([]);
 const [reconSummary, setReconSummary] = useState(null);

 useEffect(() => {
  let cancelled = false;
  async function fetchData() {
   setLoading(true);
   setError(null);
   try {
    const [forecast, coll, ar, queue, recon] = await Promise.all([
     api.forecast.getSummary(),
     api.collections.getSummary(),
     api.ar.getSummary(),
     api.collections.getQueue({ page: 1, size: 10, priority: 'CRITICAL' }),
     api.reconciliation.getSummary(),
    ]);
    if (cancelled) return;
    setForecastData(forecast);
    setCollSummary(coll);
    setArSummary(ar);
    setQueueItems(queue?.items || []);
    setReconSummary(recon);
   } catch (err) {
    if (!cancelled) setError(err.message);
   } finally {
    if (!cancelled) setLoading(false);
   }
  }
  fetchData();

  // Load AI insights non-blocking
  api.ai.getInsights('collections').then(r => {
   if (!cancelled) setAiInsights(r?.insights || []);
  });

  return () => { cancelled = true; };
 }, []);

 // Derived KPIs
 const weeklyTarget = forecastData?.weekly_target || forecastData?.total_expected || 1200000;
 const weeklyActual = forecastData?.weekly_actual || forecastData?.total_collected || reconSummary?.total_posted || 0;
 const weeklyPct = weeklyTarget > 0 ? Math.round((weeklyActual / weeklyTarget) * 100) : 0;
 const dailyExpected = forecastData?.daily_expected || Math.round(weeklyTarget / 7);
 const dailyActual = forecastData?.daily_actual || reconSummary?.today_posted || 0;
 const dailyPct = dailyExpected > 0 ? Math.round((dailyActual / dailyExpected) * 100) : 0;

 // Waterfall steps from recon/forecast data
 const totalAR = arSummary?.total_ar || 0;
 const forecastAmount = forecastData?.total_expected || Math.round(totalAR * 0.85);
 const postedAmount = reconSummary?.total_posted || forecastData?.total_collected || Math.round(forecastAmount * 0.72);
 const reconciledAmount = reconSummary?.total_reconciled || Math.round(postedAmount * 0.78);

 const waterfallSteps = [
  { label: 'Expected Revenue', val: fmt(totalAR || forecastAmount * 1.18), h: 100 },
  { label: 'Daily Forecast', val: fmt(forecastAmount), h: totalAR > 0 ? Math.round((forecastAmount / totalAR) * 100) : 85 },
  { label: 'Payment Posted (EHR)', val: fmt(postedAmount), h: totalAR > 0 ? Math.round((postedAmount / totalAR) * 100) : 65 },
  { label: 'Bank Reconciled', val: fmt(reconciledAmount), h: totalAR > 0 ? Math.round((reconciledAmount / totalAR) * 100) : 45 },
 ];

 const reconGap = postedAmount - reconciledAmount;

 // Payer recovery velocity from AR or collections data
 const payerVelocity = (() => {
  const buckets = arSummary?.by_payer || arSummary?.payer_breakdown || [];
  if (buckets.length > 0) {
   return buckets.slice(0, 4).map(p => ({
    label: p.payer || p.payer_name || p.name,
    val: p.collection_rate || p.recovery_rate || Math.round((p.collected || 0) / Math.max(p.balance || 1, 1) * 100),
    color: (p.collection_rate || p.recovery_rate || 50) > 80 ? 'bg-emerald-500' : (p.collection_rate || p.recovery_rate || 50) > 60 ? 'bg-primary' : (p.collection_rate || p.recovery_rate || 50) > 40 ? 'bg-amber-500' : 'bg-rose-500',
   }));
  }
  // Derive from queue items payer distribution
  const payerMap = {};
  queueItems.forEach(q => {
   const payer = q.payer_name || q.payer_id || 'Unknown';
   if (!payerMap[payer]) payerMap[payer] = { total: 0, count: 0 };
   payerMap[payer].total += q.balance || 0;
   payerMap[payer].count++;
  });
  const payers = Object.entries(payerMap).sort((a, b) => b[1].total - a[1].total).slice(0, 4);
  if (payers.length > 0) {
   const colors = ['bg-emerald-500', 'bg-primary', 'bg-amber-500', 'bg-rose-500'];
   return payers.map(([name, data], i) => ({
    label: name,
    val: Math.round(data.count / Math.max(queueItems.length, 1) * 100),
    color: colors[i] || 'bg-primary',
   }));
  }
  return [];
 })();

 // AI insight text
 const topInsight = aiInsights.length > 0 ? aiInsights[0] : null;

 if (loading) {
  return (
   <div className="flex h-full font-sans bg-[#f6f8f8] dark:bg-[#101d22] text-th-heading overflow-hidden custom-scrollbar">
    <main className="flex-1 flex items-center justify-center">
     <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-th-muted text-sm">Loading command center data...</p>
     </div>
    </main>
   </div>
  );
 }

 if (error) {
  return (
   <div className="flex h-full font-sans bg-[#f6f8f8] dark:bg-[#101d22] text-th-heading overflow-hidden custom-scrollbar">
    <main className="flex-1 flex flex-col items-center justify-center gap-4">
     <span className="material-symbols-outlined text-4xl text-red-400">error</span>
     <p className="text-th-muted text-sm">Failed to load command center data.</p>
     <p className="text-th-muted text-xs">{error}</p>
    </main>
   </div>
  );
 }

 return (
 <div className="flex h-full font-sans bg-[#f6f8f8] dark:bg-[#101d22] text-th-heading overflow-hidden custom-scrollbar">
 {/* Main Content Area */}
 <main className="flex-1 flex flex-col overflow-hidden">
 {/* Top Navigation Bar */}
 <header className="h-16 border-b border-[#283539] flex items-center justify-between px-8 bg-[#101d22]/50 backdrop-blur-sm z-10 shrink-0">
 <div className="flex items-center gap-4">
 <h2 className="text-lg font-bold text-th-heading tracking-tight">Collections Command & Activity</h2>
 <div className="flex items-center gap-2 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
 <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
 <span className="text-[10px] font-bold text-emerald-500 uppercase">Live Systems</span>
 </div>
 </div>
 </header>

 {/* Dashboard Scrollable Section */}
 <div className="flex-1 overflow-y-auto p-8 space-y-6">
 {/* KPI Section */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {/* Weekly Revenue Forecast */}
 <div className="bg-white dark:bg-[#16252b] border border-th-border dark:border-[#283539] p-6 rounded-xl shadow-sm dark:shadow-none border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start mb-4">
 <p className="text-sm font-medium text-th-muted ">Weekly Revenue Forecast</p>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${weeklyPct >= 70 ? 'text-primary bg-primary/10' : weeklyPct >= 50 ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10'}`}>
  {weeklyPct >= 70 ? 'On Track' : weeklyPct >= 50 ? 'At Risk' : 'Behind'}
 </span>
 </div>
 <div className="flex items-end gap-3">
 <h3 className="text-3xl font-bold text-th-heading tabular-nums">{fmt(weeklyActual)}</h3>
 <p className="text-sm font-medium text-th-muted mb-1.5 tabular-nums">/ {fmt(weeklyTarget)} Target</p>
 </div>
 <div className="mt-4 h-2 bg-th-surface-overlay dark:bg-[#283539] rounded-full overflow-hidden">
 <div className="h-full bg-primary" style={{ width: `${Math.min(weeklyPct, 100)}%` }}></div>
 </div>
 <p className="mt-3 text-xs text-th-secondary flex items-center gap-1">
 <span className="material-symbols-outlined text-[14px] text-emerald-500">trending_up</span>
 <span className="text-emerald-500 font-bold tabular-nums">{weeklyPct}%</span> of target
 </p>
 </div>
 {/* Expected Daily Payment */}
 <div className="bg-white dark:bg-[#16252b] border border-th-border dark:border-[#283539] p-6 rounded-xl shadow-sm dark:shadow-none border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start mb-4">
 <p className="text-sm font-medium text-th-muted ">Expected Daily Payment</p>
 <span className="material-symbols-outlined text-th-muted">payments</span>
 </div>
 <h3 className="text-3xl font-bold text-th-heading tabular-nums">{fmt(dailyExpected)}</h3>
 <p className="mt-3 text-xs text-th-secondary">Today's target reached: <span className="text-th-heading font-bold tabular-nums">{dailyPct}%</span></p>
 <div className="mt-4 flex gap-1">
 {[...Array(5)].map((_, i) => (
 <div key={i} className={`h-1 flex-1 rounded-full ${i < Math.ceil(dailyPct / 20) ? 'bg-primary' : 'bg-th-surface-overlay dark:bg-[#283539]'}`}></div>
 ))}
 </div>
 </div>
 {/* AI Alert Panel */}
 <div className="lg:col-span-1 bg-primary/5 border border-primary/20 p-6 rounded-xl relative overflow-hidden">
 <div className="absolute top-0 right-0 p-3">
 <span className="material-symbols-outlined text-primary/40 text-4xl">auto_awesome</span>
 </div>
 <div className="flex items-center gap-2 mb-3">
 <span className="material-symbols-outlined text-primary text-lg">psychology</span>
 <p className="text-sm font-bold text-primary tracking-wide uppercase">AI Insight</p>
 </div>
 <p className="text-sm text-th-muted leading-relaxed">
 {topInsight ? topInsight.body || topInsight.description || topInsight.title : (
  collSummary ? `${collSummary.active_alerts || 0} active collection alerts. Total collectible: ${fmt(collSummary.total_collectible || 0)}.` : 'Loading AI insights...'
 )}
 </p>
 {topInsight && (
 <button className="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-1">
 View Root Cause Analysis <span className="material-symbols-outlined text-sm">arrow_forward</span>
 </button>
 )}
 </div>
 </div>

 {/* Waterfall & Main Chart */}
 <div className="bg-white dark:bg-[#16252b] border border-th-border dark:border-[#283539] rounded-xl overflow-hidden shadow-sm dark:shadow-none">
 <div className="p-6 border-b border-th-border dark:border-[#283539] flex justify-between items-center">
 <h3 className="text-base font-bold text-th-heading ">Financial Flow Waterfall</h3>
 <div className="flex gap-2">
 <div className="flex items-center gap-1.5 px-3 py-1 bg-th-surface-overlay dark:bg-[#283539] rounded text-[10px] font-bold text-th-muted ">
 <span className="size-2 bg-th-surface-overlay/300 rounded-full"></span> PREDICTED
 </div>
 <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded text-[10px] font-bold text-primary">
 <span className="size-2 bg-primary rounded-full"></span> ACTUAL POSTED
 </div>
 </div>
 </div>
 <div className="p-8">
 <div className="flex items-end justify-between gap-4 h-64">
 {/* Steps */}
 {waterfallSteps.map((s, i) => (
 <div key={i} className="flex-1 flex flex-col items-center group">
 <div className="w-full bg-th-surface-overlay/50 border border-th-border-strong/50 -strong rounded-t-lg relative" style={{ height: `${s.h}%` }}>
 <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-th-secondary tabular-nums">{s.val}</div>
 {i > 0 && <div className="absolute inset-x-0 bottom-0 bg-primary/40 border-t border-primary" style={{ height: i === 1 ? '80%' : i === 2 ? '88%' : '100%' }}></div>}
 </div>
 <div className="mt-4 text-[10px] font-bold text-th-muted uppercase text-center">{s.label}</div>
 </div>
 ))}
 </div>
 {reconGap > 0 && (
 <div className="mt-12 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-between">
 <div className="flex items-center gap-3">
 <span className="material-symbols-outlined text-rose-500">warning</span>
 <div>
 <p className="text-xs font-bold text-th-heading ">Reconciliation Gap Detected</p>
 <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">{fmt(reconGap)} variance between Posted and Reconciled amounts. Priority attention required.</p>
 </div>
 </div>
 <button className="bg-rose-500 text-th-heading text-[10px] font-bold px-4 py-1.5 rounded uppercase hover:bg-rose-600 transition-colors">Resolve Gaps</button>
 </div>
 )}
 </div>
 </div>

 {/* Bottom Row: Activity Tracker & Detailed Stats */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Activity Tracker */}
 <div className="lg:col-span-2 bg-white dark:bg-[#16252b] border border-th-border dark:border-[#283539] rounded-xl overflow-hidden flex flex-col shadow-sm dark:shadow-none">
 <div className="p-6 border-b border-th-border dark:border-[#283539] flex justify-between items-center">
 <h3 className="text-base font-bold text-th-heading ">Recent Collection Activity</h3>
 <button className="text-[10px] font-bold text-th-secondary hover:text-th-heading dark:hover:text-th-heading uppercase tracking-wider flex items-center gap-1">
 View Full Log <span className="material-symbols-outlined text-xs">open_in_new</span>
 </button>
 </div>
 <div className="flex-1 p-0 overflow-y-auto max-h-[400px]">
 <table className="w-full text-left">
 <thead className="bg-th-surface-overlay/30 dark:bg-[#101d22]/30 sticky top-0">
 <tr className="text-[10px] font-bold text-th-muted uppercase tracking-wider">
 <th className="px-6 py-3 border-b border-th-border dark:border-[#283539]">Account</th>
 <th className="px-6 py-3 border-b border-th-border dark:border-[#283539]">Payer</th>
 <th className="px-6 py-3 border-b border-th-border dark:border-[#283539]">Balance</th>
 <th className="px-6 py-3 border-b border-th-border dark:border-[#283539]">Priority</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-[#283539]">
 {queueItems.length > 0 ? queueItems.map((item) => (
 <tr key={item.id || item.claim_id} className="hover:bg-th-surface-overlay/30 dark:hover:bg-white/5 transition-colors">
 <td className="px-6 py-4">
  <div className="flex items-center gap-2">
  <div className="size-6 rounded bg-primary/20 flex items-center justify-center text-primary">
  <span className="material-symbols-outlined text-[16px]">{item.priority === 'CRITICAL' ? 'warning' : 'assignment'}</span>
  </div>
  <span className="text-xs font-bold text-th-heading ">{item.claim_id || item.id}</span>
  </div>
 </td>
 <td className="px-6 py-4 text-xs text-th-muted ">{item.payer_name || item.payer_id || '--'}</td>
 <td className="px-6 py-4 text-xs font-bold text-th-heading tabular-nums">{fmt(item.balance || 0)}</td>
 <td className="px-6 py-4">
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${
   item.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
   item.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
   'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
  }`}>{item.priority || 'Normal'}</span>
 </td>
 </tr>
 )) : (
 <tr>
 <td colSpan={4} className="px-6 py-8 text-center text-th-muted text-xs">No critical collection items in queue.</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Side Stats */}
 <div className="bg-white dark:bg-[#16252b] border border-th-border dark:border-[#283539] rounded-xl p-6 shadow-sm dark:shadow-none">
 <h3 className="text-sm font-bold text-th-heading mb-6 uppercase tracking-wider text-th-secondary">Payer Recovery Velocity</h3>
 <div className="space-y-6">
 {payerVelocity.length > 0 ? payerVelocity.map((p, i) => (
 <div key={i}>
 <div className="flex justify-between items-center mb-2">
 <span className="text-xs font-medium text-th-muted ">{p.label}</span>
 <span className="text-xs font-bold text-th-heading tabular-nums">{p.val}%</span>
 </div>
 <div className="h-1.5 bg-th-surface-overlay dark:bg-[#283539] rounded-full">
 <div className={`h-full ${p.color} rounded-full`} style={{ width: `${Math.min(p.val, 100)}%` }}></div>
 </div>
 </div>
 )) : (
 <p className="text-xs text-th-muted text-center py-4">No payer velocity data available.</p>
 )}
 </div>
 </div>
 </div>
 </div>
 </main>
 </div>
 );
}
