import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../services/api';

const pct = (n) => (n != null ? `${Number(n).toFixed(1)}%` : '0.0%');

/* Loading skeleton */
function Skeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
      <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
  );
}

/* Error state */
function ErrorBanner({ message, onRetry }) {
  return (
    <div className="m-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-red-500 text-xl">&#9888;</span>
        <div>
          <p className="font-semibold text-red-800 dark:text-red-200">Failed to load data</p>
          <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
      >
        Retry
      </button>
    </div>
  );
}

/* KPI Card */
function KPICard({ label, value, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    red: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    amber: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
  };
  const textColors = {
    blue: 'text-blue-700 dark:text-blue-300',
    red: 'text-red-700 dark:text-red-300',
    amber: 'text-amber-700 dark:text-amber-300',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${textColors[color]}`}>{value}</p>
    </div>
  );
}

/* Risk Badge */
function RiskBadge({ score }) {
  if (score > 70) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
        High Risk
      </span>
    );
  }
  if (score >= 40) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
        Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
      Low Risk
    </span>
  );
}

/* Main Component */
function ProviderLeaderboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [providers, setProviders] = useState([]);
  const [sortField, setSortField] = useState('risk_score');
  const [sortDir, setSortDir] = useState('desc');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      /* Try the bulk provider risk endpoint first */
      let data = null;
      try {
        data = await api.predictions.getProviderRisk('all');
      } catch {
        /* Endpoint may not support 'all', fall back to coding patterns */
      }

      if (data && (Array.isArray(data) || data?.providers)) {
        const list = Array.isArray(data) ? data : data.providers || data.items || [];
        setProviders(
          list.map((p) => ({
            provider_id: p.provider_id || p.id || '-',
            risk_score: p.risk_score ?? p.score ?? 0,
            denial_rate: p.denial_rate ?? p.denial_pct ?? 0,
            claim_volume: p.claim_volume ?? p.total_claims ?? p.claims_count ?? 0,
            top_risk_factor: p.top_risk_factor ?? p.primary_risk ?? p.risk_factors?.[0] ?? '-',
          }))
        );
      } else {
        /* Fall back to coding provider patterns */
        let patternsData = null;
        try {
          patternsData = await api.coding.getProviderPatterns('all');
        } catch {
          /* endpoint may not exist for 'all' */
        }

        if (patternsData && (Array.isArray(patternsData) || patternsData?.providers)) {
          const list = Array.isArray(patternsData)
            ? patternsData
            : patternsData.providers || patternsData.items || [];
          setProviders(
            list.map((p) => ({
              provider_id: p.provider_id || p.id || '-',
              risk_score: p.risk_score ?? p.error_rate ?? 0,
              denial_rate: p.denial_rate ?? p.denial_pct ?? 0,
              claim_volume: p.claim_volume ?? p.total_claims ?? p.claims_count ?? 0,
              top_risk_factor: p.top_risk_factor ?? p.primary_pattern ?? '-',
            }))
          );
        } else {
          /* Use empty array -- no provider data available */
          setProviders([]);
        }
      }
    } catch (err) {
      console.error('ProviderLeaderboard load error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* Sorted providers */
  const sortedProviders = useMemo(() => {
    const copy = [...providers];
    copy.sort((a, b) => {
      const av = typeof a[sortField] === 'number' ? a[sortField] : 0;
      const bv = typeof b[sortField] === 'number' ? b[sortField] : 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return copy;
  }, [providers, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="ml-1 text-gray-400">{'\u2195'}</span>;
    return <span className="ml-1">{sortDir === 'desc' ? '\u25BC' : '\u25B2'}</span>;
  };

  /* Row color by risk score */
  const rowColor = (score) => {
    if (score > 70) return 'bg-red-50 dark:bg-red-900/20';
    if (score >= 40) return 'bg-yellow-50 dark:bg-yellow-900/20';
    return 'bg-green-50 dark:bg-green-900/20';
  };

  /* KPIs */
  const totalProviders = providers.length;
  const highRiskCount = providers.filter((p) => p.risk_score > 70).length;
  const avgRiskScore =
    providers.length > 0
      ? providers.reduce((s, p) => s + p.risk_score, 0) / providers.length
      : 0;

  /* Render */
  if (loading) return <Skeleton />;
  if (error) return <ErrorBanner message={error} onRetry={fetchData} />;

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Provider Leaderboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Risk-ranked provider overview sorted by highest risk first
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="Total Providers" value={totalProviders} color="blue" />
        <KPICard label="High Risk" value={highRiskCount} color="red" />
        <KPICard label="Avg Risk Score" value={avgRiskScore.toFixed(1)} color="amber" />
      </div>

      {/* Provider Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Provider Rankings
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {sortedProviders.length} provider{sortedProviders.length !== 1 ? 's' : ''} &middot;
            sorted by {sortField.replace(/_/g, ' ')} {sortDir}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-750 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3 w-12">#</th>
                {[
                  { key: 'provider_id', label: 'Provider ID' },
                  { key: 'risk_score', label: 'Risk Score' },
                  { key: 'denial_rate', label: 'Denial Rate' },
                  { key: 'claim_volume', label: 'Claim Volume' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    className="px-5 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => handleSort(key)}
                  >
                    {label}
                    <SortIcon field={key} />
                  </th>
                ))}
                <th className="px-5 py-3">Top Risk Factor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sortedProviders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    No provider data available
                  </td>
                </tr>
              ) : (
                sortedProviders.map((p, idx) => (
                  <tr
                    key={p.provider_id + '-' + idx}
                    className={`${rowColor(p.risk_score)} hover:brightness-95 transition-colors`}
                  >
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">
                      {p.provider_id}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {p.risk_score.toFixed(1)}
                        </span>
                        <RiskBadge score={p.risk_score} />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                      {pct(p.denial_rate)}
                    </td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                      {typeof p.claim_volume === 'number'
                        ? p.claim_volume.toLocaleString()
                        : p.claim_volume}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs">
                      {p.top_risk_factor}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProviderLeaderboard;
