import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

function AppealSuccessBadge({ denialId, compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!denialId) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    api.predictions.getAppealSuccess(denialId)
      .then((res) => {
        if (res && res.probability !== undefined) {
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
  }, [denialId]);

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

  const probability = data.probability;
  const pct = Math.round(probability * 100);

  let recommendation, colorClasses;
  if (probability >= 0.6) {
    recommendation = 'APPEAL';
    colorClasses = {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400',
    };
  } else if (probability >= 0.3) {
    recommendation = 'NEGOTIATE';
    colorClasses = {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
    };
  } else {
    recommendation = 'WRITE_OFF';
    colorClasses = {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/30',
      dot: 'bg-red-400',
    };
  }

  // Use server-provided recommendation if available
  const displayRecommendation = data.recommendation || recommendation;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 ${colorClasses.text}`}>
        <span className={`size-2 rounded-full ${colorClasses.dot}`} />
        <span className="text-[10px] font-bold tabular-nums">{pct}%</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium border ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}`}
      title={`Appeal success: ${pct}% - ${displayRecommendation}`}
    >
      <span className={`size-1.5 rounded-full ${colorClasses.dot}`} />
      {pct}% {displayRecommendation}
    </span>
  );
}

export default AppealSuccessBadge;
