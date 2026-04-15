import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { EmptyState, ErrorBanner, Skeleton, ScoreBar } from '../../../components/ui';

/* Traffic Light */
function TrafficLight({ score }) {
  if (score >= 70) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
        <span className="w-3 h-3 rounded-full bg-[rgb(var(--color-success))] inline-block" />
        <span className="text-[rgb(var(--color-success))]">GREEN</span>
      </span>
    );
  }
  if (score >= 40) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
        <span className="w-3 h-3 rounded-full bg-[rgb(var(--color-warning))] inline-block" />
        <span className="text-[rgb(var(--color-warning))]">YELLOW</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
      <span className="w-3 h-3 rounded-full bg-[rgb(var(--color-danger))] inline-block" />
      <span className="text-[rgb(var(--color-danger))]">RED</span>
    </span>
  );
}

/* KPI Card — th-* token variant */
function KPICard({ label, value, color = 'primary', onClick }) {
  const styles = {
    primary: 'bg-[rgb(var(--color-primary-bg))] border-[rgb(var(--color-primary))]/30 text-[rgb(var(--color-primary))]',
    success: 'bg-[rgb(var(--color-success-bg))] border-[rgb(var(--color-success))]/30 text-[rgb(var(--color-success))]',
    warning: 'bg-[rgb(var(--color-warning-bg))] border-[rgb(var(--color-warning))]/30 text-[rgb(var(--color-warning))]',
    danger: 'bg-[rgb(var(--color-danger-bg))] border-[rgb(var(--color-danger))]/30 text-[rgb(var(--color-danger))]',
  };
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`rounded-xl border p-5 ${styles[color]} ${onClick ? 'hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary))] transition-all cursor-pointer text-left w-full' : ''}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-th-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </Tag>
  );
}

/* Render a health-score bar */
function HealthScoreBar({ score }) {
  return (
    <div className="flex items-center gap-2 w-36">
      <div className="flex-1 h-2 bg-th-surface-overlay rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            score >= 70 ? 'bg-[rgb(var(--color-success))]' :
            score >= 40 ? 'bg-[rgb(var(--color-warning))]' :
            'bg-[rgb(var(--color-danger))]'
          }`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-th-heading w-8 text-right tabular-nums">
        {score}
      </span>
    </div>
  );
}

