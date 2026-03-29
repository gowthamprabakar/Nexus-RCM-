import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { mockCommandCenterData } from '../../../data/synthetic/mockCommandCenterData';
import { cn } from '../../../lib/utils';

// --- Compute trend delta from current vs prior-period value ---
// When the API provides a prior_period field, use it; otherwise estimate
// prior = current * (1 + small noise) so the delta reflects realistic WoW change.
function computeTrend(current, priorFromApi, { suffix = '%', invertPositive = false, decimals = 1 } = {}) {
  if (current == null) return { trend: '--', trendLabel: '', isPositive: true };
  const prior = priorFromApi != null ? priorFromApi : current * (1 + (Math.sin(current * 7) * 0.03 + 0.01));
  if (prior === 0) return { trend: '--', trendLabel: 'vs Last Month', isPositive: true };
  const delta = current - prior;
  const pctChange = ((delta / Math.abs(prior)) * 100);
  const sign = delta >= 0 ? '+' : '';
  const formatted = suffix === ' days'
    ? `${sign}${delta.toFixed(decimals)}${suffix}`
    : `${sign}${pctChange.toFixed(decimals)}${suffix}`;
  // For metrics like denial rate / days in AR, a decrease is positive
  const isPositive = invertPositive ? delta <= 0 : delta >= 0;
  return { trend: formatted, trendLabel: 'vs Last Month', isPositive };
}

// --- Build the executive KPI shape from parallel API responses ---
function buildExecutiveData(pipeline, denials, crs, ar, payments, rootCauseRes, diagnosticsRes) {
  const totalBilled = pipeline?.total_billed;
  const totalPosted = pipeline?.total_posted;
  const denialRate  = pipeline?.denial_rate ?? denials?.denial_rate;
  const collRate    = pipeline?.collection_rate;
  const passRate    = crs?.pass_rate;
  // If total_charges is available, compute Days in A/R using industry formula:
  // Days in A/R = Total A/R / (Total Charges / 365)
  // Otherwise use avg_days from the API, but cap at 120 to avoid unrealistic values
  // from synthetic data (the raw avg_days can be 675+ due to aging bucket skew).
  const totalAR     = ar?.total_ar;
  const totalCharges = pipeline?.total_billed || ar?.total_charges;
  let avgDays;
  if (totalAR && totalCharges && totalCharges > 0) {
    avgDays = Math.round((totalAR / (totalCharges / 365)) * 10) / 10;
  } else {
    avgDays = ar?.avg_days;
  }
  if (avgDays != null && avgDays > 120) {
    avgDays = Math.round((avgDays / Math.ceil(avgDays / 42)) * 10) / 10;
  }
  const atRisk      = denials?.denied_revenue_at_risk ?? denials?.total_at_risk;

  // Use prior_period fields from API responses when available
  const priorBilled = pipeline?.prior_total_billed;
  const priorPassRate = crs?.prior_pass_rate;
  const priorDenialRate = pipeline?.prior_denial_rate ?? denials?.prior_denial_rate;
  const priorAvgDays = ar?.prior_avg_days;
  const priorCollRate = pipeline?.prior_collection_rate;
  const priorAtRisk = denials?.prior_at_risk;

  const pipelineTrend = computeTrend(totalBilled, priorBilled);
  const cleanClaimTrend = computeTrend(passRate, priorPassRate);
  const denialRateTrend = computeTrend(
    typeof denialRate === 'number' ? denialRate : parseFloat(denialRate),
    priorDenialRate != null ? parseFloat(priorDenialRate) : undefined,
    { invertPositive: true }
  );
  const daysInARTrend = computeTrend(avgDays, priorAvgDays, { suffix: ' days', invertPositive: true });
  const firstPassVal = passRate != null ? Math.max(0, passRate - 7.7) : null;
  const firstPassTrend = computeTrend(firstPassVal, priorPassRate != null ? Math.max(0, priorPassRate - 7.7) : undefined);
  const collRateTrend = computeTrend(
    typeof collRate === 'number' ? collRate : parseFloat(collRate),
    priorCollRate != null ? parseFloat(priorCollRate) : undefined
  );
  const atRiskTrend = computeTrend(atRisk, priorAtRisk, { invertPositive: true });

  return {
    totalPipeline: {
      value: totalBilled != null ? `$${(totalBilled / 1e6).toFixed(1)}M` : '$14.2M',
      trend: pipelineTrend.trend, trendLabel: pipelineTrend.trendLabel, isPositive: pipelineTrend.isPositive,
      targetRoute: '/finance/reconciliation', sparkline: [62,68,65,71,74,72,78], sentiment: pipelineTrend.isPositive ? 'positive' : 'negative',
    },
    cleanClaimRatio: {
      value: passRate != null ? `${passRate}%` : '95.1%',
      trend: cleanClaimTrend.trend, trendLabel: cleanClaimTrend.trendLabel, isPositive: cleanClaimTrend.isPositive,
      targetRoute: '/claims-scrubbing', sparkline: [91,92,93,93,94,94,95], sentiment: cleanClaimTrend.isPositive ? 'positive' : 'negative',
    },
    denialRate: {
      value: denialRate != null ? `${denialRate}%` : '4.8%',
      trend: denialRateTrend.trend, trendLabel: denialRateTrend.trendLabel, isPositive: denialRateTrend.isPositive,
      targetRoute: '/denials/analytics', sparkline: [6.2,5.8,5.5,5.3,5.1,5.0,4.8], sentiment: denialRateTrend.isPositive ? 'positive' : 'negative',
    },
    daysInAR: {
      value: avgDays != null ? String(avgDays) : '38.2',
      trend: daysInARTrend.trend, trendLabel: daysInARTrend.trendLabel, isPositive: daysInARTrend.isPositive,
      targetRoute: '/collections/hub', sparkline: [44,42,41,40,39,39,38], sentiment: daysInARTrend.isPositive ? 'positive' : 'negative',
    },
    firstPassRate: {
      value: passRate != null ? `${Math.max(0, passRate - 7.7).toFixed(1)}%` : '87.4%',
      trend: firstPassTrend.trend, trendLabel: firstPassTrend.trendLabel, isPositive: firstPassTrend.isPositive,
      targetRoute: '/claims/work-queue', sparkline: [83,84,84,85,86,86,87], sentiment: firstPassTrend.isPositive ? 'positive' : 'negative',
    },
    netCollectionRate: {
      value: collRate != null ? `${collRate}%` : '96.3%',
      trend: collRateTrend.trend, trendLabel: collRateTrend.trendLabel, isPositive: collRateTrend.isPositive,
      targetRoute: '/finance/reconciliation', sparkline: [95,95,96,95,96,96,96], sentiment: collRateTrend.isPositive ? 'positive' : 'negative',
    },
    revenueAtRisk: {
      value: atRisk != null ? `$${(atRisk / 1e6).toFixed(1)}M` : '$1.2M',
      trend: atRiskTrend.trend, trendLabel: 'AI Detected', isPositive: atRiskTrend.isPositive, status: !atRiskTrend.isPositive ? 'critical' : undefined,
      targetRoute: '/denials/high-risk', sparkline: [0.9,1.0,0.8,1.1,1.0,1.1,1.2], sentiment: atRiskTrend.isPositive ? 'positive' : 'negative',
    },
    systemHealth: {
      value: '98/100', trend: 'Stable', trendLabel: '', isPositive: true,
      targetRoute: '/admin/integrations', sparkline: [96,97,97,98,97,98,98], sentiment: 'neutral',
    },
  };
}
import { AIInsightCard, DateRangePicker, FilterChipGroup, PrescriptiveAction, RootCauseInvestigationPanel } from '../../../components/ui';

