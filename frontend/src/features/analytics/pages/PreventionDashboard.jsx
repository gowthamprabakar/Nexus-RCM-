import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { cn } from '../../../lib/utils';
import { AIInsightCard } from '../../../components/ui';

// ── Severity helpers ────────────────────────────────────────────────────────
// Use semantic th-* tokens where possible for WCAG AA + auto light/dark.
const SEVERITY_CONFIG = {
    CRITICAL: { bg: 'bg-th-danger/15',  text: 'text-th-danger',  dot: 'bg-th-danger',  icon: 'error',    label: 'Critical' },
    WARNING:  { bg: 'bg-th-warning/15', text: 'text-th-warning', dot: 'bg-th-warning', icon: 'warning',  label: 'Warning'  },
    INFO:     { bg: 'bg-th-info/15',    text: 'text-th-info',    dot: 'bg-th-info',    icon: 'info',     label: 'Info'     },
};

const TYPE_CONFIG = {
    ELIGIBILITY_RISK:     { icon: 'person_off',    label: 'Eligibility Risk',    color: 'red'    },
    AUTH_EXPIRY:          { icon: 'schedule',      label: 'Auth Expiry',         color: 'amber'  },
    TIMELY_FILING_RISK:   { icon: 'timer_off',     label: 'Timely Filing Risk',  color: 'orange' },
    DUPLICATE_CLAIM:      { icon: 'content_copy',  label: 'Duplicate Claim',     color: 'purple' },
    HIGH_RISK_PAYER_CPT:  { icon: 'warning',       label: 'High-Risk Payer/CPT', color: 'rose'   },
    // Sprint Q Track C2 — ML-powered rule types
    PAYER_ANOMALY:        { icon: 'insights',      label: 'Payer Anomaly',       color: 'violet', ml: true },
    HIGH_DENIAL_RISK:     { icon: 'bolt',          label: 'High Denial Risk',    color: 'cyan',   ml: true },
};

