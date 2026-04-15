import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { api } from '../../../services/api';
import { cn } from '../../../lib/utils';
import {
    AIInsightCard,
    EmptyState,
    ErrorBanner,
    Skeleton,
    KPICard,
} from '../../../components/ui';
import {
    getSeriesColors,
    getGridProps,
    getChartTheme,
} from '../../../lib/chartTheme';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

const fmtMoney = (n) => {
    if (n === null || n === undefined || Number.isNaN(n)) return '—';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
    return `${sign}$${Math.round(abs).toLocaleString()}`;
};

const fmtSignedMoney = (n) => {
    if (n === null || n === undefined || Number.isNaN(n)) return '—';
    if (n === 0) return fmtMoney(0);
    return (n > 0 ? '+' : '') + fmtMoney(n);
};

const fmtNumber = (n, digits = 1) => {
    if (n === null || n === undefined || Number.isNaN(n)) return '—';
    return Number(n).toFixed(digits);
};

const fmtPct = (n, digits = 1) => {
    if (n === null || n === undefined || Number.isNaN(n)) return '—';
    return `${n > 0 ? '+' : ''}${Number(n).toFixed(digits)}%`;
};

const trendDirOf = (delta) => {
    if (delta === null || delta === undefined || Number.isNaN(delta)) return undefined;
    return delta >= 0 ? 'up' : 'down';
};