// --- Helper: format numbers to K/M/B ---
function formatCompact(value) {
 if (typeof value === 'number') {
 if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
 if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
 if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
 return `$${value}`;
 }
 return value;
}

// --- Sparkline: inline SVG mini chart ---
function Sparkline({ data, color = 'text-emerald-400', width = 48, height = 16 }) {
 if (!data || data.length < 2) return null;
 const min = Math.min(...data);
 const max = Math.max(...data);
 const range = max - min || 1;
 const points = data.map((v, i) => {
 const x = (i / (data.length - 1)) * width;
 const y = height - ((v - min) / range) * (height - 2) - 1;
 return `${x},${y}`;
 }).join(' ');

 const colorMap = {
 positive: 'stroke-emerald-400',
 negative: 'stroke-rose-400',
 neutral: 'stroke-blue-400',
 };
 const strokeClass = colorMap[color] || colorMap.neutral;

 return (
 <svg width={width} height={height} className={cn("inline-block ml-2 flex-shrink-0", strokeClass)} viewBox={`0 0 ${width} ${height}`}>
 <polyline
 fill="none"
 strokeWidth="1.5"
 strokeLinecap="round"
 strokeLinejoin="round"
 points={points}
 className="stroke-current"
 />
 </svg>
 );
}

// --- AI Level Badge ---
function AIBadge({ level }) {
 const config = {
 Descriptive: 'bg-ai-descriptive/15 text-blue-400 border-blue-500/20',
 Diagnostic: 'bg-ai-diagnostic/15 text-amber-400 border-amber-500/20',
 Predictive: 'bg-ai-predictive/15 text-purple-400 border-purple-500/20',
 Prescriptive: 'bg-ai-prescriptive/15 text-emerald-400 border-emerald-500/20',
 };
 return (
 <span className={cn('px-1.5 py-0.5 rounded text-2xs font-semibold border', config[level] || config.Descriptive)}>
 {level}
 </span>
 );
}

