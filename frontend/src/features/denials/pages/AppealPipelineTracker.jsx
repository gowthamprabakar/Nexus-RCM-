import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

const STAGES = ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'WON', 'LOST'];

const STAGE_CONFIG = {
  PENDING: { color: 'bg-slate-400', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
  SUBMITTED: { color: 'bg-blue-400', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  UNDER_REVIEW: { color: 'bg-amber-400', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  WON: { color: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  LOST: { color: 'bg-red-400', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
};

const STAGE_LABELS = {
  PENDING: 'Pending',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  WON: 'Won',
  LOST: 'Lost',
};

function AppealPipelineTracker() {
  const [pipelineData, setPipelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api.predictions.getOutcomeSummary()
      .then((res) => {
        if (res) {
          // Build pipeline from summary data
          const pipeline = buildPipeline(res);
          setPipelineData(pipeline);
        } else {
          setError('Failed to load pipeline data');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load pipeline data');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-th-primary">Appeal Pipeline</h1>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {STAGES.map((stage) => (
            <div
              key={stage}
              className="flex-1 min-w-[140px] rounded-xl border border-th-border bg-th-surface p-4 animate-pulse"
            >
              <div className="h-3 w-20 bg-th-surface-overlay rounded mb-3" />
              <div className="h-8 w-16 bg-th-surface-overlay rounded mb-2" />
              <div className="h-3 w-24 bg-th-surface-overlay rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-th-primary">Appeal Pipeline</h1>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-400 text-sm">
          {error}. Please try again later.
        </div>
      </div>
    );
  }

  const totalCount = pipelineData
    ? STAGES.reduce((sum, s) => sum + (pipelineData[s]?.count || 0), 0)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-th-primary">Appeal Pipeline</h1>
        <span className="text-sm text-th-muted">
          {totalCount.toLocaleString()} total appeals
        </span>
      </div>

      {/* Pipeline visualization */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STAGES.map((stage, idx) => {
          const stageData = pipelineData?.[stage] || { count: 0, value: 0 };
          const config = STAGE_CONFIG[stage];
          const isTerminal = stage === 'WON' || stage === 'LOST';

          return (
            <React.Fragment key={stage}>
              <div
                className={`flex-1 min-w-[140px] rounded-xl border ${config.border} ${config.bg} p-4`}
              >
                {/* Stage header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`size-2 rounded-full ${config.color}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${config.text}`}>
                    {STAGE_LABELS[stage]}
                  </span>
                </div>

                {/* Count */}
                <p className={`text-2xl font-bold tabular-nums ${config.text}`}>
                  {stageData.count.toLocaleString()}
                </p>

                {/* Value */}
                <p className="text-xs text-th-muted mt-1">
                  ${(stageData.value || 0).toLocaleString()}
                </p>

                {/* Percentage bar */}
                {totalCount > 0 && (
                  <div className="mt-3 h-1 bg-th-surface-overlay rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${config.color}`}
                      style={{
                        width: `${Math.round((stageData.count / totalCount) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Arrow connector between non-terminal stages */}
              {idx < STAGES.length - 1 && !isTerminal && (
                <div className="flex items-center shrink-0">
                  <span className="text-th-muted text-lg">&#8594;</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Stage detail table */}
      <div className="rounded-xl border border-th-border bg-th-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-th-border">
              <th className="text-left px-4 py-3 text-xs font-medium text-th-muted uppercase tracking-wide">Stage</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-th-muted uppercase tracking-wide">Count</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-th-muted uppercase tracking-wide">Value</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-th-muted uppercase tracking-wide">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {STAGES.map((stage) => {
              const stageData = pipelineData?.[stage] || { count: 0, value: 0 };
              const config = STAGE_CONFIG[stage];
              const pctOfTotal = totalCount > 0
                ? Math.round((stageData.count / totalCount) * 100)
                : 0;

              return (
                <tr key={stage} className="border-b border-th-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${config.color}`} />
                      <span className={`text-sm font-medium ${config.text}`}>
                        {STAGE_LABELS[stage]}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-th-primary tabular-nums font-medium">
                    {stageData.count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-th-secondary tabular-nums">
                    ${(stageData.value || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-th-secondary tabular-nums">
                    {pctOfTotal}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Build pipeline stage data from the outcome summary response.
 * Maps by_outcome entries to pipeline stages, falling back to
 * reasonable defaults if the data shape differs.
 */
function buildPipeline(summaryRes) {
  const pipeline = {};
  STAGES.forEach((s) => {
    pipeline[s] = { count: 0, value: 0 };
  });

  if (summaryRes.by_stage) {
    // Prefer by_stage if the API provides it
    Object.entries(summaryRes.by_stage).forEach(([stage, data]) => {
      const key = stage.toUpperCase();
      if (pipeline[key] !== undefined) {
        pipeline[key] = {
          count: data.count || 0,
          value: data.value || data.total_value || 0,
        };
      }
    });
  } else if (summaryRes.by_outcome) {
    // Map outcome data to stages as a fallback
    summaryRes.by_outcome.forEach((item) => {
      const key = (item.outcome || item.label || '').toUpperCase().replace(/\s+/g, '_');
      if (pipeline[key] !== undefined) {
        pipeline[key] = {
          count: item.count || 0,
          value: item.value || item.total_value || 0,
        };
      }
    });
  }

  return pipeline;
}

export default AppealPipelineTracker;