// Debounce hook
function useDebounced(value, delay = 350) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Drawer (right-side panel)                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function Drawer({ open, onClose, title, subtitle, children, width = 'w-[480px]' }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex">
            <div
                className="flex-1 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className={cn(
                    'h-full bg-th-surface-raised border-l border-th-border shadow-2xl flex flex-col',
                    width
                )}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <div className="flex items-start justify-between p-4 border-b border-th-border">
                    <div className="min-w-0">
                        <h2 className="text-base font-bold text-th-heading truncate">{title}</h2>
                        {subtitle && <p className="text-xs text-th-muted mt-0.5">{subtitle}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md text-th-muted hover:text-th-heading hover:bg-th-surface-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary"
                        aria-label="Close drawer"
                    >
                        <span className="material-symbols-outlined text-[18px] leading-none">close</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">{children}</div>
            </aside>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  KPI Strip                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function KpiStrip({ workingCapital, dso, dpo, onKpiClick }) {
    const wc = workingCapital || {};
    const cashOnHand = wc.cash_on_hand;
    const arBalance = wc.ar_balance;
    const workingCap = wc.working_capital;
    const cashRunway = wc.cash_runway_days;

    const dsoVal = dso?.dso;
    const dsoBenchmark = dso?.benchmark;
    const dsoDelta = dso?.delta_vs_prior;

    const dpoVal = dpo?.dpo;
    const dpoDelta = dpo?.delta_vs_prior;

    const cards = [
        {
            id: 'cash',
            label: 'Cash On Hand',
            value: fmtMoney(cashOnHand),
            sublabel: wc.cash_delta_label || 'Available liquidity',
            trend: wc.cash_delta_pct != null ? fmtPct(wc.cash_delta_pct) : null,
            trendDirection: trendDirOf(wc.cash_delta_pct),
            color: 'success',
            icon: 'account_balance',
        },
        {
            id: 'ar',
            label: 'AR Balance',
            value: fmtMoney(arBalance),
            sublabel: wc.ar_delta_label || 'Outstanding receivables',
            trend: wc.ar_delta_pct != null ? fmtPct(wc.ar_delta_pct) : null,
            trendDirection: trendDirOf(wc.ar_delta_pct),
            color: 'primary',
            icon: 'receipt_long',
            variant: 'inverse',
        },
        {
            id: 'wc',
            label: 'Working Capital',
            value: fmtMoney(workingCap),
            sublabel: wc.working_capital_delta_label || 'Cash + AR − Liabilities',
            trend: wc.working_capital_delta_pct != null ? fmtPct(wc.working_capital_delta_pct) : null,
            trendDirection: trendDirOf(wc.working_capital_delta_pct),
            color: 'info',
            icon: 'savings',
        },
        {
            id: 'dso',
            label: 'DSO',
            value: dsoVal != null ? `${fmtNumber(dsoVal, 0)}d` : '—',
            sublabel: dsoBenchmark != null ? `Benchmark: ${fmtNumber(dsoBenchmark, 0)}d` : 'Days sales outstanding',
            trend: dsoDelta != null ? fmtPct(dsoDelta) : null,
            trendDirection: trendDirOf(dsoDelta),
            color: dsoBenchmark != null && dsoVal > dsoBenchmark ? 'warning' : 'success',
            icon: 'schedule',
            variant: 'inverse',
        },
        {
            id: 'dpo',
            label: 'DPO (Payer Lag)',
            value: dpoVal != null ? `${fmtNumber(dpoVal, 0)}d` : '—',
            sublabel: dpo?.label || 'Avg payer payment lag',
            trend: dpoDelta != null ? fmtPct(dpoDelta) : null,
            trendDirection: trendDirOf(dpoDelta),
            color: 'warning',
            icon: 'hourglass_top',
            variant: 'inverse',
        },
        {
            id: 'runway',
            label: 'Cash Runway',
            value: cashRunway != null ? `${fmtNumber(cashRunway, 0)}d` : '—',
            sublabel: wc.runway_label || 'Days at current burn',
            trend: wc.runway_delta_pct != null ? fmtPct(wc.runway_delta_pct) : null,
            trendDirection: trendDirOf(wc.runway_delta_pct),
            color: cashRunway != null && cashRunway < 60 ? 'danger' : 'primary',
            icon: 'flight_takeoff',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {cards.map((c) => (
                <KPICard
                    key={c.id}
                    icon={c.icon}
                    label={c.label}
                    value={c.value}
                    sublabel={c.sublabel}
                    trend={c.trend}
                    trendDirection={c.trendDirection}
                    color={c.color}
                    variant={c.variant}
                    onClick={() => onKpiClick(c.id)}
                />
            ))}
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Cash Position Timeline (Recharts ComposedChart)                          */
/* ────────────────────────────────────────────────────────────────────────── */

function CashPositionTimeline({ data, range, onRangeChange, onDayClick, scenarioOverlay, loading, error, onRetry }) {
    const colors = getSeriesColors();
    const grid = getGridProps();
    const theme = getChartTheme();

    const merged = useMemo(() => {
        if (!data || !Array.isArray(data) || data.length === 0) return [];
        const scenarioMap = new Map();
        if (scenarioOverlay && Array.isArray(scenarioOverlay)) {
            scenarioOverlay.forEach((p) => scenarioMap.set(p.date, p));
        }
        return data.map((d) => ({
            date: d.date,
            projected: d.projected ?? null,
            confidence_low: d.confidence_low ?? null,
            confidence_high: d.confidence_high ?? null,
            confidence_band: (d.confidence_high != null && d.confidence_low != null)
                ? d.confidence_high - d.confidence_low
                : null,
            actual_era: d.actual_era ?? null,
            bank_deposited: d.bank_deposited ?? null,
            cumulative_balance: d.cumulative_balance ?? null,
            scenario: scenarioMap.get(d.date)?.projected ?? null,
        }));
    }, [data, scenarioOverlay]);

    return (
        <section className="bg-th-surface-raised border border-th-border rounded-xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                    <h3 className="text-sm font-bold text-th-heading">Daily Cash Position Timeline</h3>
                    <p className="text-[11px] text-th-muted mt-0.5">
                        Projected vs actual ERA vs bank deposits, with cumulative balance and confidence band
                    </p>
                </div>
                <div className="flex items-center gap-1 bg-th-surface-overlay rounded-lg p-0.5" role="tablist">
                    {[30, 60, 90].map((d) => (
                        <button
                            key={d}
                            type="button"
                            role="tab"
                            aria-selected={range === d}
                            onClick={() => onRangeChange(d)}
                            className={cn(
                                'h-7 px-3 text-[11px] font-semibold rounded-md transition-colors',
                                'focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary',
                                range === d
                                    ? 'bg-th-primary text-white'
                                    : 'text-th-muted hover:text-th-heading'
                            )}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {error && <ErrorBanner title="Cash flow data unavailable" message={error} onRetry={onRetry} className="mb-4" />}

            {loading ? (
                <Skeleton className="h-80 w-full rounded-lg" />
            ) : merged.length === 0 ? (
                <EmptyState
                    icon="show_chart"
                    title="No cash flow data yet"
                    description="Daily cash position timeline will appear once payment events arrive."
                />
            ) : (
                <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={merged}
                            onClick={(e) => {
                                if (e && e.activeLabel) onDayClick(e.activeLabel);
                            }}
                            margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="cashCumGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colors[2]} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={colors[2]} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid {...grid} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fill: theme.axis }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(s) => {
                                    const d = new Date(s);
                                    if (Number.isNaN(d.getTime())) return s;
                                    return `${d.getMonth() + 1}/${d.getDate()}`;
                                }}
                                minTickGap={24}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: theme.axis }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => fmtMoney(v)}
                                width={64}
                            />
                            <Tooltip
                                cursor={{ stroke: theme.axis, strokeDasharray: '3 3' }}
                                contentStyle={{
                                    backgroundColor: theme.tooltip.bg,
                                    border: `1px solid ${theme.tooltip.border}`,
                                    borderRadius: '8px',
                                    fontSize: 12,
                                }}
                                labelStyle={{ color: theme.tooltip.label, fontWeight: 600 }}
                                formatter={(val, name) => [val == null ? '—' : fmtMoney(val), name]}
                            />
                            <Legend
                                iconType="circle"
                                wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
                            />

                            {/* Cumulative balance area (amber) */}
                            <Area
                                type="monotone"
                                dataKey="cumulative_balance"
                                name="Cumulative Balance"
                                stroke={colors[2]}
                                fill="url(#cashCumGradient)"
                                strokeWidth={1.5}
                                isAnimationActive={false}
                            />

                            {/* Confidence band (transparent base + visible band) */}
                            <Area
                                type="monotone"
                                dataKey="confidence_low"
                                name="Confidence Low"
                                stackId="confidence"
                                stroke="transparent"
                                fill="transparent"
                                legendType="none"
                                isAnimationActive={false}
                            />
                            <Area
                                type="monotone"
                                dataKey="confidence_band"
                                name="Confidence Range (Low–High)"
                                stackId="confidence"
                                stroke="transparent"
                                fill={colors[0]}
                                fillOpacity={0.12}
                                isAnimationActive={false}
                            />

                            {/* Projected inflow (blue solid) */}
                            <Line
                                type="monotone"
                                dataKey="projected"
                                name="Projected (Mid)"
                                stroke={colors[0]}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />

                            {/* Actual ERA (green dashed) */}
                            <Line
                                type="monotone"
                                dataKey="actual_era"
                                name="Actual ERA"
                                stroke={colors[1]}
                                strokeDasharray="5 4"
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />

                            {/* Bank deposited (dark green solid) */}
                            <Line
                                type="monotone"
                                dataKey="bank_deposited"
                                name="Bank Deposited"
                                stroke="#0F7A55"
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />

                            {/* Scenario overlay (dotted purple) */}
                            <Line
                                type="monotone"
                                dataKey="scenario"
                                name="Scenario (What-if)"
                                stroke={colors[4]}
                                strokeDasharray="2 4"
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                                isAnimationActive={false}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Scenario Modeling Panel                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function ScenarioPanel({
    deltas,
    onDeltaChange,
    onReset,
    impact,
    loading,
    error,
}) {
    const sliders = [
        {
            key: 'denial_rate_delta',
            label: 'Denial Rate Change',
            min: -5,
            max: 5,
            step: 0.5,
            unit: '%',
            help: 'Pp change vs current denial rate',
        },
        {
            key: 'payer_lag_delta',
            label: 'Payer Lag Delta',
            min: -5,
            max: 10,
            step: 1,
            unit: ' days',
            help: 'Change in average payer payment lag',
        },
        {
            key: 'appeal_win_rate_delta',
            label: 'Appeal Win Rate Change',
            min: -5,
            max: 10,
            step: 0.5,
            unit: '%',
            help: 'Pp change vs current win rate',
        },
    ];

    const totalImpact = impact?.dollar_impact;
    const pctImpact = impact?.pct_impact;
    const horizon = impact?.horizon_days || 90;
    const isPos = totalImpact != null && totalImpact >= 0;

    return (
        <section className="bg-th-surface-raised border border-th-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-bold text-th-heading">Scenario Modeling</h3>
                    <p className="text-[11px] text-th-muted mt-0.5">What-if levers update the chart live</p>
                </div>
                <button
                    type="button"
                    onClick={onReset}
                    className={cn(
                        'inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-semibold',
                        'border border-th-border text-th-muted hover:text-th-heading hover:border-th-border-strong',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary'
                    )}
                >
                    <span className="material-symbols-outlined text-[14px] leading-none">restart_alt</span>
                    Reset
                </button>
            </div>

            <div className="space-y-4">
                {sliders.map((s) => {
                    const v = deltas[s.key] ?? 0;
                    return (
                        <div key={s.key}>
                            <div className="flex items-center justify-between mb-1">
                                <label htmlFor={`slider-${s.key}`} className="text-[11px] font-semibold text-th-heading">
                                    {s.label}
                                </label>
                                <span className="text-xs font-bold tabular-nums text-th-primary">
                                    {v > 0 ? '+' : ''}{v}{s.unit}
                                </span>
                            </div>
                            <input
                                id={`slider-${s.key}`}
                                type="range"
                                min={s.min}
                                max={s.max}
                                step={s.step}
                                value={v}
                                onChange={(e) => onDeltaChange(s.key, parseFloat(e.target.value))}
                                className={cn(
                                    'w-full h-1.5 rounded-full appearance-none bg-th-surface-overlay accent-th-primary cursor-pointer',
                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary focus-visible:ring-offset-2 focus-visible:ring-offset-th-surface-raised'
                                )}
                                aria-valuemin={s.min}
                                aria-valuemax={s.max}
                                aria-valuenow={v}
                            />
                            <div className="flex justify-between text-[9px] text-th-muted mt-0.5">
                                <span>{s.min}{s.unit}</span>
                                <span>{s.help}</span>
                                <span>+{s.max}{s.unit}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-5 border-t border-th-border pt-4">
                <p className="text-[10px] font-bold text-th-muted uppercase tracking-wider mb-1.5">
                    {horizon}-Day Impact
                </p>
                {error ? (
                    <p className="text-xs text-th-danger">{error}</p>
                ) : loading ? (
                    <Skeleton className="h-7 w-32" />
                ) : totalImpact == null ? (
                    <p className="text-xs text-th-muted">Adjust sliders to model impact</p>
                ) : (
                    <div className="flex items-baseline gap-2">
                        <span
                            className={cn(
                                'text-xl font-bold tabular-nums',
                                isPos ? 'text-th-success' : 'text-th-danger'
                            )}
                        >
                            {fmtSignedMoney(totalImpact)}
                        </span>
                        {pctImpact != null && (
                            <span
                                className={cn(
                                    'text-xs font-semibold tabular-nums',
                                    isPos ? 'text-th-success' : 'text-th-danger'
                                )}
                            >
                                ({fmtPct(pctImpact)})
                            </span>
                        )}
                    </div>
                )}
                {impact?.notes && (
                    <p className="text-[10px] text-th-muted mt-2 leading-relaxed">{impact.notes}</p>
                )}
            </div>
        </section>
    );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Payer Triangulation Panel                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function PayerTriangulationPanel({ data, onPayerClick, onShowUnmatched }) {
    const totalBank = data?.total_bank_deposited || 0;
    const totalERA = data?.total_era_received || 0;
    const totalForecasted = data?.total_forecasted || 0;
    const eraGap = data?.era_bank_gap || 0;
    const payers = data?.payer_breakdown || [];

    return (
        <section className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-th-border flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-bold text-th-heading">Payer Cash Flow Triangulation</h3>
                    <p className="text-[11px] text-th-muted mt-0.5">
                        Forecast vs ERA vs Bank — click a row for payer detail
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onShowUnmatched}
                    className={cn(
                        'inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[11px] font-semibold',
                        'border border-th-border text-th-secondary hover:border-th-border-strong hover:text-th-heading',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary'
                    )}
                >
                    <span className="material-symbols-outlined text-[14px] leading-none">find_in_page</span>
                    View Unmatched ERAs
                </button>
            </div>
            {payers.length === 0 ? (
                <EmptyState
                    icon="table_view"
                    title="No payer triangulation data"
                    description="Per-payer reconciliation will appear once ERAs and bank deposits are received."
                />
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-th-surface-base text-th-muted text-[10px] font-bold uppercase tracking-widest border-b border-th-border">
                                <tr>
                                    <th className="p-3">Payer</th>
                                    <th className="p-3 text-right">Forecasted</th>
                                    <th className="p-3 text-right">ERA Received</th>
                                    <th className="p-3 text-right">Bank Deposited</th>
                                    <th className="p-3 text-right">Variance</th>
                                    <th className="p-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-th-border">
                                {payers.map((p, i) => {
                                    const varianceAbs = Math.abs(p.variance || 0);
                                    const isPositive = (p.variance || 0) >= 0;
                                    const variancePct = p.forecasted > 0 ? Math.abs((p.variance || 0) / p.forecasted * 100) : 0;
                                    return (
                                        <tr
                                            key={p.payer_id || i}
                                            onClick={() => onPayerClick(p)}
                                            className={cn(
                                                'cursor-pointer hover:bg-th-surface-overlay/60 transition-colors',
                                                variancePct > 10 ? 'bg-th-danger-bg/30' : ''
                                            )}
                                        >
                                            <td className="p-3">
                                                <div className="text-xs font-semibold text-th-heading">{p.payer_name}</div>
                                                <div className="text-[10px] text-th-muted font-mono">{p.payer_id}</div>
                                            </td>
                                            <td className="p-3 text-right text-xs font-mono font-medium text-th-heading tabular-nums">{fmtMoney(p.forecasted)}</td>
                                            <td className="p-3 text-right text-xs font-mono font-medium text-th-heading tabular-nums">{fmtMoney(p.era_received)}</td>
                                            <td className="p-3 text-right text-xs font-mono font-medium text-th-heading tabular-nums">{fmtMoney(p.bank_deposited)}</td>
                                            <td className="p-3 text-right">
                                                <span className={cn(
                                                    'text-xs font-mono font-bold tabular-nums',
                                                    isPositive ? 'text-th-success' : 'text-th-danger'
                                                )}>
                                                    {isPositive ? '+' : '-'}{fmtMoney(varianceAbs)}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={cn(
                                                    'px-2 py-0.5 rounded-full text-[10px] font-bold',
                                                    variancePct <= 2 ? 'bg-th-success-bg text-th-success' :
                                                    variancePct <= 10 ? 'bg-th-warning-bg text-th-warning' :
                                                    'bg-th-danger-bg text-th-danger'
                                                )}>
                                                    {variancePct <= 2 ? 'Matched' : variancePct <= 10 ? 'Review' : 'Escalate'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="border-t border-th-border bg-th-surface-base px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px]">
                        <span className="text-th-muted font-bold uppercase tracking-wider">Totals</span>
                        <span className="text-th-heading font-bold tabular-nums">Forecast: {fmtMoney(totalForecasted)}</span>
                        <span className="text-th-heading font-bold tabular-nums">ERA: {fmtMoney(totalERA)}</span>
                        <span className="text-th-heading font-bold tabular-nums">Bank: {fmtMoney(totalBank)}</span>
                        <span className={cn('font-bold tabular-nums', eraGap >= 0 ? 'text-th-success' : 'text-th-danger')}>
                            Var: {fmtSignedMoney(eraGap)}
                        </span>
                    </div>
                </>
            )}
        </section>
    );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Drill-Down Drawer Bodies                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function KpiDrillBody({ kpiId, dso, dpo, workingCapital }) {
    if (kpiId === 'dso') {
        const breakdown = dso?.payer_breakdown || [];
        if (breakdown.length === 0) {
            return <EmptyState icon="schedule" title="No DSO breakdown" description="Per-payer DSO will appear once data is available." />;
        }
        return (
            <div className="space-y-2">
                <p className="text-xs text-th-muted">Per-payer days sales outstanding (sorted highest first)</p>
                <table className="w-full text-left text-xs">
                    <thead className="text-[10px] font-bold uppercase tracking-wider text-th-muted">
                        <tr>
                            <th className="py-2">Payer</th>
                            <th className="py-2 text-right">DSO</th>
                            <th className="py-2 text-right">vs Benchmark</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-th-border">
                        {breakdown.map((p, i) => (
                            <tr key={i}>
                                <td className="py-2 font-semibold text-th-heading">{p.payer_name || p.payer_id}</td>
                                <td className="py-2 text-right tabular-nums">{fmtNumber(p.dso, 0)}d</td>
                                <td className={cn('py-2 text-right tabular-nums font-bold', (p.delta_vs_benchmark || 0) > 0 ? 'text-th-danger' : 'text-th-success')}>
                                    {p.delta_vs_benchmark != null ? `${p.delta_vs_benchmark > 0 ? '+' : ''}${fmtNumber(p.delta_vs_benchmark, 0)}d` : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
    if (kpiId === 'dpo') {
        const breakdown = dpo?.payer_breakdown || [];
        if (breakdown.length === 0) {
            return <EmptyState icon="hourglass_top" title="No DPO breakdown" description="Per-payer DPO will appear once payments are received." />;
        }
        return (
            <table className="w-full text-left text-xs">
                <thead className="text-[10px] font-bold uppercase tracking-wider text-th-muted">
                    <tr>
                        <th className="py-2">Payer</th>
                        <th className="py-2 text-right">Lag (days)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-th-border">
                    {breakdown.map((p, i) => (
                        <tr key={i}>
                            <td className="py-2 font-semibold text-th-heading">{p.payer_name || p.payer_id}</td>
                            <td className="py-2 text-right tabular-nums">{fmtNumber(p.lag_days, 1)}d</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }
    // Fallback: working capital details
    const wc = workingCapital || {};
    const rows = [
        ['Cash On Hand', fmtMoney(wc.cash_on_hand)],
        ['AR Balance', fmtMoney(wc.ar_balance)],
        ['Liabilities', fmtMoney(wc.liabilities)],
        ['Working Capital', fmtMoney(wc.working_capital)],
        ['Cash Runway', wc.cash_runway_days != null ? `${fmtNumber(wc.cash_runway_days, 0)} days` : '—'],
        ['Daily Burn', fmtMoney(wc.daily_burn)],
    ];
    return (
        <div className="space-y-1">
            {rows.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-th-border py-2">
                    <span className="text-xs text-th-muted">{k}</span>
                    <span className="text-sm font-bold tabular-nums text-th-heading">{v}</span>
                </div>
            ))}
        </div>
    );
}

function DayDetailBody({ day }) {
    if (!day) return null;
    const payers = day.payers || [];
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-th-surface-overlay/40 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-th-muted font-bold">ERA Total</p>
                    <p className="text-base font-bold text-th-heading tabular-nums">{fmtMoney(day.actual_era)}</p>
                </div>
                <div className="bg-th-surface-overlay/40 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-th-muted font-bold">Bank Total</p>
                    <p className="text-base font-bold text-th-heading tabular-nums">{fmtMoney(day.bank_deposited)}</p>
                </div>
                <div className="bg-th-surface-overlay/40 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-th-muted font-bold">Variance</p>
                    <p className={cn('text-base font-bold tabular-nums', (day.variance || 0) >= 0 ? 'text-th-success' : 'text-th-danger')}>
                        {fmtSignedMoney(day.variance)}
                    </p>
                </div>
                <div className="bg-th-surface-overlay/40 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-th-muted font-bold">Silent Underpayments</p>
                    <p className="text-base font-bold text-th-warning tabular-nums">{day.silent_underpayments_count ?? 0}</p>
                </div>
            </div>
            <div>
                <p className="text-[11px] font-bold text-th-muted uppercase tracking-wider mb-2">Payers paid this day</p>
                {payers.length === 0 ? (
                    <p className="text-xs text-th-muted">No payer activity recorded.</p>
                ) : (
                    <table className="w-full text-left text-xs">
                        <thead className="text-[10px] font-bold uppercase tracking-wider text-th-muted">
                            <tr>
                                <th className="py-2">Payer</th>
                                <th className="py-2 text-right">ERA</th>
                                <th className="py-2 text-right">Bank</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-th-border">
                            {payers.map((p, i) => (
                                <tr key={i}>
                                    <td className="py-2 text-th-heading">{p.payer_name || p.payer_id}</td>
                                    <td className="py-2 text-right tabular-nums">{fmtMoney(p.era)}</td>
                                    <td className="py-2 text-right tabular-nums">{fmtMoney(p.bank)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function PayerDetailBody({ payer }) {
    if (!payer) return null;
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-th-surface-overlay/40 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-th-muted font-bold">Forecasted</p>
                    <p className="text-base font-bold tabular-nums text-th-heading">{fmtMoney(payer.forecasted)}</p>
                </div>
                <div className="bg-th-surface-overlay/40 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-th-muted font-bold">ERA</p>
                    <p className="text-base font-bold tabular-nums text-th-heading">{fmtMoney(payer.era_received)}</p>
                </div>
                <div className="bg-th-surface-overlay/40 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-th-muted font-bold">Bank</p>
                    <p className="text-base font-bold tabular-nums text-th-heading">{fmtMoney(payer.bank_deposited)}</p>
                </div>
            </div>
            <div className="border-t border-th-border pt-3">
                <p className="text-[11px] font-bold text-th-muted uppercase tracking-wider mb-1">Variance</p>
                <p className={cn('text-xl font-bold tabular-nums', (payer.variance || 0) >= 0 ? 'text-th-success' : 'text-th-danger')}>
                    {fmtSignedMoney(payer.variance)}
                </p>
            </div>
        </div>
    );
}

function UnmatchedErasBody({ data, loading, error, onRetry }) {
    if (loading) return <Skeleton className="h-32 w-full" />;
    if (error) return <ErrorBanner title="Couldn't load unmatched ERAs" message={error} onRetry={onRetry} />;
    const items = data?.items || data || [];
    if (!items.length) {
        return <EmptyState icon="check_circle" title="No unmatched ERAs" description="All ERAs have been matched to bank deposits." />;
    }
    return (
        <table className="w-full text-left text-xs">
            <thead className="text-[10px] font-bold uppercase tracking-wider text-th-muted">
                <tr>
                    <th className="py-2">ERA #</th>
                    <th className="py-2">Payer</th>
                    <th className="py-2 text-right">Amount</th>
                    <th className="py-2 text-right">Days Open</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-th-border">
                {items.map((it, i) => (
                    <tr key={it.era_id || it.id || i}>
                        <td className="py-2 font-mono text-[10px] text-th-heading">{it.era_id || it.id || '—'}</td>
                        <td className="py-2 text-th-heading">{it.payer_name || it.payer_id || '—'}</td>
                        <td className="py-2 text-right tabular-nums">{fmtMoney(it.amount ?? it.era_amount)}</td>
                        <td className="py-2 text-right tabular-nums">{it.days_open ?? '—'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Page                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

const DEFAULT_DELTAS = {
    denial_rate_delta: 0,
    payer_lag_delta: 0,
    appeal_win_rate_delta: 0,
};

export function CashFlowPage() {
    // Core data
    const [workingCapital, setWorkingCapital] = useState(null);
    const [dso, setDso] = useState(null);
    const [dpo, setDpo] = useState(null);
    const [triangulation, setTriangulation] = useState(null);
    const [aiInsights, setAiInsights] = useState([]);
    const [rootCauseSummary, setRootCauseSummary] = useState(null);
    const [preventionData, setPreventionData] = useState(null);

    // Cash flow timeline
    const [range, setRange] = useState(90);
    const [cashFlowDaily, setCashFlowDaily] = useState(null);
    const [cashFlowError, setCashFlowError] = useState(null);
    const [cashFlowLoading, setCashFlowLoading] = useState(true);

    // Scenario
    const [deltas, setDeltas] = useState(DEFAULT_DELTAS);
    const debouncedDeltas = useDebounced(deltas, 350);
    const [scenario, setScenario] = useState(null);
    const [scenarioLoading, setScenarioLoading] = useState(false);
    const [scenarioError, setScenarioError] = useState(null);

    // Drawers
    const [kpiDrawer, setKpiDrawer] = useState(null); // { id }
    const [dayDrawer, setDayDrawer] = useState(null); // day object
    const [payerDrawer, setPayerDrawer] = useState(null);
    const [unmatchedOpen, setUnmatchedOpen] = useState(false);
    const [unmatched, setUnmatched] = useState(null);
    const [unmatchedLoading, setUnmatchedLoading] = useState(false);
    const [unmatchedError, setUnmatchedError] = useState(null);

    // Top-level loading
    const [pageLoading, setPageLoading] = useState(true);
    const [pageError, setPageError] = useState(null);

    // ── Initial load ────────────────────────────────────────────────────────
    const loadCore = useCallback(async () => {
        setPageLoading(true);
        setPageError(null);
        try {
            const [wc, dsoData, dpoData, tri] = await Promise.all([
                api.finance?.getWorkingCapital ? api.finance.getWorkingCapital() : Promise.resolve(null),
                api.finance?.getDso ? api.finance.getDso({ lookback_days: 90 }) : Promise.resolve(null),
                api.finance?.getDpo ? api.finance.getDpo({ lookback_days: 90 }) : Promise.resolve(null),
                api.payments.getTriangulationSummary().catch(() => null),
            ]);
            setWorkingCapital(wc);
            setDso(dsoData);
            setDpo(dpoData);
            setTriangulation(tri);
        } catch (err) {
            setPageError(err?.message || 'Failed to load cash flow data');
        } finally {
            setPageLoading(false);
        }
        // Non-blocking secondary
        api.ai?.getInsights?.('payments')
            .then((res) => { if (res?.insights?.length) setAiInsights(res.insights); })
            .catch(() => {});
        api.rootCause?.getSummary?.()
            .then((d) => setRootCauseSummary(d))
            .catch(() => {});
        api.prevention?.scan?.(3)
            .then((d) => setPreventionData(d))
            .catch(() => {});
    }, []);

    useEffect(() => { loadCore(); }, [loadCore]);

    // ── Cash flow daily timeline (re-fetched on range change) ──────────────
    const loadCashFlow = useCallback(async (days) => {
        setCashFlowLoading(true);
        setCashFlowError(null);
        try {
            const data = await (api.finance?.getCashFlowDaily ? api.finance.getCashFlowDaily({ days }) : Promise.resolve(null));
            setCashFlowDaily(data);
            if (!data) setCashFlowError('Backend endpoint not yet live.');
        } catch (err) {
            setCashFlowError(err?.message || 'Failed to load timeline');
        } finally {
            setCashFlowLoading(false);
        }
    }, []);

    useEffect(() => { loadCashFlow(range); }, [range, loadCashFlow]);

    // ── Scenario (debounced) ────────────────────────────────────────────────
    const isScenarioActive =
        debouncedDeltas.denial_rate_delta !== 0 ||
        debouncedDeltas.payer_lag_delta !== 0 ||
        debouncedDeltas.appeal_win_rate_delta !== 0;

    useEffect(() => {
        if (!isScenarioActive) {
            setScenario(null);
            setScenarioError(null);
            return;
        }
        let cancelled = false;
        async function run() {
            setScenarioLoading(true);
            setScenarioError(null);
            try {
                const res = await (api.finance?.computeScenario
                    ? api.finance.computeScenario(debouncedDeltas)
                    : Promise.resolve(null));
                if (cancelled) return;
                if (res) setScenario(res);
                else setScenarioError('Scenario service unavailable.');
            } catch (err) {
                if (!cancelled) setScenarioError(err?.message || 'Scenario failed');
            } finally {
                if (!cancelled) setScenarioLoading(false);
            }
        }
        run();
        return () => { cancelled = true; };
    }, [debouncedDeltas, isScenarioActive]);

    const handleDeltaChange = (key, val) => setDeltas((prev) => ({ ...prev, [key]: val }));
    const handleDeltaReset = () => setDeltas(DEFAULT_DELTAS);

    // ── KPI / chart click handlers ──────────────────────────────────────────
    const handleKpiClick = (id) => setKpiDrawer({ id });
    const handleDayClick = (dateLabel) => {
        const day = (cashFlowDaily?.timeline || cashFlowDaily || []).find((d) => d.date === dateLabel);
        if (day) setDayDrawer(day);
    };

    // Apply a scenario suggested by an insight
    const applyInsightScenario = (insight) => {
        const sd = insight.scenario_deltas || {};
        setDeltas({
            denial_rate_delta: sd.denial_rate_delta ?? deltas.denial_rate_delta,
            payer_lag_delta: sd.payer_lag_delta ?? deltas.payer_lag_delta,
            appeal_win_rate_delta: sd.appeal_win_rate_delta ?? deltas.appeal_win_rate_delta,
        });
    };

    // Unmatched ERA loader
    const openUnmatched = async () => {
        setUnmatchedOpen(true);
        if (unmatched) return;
        setUnmatchedLoading(true);
        setUnmatchedError(null);
        try {
            const res = await api.payments.getUnmatchedEras({ limit: 50 });
            if (res) setUnmatched(res);
            else setUnmatchedError('Backend endpoint not yet live.');
        } catch (err) {
            setUnmatchedError(err?.message || 'Failed to load');
        } finally {
            setUnmatchedLoading(false);
        }
    };

    // Export placeholder
    const handleExport = (format) => {
        // eslint-disable-next-line no-console
        console.log(`Export TODO: ${format}`);
    };

    // Pull the timeline array regardless of envelope shape
    const timelineData = useMemo(() => {
        if (!cashFlowDaily) return null;
        if (Array.isArray(cashFlowDaily)) return cashFlowDaily;
        if (Array.isArray(cashFlowDaily.timeline)) return cashFlowDaily.timeline;
        if (Array.isArray(cashFlowDaily.days)) return cashFlowDaily.days;
        return null;
    }, [cashFlowDaily]);

    const scenarioOverlay = useMemo(() => {
        if (!scenario) return null;
        if (Array.isArray(scenario)) return scenario;
        if (Array.isArray(scenario.timeline)) return scenario.timeline;
        if (Array.isArray(scenario.projection)) return scenario.projection;
        return null;
    }, [scenario]);

    /* ────────────────────────────────────────────────────────────────────── */

    if (pageLoading) {
        return (
            <div className="flex-1 p-6">
                <div className="max-w-[1600px] mx-auto space-y-6">
                    <Skeleton className="h-8 w-64" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {[1,2,3,4,5,6].map((i) => (
                            <div key={i} className="bg-th-surface-raised border border-th-border rounded-lg p-4 space-y-3">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-7 w-20" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 lg:col-span-8 bg-th-surface-raised border border-th-border rounded-xl p-6">
                            <Skeleton className="h-4 w-48 mb-6" />
                            <Skeleton className="h-72 w-full rounded-lg" />
                        </div>
                        <div className="col-span-12 lg:col-span-4 bg-th-surface-raised border border-th-border rounded-xl p-6 space-y-4">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-2 w-full" />
                            <Skeleton className="h-2 w-full" />
                            <Skeleton className="h-2 w-full" />
                            <Skeleton className="h-12 w-full mt-6" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-th-heading">Cash Flow</h1>
                        <p className="text-xs text-th-muted mt-0.5">
                            Real-time cash position, payer triangulation, and what-if scenario modeling
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleExport('pdf')}
                            className={cn(
                                'inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-semibold',
                                'border border-th-border text-th-secondary hover:border-th-border-strong hover:text-th-heading',
                                'focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary'
                            )}
                        >
                            <span className="material-symbols-outlined text-[16px] leading-none">picture_as_pdf</span>
                            Export PDF
                        </button>
                        <button
                            type="button"
                            onClick={() => handleExport('csv')}
                            className={cn(
                                'inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-semibold',
                                'border border-th-border text-th-secondary hover:border-th-border-strong hover:text-th-heading',
                                'focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary'
                            )}
                        >
                            <span className="material-symbols-outlined text-[16px] leading-none">file_download</span>
                            Export CSV
                        </button>
                    </div>
                </div>

                {pageError && <ErrorBanner title="Could not load cash flow page" message={pageError} onRetry={loadCore} />}

                {/* KPI Strip */}
                <KpiStrip
                    workingCapital={workingCapital}
                    dso={dso}
                    dpo={dpo}
                    onKpiClick={handleKpiClick}
                />

                {/* Root Cause / Prevention bars */}
                {rootCauseSummary?.top_causes?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-lg bg-th-surface-raised border border-th-border text-xs">
                        <span className="material-symbols-outlined text-th-warning text-sm">troubleshoot</span>
                        <span className="font-bold text-th-muted uppercase tracking-wider text-[10px]">Revenue at Risk by Root Cause:</span>
                        {rootCauseSummary.top_causes.slice(0, 3).map((c, i) => (
                            <span key={i} className="text-th-heading font-semibold">
                                {c.cause?.replace(/_/g, ' ')}{' '}
                                <span className="text-th-warning font-bold tabular-nums">
                                    {c.pct || Math.round((c.count || 0) / (rootCauseSummary.total || 1) * 100)}%
                                </span>
                                {i < 2 && rootCauseSummary.top_causes.length > i + 1 && <span className="text-th-muted mx-1">|</span>}
                            </span>
                        ))}
                    </div>
                )}
                {preventionData && (preventionData.total > 0 || preventionData.alerts?.length > 0) && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-th-danger-bg border border-th-danger/20 text-xs">
                        <span className="material-symbols-outlined text-th-danger text-sm">shield</span>
                        <span className="font-bold text-th-danger tabular-nums">{preventionData.total || preventionData.alerts?.length || 0}</span>
                        <span className="text-th-secondary">preventable risks may impact cash flow</span>
                    </div>
                )}

                {/* Timeline + Scenario */}
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-8">
                        <CashPositionTimeline
                            data={timelineData}
                            range={range}
                            onRangeChange={setRange}
                            onDayClick={handleDayClick}
                            scenarioOverlay={scenarioOverlay}
                            loading={cashFlowLoading}
                            error={cashFlowError}
                            onRetry={() => loadCashFlow(range)}
                        />
                    </div>
                    <div className="col-span-12 lg:col-span-4">
                        <ScenarioPanel
                            deltas={deltas}
                            onDeltaChange={handleDeltaChange}
                            onReset={handleDeltaReset}
                            impact={scenario?.impact || (scenario && {
                                dollar_impact: scenario.dollar_impact,
                                pct_impact: scenario.pct_impact,
                                horizon_days: scenario.horizon_days,
                                notes: scenario.notes,
                            })}
                            loading={scenarioLoading}
                            error={scenarioError}
                        />
                    </div>
                </div>

                {/* Payer Triangulation */}
                <PayerTriangulationPanel
                    data={triangulation}
                    onPayerClick={(p) => setPayerDrawer(p)}
                    onShowUnmatched={openUnmatched}
                />

                {/* AI Insights */}
                {aiInsights.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-purple-400 text-base">auto_awesome</span>
                            <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">AI Insights</span>
                            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1">
                                Live
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {aiInsights.slice(0, 3).map((ins, i) => (
                                <div key={i} className="space-y-2">
                                    <AIInsightCard
                                        title={ins.title}
                                        description={ins.body || ins.description}
                                        confidence={ins.confidence || (ins.badge === 'Prescriptive' ? 92 : ins.badge === 'Predictive' ? 85 : 78)}
                                        impact={ins.severity === 'critical' ? 'high' : ins.severity === 'warning' ? 'high' : 'medium'}
                                        category={ins.badge || ins.category || 'Diagnostic'}
                                        action="Review"
                                        value={ins.value || ''}
                                        icon={ins.icon || (ins.badge === 'Prescriptive' ? 'gavel' : 'trending_up')}
                                    />
                                    {ins.scenario_deltas && (
                                        <button
                                            type="button"
                                            onClick={() => applyInsightScenario(ins)}
                                            className={cn(
                                                'w-full inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-[11px] font-semibold',
                                                'bg-th-primary-bg text-th-primary hover:bg-th-primary hover:text-white transition-colors',
                                                'focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary'
                                            )}
                                        >
                                            <span className="material-symbols-outlined text-[14px] leading-none">science</span>
                                            Apply Scenario
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Drawers */}
            <Drawer
                open={!!kpiDrawer}
                onClose={() => setKpiDrawer(null)}
                title={
                    kpiDrawer?.id === 'dso' ? 'DSO Breakdown' :
                    kpiDrawer?.id === 'dpo' ? 'DPO / Payer Lag Breakdown' :
                    kpiDrawer?.id === 'cash' ? 'Cash On Hand Detail' :
                    kpiDrawer?.id === 'ar' ? 'AR Balance Detail' :
                    kpiDrawer?.id === 'wc' ? 'Working Capital Detail' :
                    kpiDrawer?.id === 'runway' ? 'Cash Runway Detail' :
                    'KPI Detail'
                }
                subtitle="Drill-down for selected KPI"
            >
                <KpiDrillBody kpiId={kpiDrawer?.id} dso={dso} dpo={dpo} workingCapital={workingCapital} />
            </Drawer>

            <Drawer
                open={!!dayDrawer}
                onClose={() => setDayDrawer(null)}
                title={dayDrawer?.date ? `Day Detail — ${dayDrawer.date}` : 'Day Detail'}
                subtitle="Payers, ERA vs bank variance, flagged underpayments"
            >
                <DayDetailBody day={dayDrawer} />
            </Drawer>

            <Drawer
                open={!!payerDrawer}
                onClose={() => setPayerDrawer(null)}
                title={payerDrawer?.payer_name || 'Payer Detail'}
                subtitle={payerDrawer?.payer_id}
            >
                <PayerDetailBody payer={payerDrawer} />
            </Drawer>

            <Drawer
                open={unmatchedOpen}
                onClose={() => setUnmatchedOpen(false)}
                title="Unmatched ERAs"
                subtitle="ERAs without a corresponding bank deposit"
                width="w-[560px]"
            >
                <UnmatchedErasBody
                    data={unmatched}
                    loading={unmatchedLoading}
                    error={unmatchedError}
                    onRetry={openUnmatched}
                />
            </Drawer>
        </div>
    );
}

export default CashFlowPage;