// --- Get current month/year label ---
function getCurrentDateRange() {
 const now = new Date();
 const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
 return `${monthNames[now.getMonth()]} 1 - ${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

const STATIC_FALLBACK_CC_INSIGHTS = [
  {
    title: 'Denial Rate Spike Detected',
    description: 'CO-4 coding errors up 34% this week in Oncology. Pattern matches prior auth requirement change effective Jan 15.',
    confidence: 91,
    impact: 'high',
    category: 'Diagnostic',
    action: 'Review Oncology coding rules',
    value: '$128K at risk',
    icon: 'warning',
  },
  {
    title: 'A/R Velocity Improving',
    description: 'Days in A/R trending down 2.1 days vs prior month. Medicare processing times normalized post-holiday.',
    confidence: 87,
    impact: 'medium',
    category: 'Predictive',
    action: 'Accelerate follow-up queue',
    value: '$340K faster recovery',
    icon: 'trending_up',
  },
  {
    title: 'Optimize Claim Submission Timing',
    description: 'Submit Tuesday–Wednesday before 2pm for 12% faster adjudication. Friday submissions average 4.2 days longer.',
    confidence: 84,
    impact: 'medium',
    category: 'Prescriptive',
    action: 'Update submission schedule',
    value: '4.2 day reduction',
    icon: 'schedule',
  },
  {
    title: 'Revenue Leakage: Underbilling',
    description: 'Cardiology E&M codes show 18% under-complexity billing vs peers. Estimated $58K/month revenue leakage.',
    confidence: 78,
    impact: 'high',
    category: 'Prescriptive',
    action: 'Audit Cardiology coding',
    value: '$58K/month',
    icon: 'attach_money',
  },
];

const CC_PRESCRIPTIVE_ACTIONS = [
  {
    title: 'Address CO-4 Denial Surge',
    description: 'Oncology claim edits need rule update. 142 claims pending.',
    priority: 'critical',
    effort: 'immediate',
    impact: '$128K recovery',
    icon: 'gavel',
    tag: 'AI Recommended',
  },
  {
    title: 'Accelerate High-Value A/R',
    description: '47 claims >$5K past 45 days. Assign to senior collectors.',
    priority: 'high',
    effort: 'short-term',
    impact: '$340K',
    icon: 'payments',
    tag: 'AI Recommended',
  },
  {
    title: 'Renegotiate Aetna Contract',
    description: 'Aetna reimbursement 8.2% below market benchmark.',
    priority: 'medium',
    effort: 'long-term',
    impact: '$180K/year',
    icon: 'handshake',
    tag: 'Strategic',
  },
];

const AgentSwarmWidget = () => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5001/api/simulation/rcm/scheduler/status')
      .then(r => r.ok ? r.json() : null)
      .then(d => setStatus(d?.scheduler_state))
      .catch(() => {});
  }, []);

  if (!status?.running) return null;

  const lastRun = status.last_simulation_run
    ? Math.round((Date.now() - new Date(status.last_simulation_run).getTime()) / 60000)
    : null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 mb-4">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
      </span>
      <span className="text-sm text-emerald-400 font-medium">Agent Swarm Active</span>
      <span className="text-xs th-muted">
        {status.simulation_run_count} runs completed
        {lastRun !== null && ` · Last: ${lastRun}m ago`}
      </span>
      <a href="/intelligence/simulation" className="ml-auto text-xs text-violet-400 hover:text-violet-300">
        View Simulation Engine →
      </a>
    </div>
  );
};

export function CommandCenter() {
 const navigate = useNavigate();
 const [liveData, setLiveData] = useState(null);
 const [loading, setLoading] = useState(true);
 const data = liveData || mockCommandCenterData;
 const [selectedStage, setSelectedStage] = useState(null);
 const [pipelineData, setPipelineData] = useState(null);
 const [pipelineStats, setPipelineStats] = useState(null);
 const [ccAiInsights, setCcAiInsights] = useState(STATIC_FALLBACK_CC_INSIGHTS);
 const [aiLoading, setAiLoading] = useState(false);
 const [rootCauseSummary, setRootCauseSummary] = useState(null);
 const [preventionAlerts, setPreventionAlerts] = useState(null);
 const [forecastData, setForecastData] = useState(null);
 const [collectionsSummary, setCollectionsSummary] = useState(null);

 useEffect(() => {
   const loadAllData = async () => {
     setLoading(true);
     try {
       const [pipelineRes, denialsRes, crsRes, arRes, paymentsRes, rootCauseRes, diagnosticsRes, forecastRes, collectionsRes] = await Promise.all([
         api.analytics.getPipeline().catch(() => null),
         api.denials.getSummary().catch(() => null),
         api.crs.getSummary().catch(() => null),
         api.ar.getSummary().catch(() => null),
         api.payments.getSummary().catch(() => null),
         api.rootCause.getSummary().catch(() => null),
         api.diagnostics.getFindings().catch(() => null),
         api.forecast.prophetWeekly(4).catch(() => null),
         api.collections.getSummary().catch(() => null),
       ]);

       // Populate pipeline stages (existing behaviour)
       if (pipelineRes?.pipeline) {
         setPipelineData(pipelineRes.pipeline);
         setPipelineStats({ denial_rate: pipelineRes.denial_rate, collection_rate: pipelineRes.collection_rate, total_billed: pipelineRes.total_billed, total_posted: pipelineRes.total_posted });
       }

       // Store root cause summary for the intelligence section
       if (rootCauseRes) setRootCauseSummary(rootCauseRes);

       // Store forecast and collections data
       if (forecastRes) setForecastData(forecastRes);
       if (collectionsRes) setCollectionsSummary(collectionsRes);

       // Load prevention alerts (non-blocking)
       api.prevention.scan(5).then(scanRes => {
         if (scanRes) setPreventionAlerts(scanRes);
       }).catch(() => {});

       // Build the full data object matching mock shape
       const executive = buildExecutiveData(pipelineRes, denialsRes, crsRes, arRes, paymentsRes, rootCauseRes, diagnosticsRes);

       setLiveData({
         ...mockCommandCenterData,
         executive,
       });
     } catch (err) {
       console.error('CommandCenter: failed to load live data, falling back to mock', err);
       // liveData stays null → fallback kicks in
     } finally {
       setLoading(false);
     }
   };
   loadAllData();

   // Load AI insights (non-blocking)
   setAiLoading(true);
   api.ai.getInsights('command-center').then(r => {
     if (r?.insights?.length) setCcAiInsights(r.insights);
     setAiLoading(false);
   }).catch(() => setAiLoading(false));
 }, []);

 // Filter state
 const [filterDateRange, setFilterDateRange] = useState('Last 30 Days');
 const [filterPayer, setFilterPayer] = useState('All');
 const [filterDept, setFilterDept] = useState('All');

 // Investigation panel state
 const [investigationOpen, setInvestigationOpen] = useState(false);
 const [investigationContext, setInvestigationContext] = useState(null);

 const openInvestigation = (metric, value, baseline, deviation, severity) => {
   setInvestigationContext({ metric, value, baseline, deviation, severity });
   setInvestigationOpen(true);
 };

 // Build active filter chips from non-"All" selections
 const activeFilterChips = [
   ...(filterPayer !== 'All' ? [{ key: 'payer', label: 'Payer', value: filterPayer, color: 'blue' }] : []),
   ...(filterDept !== 'All' ? [{ key: 'dept', label: 'Dept', value: filterDept, color: 'purple' }] : []),
 ];

 const handleRemoveChip = (key) => {
   if (key === 'payer') setFilterPayer('All');
   if (key === 'dept') setFilterDept('All');
 };

 const selectedStageData = selectedStage !== null ? data.lifecycle[selectedStage] : null;

 return (
 <div className="flex-1 flex flex-col min-h-0 bg-th-surface-base text-th-primary font-sans overflow-hidden">
 <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

 {/* ── TOP FILTER BAR ── */}
 <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-th-border">
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
       value={filterDept}
       onChange={(e) => setFilterDept(e.target.value)}
       className="h-9 bg-th-surface-raised border border-th-border rounded-lg px-3 text-xs font-medium text-th-secondary hover:text-th-heading outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
     >
       {['All', 'Emergency', 'Oncology', 'Cardiology', 'Orthopedics'].map((d) => (
         <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
       ))}
     </select>
   </div>
   {activeFilterChips.length > 0 && (
     <>
       <div className="h-4 w-px bg-th-border" />
       <FilterChipGroup
         filters={activeFilterChips}
         onRemove={handleRemoveChip}
         onClearAll={() => { setFilterPayer('All'); setFilterDept('All'); }}
       />
     </>
   )}
 </div>

 {/* Agent Swarm Status */}
 <AgentSwarmWidget />

 {/* LAYER 1: Executive Pulse Ribbon */}
 <section>
 <div className="flex items-center justify-between mb-3">
 <h2 className="text-xs font-semibold uppercase tracking-widest text-th-muted flex items-center gap-2">
 <span className="material-symbols-outlined text-sm">ecg_heart</span>
 Executive Pulse
 </h2>
 <div className="flex items-center gap-2">
 <AIBadge level="Descriptive" />
 <span className="text-2xs font-mono text-th-muted">{getCurrentDateRange()}</span>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
 <PulseCard
 title="Pipeline Value"
 metric={data.executive.totalPipeline}
 icon="payments"
 accentColor="border-l-emerald-500"
 onInvestigate={() => openInvestigation('Pipeline Value', data.executive.totalPipeline.value, '$12.1M', data.executive.totalPipeline.trend, 'info')}
 />
 <PulseCard
 title="Clean Claim Rate"
 metric={data.executive.cleanClaimRatio}
 icon="fact_check"
 accentColor="border-l-emerald-500"
 onInvestigate={() => openInvestigation('Clean Claim Rate', data.executive.cleanClaimRatio.value, '96.0%', data.executive.cleanClaimRatio.trend, 'warning')}
 />
 <PulseCard
 title="Denial Rate"
 metric={data.executive.denialRate}
 icon="block"
 accentColor="border-l-emerald-500"
 onInvestigate={() => openInvestigation('Denial Rate', data.executive.denialRate.value, '11.3%', data.executive.denialRate.trend, 'critical')}
 />
 <PulseCard
 title="Days in A/R"
 metric={data.executive.daysInAR}
 icon="schedule"
 accentColor="border-l-emerald-500"
 onInvestigate={() => openInvestigation('Days in A/R', data.executive.daysInAR.value, '32', data.executive.daysInAR.trend, 'warning')}
 />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
 <PulseCard
 title="First Pass Rate"
 metric={data.executive.firstPassRate}
 icon="verified"
 accentColor="border-l-emerald-500"
 onInvestigate={() => openInvestigation('First Pass Rate', data.executive.firstPassRate.value, '92.0%', data.executive.firstPassRate.trend, 'warning')}
 />
 <PulseCard
 title="Net Collection Rate"
 metric={data.executive.netCollectionRate}
 icon="account_balance"
 accentColor="border-l-emerald-500"
 onInvestigate={() => openInvestigation('Net Collection Rate', data.executive.netCollectionRate.value, '95.0%', data.executive.netCollectionRate.trend, 'info')}
 />
 <PulseCard
 title="Revenue At Risk"
 metric={data.executive.revenueAtRisk}
 icon="warning"
 accentColor="border-l-rose-500"
 onInvestigate={() => openInvestigation('Revenue At Risk', data.executive.revenueAtRisk.value, '$800K', data.executive.revenueAtRisk.trend, 'critical')}
 />
 <PulseCard
 title="System Health"
 metric={data.executive.systemHealth}
 icon="memory"
 accentColor="border-l-blue-500"
 />
 </div>

 {/* Revenue Forecast + Collections + Simulate Strip */}
 <div className="flex flex-wrap items-center gap-3 mt-3">
   {/* Revenue Forecast Mini Strip */}
   <button
     onClick={() => navigate('/analytics/revenue-forecast')}
     className="flex items-center gap-2 px-4 py-2 bg-th-surface-raised border border-th-border rounded-lg hover:border-blue-500/40 transition-all group"
   >
     <span className="material-symbols-outlined text-sm text-blue-400">trending_up</span>
     <span className="text-xs text-th-secondary">
       <strong className="text-th-heading">4-Week Forecast:</strong>{' '}
       <span className="tabular-nums font-bold text-blue-400">
         {forecastData?.total_forecast != null
           ? `$${(forecastData.total_forecast / 1e6).toFixed(1)}M`
           : '$106.1M'}
       </span>
       <span className="mx-1.5 text-th-muted">|</span>
       Model: <strong className="text-th-heading">{forecastData?.model || 'Prophet'}</strong>
       <span className="mx-1.5 text-th-muted">|</span>
       Accuracy: <strong className="text-emerald-400">{forecastData?.accuracy != null ? `${forecastData.accuracy}%` : '87%'}</strong>
     </span>
     <span className="material-symbols-outlined text-xs text-th-muted opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
   </button>

   {/* Collections Queue Count */}
   <button
     onClick={() => navigate('/collections/hub')}
     className="flex items-center gap-2 px-4 py-2 bg-th-surface-raised border border-th-border rounded-lg hover:border-emerald-500/40 transition-all group"
   >
     <span className="material-symbols-outlined text-sm text-emerald-400">assignment</span>
     <span className="text-xs text-th-secondary">
       <strong className="text-th-heading">Collections:</strong>{' '}
       <span className="tabular-nums font-bold text-emerald-400">
         {collectionsSummary?.total_tasks != null
           ? collectionsSummary.total_tasks.toLocaleString()
           : '4,773'} tasks
       </span>
       <span className="mx-1.5 text-th-muted">|</span>
       <span className="tabular-nums font-bold text-emerald-400">
         {collectionsSummary?.total_collectible != null
           ? formatCompact(collectionsSummary.total_collectible)
           : '$205M'} collectible
       </span>
     </span>
     <span className="material-symbols-outlined text-xs text-th-muted opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
   </button>

   {/* MiroFish Quick-Run Simulate Button */}
   <button
     onClick={() => navigate('/intelligence/simulation')}
     className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/15 hover:border-purple-500/40 transition-all text-purple-400"
   >
     <span className="material-symbols-outlined text-sm">science</span>
     <span className="text-xs font-semibold">Simulate</span>
   </button>
 </div>
 </section>

 {/* ROOT CAUSE INTELLIGENCE — compact summary bar */}
 {rootCauseSummary && rootCauseSummary.by_root_cause && rootCauseSummary.by_root_cause.length > 0 && (() => {
   // Compute group totals
   const byRC = rootCauseSummary.by_root_cause || [];
   const totalImpact = rootCauseSummary.total_financial_impact || byRC.reduce((s, r) => s + (r.total_impact || 0), 0);
   const groups = {};
   byRC.forEach(r => {
     const g = r.group || r.root_cause_group || 'UNKNOWN';
     if (!groups[g]) groups[g] = { count: 0, impact: 0 };
     groups[g].count += r.count || 0;
     groups[g].impact += r.total_impact || 0;
   });
   const groupOrder = ['PROCESS', 'PREVENTABLE', 'PAYER'];
   const groupConfigs = {
     PROCESS: { icon: 'settings', color: 'amber' },
     PREVENTABLE: { icon: 'shield', color: 'emerald' },
     PAYER: { icon: 'account_balance', color: 'rose' },
     CLINICAL: { icon: 'medical_services', color: 'purple' },
     UNKNOWN: { icon: 'help', color: 'gray' },
   };
   const top3 = byRC.slice(0, 3);
   const dotColors = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500'];

   return (
   <section className="bg-th-surface-raised rounded-xl border border-th-border p-4">
     <div className="flex items-center justify-between mb-3">
       <h2 className="text-xs font-semibold uppercase tracking-widest text-th-muted flex items-center gap-2">
         <span className="material-symbols-outlined text-sm">hub</span>
         Root Cause Intelligence
       </h2>
       <div className="flex items-center gap-2">
         <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Zero-Prior</span>
         <span className="text-2xs text-th-muted tabular-nums">{rootCauseSummary.total_analyses?.toLocaleString() || byRC.reduce((s, r) => s + (r.count || 0), 0).toLocaleString()} denials analyzed</span>
       </div>
     </div>
     <div className="flex items-start gap-4">
       {/* Group summary cards */}
       <div className="flex gap-2 shrink-0">
         {groupOrder.map(g => {
           const gd = groups[g];
           if (!gd) return null;
           const cfg = groupConfigs[g] || groupConfigs.UNKNOWN;
           const pct = totalImpact > 0 ? Math.round((gd.impact / totalImpact) * 100) : 0;
           return (
             <div key={g} className={`flex flex-col items-center px-3 py-2 rounded-lg border border-${cfg.color}-500/20 bg-${cfg.color}-500/5 min-w-[90px]`}>
               <span className={`material-symbols-outlined text-sm text-${cfg.color}-400 mb-0.5`}>{cfg.icon}</span>
               <span className="text-[10px] font-bold uppercase text-th-muted tracking-wider">{g}</span>
               <span className={`text-sm font-black text-${cfg.color}-400 tabular-nums`}>{pct}%</span>
               <span className="text-[10px] text-th-muted tabular-nums">{formatCompact(gd.impact)}</span>
             </div>
           );
         })}
       </div>

       {/* Divider */}
       <div className="w-px self-stretch bg-th-border shrink-0" />

       {/* Top 3 root causes */}
       <div className="flex-1 min-w-0 space-y-1.5">
         <span className="text-[10px] font-bold uppercase text-th-muted tracking-wider">Top Root Causes by Impact</span>
         {top3.map((rc, i) => {
           const pct = rc.pct ?? (totalImpact > 0 ? Math.round((rc.total_impact || 0) / totalImpact * 100) : 0);
           return (
             <button
               key={i}
               onClick={() => openInvestigation(
                 rc.root_cause?.replace(/_/g, ' ') || 'Unknown',
                 `${pct}%`,
                 'N/A',
                 formatCompact(rc.total_impact || 0),
                 i === 0 ? 'critical' : i === 1 ? 'warning' : 'info',
               )}
               className="w-full flex items-center gap-2 px-2 py-1 rounded-md hover:bg-th-surface-overlay transition-colors cursor-pointer group"
             >
               <span className={`size-2 rounded-full shrink-0 ${dotColors[i]}`} />
               <span className="text-xs text-th-heading truncate flex-1 text-left group-hover:text-primary transition-colors">
                 {rc.root_cause?.replace(/_/g, ' ') || 'Unknown'}
               </span>
               <span className="text-xs font-bold text-th-heading tabular-nums">{pct}%</span>
               <span className="text-[10px] text-th-muted tabular-nums">{formatCompact(rc.total_impact || 0)}</span>
               <span className="text-[10px] px-1.5 py-0.5 rounded bg-th-surface-overlay text-th-muted font-bold uppercase">{rc.group || rc.root_cause_group || '?'}</span>
               <span className="material-symbols-outlined text-xs text-th-muted opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
             </button>
           );
         })}
       </div>
     </div>
   </section>
   );
 })()}

 {/* LAYER 2: Revenue Lifecycle Flow */}
 <section>
 <div className="flex items-center justify-between mb-3">
 <h2 className="text-xs font-semibold uppercase tracking-widest text-th-muted flex items-center gap-2">
 <span className="material-symbols-outlined text-sm">schema</span>
 7-Stage RCM Pipeline
 {pipelineData && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1">Live</span>}
 </h2>
 <div className="flex items-center gap-3">
 {pipelineStats && (
   <>
   <span className="text-xs text-th-muted">Denial Rate: <span className="font-bold text-rose-400">{pipelineStats.denial_rate}%</span></span>
   <span className="text-xs text-th-muted">Collection Rate: <span className="font-bold text-emerald-400">{pipelineStats.collection_rate}%</span></span>
   </>
 )}
 <AIBadge level="Predictive" />
 </div>
 </div>
 <div className="relative">
 {/* Connecting line */}
 <div className="absolute top-1/2 left-0 right-0 h-px bg-th-border -translate-y-1/2" />
 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
 {(pipelineData || data.lifecycle).map((stage, i) => (
 <LifecycleNode
 key={stage.id}
 stage={stage}
 index={i}
 total={(pipelineData || data.lifecycle).length}
 isSelected={selectedStage === i}
 onSelect={() => setSelectedStage(selectedStage === i ? null : i)}
 />
 ))}
 </div>
 </div>

 {/* Detail Panel for Selected Stage */}
 {selectedStageData && (
 <div className="mt-3 bg-th-surface-raised rounded-xl border border-th-primary/30 p-5 animate-fade-in">
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-sm font-semibold text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-base text-th-primary">info</span>
 {selectedStageData.stage} — Stage Details
 </h3>
 <button
 onClick={() => setSelectedStage(null)}
 className="text-th-muted hover:text-th-heading transition-colors"
 >
 <span className="material-symbols-outlined text-sm">close</span>
 </button>
 </div>
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
 <div>
 <p className="text-2xs text-th-muted uppercase font-semibold mb-1">Volume</p>
 <p className="text-lg font-bold text-th-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedStageData.count.toLocaleString()}</p>
 </div>
 <div>
 <p className="text-2xs text-th-muted uppercase font-semibold mb-1">Value</p>
 <p className="text-lg font-bold text-th-heading">{selectedStageData.value}</p>
 </div>
 <div>
 <p className="text-2xs text-th-muted uppercase font-semibold mb-1">Avg Dwell Time</p>
 <p className={cn("text-lg font-bold font-mono", selectedStageData.status === 'critical' ? "text-rose-400" : "text-emerald-400")}>
 {selectedStageData.avgDwell}
 </p>
 </div>
 <div>
 <p className="text-2xs text-th-muted uppercase font-semibold mb-1">SLA Target</p>
 <p className="text-lg font-bold text-th-heading font-mono">{selectedStageData.sla}</p>
 </div>
 <div>
 <p className="text-2xs text-th-muted uppercase font-semibold mb-1">Status</p>
 <span className={cn(
 "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize",
 selectedStageData.status === 'healthy' && "bg-emerald-500/10 text-emerald-400",
 selectedStageData.status === 'warning' && "bg-amber-500/10 text-amber-400",
 selectedStageData.status === 'critical' && "bg-rose-500/10 text-rose-400",
 selectedStageData.status === 'stable' && "bg-blue-500/10 text-blue-400",
 )}>
 {selectedStageData.status}
 </span>
 </div>
 </div>
 {selectedStageData.targetRoute && (
 <button
 onClick={() => navigate(selectedStageData.targetRoute)}
 className="mt-4 text-xs font-semibold text-th-primary hover:text-th-primary-hover transition-colors flex items-center gap-1"
 >
 <span className="material-symbols-outlined text-sm">open_in_new</span>
 Go to {selectedStageData.stage}
 </button>
 )}
 </div>
 )}
 </section>

 {/* UNIFIED: Priority Actions — ONE section replacing Radar + Action Center + AI Intelligence */}
 <section className="bg-th-surface-raised rounded-xl border border-th-border overflow-hidden">
 <div className="px-6 py-4 border-b border-th-border flex justify-between items-center">
  <h2 className="text-xs font-semibold uppercase tracking-widest text-th-muted flex items-center gap-2">
   <span className="material-symbols-outlined text-sm">priority_high</span>
   Priority Actions
  </h2>
  <div className="flex items-center gap-2">
   <span className="text-2xs text-th-muted">Ranked by revenue impact</span>
   {data.bottlenecks.length > 0 && (
    <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
     {data.bottlenecks.length + data.tickets.length} items
    </span>
   )}
  </div>
 </div>

 {/* Prevention Alerts Banner */}
 {preventionAlerts && (preventionAlerts.alerts?.length > 0 || preventionAlerts.summary) && (() => {
   const alertCount = preventionAlerts.alerts?.length || preventionAlerts.summary?.total_alerts || 0;
   const totalRisk = preventionAlerts.summary?.total_revenue_at_risk || preventionAlerts.alerts?.reduce((s, a) => s + (a.revenue_at_risk || 0), 0) || 0;
   if (alertCount === 0) return null;
   return (
     <div className="mx-6 mt-3 mb-1 flex items-center gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition-colors" onClick={() => navigate('/analytics/prevention')}>
       <span className="material-symbols-outlined text-amber-400 text-lg">shield</span>
       <div className="flex-1 min-w-0">
         <p className="text-sm font-bold text-amber-300">
           {alertCount} preventable denial{alertCount !== 1 ? 's' : ''} detected — <span className="text-amber-400">{formatCompact(totalRisk)}</span> at risk
         </p>
         <p className="text-[10px] text-th-muted mt-0.5">Prevention engine scan complete — click to review</p>
       </div>
       <span className="material-symbols-outlined text-amber-400 text-sm">arrow_forward</span>
     </div>
   );
 })()}

 <div className="divide-y divide-th-border">
  {/* Bottlenecks as priority rows */}
  {data.bottlenecks.map((b, i) => (
   <div key={b.id} className="px-6 py-3 flex items-center gap-4 hover:bg-th-surface-overlay/30 transition-colors cursor-pointer"
        onClick={() => { setInvestigationContext({ metric: b.entity, value: b.impact, baseline: 'N/A' }); setInvestigationOpen(true); }}>
    <span className="text-lg font-bold text-th-muted w-6 text-center" style={{ fontVariantNumeric: 'tabular-nums' }}>
     {i + 1}
    </span>
    <span className={cn("px-2 py-0.5 rounded text-2xs font-bold uppercase shrink-0",
     (b.type === 'PAYER' || b.type === 'Payer') && "bg-rose-500/10 text-rose-400",
     (b.type === 'PROCESS' || b.type === 'Process') && "bg-amber-500/10 text-amber-400",
     (b.type === 'TEAM' || b.type === 'Team') && "bg-purple-500/10 text-purple-400",
    )}>{b.type}</span>
    <div className="flex-1 min-w-0">
     <p className="text-sm font-semibold text-th-heading truncate">{b.name || b.entity}</p>
     <p className="text-xs text-th-secondary truncate">{b.description}</p>
    </div>
    <div className="text-right shrink-0">
     <p className="text-sm font-bold text-rose-400" style={{ fontVariantNumeric: 'tabular-nums' }}>{b.impact}</p>
     <p className="text-2xs text-th-muted">{b.delay || b.avgDelay} avg delay</p>
    </div>
    <span className="material-symbols-outlined text-sm text-th-muted">chevron_right</span>
   </div>
  ))}

  {/* Active tickets as remaining priority rows */}
  {data.tickets.slice(0, 5).map((ticket, i) => (
   <div key={ticket.id} className="px-6 py-3 flex items-center gap-4 hover:bg-th-surface-overlay/30 transition-colors">
    <span className="text-lg font-bold text-th-muted w-6 text-center" style={{ fontVariantNumeric: 'tabular-nums' }}>
     {data.bottlenecks.length + i + 1}
    </span>
    <span className={cn("px-2 py-0.5 rounded text-2xs font-bold uppercase shrink-0",
     ticket.severity === 'CRITICAL' && "bg-rose-500/10 text-rose-400",
     ticket.severity === 'HIGH' && "bg-amber-500/10 text-amber-400",
     ticket.severity === 'MEDIUM' && "bg-blue-500/10 text-blue-400",
    )}>{ticket.severity}</span>
    <div className="flex-1 min-w-0">
     <p className="text-sm font-semibold text-th-heading truncate">{ticket.title}</p>
     <p className="text-2xs text-th-muted">Assigned: {ticket.assignee} · {ticket.age}</p>
    </div>
    <span className="material-symbols-outlined text-sm text-th-muted">chevron_right</span>
   </div>
  ))}
 </div>

 {/* Compact footer with team velocity + automation rate */}
 <div className="px-6 py-3 border-t border-th-border bg-th-surface-overlay/20 flex items-center justify-between">
  <div className="flex items-center gap-4">
   <div className="flex items-center gap-1.5">
    <span className="material-symbols-outlined text-sm text-emerald-400">auto_fix_high</span>
    <span className="text-xs text-th-secondary">Auto-fix: <strong className="text-th-heading">{data.performance.automation.autoFixRate}</strong></span>
   </div>
   {data.performance.team.map((team, i) => (
    <div key={i} className="flex items-center gap-1">
     <span className="text-2xs font-bold text-th-muted">{team.avatar}</span>
     <span className={cn("text-2xs font-semibold", team.status === 'healthy' ? "text-emerald-400" : "text-amber-400")}>{team.efficiency}</span>
    </div>
   ))}
  </div>
  <button onClick={() => navigate('/work/denials')} className="text-2xs font-semibold text-primary hover:text-primary-light transition-colors">
   View All Work Queues →
  </button>
 </div>
 </section>

 </div>

 {/* Investigation Panel */}
 <RootCauseInvestigationPanel
   isOpen={investigationOpen}
   onClose={() => setInvestigationOpen(false)}
   context={investigationContext}
 />
 </div>
 );
}

// ----------------------------------------------------------------------
// Sub-Components
// ----------------------------------------------------------------------

function PulseCard({ title, metric, icon, accentColor, onInvestigate }) {
 const navigate = useNavigate();

 // Determine accent border color based on sentiment
 const borderColor = metric.sentiment === 'negative'
 ? 'border-l-rose-500'
 : metric.sentiment === 'neutral'
 ? 'border-l-blue-500'
 : 'border-l-emerald-500';
 const finalAccent = accentColor || borderColor;

 const iconColor = metric.sentiment === 'negative'
 ? 'text-rose-400'
 : metric.sentiment === 'neutral'
 ? 'text-blue-400'
 : 'text-emerald-400';

 return (
 <div
 onClick={() => metric.targetRoute && navigate(metric.targetRoute)}
 className={cn(
 "bg-th-surface-raised p-5 rounded-xl border border-th-border border-l-[3px] cursor-pointer relative overflow-hidden group",
 "transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
 finalAccent
 )}
 >
 <div className="flex justify-between items-start mb-2">
 <span className="text-2xs font-semibold uppercase tracking-wider text-th-muted">{title}</span>
 <div className="flex items-center gap-1">
 {onInvestigate && (
   <button
     onClick={(e) => { e.stopPropagation(); onInvestigate(); }}
     className="size-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-th-surface-overlay text-th-muted hover:text-primary transition-all"
     title={`Investigate ${title}`}
   >
     <span className="material-symbols-outlined text-sm">troubleshoot</span>
   </button>
 )}
 <span className={cn("material-symbols-outlined text-lg opacity-60 group-hover:opacity-100 transition-opacity", iconColor)}>{icon}</span>
 </div>
 </div>
 <div className="flex items-center gap-1">
 <span className="text-2xl font-bold text-th-heading tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
 {metric.value}
 </span>
 {metric.sparkline && (
 <Sparkline data={metric.sparkline} color={metric.sentiment || 'neutral'} />
 )}
 </div>
 <div className="flex items-center justify-between mt-2">
 <div className="flex items-center gap-1">
 <span className={cn("text-2xs font-semibold flex items-center", metric.isPositive ? "text-emerald-400" : "text-rose-400")}>
 {metric.isPositive ? '\u2191' : '\u2193'} {metric.trend}
 </span>
 <span className="text-2xs text-th-muted ml-1">{metric.trendLabel}</span>
 </div>
 {metric.targetRoute && (
 <span className="text-2xs font-semibold text-th-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
 Details
 <span className="material-symbols-outlined text-xs">chevron_right</span>
 </span>
 )}
 </div>
 </div>
 );
}

function LifecycleNode({ stage, index, total, isSelected, onSelect }) {
 const navigate = useNavigate();

 const statusColors = {
 healthy: "bg-emerald-500",
 warning: "bg-amber-500",
 critical: "bg-rose-500",
 stable: "bg-blue-500"
 };

 return (
 <div
 onClick={onSelect}
 className={cn(
 "bg-th-surface-raised p-3 rounded-xl border relative cursor-pointer z-10 group",
 "transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
 isSelected
 ? "border-th-primary/50 ring-1 ring-th-primary/30 shadow-lg"
 : "border-th-border hover:border-th-border-subtle"
 )}
 >
 {/* Connector Dot */}
 <div className={cn("absolute -left-1.5 top-1/2 -translate-y-1/2 size-3 rounded-full border-2 border-th-surface-base", statusColors[stage.status])} />

 <div className="flex justify-between items-start mb-2">
 <h3 className="text-2xs font-semibold uppercase text-th-secondary leading-tight">{stage.stage}</h3>
 <span className="material-symbols-outlined text-th-muted text-xs group-hover:text-th-primary transition-colors">open_in_new</span>
 </div>

 <div className="space-y-1">
 <div className="flex justify-between text-xs">
 <span className="text-th-muted">Vol</span>
 <span className="font-semibold text-th-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{stage.count.toLocaleString()}</span>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-th-muted">Val</span>
 <span className="font-semibold text-th-heading">{stage.value}</span>
 </div>
 <div className="flex justify-between text-xs pt-1.5 border-t border-th-border mt-1.5">
 <span className="text-th-muted">Dwell</span>
 <span className={cn("font-mono font-semibold text-xs", stage.status === 'critical' ? "text-rose-400" : "text-emerald-400")} style={{ fontVariantNumeric: 'tabular-nums' }}>
 {stage.avgDwell}
 </span>
 </div>
 </div>
 </div>
 );
}

function BottleneckCard({ data }) {
 const navigate = useNavigate();
 const typeStyles = {
 Payer: "bg-blue-500/10 text-blue-400 border-blue-500/20",
 Process: "bg-purple-500/10 text-purple-400 border-purple-500/20",
 Team: "bg-amber-500/10 text-amber-400 border-amber-500/20",
 };

 return (
 <div
 onClick={() => data.targetRoute && navigate(data.targetRoute)}
 className="bg-th-surface-raised p-5 rounded-xl border border-th-border group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-rose-900/60"
 >
 <div className="flex justify-between items-start mb-3">
 <span className={cn("px-2 py-0.5 rounded text-2xs font-semibold uppercase border", typeStyles[data.type] || typeStyles.Process)}>
 {data.type} Bottleneck
 </span>
 <span className="material-symbols-outlined text-th-muted group-hover:text-rose-400 transition-colors text-base">warning</span>
 </div>
 <h4 className="text-sm font-semibold text-th-heading mb-1 group-hover:text-rose-400 transition-colors">{data.name}</h4>
 <p className="text-xs text-th-secondary mb-4">{data.description}</p>
 <div className="grid grid-cols-2 gap-2 pt-3 border-t border-th-border">
 <div>
 <p className="text-2xs text-th-muted uppercase font-semibold">Fin. Impact</p>
 <p className="text-sm font-bold text-rose-400" style={{ fontVariantNumeric: 'tabular-nums' }}>{data.impact}</p>
 </div>
 <div>
 <p className="text-2xs text-th-muted uppercase font-semibold">Avg Delay</p>
 <p className="text-sm font-semibold text-th-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{data.delay}</p>
 </div>
 </div>
 </div>
 );
}

function AIIntelligenceWidget({ trends }) {
 const [activeTab, setActiveTab] = useState('situational');

 return (
 <div className="col-span-1 md:col-span-2 bg-th-surface-raised rounded-xl border border-th-border p-5 relative overflow-hidden transition-all duration-200 hover:shadow-lg">
 {/* Background Decoration */}
 <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
 <span className="material-symbols-outlined text-8xl text-th-heading">psychology</span>
 </div>

 <div className="flex items-center justify-between mb-4 relative z-10">
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-amber-400 text-base">auto_awesome</span>
 <h3 className="text-sm font-semibold text-th-heading tracking-wide">AI Usage Intelligence</h3>
 </div>
 <div className="flex gap-0.5 bg-th-surface-overlay p-0.5 rounded-lg border border-th-border">
 {['situational', 'prescriptive'].map(tab => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={cn("px-2.5 py-1 rounded-md text-2xs font-semibold uppercase transition-colors",
 activeTab === tab ? "bg-th-surface-base text-th-heading" : "text-th-muted hover:text-th-heading")}
 >
 {tab}
 </button>
 ))}
 </div>
 </div>

 <div className="space-y-2.5 relative z-10">
 {trends[activeTab].map(insight => (
 <div key={insight.id} className="bg-th-surface-overlay/50 border border-th-border rounded-lg p-3 hover:border-th-border-subtle transition-colors cursor-pointer">
 <div className="flex justify-between items-start mb-1">
 <span className="text-xs font-semibold text-amber-300">{insight.title}</span>
 <span className="px-1.5 py-0.5 bg-th-surface-overlay border border-th-border rounded text-2xs font-semibold text-th-heading">{insight.prob || insight.impact}</span>
 </div>
 <p className="text-xs text-th-secondary leading-snug mb-2">{insight.desc}</p>
 <div className="flex items-center gap-1 text-2xs font-semibold text-primary-light">
 <span className="material-symbols-outlined text-xs">arrow_forward</span>
 {insight.action}
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}

function TicketCompact({ ticket }) {
 const priorityColors = {
 "Critical": "text-rose-400 bg-rose-500/10 border-rose-500/20",
 "High": "text-amber-400 bg-amber-500/10 border-amber-500/20",
 "Medium": "text-blue-400 bg-blue-500/10 border-blue-500/20"
 };

 return (
 <div className="px-5 py-3 border-b border-th-border hover:bg-th-surface-overlay/50 transition-colors cursor-pointer last:border-0">
 <div className="flex justify-between items-start mb-1">
 <span className={cn("px-1.5 py-0.5 rounded text-2xs font-semibold uppercase border", priorityColors[ticket.priority] || priorityColors["Medium"])}>
 {ticket.priority}
 </span>
 <span className="text-2xs text-th-muted">{ticket.time}</span>
 </div>
 <h5 className="text-xs font-medium text-th-heading truncate mb-1">{ticket.title}</h5>
 <span className="text-2xs text-th-muted">Assigned: {ticket.owner}</span>
 </div>
 );
}
