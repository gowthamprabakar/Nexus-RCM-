import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api } from '../../../services/api';
import { DateRangePicker } from '../../../components/ui/DateRangePicker';
import {
  getSeriesColors, getGridProps, getAxisProps, getTooltipStyle,
} from '../../../lib/chartTheme';

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
function fmtPct(n) {
  const v = Number(n) || 0;
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
}

// ── Fallback UI components (Skeleton / EmptyState) ───────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-th-border rounded ${className}`} />;
}
function EmptyState({ icon = 'insights', title, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-3xl text-primary">{icon}</span>
      </div>
      <h3 className="text-base font-bold text-th-heading mb-1">{title}</h3>
      {message && <p className="text-sm text-th-muted max-w-md">{message}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function DenialTrends() {
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState(null);
  const [dateRange, setDateRange] = useState('Last 90 Days');
  const [payer, setPayer] = useState('all');
  const [rootCauseGroup, setRootCauseGroup] = useState('all');

  // ── Derive weeksBack from dateRange label ────────────────────────────────
  const weeksBack = useMemo(() => {
    const label = typeof dateRange === 'string' ? dateRange : dateRange?.label || '';
    if (/7\s*day/i.test(label)) return 1;
    if (/30\s*day/i.test(label)) return 5;   // ~4.3 weeks
    if (/60\s*day/i.test(label)) return 9;
    if (/90\s*day/i.test(label)) return 13;
    if (/6\s*month/i.test(label)) return 26;
    if (/12\s*month|1\s*year/i.test(label)) return 52;
    return 13; // default ~90 days
  }, [dateRange]);

  // ── Data fetch ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const payerId = payer === 'all' ? undefined : payer;
    api.rootCause.getTrending({ weeksBack, payerId })
      .then((data) => { if (!cancelled) setTrendData(data); })
      .catch((err) => { if (!cancelled) console.error('DenialTrends load error:', err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [payer, weeksBack]);

  // ── Derive chart data ─────────────────────────────────────────────────────
  const weeklySeries = useMemo(() => {
    const weeks = trendData?.weeks ?? trendData?.trend ?? trendData?.weekly ?? [];
    return weeks.map((w, i) => {
      // Backend returns {week_start:'2026-03-09', count:2867, revenue_at_risk:10647378.26}
      const weekStart = w.week_start ?? w.week ?? w.label ?? w.period ?? `W${i + 1}`;
      // Show "MM/DD" short label for x-axis
      let shortLabel = weekStart;
      if (typeof weekStart === 'string' && weekStart.length >= 10) {
        shortLabel = weekStart.slice(5); // "MM-DD"
      }
      return {
        week: shortLabel,
        count: w.count ?? w.total ?? w.denials ?? 0,
        revenue: w.revenue_at_risk ?? w.revenue ?? w.amount ?? w.at_risk ?? 0,
      };
    });
  }, [trendData]);

  const trendingCauses = useMemo(() => {
    // Backend returns {trending:[{root_cause, count, total_impact, group, trend_pct, current_half, prior_half}]}
    const raw = trendData?.trending ?? trendData?.trending_root_causes ?? trendData?.top_trending ?? [];
    return raw.map((rc) => ({
      cause: rc.root_cause ?? rc.cause ?? rc.name ?? 'Unknown',
      group: rc.group ?? rc.category ?? 'Process',
      count: rc.count ?? 0,
      countChange: (rc.current_half ?? 0) - (rc.prior_half ?? 0),
      trendPct: rc.trend_pct ?? rc.pct_change ?? 0,
      revenue: rc.total_impact ?? rc.revenue ?? rc.impact ?? 0,
      revenueChange: rc.revenue_change ?? rc.impact_change ?? 0,
    })).slice(0, 5);
  }, [trendData]);

  const payerOptions = useMemo(() => {
    const payers = trendData?.filter_facets?.payers ?? trendData?.payers ?? [];
    return [{ id: 'all', label: 'All Payers' }, ...payers.map((p) => ({
      id: p.id ?? p.val ?? p.name ?? p.payer_id ?? p,
      label: p.label ?? p.name ?? p.payer ?? String(p),
    }))];
  }, [trendData]);

  // Filter trending by group
  const filteredCauses = useMemo(() => {
    if (rootCauseGroup === 'all') return trendingCauses;
    return trendingCauses.filter(
      (c) => (c.group || '').toUpperCase() === rootCauseGroup.toUpperCase()
    );
  }, [trendingCauses, rootCauseGroup]);

  // ── Theme helpers ─────────────────────────────────────────────────────────
  const colors = getSeriesColors();
  const gridProps = getGridProps();
  const axisProps = getAxisProps();
  const tooltipStyle = getTooltipStyle();

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto font-sans h-full">
        <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">
          <Skeleton className="h-16 w-2/3 rounded" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto font-sans h-full">
      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* ══════════════════════════════════════════════════════════════════
            H1 Title
        ══════════════════════════════════════════════════════════════════ */}
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-th-heading tracking-tight">
            Denial Trends — 12 Week Analysis
          </h1>
          <p className="text-sm text-th-secondary mt-1">
            Weekly denial volume, revenue exposure, and emerging root causes
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            Filter Row
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-th-muted uppercase tracking-wider">Range</span>
            <DateRangePicker value={dateRange} onChange={(v) => setDateRange(v?.label || v)} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-th-muted uppercase tracking-wider">Payer</span>
            <select
              value={payer}
              onChange={(e) => setPayer(e.target.value)}
              className="bg-th-surface-overlay border border-th-border rounded-lg px-3 py-1.5 text-sm text-th-heading focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {payerOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-th-muted uppercase tracking-wider">Root Cause Group</span>
            <select
              value={rootCauseGroup}
              onChange={(e) => setRootCauseGroup(e.target.value)}
              className="bg-th-surface-overlay border border-th-border rounded-lg px-3 py-1.5 text-sm text-th-heading focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Groups</option>
              <option value="PROCESS">Process</option>
              <option value="PREVENTABLE">Preventable</option>
              <option value="PAYER">Payer</option>
              <option value="CODING">Coding</option>
              <option value="ADMIN">Admin</option>
              <option value="CLINICAL">Clinical</option>
            </select>
          </div>

          <div className="ml-auto flex items-center gap-2 text-xs text-th-muted">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span className="tabular-nums">{weeklySeries.length} weeks loaded</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            Two-column grid: Line + Bar
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* LEFT: Weekly denial count (Line) */}
          <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-base">show_chart</span>
              <h3 className="text-lg font-bold text-th-heading">Weekly Denial Count</h3>
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-auto">
                Trend
              </span>
            </div>
            {weeklySeries.length === 0 ? (
              <EmptyState
                icon="show_chart"
                title="No trend data yet"
                message="Weekly denial counts will appear here once data is available for the selected filters."
              />
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={weeklySeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="week" {...axisProps} />
                    <YAxis {...axisProps} tickFormatter={(v) => fmtNum(v)} />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(v) => [fmtNum(v), 'Denials']}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={colors[0]}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: colors[0] }}
                      activeDot={{ r: 5 }}
                      name="Denials"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* RIGHT: Weekly revenue at risk (Bar) */}
          <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-rose-400 text-base">attach_money</span>
              <h3 className="text-lg font-bold text-th-heading">Weekly Revenue at Risk</h3>
              <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-auto">
                Exposure
              </span>
            </div>
            {weeklySeries.length === 0 ? (
              <EmptyState
                icon="attach_money"
                title="No revenue data yet"
                message="Weekly at-risk revenue will appear here once data is available for the selected filters."
              />
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={weeklySeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="week" {...axisProps} />
                    <YAxis {...axisProps} tickFormatter={(v) => fmt$(v)} />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(v) => [fmt$(v), 'At Risk']}
                    />
                    <Bar dataKey="revenue" fill={colors[3]} radius={[4, 4, 0, 0]} name="Revenue at Risk" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            Top 5 Trending Root Causes Table
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-amber-400 text-base">trending_up</span>
            <h3 className="text-lg font-bold text-th-heading">Top 5 Trending Root Causes</h3>
            <span className="text-xs text-th-muted ml-2">12-week movement</span>
            <span className="text-xs text-th-muted ml-auto tabular-nums">{filteredCauses.length} shown</span>
          </div>

          {filteredCauses.length === 0 ? (
            <EmptyState
              icon="trending_up"
              title="No trending root causes"
              message="There are no root causes matching the selected filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wider text-th-muted border-b border-th-border">
                    <th className="py-3 px-3">Root Cause</th>
                    <th className="py-3 px-3">Trend</th>
                    <th className="py-3 px-3 text-right">12-Week Count Change</th>
                    <th className="py-3 px-3 text-right">Revenue Impact Change</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredCauses.map((rc, idx) => {
                    const up = rc.trendPct > 0;
                    const down = rc.trendPct < 0;
                    const arrow = up ? 'arrow_upward' : down ? 'arrow_downward' : 'remove';
                    const trendColor = up ? 'text-rose-400' : down ? 'text-emerald-400' : 'text-th-muted';
                    const trendBg = up ? 'bg-rose-500/10 border-rose-500/20'
                      : down ? 'bg-emerald-500/10 border-emerald-500/20'
                      : 'bg-th-surface-overlay border-th-border';
                    const revColor = (rc.revenueChange || 0) > 0 ? 'text-rose-400'
                      : (rc.revenueChange || 0) < 0 ? 'text-emerald-400'
                      : 'text-th-muted';
                    const countColor = (rc.countChange || 0) > 0 ? 'text-rose-400'
                      : (rc.countChange || 0) < 0 ? 'text-emerald-400'
                      : 'text-th-muted';
                    return (
                      <tr
                        key={idx}
                        className="border-b border-th-border/30 hover:bg-th-surface-overlay/40 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <p className="font-bold text-th-heading">{rc.cause}</p>
                          <p className="text-[11px] text-th-muted mt-0.5">
                            {rc.group} · {fmtNum(rc.count)} claims
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${trendBg} ${trendColor}`}>
                            <span className="material-symbols-outlined text-sm">{arrow}</span>
                            <span className="text-xs font-bold tabular-nums">{fmtPct(rc.trendPct)}</span>
                          </span>
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-bold tabular-nums ${countColor}`}>
                          {(rc.countChange || 0) > 0 ? '+' : ''}{fmtNum(rc.countChange)}
                          <span className="text-[11px] text-th-muted ml-2">({fmtPct(rc.trendPct)})</span>
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-bold tabular-nums ${revColor}`}>
                          {(rc.revenueChange || 0) > 0 ? '+' : ''}{fmt$(rc.revenueChange)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/analytics/denials/root-cause/claims?cause=${encodeURIComponent(rc.cause)}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors text-xs font-bold"
                          >
                            <span className="material-symbols-outlined text-sm">search</span>
                            Investigate
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default DenialTrends;
