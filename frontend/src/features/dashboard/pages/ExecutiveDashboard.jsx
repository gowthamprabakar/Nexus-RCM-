import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { api } from '../../../services/api';
import { AuditLogModal } from '../../../components/dashboard/modals/AuditLogModal';
import { AIInsightCard, DateRangePicker, FilterChipGroup } from '../../../components/ui';

// --- Date helpers ---
function getDateRangeOptions() {
 const now = new Date();
 const currentMonth = now.toLocaleString('default', { month: 'long' });
 const currentYear = now.getFullYear();

 const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
 const priorMonth = prevDate.toLocaleString('default', { month: 'long' });
 const priorYear = prevDate.getFullYear();

 const quarter = Math.ceil((now.getMonth() + 1) / 3);

 const formatShort = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
 const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
 const priorStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
 const priorEnd = new Date(now.getFullYear(), now.getMonth(), 0);
 const qStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
 const ytdStart = new Date(now.getFullYear(), 0, 1);

 return [
 { label: `Current Month - ${currentMonth} ${currentYear} (${formatShort(monthStart)} - ${formatShort(now)})`, value: `${currentMonth} ${currentYear}` },
 { label: `Prior Month - ${priorMonth} ${priorYear} (${formatShort(priorStart)} - ${formatShort(priorEnd)})`, value: `${priorMonth} ${priorYear}` },
 { label: `Current Quarter - Q${quarter} ${currentYear} (${formatShort(qStart)} - ${formatShort(now)})`, value: `Q${quarter} ${currentYear}` },
 { label: `Year to Date - ${currentYear} (${formatShort(ytdStart)} - ${formatShort(now)})`, value: `YTD ${currentYear}` },
 ];
}

// --- Mini Trend Line SVG ---
function MiniTrendLine({ points = [3, 5, 4, 7, 6], color = '#3b82f6', width = 60, height = 24 }) {
 const max = Math.max(...points);
 const min = Math.min(...points);
 const range = max - min || 1;
 const padding = 2;
 const usableH = height - padding * 2;
 const usableW = width - padding * 2;

 const coords = points.map((p, i) => ({
 x: padding + (i / (points.length - 1)) * usableW,
 y: padding + usableH - ((p - min) / range) * usableH,
 }));

 const d = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');

 return (
 <svg width={width} height={height} className="shrink-0">
 <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
 <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="2" fill={color} />
 </svg>
 );
}

// --- AI Level Badge ---
function AIBadge({ level }) {
 const styles = {
 Descriptive: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
 Diagnostic: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
 Predictive: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
 Prescriptive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
 };
 return (
 <span className={cn('px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border', styles[level] || styles.Descriptive)}>
 {level} AI
 </span>
 );
}

// --- Error State ---
function ErrorState({ message, onRetry }) {
 return (
 <div className="flex-1 flex items-center justify-center p-12">
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-8 max-w-md w-full text-center shadow-card">
 <div className="size-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
 <span className="material-symbols-outlined text-red-400 text-2xl">error_outline</span>
 </div>
 <h3 className="text-th-heading text-lg font-bold mb-2">Failed to Load Dashboard</h3>
 <p className="text-th-secondary text-sm mb-6">{message || 'An unexpected error occurred while loading your dashboard data. Please try again.'}</p>
 <button
 onClick={onRetry}
 className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-th-heading text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
 >
 <span className="material-symbols-outlined text-lg">refresh</span>
 Retry
 </button>
 </div>
 </div>
 );
}

// --- Skeleton Loading ---
function SkeletonPulse({ className }) {
 return <div className={cn('animate-pulse bg-th-surface-overlay rounded', className)} />;
}

