import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { AIInsightCard } from '../../../components/ui';

// ── Currency / number helpers ────────────────────────────────────────────────
function fmt$(n) {
  if (n == null) return '$0';
  const a = Math.abs(n);
  if (a >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}
function fmtNum(n) {
  return (n ?? 0).toLocaleString();
}

// ── Category → root-cause mapping for navigation ────────────────────────────
const CATEGORY_TO_CAUSE = {
  CODING: 'coding_mismatch',
  ELIGIBILITY: 'eligibility_gap',
  AUTH: 'missing_auth',
  TIMELY_FILING: 'timely_filing',
  NON_COVERED: 'non_covered',
  COB: 'cob_issue',
};

// ── Group color helpers for root causes ─────────────────────────────────────
const GROUP_COLORS = {
  PROCESS: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', bar: 'bg-blue-500' },
  PREVENTABLE: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', bar: 'bg-amber-500' },
  PAYER: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', bar: 'bg-red-500' },
};

// ── Category bar colors ─────────────────────────────────────────────────────
const CATEGORY_COLORS = [
  'bg-primary', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-emerald-500',
];

// ── Skeleton Pulse ──────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-th-border rounded ${className}`} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function DenialAnalytics() {
  const navigate = useNavigate();

  // ── All state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [denialSummary, setDenialSummary] = useState(null);
  const [rootCauseSummary, setRootCauseSummary] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [winRates, setWinRates] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [trendData, setTrendData] = useState(null);
  const [diagnosticFindings, setDiagnosticFindings] = useState([]);

  // ── Parallel data fetch ────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.denials.getSummary(),
      api.rootCause.getSummary(),
      api.analytics.getDenialMatrix(),
      api.analytics.getAppealWinRates(),
      api.ai.getInsights('denials'),
      api.rootCause.getTrending(),
      api.diagnostics.getFindings({ category: 'DENIAL_PATTERN' }).catch(() => null),
    ]).then(([denials, rootCause, heatmap, winRateRes, aiRes, trending, diagRes]) => {
      if (denials) setDenialSummary(denials);
      if (rootCause) setRootCauseSummary(rootCause);
      if (heatmap) setHeatmapData(heatmap);
      if (winRateRes?.appeal_win_rates) setWinRates(winRateRes.appeal_win_rates);
      if (aiRes?.insights?.length) setAiInsights(aiRes.insights);
      if (trending) setTrendData(trending);
      if (diagRes?.findings?.length) setDiagnosticFindings(diagRes.findings);
      else if (Array.isArray(diagRes)) setDiagnosticFindings(diagRes);
    }).catch(err => console.error('DenialAnalytics load error:', err))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────
  const totalDenials = denialSummary?.total_denials ?? 0;
  const totalAtRisk = denialSummary?.total_at_risk ?? denialSummary?.denied_revenue_at_risk ?? 0;
  const denialRate = denialSummary?.denial_rate ?? 0;
  const topCategories = denialSummary?.top_categories ?? [];

  const rootCauses = rootCauseSummary?.by_root_cause ?? [];
  const preventablePct = rootCauseSummary?.preventable_pct ?? 0;
  const preventableAmount = totalAtRisk * (preventablePct / 100);

  // Build CARC table from top_categories (top 10 items with code info)
  const carcCodes = topCategories.slice(0, 10);

  // Trend data for monthly chart
  const trendWeeks = trendData?.weeks ?? trendData?.trend ?? [];

  // ── Full-page loading skeleton ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto font-sans h-full">
        <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto font-sans h-full">
      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1 — AI Executive Summary
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-r from-purple-900/30 via-th-surface-raised to-th-surface-raised border border-purple-500/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-purple-400 text-lg">auto_awesome</span>
            <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">AI Executive Summary</span>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-2">
              Live · Ollama
            </span>
          </div>
          {aiInsights.length > 0 && aiInsights[0]?.body ? (
            <p className="text-th-secondary text-sm leading-relaxed">
              {aiInsights[0].body}
            </p>
          ) : (
            <p className="text-th-secondary text-sm leading-relaxed">
              Your organization has <strong className="text-th-heading">{fmtNum(totalDenials)} denied claims</strong> totaling{' '}
              <strong className="text-th-heading">{fmt$(totalAtRisk)}</strong> in revenue at risk.{' '}
              <strong className="text-amber-400">{preventablePct.toFixed(1)}%</strong> ({fmt$(preventableAmount)}) of these are{' '}
              <strong className="text-amber-400">preventable</strong>.
              {topCategories.length > 0 && (
                <> The top driver is <strong className="text-th-heading">{topCategories[0].category || topCategories[0].name}</strong>{' '}
                  accounting for {fmt$(topCategories[0].amount || topCategories[0].impact || 0)}.</>
              )}
            </p>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2 — KPI Cards
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total Denials"
            value={fmtNum(totalDenials)}
            icon="cancel"
            color="text-rose-400"
            accent="border-l-rose-500"
            onClick={() => navigate('/analytics/denials/root-cause/claims')}
          />
          <KPICard
            label="Revenue at Risk"
            value={fmt$(totalAtRisk)}
            icon="attach_money"
            color="text-primary"
            accent="border-l-primary"
            onClick={() => navigate('/analytics/denials/root-cause/claims')}
          />
          <KPICard
            label="Preventable"
            value={`${preventablePct.toFixed(1)}%`}
            sub={fmt$(preventableAmount)}
            icon="shield"
            color="text-amber-400"
            accent="border-l-amber-500"
            onClick={() => navigate('/analytics/denials/root-cause/claims?group=PREVENTABLE')}
          />
          <KPICard
            label="Denial Rate"
            value={`${(typeof denialRate === 'number' ? denialRate : parseFloat(denialRate) || 0).toFixed(1)}%`}
            icon="percent"
            color="text-blue-400"
            accent="border-l-blue-500"
            onClick={() => navigate('/analytics/denials')}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            DIAGNOSTIC FINDINGS (from diagnostics API)
        ═══════════════════════════════════════════════════════════════════ */}
        {diagnosticFindings.length > 0 && (
          <div className="bg-gradient-to-r from-rose-900/20 via-th-surface-raised to-th-surface-raised border border-rose-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-rose-400 text-lg">diagnosis</span>
              <span className="text-sm font-bold text-rose-300 uppercase tracking-wider">Diagnostic Findings</span>
              <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1">
                {diagnosticFindings.filter(f => (f.severity || '').toUpperCase() === 'CRITICAL').length} CRITICAL
              </span>
              <span className="text-xs text-th-muted ml-auto">{diagnosticFindings.length} findings detected</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {diagnosticFindings.slice(0, 6).map((f, i) => {
                const sev = (f.severity || 'INFO').toUpperCase();
                const sevColor = sev === 'CRITICAL' ? 'rose' : sev === 'WARNING' ? 'amber' : 'blue';
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg border border-${sevColor}-500/20 bg-${sevColor}-500/5 cursor-pointer hover:bg-${sevColor}-500/10 transition-colors`}
                    onClick={() => navigate(`/analytics/denials/root-cause/claims${f.claim_id ? `?claim=${f.claim_id}` : ''}`)}
                  >
                    <span className={`material-symbols-outlined text-${sevColor}-400 text-base mt-0.5 shrink-0`}>
                      {sev === 'CRITICAL' ? 'error' : sev === 'WARNING' ? 'warning' : 'info'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-th-heading truncate">{f.title || f.finding || f.description || 'Finding'}</p>
                      <p className="text-[10px] text-th-muted truncate mt-0.5">{f.description || f.detail || f.category || ''}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-${sevColor}-500/10 text-${sevColor}-400 shrink-0`}>
                      {sev}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 3 — Denial Category Breakdown (horizontal bars)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold text-th-heading">Denial Category Breakdown</h3>
              <p className="text-xs text-th-muted mt-0.5">All categories ranked by dollar impact — click any bar to investigate</p>
            </div>
            <span className="text-xs text-th-muted tabular-nums">{topCategories.length} categories</span>
          </div>
          <div className="space-y-3">
            {topCategories.length === 0 && <p className="text-sm text-th-muted">No category data available.</p>}
            {topCategories.map((cat, i) => {
              const name = cat.category || cat.name || 'Unknown';
              const count = cat.count ?? cat.total ?? 0;
              const amount = cat.amount ?? cat.impact ?? 0;
              const pct = cat.percentage ?? cat.pct ?? (totalAtRisk > 0 ? ((amount / totalAtRisk) * 100) : 0);
              const maxAmount = topCategories[0]?.amount ?? topCategories[0]?.impact ?? 1;
              const causeKey = CATEGORY_TO_CAUSE[name.toUpperCase()] || name.toLowerCase().replace(/\s+/g, '_');
              return (
                <div
                  key={i}
                  className="group flex items-center gap-4 p-3 rounded-lg hover:bg-th-surface-overlay/40 cursor-pointer transition-all duration-150"
                  onClick={() => navigate(`/analytics/denials/root-cause/claims?cause=${causeKey}`)}
                >
                  <div className="w-36 shrink-0">
                    <p className="text-sm font-bold text-th-heading truncate">{name}</p>
                    <p className="text-[11px] text-th-muted tabular-nums">{fmtNum(count)} claims</p>
                  </div>
                  <div className="flex-1 h-4 bg-th-surface-overlay rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
                      style={{ width: `${Math.max((amount / maxAmount) * 100, 2)}%` }}
                    />
                  </div>
                  <div className="w-20 text-right font-mono text-sm font-bold text-primary tabular-nums">{fmt$(amount)}</div>
                  <div className="w-14 text-right font-mono text-xs text-th-muted tabular-nums">{pct.toFixed(1)}%</div>
                  <span className="material-symbols-outlined text-th-muted text-sm opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 4 — Root Cause Intelligence
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
            <div>
              <h3 className="text-lg font-bold text-th-heading">Root Cause Intelligence</h3>
              <p className="text-xs text-th-muted mt-0.5">7 root causes grouped by origin — powered by root cause engine</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30">
                <span className="material-symbols-outlined text-amber-400 text-sm">warning</span>
                <span className="text-sm font-bold text-amber-400 tabular-nums">{preventablePct.toFixed(1)}% PREVENTABLE</span>
                <span className="text-xs text-amber-300/70 tabular-nums ml-1">({fmt$(preventableAmount)})</span>
              </span>
            </div>
          </div>
          {rootCauses.length === 0 && <p className="text-sm text-th-muted">No root cause data available.</p>}

          {/* Group labels */}
          <div className="flex flex-wrap gap-3 mb-4">
            {['PROCESS', 'PREVENTABLE', 'PAYER'].map(g => (
              <span key={g} className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${GROUP_COLORS[g]?.bg || 'bg-th-surface-overlay'} ${GROUP_COLORS[g]?.text || 'text-th-muted'} ${GROUP_COLORS[g]?.border || 'border-th-border'}`}>
                {g}
              </span>
            ))}
          </div>

          <div className="space-y-2">
            {rootCauses.map((rc, i) => {
              const group = (rc.group || 'PROCESS').toUpperCase();
              const gc = GROUP_COLORS[group] || GROUP_COLORS.PROCESS;
              const maxImpact = rootCauses[0]?.impact ?? 1;
              const pctOfTotal = totalAtRisk > 0 ? ((rc.impact / totalAtRisk) * 100).toFixed(1) : '0.0';
              return (
                <div
                  key={i}
                  className="group flex items-center gap-4 p-3 rounded-lg hover:bg-th-surface-overlay/40 cursor-pointer transition-all duration-150"
                  onClick={() => navigate(`/analytics/denials/root-cause/claims?cause=${encodeURIComponent(rc.root_cause || rc.category || '')}`)}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 w-24 text-center ${gc.bg} ${gc.text} ${gc.border}`}>
                    {group}
                  </span>
                  <div className="w-48 shrink-0">
                    <p className="text-sm font-bold text-th-heading truncate">{rc.root_cause || rc.category}</p>
                    <p className="text-[11px] text-th-muted tabular-nums">{fmtNum(rc.count)} claims · {pctOfTotal}%</p>
                  </div>
                  <div className="flex-1 h-3 bg-th-surface-overlay rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${gc.bar}`} style={{ width: `${Math.max((rc.impact / maxImpact) * 100, 2)}%` }} />
                  </div>
                  <div className="w-20 text-right font-mono text-sm font-bold text-th-heading tabular-nums">{fmt$(rc.impact)}</div>
                  <span className="material-symbols-outlined text-th-muted text-sm opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 5 — Top CARC Codes (table)
        ═══════════════════════════════════════════════════════════════════ */}
        {carcCodes.length > 0 && (
          <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-rose-400 text-base">receipt_long</span>
              <h3 className="text-lg font-bold text-th-heading">Top CARC Codes</h3>
              <span className="text-xs text-th-muted ml-2">Top {carcCodes.length} by revenue impact</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wider text-th-muted border-b border-th-border">
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Code</th>
                    <th className="py-3 px-3">Description / Category</th>
                    <th className="py-3 px-3 text-right">Count</th>
                    <th className="py-3 px-3 text-right">$ Impact</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {carcCodes.map((code, idx) => {
                    const name = code.category || code.name || code.carc_code || '';
                    const desc = code.description || code.desc || name;
                    const carcCode = code.carc_code || code.code || '';
                    return (
                      <tr
                        key={idx}
                        className="border-b border-th-border/30 hover:bg-th-surface-overlay/40 cursor-pointer transition-colors"
                        onClick={() => navigate(`/analytics/denials/root-cause/claims?code=${encodeURIComponent(carcCode || name)}`)}
                      >
                        <td className="py-3 px-3 text-th-muted tabular-nums">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-rose-900/30 text-rose-400">
                            {carcCode || name}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-th-secondary max-w-xs truncate">{desc}</td>
                        <td className="py-3 px-3 text-right font-bold text-th-heading tabular-nums">{fmtNum(code.count ?? code.total ?? 0)}</td>
                        <td className="py-3 px-3 text-right font-bold text-primary tabular-nums">{fmt$(code.amount ?? code.impact ?? 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 6 — Payer × Category Heatmap
        ═══════════════════════════════════════════════════════════════════ */}
        {heatmapData && (
          <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-purple-400 text-base">grid_on</span>
              <h3 className="text-lg font-bold text-th-heading">Payer × Category Heatmap</h3>
              <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Live · {heatmapData.matrix?.length || 0} Payers
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-2 text-th-muted font-semibold uppercase tracking-wider w-36">Payer</th>
                    {heatmapData.categories?.map(cat => (
                      <th key={cat} className="text-center py-2 px-1 text-th-muted font-semibold uppercase tracking-wider">{cat.substring(0, 8)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.matrix?.map((row, ri) => (
                    <tr key={ri} className="border-t border-th-border/30">
                      <td className="py-2 px-2 font-semibold text-th-secondary truncate max-w-[140px]">{row.payer?.split(' ').slice(0, 2).join(' ')}</td>
                      {row.cells?.map((cell, ci) => {
                        const intensity = heatmapData.max_count > 0 ? cell.count / heatmapData.max_count : 0;
                        const bg = intensity > 0.75 ? 'bg-rose-500/80 text-white' :
                                   intensity > 0.5  ? 'bg-rose-500/50 text-rose-100' :
                                   intensity > 0.25 ? 'bg-amber-500/40 text-amber-100' :
                                   intensity > 0.05 ? 'bg-amber-500/20 text-amber-300' :
                                                      'bg-th-surface-overlay text-th-muted';
                        const category = heatmapData.categories?.[ci] || '';
                        return (
                          <td key={ci} className="py-2 px-1 text-center">
                            <span
                              className={`inline-block min-w-[40px] py-0.5 px-1 rounded text-[10px] font-bold tabular-nums cursor-pointer hover:ring-1 hover:ring-white/30 transition-all ${bg}`}
                              onClick={() => navigate(`/analytics/denials/root-cause/claims?payer=${encodeURIComponent(row.payer || '')}&category=${encodeURIComponent(category)}`)}
                            >
                              {cell.count > 0 ? cell.count.toLocaleString() : '\u2014'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-th-muted mt-3">Color intensity = denial volume · Click any cell to view filtered claims</p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 7 — Appeal Win Rate
        ═══════════════════════════════════════════════════════════════════ */}
        {winRates.length > 0 && (
          <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-emerald-400 text-base">emoji_events</span>
              <h3 className="text-lg font-bold text-th-heading">Appeal Win Rate by Denial Reason</h3>
            </div>
            <div className="space-y-3">
              {winRates.map((r, i) => {
                const rate = r.win_rate ?? 0;
                const barColor = rate > 60 ? 'bg-emerald-400' : rate > 35 ? 'bg-amber-400' : 'bg-rose-400';
                const labelColor = rate > 60 ? 'text-emerald-400' : rate > 35 ? 'text-amber-400' : 'text-rose-400';
                const estRecoverable = (r.total_denied_amount ?? 0) * (rate / 100);
                return (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-xs text-th-secondary w-32 truncate font-medium" title={r.denial_reason}>{r.denial_reason}</span>
                    <div className="flex-1 bg-th-surface-overlay rounded-full h-3 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${rate}%` }} />
                    </div>
                    <span className={`text-sm font-bold tabular-nums w-12 text-right ${labelColor}`}>{rate}%</span>
                    <span className="text-[11px] text-th-muted w-20 text-right tabular-nums">{fmtNum(r.total_denials ?? 0)} denied</span>
                    {estRecoverable > 0 && (
                      <span className="text-[11px] text-emerald-400 w-16 text-right tabular-nums">{fmt$(estRecoverable)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 8 — Monthly Trend (simple bar chart)
        ═══════════════════════════════════════════════════════════════════ */}
        {trendWeeks.length > 0 && (
          <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-blue-400 text-base">show_chart</span>
              <h3 className="text-lg font-bold text-th-heading">Denial Trend</h3>
              <span className="text-xs text-th-muted ml-2">Last {trendWeeks.length} periods</span>
            </div>
            <div className="flex items-end gap-1.5 h-40">
              {(() => {
                const maxVal = Math.max(...trendWeeks.map(w => w.count ?? w.total ?? 0), 1);
                return trendWeeks.map((week, i) => {
                  const val = week.count ?? week.total ?? 0;
                  const height = Math.max((val / maxVal) * 100, 3);
                  const label = week.week ?? week.month ?? week.period ?? `W${i + 1}`;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-th-muted tabular-nums">{fmtNum(val)}</span>
                      <div
                        className="w-full bg-primary/80 rounded-t hover:bg-primary transition-colors cursor-default"
                        style={{ height: `${height}%` }}
                        title={`${label}: ${fmtNum(val)} denials`}
                      />
                      <span className="text-[9px] text-th-muted truncate max-w-full tabular-nums">{typeof label === 'string' ? label.slice(-5) : label}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 9 — AI Ollama Insight Cards (bottom)
        ═══════════════════════════════════════════════════════════════════ */}
        {aiInsights.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-purple-400 text-base">auto_awesome</span>
              <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">AI Insights</span>
              <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1">
                Live · Ollama
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {aiInsights.slice(0, 3).map((ins, i) => (
                <AIInsightCard
                  key={i}
                  title={ins.title}
                  description={ins.body}
                  confidence={ins.badge === 'Prescriptive' ? 95 : ins.badge === 'Predictive' ? 87 : 82}
                  impact={ins.severity === 'critical' ? 'high' : ins.severity === 'warning' ? 'high' : 'medium'}
                  category={ins.badge}
                  action="Review"
                  value={ins.ai_generated ? 'AI Generated' : ''}
                  icon={ins.badge === 'Prescriptive' ? 'gavel' : ins.badge === 'Predictive' ? 'trending_up' : 'analytics'}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════════

function KPICard({ label, value, sub, icon, color, accent, onClick }) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl p-6 bg-th-surface-raised border border-th-border border-l-[3px] ${accent} hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">{label}</p>
        <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
      </div>
      <p className={`tracking-tight text-3xl font-black tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-xs text-th-muted tabular-nums">{sub}</p>}
    </div>
  );
}
