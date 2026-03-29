import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { usePreBatch } from '../context/PreBatchContext';
import { BatchReadinessMeter } from '../components/BatchReadinessMeter';
import { ValidationStatusBadge } from '../components/ValidationStatusBadge';
import {
  AIInsightCard,
  DateRangePicker,
  FilterChipGroup,
} from '../../../components/ui';

const STATIC_FALLBACK_SCRUB_INSIGHTS = [
  {
    title: 'Auto-Fix Success Rate Improving',
    description: 'AI auto-fix accuracy reached 96.8% this week — up from 94.1% last month. Model retrained on 2,840 new approved corrections.',
    confidence: 97,
    impact: 'high',
    category: 'Descriptive',
    action: 'Expand auto-fix ruleset',
    value: '96.8% accuracy',
    icon: 'trending_up',
  },
  {
    title: 'New Payer Rule Detected',
    description: 'BCBS Illinois updated modifier requirements for telehealth codes. 142 pending claims affected. Rule auto-applied to new claims.',
    confidence: 89,
    impact: 'medium',
    category: 'Diagnostic',
    action: 'Review affected claims',
    value: '142 claims affected',
    icon: 'policy',
  },
  {
    title: 'Projected Weekly Savings',
    description: 'At current auto-fix rate, AI scrubbing will save 68 FTE hours and prevent $2.1M in denials this week.',
    confidence: 85,
    impact: 'high',
    category: 'Predictive',
    action: 'Review projection report',
    value: '$2.1M denial prevention',
    icon: 'savings',
  },
];