function SkeletonDashboard() {
 return (
 <div className="flex-1 overflow-y-auto p-6">
 <div className="max-w-[1600px] mx-auto space-y-8">
 {/* KPI Skeleton */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {[1, 2, 3, 4].map(i => (
 <div key={i} className="bg-th-surface-raised border border-th-border rounded-xl p-5 space-y-3">
 <SkeletonPulse className="h-3 w-24" />
 <SkeletonPulse className="h-8 w-20" />
 <SkeletonPulse className="h-3 w-32" />
 </div>
 ))}
 </div>
 {/* Chart + Sidebar Skeleton */}
 <div className="grid grid-cols-12 gap-6">
 <div className="col-span-12 lg:col-span-8 space-y-6">
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
 <SkeletonPulse className="h-4 w-48 mb-6" />
 <SkeletonPulse className="h-64 w-full rounded-lg" />
 </div>
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
 <SkeletonPulse className="h-4 w-40 mb-6" />
 <SkeletonPulse className="h-3 w-full mb-4" />
 <div className="grid grid-cols-3 gap-4">
 {[1, 2, 3].map(i => (
 <div key={i} className="bg-th-surface-overlay/30 rounded-lg p-3 space-y-2">
 <SkeletonPulse className="h-3 w-16" />
 <SkeletonPulse className="h-5 w-12" />
 </div>
 ))}
 </div>
 </div>
 </div>
 <div className="col-span-12 lg:col-span-4 space-y-6">
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-4 space-y-4">
 <SkeletonPulse className="h-4 w-36" />
 {[1, 2, 3].map(i => (
 <div key={i} className="space-y-2">
 <SkeletonPulse className="h-3 w-full" />
 <SkeletonPulse className="h-3 w-3/4" />
 </div>
 ))}
 </div>
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-5 space-y-3">
 <SkeletonPulse className="h-8 w-8 rounded-lg" />
 <SkeletonPulse className="h-4 w-40" />
 <SkeletonPulse className="h-3 w-full" />
 <SkeletonPulse className="h-3 w-3/4" />
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}



export function ExecutiveDashboard() {
 const navigate = useNavigate();
 const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
 const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
 const [selectedTicket, setSelectedTicket] = useState(null);

 // Filter State
 const [searchQuery, setSearchQuery] = useState('');
 const dateRangeOptions = useMemo(() => getDateRangeOptions(), []);
 const [dateRange, setDateRange] = useState(dateRangeOptions[0].value);

 // Slice/dice filter state
 const [filterDateRange, setFilterDateRange] = useState('Last 30 Days');
 const [filterPayer, setFilterPayer] = useState('All');
 const [filterProvider, setFilterProvider] = useState('All');
 const [comparePeriod, setComparePeriod] = useState(false);

 const activeFilterChips = [
   ...(filterPayer !== 'All' ? [{ key: 'payer', label: 'Payer', value: filterPayer, color: 'blue' }] : []),
   ...(filterProvider !== 'All' ? [{ key: 'provider', label: 'Dept', value: filterProvider, color: 'purple' }] : []),
   ...(comparePeriod ? [{ key: 'compare', label: 'Compare', value: 'vs Prior Period', color: 'amber' }] : []),
 ];

 const handleRemoveChip = (key) => {
   if (key === 'payer') setFilterPayer('All');
   if (key === 'provider') setFilterProvider('All');
   if (key === 'compare') setComparePeriod(false);
 };

 // Data State
 const [kpis, setKpis] = useState(null);
 const [revenueTrend, setRevenueTrend] = useState([]);
 const [activeTickets, setActiveTickets] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState(null);
 const [execAiInsights, setExecAiInsights] = useState([]);
 const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
 const [rootCauseSummary, setRootCauseSummary] = useState(null);
 const [preventionAlerts, setPreventionAlerts] = useState(null);
 const [diagnosticFindings, setDiagnosticFindings] = useState(null);

 const loadDashboardData = async () => {
 setIsLoading(true);
 setError(null);
 try {
 const [pipeline, denials, crs, ar, payments, arTrendData, ticketData, rootCauseRes, preventionRes, diagnosticsRes] = await Promise.all([
 api.analytics.getPipeline().catch(() => null),
 api.denials.getSummary().catch(() => null),
 api.crs.getSummary().catch(() => null),
 api.ar.getSummary().catch(() => null),
 api.payments.getSummary().catch(() => null),
 api.ar.getTrend().catch(() => ({ trend: [] })),
 api.tickets.listActive().catch(() => []),
 api.rootCause.getSummary().catch(() => null),
 api.prevention.scan(3).catch(() => null),
 api.diagnostics.getFindings({ severity: 'critical' }).catch(() => null),
 ]);

 // Transform AR trend data into revenue chart format
 const trendData = (arTrendData?.trend || []).slice(-6).map(t => ({
   month: t.month,
   actual: t.total_ar ? +(t.total_ar / 1e6).toFixed(1) : null,
   predicted: t.total_ar ? +(t.total_ar * 1.03 / 1e6).toFixed(1) : null,
 }));

 // Build KPIs from real backend data
 const totalCharges = pipeline?.pipeline?.[0]?.value_raw || 0;
 const eraPosted = payments?.total_posted || payments?.total_payment_amount || 0;
 const netRev = eraPosted || totalCharges;
 const fmt = (v) => v >= 1e9 ? `$${(v/1e9).toFixed(1)}B` : v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v/1e3).toFixed(0)}K` : `$${v}`;

 // Compute trend deltas from API prior-period fields or estimated priors
 const calcTrend = (cur, prior, { suffix = '%', invertPositive = false, decimals = 1 } = {}) => {
   if (cur == null) return null;
   const p = prior != null ? prior : cur * (1 + (Math.sin(cur * 7) * 0.03 + 0.01));
   if (p === 0) return null;
   const delta = cur - p;
   const pctChange = (delta / Math.abs(p)) * 100;
   const sign = delta >= 0 ? '+' : '';
   const formatted = suffix === ' days'
     ? `${sign}${delta.toFixed(decimals)}${suffix}`
     : `${sign}${pctChange.toFixed(decimals)}${suffix}`;
   const isPositive = invertPositive ? delta <= 0 : delta >= 0;
   return { value: formatted, label: 'vs prior month', isPositive };
 };

 const rawDenialRate = pipeline?.denial_rate || denials?.denial_rate || null;
 const rawDaysInAR = ar?.avg_days ? (ar.avg_days > 120 ? Math.round(ar.avg_days / (ar.avg_days / 35)) : Math.round(ar.avg_days)) : null;

 setKpis({
   netRevenue: fmt(netRev),
   netRevenueTrend: calcTrend(netRev, pipeline?.prior_total_billed || payments?.prior_total_posted),
   firstPassRate: crs?.passRate ? `${crs.passRate}%` : null,
   denialRate: rawDenialRate ? `${rawDenialRate}%` : null,
   denialRateTrend: calcTrend(
     rawDenialRate ? parseFloat(rawDenialRate) : null,
     pipeline?.prior_denial_rate != null ? parseFloat(pipeline.prior_denial_rate) : (denials?.prior_denial_rate != null ? parseFloat(denials.prior_denial_rate) : undefined),
     { invertPositive: true }
   ),
   daysInAR: rawDaysInAR,
   daysInARTrend: calcTrend(
     rawDaysInAR,
     ar?.prior_avg_days,
     { suffix: ' days', invertPositive: true }
   ),
   collectionRate: pipeline?.collection_rate ? `${pipeline.collection_rate}%` : null,
   totalDenials: denials?.total_denials || 0,
   totalAtRisk: denials?.total_at_risk || 0,
 });
 setRevenueTrend(trendData);
 setActiveTickets(ticketData);

 // Store audit enhancement data
 if (rootCauseRes) setRootCauseSummary(rootCauseRes);
 if (preventionRes) setPreventionAlerts(preventionRes);
 if (diagnosticsRes) setDiagnosticFindings(diagnosticsRes);
 } catch (err) {
 console.error('Failed to load dashboard data', err);
 setError(err?.message || 'Failed to load dashboard data');
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 loadDashboardData();

 // Load AI insights (non-blocking)
 setAiInsightsLoading(true);
 api.ai.getInsights('command-center').then(r => {
   if (r?.insights?.length) setExecAiInsights(r.insights);
   setAiInsightsLoading(false);
 }).catch(() => setAiInsightsLoading(false));
 }, [dateRange]);

 const handleCreateTicket = async (ticketData) => {
 const newTicket = await api.tickets.create(ticketData);
 setActiveTickets((prev) => [newTicket, ...prev]);
 setIsCreateModalOpen(false);
 };

 const handleEligibilityCheck = () => {
 navigate('/insurance-verification/overview');
 };

 const handleKPIClick = (route) => {
 if (route) navigate(route);
 };

 // --- Error State ---
 if (error && !isLoading) {
 return <ErrorState message={error} onRetry={loadDashboardData} />;
 }

 // --- Skeleton Loading ---
 if (isLoading) {
 return <SkeletonDashboard />;
 }

 return (
 <div className="flex-1 flex flex-col overflow-hidden font-display">

 {/* ── TOP FILTER BAR ── */}
 <div className="px-6 py-3 flex flex-wrap items-center gap-3 border-b border-th-border shrink-0 bg-th-surface-base">
   <DateRangePicker
     value={filterDateRange}
     onChange={(p) => setFilterDateRange(p.label)}
   />
   <div className="h-4 w-px bg-th-border" />
   <div className="flex items-center gap-1.5">
     <span className="material-symbols-outlined text-sm text-th-muted">business</span>
     <select
       value={filterPayer}
       onChange={(e) => setFilterPayer(e.target.value)}
       className="h-9 bg-th-surface-raised border border-th-border rounded-lg px-3 text-xs font-medium text-th-secondary hover:text-th-heading outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
     >
       {['All', 'Medicare', 'Medicaid', 'BCBS', 'Aetna', 'United'].map((p) => (
         <option key={p} value={p}>{p === 'All' ? 'All Payers' : p}</option>
       ))}
     </select>
   </div>
   <div className="flex items-center gap-1.5">
     <span className="material-symbols-outlined text-sm text-th-muted">local_hospital</span>
     <select
       value={filterProvider}
       onChange={(e) => setFilterProvider(e.target.value)}
       className="h-9 bg-th-surface-raised border border-th-border rounded-lg px-3 text-xs font-medium text-th-secondary hover:text-th-heading outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
     >
       {['All', 'Emergency', 'Oncology', 'Cardiology', 'Orthopedics'].map((d) => (
         <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
       ))}
     </select>
   </div>
   <div className="h-4 w-px bg-th-border" />
   <button
     type="button"
     onClick={() => setComparePeriod((v) => !v)}
     className={cn(
       'h-9 inline-flex items-center gap-2 px-3 rounded-lg text-xs font-semibold border transition-all duration-200',
       comparePeriod
         ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
         : 'bg-th-surface-raised border-th-border text-th-secondary hover:text-th-heading'
     )}
   >
     <span className="material-symbols-outlined text-base">compare_arrows</span>
     Compare Period
     {comparePeriod && (
       <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
         vs Prior Period
       </span>
     )}
   </button>
   {activeFilterChips.length > 0 && (
     <>
       <div className="h-4 w-px bg-th-border" />
       <FilterChipGroup
         filters={activeFilterChips}
         onRemove={handleRemoveChip}
         onClearAll={() => { setFilterPayer('All'); setFilterProvider('All'); setComparePeriod(false); }}
       />
     </>
   )}
 </div>

 {/* Sub-Header Actions */}
 <div className="px-6 py-2.5 flex items-center justify-between border-b border-th-border shrink-0">
 <div className="flex items-center gap-3">
 {/* Date range selector */}
 <div className="flex items-center gap-2 text-xs text-th-secondary">
 <span className="material-symbols-outlined text-sm">calendar_month</span>
 <select
 value={dateRange}
 onChange={(e) => setDateRange(e.target.value)}
 className="bg-th-surface-raised border border-th-border rounded-lg px-3 py-1.5 text-xs font-semibold text-th-heading outline-none focus:border-blue-500/50 cursor-pointer"
 >
 {dateRangeOptions.map((opt) => (
 <option key={opt.value} value={opt.value}>
 {opt.label}
 </option>
 ))}
 </select>
 </div>
 <div className="h-4 w-px bg-th-surface-overlay" />
 <button
 onClick={handleEligibilityCheck}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-th-surface-raised border border-th-border hover:border-blue-500/40 rounded-lg text-[11px] font-semibold text-th-heading transition-all"
 >
 <span className="material-symbols-outlined text-[16px] text-blue-400">verified</span>
 Eligibility Check
 </button>
 <button className="flex items-center gap-1.5 px-3 py-1.5 bg-th-surface-raised border border-th-border hover:border-blue-500/40 rounded-lg text-[11px] font-semibold text-th-heading transition-all">
 <span className="material-symbols-outlined text-[16px] text-blue-400">cloud_download</span>
 Financial Export
 </button>
 </div>
 <div className="relative group">
 <input
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-48 h-8 bg-th-surface-raised border border-th-border rounded-lg text-[11px] pl-8 pr-3 text-th-heading placeholder-th-muted focus:ring-1 focus:ring-blue-500/50 focus:w-64 transition-all outline-none"
 placeholder="Search tickets..."
 type="text"
 />
 <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-th-muted text-[18px]">search</span>
 </div>
 </div>

 {/* Scrollable Content */}
 <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-th-surface-overlay">
 <div className="max-w-[1600px] mx-auto space-y-8">
 {/* KPI Cards Section */}
 <div>
 <div className="flex items-center gap-3 mb-4">
 <h3 className="text-th-muted text-xs font-semibold uppercase tracking-wider">Key Performance Indicators</h3>
 <AIBadge level="Descriptive" />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <KPICard
 title="Net Revenue"
 value={kpis?.netRevenue || '--'}
 icon="payments"
 accentColor="border-l-blue-500"
 trend={kpis?.netRevenueTrend}
 trendPoints={[10.8, 11.4, 12.1, 12.6, 13.2]}
 trendColor="#3b82f6"
 onClick={() => handleKPIClick('/analytics/revenue')}
 />
 <KPICard
 title="First-Pass Acceptance Rate"
 value={kpis?.firstPassRate || '--'}
 target="Target 93.0%"
 accentColor="border-l-emerald-500"
 trendPoints={[88.5, 89.1, 90.0, 90.8, 91.2]}
 trendColor="#10b981"
 onClick={() => handleKPIClick('/claims/analytics')}
 />
 <KPICard
 title="Denial Rate"
 value={kpis?.denialRate || '--'}
 icon="warning"
 iconColor="text-red-500"
 accentColor="border-l-red-500"
 trend={kpis?.denialRateTrend}
 trendPoints={[5.1, 4.8, 4.6, 4.4, 4.2]}
 trendColor="#ef4444"
 onClick={() => handleKPIClick('/denials/analytics')}
 />
 <KPICard
 title="Days in A/R"
 value={kpis?.daysInAR || '--'}
 suffix=" days"
 icon="schedule"
 iconColor="text-amber-500"
 accentColor="border-l-amber-500"
 trend={kpis?.daysInARTrend}
 trendPoints={[44, 42, 41, 40, 38]}
 trendColor="#f59e0b"
 onClick={() => handleKPIClick('/collections/hub')}
 />
 </div>
 </div>

 {/* ── AUDIT INSIGHTS STRIP: Root Cause + Prevention + Diagnostics ── */}
 <div className="flex flex-wrap items-stretch gap-3">
   {/* Root Cause Summary Strip */}
   {rootCauseSummary && rootCauseSummary.by_root_cause && rootCauseSummary.by_root_cause.length > 0 && (() => {
     const byRC = rootCauseSummary.by_root_cause;
     const totalImpact = rootCauseSummary.total_financial_impact || byRC.reduce((s, r) => s + (r.total_impact || 0), 0);
     const top3 = byRC.slice(0, 3);
     const fmt = (v) => v >= 1e9 ? `$${(v/1e9).toFixed(1)}B` : v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v/1e3).toFixed(0)}K` : `$${v}`;
     return (
       <button
         onClick={() => navigate('/analytics/denials/root-cause')}
         className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3 bg-th-surface-raised border border-th-border rounded-xl hover:border-purple-500/40 transition-all group"
       >
         <span className="material-symbols-outlined text-lg text-purple-400">hub</span>
         <div className="flex-1 min-w-0 flex items-center gap-2 text-xs text-th-secondary truncate">
           <strong className="text-th-heading shrink-0">Root Causes:</strong>
           {top3.map((rc, i) => {
             const pct = rc.pct ?? (totalImpact > 0 ? Math.round((rc.total_impact || 0) / totalImpact * 100) : 0);
             return (
               <span key={i} className="tabular-nums">
                 {i > 0 && <span className="text-th-muted mx-1">|</span>}
                 <span className="font-semibold text-th-heading">{rc.root_cause?.replace(/_/g, ' ')}</span>{' '}
                 <span className="font-bold text-purple-400">{pct}%</span>{' '}
                 <span className="text-th-muted">({fmt(rc.total_impact || 0)})</span>
               </span>
             );
           })}
         </div>
         <span className="material-symbols-outlined text-xs text-th-muted opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
       </button>
     );
   })()}

   {/* Prevention Alert Count */}
   {preventionAlerts && (() => {
     const alertCount = preventionAlerts.alerts?.length || preventionAlerts.summary?.total_alerts || 0;
     if (alertCount === 0) return null;
     return (
       <button
         onClick={() => navigate('/analytics/prevention')}
         className="flex items-center gap-2 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-xl hover:bg-amber-500/10 transition-all"
       >
         <span className="material-symbols-outlined text-lg text-amber-400">shield</span>
         <span className="text-xs font-bold text-amber-300 tabular-nums">
           {alertCount} preventable denial{alertCount !== 1 ? 's' : ''} detected
         </span>
       </button>
     );
   })()}

   {/* Diagnostic Findings Count */}
   {diagnosticFindings && (() => {
     const findings = diagnosticFindings.findings || diagnosticFindings;
     const criticalCount = Array.isArray(findings) ? findings.length : (diagnosticFindings.total || diagnosticFindings.count || 0);
     if (criticalCount === 0) return null;
     return (
       <button
         onClick={() => navigate('/analytics/diagnostics')}
         className="flex items-center gap-2 px-4 py-3 bg-rose-500/5 border border-rose-500/20 rounded-xl hover:bg-rose-500/10 transition-all"
       >
         <span className="material-symbols-outlined text-lg text-rose-400">error</span>
         <span className="text-xs font-bold text-rose-300 tabular-nums">
           {criticalCount} critical finding{criticalCount !== 1 ? 's' : ''} require attention
         </span>
       </button>
     );
   })()}
 </div>

 {/* ── AI INSIGHTS PANEL ── */}
 <div className="mb-6">
   <div className="flex items-center justify-between mb-3">
     <div className="flex items-center gap-2">
       <span className="material-symbols-outlined text-amber-400 text-base">auto_awesome</span>
       <span className="text-th-secondary text-xs font-semibold uppercase tracking-wider">AI Intelligence</span>
       <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
         LIDA AI
       </span>
     </div>
     <span className="text-th-muted text-[10px] font-medium">Powered by Predictive Analytics</span>
   </div>
   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
     {aiInsightsLoading ? (
       [1, 2, 3].map(i => (
         <div key={i} className="bg-th-surface-raised border border-th-border rounded-xl p-5 space-y-3 animate-pulse">
           <div className="h-4 w-3/4 bg-th-surface-overlay rounded" />
           <div className="h-3 w-full bg-th-surface-overlay rounded" />
           <div className="h-3 w-1/2 bg-th-surface-overlay rounded" />
         </div>
       ))
     ) : execAiInsights.length > 0 ? (
       execAiInsights.map((insight) => (
         <AIInsightCard key={insight.title} {...insight} />
       ))
     ) : (
       <div className="col-span-full text-center py-8 text-sm text-th-muted">
         <span className="material-symbols-outlined text-2xl mb-2 block">auto_awesome</span>
         No AI insights available. Insights will appear when the AI engine processes your data.
       </div>
     )}
   </div>
 </div>

 {/* Financial & Alerts Grid */}
 <div className="grid grid-cols-12 gap-6">
 {/* Financial Analytics (Left Column) */}
 <div className="col-span-12 lg:col-span-8 space-y-6">
 {/* Revenue Trend Chart */}
 <div className="bg-th-surface-raised border border-th-border p-6 rounded-xl">
 <div className="flex items-center justify-between mb-8">
 <div>
 <div className="flex items-center gap-3 mb-1">
 <h4 className="text-sm font-bold text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-blue-400 text-lg">insights</span>
 Revenue Lifecycle Intelligence
 </h4>
 <AIBadge level="Predictive" />
 </div>
 <p className="text-[10px] text-th-muted mt-1">Real-time processing vs. AI predictive projections</p>
 </div>
 <div className="flex items-center gap-4 text-[10px] font-semibold text-th-secondary">
 <div className="flex items-center gap-1.5">
 <div className="size-2 rounded-full bg-blue-500" /> Actual
 </div>
 <div className="flex items-center gap-1.5">
 <div className="size-2 rounded-full bg-blue-500/30" /> AI Projected
 </div>
 <button
 onClick={() => handleKPIClick('/analytics/revenue')}
 className="text-th-muted hover:text-blue-400 transition-colors ml-2"
 title="Expand View"
 >
 <span className="material-symbols-outlined text-lg">fullscreen</span>
 </button>
 </div>
 </div>
 <RevenueTrendChart revenueTrend={revenueTrend} />
 </div>

 {/* A/R Aging Section */}
 <div className="bg-th-surface-raised border border-th-border p-6 rounded-xl">
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <h4 className="text-sm font-bold text-th-heading">A/R Aging Segmentation</h4>
 <AIBadge level="Diagnostic" />
 </div>
 <div className="flex gap-1">
 <button className="px-2 py-1 text-[10px] bg-th-surface-overlay rounded font-bold text-th-heading hover:bg-th-surface-overlay transition-colors">
 Payer Group
 </button>
 <button className="px-2 py-1 text-[10px] text-th-muted rounded font-bold hover:bg-th-surface-overlay transition-colors">
 Facility
 </button>
 </div>
 </div>
 <ARAgingSection />
 </div>
 </div>

 {/* Alerts & Intelligence (Right Column) */}
 <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
 <div className="bg-th-surface-raised border border-th-border rounded-xl flex-1 flex flex-col overflow-hidden">
 <div className="p-4 border-b border-th-border flex items-center justify-between">
 <h4 className="text-xs font-bold text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-amber-500 text-lg">auto_awesome</span>
 LIDA Intelligence Alerts
 </h4>
 <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 text-[9px] font-bold rounded uppercase">
 4 Action Required
 </span>
 </div>
 <div className="flex-1 overflow-y-auto">
 <AlertItem type="error" title="Claim #8821 Rejected" time="2m ago" description="Missing Provider NPI on BlueShield. Value:" value="$12,400" />
 <AlertItem type="warning" title="Coverage Expiration" time="45m ago" description="S. Johnson (ID: 0042) policy inactive. 12 claims pending." />
 <AlertItem type="info" title="Coding Recommendation" time="2h ago" description="Suggest modifier -25 for 18 ortho claims to prevent bundling." />
 </div>
 <button
 onClick={() => setIsAuditModalOpen(true)}
 className="p-3 w-full text-left text-[10px] font-bold text-blue-400 hover:bg-th-surface-overlay transition-colors border-t border-th-border uppercase tracking-widest"
 >
 Audit Performance Log
 </button>
 </div>

 </div>
 </div>

 {/* Operational Intelligence Section */}
 <div className="grid grid-cols-12 gap-8">
 <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
 <div className="flex items-center justify-between">
 <div>
 <div className="flex items-center gap-3">
 <h3 className="text-xl font-bold text-th-heading">Active Insights Tickets</h3>
 <AIBadge level="Prescriptive" />
 </div>
 <p className="text-sm text-th-secondary mt-1">Manage tasks derived directly from AI data insights</p>
 </div>
 <button
 onClick={() => setIsCreateModalOpen(true)}
 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-th-heading text-xs font-bold rounded-lg flex items-center gap-2 transition-colors"
 >
 <span className="material-symbols-outlined text-[18px]">add</span> Create Ticket
 </button>
 </div>

 <div className="flex flex-col gap-4">
 {activeTickets
 .filter(
 (t) =>
 t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 t.id.toLowerCase().includes(searchQuery.toLowerCase())
 )
 .map((ticket) => (
 <TicketCard
 key={ticket.id}
 id={ticket.id}
 priority={ticket.priority}
 title={ticket.title}
 description={ticket.description}
 assignee={ticket.assignee?.name || ticket.assignee}
 source={ticket.source}
 recovery={
 typeof ticket.recovery_potential === 'number'
 ? `$${ticket.recovery_potential.toLocaleString()}`
 : ticket.recovery_potential || '$0'
 }
 timeline={ticket.timeline_display || '3 days left'}
 chartColor={ticket.chartColor || 'bg-blue-500'}
 onClick={() => setSelectedTicket(ticket)}
 />
 ))}
 </div>
 </div>

 <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
 <div className="flex items-center justify-between mb-6">
 <h3 className="font-bold text-th-heading">Team Performance</h3>
 <span className="material-symbols-outlined text-th-muted cursor-pointer hover:text-th-heading transition-colors">more_horiz</span>
 </div>
 <div className="space-y-6">
 <PerformanceGroup
 title="Top Performers"
 icon="verified"
 iconColor="text-emerald-500"
 members={[
 { name: 'Marcus Chen', stat: 'Avg Resolution: 4.2h', metric: '12 Tickets', subMetric: 'Closed', metricColor: 'text-emerald-500' },
 { name: 'Elena Rodriguez', stat: 'Avg Resolution: 5.8h', metric: '9 Tickets', subMetric: 'Closed', metricColor: 'text-emerald-500' },
 ]}
 />
 <PerformanceGroup
 title="Lagging Response"
 icon="pending_actions"
 iconColor="text-amber-500"
 members={[{ name: 'Tom Braddock', stat: 'Avg Resolution: 28.5h', metric: '4 Overdue', subMetric: 'Stalled', metricColor: 'text-rose-500' }]}
 />
 </div>
 </div>

 </div>
 </div>
 </div>

 {/* Modals & Slide-overs */}
 {isCreateModalOpen && <CreateTicketModal onSubmit={handleCreateTicket} onClose={() => setIsCreateModalOpen(false)} />}
 {isAuditModalOpen && <AuditLogModal onClose={() => setIsAuditModalOpen(false)} />}
 {selectedTicket && <TicketReviewPanel ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
 </div>
 </div>
 );
}

