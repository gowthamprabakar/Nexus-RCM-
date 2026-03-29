import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const HEALTH_CONFIG = {
  GREEN: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    label: 'Healthy',
  },
  YELLOW: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    label: 'Caution',
  },
  RED: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
    label: 'At Risk',
  },
};

function getHealthLevel(score) {
  if (score >= 70) return 'GREEN';
  if (score >= 40) return 'YELLOW';
  return 'RED';
}

function PayerHealthScore({ payerId, compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!payerId) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    api.predictions.getPayerHealth(payerId)
      .then((res) => {
        if (res && res.health_score !== undefined) {
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
  }, [payerId]);

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

  const score = data.health_score;
  const level = data.level || getHealthLevel(score);
  const config = HEALTH_CONFIG[level] || HEALTH_CONFIG.YELLOW;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 ${config.text}`}>
        <span className={`size-2 rounded-full ${config.dot}`} />
        <span className="text-[10px] font-bold tabular-nums">{score}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
      title={`Payer health: ${score}/100 (${config.label})`}
    >
      <span className={`size-1.5 rounded-full ${config.dot}`} />
      {score} {config.label}
    </span>
  );
}

export default PayerHealthScore;
