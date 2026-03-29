import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

function CARCPredictionChip({ claimId, compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!claimId) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    api.predictions.getCarcPrediction(claimId)
      .then((res) => {
        if (res && res.predictions && res.predictions.length > 0) {
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
  }, [claimId]);

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

  // Take top 3 predictions
  const top3 = data.predictions.slice(0, 3);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-0.5">
        {top3.map((pred) => (
          <span
            key={pred.code}
            className="rounded bg-blue-500/10 px-1 py-px text-[9px] font-mono font-bold text-blue-400 border border-blue-500/20"
          >
            {pred.code}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1" title="Predicted CARC codes">
      {top3.map((pred) => {
        const conf = pred.confidence !== undefined ? Math.round(pred.confidence * 100) : null;
        return (
          <span
            key={pred.code}
            className="inline-flex items-center gap-0.5 rounded bg-blue-500/10 px-1.5 py-0.5 text-xs font-mono font-bold text-blue-400 border border-blue-500/20"
            title={pred.description || `CARC ${pred.code}`}
          >
            {pred.code}
            {conf !== null && (
              <span className="text-[10px] font-normal text-blue-400/70">{conf}%</span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export default CARCPredictionChip;