export function ScrubDashboard() {
  const { metrics } = usePreBatch();

  const [scrubAiInsights, setScrubAiInsights] = useState(STATIC_FALLBACK_SCRUB_INSIGHTS);
  const [aiLoading, setAiLoading] = useState(false);
  const [dateRange, setDateRange] = useState('This Month');

  /* Audit-driven: denial pattern diagnostics */
  const [denialDiagnostics, setDenialDiagnostics] = useState(null);

  useEffect(() => {
    setAiLoading(true);
    api.ai.getInsights('crs').then(r => {
      if (r?.insights?.length) setScrubAiInsights(r.insights);
      setAiLoading(false);
    }).catch(() => setAiLoading(false));

    api.diagnostics.getFindings({ category: 'DENIAL_PATTERN' }).catch(() => null).then(r => r && setDenialDiagnostics(r));
  }, []);
  const [payer, setPayer] = useState('all');
  const [claimType, setClaimType] = useState('all');

  const activeFilters = [
    payer !== 'all' && { key: 'payer', label: 'Payer', value: payer, color: 'blue' },
    claimType !== 'all' && { key: 'claimType', label: 'Claim Type', value: claimType, color: 'emerald' },
  ].filter(Boolean);

  const handleRemoveFilter = (key) => {
    if (key === 'payer') setPayer('all');
    if (key === 'claimType') setClaimType('all');
  };

  const handleClearAll = () => {
    setPayer('all');
    setClaimType('all');
  };

  const selectClass =
    'h-9 px-3 rounded-lg bg-th-surface-raised border border-th-border text-th-secondary text-sm font-medium ' +
    'hover:bg-th-surface-overlay hover:text-th-heading focus:outline-none focus:ring-1 focus:ring-blue-500 ' +
    'transition-all duration-200 cursor-pointer';

  return (
    <div className="p-6 h-full overflow-y-auto animate-in fade-in duration-300">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* ── Filter Bar ── */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <DateRangePicker
              value={dateRange}
              onChange={(preset) => setDateRange(preset.label)}
            />

            <select value={payer} onChange={(e) => setPayer(e.target.value)} className={selectClass}>
              <option value="all">All Payers</option>
              <option value="Medicare">Medicare</option>
              <option value="Medicaid">Medicaid</option>
              <option value="BCBS">BCBS</option>
              <option value="Aetna">Aetna</option>
              <option value="United">United</option>
              <option value="Cigna">Cigna</option>
            </select>

            <select value={claimType} onChange={(e) => setClaimType(e.target.value)} className={selectClass}>
              <option value="all">All Claim Types</option>
              <option value="Professional">Professional</option>
              <option value="Institutional">Institutional</option>
              <option value="Dental">Dental</option>
            </select>
          </div>

          {activeFilters.length > 0 && (
            <FilterChipGroup
              filters={activeFilters}
              onRemove={handleRemoveFilter}
              onClearAll={handleClearAll}
            />
          )}
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Readiness Card */}
          <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 rounded-xl p-6 md:col-span-2 flex flex-col justify-center hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <BatchReadinessMeter percentage={metrics.batchReadiness} />
            <div className="mt-4 flex gap-8">
              <div>
                <div className="text-sm text-th-secondary">Total Claims</div>
                <div className="text-2xl font-black text-th-heading tabular-nums">{metrics.totalClaims}</div>
              </div>
              <div>
                <div className="text-sm text-th-secondary">Est. Revenue</div>
                <div className="text-2xl font-black text-emerald-400 tabular-nums">${(metrics.totalClaims * 450).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Pass Rate */}
          <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-emerald-500 rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-emerald-500">check_circle</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">First Pass Rate</span>
            </div>
            <div className="text-4xl font-black text-th-heading mb-1 tabular-nums">{metrics.passRate}%</div>
            <div className="text-xs text-emerald-500 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              {metrics.passRate ? `${metrics.passRate}% pass rate` : '--'}
            </div>
          </div>

          {/* Auto-Fix Impact */}
          <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-purple-500 rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-blue-500">auto_fix_high</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Auto-Fixed</span>
              <span className="ai-prescriptive">Prescriptive AI</span>
            </div>
            <div className="text-4xl font-black text-th-heading mb-1 tabular-nums">{metrics.autoFixRate}%</div>
            <div className="text-xs text-blue-400 font-bold tabular-nums">
              {Math.floor(metrics.totalClaims * (metrics.autoFixRate / 100))} claims corrected
            </div>
          </div>
        </div>

        {/* Breakdown Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Status Breakdown */}
          <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-th-heading mb-6">Validation Status Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-emerald-900/10 border border-emerald-900/30 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                <ValidationStatusBadge status="Passed" />
                <div className="mt-2 text-2xl font-black text-th-heading tabular-nums">{metrics.statusBreakdown.passed}</div>
                <div className="text-xs text-th-secondary">Clean Claims</div>
              </div>
              <div className="p-4 rounded-lg bg-blue-900/10 border border-blue-900/30 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                <ValidationStatusBadge status="Auto-Fixed" />
                <div className="mt-2 text-2xl font-black text-th-heading tabular-nums">{metrics.statusBreakdown.autoFixed}</div>
                <div className="text-xs text-th-secondary">AI Corrected</div>
              </div>
              <div className="p-4 rounded-lg bg-amber-900/10 border border-amber-900/30 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                <ValidationStatusBadge status="Review Required" />
                <div className="mt-2 text-2xl font-black text-th-heading tabular-nums">{metrics.statusBreakdown.reviewRequired}</div>
                <div className="text-xs text-th-secondary">Manual Attention</div>
              </div>
              <div className="p-4 rounded-lg bg-red-900/10 border border-red-900/30 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                <ValidationStatusBadge status="Blocked" />
                <div className="mt-2 text-2xl font-black text-th-heading tabular-nums">{metrics.statusBreakdown.blocked}</div>
                <div className="text-xs text-th-secondary">Fatal Errors</div>
              </div>
            </div>
          </div>

          {/* Error Categories */}
          <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-th-heading mb-6">Top Error Categories</h3>
            <div className="space-y-4">
              {metrics.errorCategories.map(cat => (
                <div key={cat.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-th-heading">{cat.label}</span>
                    <span className="font-bold text-th-heading tabular-nums">{cat.count}</span>
                  </div>
                  <div className="h-2 bg-th-surface-overlay rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.color} rounded-full`}
                      style={{ width: `${(cat.count / 30) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROI Banner */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-6 text-th-heading shadow-lg flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">Prevented Denial Revenue</h3>
            <p className="text-violet-100 text-sm">Potential lost revenue caught by pre-batch Scrub this week.</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black tabular-nums">${metrics.denialsPreventedValue.toLocaleString()}</div>
          </div>
        </div>

        {/* ── Diagnostic Findings: Denial Patterns ── */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 shrink-0">
            <span className="material-symbols-outlined">biotech</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-bold text-th-heading">Coding/Scrubbing Diagnostics</span>
              <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">DENIAL_PATTERN</span>
            </div>
            <p className="text-xs text-th-secondary">
              <span className="font-bold text-th-heading tabular-nums">{denialDiagnostics?.findings?.length ?? 0}</span> diagnostic findings relate to coding/scrubbing issues
              {denialDiagnostics?.findings?.[0] && (
                <span className="text-th-muted"> &mdash; {denialDiagnostics.findings[0].title || denialDiagnostics.findings[0].description}</span>
              )}
            </p>
          </div>
        </div>

        {/* ── AI Insights ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-icons text-primary text-base">auto_awesome</span>
            <span className="text-th-secondary text-xs font-semibold uppercase tracking-wider">AI Intelligence</span>
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
              scrubAiInsights.map((insight, i) => (
                <AIInsightCard key={i} {...insight} onClick={() => {}} />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
