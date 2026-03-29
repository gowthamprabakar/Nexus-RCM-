import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

function OutcomeDashboard() {
  const [summary, setSummary] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      api.predictions.getOutcomeSummary(),
      api.predictions.getPredictionAccuracy(),
    ])
      .then(([summaryRes, accuracyRes]) => {
        if (!summaryRes && !accuracyRes) {
          setError('Failed to load outcome data');
        } else {
          setSummary(summaryRes);
          setAccuracy(accuracyRes);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load outcome data');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-th-primary">Outcome Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-th-border bg-th-surface p-5 animate-pulse"
            >
              <div className="h-3 w-20 bg-th-surface-overlay rounded mb-3" />
              <div className="h-7 w-24 bg-th-surface-overlay rounded" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-th-border bg-th-surface p-5 animate-pulse">
          <div className="h-4 w-40 bg-th-surface-overlay rounded mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 bg-th-surface-overlay rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-th-primary">Outcome Dashboard</h1>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-400 text-sm">
          {error}. Please try again later.
        </div>
      </div>
    );
  }

  const totalAppeals = summary?.total_appeals ?? 0;
  const winRate = summary?.win_rate ?? 0;
  const recoveredAmount = summary?.recovered_amount ?? 0;
  const avgDays = summary?.avg_resolution_days ?? 0;
  const byOutcome = summary?.by_outcome ?? [];

  const winRatePct = Math.round(winRate * 100);

  // Find max count for bar widths
  const maxCount = byOutcome.length > 0
    ? Math.max(...byOutcome.map((o) => o.count || 0))
    : 1;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-th-primary">Outcome Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-th-border bg-th-surface p-5">
          <p className="text-xs text-th-muted uppercase tracking-wide mb-1">Total Appeals</p>
          <p className="text-2xl font-bold text-th-primary tabular-nums">
            {totalAppeals.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-th-border bg-th-surface p-5">
          <p className="text-xs text-th-muted uppercase tracking-wide mb-1">Win Rate</p>
          <p className={`text-2xl font-bold tabular-nums ${winRatePct >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {winRatePct}%
          </p>
        </div>
        <div className="rounded-xl border border-th-border bg-th-surface p-5">
          <p className="text-xs text-th-muted uppercase tracking-wide mb-1">Recovered Amount</p>
          <p className="text-2xl font-bold text-emerald-400 tabular-nums">
            ${recoveredAmount.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-th-border bg-th-surface p-5">
          <p className="text-xs text-th-muted uppercase tracking-wide mb-1">Avg Resolution</p>
          <p className="text-2xl font-bold text-th-primary tabular-nums">
            {avgDays} days
          </p>
        </div>
      </div>

      {/* Outcome Breakdown */}
      {byOutcome.length > 0 && (
        <div className="rounded-xl border border-th-border bg-th-surface p-5">
          <h2 className="text-sm font-semibold text-th-primary mb-4">Outcome Breakdown</h2>
          <div className="space-y-3">
            {byOutcome.map((outcome) => {
              const barWidth = maxCount > 0 ? Math.round((outcome.count / maxCount) * 100) : 0;
              return (
                <div key={outcome.outcome || outcome.label} className="flex items-center gap-3">
                  <span className="text-xs text-th-secondary w-28 shrink-0 truncate">
                    {outcome.outcome || outcome.label}
                  </span>
                  <div className="flex-1 h-5 bg-th-surface-overlay rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500/60 rounded-full transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-th-primary tabular-nums w-12 text-right">
                    {outcome.count?.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Prediction Accuracy */}
      {accuracy && (
        <div className="rounded-xl border border-th-border bg-th-surface p-5">
          <h2 className="text-sm font-semibold text-th-primary mb-3">Prediction Accuracy</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {accuracy.models?.map((model) => (
              <div
                key={model.name}
                className="rounded-lg border border-th-border bg-th-surface-overlay p-4"
              >
                <p className="text-xs text-th-muted mb-1">{model.name}</p>
                <p className="text-lg font-bold text-th-primary tabular-nums">
                  {model.accuracy !== undefined ? `${Math.round(model.accuracy * 100)}%` : 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default OutcomeDashboard;
