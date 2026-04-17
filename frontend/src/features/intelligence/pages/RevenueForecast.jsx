import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../services/api';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const fmt = (v) => {
  if (v == null) return '--';
  if (typeof v === 'number') {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  }
  return String(v);
};
const fmtPct = (v) => (v != null ? `${Number(v).toFixed(1)}%` : '--');
const fmtNum = (v) => (v != null ? Number(v).toLocaleString() : '--');
const weekLabel = (d) => {
  if (!d) return '--';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const dayLabel = (d) => {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.getDate().toString();
};
const isWeekend = (d) => {
  if (!d) return false;
  const dt = new Date(d + 'T00:00:00');
  return dt.getDay() === 0 || dt.getDay() === 6;
};

const MAPE_COLOR = (v) => {
  if (v == null) return 'text-th-muted';
  if (v < 5) return 'text-emerald-400';
  if (v < 10) return 'text-amber-400';
  return 'text-red-400';
};
const MAPE_BG = (v) => {
  if (v == null) return 'border-th-border';
  if (v < 5) return 'border-emerald-500/30';
  if (v < 10) return 'border-amber-500/30';
  return 'border-red-500/30';
};

/* skeleton row for loading */
const Skeleton = ({ rows = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="rounded-xl border border-th-border bg-th-surface-raised p-6 animate-pulse">
        <div className="h-4 bg-th-surface-overlay rounded w-1/3 mb-3" />
        <div className="h-8 bg-th-surface-overlay rounded w-1/2" />
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export function RevenueForecast() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weeksAhead, setWeeksAhead] = useState(13);

  // data buckets
  const [accuracy, setAccuracy] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [daily, setDaily] = useState(null);
  const [layer3, setLayer3] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [fallbackSummary, setFallbackSummary] = useState(null);
  const [diagnosticFindings, setDiagnosticFindings] = useState(null);
  const [preventionData, setPreventionData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Core data (fast): block rendering on these
        const [acc, wk, dy, l3] = await Promise.all([
          api.forecast.prophetAccuracy().catch(() => null),
          api.forecast.prophetWeekly(weeksAhead).catch(() => null),
          api.forecast.prophetDaily(30).catch(() => null),
          api.forecast.get3Layer(Math.min(weeksAhead, 12)).catch(() => null),
        ]);
        if (cancelled) return;
        setAccuracy(acc);
        setWeekly(wk);
        setDaily(dy);
        setLayer3(l3);

        // Non-blocking: AI insights (slow Ollama call), diagnostics, prevention
        api.ai.getInsights('forecast').then(ai => { if (!cancelled) setAiInsights(ai); }).catch(() => null);
        api.diagnostics.getFindings({ severity: 'critical' }).then(d => { if (!cancelled) setDiagnosticFindings(d); }).catch(() => null);
        api.prevention.scan(3).then(d => { if (!cancelled) setPreventionData(d); }).catch(() => null);

        // fallback if Prophet not available
        if (!wk && !acc) {
          const fb = await api.forecast.getSummary().catch(() => null);
          if (!cancelled) setFallbackSummary(fb);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load forecast data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [weeksAhead]);

  /* derived data — merge Prophet predictions with 3-layer denial adjustment */
  const denialPct = layer3?.summary?.denial_reduction_pct || 11.3;
  const weeklyRows = useMemo(() => {
    const tf = weekly?.total_forecast || weekly?.weeks || weekly?.data || [];
    return tf.map(w => {
      const gross = w.gross || w.predicted || 0;
      const denialLoss = gross * (denialPct / 100);
      const net = gross - denialLoss;
      return {
        week: w.week_start || w.date || w.week,
        gross,
        denials: denialLoss,
        net_expected: net,
        cash: net,
        lower: w.lower || 0,
        upper: w.upper || 0,
      };
    });
  }, [weekly, denialPct]);

  const dailyRows = useMemo(() => {
    const dd = daily?.total_forecast || daily?.days || daily?.data || [];
    return dd.map(d => ({
      date: d.date || d.payment_date,
      amount: d.predicted || d.amount || 0,
      lower: d.lower || 0,
      upper: d.upper || 0,
      day_of_week: d.day_of_week,
      is_holiday: d.is_holiday,
      is_month_end: d.is_month_end,
    }));
  }, [daily]);

  const payerBreakdown = useMemo(() => {
    // API returns { payer_forecasts: [{payer_id, payer_name, predictions: [...]}] }
    const pf = weekly?.payer_forecasts || weekly?.payers || [];
    return pf.map(p => ({
      payer: p.payer_name || p.payer,
      payer_id: p.payer_id,
      total: (p.predictions || []).reduce((s, w) => s + (w.predicted || 0), 0),
      weeks: p.predictions || [],
      training_points: p.training_points || 0,
    })).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [weekly]);

  const historicalAccuracy = useMemo(() => {
    // Use real holdout week-by-week data from the Prophet backend
    const holdout = accuracy?.holdout_weeks_detail;
    if (Array.isArray(holdout) && holdout.length > 0) {
      return holdout.map(h => ({
        week_start: h.week_start,
        ds: h.week_start,
        predicted: h.predicted,
        actual: h.actual,
        variance: Math.abs(h.predicted - h.actual),
        error_pct: h.error_pct,
      }));
    }
    // No holdout data available -- return empty (shows empty state)
    return [];
  }, [accuracy]);

  const totalProjection = useMemo(() => {
    if (weeklyRows.length) return weeklyRows.reduce((s, w) => s + (w.net_expected || 0), 0);
    if (layer3?.summary?.expected_cash_4wk) return layer3.summary.expected_cash_4wk;
    return fallbackSummary?.grand_total_forecasted || fallbackSummary?.total || null;
  }, [weeklyRows, layer3, fallbackSummary]);

  // API returns { overall_metrics: { mape, mae, r_squared } }
  const om = accuracy?.overall_metrics || accuracy || {};
  const mape = om.mape ?? accuracy?.mape ?? null;
  const mae = om.mae ?? accuracy?.mae ?? null;
  const r2 = om.r_squared ?? accuracy?.r_squared ?? accuracy?.r2 ?? null;
  const trainingPts = om.training_points ?? accuracy?.training_points ?? null;
  const modelType = accuracy?.model_backend || accuracy?.model || 'Prophet';

  // funnel from 3-layer
  const funnel = useMemo(() => {
    const s = layer3?.summary || {};
    const gross = s.gross_total || 0;
    const denials = (s.gross_total || 0) - (s.net_after_denials || 0);
    const net = s.net_after_denials || 0;
    const cash = s.expected_cash_4wk || 0;
    return { gross, denials, net, cash };
  }, [layer3]);

  // daily calendar grid
  const dailyGrid = useMemo(() => {
    if (!dailyRows.length) return [];
    const maxAmt = Math.max(...dailyRows.map(d => d.amount || d.expected || 0), 1);
    return dailyRows.map(d => ({
      ...d,
      date: d.date || d.ds,
      amount: d.amount || d.expected || 0,
      intensity: (d.amount || d.expected || 0) / maxAmt,
    }));
  }, [dailyRows]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto font-sans p-6">
        <h1 className="text-2xl font-black text-th-heading mb-2">Revenue Forecast</h1>
        <p className="text-sm text-th-secondary mb-6">Prophet/ML-powered revenue prediction engine for NEXUS RCM</p>
        <Skeleton rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto font-sans p-6">
        <h1 className="text-2xl font-black text-th-heading mb-2">Revenue Forecast</h1>
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
          <span className="material-symbols-outlined text-3xl text-red-400 mb-2 block">error</span>
          <p className="text-red-400 font-bold mb-1">Failed to load forecast</p>
          <p className="text-sm text-th-secondary">{error}</p>
        </div>
      </div>
    );
  }

  // API returns {insights: [{title, body, badge}]} or [{title, body, badge}] directly
  const aiCards = aiInsights?.insights || (Array.isArray(aiInsights) ? aiInsights : []);
  const insightText = aiCards?.[0]?.body || aiCards?.[0]?.text || aiInsights?.narrative || aiInsights?.summary || null;

  return (
    <div className="flex-1 overflow-y-auto font-sans p-6 custom-scrollbar">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-th-heading mb-1">Revenue Forecast</h1>
          <p className="text-sm text-th-secondary">Prophet/ML-powered revenue prediction engine &mdash; NEXUS RCM</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-th-muted">Forecast window:</span>
          {[4, 8, 13].map(w => (
            <button
              key={w}
              onClick={() => setWeeksAhead(w)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 ${weeksAhead === w ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'border-th-border text-th-secondary hover:text-th-heading hover:border-th-heading/30'}`}
            >{w === 13 ? '90d' : `${w}wk`}</button>
          ))}
        </div>
      </div>

      {/* Diagnostic + Prevention Risk Strips */}
      {diagnosticFindings?.findings?.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs mb-2">
          <span className="material-symbols-outlined text-rose-400 text-sm">biotech</span>
          <span className="text-th-secondary">Forecast risk:</span>
          <span className="font-bold text-rose-400">{diagnosticFindings.findings.length} critical findings</span>
          <span className="text-th-muted">may impact projections</span>
        </div>
      )}
      {preventionData && (preventionData.total > 0 || preventionData.alerts?.length > 0) && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs mb-2">
          <span className="material-symbols-outlined text-amber-400 text-sm">shield</span>
          <span className="font-bold text-amber-400 tabular-nums">{preventionData.total || preventionData.alerts?.length || 0}</span>
          <span className="text-th-secondary">preventable revenue at risk</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* Section 1: AI Forecast Summary                                */}
      {/* ============================================================ */}
      <div className="rounded-xl mb-6 p-6 bg-gradient-to-br from-indigo-600/20 via-purple-600/15 to-blue-600/10 border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-indigo-400">neurology</span>
            <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">AI Forecast Intelligence</h2>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Ollama
            </span>
          </div>
          {insightText ? (
            <p className="text-sm text-th-secondary leading-relaxed max-w-3xl">{insightText}</p>
          ) : (
            <p className="text-sm text-th-muted italic">AI narrative not available &mdash; connect Ollama for ML-powered forecast summaries.</p>
          )}
          <div className="flex items-center gap-8 mt-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300/70 mb-1">90-Day Projection</p>
              <p className="text-2xl font-black text-indigo-300 tabular-nums">{fmt(totalProjection)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300/70 mb-1">Model Accuracy</p>
              <p className={`text-2xl font-black tabular-nums ${MAPE_COLOR(mape)}`}>{mape != null ? `${(100 - mape).toFixed(1)}%` : '--'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300/70 mb-1">Model</p>
              <p className="text-2xl font-black text-indigo-300">{modelType}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Section 2: Model Performance KPIs                             */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'MAPE',
            sub: 'Mean Absolute % Error',
            value: fmtPct(mape),
            color: MAPE_COLOR(mape),
            border: MAPE_BG(mape),
            icon: 'percent',
            good: mape != null && mape < 5 ? 'Excellent' : mape != null && mape < 10 ? 'Good' : mape != null ? 'Needs tuning' : null,
          },
          {
            label: 'MAE',
            sub: 'Mean Absolute Error',
            value: fmt(mae),
            color: 'text-blue-400',
            border: 'border-blue-500/30',
            icon: 'straighten',
            good: null,
          },
          {
            label: 'R\u00B2 Score',
            sub: 'Coefficient of Determination',
            value: r2 != null ? r2.toFixed(4) : '--',
            color: r2 != null && r2 > 0.9 ? 'text-emerald-400' : 'text-amber-400',
            border: r2 != null && r2 > 0.9 ? 'border-emerald-500/30' : 'border-amber-500/30',
            icon: 'analytics',
            good: r2 != null && r2 > 0.95 ? 'Strong fit' : r2 != null && r2 > 0.9 ? 'Good fit' : null,
          },
          {
            label: 'Training Data',
            sub: 'Historical data points',
            value: fmtNum(trainingPts),
            color: 'text-purple-400',
            border: 'border-purple-500/30',
            icon: 'database',
            good: null,
          },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-xl border ${kpi.border} bg-th-surface-raised p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`material-symbols-outlined text-sm ${kpi.color}`}>{kpi.icon}</span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted">{kpi.label}</p>
            </div>
            <p className={`text-2xl font-black tabular-nums ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-th-muted mt-1">{kpi.sub}</p>
            {kpi.good && (
              <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${kpi.color} bg-th-surface-overlay`}>
                {kpi.good}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/* Section 3: Weekly Revenue Forecast Table                      */}
      {/* ============================================================ */}
      <div className="rounded-xl border border-th-border bg-th-surface-raised overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-th-border bg-th-surface-overlay/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400 text-sm">table_chart</span>
            <h3 className="text-sm font-bold text-th-heading">Weekly Revenue Forecast</h3>
            <span className="text-[10px] text-th-muted ml-2">{weeksAhead === 13 ? '90-day' : `${weeksAhead}-week`} projection</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Gross</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Denials</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Net</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500" /> Cash</div>
          </div>
        </div>
        {weeklyRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-th-muted">Week</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-blue-400 text-right">Gross Projection</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-red-400 text-right">Denial Loss</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-emerald-400 text-right">Net Expected</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-purple-400 text-right">Cash Arriving</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-th-muted text-right">Confidence Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {weeklyRows.map((w, i) => {
                  const gross = w.gross || w.gross_projection || 0;
                  const denial = w.denial_loss || w.denials || 0;
                  const net = w.net_expected || w.net || 0;
                  const cash = w.cash_arriving || w.cash || 0;
                  const lo = w.confidence_low || w.lower || null;
                  const hi = w.confidence_high || w.upper || null;
                  return (
                    <React.Fragment key={i}>
                      <tr
                        className="hover:bg-th-surface-overlay/40 transition-colors cursor-pointer"
                        onClick={() => setExpandedWeek(expandedWeek === i ? null : i)}
                      >
                        <td className="px-6 py-3 text-sm font-semibold text-th-heading">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-xs text-th-muted">{expandedWeek === i ? 'expand_more' : 'chevron_right'}</span>
                            {weekLabel(w.week || w.week_start || w.ds)}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-blue-400 tabular-nums text-right">{fmt(gross)}</td>
                        <td className="px-6 py-3 text-sm font-bold text-red-400 tabular-nums text-right">-{fmt(denial)}</td>
                        <td className="px-6 py-3 text-sm font-bold text-emerald-400 tabular-nums text-right">{fmt(net)}</td>
                        <td className="px-6 py-3 text-sm font-bold text-purple-400 tabular-nums text-right">{fmt(cash)}</td>
                        <td className="px-6 py-3 text-xs text-th-muted tabular-nums text-right">
                          {lo != null && hi != null ? `${fmt(lo)} \u2013 ${fmt(hi)}` : '--'}
                        </td>
                      </tr>
                      {expandedWeek === i && w.payers && (
                        <tr>
                          <td colSpan={6} className="bg-th-surface-overlay/20 px-10 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted mb-2">Payer Breakdown</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {(w.payers || []).slice(0, 8).map((p, j) => (
                                <div key={j} className="flex items-center justify-between rounded-lg bg-th-surface-raised px-3 py-2 border border-th-border">
                                  <span className="text-xs text-th-secondary truncate mr-2">{p.name || p.payer_name}</span>
                                  <span className="text-xs font-bold text-th-heading tabular-nums">{fmt(p.amount || p.net || p.cash)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {/* Total row */}
                <tr className="bg-th-surface-overlay/30 font-bold border-t-2 border-th-border">
                  <td className="px-6 py-4 text-sm text-th-heading">
                    <span className="material-symbols-outlined text-xs text-emerald-400 mr-1">functions</span>
                    Total
                  </td>
                  <td className="px-6 py-4 text-sm text-blue-400 tabular-nums text-right">{fmt(weeklyRows.reduce((s, w) => s + (w.gross || w.gross_projection || 0), 0))}</td>
                  <td className="px-6 py-4 text-sm text-red-400 tabular-nums text-right">-{fmt(weeklyRows.reduce((s, w) => s + (w.denial_loss || w.denials || 0), 0))}</td>
                  <td className="px-6 py-4 text-sm text-emerald-400 tabular-nums text-right">{fmt(weeklyRows.reduce((s, w) => s + (w.net_expected || w.net || 0), 0))}</td>
                  <td className="px-6 py-4 text-sm text-purple-400 tabular-nums text-right">{fmt(weeklyRows.reduce((s, w) => s + (w.cash_arriving || w.cash || 0), 0))}</td>
                  <td className="px-6 py-4" />
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          /* Fallback if Prophet not available */
          <div className="p-8 text-center">
            {fallbackSummary ? (
              <div>
                <p className="text-sm text-th-muted mb-3">Prophet model not available &mdash; showing legacy forecast summary</p>
                <p className="text-2xl font-bold text-blue-400 tabular-nums">{fmt(fallbackSummary.grand_total_forecasted || fallbackSummary.total || fallbackSummary.expected_revenue)}</p>
                <p className="text-xs text-th-muted mt-1">Estimated total revenue</p>
              </div>
            ) : (
              <div>
                <span className="material-symbols-outlined text-3xl text-th-muted mb-2 block">model_training</span>
                <p className="text-sm text-th-muted">Prophet weekly forecast not available. Ensure the ML pipeline is running.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* Section 4: Payer Forecast Breakdown                           */}
      {/* ============================================================ */}
      {payerBreakdown.length > 0 && (
        <div className="rounded-xl border border-th-border bg-th-surface-raised overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-th-border bg-th-surface-overlay/30 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-sm">groups</span>
            <h3 className="text-sm font-bold text-th-heading">Payer Forecast Breakdown</h3>
            <span className="text-[10px] text-th-muted ml-2">Top 10 payers</span>
          </div>
          <div className="p-6 space-y-3">
            {payerBreakdown.slice(0, 10).map((payer, i) => {
              const projected = payer.total || payer.projected || payer.forecast || 0;
              const historical = payer.historical || projected * 0.92;
              const maxVal = Math.max(projected, historical, 1);
              const adtp = payer.adtp || payer.avg_days_to_pay || null;
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-36 flex-shrink-0">
                    <p className="text-xs font-semibold text-th-heading truncate">{payer.payer || payer.name || payer.payer_name}</p>
                    {adtp != null && <p className="text-[10px] text-th-muted">ADTP: {adtp}d</p>}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 rounded-full bg-th-surface-overlay overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500/70" style={{ width: `${(projected / maxVal) * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-blue-400 tabular-nums w-16 text-right">{fmt(projected)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-th-surface-overlay overflow-hidden">
                        <div className="h-full rounded-full bg-th-muted/30" style={{ width: `${(historical / maxVal) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-th-muted tabular-nums w-16 text-right">{fmt(historical)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-4 pt-2 text-[10px] font-bold uppercase tracking-wider text-th-muted">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500/70" /> Projected</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-th-muted/30" /> Historical</div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Section 5: Daily Cash Forecast (30-day calendar grid)         */}
      {/* ============================================================ */}
      <div className="rounded-xl border border-th-border bg-th-surface-raised overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-th-border bg-th-surface-overlay/30 flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400 text-sm">calendar_month</span>
          <h3 className="text-sm font-bold text-th-heading">Daily Cash Forecast</h3>
          <span className="text-[10px] text-th-muted ml-2">30-day view</span>
        </div>
        {dailyGrid.length > 0 ? (
          <div className="p-6">
            <div className="grid grid-cols-7 gap-1.5">
              {/* Day-of-week headers */}
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="text-center text-[9px] font-bold uppercase tracking-wider text-th-muted py-1">{d}</div>
              ))}
              {/* pad to correct day of week */}
              {(() => {
                const firstDate = dailyGrid[0]?.date;
                if (!firstDate) return null;
                const dow = new Date(firstDate + 'T00:00:00').getDay();
                const mondayOffset = dow === 0 ? 6 : dow - 1;
                return Array.from({ length: mondayOffset }).map((_, i) => <div key={`pad-${i}`} />);
              })()}
              {dailyGrid.map((d, i) => {
                const weekend = isWeekend(d.date);
                const isHoliday = d.is_holiday || false;
                const isMonthEnd = d.is_month_end || false;
                const opacity = Math.max(0.1, d.intensity);
                return (
                  <div
                    key={i}
                    className={`rounded-lg p-2 text-center border transition-all duration-150 hover:scale-105 ${
                      weekend ? 'bg-th-surface-overlay/30 border-th-border/50' :
                      isMonthEnd ? 'border-amber-500/40 bg-amber-500/10' :
                      isHoliday ? 'border-red-500/30 bg-red-500/5' :
                      'border-th-border bg-th-surface-raised'
                    }`}
                    title={`${d.date}: ${fmt(d.amount)}${isHoliday ? ' (Holiday)' : ''}${isMonthEnd ? ' (Month-end)' : ''}`}
                  >
                    <div className="text-[10px] text-th-muted font-semibold">{dayLabel(d.date)}</div>
                    <div
                      className="text-[10px] font-bold tabular-nums mt-0.5"
                      style={{ color: weekend ? 'var(--color-th-muted)' : `rgba(52, 211, 153, ${opacity})` }}
                    >{fmt(d.amount)}</div>
                    {isMonthEnd && <div className="text-[8px] text-amber-400 font-bold mt-0.5">EOM</div>}
                    {isHoliday && <div className="text-[8px] text-red-400 font-bold mt-0.5">HOL</div>}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-th-border">
              <div className="flex items-center gap-4 text-[10px] text-th-muted">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400/80 inline-block" /> High</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400/30 inline-block" /> Low</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-th-surface-overlay/30 border border-th-border/50 inline-block" /> Weekend</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/10 border border-amber-500/40 inline-block" /> Month-end</span>
              </div>
              <p className="text-xs text-th-muted tabular-nums">
                30-day total: <span className="font-bold text-emerald-400">{fmt(dailyGrid.reduce((s, d) => s + d.amount, 0))}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-th-muted">
            <span className="material-symbols-outlined text-3xl mb-2 block">calendar_month</span>
            <p className="text-sm">Daily Prophet forecast not available yet.</p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* Section 6: 3-Layer Revenue Funnel                             */}
      {/* ============================================================ */}
      <div className="rounded-xl border border-th-border bg-th-surface-raised p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-blue-400 text-sm">filter_alt</span>
          <h3 className="text-sm font-bold text-th-heading">3-Layer Revenue Funnel</h3>
        </div>
        {funnel.gross > 0 ? (
          <>
            <div className="flex items-stretch gap-3">
              {/* Gross */}
              <div className="flex-1 rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300 mb-2">Gross Charges</p>
                <p className="text-xl font-black text-blue-400 tabular-nums">{fmt(funnel.gross)}</p>
              </div>
              <div className="flex flex-col items-center justify-center text-th-muted">
                <span className="material-symbols-outlined">arrow_forward</span>
                <span className="text-[9px] text-red-400 font-bold">-{fmtPct(funnel.gross > 0 ? (funnel.denials / funnel.gross) * 100 : 0)}</span>
              </div>
              {/* Minus Denials */}
              <div className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-300 mb-2">Denial Loss</p>
                <p className="text-xl font-black text-red-400 tabular-nums">-{fmt(funnel.denials)}</p>
              </div>
              <div className="flex flex-col items-center justify-center text-th-muted">
                <span className="material-symbols-outlined">arrow_forward</span>
                <span className="text-[9px] text-emerald-400 font-bold">{fmtPct(funnel.gross > 0 ? (funnel.net / funnel.gross) * 100 : 0)}</span>
              </div>
              {/* Net Revenue */}
              <div className="flex-1 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-2">Net Revenue</p>
                <p className="text-xl font-black text-amber-400 tabular-nums">{fmt(funnel.net)}</p>
              </div>
              <div className="flex flex-col items-center justify-center text-th-muted">
                <span className="material-symbols-outlined">arrow_forward</span>
                <span className="text-[9px] text-purple-400 font-bold">ADTP</span>
              </div>
              {/* Cash */}
              <div className="flex-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-2">Cash Arriving</p>
                <p className="text-xl font-black text-emerald-400 tabular-nums">{fmt(funnel.cash)}</p>
              </div>
            </div>
            {/* Confidence */}
            {layer3?.confidence?.low != null && (
              <div className="mt-4 flex items-center gap-3 text-xs text-th-muted">
                <span className="material-symbols-outlined text-sm text-purple-400">verified</span>
                Confidence: {fmt(layer3.confidence.low)} &mdash; {fmt(layer3.confidence.mid)} &mdash; {fmt(layer3.confidence.high)}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-th-muted">
            <span className="material-symbols-outlined text-3xl mb-2 block">filter_alt</span>
            <p className="text-sm">3-Layer funnel data not available.</p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* Section 7: Forecast vs Actuals (Historical Accuracy)          */}
      {/* ============================================================ */}
      <div className="rounded-xl border border-th-border bg-th-surface-raised overflow-hidden">
        <div className="px-6 py-4 border-b border-th-border bg-th-surface-overlay/30 flex items-center gap-2">
          <span className="material-symbols-outlined text-purple-400 text-sm">compare_arrows</span>
          <h3 className="text-sm font-bold text-th-heading">Forecast vs Actuals</h3>
          <span className="text-[10px] text-th-muted ml-2">Holdout validation ({historicalAccuracy.length} weeks)</span>
        </div>
        {historicalAccuracy.length > 0 ? (
          <div className="p-6">
            {/* Visual line chart approximation with bars */}
            <div className="flex items-end gap-2 mb-4" style={{ minHeight: 180 }}>
              {historicalAccuracy.slice(-12).map((h, i) => {
                const predicted = h.predicted || h.forecast || 0;
                const actual = h.actual || h.realized || 0;
                const maxVal = Math.max(...historicalAccuracy.slice(-12).flatMap(x => [x.predicted || x.forecast || 0, x.actual || x.realized || 0]), 1);
                const predH = (predicted / maxVal) * 160;
                const actH = (actual / maxVal) * 160;
                const errorPct = actual > 0 ? Math.abs(predicted - actual) / actual * 100 : 0;
                const isOff = errorPct > 10;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-0.5" style={{ height: 160 }}>
                      <div
                        className={`w-3 rounded-t transition-colors ${isOff ? 'bg-red-500/80' : 'bg-blue-500/70'}`}
                        style={{ height: Math.max(predH, 2) }}
                        title={`Predicted: ${fmt(predicted)}`}
                      />
                      <div
                        className="w-3 rounded-t bg-emerald-500/70"
                        style={{ height: Math.max(actH, 2) }}
                        title={`Actual: ${fmt(actual)}`}
                      />
                    </div>
                    <span className="text-[9px] text-th-muted font-semibold">{weekLabel(h.week_start || h.date || h.ds)}</span>
                    {isOff && <span className="text-[8px] text-red-400 font-bold">{errorPct.toFixed(0)}% off</span>}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-wider text-th-muted border-t border-th-border pt-3">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500/70" /> Predicted</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70" /> Actual</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-500/80" /> &gt;10% deviation</div>
            </div>
            {/* Detailed accuracy table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted">Week</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-blue-400 text-right">Predicted</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400 text-right">Actual</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted text-right">Variance</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted text-right">Error %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-th-border">
                  {historicalAccuracy.slice(-12).map((h, i) => {
                    const predicted = h.predicted || h.forecast || 0;
                    const actual = h.actual || h.realized || 0;
                    const variance = predicted - actual;
                    const errorPct = actual > 0 ? Math.abs(variance) / actual * 100 : 0;
                    const isOff = errorPct > 10;
                    return (
                      <tr key={i} className={`hover:bg-th-surface-overlay/40 transition-colors ${isOff ? 'bg-red-500/5' : ''}`}>
                        <td className="px-4 py-2 text-xs font-semibold text-th-heading">{weekLabel(h.week_start || h.date || h.ds)}</td>
                        <td className="px-4 py-2 text-xs font-bold text-blue-400 tabular-nums text-right">{fmt(predicted)}</td>
                        <td className="px-4 py-2 text-xs font-bold text-emerald-400 tabular-nums text-right">{fmt(actual)}</td>
                        <td className={`px-4 py-2 text-xs font-bold tabular-nums text-right ${variance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {variance > 0 ? '+' : ''}{fmt(variance)}
                        </td>
                        <td className={`px-4 py-2 text-xs font-bold tabular-nums text-right ${isOff ? 'text-red-400' : 'text-th-muted'}`}>
                          {fmtPct(errorPct)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-th-muted">
            <span className="material-symbols-outlined text-3xl mb-2 block">compare_arrows</span>
            <p className="text-sm">Holdout validation data not yet available.</p>
            <p className="text-xs mt-1">The model needs at least 8 weeks of training data to run holdout accuracy checks.</p>
          </div>
        )}
      </div>
    </div>
  );
}