/* Main Component */
function PayerHealthScorecard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payers, setPayers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // all | healthy | caution | atrisk

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      /* Bulk payer stats endpoint returns per-payer data */
      const statsRes = await api.payments.getPayerStats();
      const payerList = Array.isArray(statsRes) ? statsRes : statsRes?.payers || statsRes?.items || [];

      /* Cap enrichment at top 20 payers to avoid N+1 blow-up */
      const limited = payerList.slice(0, 20);
      const enriched = await Promise.all(
        limited.map(async (p) => {
          const payerId = p.payer_id || p.id || p.payer;
          let health = null;
          try {
            health = await api.predictions.getPayerHealth(payerId);
          } catch {
            /* health endpoint may not be available for every payer */
          }
          return {
            payer_id: payerId,
            name: p.payer_name || p.name || payerId,
            health_score: health?.score ?? health?.health_score ?? p.health_score ?? null,
            denial_rate: p.denial_rate ?? p.denial_pct ?? null,
            adtp_days: p.adtp_days ?? p.avg_days_to_pay ?? null,
            payment_consistency: health?.components?.payment_consistency ?? p.payment_consistency ?? null,
            status: health?.status ?? 'UNKNOWN',
          };
        })
      );

      /* Only keep payers that actually have a health score */
      setPayers(enriched.filter(p => p.health_score !== null));
    } catch (err) {
      console.error('PayerHealthScorecard load error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* Sort by health score ascending (worst first) */
  const sortedPayers = useMemo(
    () => [...payers].sort((a, b) => a.health_score - b.health_score),
    [payers]
  );

  /* Apply status filter */
  const filteredPayers = useMemo(() => {
    if (filterStatus === 'all') return sortedPayers;
    if (filterStatus === 'healthy') return sortedPayers.filter(p => p.health_score >= 70);
    if (filterStatus === 'caution') return sortedPayers.filter(p => p.health_score >= 40 && p.health_score < 70);
    if (filterStatus === 'atrisk') return sortedPayers.filter(p => p.health_score < 40);
    return sortedPayers;
  }, [sortedPayers, filterStatus]);

  /* KPI counts */
  const totalPayers = sortedPayers.length;
  const healthyCount = sortedPayers.filter((p) => p.health_score >= 70).length;
  const cautionCount = sortedPayers.filter((p) => p.health_score >= 40 && p.health_score < 70).length;
  const atRiskCount = sortedPayers.filter((p) => p.health_score < 40).length;

  /* Render */
  if (loading) {
    return (
      <div className="p-6 space-y-6 min-h-screen bg-th-surface-base">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorBanner title="Failed to load payer health data" message={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-th-surface-base">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-th-heading">Payer Health Scorecard</h1>
        <p className="text-sm text-th-muted mt-1">Monitor payer performance with composite health scores</p>
      </div>

      {/* KPI Summary — click to filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Payers" value={totalPayers} color="primary" onClick={() => setFilterStatus('all')} />
        <KPICard label="Healthy" value={healthyCount} color="success" onClick={() => setFilterStatus('healthy')} />
        <KPICard label="Caution" value={cautionCount} color="warning" onClick={() => setFilterStatus('caution')} />
        <KPICard label="At Risk" value={atRiskCount} color="danger" onClick={() => setFilterStatus('atrisk')} />
      </div>

      {filterStatus !== 'all' && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-th-muted">Filtered by:</span>
          <span className="px-2 py-1 bg-[rgb(var(--color-primary-bg))] text-[rgb(var(--color-primary))] rounded text-xs font-semibold uppercase">{filterStatus}</span>
          <button
            onClick={() => setFilterStatus('all')}
            className="text-xs text-th-muted hover:text-th-heading underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary))] rounded px-1"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Payer Table */}
      <div className="bg-th-surface-raised rounded-xl shadow border border-th-border overflow-hidden">
        <div className="px-5 py-4 border-b border-th-border">
          <h2 className="text-lg font-semibold text-th-heading">Payer Rankings</h2>
          <p className="text-xs text-th-muted mt-0.5">
            Sorted by health score ascending (worst first) — click a payer to view their denials
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-th-surface-overlay/40 text-left text-xs font-medium text-th-muted uppercase tracking-wider">
                <th scope="col" className="px-5 py-3">Payer</th>
                <th scope="col" className="px-5 py-3">Health Score</th>
                <th scope="col" className="px-5 py-3">Status</th>
                <th scope="col" className="px-5 py-3">Denial Rate</th>
                <th scope="col" className="px-5 py-3">ADTP (days)</th>
                <th scope="col" className="px-5 py-3">Payment Consistency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border/50">
              {filteredPayers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16">
                    <EmptyState
                      icon="query_stats"
                      title={filterStatus !== 'all' ? `No ${filterStatus} payers` : 'No payer data available'}
                      description={filterStatus !== 'all' ? 'Try a different filter or clear to see all.' : 'Payer health endpoint returned no data.'}
                      action={filterStatus !== 'all' ? () => setFilterStatus('all') : fetchData}
                      actionLabel={filterStatus !== 'all' ? 'Clear Filter' : 'Retry'}
                    />
                  </td>
                </tr>
              ) : (
                filteredPayers.map((p, idx) => (
                  <tr
                    key={p.payer_id + '-' + idx}
                    onClick={() => navigate(`/work/denials?payer=${encodeURIComponent(p.name)}`)}
                    className="hover:bg-th-surface-overlay/40 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary))]"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/work/denials?payer=${encodeURIComponent(p.name)}`); }}
                  >
                    <td className="px-5 py-3 font-medium text-th-heading">{p.name}</td>
                    <td className="px-5 py-3"><HealthScoreBar score={p.health_score} /></td>
                    <td className="px-5 py-3"><TrafficLight score={p.health_score} /></td>
                    <td className="px-5 py-3 text-th-secondary tabular-nums">
                      {typeof p.denial_rate === 'number' ? `${(p.denial_rate * (p.denial_rate > 1 ? 1 : 100)).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-5 py-3 text-th-secondary tabular-nums">
                      {typeof p.adtp_days === 'number' ? p.adtp_days.toFixed(0) : '—'}
                    </td>
                    <td className="px-5 py-3 text-th-secondary tabular-nums">
                      {typeof p.payment_consistency === 'number'
                        ? `${(p.payment_consistency * (p.payment_consistency > 1 ? 1 : 100)).toFixed(1)}%`
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-th-muted text-center">
        Showing top {sortedPayers.length} payers by health score.
        Denial rate, ADTP, and payment consistency shown as "—" when not provided by backend.
      </p>
    </div>
  );
}

export default PayerHealthScorecard;
