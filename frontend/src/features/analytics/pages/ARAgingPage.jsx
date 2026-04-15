import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, BarChart, Bar, Cell, ReferenceLine,
} from 'recharts';
import { api } from '../../../services/api';
import { cn } from '../../../lib/utils';
import {
  AIInsightCard,
  KPICard,
  EmptyState,
  ErrorBanner,
  Skeleton,
} from '../../../components/ui';

/* ------------------------------------------------------------------ */
/* Formatters                                                          */
/* ------------------------------------------------------------------ */
const fmt = (n) => {
  if (n == null || isNaN(n)) return '—';
  const v = Number(n);
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${Math.round(v).toLocaleString()}`;
};
const fmtFull = (n) => (n == null || isNaN(n) ? '—' : `$${Math.round(Number(n)).toLocaleString()}`);
const fmtPct = (n, digits = 1) => (n == null || isNaN(n) ? '—' : `${Number(n).toFixed(digits)}%`);
const fmtNum = (n) => (n == null || isNaN(n) ? '—' : Number(n).toLocaleString());

const BUCKET_ORDER = ['0-30', '31-60', '61-90', '91-120', '120+'];

const BUCKET_COLORS = {
  '0-30':   { bg: 'bg-emerald-500', text: 'text-emerald-400', bar: '#10b981', border: 'border-emerald-500/30' },
  '31-60':  { bg: 'bg-lime-500',    text: 'text-lime-400',    bar: '#84cc16', border: 'border-lime-500/30' },
  '61-90':  { bg: 'bg-amber-500',   text: 'text-amber-400',   bar: '#f59e0b', border: 'border-amber-500/30' },
  '91-120': { bg: 'bg-orange-500',  text: 'text-orange-400',  bar: '#f97316', border: 'border-orange-500/30' },
  '120+':   { bg: 'bg-red-500',     text: 'text-red-400',     bar: '#ef4444', border: 'border-red-500/30' },
};

const DIMENSIONS = [
  { id: 'payer',          label: 'By Payer',          icon: 'business' },
  { id: 'provider',       label: 'By Provider',       icon: 'medical_services' },
  { id: 'specialty',      label: 'By Specialty',      icon: 'stethoscope' },
  { id: 'insurance_type', label: 'By Insurance Type', icon: 'shield' },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function buildCsvFromRows(rows, columns) {
  if (!rows || !rows.length) return '';
  const head = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const body = rows.map(r =>
    columns.map(c => {
      const v = c.accessor(r);
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    }).join(',')
  );
  return [head, ...body].join('\n');
}

function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export function ARAgingPage() {
  const navigate = useNavigate();

  // Core data
  const [summary, setSummary]               = useState(null);
  const [trend, setTrend]                   = useState([]);
  const [agingRootCause, setAgingRootCause] = useState(null);
  const [arRevenueRatio, setArRevenueRatio] = useState(null);
  const [dsoData, setDsoData]               = useState(null);
  const [forecast, setForecast]             = useState(null);
  const [waterfall, setWaterfall]           = useState(null);
  const [cohorts, setCohorts]               = useState(null);
  const [aiInsights, setAiInsights]         = useState([]);
  const [preventionData, setPreventionData] = useState(null);

  // Dimension breakdown
  const [dimension, setDimension]           = useState('payer');
  const [dimensionData, setDimensionData]   = useState(null);
  const [dimensionLoading, setDimensionLoading] = useState(false);

  // Drill-down drawer
  const [drillContext, setDrillContext]     = useState(null); // {bucket, dimensionValue}
  const [drillData, setDrillData]           = useState(null);
  const [drillLoading, setDrillLoading]     = useState(false);

  // Page state
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);

  /* ----- initial load ----- */
  const loadCore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [arSummary, arTrend, arRootCause, arRatio, dso, fc, wf, ch] = await Promise.all([
        api.ar.getSummary().catch(() => null),
        api.ar.getTrend().catch(() => ({ trend: [] })),
        api.ar.getAgingRootCause().catch(() => null),
        api.ar.getArToRevenueRatio().catch(() => null),
        api.finance?.getDso ? api.finance.getDso().catch(() => null) : Promise.resolve(null),
        api.ar.getForecast({ days: 30 }).catch(() => null),
        api.ar.getWriteOffWaterfall({ days: 90 }).catch(() => null),
        api.ar.getCohortAnalysis({ months: 6 }).catch(() => null),
      ]);
      if (arSummary)   setSummary(arSummary);
      if (arTrend?.trend) setTrend(arTrend.trend);
      if (arRootCause) setAgingRootCause(arRootCause);
      setArRevenueRatio(arRatio);
      setDsoData(dso);
      setForecast(fc);
      setWaterfall(wf);
      setCohorts(ch);
    } catch (e) {
      setError(e?.message || 'Failed to load AR analytics.');
    } finally {
      setLoading(false);
    }

    // Non-blocking: AI insights + prevention scan
    api.ai.getInsights('ar').then(res => {
      if (res?.insights?.length) setAiInsights(res.insights);
    }).catch(() => {});
    api.prevention.scan(3).then(d => setPreventionData(d)).catch(() => null);
  }, []);

  useEffect(() => { loadCore(); }, [loadCore]);

  /* ----- dimension breakdown ----- */
  const loadDimension = useCallback(async (dim) => {
    setDimensionLoading(true);
    try {
      const data = await api.ar.getAging({ dimension: dim, page: 1, size: 100 });
      setDimensionData(data);
    } catch (e) {
      setDimensionData({ items: [], total: 0, dimension: dim });
    } finally {
      setDimensionLoading(false);
    }
  }, []);

  useEffect(() => { loadDimension(dimension); }, [dimension, loadDimension]);

  /* ----- drill-down (claim list) ----- */
  const openDrill = useCallback(async ({ bucket, dimensionValue, payerId }) => {
    setDrillContext({ bucket, dimensionValue, payerId });
    setDrillLoading(true);
    try {
      const data = await api.ar.getAging({
        dimension,
        bucket,
        payer_id: payerId,
        page: 1,
        size: 50,
      });
      setDrillData(data);
    } catch {
      setDrillData({ items: [], total: 0 });
    } finally {
      setDrillLoading(false);
    }
  }, [dimension]);

  const closeDrill = () => { setDrillContext(null); setDrillData(null); };

  /* ----- export current view ----- */
  const handleExport = useCallback(() => {
    if (!dimensionData?.items?.length) return;
    const cols = [
      { label: dimensionLabel(dimension), accessor: r => r.name || r.label || r.id || '' },
      { label: '0-30',    accessor: r => bucketAmount(r, '0-30') },
      { label: '31-60',   accessor: r => bucketAmount(r, '31-60') },
      { label: '61-90',   accessor: r => bucketAmount(r, '61-90') },
      { label: '91-120',  accessor: r => bucketAmount(r, '91-120') },
      { label: '120+',    accessor: r => bucketAmount(r, '120+') },
      { label: 'Total',   accessor: r => r.total ?? rowTotal(r) },
      { label: 'Claims',  accessor: r => r.count ?? r.claim_count ?? '' },
    ];
    const csv = buildCsvFromRows(dimensionData.items, cols);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`ar-aging-${dimension}-${stamp}.csv`, csv);
  }, [dimension, dimensionData]);

  /* ----- derived KPIs ----- */
  const buckets       = summary?.buckets || [];
  const totalAR       = summary?.total_ar || 0;
  const totalClaims   = summary?.total_claims || 0;
  const avgDays       = summary?.avg_days || 0;
  const dsoVal        = dsoData?.dso ?? dsoData?.value ?? null;
  const dsoTrend      = dsoData?.trend_pct ?? dsoData?.delta_pct ?? null;
  const ratioVal      = arRevenueRatio?.ratio ?? arRevenueRatio?.value ?? null;
  const ratioTrend    = arRevenueRatio?.trend_pct ?? arRevenueRatio?.delta_pct ?? null;
  const recovery30    = summary?.recovery_rate_30d ?? arRevenueRatio?.recovery_rate_30d ?? null;
  const writeOffRate  = waterfall?.write_off_rate ?? waterfall?.summary?.write_off_rate ?? null;
  const forecastTotal = forecast?.total_predicted ?? forecast?.total ?? null;
  const forecastTrend = forecast?.trend_pct ?? forecast?.delta_pct ?? null;

  /* ----- early returns ----- */
  if (loading) return <PageSkeleton />;

  return (
    <div className="flex-1 overflow-y-auto p-6 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Page Title + Actions */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-th-heading tracking-tight">A/R Aging Intelligence</h1>
            <p className="text-xs text-th-muted mt-1">Multi-dimensional aging, cohort behavior, write-off disposition, and 30-day collection forecast.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={!dimensionData?.items?.length}
              className={cn(
                'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold',
                'bg-th-surface-raised border border-th-border text-th-secondary',
                'hover:border-th-border-strong hover:text-th-heading transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary'
              )}
              title="Download current dimension breakdown as CSV"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Export AR Report
            </button>
            <button
              type="button"
              onClick={() => loadCore()}
              className={cn(
                'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold',
                'bg-th-surface-raised border border-th-border text-th-secondary',
                'hover:border-th-border-strong hover:text-th-heading transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary'
              )}
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Refresh
            </button>
          </div>
        </div>

        {/* Optional global error */}
        {error && (
          <ErrorBanner
            title="Some AR analytics could not load"
            message={error}
            onRetry={loadCore}
          />
        )}

        {/* ── KPI ROW (6 cards) ─────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard
            color="primary"
            icon="account_balance"
            label="Total A/R"
            value={totalAR ? fmt(totalAR) : '—'}
            sublabel={totalClaims ? `${fmtNum(totalClaims)} claims` : 'No claims'}
          />
          <KPICard
            color="warning"
            icon="schedule"
            label="Avg DSO"
            value={dsoVal != null ? `${Math.round(dsoVal)}d` : (avgDays ? `${Math.round(avgDays)}d` : '—')}
            trend={dsoTrend != null ? `${Math.abs(dsoTrend).toFixed(1)}%` : null}
            trendDirection={dsoTrend != null ? (dsoTrend > 0 ? 'up' : 'down') : undefined}
            variant="inverse"
            sublabel="Days sales outstanding"
          />
          <KPICard
            color="info"
            icon="percent"
            label="A/R-to-Revenue"
            value={ratioVal != null ? `${(ratioVal * (Math.abs(ratioVal) <= 1 ? 100 : 1)).toFixed(1)}%` : '—'}
            trend={ratioTrend != null ? `${Math.abs(ratioTrend).toFixed(1)}%` : null}
            trendDirection={ratioTrend != null ? (ratioTrend > 0 ? 'up' : 'down') : undefined}
            variant="inverse"
            sublabel="Benchmark: < 35%"
          />
          <KPICard
            color="success"
            icon="trending_up"
            label="Recovery 30d"
            value={recovery30 != null ? fmtPct(recovery30 * (recovery30 <= 1 ? 100 : 1)) : '—'}
            sublabel="Paid within 30 days"
          />
          <KPICard
            color="danger"
            icon="block"
            label="Write-off Rate 90d"
            value={writeOffRate != null ? fmtPct(writeOffRate * (writeOffRate <= 1 ? 100 : 1)) : '—'}
            sublabel="$ written off / total AR"
          />
          <KPICard
            color="primary"
            icon="insights"
            label="Forecast 30d Coll."
            value={forecastTotal != null ? fmt(forecastTotal) : '—'}
            trend={forecastTrend != null ? `${Math.abs(forecastTrend).toFixed(1)}%` : null}
            trendDirection={forecastTrend != null ? (forecastTrend > 0 ? 'up' : 'down') : undefined}
            sublabel="Predicted collection"
          />
        </div>

        {/* ── Prevention Banner ──────────────────────────────────── */}
        {preventionData && (preventionData.total > 0 || preventionData.alerts?.length > 0) && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs">
            <span className="material-symbols-outlined text-amber-400 text-sm">shield</span>
            <span className="font-bold text-amber-400 tabular-nums">
              {preventionData.total || preventionData.alerts?.length || 0}
            </span>
            <span className="text-th-secondary">preventable claims may be contributing to A/R aging</span>
          </div>
        )}

        {/* ── Dimension Selector ─────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-th-muted mr-1">Dimension</span>
          {DIMENSIONS.map(d => {
            const active = dimension === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDimension(d.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[11px] font-semibold',
                  'transition-colors duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary',
                  active
                    ? 'bg-th-primary text-white border border-th-primary'
                    : 'bg-th-surface-raised text-th-secondary border border-th-border hover:border-th-border-strong hover:text-th-heading'
                )}
              >
                <span className="material-symbols-outlined text-[14px]">{d.icon}</span>
                {d.label}
              </button>
            );
          })}
        </div>

        {/* ── Aging Bucket Chart + Detail Cards ─────────────────── */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-th-heading">A/R Aging Distribution</h3>
              <p className="text-[10px] text-th-muted mt-1">Click any bucket to drill into the underlying claims.</p>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border bg-sky-500/10 text-sky-400 border-sky-500/20">
              Live Data
            </span>
          </div>

          {buckets.length === 0 ? (
            <EmptyState
              icon="hourglass_empty"
              title="No aging data"
              description="The AR summary endpoint returned no buckets. Verify the data pipeline."
            />
          ) : (
            <>
              <BucketStackedBar
                buckets={buckets}
                totalAR={totalAR}
                onBucketClick={(b) => openDrill({ bucket: b })}
              />

              {/* Bucket Detail Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
                {BUCKET_ORDER.map(key => {
                  const b = buckets.find(x => x.bucket === key) || { bucket: key, balance: 0, count: 0, pct: 0 };
                  const colors = BUCKET_COLORS[b.bucket];
                  const recovery = b.recovery_rate ?? null;
                  const avgDaysB = b.avg_days ?? null;
                  return (
                    <button
                      key={b.bucket}
                      type="button"
                      onClick={() => openDrill({ bucket: b.bucket })}
                      className={cn(
                        'text-left rounded-xl border bg-th-surface-overlay/30 p-4 transition-all',
                        'hover:border-th-border-strong hover:bg-th-surface-overlay/60',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary',
                        colors.border
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn('size-2.5 rounded-full shrink-0', colors.bg)} />
                        <span className="text-[11px] font-bold text-th-muted uppercase">{b.bucket} Days</span>
                      </div>
                      <p className="text-lg font-bold text-th-heading tabular-nums">{fmt(b.balance)}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-th-secondary tabular-nums">{fmtNum(b.count)} claims</span>
                        <span className={cn('text-[10px] font-bold tabular-nums', colors.text)}>
                          {b.pct != null ? `${Number(b.pct).toFixed(1)}%` : '—'}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-th-border/60 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <p className="text-th-muted">Avg Days</p>
                          <p className="text-th-heading font-semibold tabular-nums">{avgDaysB != null ? Math.round(avgDaysB) : '—'}</p>
                        </div>
                        <div>
                          <p className="text-th-muted">Recovery</p>
                          <p className="text-th-heading font-semibold tabular-nums">
                            {recovery != null ? fmtPct(recovery * (recovery <= 1 ? 100 : 1)) : '—'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Dimension Breakdown Table ─────────────────────────── */}
        <DimensionBreakdownTable
          dimension={dimension}
          loading={dimensionLoading}
          data={dimensionData}
          totalAR={totalAR}
          onRowClick={(row) => openDrill({
            bucket: undefined,
            dimensionValue: row.name || row.label,
            payerId: dimension === 'payer' ? (row.id || row.payer_id || row.name) : undefined,
          })}
        />

        {/* ── Cohort + Forecast Side-by-Side ─────────────────────── */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-7 bg-th-surface-raised border border-th-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-th-heading">Cohort Aging Behavior</h3>
                <p className="text-[10px] text-th-muted mt-1">% of each submission cohort still unpaid at 30/60/90 days.</p>
              </div>
              <span className="text-[10px] text-th-muted">Last 6 months</span>
            </div>
            <CohortChart cohorts={cohorts} />
          </div>

          <div className="col-span-12 lg:col-span-5 bg-th-surface-raised border border-th-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-th-heading">30-Day Collection Forecast</h3>
                <p className="text-[10px] text-th-muted mt-1">Predicted dollars collectible in the next 30 days.</p>
              </div>
            </div>
            <ForecastPanel forecast={forecast} />
          </div>
        </div>

        {/* ── Write-off Waterfall ────────────────────────────────── */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-th-heading">A/R Disposition (Last 90 Days)</h3>
              <p className="text-[10px] text-th-muted mt-1">How starting AR was resolved: collected, recovered, written off, adjusted.</p>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border bg-violet-500/10 text-violet-400 border-violet-500/20">
              Waterfall
            </span>
          </div>
          <WriteOffWaterfall waterfall={waterfall} />
        </div>

        {/* ── 12-month AR Trend ─────────────────────────────────── */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-th-heading">12-Month A/R Trend</h3>
              <p className="text-[10px] text-th-muted mt-1">Total accounts receivable over time.</p>
            </div>
          </div>
          <ARTrendChart trend={trend} />
        </div>

        {/* ── Why Is AR Aging? (existing root-cause section) ─────── */}
        {agingRootCause && <AgingRootCauseSection data={agingRootCause} navigate={navigate} />}

        {/* ── AI Insights ───────────────────────────────────────── */}
        {aiInsights.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-purple-400 text-base">auto_awesome</span>
              <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">AI Insights</span>
              <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1">
                Live
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {aiInsights.slice(0, 3).map((ins, i) => (
                <AIInsightCard
                  key={i}
                  title={ins.title}
                  description={ins.body || ins.description}
                  confidence={ins.confidence || (ins.badge === 'Prescriptive' ? 92 : ins.badge === 'Predictive' ? 85 : 78)}
                  impact={ins.severity === 'critical' ? 'high' : ins.severity === 'warning' ? 'high' : 'medium'}
                  category={ins.badge || ins.category || 'Diagnostic'}
                  action="Review"
                  value={ins.value || ''}
                  icon={ins.icon || (ins.badge === 'Prescriptive' ? 'gavel' : 'trending_up')}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Drill-down Drawer ──────────────────────────────────── */}
      {drillContext && (
        <DrillDrawer
          context={drillContext}
          loading={drillLoading}
          data={drillData}
          onClose={closeDrill}
          onOpenClaim={(claimId) => navigate(`/claims/${claimId}`)}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/* SECTION COMPONENTS                                                   */
/* ================================================================== */

function PageSkeleton() {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-72" />
            <Skeleton className="h-3 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-th-surface-raised border border-th-border rounded-lg p-4 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
          <Skeleton className="h-4 w-48 mb-6" />
          <Skeleton className="h-10 w-full mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-12 gap-6">
          <Skeleton className="col-span-12 lg:col-span-7 h-72" />
          <Skeleton className="col-span-12 lg:col-span-5 h-72" />
        </div>
      </div>
    </div>
  );
}

/* ----- Stacked Horizontal Bar ----- */
function BucketStackedBar({ buckets, totalAR, onBucketClick }) {
  const ordered = BUCKET_ORDER.map(k => buckets.find(b => b.bucket === k)).filter(Boolean);
  const totalSafe = totalAR || ordered.reduce((s, b) => s + (b.balance || 0), 0) || 1;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[480px]">
        <div className="w-full h-12 rounded-lg overflow-hidden flex">
          {ordered.map(b => {
            const colors = BUCKET_COLORS[b.bucket] || { bg: 'bg-gray-500' };
            const pct = b.pct != null ? b.pct : (b.balance / totalSafe) * 100;
            const widthPct = Math.max(pct, pct > 0 ? 1.5 : 0);
            return (
              <button
                key={b.bucket}
                type="button"
                onClick={() => onBucketClick && onBucketClick(b)}
                title={`${b.bucket}d • ${fmtFull(b.balance)} • ${fmtNum(b.count)} claims • ${Number(pct).toFixed(1)}%`}
                className={cn(
                  'h-full relative group transition-all duration-150',
                  'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-white/60 focus:z-10',
                  colors.bg
                )}
                style={{ width: `${widthPct}%` }}
              >
                {pct >= 7 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/95">
                    {Number(pct).toFixed(1)}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[10px] text-th-muted mt-2 px-1">
          <span>0d</span>
          <span>30d</span>
          <span>60d</span>
          <span>90d</span>
          <span>120d</span>
          <span>120d+</span>
        </div>
      </div>
    </div>
  );
}

/* ----- Dimension Breakdown Table ----- */
function DimensionBreakdownTable({ dimension, loading, data, totalAR, onRowClick }) {
  const items = data?.items || [];
  const dimLabel = dimensionLabel(dimension);

  return (
    <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-th-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-th-heading">{dimLabel} Aging Breakdown</h3>
          <p className="text-[10px] text-th-muted mt-1">Aging buckets pivoted by {dimLabel.toLowerCase()}.</p>
        </div>
        {loading && (
          <span className="inline-flex items-center gap-1.5 text-[10px] text-th-muted">
            <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
            Loading
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0f1623] text-th-muted text-[10px] font-bold uppercase tracking-widest border-b border-th-border">
            <tr>
              <th className="p-3">{dimLabel}</th>
              {BUCKET_ORDER.map(k => (
                <th key={k} className="p-3 text-right">{k}</th>
              ))}
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Claims</th>
              <th className="p-3 text-right">% AR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-th-border">
            {loading && items.length === 0 && Array.from({ length: 5 }).map((_, i) => (
              <tr key={`s${i}`}>
                {Array.from({ length: 9 }).map((_, j) => (
                  <td key={j} className="p-3"><Skeleton className="h-3 w-full" /></td>
                ))}
              </tr>
            ))}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={9} className="p-0">
                  <EmptyState
                    icon="search_off"
                    title={`No ${dimLabel.toLowerCase()} breakdown available`}
                    description="The backend dimension endpoint returned no rows for this dimension."
                  />
                </td>
              </tr>
            )}

            {items.map((row, i) => {
              const total = row.total ?? rowTotal(row);
              const pctOfAR = totalAR > 0 ? (total / totalAR) * 100 : 0;
              const claimCount = row.count ?? row.claim_count ?? 0;
              return (
                <tr
                  key={i}
                  onClick={() => onRowClick(row)}
                  className="hover:bg-th-surface-overlay/50 transition-colors cursor-pointer"
                >
                  <td className="p-3 font-semibold text-th-heading">{row.name || row.label || row.id || '—'}</td>
                  {BUCKET_ORDER.map(k => (
                    <td key={k} className="p-3 text-right font-mono tabular-nums text-th-secondary">
                      {fmt(bucketAmount(row, k))}
                    </td>
                  ))}
                  <td className="p-3 text-right font-mono font-bold text-th-heading tabular-nums">{fmt(total)}</td>
                  <td className="p-3 text-right text-th-secondary tabular-nums">{fmtNum(claimCount)}</td>
                  <td className="p-3 text-right tabular-nums">
                    <span className={cn('font-bold', pctOfAR > 20 ? 'text-amber-400' : 'text-th-secondary')}>
                      {pctOfAR.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ----- Cohort Line Chart ----- */
function CohortChart({ cohorts }) {
  const data = useMemo(() => normalizeCohorts(cohorts), [cohorts]);

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon="show_chart"
        title="No cohort data"
        description="Cohort analysis endpoint returned no data."
      />
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1f2937" strokeOpacity={0.4} vertical={false} />
          <XAxis dataKey="cohort" tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#334155" />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            stroke="#334155"
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 700 }}
            formatter={(v) => `${Number(v).toFixed(1)}%`}
          />
          <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
          <Line type="monotone" dataKey="unpaid_30d" name="Unpaid @30d" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="unpaid_60d" name="Unpaid @60d" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="unpaid_90d" name="Unpaid @90d" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function normalizeCohorts(cohorts) {
  if (!cohorts) return [];
  const arr = cohorts.cohorts || cohorts.items || cohorts.data || cohorts;
  if (!Array.isArray(arr)) return [];
  return arr.map(c => ({
    cohort: c.cohort || c.month || c.label || '',
    unpaid_30d: scalePct(c.unpaid_30d ?? c.pct_unpaid_30d ?? c['30d']),
    unpaid_60d: scalePct(c.unpaid_60d ?? c.pct_unpaid_60d ?? c['60d']),
    unpaid_90d: scalePct(c.unpaid_90d ?? c.pct_unpaid_90d ?? c['90d']),
  })).filter(r => r.cohort);
}

function scalePct(v) {
  if (v == null || isNaN(v)) return null;
  const n = Number(v);
  return Math.abs(n) <= 1 ? n * 100 : n;
}

/* ----- Forecast Panel (gauge + bucket breakdown) ----- */
function ForecastPanel({ forecast }) {
  if (!forecast) {
    return (
      <EmptyState
        icon="insights"
        title="No forecast available"
        description="Collection forecast endpoint did not return data."
      />
    );
  }

  const total = forecast.total_predicted ?? forecast.total ?? 0;
  const target = forecast.target ?? forecast.expected_total ?? total * 1.2;
  const confidence = forecast.confidence ?? forecast.confidence_pct ?? null;
  const buckets = forecast.by_bucket || forecast.buckets || [];
  const pctOfTarget = target > 0 ? Math.min((total / target) * 100, 100) : 0;

  return (
    <div className="space-y-5">
      {/* Gauge */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-th-muted">Predicted</span>
          <span className="text-2xl font-bold text-th-heading tabular-nums">{fmt(total)}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-th-surface-overlay overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all"
            style={{ width: `${pctOfTarget}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-th-muted mt-1.5">
          <span>{pctOfTarget.toFixed(0)}% of target</span>
          {confidence != null && <span>Confidence: {(confidence * (confidence <= 1 ? 100 : 1)).toFixed(0)}%</span>}
        </div>
      </div>

      {/* Bucket breakdown */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted mb-2">Yield by Aging Bucket</p>
        {buckets.length === 0 ? (
          <p className="text-[11px] text-th-muted italic">No bucket-level forecast.</p>
        ) : (
          <div className="space-y-2">
            {buckets.map((b, i) => {
              const colors = BUCKET_COLORS[b.bucket] || { bg: 'bg-gray-500', text: 'text-gray-400' };
              const yield_ = b.predicted ?? b.yield ?? b.amount ?? 0;
              const prob = b.probability ?? b.recovery_pct ?? null;
              return (
                <div key={i} className="flex items-center gap-3 text-[11px]">
                  <span className={cn('size-2 rounded-full shrink-0', colors.bg)} />
                  <span className="font-semibold text-th-secondary w-16">{b.bucket}d</span>
                  <span className="font-bold text-th-heading tabular-nums flex-1">{fmt(yield_)}</span>
                  {prob != null && (
                    <span className={cn('text-[10px] font-bold tabular-nums', colors.text)}>
                      {(prob * (prob <= 1 ? 100 : 1)).toFixed(0)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ----- Write-off Waterfall ----- */
function WriteOffWaterfall({ waterfall }) {
  const data = useMemo(() => buildWaterfallSeries(waterfall), [waterfall]);
  const reasons = waterfall?.by_reason || waterfall?.top_reasons || [];

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon="waterfall_chart"
        title="No write-off data"
        description="The write-off waterfall endpoint returned no data."
      />
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1f2937" strokeOpacity={0.4} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#334155" />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                stroke="#334155"
                tickFormatter={(v) => fmt(v)}
              />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: '#e2e8f0', fontWeight: 700 }}
                formatter={(v, n, p) => [fmtFull(p?.payload?.delta ?? v), p?.payload?.label]}
              />
              {/* Floating bars: invisible base + visible delta */}
              <Bar dataKey="base" stackId="wf" fill="transparent" />
              <Bar dataKey="value" stackId="wf">
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
              <ReferenceLine y={0} stroke="#475569" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-th-muted mb-2">Top Write-off Reasons</p>
        {reasons.length === 0 ? (
          <p className="text-[11px] text-th-muted italic">No reason breakdown available.</p>
        ) : (
          <div className="rounded-lg border border-th-border overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f1623] text-th-muted text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="p-2">Reason</th>
                  <th className="p-2 text-right">Amount</th>
                  <th className="p-2 text-right">Claims</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {reasons.slice(0, 8).map((r, i) => (
                  <tr key={i} className="hover:bg-th-surface-overlay/50">
                    <td className="p-2 font-semibold text-th-heading">{r.reason || r.name || r.label || '—'}</td>
                    <td className="p-2 text-right font-mono tabular-nums text-th-heading">{fmt(r.amount ?? r.total ?? 0)}</td>
                    <td className="p-2 text-right text-th-secondary tabular-nums">{fmtNum(r.count ?? r.claim_count ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function buildWaterfallSeries(wf) {
  if (!wf) return [];
  const start    = wf.starting_ar     ?? wf.start            ?? 0;
  const collected = wf.collected      ?? wf.paid             ?? 0;
  const recovered = wf.appeals_recovered ?? wf.recovered     ?? 0;
  const written   = wf.written_off    ?? wf.write_offs       ?? 0;
  const adjusted  = wf.adjusted       ?? wf.adjustments      ?? 0;
  const ending    = wf.ending_ar      ?? wf.end ?? (start - collected - recovered - written - adjusted);

  // For waterfall: compute running base
  const series = [];
  let running = 0;

  // Total bar (anchor)
  series.push({ label: 'Starting AR', value: start, base: 0, color: '#3b82f6', delta: start });
  running = start;

  // Collected (negative move)
  running -= collected;
  series.push({ label: 'Collected', value: collected, base: running, color: '#10b981', delta: -collected });

  // Recovered (negative move)
  running -= recovered;
  series.push({ label: 'Appeals Recovered', value: recovered, base: running, color: '#22d3ee', delta: -recovered });

  // Written off (negative move)
  running -= written;
  series.push({ label: 'Written Off', value: written, base: running, color: '#ef4444', delta: -written });

  // Adjusted
  running -= adjusted;
  series.push({ label: 'Adjusted', value: adjusted, base: running, color: '#f59e0b', delta: -adjusted });

  // Ending anchor
  series.push({ label: 'Ending AR', value: Math.max(running, 0), base: 0, color: '#8b5cf6', delta: ending });

  return series;
}

/* ----- AR Trend Chart (recharts area) ----- */
function ARTrendChart({ trend }) {
  if (!trend || trend.length === 0) {
    return <EmptyState icon="show_chart" title="No trend data" description="The AR trend endpoint returned no months." />;
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trend} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="arTrendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1f2937" strokeOpacity={0.4} vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#334155" />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#334155" tickFormatter={(v) => fmt(v)} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
            formatter={(v) => fmtFull(v)}
          />
          <Area type="monotone" dataKey="total_ar" name="Total A/R" stroke="#3b82f6" strokeWidth={2.5} fill="url(#arTrendGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ----- Drill Drawer ----- */
function DrillDrawer({ context, loading, data, onClose, onOpenClaim }) {
  const items = data?.items || [];
  const headerLabel = (() => {
    const parts = [];
    if (context.bucket) parts.push(`Bucket ${context.bucket}d`);
    if (context.dimensionValue) parts.push(context.dimensionValue);
    return parts.join(' • ') || 'AR Claims';
  })();

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="ml-auto relative h-full w-full max-w-2xl bg-th-surface-base border-l border-th-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-th-border">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-th-muted">Drill-down</p>
            <h3 className="text-sm font-bold text-th-heading truncate">{headerLabel}</h3>
            {data?.total != null && (
              <p className="text-[10px] text-th-muted mt-0.5">{fmtNum(data.total)} matching claims</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'h-8 w-8 inline-flex items-center justify-center rounded-md',
              'text-th-muted hover:text-th-heading hover:bg-th-surface-overlay',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary'
            )}
            aria-label="Close drawer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-5 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <EmptyState
              icon="search_off"
              title="No claims found"
              description="No claims match this drill-down filter."
            />
          )}

          {!loading && items.length > 0 && (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f1623] text-th-muted text-[10px] font-bold uppercase tracking-widest sticky top-0 z-10">
                <tr>
                  <th className="p-3">Claim</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Payer</th>
                  <th className="p-3 text-right">Billed</th>
                  <th className="p-3 text-right">Days</th>
                  <th className="p-3">Last Action</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {items.map((c, i) => (
                  <tr key={i} className="hover:bg-th-surface-overlay/40 transition-colors">
                    <td className="p-3 font-mono font-semibold text-th-heading">{c.claim_id || c.id || '—'}</td>
                    <td className="p-3 text-th-secondary">{c.patient || c.patient_name || '—'}</td>
                    <td className="p-3 text-th-secondary">{c.payer || c.payer_name || '—'}</td>
                    <td className="p-3 text-right font-mono tabular-nums text-th-heading">{fmt(c.billed ?? c.amount ?? 0)}</td>
                    <td className="p-3 text-right tabular-nums">
                      <span className={cn('font-bold', (c.days_old ?? 0) > 90 ? 'text-red-400' : (c.days_old ?? 0) > 60 ? 'text-amber-400' : 'text-th-secondary')}>
                        {c.days_old ?? c.age_days ?? '—'}
                      </span>
                    </td>
                    <td className="p-3 text-th-muted text-[10px]">{c.last_action || c.last_status || '—'}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenClaim(c.claim_id || c.id)}
                        className={cn(
                          'inline-flex items-center gap-1 h-7 px-2 rounded-md text-[10px] font-semibold',
                          'border border-th-border text-th-secondary hover:border-th-border-strong hover:text-th-heading',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary'
                        )}
                      >
                        Open
                        <span className="material-symbols-outlined text-[12px]">arrow_outward</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Existing root-cause section (preserved)                              */
/* ================================================================== */
const ROOT_CAUSE_GROUP_COLORS = {
  PROCESS:     { bar: '#3b82f6', bg: 'bg-blue-500/15',   text: 'text-blue-400',   border: 'border-blue-500/30' },
  PREVENTABLE: { bar: '#f59e0b', bg: 'bg-amber-500/15',  text: 'text-amber-400',  border: 'border-amber-500/30' },
  PAYER:       { bar: '#ef4444', bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/30' },
  CLINICAL:    { bar: '#8b5cf6', bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
};

const STATUS_DESCRIPTIONS = {
  DRAFT: 'Never submitted properly',
  DENIED: 'Denied but not appealed/resolved',
  SUBMITTED: 'Submitted but no response',
  ACKNOWLEDGED: 'Acknowledged but not adjudicated',
  APPEALED: 'Under appeal',
};

const STATUS_COLORS = {
  DRAFT: { bg: 'bg-slate-500', accent: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  DENIED: { bg: 'bg-red-500', accent: 'bg-red-500/15 text-red-400 border-red-500/30' },
  SUBMITTED: { bg: 'bg-blue-500', accent: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  ACKNOWLEDGED: { bg: 'bg-amber-500', accent: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  APPEALED: { bg: 'bg-violet-500', accent: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
};

function AgingRootCauseSection({ data }) {
  const navigate = useNavigate();
  const { aging_by_status = [], aging_by_root_cause = [], aging_by_payer = [], no_era_received, summary: rcSummary } = data;
  const maxRcImpact = Math.max(...aging_by_root_cause.map(r => r.impact), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-bold text-th-heading tracking-tight">Why Is A/R Aging?</h2>
        <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse">
          Live
        </span>
        {rcSummary && (
          <span className="ml-auto text-[11px] text-th-muted">
            {rcSummary.preventable_pct}% of root causes are <span className="text-amber-400 font-semibold">preventable</span>
          </span>
        )}
      </div>

      <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-th-heading">Aging by Claim Status</h3>
            <p className="text-[10px] text-th-muted mt-1">Claims stuck in each lifecycle stage</p>
          </div>
          <span className="material-symbols-outlined text-th-muted text-lg">assignment_late</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {aging_by_status.slice(0, 4).map(s => {
            const colors = STATUS_COLORS[s.status] || STATUS_COLORS.DRAFT;
            return (
              <div
                key={s.status}
                className="rounded-xl border border-th-border bg-th-surface-overlay/30 p-4 cursor-pointer hover:border-primary/50 hover:bg-th-surface-overlay/60 transition-all"
                onClick={() => navigate(`/analytics/denials/root-cause/claims?status=${s.status}`)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn('size-2.5 rounded-full shrink-0', colors.bg)} />
                  <span className="text-[11px] font-bold text-th-muted uppercase">{s.status}</span>
                </div>
                <p className="text-lg font-bold text-th-heading tabular-nums">{fmt(s.total_amount)}</p>
                <p className="text-[10px] text-th-secondary tabular-nums mt-1">{s.count.toLocaleString()} claims &middot; avg {s.avg_age_days}d</p>
                <p className="text-[10px] text-th-muted mt-1.5 italic">{STATUS_DESCRIPTIONS[s.status] || ''}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 bg-th-surface-raised border border-th-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-th-heading">Root Cause of Aging</h3>
              <p className="text-[10px] text-th-muted mt-1">Why claims remain unpaid — by dollar impact</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-blue-500" /> Process</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-500" /> Preventable</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-500" /> Payer</span>
            </div>
          </div>
          <div className="space-y-3">
            {aging_by_root_cause.map(rc => {
              const groupColors = ROOT_CAUSE_GROUP_COLORS[rc.group] || ROOT_CAUSE_GROUP_COLORS.PROCESS;
              const barPct = Math.max((rc.impact / maxRcImpact) * 100, 4);
              return (
                <div
                  key={rc.root_cause}
                  className="group cursor-pointer hover:bg-th-surface-overlay/30 rounded-lg p-1 -m-1 transition-all"
                  onClick={() => navigate(`/analytics/denials/root-cause/claims?cause=${rc.root_cause}`)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[11px] font-bold', groupColors.text)}>
                        {rc.root_cause.replace(/_/g, ' ')}
                      </span>
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded border font-semibold', groupColors.bg, groupColors.border)}>
                        {rc.group}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-th-heading tabular-nums">{fmt(rc.impact)}</span>
                  </div>
                  <div className="w-full h-5 rounded-md bg-th-surface-overlay/50 overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all duration-500 flex items-center pl-2"
                      style={{ width: `${barPct}%`, backgroundColor: groupColors.bar }}
                    >
                      <span className="text-[9px] font-bold text-white/90 whitespace-nowrap">{rc.count.toLocaleString()} claims</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-6">
          {no_era_received && no_era_received.count > 0 && (
            <div
              className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 cursor-pointer hover:border-red-500/40 transition-all"
              onClick={() => navigate('/analytics/denials/root-cause/claims?no_era=true')}
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-red-400 text-xl mt-0.5">warning</span>
                <div>
                  <h4 className="text-sm font-bold text-red-400 mb-1">No ERA Received</h4>
                  <p className="text-xs text-th-secondary leading-relaxed">
                    <span className="font-bold text-th-heading">{no_era_received.count.toLocaleString()}</span> claims worth{' '}
                    <span className="font-bold text-red-400">{fmt(no_era_received.total_amount)}</span> have been submitted but received{' '}
                    <span className="font-bold text-red-400">no payment response</span> from payers.
                  </p>
                  <p className="text-[10px] text-th-muted mt-2 italic">These need ERA follow-up or resubmission</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-th-border">
              <h3 className="text-sm font-bold text-th-heading">Top Slow Payers</h3>
              <p className="text-[10px] text-th-muted mt-1">Payers contributing most to aging AR</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0f1623] text-th-muted text-[10px] font-bold uppercase tracking-widest border-b border-th-border">
                  <tr>
                    <th className="p-3">Payer</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-right">Avg Days</th>
                    <th className="p-3 text-right">Claims</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-th-border">
                  {aging_by_payer.slice(0, 8).map((p, i) => (
                    <tr key={i} className="hover:bg-th-surface-overlay/50 transition-colors">
                      <td className="p-3 text-xs font-semibold text-th-heading">{p.payer_name}</td>
                      <td className="p-3 text-right text-xs font-mono font-medium text-th-heading tabular-nums">{fmt(p.total_amount)}</td>
                      <td className="p-3 text-right text-xs tabular-nums">
                        <span className={cn('font-bold', p.avg_age_days > 500 ? 'text-red-400' : p.avg_age_days > 300 ? 'text-amber-400' : 'text-th-secondary')}>
                          {p.avg_age_days}d
                        </span>
                      </td>
                      <td className="p-3 text-right text-xs text-th-secondary tabular-nums">{p.count.toLocaleString()}</td>
                    </tr>
                  ))}
                  {aging_by_payer.length === 0 && (
                    <tr><td colSpan={4} className="p-6 text-center text-xs text-th-muted">No payer data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Small helpers                                                        */
/* ================================================================== */
function dimensionLabel(d) {
  switch (d) {
    case 'payer':          return 'Payer';
    case 'provider':       return 'Provider';
    case 'specialty':      return 'Specialty';
    case 'insurance_type': return 'Insurance Type';
    default:               return 'Dimension';
  }
}

function bucketAmount(row, key) {
  if (!row) return 0;
  if (row.buckets) {
    const b = Array.isArray(row.buckets)
      ? row.buckets.find(x => x.bucket === key)
      : row.buckets[key];
    if (b) return typeof b === 'object' ? (b.balance ?? b.amount ?? 0) : Number(b) || 0;
  }
  return Number(row[key] ?? row[`bucket_${key}`] ?? 0);
}

function rowTotal(row) {
  return BUCKET_ORDER.reduce((sum, k) => sum + (Number(bucketAmount(row, k)) || 0), 0);
}

export default ARAgingPage;
