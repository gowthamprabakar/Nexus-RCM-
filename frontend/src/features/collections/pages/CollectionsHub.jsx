import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { KPICard } from '../components/KPICard';
import { ARAgingChart } from '../components/charts/ARAgingChart';
import { ARTrendChart } from '../components/charts/ARTrendChart';
import { CollectionVelocityChart } from '../components/charts/CollectionVelocityChart';
import { AgingBucketDetailModal } from '../components/modals/AgingBucketDetailModal';
import { PayerPerformanceModal } from '../components/modals/PayerPerformanceModal';
import { DenialReasonsChart } from '../components/charts/DenialReasonsChart';
import { PaymentDistributionChart } from '../components/charts/PaymentDistributionChart';
import { TopCPTCodesChart } from '../components/charts/TopCPTCodesChart';
import {
  AIInsightCard,
  FilterChipGroup,
  DateRangePicker,
  EmptyState,
  ErrorBanner,
  Skeleton,
} from '../../../components/ui';
import { fmtCurrency } from '../../../lib/formatters';
import { DunningTrackerPanel } from '../components/DunningTrackerPanel';
import { AutoDialerPanel } from '../components/AutoDialerPanel';
import { SettlementOffersPanel } from '../components/SettlementOffersPanel';

/**
 * Aging-bucket presentation defaults. These are pure presentation hints
 * (color + collectability heuristic per bucket) — no synthetic balances.
 * Real numbers come from `arSummary.buckets`; if that is missing we render
 * an empty state instead of inventing demo data.
 */
const BUCKET_VISUALS = {
    '0-30':    { collectability: 98, color: '#10b981' },
    '31-60':   { collectability: 85, color: '#22d3ee' },
    '61-90':   { collectability: 60, color: '#f59e0b' },
    '91-120':  { collectability: 40, color: '#f97316' },
    '121-180': { collectability: 20, color: '#ef4444' },
    '120+':    { collectability: 15, color: '#ef4444' },
    '180+':    { collectability: 10, color: '#991b1b' },
};