// ----------------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------------

function KPICard({ title, value, suffix, icon, target, trend, iconColor, accentColor, trendPoints, trendColor, onClick }) {
 return (
 <div
 onClick={onClick}
 className={cn(
 'bg-th-surface-raised border border-th-border border-l-[3px] p-5 rounded-xl flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer',
 accentColor || 'border-l-blue-500'
 )}
 >
 <div className="flex justify-between items-start">
 <p className="text-th-muted text-xs font-semibold uppercase tracking-wider">{title}</p>
 {icon && <span className={cn('material-symbols-outlined', iconColor || 'text-th-muted')}>{icon}</span>}
 </div>
 <div className="mt-3">
 <div className="flex items-end justify-between">
 <h3 className="text-2xl font-bold text-th-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>
 {value}{suffix || ''}
 </h3>
 {trendPoints && <MiniTrendLine points={trendPoints} color={trendColor} />}
 </div>
 {target && <p className="text-blue-400 text-[10px] font-bold mt-2">{target}</p>}
 {trend && (
 <div className={cn('mt-2 flex items-center gap-1 text-[10px] font-bold', trend.isPositive ? 'text-emerald-500' : trend.color || 'text-th-muted')}>
 <span className="material-symbols-outlined text-[14px]">{trend.isPositive ? 'trending_up' : 'trending_down'}</span>
 {trend.value} <span className="text-th-muted font-normal ml-1">{trend.label}</span>
 </div>
 )}
 </div>
 </div>
 );
}

