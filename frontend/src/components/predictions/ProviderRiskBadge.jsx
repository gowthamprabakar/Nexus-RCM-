import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

function ProviderRiskBadge({ providerId, compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!providerId) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    api.predictions.getProviderRisk(providerId)
      .then((res) => {
        if (res && res.risk_score !== undefined) {
          setData(res);
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [providerId]);

  // Loading state
  if (loading) {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-th-surface-overlay animate-pulse" />
          <span className="text-[10px] text-th-muted">--</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium bg-th-surface-overlay border border-th-border text-th-muted">
        <span className="size-1.5 rounded-full bg-th-muted animate-pulse" />
        Loading...
      </span>
    );
  }

  // Error state
  if (error || !data) {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-th-surface-overlay" />
          <span className="text-[10px] text-th-muted">N/A</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-th-surface-overlay border border-th-border text-th-muted">
        N/A
      </span>
    );
  }

  const score = data.risk_score;

  let colorClasses, barColor;
  if (score > 70) {
    colorClasses = {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/30',
      dot: 'bg-red-400',
    };
    barColor = 'bg-red-400';
  } else if (score >= 40) {
    colorClasses = {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
    };
    barColor = 'bg-amber-400';
  } else {
    colorClasses = {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400',
    };
    barColor = 'bg-emerald-400';
  }

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 ${colorClasses.text}`}>
        <span className={`size-2 rounded-full ${colorClasses.dot}`} />
        <span className="text-[10px] font-bold tabular-nums">{score}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium border ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}`}
      title={`Provider risk score: ${score}/100`}
    >
      <span className="tabular-nums font-bold">{score}</span>
      <span className="relative h-1.5 w-12 rounded-full bg-th-surface-overlay overflow-hidden">
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </span>
    </span>
  );
}

export default ProviderRiskBadge;
