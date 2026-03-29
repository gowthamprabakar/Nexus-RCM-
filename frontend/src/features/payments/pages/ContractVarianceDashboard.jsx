import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../services/api';

const fmt = (n) => {
  if (n == null) return '$0';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};

const pct = (n) => (n != null ? `${n.toFixed(1)}%` : '0.0%');

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
function KPICard({ label, value, sub, color = 'blue' }) {
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
      {sub && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

/* Main Component */
function ContractVarianceDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [underpayments, setUnderpayments] = useState(null);
  const [payerStats, setPayerStats] = useState([]);
  const [sortField, setSortField] = useState('variance');
  const [sortDir, setSortDir] = useState('desc');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [underRes, statsRes] = await Promise.all([
        api.payments.getSilentUnderpayments(),
        api.payments.getPayerStats(),
      ]);
      setUnderpayments(underRes);
      setPayerStats(statsRes);
    } catch (err) {
      console.error('ContractVarianceDashboard load error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* Derive list of underpaid claims */
  const items = useMemo(() => {
    const raw = underpayments?.underpayments || underpayments?.items || [];
    return raw.map((item) => ({
      claim_id: item.claim_id || item.id || '-',
      payer: item.payer || item.payer_name || '-',
      billed: item.billed_amount ?? item.expected_amount ?? item.billed ?? 0,
      paid: item.paid_amount ?? item.paid ?? 0,
      variance: item.underpaid_amount ?? item.variance ?? 0,
      variance_pct: item.variance_pct ?? item.underpaid_pct ?? 0,
    }));
  }, [underpayments]);

  /* KPI computations */
  const totalUnderpayment = items.reduce((s, i) => s + Math.abs(i.variance), 0);
  const underpaidCount = items.length;
  const avgVariancePct =
    items.length > 0
      ? items.reduce((s, i) => s + Math.abs(i.variance_pct), 0) / items.length
      : 0;

  /* Sorted items */
  const sortedItems = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const av = typeof a[sortField] === 'number' ? a[sortField] : 0;
      const bv = typeof b[sortField] === 'number' ? b[sortField] : 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return copy;
  }, [items, sortField, sortDir]);

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

  /* Row color by variance */
  const rowColor = (variance) => {
    const abs = Math.abs(variance);
    if (abs > 500) return 'bg-red-50 dark:bg-red-900/20';
    if (abs > 100) return 'bg-yellow-50 dark:bg-yellow-900/20';
    return 'bg-green-50 dark:bg-green-900/20';
  };

  /* Render */
  if (loading) return <Skeleton />;
  if (error) return <ErrorBanner message={error} onRetry={fetchData} />;

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Contract Variance Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Identify and track silent underpayments across payers
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          label="Total Underpayment"
          value={fmt(totalUnderpayment)}
          sub="Aggregate variance across all claims"
          color="red"
        />
        <KPICard
          label="Underpaid Claims"
          value={underpaidCount.toLocaleString()}
          sub="Number of claims with variance"
          color="amber"
        />
        <KPICard
          label="Avg Variance %"
          value={pct(avgVariancePct)}
          sub="Mean underpayment percentage"
          color="blue"
        />
      </div>

      {/* Claims Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Underpaid Claims
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {sortedItems.length} claim{sortedItems.length !== 1 ? 's' : ''} &middot; sorted by{' '}
            {sortField} {sortDir}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-750 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {[
                  { key: 'claim_id', label: 'Claim ID' },
                  { key: 'payer', label: 'Payer' },
                  { key: 'billed', label: 'Billed' },
                  { key: 'paid', label: 'Paid' },
                  { key: 'variance', label: 'Variance' },
                  { key: 'variance_pct', label: 'Variance %' },
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    No underpaid claims found
                  </td>
                </tr>
              ) : (
                sortedItems.map((row, idx) => (
                  <tr
                    key={row.claim_id + '-' + idx}
                    className={`${rowColor(row.variance)} hover:brightness-95 transition-colors`}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-gray-800 dark:text-gray-200">
                      {row.claim_id}
                    </td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{row.payer}</td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{fmt(row.billed)}</td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{fmt(row.paid)}</td>
                    <td className="px-5 py-3 font-semibold text-red-600 dark:text-red-400">
                      {fmt(row.variance)}
                    </td>
                    <td className="px-5 py-3 font-semibold text-red-600 dark:text-red-400">
                      {pct(row.variance_pct)}
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

export default ContractVarianceDashboard;