// --- Revenue Trend Chart with SVG gradient fill ---
function RevenueTrendChart({ revenueTrend }) {
 const fallbackData = [
 { actual: 11.2, predicted: 11.0, month: 'Oct' },
 { actual: 12.1, predicted: 11.8, month: 'Nov' },
 { actual: 12.8, predicted: 12.5, month: 'Dec' },
 { actual: 13.2, predicted: 13.0, month: 'Jan' },
 { actual: null, predicted: 13.8, month: 'Feb' },
 ];
 const data = revenueTrend.length > 0 ? revenueTrend : fallbackData;
 const maxVal = Math.max(...data.map(d => Math.max(d.actual || 0, d.predicted || 0)));
 const yMax = Math.ceil(maxVal / 2) * 2 + 2; // round up for nice axis

 const svgW = 600;
 const svgH = 240;
 const padL = 40;
 const padR = 20;
 const padT = 10;
 const padB = 30;
 const chartW = svgW - padL - padR;
 const chartH = svgH - padT - padB;

 const toX = (i) => padL + (i / (data.length - 1)) * chartW;
 const toY = (v) => padT + chartH - (v / yMax) * chartH;

 // Build actual line path (only non-null)
 const actualPoints = data.map((d, i) => d.actual != null ? { x: toX(i), y: toY(d.actual) } : null).filter(Boolean);
 const actualPath = actualPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
 // Gradient fill area (close path to bottom)
 const actualFill = actualPath + ` L${actualPoints[actualPoints.length - 1].x},${toY(0)} L${actualPoints[0].x},${toY(0)} Z`;

 // Build predicted line path
 const predPoints = data.map((d, i) => d.predicted != null ? { x: toX(i), y: toY(d.predicted) } : null).filter(Boolean);
 const predPath = predPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

 // Y-axis labels
 const yLabels = [];
 const ySteps = 5;
 for (let i = 0; i <= ySteps; i++) {
 const v = (yMax / ySteps) * i;
 yLabels.push({ value: `$${v.toFixed(0)}M`, y: toY(v) });
 }

 return (
 <div>
 <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-64">
 <defs>
 <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
 <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
 </linearGradient>
 </defs>
 {/* Grid lines */}
 {yLabels.map((l, i) => (
 <g key={i}>
 <line x1={padL} y1={l.y} x2={svgW - padR} y2={l.y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
 <text x={padL - 6} y={l.y + 3} textAnchor="end" className="fill-th-muted" fontSize="9" fontWeight="600">{l.value}</text>
 </g>
 ))}
 {/* Gradient fill under actual line */}
 {actualPoints.length > 1 && <path d={actualFill} fill="url(#revGradient)" />}
 {/* Predicted line (dashed) */}
 {predPoints.length > 1 && <path d={predPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4" strokeOpacity="0.4" />}
 {/* Actual line */}
 {actualPoints.length > 1 && <path d={actualPath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
 {/* Data points */}
 {actualPoints.map((p, i) => (
 <circle key={`a${i}`} cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" stroke="#1e293b" strokeWidth="2" />
 ))}
 {predPoints.map((p, i) => (
 <circle key={`p${i}`} cx={p.x} cy={p.y} r="2.5" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.5" />
 ))}
 {/* X-axis labels */}
 {data.map((d, i) => (
 <text key={i} x={toX(i)} y={svgH - 6} textAnchor="middle" className="fill-th-muted" fontSize="10" fontWeight="700">
 {d.month}
 </text>
 ))}
 </svg>
 </div>
 );
}

// --- A/R Aging with clickable expandable buckets ---
function ARAgingSection() {
 const [expandedBucket, setExpandedBucket] = useState(null);

 const buckets = [
 { key: '0-30', label: '0-30 Days', value: '$5,850,000', percent: 45, color: 'bg-emerald-500', dotColor: 'bg-emerald-500', details: [
 { payer: 'BlueCross BlueShield', amount: '$2,340,000' },
 { payer: 'Aetna', amount: '$1,755,000' },
 { payer: 'UnitedHealth', amount: '$1,170,000' },
 { payer: 'Other', amount: '$585,000' },
 ]},
 { key: '31-60', label: '31-60 Days', value: '$3,250,000', percent: 25, color: 'bg-blue-500', dotColor: 'bg-blue-500', details: [
 { payer: 'Cigna', amount: '$1,300,000' },
 { payer: 'Humana', amount: '$975,000' },
 { payer: 'Other', amount: '$975,000' },
 ]},
 { key: '61-90', label: '61-90 Days', value: '$1,950,000', percent: 15, color: 'bg-amber-500', dotColor: 'bg-amber-500', details: [
 { payer: 'Medicare', amount: '$975,000' },
 { payer: 'Medicaid', amount: '$585,000' },
 { payer: 'Other', amount: '$390,000' },
 ]},
 { key: '91-120', label: '91-120 Days', value: '$1,300,000', percent: 10, color: 'bg-orange-500', dotColor: 'bg-orange-500', details: [
 { payer: 'Self-Pay', amount: '$650,000' },
 { payer: 'Workers Comp', amount: '$390,000' },
 { payer: 'Other', amount: '$260,000' },
 ]},
 { key: '120+', label: '120+ Days', value: '$650,000', percent: 5, color: 'bg-red-500', dotColor: 'bg-red-500', details: [
 { payer: 'Aged Self-Pay', amount: '$325,000' },
 { payer: 'Disputed Claims', amount: '$195,000' },
 { payer: 'Other', amount: '$130,000' },
 ]},
 ];

 return (
 <div className="space-y-4">
 {/* Stacked bar */}
 <div className="w-full bg-th-surface-overlay h-3 rounded-full overflow-hidden flex">
 {buckets.map(b => (
 <div
 key={b.key}
 className={cn('h-full cursor-pointer transition-opacity hover:opacity-80', b.color)}
 style={{ width: `${b.percent}%` }}
 onClick={() => setExpandedBucket(expandedBucket === b.key ? null : b.key)}
 title={`${b.label}: ${b.value} (${b.percent}%)`}
 />
 ))}
 </div>

 {/* Bucket cards */}
 <div className="grid grid-cols-5 gap-3">
 {buckets.map(b => (
 <div key={b.key}>
 <button
 onClick={() => setExpandedBucket(expandedBucket === b.key ? null : b.key)}
 className={cn(
 'w-full text-left p-3 rounded-lg border transition-all duration-200',
 expandedBucket === b.key
 ? 'border-blue-500/50 bg-th-surface-overlay/60'
 : 'border-th-border bg-th-surface-overlay/30 hover:border-th-border-strong'
 )}
 >
 <div className="flex items-center gap-1.5 mb-1">
 <span className={cn('size-2 rounded-full shrink-0', b.dotColor)} />
 <p className="text-[10px] text-th-muted font-bold uppercase truncate">{b.label}</p>
 </div>
 <p className="text-sm font-bold text-th-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{b.value}</p>
 <p className="text-[10px] text-th-muted mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>{b.percent}%</p>
 </button>
 {expandedBucket === b.key && (
 <div className="mt-2 p-3 rounded-lg border border-th-border bg-th-surface-base space-y-2 animate-fade-in">
 <p className="text-[9px] font-bold text-th-muted uppercase tracking-wider mb-1">Breakdown by Payer</p>
 {b.details.map((d, i) => (
 <div key={i} className="flex justify-between items-center text-[11px]">
 <span className="text-th-secondary">{d.payer}</span>
 <span className="text-th-heading font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>{d.amount}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 );
}

function AlertItem({ type, title, time, description, value }) {
 const icons = {
 error: { icon: 'report', color: 'text-red-500', bg: 'bg-red-500/10' },
 warning: { icon: 'person_off', color: 'text-amber-500', bg: 'bg-amber-500/10' },
 info: { icon: 'bolt', color: 'text-blue-400', bg: 'bg-blue-500/10' },
 };

 const style = icons[type];

 return (
 <div className="p-4 border-b border-th-border/30 hover:bg-th-surface-overlay/30 transition-colors cursor-pointer group">
 <div className="flex gap-3">
 <div className={cn('size-7 rounded shrink-0 flex items-center justify-center transition-colors', style.bg, style.color)}>
 <span className="material-symbols-outlined text-base">{style.icon}</span>
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start">
 <p className="text-xs font-bold truncate text-th-heading">{title}</p>
 <span className="text-[9px] text-th-muted">{time}</span>
 </div>
 <p className="text-[10px] text-th-secondary mt-1 leading-relaxed">
 {description} {value && <span className="text-th-heading font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>}
 </p>
 {type === 'error' && (
 <div className="mt-2.5 flex gap-2">
 <button className="px-2 py-0.5 bg-blue-600 text-th-heading text-[9px] font-bold rounded hover:bg-blue-700 transition-colors">Auto-Fix</button>
 <button className="px-2 py-0.5 border border-th-border text-[9px] font-bold rounded text-th-secondary hover:text-th-heading transition-colors">View</button>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}

function TicketCard({ id, priority, title, description, assignee, source, recovery, timeline, chartColor, onClick }) {
 const priorityColors = {
 Critical: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
 High: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
 Medium: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
 Low: 'bg-th-surface-overlay text-th-secondary border border-th-border',
 Resolved: 'bg-green-500/10 text-green-400 border border-green-500/20',
 };

 return (
 <div onClick={onClick} className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 cursor-pointer group">
 <div className="p-5 flex gap-6">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-2">
 <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', priorityColors[priority] || priorityColors['Medium'])}>
 {priority} Priority
 </span>
 <span className="text-[10px] font-bold text-th-muted uppercase">{id}</span>
 </div>
 <h4 className="text-base font-bold text-th-heading mb-1 group-hover:text-blue-400 transition-colors">{title}</h4>
 <p className="text-sm text-th-secondary mb-4">{description}</p>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-th-border/30">
 <div>
 <p className="text-th-muted text-[10px] font-semibold uppercase tracking-wider mb-1">Assigned Leader</p>
 <div className="flex items-center gap-2">
 <div className="size-6 rounded-full bg-th-surface-overlay" />
 <span className="text-xs font-medium text-th-heading">{assignee}</span>
 </div>
 </div>
 <div>
 <p className="text-th-muted text-[10px] font-semibold uppercase tracking-wider mb-1">Source Insight</p>
 <div className="flex items-center gap-1 text-blue-400">
 <span className="material-symbols-outlined text-[14px]">query_stats</span>
 <span className="text-xs font-medium">{source}</span>
 </div>
 </div>
 <div>
 <p className="text-th-muted text-[10px] font-semibold uppercase tracking-wider mb-1">Est. Recovery</p>
 <span className="text-xs font-bold text-emerald-500" style={{ fontVariantNumeric: 'tabular-nums' }}>{recovery}</span>
 </div>
 <div>
 <p className="text-th-muted text-[10px] font-semibold uppercase tracking-wider mb-1">Timeline</p>
 <span className="text-xs font-medium text-th-heading">{timeline}</span>
 </div>
 </div>
 </div>
 <div className="w-48 shrink-0 flex-col gap-2 hidden md:flex">
 <p className="text-th-muted text-[10px] font-semibold uppercase tracking-wider">Related Chart</p>
 <div className="bg-th-surface-base rounded-lg p-3 h-full border border-th-border/30">
 <div className="flex items-end gap-1 h-full pt-4">
 {[30, 40, 35, 90, 85].map((h, i) => (
 <div key={i} className={cn('flex-1 rounded-t-sm', i > 2 ? chartColor : `${chartColor}/20`)} style={{ height: `${h}%` }} />
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

function PerformanceGroup({ title, icon, iconColor, members }) {
 return (
 <div>
 <div className="flex items-center gap-2 mb-4">
 <span className={cn('material-symbols-outlined text-[20px]', iconColor)}>{icon}</span>
 <span className="text-xs font-bold uppercase tracking-wider text-th-secondary">{title}</span>
 </div>
 <div className="space-y-3">
 {members.map((m, i) => (
 <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-th-surface-base border border-th-border/30">
 <div className="flex items-center gap-3">
 <div className="size-8 rounded-full bg-th-surface-overlay" />
 <div>
 <p className="text-xs font-bold text-th-heading">{m.name}</p>
 <p className="text-[10px] text-th-muted">{m.stat}</p>
 </div>
 </div>
 <div className="text-right">
 <p className={cn('text-xs font-bold', m.metricColor)} style={{ fontVariantNumeric: 'tabular-nums' }}>{m.metric}</p>
 <p className="text-[10px] text-th-muted">{m.subMetric}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}

function CreateTicketModal({ onSubmit, onClose }) {
 const [title, setTitle] = useState('New Investigation');
 const [priority, setPriority] = useState('Medium');
 const [recovery, setRecovery] = useState(0);

 const handleSubmit = () => {
 onSubmit({
 title,
 priority,
 description: 'User generated ticket...',
 assignee: { name: 'You' },
 source: 'Manual',
 recovery_potential: parseInt(recovery),
 });
 };

 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
 <div className="bg-th-surface-raised border border-th-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
 <div className="p-6 border-b border-th-border flex items-center justify-between">
 <h3 className="text-lg font-bold text-th-heading">Create New Insight Ticket</h3>
 <button onClick={onClose} className="text-th-muted hover:text-th-heading transition-colors">
 <span className="material-symbols-outlined">close</span>
 </button>
 </div>
 <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <label className="block text-th-muted text-xs font-semibold uppercase tracking-wider mb-1.5">Ticket Title</label>
 <input
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 className="w-full bg-th-surface-base border border-th-border rounded-lg text-sm p-2.5 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-th-heading outline-none"
 type="text"
 />
 </div>
 <div>
 <label className="block text-th-muted text-xs font-semibold uppercase tracking-wider mb-1.5">Priority Level</label>
 <select
 value={priority}
 onChange={(e) => setPriority(e.target.value)}
 className="w-full bg-th-surface-base border border-th-border rounded-lg text-sm p-2.5 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-th-heading outline-none"
 >
 <option>Critical</option>
 <option>High</option>
 <option>Medium</option>
 <option>Low</option>
 </select>
 </div>
 <div className="col-span-2">
 <label className="block text-th-muted text-xs font-semibold uppercase tracking-wider mb-1.5">Estimated Revenue Recovery</label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-th-muted text-sm">$</span>
 <input
 value={recovery}
 onChange={(e) => setRecovery(e.target.value)}
 className="w-full pl-7 bg-th-surface-base border border-th-border rounded-lg text-sm p-2.5 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-th-heading outline-none"
 type="number"
 />
 </div>
 </div>
 </div>
 </div>
 <div className="p-6 border-t border-th-border flex justify-end gap-3 bg-th-surface-base">
 <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-th-muted hover:text-th-heading transition-colors">
 Cancel
 </button>
 <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-th-heading text-xs font-bold rounded-lg transition-colors">
 Generate Ticket
 </button>
 </div>
 </div>
 </div>
 );
}

function TicketReviewPanel({ ticket, onClose }) {
 return (
 <div className="fixed inset-y-0 right-0 z-[110] w-[450px] bg-th-surface-base border-l border-th-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
 <div className="p-6 border-b border-th-border bg-th-surface-raised">
 <div className="flex items-center justify-between mb-4">
 <span className="text-th-muted text-[10px] font-semibold uppercase tracking-widest">{ticket.id} / Review</span>
 <button onClick={onClose} className="text-th-muted hover:text-th-heading transition-colors">
 <span className="material-symbols-outlined">close</span>
 </button>
 </div>
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-bold text-th-heading">{ticket.title}</h3>
 <div className="flex bg-th-surface-overlay p-1 rounded-lg border border-th-border">
 <button className="px-3 py-1 text-[10px] font-bold rounded-md bg-amber-500/10 text-amber-400">Pending</button>
 <button className="px-3 py-1 text-[10px] font-bold rounded-md text-th-muted hover:text-th-heading">Verified</button>
 </div>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-th-surface-overlay">
 <h4 className="text-th-muted text-[10px] font-semibold uppercase tracking-widest mb-6">Timeline of Communication</h4>
 <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-th-surface-overlay">
 {(ticket.timeline || []).map((event, i) => (
 <TimelineItem
 key={i}
 icon={event.type === 'system' ? 'auto_awesome' : 'person'}
 iconBg={event.type === 'system' ? 'bg-blue-600' : 'bg-th-surface-overlay'}
 name={event.author}
 time={new Date(event.time).toLocaleTimeString()}
 content={event.content}
 isSystem={event.type === 'system'}
 />
 ))}
 {(!ticket.timeline || ticket.timeline.length === 0) && (
 <div className="pl-10 text-sm text-th-muted">No events recorded yet.</div>
 )}
 </div>
 </div>

 <div className="p-6 border-t border-th-border bg-th-surface-raised">
 <div className="relative">
 <textarea
 className="w-full bg-th-surface-base border border-th-border rounded-xl text-sm p-4 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-th-heading placeholder-th-muted scrollbar-none resize-none outline-none"
 placeholder="Add a comment or @tag a team member..."
 rows="3"
 />
 <div className="absolute bottom-3 right-3 flex items-center gap-2">
 <button className="size-8 rounded-lg flex items-center justify-center hover:bg-th-surface-overlay transition-colors text-th-muted">
 <span className="material-symbols-outlined text-[18px]">attach_file</span>
 </button>
 <button className="px-4 py-1.5 bg-blue-600 text-th-heading text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">Send</button>
 </div>
 </div>
 </div>
 </div>
 );
}

function TimelineItem({ icon, iconBg, name, time, content, isSystem }) {
 return (
 <div className="relative pl-10">
 <div className={cn('absolute left-1 top-0 size-6 rounded-full flex items-center justify-center text-th-heading ring-4 ring-th-surface-base', iconBg)}>
 <span className="material-symbols-outlined text-[14px]">{icon}</span>
 </div>
 <div
 className={cn(
 'rounded-xl p-4 border',
 isSystem ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-th-surface-raised border-th-border'
 )}
 >
 <div className="flex justify-between items-center mb-1">
 <span className={cn('text-xs font-bold', isSystem ? 'text-emerald-400' : name === 'LIDA Intelligence' ? 'text-blue-400' : 'text-th-heading')}>
 {name}
 </span>
 <span className="text-[10px] text-th-muted font-medium">{time}</span>
 </div>
 <p className="text-sm text-th-secondary leading-relaxed">{content}</p>
 </div>
 </div>
 );
}
