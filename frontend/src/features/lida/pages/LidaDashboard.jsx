import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { AIInsightCard, DateRangePicker, FilterChipGroup, PrescriptiveAction } from '../../../components/ui';

const DATASET_ICONS = {
  denials: { icon: 'gpp_bad', color: 'rose' },
  payments: { icon: 'payments', color: 'emerald' },
  claims: { icon: 'description', color: 'blue' },
  ar: { icon: 'account_balance', color: 'amber' },
  reconciliation: { icon: 'balance', color: 'purple' },
};

const STATIC_FALLBACK_LIDA_INSIGHTS = [
  {
    title: 'Revenue Leakage: $1.2M Identified',
    description: 'LIDA detected systematic undercoding across 3 service lines. CPT code substitution pattern confirmed in 847 claims.',
    confidence: 95,
    impact: 'high',
    category: 'Diagnostic',
    action: 'Launch coding audit',
    value: '$1.2M recovery',
  },
  {
    title: 'Payer Mix Shift Detected',
    description: 'Commercial payer mix declining 2.4% MoM. Medicaid mix increasing. Net revenue impact: -$82K/month if trend continues.',
    confidence: 89,
    impact: 'high',
    category: 'Predictive',
    action: 'Review referral sources',
    value: '-$82K/month trend',
  },
  {
    title: 'LIDA Automation Opportunity',
    description: '42% of denial appeals are following the same template. Auto-appeal could free 14 FTE hours/week.',
    confidence: 83,
    impact: 'medium',
    category: 'Prescriptive',
    action: 'Enable auto-appeal workflow',
    value: '14 FTE hrs/week',
  },
];

