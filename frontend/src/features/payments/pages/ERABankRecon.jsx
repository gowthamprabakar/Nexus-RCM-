import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { EmptyState, Skeleton } from '../../../components/ui';

const fmt = (n) => {
  if (n == null) return '$0';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};

const MATCH_STATUS_STYLES = {
  Matched: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Unmatched: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Partial: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Anomaly: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export function ERABankRecon() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [eraBankMatch, setEraBankMatch] = useState(null);
  const [triangulation, setTriangulation] = useState(null);
  const [floatData, setFloatData] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [unmatchedDrawerOpen, setUnmatchedDrawerOpen] = useState(false);
  const [unmatchedItems, setUnmatchedItems] = useState(null);
  const [unmatchedLoading, setUnmatchedLoading] = useState(false);

  const openUnmatched = async () => {
    setUnmatchedDrawerOpen(true);
    if (unmatchedItems != null) return;
    setUnmatchedLoading(true);
    const res = await api.payments.getUnmatchedEras(50);
    setUnmatchedItems(res?.items || []);
    setUnmatchedLoading(false);
  };

  useEffect(() => {
    async function load() {
      try {
        const [eraBank, tri, fl] = await Promise.all([
          api.payments.getERABankMatch(),
          api.payments.getTriangulationSummary(),
          api.payments.getFloatAnalysis(),
        ]);
        setEraBankMatch(eraBank);
        setTriangulation(tri);
        setFloatData(fl || []);
      } catch (err) {
        console.error('ERABankRecon load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // KPIs
  const totalERA = eraBankMatch?.total_era_received || 0;
  const totalBank = eraBankMatch?.total_bank_deposited || 0;
  const netVariance = eraBankMatch?.net_variance || (totalBank - totalERA);
  const byStatus = eraBankMatch?.by_status || [];

  // Float avg
  const floatArr = Array.isArray(floatData) ? floatData : [];
  const avgFloat = floatArr.length > 0
    ? (floatArr.reduce((s, f) => s + (f.avg_float_days || 0), 0) / floatArr.length).toFixed(1)
    : '0';

  // Payer breakdown from triangulation
  const payerRows = useMemo(() => {
    const src = triangulation?.payer_breakdown || triangulation?.payers || [];
    if (!src.length) return [];
    return src
      .map((p) => ({
        payer_id: p.payer_id || p.payer,
        payer: p.payer_name || p.payer,
        era: p.era_received || p.era || 0,
        bank: p.bank_deposited || p.bank || 0,
        gap: p.variance || p.gap || 0,
        gap_pct: p.gap_pct || 0,
        forecasted: p.forecasted || 0,
      }))
      .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
  }, [triangulation]);

  // Float data sorted by highest float
  const sortedFloat = useMemo(() => {
    return [...floatArr].sort((a, b) => (b.avg_float_days || 0) - (a.avg_float_days || 0));
  }, [floatArr]);

  // Anomaly alerts: payers with large variances
  const anomalyPayers = useMemo(() => {
    return payerRows.filter((p) => p.gap_pct > 10 || Math.abs(p.gap) > 50000);
  }, [payerRows]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { Matched: 0, Unmatched: 0, Partial: 0, Anomaly: 0 };
    byStatus.forEach((s) => { counts[s.status] = (counts[s.status] || 0) + s.count; });
    return counts;
  }, [byStatus]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-th-muted">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!eraBankMatch && !triangulation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-th-muted gap-2">
        <span className="material-symbols-outlined text-4xl">info</span>
        <p className="text-sm">No ERA-Bank reconciliation data available.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto font-sans h-full">
      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h1 className="text-2xl font-black text-th-heading tracking-tight">ERA-Bank Reconciliation</h1>
            <p className="text-sm text-th-secondary">Matching ERA/835 payments to bank deposits with float analysis</p>
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-xs font-bold rounded-lg border border-th-border bg-th-surface-overlay text-th-heading focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">Status: All</option>
              <option value="Matched">Matched</option>
              <option value="Unmatched">Unmatched</option>
              <option value="Partial">Partial</option>
              <option value="Anomaly">Anomaly</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1 rounded-xl p-4 bg-th-surface-raised border border-th-border border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-th-muted">Total ERA Received</p>
            <p className="text-2xl font-black text-emerald-400 tabular-nums">{fmt(totalERA)}</p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl p-4 bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-th-muted">Total Bank Deposited</p>
            <p className="text-2xl font-black text-blue-400 tabular-nums">{fmt(totalBank)}</p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl p-4 bg-th-surface-raised border border-th-border border-l-[3px] border-l-rose-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-th-muted">Net Variance</p>
            <p className={`text-2xl font-black tabular-nums ${netVariance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{netVariance >= 0 ? '+' : ''}{fmt(netVariance)}</p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl p-4 bg-th-surface-raised border border-th-border border-l-[3px] border-l-purple-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-th-muted">Avg Float Days</p>
            <p className="text-2xl font-black text-purple-400 tabular-nums">{avgFloat} days</p>
          </div>
        </div>

        {/* Status Counts Quick Filter */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Matched', 'Unmatched', 'Partial', 'Anomaly'].map((status) => {
            const colors = { Matched: 'border-l-emerald-500', Unmatched: 'border-l-rose-500', Partial: 'border-l-amber-500', Anomaly: 'border-l-purple-500' };
            const textColors = { Matched: 'text-emerald-400', Unmatched: 'text-rose-400', Partial: 'text-amber-400', Anomaly: 'text-purple-400' };
            return (
              <div
                key={status}
                onClick={() => {
                  if (status === 'Unmatched') openUnmatched();
                  else setStatusFilter(statusFilter === status ? '' : status);
                }}
                className={`flex flex-col gap-0.5 rounded-lg p-3 bg-th-surface-raised border border-th-border border-l-[3px] ${colors[status]} cursor-pointer transition-all duration-200 ${statusFilter === status ? 'ring-2 ring-primary' : 'hover:-translate-y-0.5 hover:shadow-md'}`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted">
                  {status}
                  {status === 'Unmatched' && <span className="ml-1 text-th-muted normal-case">(drill-down →)</span>}
                </p>
                <p className={`text-xl font-black tabular-nums ${textColors[status]}`}>{statusCounts[status] || 0}</p>
              </div>
            );
          })}
        </div>

        {/* Payer Reconciliation Table */}
        {payerRows.length > 0 && (
          <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-th-border">
              <h3 className="text-sm font-bold text-th-heading">Payer Reconciliation</h3>
              <span className="text-[10px] font-bold text-th-muted bg-th-surface-overlay px-2 py-0.5 rounded-full">{payerRows.length} payers</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-th-border text-xs font-bold uppercase tracking-wider text-th-muted">
                    <th className="px-4 py-3">Payer</th>
                    <th className="px-4 py-3 text-right">Forecasted</th>
                    <th className="px-4 py-3 text-right">ERA</th>
                    <th className="px-4 py-3 text-right">Bank</th>
                    <th className="px-4 py-3 text-right">Gap</th>
                    <th className="px-4 py-3 text-right">Gap %</th>
                  </tr>
                </thead>
                <tbody>
                  {payerRows.map((row) => (
                    <tr
                      key={row.payer_id}
                      onClick={() => navigate(`/analytics/payments/payer-profiles?payer=${encodeURIComponent(row.payer_id)}`)}
                      className="border-b border-th-border/30 hover:bg-th-surface-overlay/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm font-bold text-th-heading">{row.payer}</td>
                      <td className="px-4 py-3 text-sm text-right text-th-heading tabular-nums">{fmt(row.forecasted)}</td>
                      <td className="px-4 py-3 text-sm text-right text-th-heading tabular-nums">{fmt(row.era)}</td>
                      <td className="px-4 py-3 text-sm text-right text-th-heading tabular-nums">{fmt(row.bank)}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-rose-400 tabular-nums">{fmt(row.gap)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold tabular-nums ${row.gap_pct > 10 ? 'text-rose-400 bg-rose-500/10' : row.gap_pct > 5 ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                          {row.gap_pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Float Analysis + Anomaly Alerts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Float Analysis */}
          {sortedFloat.length > 0 && (
            <div className="bg-th-surface-raised border border-th-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-th-heading mb-4">Float Analysis (ERA to Bank Deposit)</h3>
              <div className="space-y-3">
                {sortedFloat.slice(0, 15).map((row) => {
                  const maxFloat = Math.max(...sortedFloat.map(f => f.avg_float_days || 0), 1);
                  return (
                    <div key={row.payer_id || row.payer} className="flex items-center gap-3">
                      <div className="w-36 text-sm font-medium text-th-heading truncate">{row.payer || row.payer_name || row.payer_id}</div>
                      <div className="flex-1 h-3 bg-th-surface-overlay rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${(row.avg_float_days || 0) > 5 ? 'bg-rose-500' : (row.avg_float_days || 0) > 3 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${((row.avg_float_days || 0) / maxFloat) * 100}%` }} />
                      </div>
                      <span className={`text-xs font-bold tabular-nums w-16 text-right ${(row.avg_float_days || 0) > 5 ? 'text-rose-400' : (row.avg_float_days || 0) > 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {row.avg_float_days} days
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Anomaly Alerts */}
          <div className="bg-th-surface-raised border border-th-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-lg text-rose-400">notification_important</span>
              <h3 className="text-sm font-bold text-th-heading">Variance Anomaly Alerts</h3>
              {anomalyPayers.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">{anomalyPayers.length} flagged</span>
              )}
            </div>
            {anomalyPayers.length > 0 ? (
              <div className="space-y-2">
                {anomalyPayers.map((p) => (
                  <div
                    key={p.payer_id}
                    onClick={() => navigate(`/analytics/payments/payer-profiles?payer=${encodeURIComponent(p.payer_id)}`)}
                    className="flex items-center justify-between p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-bold text-th-heading">{p.payer}</p>
                      <p className="text-xs text-th-muted">ERA: {fmt(p.era)} | Bank: {fmt(p.bank)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-rose-400 tabular-nums">{fmt(Math.abs(p.gap))}</p>
                      <p className="text-[10px] font-bold text-rose-400">{p.gap_pct}% variance</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-th-muted gap-2">
                <span className="material-symbols-outlined text-3xl text-emerald-400">verified</span>
                <p className="text-sm text-emerald-400 font-bold">No anomalies detected</p>
                <p className="text-xs text-th-muted">All payer variances within acceptable thresholds</p>
              </div>
            )}
          </div>
        </div>

        {/* ERA-Bank Match by Status Detail */}
        {byStatus.length > 0 && (
          <div className="bg-th-surface-raised border border-th-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-th-heading mb-4">Reconciliation Status Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-th-border text-xs font-bold uppercase tracking-wider text-th-muted">
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Count</th>
                    <th className="px-4 py-3 text-right">ERA Total</th>
                    <th className="px-4 py-3 text-right">Bank Total</th>
                    <th className="px-4 py-3 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {byStatus.map((s) => (
                    <tr key={s.status} className="border-b border-th-border/30 hover:bg-th-surface-overlay/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${MATCH_STATUS_STYLES[s.status] || 'bg-th-surface-overlay text-th-muted border-th-border'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-th-heading font-bold tabular-nums">{s.count}</td>
                      <td className="px-4 py-3 text-sm text-right text-th-heading tabular-nums">{fmt(s.era_total)}</td>
                      <td className="px-4 py-3 text-sm text-right text-th-heading tabular-nums">{fmt(s.bank_total)}</td>
                      <td className={`px-4 py-3 text-sm text-right font-bold tabular-nums ${(s.variance_total || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {(s.variance_total || 0) >= 0 ? '+' : ''}{fmt(s.variance_total || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {unmatchedDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setUnmatchedDrawerOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-xl bg-th-surface-raised border-l border-th-border shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-th-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-th-heading">Unmatched ERAs</h3>
                <p className="text-xs text-th-muted mt-0.5">ERAs received but not yet matched to bank deposits</p>
              </div>
              <button onClick={() => setUnmatchedDrawerOpen(false)} className="text-th-muted hover:text-th-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {unmatchedLoading ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
              ) : unmatchedItems?.length ? (
                unmatchedItems.map((era, i) => (
                  <div key={era.id || era.era_id || i} className="rounded-lg border border-th-border bg-th-surface-overlay/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-primary font-bold">{era.id || era.era_id}</span>
                      <span className="text-sm font-bold text-emerald-400 tabular-nums">{fmt(era.amount || era.payment_amount || 0)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-th-muted">
                      <span>{era.payer || era.payer_name}</span>
                      <span>{era.date || era.received_date}</span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon="check_circle"
                  title="No unmatched ERAs"
                  description="All received ERAs have been matched to bank deposits."
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