const TYPE_COLORS = {
    red:    { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400',    hoverBorder: 'hover:border-red-500/60'    },
    amber:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-400',  hoverBorder: 'hover:border-amber-500/60'  },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', hoverBorder: 'hover:border-orange-500/60' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', hoverBorder: 'hover:border-purple-500/60' },
    rose:   { bg: 'bg-rose-500/10',   border: 'border-rose-500/30',   text: 'text-rose-400',   hoverBorder: 'hover:border-rose-500/60'   },
    violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', hoverBorder: 'hover:border-violet-500/60' },
    cyan:   { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30',   text: 'text-cyan-400',   hoverBorder: 'hover:border-cyan-500/60'   },
};

// Static accent map for KPI cards — Tailwind JIT needs full literal class strings
const KPI_ACCENT = {
    red:     { rail: 'border-l-red-500',     icon: 'text-red-400'     },
    amber:   { rail: 'border-l-amber-500',   icon: 'text-amber-400'   },
    emerald: { rail: 'border-l-emerald-500', icon: 'text-emerald-400' },
    blue:    { rail: 'border-l-blue-500',    icon: 'text-blue-400'    },
    violet:  { rail: 'border-l-violet-500',  icon: 'text-violet-400'  },
    cyan:    { rail: 'border-l-cyan-500',    icon: 'text-cyan-400'    },
};

const fmt = (v) => {
    if (v == null) return '$0';
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toLocaleString()}`;
};

// ── Severity Badge ──────────────────────────────────────────────────────────
// Uses semantic th-* tokens (auto-theme-aware, WCAG AA) + icon for non-color distinction
function SeverityBadge({ severity }) {
    const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.INFO;
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide', cfg.bg, cfg.text)}>
            <span className="material-symbols-outlined text-[12px]" aria-hidden="true">{cfg.icon}</span>
            {cfg.label}
        </span>
    );
}

// ── KPI Card ────────────────────────────────────────────────────────────────
function KPICard({ label, value, icon, accentColor, subtitle }) {
    const accent = KPI_ACCENT[accentColor] || KPI_ACCENT.blue;
    return (
        <div className={cn(
            'flex flex-col gap-2 rounded-xl p-5 bg-th-surface-raised border border-th-border border-l-[3px] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200',
            accent.rail
        )}>
            <div className="flex items-center justify-between">
                <p className="text-th-secondary text-sm font-medium">{label}</p>
                <span className={cn('material-symbols-outlined text-lg', accent.icon)} aria-hidden="true">{icon}</span>
            </div>
            <p className="text-th-heading text-2xl font-bold tabular-nums">{value}</p>
            {subtitle && <p className="text-th-muted text-xs">{subtitle}</p>}
        </div>
    );
}

// ── Type Card ───────────────────────────────────────────────────────────────
function TypeCard({ type, count, revenue, isActive, onClick }) {
    const cfg = TYPE_CONFIG[type] || { icon: 'info', label: type, color: 'blue' };
    const colors = TYPE_COLORS[cfg.color] || TYPE_COLORS.amber;
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex flex-col gap-3 rounded-xl p-4 border transition-all duration-200 text-left w-full',
                isActive
                    ? cn(colors.bg, colors.border, 'border-2 shadow-md')
                    : cn('bg-th-surface-raised border-th-border', colors.hoverBorder, 'hover:-translate-y-0.5 hover:shadow-md')
            )}
        >
            <div className="flex items-center gap-2.5">
                <span className={cn('material-symbols-outlined text-xl', colors.text)}>{cfg.icon}</span>
                <span className="text-sm font-semibold text-th-heading truncate">{cfg.label}</span>
            </div>
            <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-th-heading tabular-nums">{count ?? 0}</span>
                <span className={cn('text-sm font-semibold tabular-nums', colors.text)}>{fmt(revenue)}</span>
            </div>
        </button>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════
export function PreventionDashboard() {
    const navigate = useNavigate();

    // ── State ────────────────────────────────────────────────────────────
    const [alerts, setAlerts] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [sortField, setSortField] = useState('revenue_at_risk');
    const [sortDir, setSortDir] = useState('desc');
    const [filters, setFilters] = useState({ prevention_type: '', severity: '', payer: '' });
    const [aiInsights, setAiInsights] = useState([]);
    const [rootCauseDist, setRootCauseDist] = useState(null);
    const [undoToast, setUndoToast] = useState(null); // { alert_id, timer, label }
    const [liveStatus, setLiveStatus] = useState(''); // aria-live announcement

    // ── Data fetching ────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [scanRes, alertRes] = await Promise.all([
                api.prevention.scan(),
                api.prevention.getAlerts(filters),
            ]);
            if (scanRes) {
                setSummary(scanRes.summary);
                if (!alertRes) setAlerts(scanRes.alerts || []);
            }
            if (alertRes) {
                setAlerts(Array.isArray(alertRes) ? alertRes : alertRes.alerts || []);
            }
        } catch (err) {
            console.error('Prevention data fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Load AI insights + root cause (non-blocking)
    useEffect(() => {
        api.ai.getInsights('prevention').then(res => {
            if (res?.insights?.length) setAiInsights(res.insights);
        }).catch(() => {});
        api.rootCause.getSummary().then(d => setRootCauseDist(d)).catch(() => null);
    }, []);

    // ── Scan Now ─────────────────────────────────────────────────────────
    const handleScan = async () => {
        setScanning(true);
        try {
            const res = await api.prevention.scan(200);
            if (res) {
                setSummary(res.summary);
                setAlerts(res.alerts || []);
            }
        } finally {
            setScanning(false);
        }
    };

    // ── Dismiss (optimistic + undo) ──────────────────────────────────────
    const handleDismiss = async (alertId) => {
        // 1. Optimistic UI: mark dismissed immediately
        setAlerts((prev) => prev.map((a) => a.alert_id === alertId ? { ...a, dismissed: true } : a));
        setLiveStatus('Alert dismissed. Undo available for 8 seconds.');

        // 2. Show undo toast with 8-second window
        if (undoToast?.timer) clearTimeout(undoToast.timer);
        const timer = setTimeout(() => {
            setUndoToast(null);
            // After undo window expires, persist to server
            api.prevention.dismiss(alertId).catch((err) => {
                console.error('Dismiss persist failed:', err);
                // Revert local state on failure
                setAlerts((prev) => prev.map((a) => a.alert_id === alertId ? { ...a, dismissed: false } : a));
                setLiveStatus('Dismiss failed. Alert restored.');
            });
        }, 8000);
        setUndoToast({ alert_id: alertId, timer });
    };

    const handleUndoDismiss = () => {
        if (!undoToast) return;
        clearTimeout(undoToast.timer);
        setAlerts((prev) => prev.map((a) => a.alert_id === undoToast.alert_id ? { ...a, dismissed: false } : a));
        setLiveStatus('Dismiss undone. Alert restored.');
        setUndoToast(null);
    };

    // ── Derived data ─────────────────────────────────────────────────────
    const activeAlerts = useMemo(() => alerts.filter((a) => !a.dismissed), [alerts]);

    const byType = useMemo(() => {
        const map = {};
        for (const key of Object.keys(TYPE_CONFIG)) {
            map[key] = { count: 0, revenue: 0 };
        }
        activeAlerts.forEach((a) => {
            // Auto-register any backend type not in TYPE_CONFIG so counts are never silently dropped
            if (!map[a.prevention_type]) map[a.prevention_type] = { count: 0, revenue: 0 };
            map[a.prevention_type].count += 1;
            map[a.prevention_type].revenue += a.revenue_at_risk || 0;
        });
        return map;
    }, [activeAlerts]);

    const payers = useMemo(() => {
        const set = new Set();
        alerts.forEach((a) => { if (a.payer_name) set.add(a.payer_name); });
        return [...set].sort();
    }, [alerts]);

    const criticalCount = useMemo(() => activeAlerts.filter((a) => a.severity === 'CRITICAL').length, [activeAlerts]);
    const totalRevenue = useMemo(() => activeAlerts.reduce((s, a) => s + (a.revenue_at_risk || 0), 0), [activeAlerts]);
    const preventionRate = useMemo(() => {
        if (!activeAlerts.length) return 0;
        const preventable = activeAlerts.filter((a) => a.preventable).length;
        return Math.round((preventable / activeAlerts.length) * 100);
    }, [activeAlerts]);

    // ── Sorted list ──────────────────────────────────────────────────────
    const sortedAlerts = useMemo(() => {
        return [...activeAlerts].sort((a, b) => {
            let va = a[sortField], vb = b[sortField];
            if (typeof va === 'string') va = va.toLowerCase();
            if (typeof vb === 'string') vb = vb.toLowerCase();
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [activeAlerts, sortField, sortDir]);

    const toggleSort = (field) => {
        if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortField(field); setSortDir('desc'); }
    };

    const SortIcon = ({ field }) => (
        sortField === field
            ? <span className="material-symbols-outlined text-[14px]">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
            : <span className="material-symbols-outlined text-[14px] opacity-30">unfold_more</span>
    );

    // ── Filter handler ───────────────────────────────────────────────────
    const updateFilter = (key, val) => {
        setFilters((f) => ({ ...f, [key]: val }));
    };

    const clearTypeFilter = () => updateFilter('prevention_type', '');

    // ═════════════════════════════════════════════════════════════════════
    // RENDER
    // ═════════════════════════════════════════════════════════════════════
    return (
        <div className="flex-1 overflow-y-auto">
            <div className="p-6 max-w-[1600px] mx-auto font-sans space-y-6">

                {/* ── Header ───────────────────────────────────────────── */}
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-th-heading text-3xl font-black leading-tight tracking-tight">
                            Prevention Intelligence
                        </h1>
                        <p className="text-th-secondary text-base">Proactive claim risk detection across eligibility, authorizations, filing deadlines, duplicates, payer patterns, and ML-flagged anomalies.</p>
                    </div>
                    <button
                        onClick={handleScan}
                        disabled={scanning}
                        className={cn(
                            'flex items-center gap-2 rounded-lg h-10 px-5 text-sm font-bold shadow-md transition-all',
                            scanning
                                ? 'bg-primary/60 text-white/70 cursor-wait'
                                : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                        )}
                    >
                        <span className={cn('material-symbols-outlined text-[18px]', scanning && 'animate-spin')}>
                            {scanning ? 'progress_activity' : 'radar'}
                        </span>
                        {scanning ? 'Scanning...' : 'Scan Now'}
                    </button>
                </div>

                {/* ── KPI Cards ─────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard label="Total Alerts" value={activeAlerts.length} icon="notifications_active" accentColor="blue" subtitle="Active prevention alerts" />
                    <KPICard label="Critical Alerts" value={criticalCount} icon="error" accentColor="red" subtitle="Immediate action required" />
                    <KPICard label="Revenue at Risk" value={fmt(totalRevenue)} icon="attach_money" accentColor="amber" subtitle="Across all active alerts" />
                    <KPICard label="Prevention Rate" value={`${preventionRate}%`} icon="verified_user" accentColor="emerald" subtitle="Preventable alerts ratio" />
                </div>

                {/* ── Prevention by Type ────────────────────────────────── */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-th-heading">Prevention by Type</h2>
                        {filters.prevention_type && (
                            <button onClick={clearTypeFilter} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">close</span>
                                Clear filter
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {Object.keys(TYPE_CONFIG).map((type) => (
                            <TypeCard
                                key={type}
                                type={type}
                                count={byType[type]?.count}
                                revenue={byType[type]?.revenue}
                                isActive={filters.prevention_type === type}
                                onClick={() => updateFilter('prevention_type', filters.prevention_type === type ? '' : type)}
                            />
                        ))}
                    </div>
                </div>

                {/* Root Cause Distribution */}
                {rootCauseDist?.top_causes?.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-th-surface-raised border border-th-border text-xs">
                        <span className="material-symbols-outlined text-violet-400 text-sm">troubleshoot</span>
                        <span className="font-bold text-th-muted uppercase tracking-wider text-[10px]">What's Being Prevented:</span>
                        {rootCauseDist.top_causes.slice(0, 4).map((c, i) => (
                            <span key={i} className="text-th-heading font-semibold">
                                {c.cause?.replace(/_/g, ' ')} <span className="text-violet-400 font-bold tabular-nums">{c.pct || Math.round(c.count / (rootCauseDist.total || 1) * 100)}%</span>
                                {i < 3 && rootCauseDist.top_causes.length > i + 1 && <span className="text-th-muted mx-1">|</span>}
                            </span>
                        ))}
                    </div>
                )}

                {/* ── Filter Bar ────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-th-surface-raised border border-th-border">
                    <span className="material-symbols-outlined text-th-muted text-lg" aria-hidden="true">filter_list</span>

                    <select
                        value={filters.prevention_type}
                        onChange={(e) => updateFilter('prevention_type', e.target.value)}
                        aria-label="Filter by prevention type"
                        className="h-8 rounded-lg px-3 text-sm bg-th-surface-base border border-th-border text-th-heading focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="">All Types</option>
                        {Object.entries(TYPE_CONFIG).map(([k, v]) => {
                            const n = byType[k]?.count || 0;
                            return <option key={k} value={k}>{v.label}{v.ml ? ' (ML)' : ''}{n > 0 ? ` (${n})` : ''}</option>;
                        })}
                    </select>

                    <select
                        value={filters.severity}
                        onChange={(e) => updateFilter('severity', e.target.value)}
                        aria-label="Filter by severity"
                        className="h-8 rounded-lg px-3 text-sm bg-th-surface-base border border-th-border text-th-heading focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="">All Severities</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="WARNING">Warning</option>
                        <option value="INFO">Info</option>
                    </select>

                    <select
                        value={filters.payer}
                        onChange={(e) => updateFilter('payer', e.target.value)}
                        aria-label="Filter by payer"
                        className="h-8 rounded-lg px-3 text-sm bg-th-surface-base border border-th-border text-th-heading focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="">All Payers</option>
                        {payers.map((p) => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>

                    {(filters.prevention_type || filters.severity || filters.payer) && (
                        <button
                            onClick={() => setFilters({ prevention_type: '', severity: '', payer: '' })}
                            className="ml-auto text-xs font-semibold text-th-danger hover:text-th-danger/80 flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">restart_alt</span>
                            Reset Filters
                        </button>
                    )}
                </div>

                {/* ── Alerts Table ──────────────────────────────────────── */}
                <div className="rounded-xl border border-th-border overflow-hidden bg-th-surface-raised">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-th-border bg-th-surface-base/60">
                                    {[
                                        { key: 'severity', label: 'Severity', w: 'w-28' },
                                        { key: 'claim_id', label: 'Claim ID', w: 'w-32' },
                                        { key: 'payer_name', label: 'Payer', w: 'w-40' },
                                        { key: 'prevention_type', label: 'Type', w: 'w-44' },
                                        { key: 'description', label: 'Description', w: '' },
                                        { key: 'revenue_at_risk', label: 'Revenue at Risk', w: 'w-36' },
                                    ].map((col) => (
                                        <th
                                            key={col.key}
                                            aria-sort={sortField === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                                            className={cn(
                                                'px-4 py-3 text-left text-xs font-bold text-th-muted uppercase tracking-wider',
                                                col.w
                                            )}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleSort(col.key)}
                                                className="flex items-center gap-1 hover:text-th-heading focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded transition-colors uppercase tracking-wider font-bold"
                                            >
                                                {col.label}
                                                <SortIcon field={col.key} />
                                            </button>
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-right text-xs font-bold text-th-muted uppercase tracking-wider w-40">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-th-border/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-16 text-center">
                                            <span className="material-symbols-outlined text-3xl text-th-muted animate-spin">progress_activity</span>
                                            <p className="text-th-muted mt-2 text-sm">Scanning for prevention alerts...</p>
                                        </td>
                                    </tr>
                                ) : sortedAlerts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-16 text-center">
                                            {Object.values(filters).some(Boolean) ? (
                                                <>
                                                    <span className="material-symbols-outlined text-3xl text-th-muted" aria-hidden="true">filter_alt_off</span>
                                                    <p className="text-th-heading font-semibold mt-2">No alerts match these filters</p>
                                                    <p className="text-th-muted text-xs mt-1">Try adjusting or clearing the filters to see more alerts.</p>
                                                    <button
                                                        onClick={() => setFilters({ prevention_type: '', severity: '', payer: '' })}
                                                        className="mt-3 text-xs font-semibold text-primary hover:underline"
                                                    >
                                                        Clear all filters
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-3xl text-th-success" aria-hidden="true">verified_user</span>
                                                    <p className="text-th-heading font-semibold mt-2">No active alerts</p>
                                                    <p className="text-th-muted text-xs mt-1">All clear. Run a scan to check for new risks.</p>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ) : sortedAlerts.map((alert) => {
                                    const typeCfg = TYPE_CONFIG[alert.prevention_type] || { label: alert.prevention_type, color: 'blue' };
                                    return (
                                        <tr key={alert.alert_id} className="hover:bg-th-surface-overlay/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <SeverityBadge severity={alert.severity} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => navigate(`/denials/claim/${alert.claim_id}`)}
                                                    className="text-primary font-semibold hover:underline tabular-nums"
                                                >
                                                    {alert.claim_id}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-th-heading font-medium truncate max-w-[160px]">{alert.payer_name}</td>
                                            <td className="px-4 py-3">
                                                <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', TYPE_COLORS[typeCfg.color]?.text || 'text-th-heading')}>
                                                    <span className="material-symbols-outlined text-sm">{typeCfg.icon || 'info'}</span>
                                                    {typeCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-th-secondary text-xs leading-relaxed max-w-xs truncate" title={alert.description}>
                                                {alert.description}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-th-heading font-bold tabular-nums">{fmt(alert.revenue_at_risk)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleDismiss(alert.alert_id)}
                                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-th-muted hover:text-th-heading hover:bg-th-surface-overlay border border-th-border transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                        Dismiss
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/denials/claim/${alert.claim_id}`)}
                                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 border border-primary/30 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">visibility</span>
                                                        View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Table footer */}
                    {!loading && sortedAlerts.length > 0 && (
                        <div className="px-4 py-3 border-t border-th-border bg-th-surface-base/40 flex items-center justify-between">
                            <p className="text-xs text-th-muted">
                                Showing <span className="font-semibold text-th-heading">{sortedAlerts.length}</span> of <span className="font-semibold text-th-heading">{alerts.length}</span> alerts
                            </p>
                            <p className="text-xs text-th-muted">
                                Total revenue at risk: <span className="font-bold text-amber-400">{fmt(totalRevenue)}</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* AI Insights */}
                {aiInsights.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-primary text-base" aria-hidden="true">auto_awesome</span>
                            <span className="text-sm font-bold text-th-secondary uppercase tracking-wider">AI Insights</span>
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

            {/* ── aria-live region for screen readers (visually hidden) ── */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">{liveStatus}</div>

            {/* ── Undo toast ── */}
            {undoToast && (
                <div
                    role="status"
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg bg-th-surface-raised border border-th-border shadow-xl"
                >
                    <span className="material-symbols-outlined text-th-muted text-lg" aria-hidden="true">check_circle</span>
                    <span className="text-sm text-th-heading font-medium">Alert dismissed</span>
                    <button
                        onClick={handleUndoDismiss}
                        className="ml-2 px-3 py-1 rounded text-xs font-bold text-primary hover:bg-primary/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors"
                    >
                        Undo
                    </button>
                </div>
            )}
        </div>
    );
}