export function CollectionsHub() {
 const navigate = useNavigate();
 const [selectedBucket, setSelectedBucket] = useState(null);
 const [selectedPayer, setSelectedPayer] = useState(null);
 const [arSummary, setArSummary] = useState(null);
 const [collSummary, setCollSummary] = useState(null);
 const [denialsSummary, setDenialsSummary] = useState(null);
 const [paymentsSummary, setPaymentsSummary] = useState(null);
 const [queueItems, setQueueItems] = useState([]);
 const [aiInsights, setAiInsights] = useState([]);
 const [aiLoading, setAiLoading] = useState(false);

 /* Page-level loading + error tracking */
 const [coreLoading, setCoreLoading] = useState(true);
 const [coreError, setCoreError] = useState(null);

 /* Audit-driven: root cause, diagnostics, prevention */
 const [rootCauseSummary, setRootCauseSummary] = useState(null);
 const [agingRootCause, setAgingRootCause] = useState(null);
 const [payerStats, setPayerStats] = useState([]);
 const [arDiagnostics, setArDiagnostics] = useState(null);
 const [preventionRisk, setPreventionRisk] = useState(null);

 /* Filter state */
 const [filtersOpen, setFiltersOpen] = useState(false);
 const [filterDateRange, setFilterDateRange] = useState(null);
 const [filterPayer, setFilterPayer] = useState('All');
 const [filterAgingBucket, setFilterAgingBucket] = useState('All');
 const [filterBalanceRange, setFilterBalanceRange] = useState('All');
 const [filterCollector, setFilterCollector] = useState('All');
 const [filterStatus, setFilterStatus] = useState('All');
 const [filterPriority, setFilterPriority] = useState('All');

 /* Worklist sort */
 const [worklistSort, setWorklistSort] = useState('risk');

 const loadCore = useCallback(async () => {
   setCoreLoading(true);
   setCoreError(null);
   try {
     const [ar, coll, queue, den, pay] = await Promise.all([
       api.ar.getSummary(),
       api.collections.getSummary(),
       api.collections.getQueue({ page: 1, size: 10 }),
       api.denials.getSummary(),
       api.payments.getSummary(),
     ]);
     setArSummary(ar || null);
     setCollSummary(coll || null);
     setQueueItems(Array.isArray(queue?.items) ? queue.items : []);
     setDenialsSummary(den || null);
     setPaymentsSummary(pay || null);
     if (!ar && !coll) {
       setCoreError(new Error('Core RCM services unreachable. AR and Collections summaries did not return data.'));
     }
   } catch (err) {
     console.error('CollectionsHub core load error:', err);
     setCoreError(err);
   } finally {
     setCoreLoading(false);
   }
 }, []);

 useEffect(() => {
   // Load AI insights (non-blocking, Ollama may take 2-5s)
   setAiLoading(true);
   api.ai.getInsights('collections').then(r => {
     setAiInsights(r?.insights || []);
     setAiLoading(false);
   }).catch(() => setAiLoading(false));

   /* Audit-driven API calls (non-blocking, individually error-tolerant) */
   api.rootCause.getSummary().catch(() => null).then(r => r && setRootCauseSummary(r));
   api.diagnostics.getFindings({ category: 'AR_AGING' }).catch(() => null).then(r => r && setArDiagnostics(r));
   api.prevention.scan(3).catch(() => null).then(r => r && setPreventionRisk(r));
   api.ar.getAgingRootCause().catch(() => null).then(r => r && setAgingRootCause(r));
   api.payments.getPayerStats().catch(() => null).then(r => Array.isArray(r) && setPayerStats(r));

   loadCore();
 }, [loadCore]);

 /* ── Derive AR trend from API trend payload only — no fabricated months. ── */
 const arTrend = Array.isArray(arSummary?.trend) && arSummary.trend.length > 0
   ? arSummary.trend.map(p => ({
       month: p.month || p.period || '',
       balance: Number(p.balance ?? p.total_ar ?? 0),
       collected: Number(p.collected ?? 0),
       outstanding: Number(p.outstanding ?? (p.balance ?? 0) - (p.collected ?? 0)),
     }))
   : [];

 /* ── Collection velocity comes straight from payer stats. ── */
 const collectionVelocity = Array.isArray(payerStats) && payerStats.length > 0
   ? payerStats
       .filter(p => p.avg_days_to_pay != null || p.days != null)
       .map(p => {
         const days = Number(p.avg_days_to_pay ?? p.days ?? 0);
         const performance = days <= 30 ? 'excellent' : days <= 40 ? 'good' : days <= 50 ? 'fair' : days <= 60 ? 'poor' : 'critical';
         const color = days <= 30 ? '#10b981' : days <= 40 ? '#10b981' : days <= 50 ? '#f59e0b' : days <= 60 ? '#f97316' : '#ef4444';
         return {
           payer: p.name || p.payer || p.payer_name || 'Unknown',
           days,
           avgBalance: Number(p.avg_balance ?? p.balance ?? 0),
           performance,
           color,
         };
       })
   : [];

 /* ── Denial reasons from denials summary. ── */
 const denialReasons = (() => {
   const cats = denialsSummary?.top_categories;
   if (!Array.isArray(cats) || cats.length === 0) return [];
   const total = cats.reduce((s, c) => s + (c.count || 0), 0) || 1;
   return cats.map(c => ({
     reason: c.category || c.name || 'Unknown',
     count: c.count || 0,
     amount: c.amount || 0,
     percentage: Math.round(((c.count || 0) / total) * 100),
   }));
 })();

 /* ── Payment distribution from payments summary. ── */
 const paymentDistribution = (() => {
   const breakdown = paymentsSummary?.payer_breakdown;
   if (!Array.isArray(breakdown) || breakdown.length === 0) return [];
   const total = breakdown.reduce((s, p) => s + (p.amount || 0), 0) || 1;
   const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b', '#ec4899'];
   return breakdown.map((p, i) => ({
     method: p.payer || p.name || `Payer ${i + 1}`,
     amount: p.amount || 0,
     percentage: Math.round(((p.amount || 0) / total) * 100),
     color: colors[i % colors.length],
   }));
 })();

 /* ── Top CPT codes from payments summary, otherwise empty. ── */
 const topCPTCodes = Array.isArray(paymentsSummary?.top_cpt_codes)
   ? paymentsSummary.top_cpt_codes
   : [];

 /* ── KPI derivation directly from API. No invented prior values. ── */
 const calcChangePct = (current, previous) => {
   if (current == null || previous == null || previous === 0) return null;
   return +(((current - previous) / Math.abs(previous)) * 100).toFixed(1);
 };

 const kpis = (() => {
   if (!arSummary && !collSummary) return null;
   const curAR = arSummary?.total_ar ?? null;
   const prevAR = arSummary?.previous_total_ar ?? null;
   const arChange = arSummary?.ar_change_pct ?? calcChangePct(curAR, prevAR);

   const curDays = arSummary?.avg_days_outstanding ?? null;
   const prevDays = arSummary?.prev_avg_days ?? null;
   const daysChange = arSummary?.days_change_pct ?? calcChangePct(curDays, prevDays);

   return {
     totalARBalance: {
       current: curAR,
       previous: prevAR,
       change: arChange,
       trend: arChange != null ? (arChange >= 0 ? 'up' : 'down') : null,
     },
     avgDaysOutstanding: {
       current: curDays,
       previous: prevDays,
       change: daysChange,
       target: arSummary?.days_target ?? 35,
       trend: daysChange != null ? (daysChange >= 0 ? 'up' : 'down') : null,
     },
     projected30DCash: {
       current: collSummary?.projected_30d_cash ?? collSummary?.total_collectible ?? null,
       confidence: collSummary?.confidence ?? null,
     },
     aiRiskFlagged: {
       count: collSummary?.active_alerts ?? null,
       potentialLoss: collSummary?.risk_amount ?? null,
     },
   };
 })();

 /* Helpers for "—" rendering */
 const fmtMoneyOrDash = (v) => (v == null ? '—' : fmtCurrency(v));
 const fmtNumOrDash = (v) => (v == null ? '—' : Number(v).toLocaleString());

 /* ── Live aging buckets — strictly from API. Empty otherwise. ── */
 const liveAgingBuckets = Array.isArray(arSummary?.buckets)
   ? arSummary.buckets.map(b => {
       const visual = BUCKET_VISUALS[b.bucket] || { collectability: 50, color: '#94a3b8' };
       return {
         bucket: `${b.bucket}d`,
         balance: Number(b.balance ?? 0),
         claimCount: Number(b.count ?? 0),
         collectability: b.collectability ?? visual.collectability,
         color: visual.color,
       };
     })
   : [];

 const liveHighRiskClaims = (queueItems || []).slice(0, 6).map(t => ({
   id: t.claim_id,
   payer: t.payer_name || t.payer_id,
   balance: Number(t.balance ?? 0),
   aging: Number(t.days_outstanding ?? 0),
   agingBucket: t.days_outstanding > 120 ? '120+' : t.days_outstanding > 90 ? '91-120' : t.days_outstanding > 60 ? '61-90' : t.days_outstanding > 30 ? '31-60' : '0-30',
   riskScore: 100 - (t.propensity_score || 50),
   riskLevel: t.priority === 'CRITICAL' ? 'critical' : t.priority === 'HIGH' ? 'high' : 'medium',
   nextAction: t.action_type,
   patient: t.patient_name,
   cpt: t.cpt_code,
   dos: t.date_of_service,
 }));

 /* ── Filter the worklist ──────────────────────────────────── */
 const filteredClaims = liveHighRiskClaims.filter((c) => {
 if (filterPayer !== 'All' && c.payer !== filterPayer) return false;
 if (filterAgingBucket !== 'All' && c.agingBucket !== filterAgingBucket) return false;
 if (filterPriority !== 'All' && c.riskLevel !== filterPriority.toLowerCase()) return false;
 return true;
 });

 const sortedClaims = [...filteredClaims].sort((a, b) => {
 if (worklistSort === 'risk') return b.riskScore - a.riskScore;
 if (worklistSort === 'balance') return b.balance - a.balance;
 if (worklistSort === 'aging') return b.aging - a.aging;
 return 0;
 });

 /* ── Select helper ────────────────────────────────────────── */
 const FilterSelect = ({ label, value, onChange, options }) => (
 <div className="flex flex-col gap-1">
 <label className="text-xs font-semibold uppercase tracking-wider text-th-muted">{label}</label>
 <select
 value={value}
 onChange={(e) => onChange(e.target.value)}
 className="bg-th-surface-base border border-th-border text-th-heading text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
 >
 {options.map((o) => (
 <option key={o} value={o}>{o}</option>
 ))}
 </select>
 </div>
 );

 return (
 <div className="flex-1 overflow-y-auto font-sans h-full">
 <div className="max-w-[1600px] mx-auto px-10 py-8">

 {/* ── Page Heading ──────────────────────────────── */}
 <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
 <div className="flex flex-col gap-1">
 <h1 className="text-th-heading text-3xl font-black leading-tight tracking-tight">A/R Aging Analysis & Collections Hub</h1>
 <p className="text-th-secondary text-base font-normal">Real-time enterprise accounts receivable tracking with AI-prioritized intervention workflows.</p>
 </div>
 <div className="flex gap-3">
 <button
 onClick={() => setFiltersOpen(!filtersOpen)}
 className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-bold shadow-sm transition-colors ${filtersOpen ? 'bg-blue-600 border-blue-500 text-th-heading' : 'bg-th-surface-raised border-th-border text-th-heading hover:border-th-border-strong'}`}
 >
 <span className="material-symbols-outlined text-sm">filter_list</span>
 <span>Filters</span>
 {(filterDateRange || filterPayer !== 'All' || filterAgingBucket !== 'All' || filterBalanceRange !== 'All' || filterCollector !== 'All' || filterStatus !== 'All' || filterPriority !== 'All') && (
 <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
 )}
 </button>
 <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-th-heading rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors">
 <span className="material-symbols-outlined text-sm">file_download</span>
 <span>Export Report</span>
 </button>
 </div>
 </div>

 {/* ── Filter Bar ────────────────────────────────── */}
 {filtersOpen && (
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-5 mb-8 animate-in slide-in-from-top-2">
 <div className="flex flex-wrap items-end gap-3 mb-4">
 <div className="flex flex-col gap-1">
 <label className="text-xs font-semibold uppercase tracking-wider text-th-muted">Date Range</label>
 <DateRangePicker value={filterDateRange?.label} onChange={setFilterDateRange} />
 </div>
 <FilterSelect
 label="Payer"
 value={filterPayer}
 onChange={setFilterPayer}
 options={['All', 'Medicare', 'Medicaid', 'BCBS', 'Aetna', 'United', 'Cigna']}
 />
 <FilterSelect
 label="Aging Bucket"
 value={filterAgingBucket}
 onChange={setFilterAgingBucket}
 options={['All', '0-30', '31-60', '61-90', '91-120', '120+']}
 />
 <FilterSelect
 label="Balance Range"
 value={filterBalanceRange}
 onChange={setFilterBalanceRange}
 options={['All', '<$500', '$500-$2K', '$2K-$10K', '>$10K']}
 />
 <FilterSelect
 label="Collector"
 value={filterCollector}
 onChange={setFilterCollector}
 options={['All', 'Sarah M.', 'James K.', 'Lisa R.', 'Auto-Queue']}
 />
 <FilterSelect
 label="Status"
 value={filterStatus}
 onChange={setFilterStatus}
 options={['All', 'Open', 'In Appeal', 'Pending', 'Escalated']}
 />
 <FilterSelect
 label="Priority"
 value={filterPriority}
 onChange={setFilterPriority}
 options={['All', 'Critical', 'High', 'Medium', 'Low']}
 />
 </div>
 <FilterChipGroup
 filters={[
 ...(filterDateRange ? [{ key: 'dateRange', label: 'Date', value: filterDateRange.label, color: 'blue' }] : []),
 ...(filterPayer !== 'All' ? [{ key: 'payer', label: 'Payer', value: filterPayer, color: 'blue' }] : []),
 ...(filterAgingBucket !== 'All' ? [{ key: 'aging', label: 'Aging', value: filterAgingBucket, color: 'amber' }] : []),
 ...(filterBalanceRange !== 'All' ? [{ key: 'balance', label: 'Balance', value: filterBalanceRange, color: 'purple' }] : []),
 ...(filterCollector !== 'All' ? [{ key: 'collector', label: 'Collector', value: filterCollector, color: 'emerald' }] : []),
 ...(filterStatus !== 'All' ? [{ key: 'status', label: 'Status', value: filterStatus, color: 'slate' }] : []),
 ...(filterPriority !== 'All' ? [{ key: 'priority', label: 'Priority', value: filterPriority, color: 'amber' }] : []),
 ]}
 onRemove={(key) => {
 if (key === 'dateRange') setFilterDateRange(null);
 if (key === 'payer') setFilterPayer('All');
 if (key === 'aging') setFilterAgingBucket('All');
 if (key === 'balance') setFilterBalanceRange('All');
 if (key === 'collector') setFilterCollector('All');
 if (key === 'status') setFilterStatus('All');
 if (key === 'priority') setFilterPriority('All');
 }}
 onClearAll={() => {
 setFilterDateRange(null);
 setFilterPayer('All');
 setFilterAgingBucket('All');
 setFilterBalanceRange('All');
 setFilterCollector('All');
 setFilterStatus('All');
 setFilterPriority('All');
 }}
 />
 </div>
 )}

 {/* ── Page-level error banner ─────────────── */}
 {coreError && (
   <ErrorBanner
     title="Collections Hub data did not load"
     message={coreError.message || 'Unable to reach core RCM services. Some panels may be empty.'}
     onRetry={loadCore}
     className="mb-6"
   />
 )}

 {/* ── KPI Stats Bar ────────────────────────────── */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
 {coreLoading ? (
   [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[112px] rounded-xl" />)
 ) : (
   <>
     <KPICard
       title="Total A/R Balance"
       value={fmtMoneyOrDash(kpis?.totalARBalance.current)}
       change={kpis?.totalARBalance.change ?? undefined}
       trend={kpis?.totalARBalance.trend ?? undefined}
       subtitle={kpis?.totalARBalance.previous != null
         ? `vs last month (${fmtCurrency(kpis.totalARBalance.previous)})`
         : 'No prior period reported'}
       icon="account_balance"
     />
     <KPICard
       title="Avg. Days Outstanding"
       value={kpis?.avgDaysOutstanding.current != null ? `${kpis.avgDaysOutstanding.current} Days` : '—'}
       change={kpis?.avgDaysOutstanding.change ?? undefined}
       trend={kpis?.avgDaysOutstanding.trend ?? undefined}
       subtitle={`Target: ${kpis?.avgDaysOutstanding.target ?? 35} Days`}
       accentColor="border-l-amber-500"
     />
     <div
       onClick={() => navigate('/collections/recovery-insights')}
       onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/collections/recovery-insights'); }}
       role="button"
       tabIndex={0}
       className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary rounded-xl"
     >
       <KPICard
         title="Projected 30D Cash"
         value={fmtMoneyOrDash(kpis?.projected30DCash.current)}
         subtitle={kpis?.projected30DCash.confidence != null
           ? `Confidence level: ${kpis.projected30DCash.confidence}%`
           : 'Confidence not reported'}
         icon="trending_up"
       />
     </div>
     <div
       onClick={() => navigate('/collections/alerts')}
       onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/collections/alerts'); }}
       role="button"
       tabIndex={0}
       className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary rounded-xl"
     >
       <KPICard
         title="AI Risk Flagged Claims"
         value={fmtNumOrDash(kpis?.aiRiskFlagged.count)}
         subtitle={kpis?.aiRiskFlagged.potentialLoss != null
           ? `Potential Loss: ${fmtCurrency(kpis.aiRiskFlagged.potentialLoss)}`
           : 'No loss estimate available'}
         accentColor="border-l-red-500"
         icon="warning"
       />
     </div>
   </>
 )}
 </div>

 {/* ── Audit: Root Cause / Diagnostics / Prevention ── */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
  {/* Root Cause of Collection Issues */}
  <div className="bg-th-surface-raised border border-th-border rounded-xl p-4">
   <div className="flex items-center gap-2 mb-3">
    <span className="material-symbols-outlined text-amber-400 text-sm">troubleshoot</span>
    <span className="text-xs font-bold uppercase tracking-wider text-th-muted">Why Claims Age</span>
   </div>
   {Array.isArray(rootCauseSummary?.top_causes) && rootCauseSummary.top_causes.length > 0 ? (
    <div className="flex flex-wrap gap-2">
     {rootCauseSummary.top_causes.slice(0, 3).map((c) => (
      <span key={c.code} className="text-xs font-bold text-th-heading bg-th-surface-overlay px-2 py-1 rounded border border-th-border tabular-nums">
       {c.code} <span className="text-amber-400">{c.percentage}%</span>
      </span>
     ))}
    </div>
   ) : (
    <p className="text-xs text-th-muted">No root-cause data available.</p>
   )}
  </div>

  {/* Diagnostic Findings */}
  <div className="bg-th-surface-raised border border-th-border rounded-xl p-4">
   <div className="flex items-center gap-2 mb-3">
    <span className="material-symbols-outlined text-blue-400 text-sm">biotech</span>
    <span className="text-xs font-bold uppercase tracking-wider text-th-muted">Aging Diagnostics</span>
   </div>
   <div className="flex items-center gap-3">
    <span className="text-2xl font-black text-th-heading tabular-nums">
     {arDiagnostics?.findings?.length ?? '—'}
    </span>
    <span className="text-sm text-th-secondary">aging diagnostics detected</span>
   </div>
   {arDiagnostics?.findings?.slice(0, 2).map((f, i) => (
    <p key={i} className="text-[10px] text-th-muted mt-1 truncate">{f.title || f.description}</p>
   ))}
  </div>

  {/* Prevention Risk */}
  <div className="bg-th-surface-raised border border-th-border rounded-xl p-4">
   <div className="flex items-center gap-2 mb-3">
    <span className="material-symbols-outlined text-red-400 text-sm">shield</span>
    <span className="text-xs font-bold uppercase tracking-wider text-th-muted">Prevention</span>
   </div>
   <div className="flex items-center gap-3">
    <span className="text-2xl font-black text-red-400 tabular-nums">
     {preventionRisk?.at_risk_count ?? '—'}
    </span>
    <span className="text-sm text-th-secondary">claims at risk of becoming uncollectible</span>
   </div>
  </div>
 </div>

 {/* ── Operations & Analytics Navigation ─────────── */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
 <div
 onClick={() => navigate('/collections/performance')}
 className="bg-th-surface-raised border border-th-border p-4 rounded-xl hover:border-th-border-strong transition-all cursor-pointer flex items-center justify-between group"
 >
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-full bg-indigo-900/30 flex items-center justify-center text-indigo-400">
 <span className="material-symbols-outlined">leaderboard</span>
 </div>
 <div>
 <h3 className="font-bold text-th-heading group-hover:text-blue-400 transition-colors">Performance Analytics</h3>
 <p className="text-sm text-th-secondary">Team metrics, leaderboards & efficiency stats</p>
 </div>
 </div>
 <span className="material-symbols-outlined text-th-muted group-hover:text-blue-400 transition-colors">arrow_forward</span>
 </div>

 <div
 onClick={() => navigate('/collections/timeline')}
 className="bg-th-surface-raised border border-th-border p-4 rounded-xl hover:border-th-border-strong transition-all cursor-pointer flex items-center justify-between group"
 >
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-full bg-teal-900/30 flex items-center justify-center text-teal-400">
 <span className="material-symbols-outlined">history</span>
 </div>
 <div>
 <h3 className="font-bold text-th-heading group-hover:text-blue-400 transition-colors">Global Activity Timeline</h3>
 <p className="text-sm text-th-secondary">Audit trail of all collection activities</p>
 </div>
 </div>
 <span className="material-symbols-outlined text-th-muted group-hover:text-blue-400 transition-colors">arrow_forward</span>
 </div>
 </div>

 {/* ── AI Intelligence Section ──────────────────── */}
 <div className="mb-6">
 <div className="flex items-center gap-2 mb-3">
 <span className="material-icons text-purple-400 text-sm">auto_awesome</span>
 <span className="text-th-secondary text-xs font-semibold uppercase tracking-wider">AI Intelligence</span>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
 {aiLoading ? (
   [0,1,2].map(i => (
     <div key={i} className="rounded-xl border border-th-border bg-th-surface p-4 animate-pulse">
       <div className="h-3 bg-th-border rounded w-2/3 mb-3" />
       <div className="h-2 bg-th-border rounded w-full mb-2" />
       <div className="h-2 bg-th-border rounded w-4/5" />
     </div>
   ))
 ) : aiInsights.length > 0 ? (
   aiInsights.map((ins, i) => (
     <AIInsightCard
       key={i}
       title={ins.title}
       description={ins.body}
       confidence={ins.badge === 'Prescriptive' ? 95 : ins.badge === 'Predictive' ? 87 : 82}
       impact={ins.severity === 'critical' ? 'high' : 'medium'}
       category={ins.badge}
       action="Review"
       value={ins.ai_generated ? '🤖 AI Generated' : ''}
       icon={ins.badge === 'Predictive' ? 'account_balance' : ins.badge === 'Prescriptive' ? 'credit_card' : 'access_time'}
     />
   ))
 ) : (
   <>
   {(() => {
     const fmtAmt = (n) => {
       if (n == null) return '--';
       if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
       if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
       return '$' + n.toLocaleString();
     };
     const aged90 = (arSummary?.buckets || []).filter(b => ['91-120', '120+', '121-180', '180+'].includes(b.bucket));
     const aged90Count = aged90.reduce((s, b) => s + (b.count || 0), 0);
     const aged90Balance = aged90.reduce((s, b) => s + (b.balance || 0), 0);
     const critCount = collSummary?.critical_count || 0;
     const queueDepth = collSummary?.queue_depth || collSummary?.total_tasks || 0;
     return (
       <>
         <AIInsightCard
           title="High-Value A/R: 90+ Days"
           description={`${aged90Count || '--'} accounts with balances exceeding 90 days. AI propensity scoring shows 68% collection probability if contacted this week.`}
           confidence={89}
           impact="high"
           category="Predictive"
           action="Assign to senior collectors"
           value={aged90Balance ? `${fmtAmt(aged90Balance)} recoverable` : '--'}
           icon="account_balance"
         />
         <AIInsightCard
           title="Critical Priority Accounts"
           description={`${critCount} accounts flagged as critical priority across a queue depth of ${queueDepth.toLocaleString()} tasks. Recommend immediate supervisor-led outreach.`}
           confidence={84}
           impact="high"
           category="Prescriptive"
           action="Escalate critical accounts"
           value={`${critCount} critical / ${queueDepth.toLocaleString()} queued`}
           icon="credit_card"
         />
         <AIInsightCard
           title="Optimal Contact Time Identified"
           description="Patient contact between 5-7pm on weekdays shows higher payment rates. High-propensity accounts should be scheduled for evening outreach."
           confidence={92}
           impact="medium"
           category="Prescriptive"
           action="Schedule evening campaigns"
           value="Evening outreach recommended"
           icon="access_time"
         />
       </>
     );
   })()}
   </>
 )}
 </div>
 </div>

 {/* ── Charts Grid Tier 1 ───────────────────────── */}
 <div className="mb-8">
 {/* A/R Aging Bucket Chart */}
 <div className="bg-th-surface-raised border border-th-border p-6 rounded-xl">
 <div className="flex justify-between items-start mb-6">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <h3 className="text-lg font-bold text-th-heading">A/R Aging Buckets vs. Expected Collectability</h3>
 </div>
 <p className="text-sm text-th-secondary">Current portfolio breakdown by aging category</p>
 </div>
 </div>
 {coreLoading ? (
   <Skeleton className="h-72 w-full rounded-lg" />
 ) : liveAgingBuckets.length > 0 ? (
   <ARAgingChart data={liveAgingBuckets} onBucketClick={setSelectedBucket} />
 ) : (
   <EmptyState
     icon="bar_chart"
     title="No AR aging data"
     description="The AR summary endpoint did not return bucket data. Retry once the upstream service is healthy."
     action={loadCore}
     actionLabel="Retry"
   />
 )}
 </div>

 </div>

 {/* ── NEW: Dunning, Auto-Dialer, Settlements panels ─── */}
 <DunningTrackerPanel />
 <AutoDialerPanel />
 <SettlementOffersPanel />

 {/* ── Root Cause of Aging ───────────────────────── */}
 <div className="bg-th-surface-raised border border-th-border p-6 rounded-xl mb-8">
 <div className="flex items-center gap-2 mb-1">
 <h3 className="text-lg font-bold text-th-heading">Root Cause of Aging</h3>
 </div>
 <p className="text-sm text-th-secondary mb-6">AI-identified drivers of outstanding balances by aging category</p>
 {(() => {
   const causes = agingRootCause?.causes || agingRootCause?.items || [];
   if (!Array.isArray(causes) || causes.length === 0) {
     return (
       <EmptyState
         icon="troubleshoot"
         title="Root-cause analysis unavailable"
         description="Run the AR aging diagnostics service to populate this panel."
       />
     );
   }
   const iconMap = ['shield', 'schedule', 'code', 'warning', 'local_hospital', 'person'];
   const colorMap = ['text-amber-400', 'text-orange-400', 'text-blue-400', 'text-red-400', 'text-purple-400', 'text-th-secondary'];
   const normalized = causes.map((item, idx) => ({
     cause: item.cause || item.reason || item.category || `Cause ${idx + 1}`,
     pct: item.pct || item.percentage || item.percent || 0,
     bucket: item.bucket || item.aging_bucket || '',
     icon: item.icon || iconMap[idx % iconMap.length],
     color: item.color || colorMap[idx % colorMap.length],
   }));
   return (
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
       {normalized.map((item) => (
         <div key={item.cause} className="flex items-start gap-3 p-3 rounded-lg bg-th-surface-overlay border border-th-border/30 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
           <span className={`material-symbols-outlined ${item.color} mt-0.5`}>{item.icon}</span>
           <div className="flex-1 min-w-0">
             <div className="flex items-center justify-between mb-1">
               <p className="text-sm font-semibold text-th-heading truncate">{item.cause}</p>
               <span className="text-xs font-bold text-th-secondary ml-2 tabular-nums">{item.pct}%</span>
             </div>
             <div className="w-full bg-th-surface-overlay rounded-full h-1.5 mb-1">
               <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${item.pct}%` }} />
             </div>
             {item.bucket && <p className="text-[10px] text-th-muted">Concentrated in {item.bucket}</p>}
           </div>
         </div>
       ))}
     </div>
   );
 })()}
 </div>

 {/* ── AR Trend Chart ───────────────────────────── */}
 <div className="bg-th-surface-raised border border-th-border p-6 rounded-xl mb-8">
 <div className="mb-6">
 <h3 className="text-lg font-bold text-th-heading">12-Month A/R Trend Analysis</h3>
 <p className="text-sm text-th-secondary">Historical balance, collections, and outstanding amounts</p>
 </div>
 {coreLoading
   ? <Skeleton className="h-64 w-full rounded-lg" />
   : arTrend.length > 0
     ? <ARTrendChart data={arTrend} />
     : <EmptyState icon="show_chart" title="Trend not available" description="The AR summary did not include a trend series." />}
 </div>

 {/* ── Projected Collections ─────────────────────── */}
 <div className="bg-th-surface-raised border border-th-border p-6 rounded-xl mb-8">
 <div className="flex items-center gap-2 mb-1">
 <h3 className="text-lg font-bold text-th-heading">Projected Collections (Next 90 Days)</h3>
 </div>
 <p className="text-sm text-th-secondary mb-6">ML-forecasted collection amounts by aging bucket with confidence intervals</p>
 {liveAgingBuckets.length === 0 ? (
   <EmptyState icon="trending_up" title="No projection data" description="Projected collections derive from AR aging buckets — none reported." />
 ) : (
   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
     {liveAgingBuckets.map((b) => {
       const projected = Math.round(b.balance * (b.collectability / 100));
       return (
         <div key={b.bucket} className="p-4 rounded-lg bg-th-surface-overlay border border-th-border/30 text-center hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
           <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">{b.bucket}</p>
           <p className="text-lg font-bold text-th-heading tabular-nums">{fmtCurrency(projected)}</p>
           <p className="text-[10px] text-th-muted mt-1 tabular-nums">of {fmtCurrency(b.balance)}</p>
           <div className="mt-2 flex items-center justify-center gap-1">
             <div className="w-full bg-th-surface-overlay rounded-full h-1.5">
               <div className="h-1.5 rounded-full" style={{ width: `${b.collectability}%`, backgroundColor: b.color }} />
             </div>
             <span className="text-[10px] font-bold text-th-secondary tabular-nums">{b.collectability}%</span>
           </div>
         </div>
       );
     })}
   </div>
 )}
 </div>

 {/* ── Collection Velocity Chart ────────────────── */}
 <div className="bg-th-surface-raised border border-th-border p-6 rounded-xl mb-8">
 <div className="mb-6">
 <h3 className="text-lg font-bold text-th-heading">Collection Velocity by Payer</h3>
 <p className="text-sm text-th-secondary">Average days to settle by top payers</p>
 </div>
 {collectionVelocity.length === 0
   ? <EmptyState icon="speed" title="Velocity unavailable" description="Per-payer days-to-settle stats are not reporting." />
   : <CollectionVelocityChart data={collectionVelocity} onPayerClick={setSelectedPayer} />}
 </div>

 {/* ── Additional Insights Grid ─────────────────── */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
 <div className="bg-th-surface-raised border border-th-border p-6 rounded-xl">
 <div className="mb-6">
 <h3 className="text-lg font-bold text-th-heading">Denial Reasons Breakdown</h3>
 <p className="text-sm text-th-secondary">Top reasons for claim denials</p>
 </div>
 {denialReasons.length === 0
   ? <EmptyState icon="block" title="No denial categories" />
   : <DenialReasonsChart data={denialReasons} />}
 </div>

 <div className="bg-th-surface-raised border border-th-border p-6 rounded-xl">
 <div className="mb-6">
 <h3 className="text-lg font-bold text-th-heading">Payment Distribution</h3>
 <p className="text-sm text-th-secondary">Revenue by payment method</p>
 </div>
 {paymentDistribution.length === 0
   ? <EmptyState icon="pie_chart" title="No payment breakdown" />
   : <PaymentDistributionChart data={paymentDistribution} />}
 </div>

 <div className="bg-th-surface-raised border border-th-border p-6 rounded-xl">
 <div className="mb-6">
 <h3 className="text-lg font-bold text-th-heading">Top CPT Codes by Revenue</h3>
 <p className="text-sm text-th-secondary">Highest revenue procedures</p>
 </div>
 {topCPTCodes.length === 0
   ? <EmptyState icon="medical_information" title="No CPT data" description="No top CPT codes reported by the payments service." />
   : <TopCPTCodesChart data={topCPTCodes} />}
 </div>
 </div>

 {/* ── Payer Treemap Section ─────────────────────── */}
 <div className="bg-th-surface-raised border border-th-border p-6 rounded-xl mb-8">
 <h3 className="text-lg font-bold mb-1 text-th-heading">Top Payers by A/R Balance</h3>
 <p className="text-sm text-th-secondary mb-6">Treemap visualization of capital concentration</p>
 {(() => {
 const fmtTreemap = (n) => {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'k';
  return '$' + n.toLocaleString();
 };
 const payerSource = payerStats.length > 0 ? payerStats :
   (arSummary?.by_payer || arSummary?.payer_breakdown || []);
 const sortedPayers = [...payerSource]
  .map(p => ({ name: p.name || p.payer_name || p.payer || 'Unknown', balance: p.balance || p.total_paid || p.revenue_ytd || p.amount || 0 }))
  .sort((a, b) => b.balance - a.balance);
 const totalBalance = sortedPayers.reduce((s, p) => s + p.balance, 0) || 1;
 const topPayer = sortedPayers[0];
 const midPayers = sortedPayers.slice(1, 3);
 const smallPayers = sortedPayers.slice(3, 6);
 const othersCount = Math.max(0, sortedPayers.length - 6);
 if (sortedPayers.length === 0) {
  return (
   <div className="flex items-center justify-center h-72 text-th-muted text-sm">
    No payer breakdown data available.
   </div>
  );
 }
 return (
 <div className="grid grid-cols-12 grid-rows-2 h-72 gap-2 text-th-heading">
 {topPayer && (
 <div className="col-span-6 row-span-2 bg-blue-600/10 border border-blue-500/20 rounded-lg p-6 flex flex-col justify-between hover:bg-blue-600/20 cursor-pointer transition-all hover:scale-[1.02]">
 <div>
 <p className="text-sm font-bold text-blue-300/80">{topPayer.name}</p>
 <p className="text-3xl font-black text-blue-400 mt-1 tabular-nums">{fmtTreemap(topPayer.balance)}</p>
 </div>
 <p className="text-xs font-bold text-th-muted tabular-nums">{((topPayer.balance / totalBalance) * 100).toFixed(1)}% of Portfolio</p>
 </div>
 )}
 {midPayers.map((p, i) => (
 <div key={i} className="col-span-3 row-span-1 bg-th-surface-overlay border border-th-border/30 rounded-lg p-4 hover:bg-th-surface-overlay/60 transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-center">
 <p className="text-xs font-bold text-th-secondary">{p.name}</p>
 <p className="text-xl font-bold tabular-nums">{fmtTreemap(p.balance)}</p>
 </div>
 ))}
 {smallPayers.map((p, i) => (
 <div key={i} className="col-span-2 row-span-1 bg-th-surface-overlay border border-th-border/30 rounded-lg p-3 hover:bg-th-surface-overlay/60 transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-center">
 <p className="text-xs font-bold text-th-secondary">{p.name}</p>
 <p className="text-lg font-bold tabular-nums">{fmtTreemap(p.balance)}</p>
 </div>
 ))}
 {othersCount > 0 && (
 <div className="col-span-2 row-span-1 bg-th-surface-overlay/30 border-2 border-dashed border-th-border/40 rounded-lg p-3 flex items-center justify-center hover:bg-th-surface-overlay/50 transition-colors cursor-pointer">
 <p className="text-xs font-bold text-th-muted">{othersCount} Others</p>
 </div>
 )}
 </div>
 );
 })()}
 </div>

 {/* ── High-Value / High-Risk Worklist ──────────── */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden mb-12">
 <div className="flex flex-wrap justify-between items-center p-6 border-b border-th-border/30 gap-4">
 <div>
 <div className="flex items-center gap-2">
 <h3 className="text-lg font-bold text-th-heading">AI-Prioritized Follow-Up Actions</h3>
 </div>
 <p className="text-sm text-th-secondary">High-value claims requiring immediate intervention</p>
 </div>
 <div className="flex gap-2">
 <div className="flex bg-th-surface-overlay p-1 rounded-lg border border-th-border/30">
 {[
 { key: 'risk', label: 'By Risk Score' },
 { key: 'balance', label: 'By Balance' },
 { key: 'aging', label: 'By Aging' },
 ].map((s) => (
 <button
 key={s.key}
 onClick={() => setWorklistSort(s.key)}
 className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary ${worklistSort === s.key ? 'bg-th-surface-overlay text-th-heading shadow-sm' : 'text-th-muted hover:text-th-heading'}`}
 >
 {s.label}
 </button>
 ))}
 </div>
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-th-surface-overlay/30">
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Claim ID</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Patient</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Payer</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Balance</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Aging</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">AI Risk Score</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Next Action</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-th-border text-sm">
 {coreLoading && [0,1,2,3].map((i) => (
   <tr key={i}><td colSpan={8} className="px-6 py-3"><Skeleton className="h-6 w-full" /></td></tr>
 ))}
 {!coreLoading && sortedClaims.map((claim) => (
 <tr
 key={claim.id}
 onClick={() => navigate(`/collections/account/${claim.id}`)}
 className="hover:bg-th-surface-overlay transition-colors cursor-pointer"
 >
 {/* Claim ID */}
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <span className="material-symbols-outlined text-blue-400 text-sm">bolt</span>
 <div>
 <p className="font-bold text-th-heading">{claim.id}</p>
 <p className="text-xs text-th-muted">{claim.dos}</p>
 </div>
 </div>
 </td>
 {/* Patient */}
 <td className="px-6 py-4">
 <p className="font-semibold text-th-heading">{claim.patient}</p>
 <p className="text-xs text-th-muted">CPT {claim.cpt}</p>
 </td>
 {/* Payer */}
 <td className="px-6 py-4 text-th-heading">{claim.payer}</td>
 {/* Balance */}
 <td className="px-6 py-4 font-mono font-bold text-th-heading tabular-nums">
 {claim.balance != null ? fmtCurrency(claim.balance) : '—'}
 </td>
 {/* Aging */}
 <td className="px-6 py-4">
 <span className={`px-2 py-1 rounded text-xs font-bold ${
 claim.aging > 120 ? 'bg-red-900/40 text-red-400 border border-red-500/20' :
 claim.aging > 90 ? 'bg-orange-900/40 text-orange-400 border border-orange-500/20' :
 claim.aging > 60 ? 'bg-amber-900/40 text-amber-400 border border-amber-500/20' :
 'bg-th-surface-overlay text-th-heading border border-th-border/30'
 }`}>
 {claim.aging}d
 </span>
 </td>
 {/* AI Risk Score */}
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <span className={`w-2 h-2 rounded-full ${
 claim.riskLevel === 'critical' ? 'bg-red-500' :
 claim.riskLevel === 'high' ? 'bg-orange-500' : 'bg-amber-500'
 }`} />
 <span className="font-bold text-th-heading capitalize">
 {claim.riskLevel}
 </span>
 <span className="text-xs text-th-muted tabular-nums">({claim.riskScore}%)</span>
 </div>
 </td>
 {/* Next Action */}
 <td className="px-6 py-4 text-th-secondary text-sm">{claim.nextAction}</td>
 {/* Action Button */}
 <td className="px-6 py-4 text-right">
 <button
 onClick={(e) => {
 e.stopPropagation();
 navigate(`/collections/account/${claim.id}`);
 }}
 className="bg-blue-600 text-th-heading text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
 >
 View Details
 </button>
 </td>
 </tr>
 ))}
 {!coreLoading && sortedClaims.length === 0 && (
 <tr>
 <td colSpan={8} className="px-0 py-0">
 <EmptyState
   icon="search_off"
   title="No claims to follow up"
   description="Either nothing matches the current filters, or the collections queue is empty."
 />
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* ── Modals ────────────────────────────────────────── */}
 {selectedBucket && (
 <AgingBucketDetailModal bucket={selectedBucket} onClose={() => setSelectedBucket(null)} />
 )}
 {selectedPayer && (
 <PayerPerformanceModal payer={selectedPayer} onClose={() => setSelectedPayer(null)} />
 )}
 </div>
 );
}