export function LidaDashboard() {
  const navigate = useNavigate();

  // LIDA Health
  const [lidaHealth, setLidaHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // Datasets from LIDA
  const [datasets, setDatasets] = useState([]);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState('denials');

  // AI-Generated Goals from LIDA
  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(false);

  // Quick Stats from existing APIs
  const [denialsSummary, setDenialsSummary] = useState(null);
  const [paymentsSummary, setPaymentsSummary] = useState(null);
  const [arSummary, setArSummary] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Recent AI Insights
  const [lidaAiInsights, setLidaAiInsights] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Filters
  const [filterDateRange, setFilterDateRange] = useState('Last 30 Days');
  const [filterPayer, setFilterPayer] = useState('All');
  const [filterInsightType, setFilterInsightType] = useState('All');

  // Compute start_date and end_date from the filterDateRange label
  const computeDateRange = (label) => {
    const end = new Date();
    const start = new Date();
    switch (label) {
      case 'Last 7 Days':   start.setDate(end.getDate() - 7); break;
      case 'Last 14 Days':  start.setDate(end.getDate() - 14); break;
      case 'Last 30 Days':  start.setDate(end.getDate() - 30); break;
      case 'Last 60 Days':  start.setDate(end.getDate() - 60); break;
      case 'Last 90 Days':  start.setDate(end.getDate() - 90); break;
      case 'Last 6 Months': start.setMonth(end.getMonth() - 6); break;
      case 'Last 12 Months': start.setFullYear(end.getFullYear() - 1); break;
      case 'Year to Date':  start.setMonth(0, 1); break;
      default:              start.setDate(end.getDate() - 30); break;
    }
    return {
      start_date: start.toISOString().split('T')[0],
      end_date:   end.toISOString().split('T')[0],
    };
  };

  const dateRange = computeDateRange(filterDateRange);

  // ── Load LIDA health + datasets on mount ──
  useEffect(() => {
    api.lida.health().then(r => {
      setLidaHealth(r);
      setHealthLoading(false);
    }).catch(() => setHealthLoading(false));

    api.lida.datasets().then(r => {
      if (r?.datasets?.length) setDatasets(r.datasets);
      setDatasetsLoading(false);
    }).catch(() => setDatasetsLoading(false));
  }, []);

  // ── Load quick stats from existing APIs (re-fetch when date changes) ──
  useEffect(() => {
    setStatsLoading(true);
    Promise.all([
      api.denials.getSummary(dateRange.start_date, dateRange.end_date),
      api.payments.getSummary(dateRange.start_date, dateRange.end_date),
      api.ar.getSummary(dateRange.start_date, dateRange.end_date),
    ]).then(([d, p, a]) => {
      setDenialsSummary(d);
      setPaymentsSummary(p);
      setArSummary(a);
      setStatsLoading(false);
    }).catch(() => setStatsLoading(false));
  }, [dateRange.start_date, dateRange.end_date]);

  // ── Load AI insights (re-fetch when date changes) ──
  useEffect(() => {
    setAiLoading(true);
    api.ai.getInsights('lida', dateRange.start_date, dateRange.end_date).then(r => {
      if (r?.insights?.length) setLidaAiInsights(r.insights);
      else setLidaAiInsights([]);
      setAiLoading(false);
    }).catch(() => setAiLoading(false));
  }, [dateRange.start_date, dateRange.end_date]);

  // ── Load goals when selectedDataset or date range changes ──
  useEffect(() => {
    setGoalsLoading(true);
    api.lida.goals(selectedDataset, 5, dateRange.start_date, dateRange.end_date).then(r => {
      setGoals(r?.goals || []);
      setGoalsLoading(false);
    }).catch(() => {
      setGoals([]);
      setGoalsLoading(false);
    });
  }, [selectedDataset, dateRange.start_date, dateRange.end_date]);

  const fmt = (v) => {
    if (v == null) return '--';
    if (typeof v === 'number') {
      if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
      if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
      return `$${v.toFixed(0)}`;
    }
    return String(v);
  };

  const activeFilterChips = [
    ...(filterPayer !== 'All' ? [{ key: 'payer', label: 'Payer', value: filterPayer, color: 'blue' }] : []),
    ...(filterInsightType !== 'All' ? [{ key: 'type', label: 'Type', value: filterInsightType, color: 'purple' }] : []),
  ];

  const handleRemoveChip = (key) => {
    if (key === 'payer') setFilterPayer('All');
    if (key === 'type') setFilterInsightType('All');
  };

  const filteredInsights = lidaAiInsights.filter(ins => {
    if (filterInsightType !== 'All' && ins.category !== filterInsightType && ins.badge !== filterInsightType) return false;
    if (filterPayer !== 'All') {
      const text = `${ins.title || ''} ${ins.body || ins.description || ''}`.toLowerCase();
      if (!text.includes(filterPayer.toLowerCase())) return false;
    }
    return true;
  });

  return (
  <div className="flex-1 overflow-y-auto h-full p-8 text-th-heading custom-scrollbar">

  {/* ── LIDA HEALTH STATUS ── */}
  <div className="mb-6 flex items-center gap-4">
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
      healthLoading ? 'border-th-border bg-th-surface-raised' :
      lidaHealth?.ready ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'
    }`}>
      {healthLoading ? (
        <span className="material-symbols-outlined text-th-muted text-sm animate-spin">progress_activity</span>
      ) : lidaHealth?.ready ? (
        <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
      ) : (
        <span className="material-symbols-outlined text-amber-400 text-sm">warning</span>
      )}
      <div>
        <p className="text-xs font-bold text-th-heading">LIDA Engine</p>
        <p className="text-[10px] text-th-muted">
          {healthLoading ? 'Checking...' :
           lidaHealth?.ready ? 'Connected & Ready' :
           `LIDA: ${lidaHealth?.lida_installed ? 'OK' : 'N/A'} | Ollama: ${lidaHealth?.ollama_reachable ? 'OK' : 'Offline'}`}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-th-border bg-th-surface-raised">
      <span className="material-symbols-outlined text-primary text-sm">database</span>
      <span className="text-xs font-bold text-th-heading">{datasets.length} Datasets</span>
    </div>
  </div>

  {/* ── TOP FILTER BAR ── */}
  <div className="flex flex-wrap items-center gap-3 pb-5 mb-6 border-b border-th-border">
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
      <span className="material-symbols-outlined text-sm text-th-muted">psychology</span>
      <select
        value={filterInsightType}
        onChange={(e) => setFilterInsightType(e.target.value)}
        className="h-9 bg-th-surface-raised border border-th-border rounded-lg px-3 text-xs font-medium text-th-secondary hover:text-th-heading outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
      >
        {['All', 'Predictive', 'Prescriptive', 'Diagnostic', 'Descriptive'].map((t) => (
          <option key={t} value={t}>{t === 'All' ? 'All Insight Types' : t}</option>
        ))}
      </select>
    </div>
    {activeFilterChips.length > 0 && (
      <>
        <div className="h-4 w-px bg-th-border" />
        <FilterChipGroup
          filters={activeFilterChips}
          onRemove={handleRemoveChip}
          onClearAll={() => { setFilterPayer('All'); setFilterInsightType('All'); }}
        />
      </>
    )}
  </div>

  {/* ── DATASET EXPLORER ── */}
  <div className="mb-8">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-base">storage</span>
        <span className="text-th-secondary text-xs font-semibold uppercase tracking-wider">Dataset Explorer</span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          LIDA
        </span>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {datasetsLoading ? (
        [1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-th-surface-raised border border-th-border rounded-xl p-4 animate-pulse">
            <div className="h-4 w-1/2 bg-th-surface-overlay rounded mb-3" />
            <div className="h-3 w-full bg-th-surface-overlay rounded" />
          </div>
        ))
      ) : (
        datasets.map((ds) => {
          const meta = DATASET_ICONS[ds.name] || { icon: 'table_chart', color: 'blue' };
          const isActive = selectedDataset === ds.name;
          return (
            <button
              key={ds.name}
              onClick={() => setSelectedDataset(ds.name)}
              className={`text-left bg-th-surface-raised border rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                isActive ? `border-${meta.color}-500 ring-1 ring-${meta.color}-500/50` : 'border-th-border hover:border-th-border-strong'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined text-${meta.color}-400 text-lg`}>{meta.icon}</span>
                <span className="text-sm font-bold text-th-heading capitalize">{ds.name}</span>
              </div>
              <p className="text-[11px] text-th-secondary leading-snug line-clamp-2">{ds.description}</p>
              {isActive && (
                <div className="mt-2 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-bold">Selected</span>
                </div>
              )}
            </button>
          );
        })
      )}
    </div>
  </div>

  {/* ── AI-GENERATED GOALS ── */}
  <div className="mb-8">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-purple-400 text-base">target</span>
        <span className="text-th-secondary text-xs font-semibold uppercase tracking-wider">AI-Generated Goals</span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          {selectedDataset}
        </span>
      </div>
      <button
        onClick={() => {
          setGoalsLoading(true);
          api.lida.goals(selectedDataset, 5, dateRange.start_date, dateRange.end_date).then(r => {
            setGoals(r?.goals || []);
            setGoalsLoading(false);
          }).catch(() => setGoalsLoading(false));
        }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-th-surface-overlay border border-th-border text-xs text-th-heading hover:bg-th-surface-overlay/80 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">refresh</span> Regenerate
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {goalsLoading ? (
        [1, 2, 3].map(i => (
          <div key={i} className="bg-th-surface-raised border border-th-border rounded-xl p-4 space-y-3 animate-pulse">
            <div className="h-4 w-3/4 bg-th-surface-overlay rounded" />
            <div className="h-3 w-full bg-th-surface-overlay rounded" />
            <div className="h-3 w-1/2 bg-th-surface-overlay rounded" />
          </div>
        ))
      ) : goals.length === 0 ? (
        <div className="col-span-full">
          <p className="text-xs text-th-muted mb-3">LIDA goals unavailable. Try these common questions:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {[
              { icon: 'gpp_bad', q: 'What are the top denial reasons by volume and revenue impact?', label: 'Top Denial Reasons' },
              { icon: 'business', q: 'Show me denial and payment trends by payer over the last 6 months', label: 'Payer Trends' },
              { icon: 'troubleshoot', q: 'What are the root causes driving the highest denial rates?', label: 'Root Cause Analysis' },
              { icon: 'schedule', q: 'How is our AR aging distributed and which buckets are growing?', label: 'AR Aging Breakdown' },
              { icon: 'emoji_events', q: 'What is our appeal win rate by denial category and payer?', label: 'Appeal Win Rates' },
              { icon: 'trending_down', q: 'Which payers have the longest payment delays and underpayment rates?', label: 'Payment Delays' },
            ].map((g) => (
              <button
                key={g.label}
                onClick={() => navigate(`/intelligence/lida/chat?q=${encodeURIComponent(g.q)}&start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`)}
                className="text-left bg-th-surface-raised border border-th-border rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg hover:border-purple-500/50 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-purple-400 text-base">{g.icon}</span>
                  <span className="text-xs font-bold text-th-heading group-hover:text-purple-400 transition-colors">{g.label}</span>
                </div>
                <p className="text-[11px] text-th-secondary leading-snug ml-6">{g.q}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        goals.map((goal, idx) => (
          <button
            key={idx}
            onClick={() => navigate(`/intelligence/lida/chat?q=${encodeURIComponent(goal.question)}&start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`)}
            className="text-left bg-th-surface-raised border border-th-border rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg hover:border-purple-500/50 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="material-symbols-outlined text-purple-400 text-base mt-0.5">lightbulb</span>
              <p className="text-sm font-bold text-th-heading leading-snug group-hover:text-purple-400 transition-colors">{goal.question}</p>
            </div>
            {goal.rationale && (
              <p className="text-[11px] text-th-secondary leading-relaxed mb-2 ml-6">{goal.rationale}</p>
            )}
            <div className="flex items-center justify-between ml-6">
              {goal.visualization && (
                <p className="text-[10px] text-primary font-medium">Chart: {goal.visualization}</p>
              )}
              <span className="text-[10px] text-purple-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">chat</span>
                Ask LIDA
              </span>
            </div>
          </button>
        ))
      )}
    </div>
  </div>

  {/* ── QUICK STATS FROM EXISTING APIS ── */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <div className="bg-th-surface-raised p-5 rounded-xl border border-th-border border-l-[3px] border-l-rose-500 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <span className="material-symbols-outlined text-6xl">gpp_bad</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Total Denials</p>
      <h3 className="text-3xl font-black text-rose-400 tabular-nums">
        {statsLoading ? '...' : denialsSummary?.total_denials?.toLocaleString() ?? '--'}
      </h3>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-rose-400 font-bold tabular-nums">
          {!statsLoading && denialsSummary?.denied_revenue_at_risk ? fmt(denialsSummary.denied_revenue_at_risk) + ' at risk' : ''}
        </p>
        <span className="ai-diagnostic">Diagnostic AI</span>
      </div>
    </div>
    <div className="bg-th-surface-raised p-5 rounded-xl border border-th-border border-l-[3px] border-l-emerald-500 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <span className="material-symbols-outlined text-6xl">payments</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Total Payments</p>
      <h3 className="text-3xl font-black text-emerald-400 tabular-nums">
        {statsLoading ? '...' : fmt(paymentsSummary?.total_collected ?? paymentsSummary?.total_payments)}
      </h3>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-emerald-400 font-bold tabular-nums">
          {!statsLoading && paymentsSummary?.era_count ? `${paymentsSummary.era_count.toLocaleString()} ERAs` : ''}
        </p>
        <span className="ai-descriptive">Descriptive AI</span>
      </div>
    </div>
    <div className="bg-th-surface-raised p-5 rounded-xl border border-th-border border-l-[3px] border-l-blue-500 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <span className="material-symbols-outlined text-6xl">account_balance</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Total A/R</p>
      <h3 className="text-3xl font-black text-blue-400 tabular-nums">
        {statsLoading ? '...' : fmt(arSummary?.total_ar ?? arSummary?.total_outstanding)}
      </h3>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-blue-400 font-bold tabular-nums">
          {!statsLoading && arSummary?.avg_days_in_ar ? `${arSummary.avg_days_in_ar} days avg` : ''}
        </p>
        <span className="ai-predictive">Predictive AI</span>
      </div>
    </div>
    <div className="bg-th-surface-raised p-5 rounded-xl border border-th-border border-l-[3px] border-l-purple-500 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <span className="material-symbols-outlined text-6xl">auto_awesome</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">LIDA Status</p>
      <h3 className="text-3xl font-black text-th-heading tabular-nums">
        {healthLoading ? '...' : lidaHealth?.ready ? 'Online' : 'Offline'}
      </h3>
      <div className="flex items-center justify-between mt-2">
        <p className={`text-xs font-bold ${lidaHealth?.ready ? 'text-emerald-400' : 'text-amber-400'}`}>
          {lidaHealth?.ready ? 'All systems operational' : 'Check Ollama'}
        </p>
        <span className="ai-prescriptive">Prescriptive AI</span>
      </div>
    </div>
  </div>

  {/* ── AI INSIGHTS PANEL ── */}
  <div className="mb-8">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-amber-400 text-base">auto_awesome</span>
        <span className="text-th-secondary text-xs font-semibold uppercase tracking-wider">Recent AI Insights</span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          LIDA AI
        </span>
      </div>
      <span className="text-th-muted text-[10px] font-medium">Powered by LIDA + Ollama</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {aiLoading ? (
        [1, 2, 3].map(i => (
          <div key={i} className="bg-th-surface-raised border border-th-border rounded-xl p-5 space-y-3 animate-pulse">
            <div className="h-4 w-3/4 bg-th-surface-overlay rounded" />
            <div className="h-3 w-full bg-th-surface-overlay rounded" />
            <div className="h-3 w-1/2 bg-th-surface-overlay rounded" />
          </div>
        ))
      ) : (
        filteredInsights.map((insight) => (
          <AIInsightCard key={insight.title} {...insight} />
        ))
      )}
    </div>
  </div>

  </div>
  );
}
