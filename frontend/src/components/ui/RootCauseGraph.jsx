import React, { useState } from 'react';

/**
 * RootCauseGraph — visual node graph showing root cause analysis for a single claim.
 *
 * Props:
 *   steps            — array from root_cause.steps
 *   primaryRootCause — string
 *   confidence       — number (0-100)
 *   denialAmount     — number ($)
 *   claimId          — string
 *   carcCode         — string (optional, e.g. "CO-16")
 *   rootCauseGroup   — string (PREVENTABLE / PROCESS / PAYER / CLINICAL)
 *   resolutionPath   — string (optional)
 */

const STATUS_COLORS = {
  FAIL:          { border: 'border-rose-500',   bg: 'bg-rose-500/10',   text: 'text-rose-400',   dot: 'bg-rose-500' },
  WARNING:       { border: 'border-amber-500',  bg: 'bg-amber-500/10',  text: 'text-amber-400',  dot: 'bg-amber-500' },
  PASS:          { border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  INCONCLUSIVE:  { border: 'border-gray-400',   bg: 'bg-gray-500/10',   text: 'text-gray-400',   dot: 'bg-gray-400' },
};

const STEP_ICONS = {
  CARC_RARC_DECODE:     'translate',
  ELIGIBILITY_CHECK:    'verified_user',
  AUTHORIZATION_CHECK:  'key',
  CODING_ACCURACY:      'code',
  PAYER_POLICY_CHECK:   'policy',
  TIMELINE_ANALYSIS:    'schedule',
  CONTRACT_REVIEW:      'description',
  PROVIDER_PATTERN:     'local_hospital',
};

const STEP_SHORT_NAMES = {
  CARC_RARC_DECODE:     'DECODE',
  ELIGIBILITY_CHECK:    'ELIG',
  AUTHORIZATION_CHECK:  'AUTH',
  CODING_ACCURACY:      'CODING',
  PAYER_POLICY_CHECK:   'PAYER',
  TIMELINE_ANALYSIS:    'TIMELN',
  CONTRACT_REVIEW:      'CONTRCT',
  PROVIDER_PATTERN:     'PROVDR',
};

const GROUP_BADGES = {
  PREVENTABLE: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  PROCESS:     { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  PAYER:       { bg: 'bg-rose-500/15',     text: 'text-rose-400',    border: 'border-rose-500/30' },
  CLINICAL:    { bg: 'bg-purple-500/15',   text: 'text-purple-400',  border: 'border-purple-500/30' },
};

const fmt = (n) => {
  if (!n && n !== 0) return '$0';
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};

export function RootCauseGraph({
  steps = [],
  primaryRootCause,
  confidence,
  denialAmount,
  claimId,
  carcCode,
  rootCauseGroup,
  resolutionPath,
}) {
  const [expandedNode, setExpandedNode] = useState(null);

  // Filter out SYNTHESIS step (last step) and separate CARC_DECODE (first step)
  const filteredSteps = steps.filter(s => s.step_name !== 'SYNTHESIS' && s.step_name !== 'ROOT_CAUSE_SYNTHESIS');
  const decodeStep = filteredSteps.find(s => s.step_name === 'CARC_RARC_DECODE');
  const miroStep = filteredSteps.find(s => s.step_name === 'MIROFISH_AGENT_VALIDATION');
  const evidenceSteps = filteredSteps.filter(s => s.step_name !== 'CARC_RARC_DECODE' && s.step_name !== 'MIROFISH_AGENT_VALIDATION');

  // Lay out evidence nodes in rows of 3
  const rows = [];
  for (let i = 0; i < evidenceSteps.length; i += 3) {
    rows.push(evidenceSteps.slice(i, i + 3));
  }

  const toggleExpand = (stepName) => {
    setExpandedNode(expandedNode === stepName ? null : stepName);
  };

  const groupBadge = GROUP_BADGES[rootCauseGroup] || GROUP_BADGES.PROCESS;

  return (
    <div className="space-y-3">
      {/* Central denial node */}
      <div className="flex flex-col items-center">
        <div className="px-4 py-2.5 rounded-xl border-2 border-purple-500/40 bg-purple-500/10 text-center min-w-[140px]">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="material-symbols-outlined text-sm text-purple-400">gavel</span>
            <span className="text-xs font-black text-purple-400 uppercase">DENIAL</span>
          </div>
          <p className="text-sm font-bold text-th-heading tabular-nums">{carcCode || 'DENIED'}</p>
          <p className="text-[10px] text-th-muted tabular-nums">{fmt(denialAmount)}</p>
        </div>

        {/* Connector from denial to decode */}
        {decodeStep && (
          <div className="w-px h-4 bg-th-border" />
        )}
      </div>

      {/* CARC Decode node (informational, always grey) */}
      {decodeStep && (
        <div className="flex flex-col items-center">
          <button
            onClick={() => toggleExpand('CARC_RARC_DECODE')}
            className="px-3 py-2 rounded-lg border border-gray-500/30 bg-gray-500/10 min-w-[130px] text-center hover:border-gray-400/50 transition-colors"
          >
            <div className="flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-gray-400">{STEP_ICONS.CARC_RARC_DECODE || 'info'}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">DECODE</span>
              <span className="text-[10px] text-gray-500">INFO</span>
            </div>
          </button>
          {expandedNode === 'CARC_RARC_DECODE' && (
            <div className="mt-1 max-w-[350px] bg-th-surface-overlay border border-th-border rounded-lg p-2.5 text-[10px] text-th-secondary leading-relaxed">
              {decodeStep.finding}
            </div>
          )}
          {/* Connector */}
          <div className="w-px h-3 bg-th-border" />
        </div>
      )}

      {/* Evidence node rows */}
      {rows.map((row, ri) => (
        <div key={ri} className="flex flex-col items-center">
          {/* SVG connectors from center to each node in this row */}
          <svg
            width={Math.max(row.length * 130, 200)}
            height={20}
            viewBox={`0 0 ${Math.max(row.length * 130, 200)} 20`}
            className="shrink-0"
          >
            {row.map((_, ci) => {
              const totalWidth = Math.max(row.length * 130, 200);
              const nodeSpacing = totalWidth / (row.length + 1);
              const nodeX = nodeSpacing * (ci + 1);
              const centerX = totalWidth / 2;
              return (
                <g key={ci}>
                  {/* Vertical from top center */}
                  {ci === Math.floor(row.length / 2) && row.length % 2 === 1 && (
                    <line x1={centerX} y1={0} x2={centerX} y2={20} stroke="currentColor" className="text-th-border" strokeWidth="1" />
                  )}
                  {/* Horizontal + vertical lines for non-center nodes */}
                  {(row.length > 1) && (
                    <>
                      <line x1={centerX} y1={0} x2={centerX} y2={8} stroke="currentColor" className="text-th-border" strokeWidth="1" />
                      <line x1={nodeSpacing} y1={8} x2={totalWidth - nodeSpacing} y2={8} stroke="currentColor" className="text-th-border" strokeWidth="1" />
                      <line x1={nodeX} y1={8} x2={nodeX} y2={20} stroke="currentColor" className="text-th-border" strokeWidth="1" />
                    </>
                  )}
                  {row.length === 1 && (
                    <line x1={nodeX} y1={0} x2={nodeX} y2={20} stroke="currentColor" className="text-th-border" strokeWidth="1" />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Node cards */}
          <div className="flex items-start gap-3 justify-center">
            {row.map((step) => {
              const status = step.finding_status || 'INCONCLUSIVE';
              const colors = STATUS_COLORS[status] || STATUS_COLORS.INCONCLUSIVE;
              const shortName = STEP_SHORT_NAMES[step.step_name] || step.step_name?.replace(/_/g, ' ').substring(0, 7);
              const icon = STEP_ICONS[step.step_name] || 'help';
              const weight = step.contribution_weight != null ? Math.round(step.contribution_weight * 100) : null;
              const isExpanded = expandedNode === step.step_name;

              return (
                <div key={step.step_name} className="flex flex-col items-center">
                  <button
                    onClick={() => toggleExpand(step.step_name)}
                    className={`px-3 py-2 rounded-lg border-2 ${colors.border} ${colors.bg} min-w-[100px] text-center transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <span className={`material-symbols-outlined text-xs ${colors.text}`}>{icon}</span>
                      <span className={`text-[10px] font-bold uppercase ${colors.text}`}>{shortName}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`size-1.5 rounded-full ${colors.dot}`} />
                      <span className={`text-[10px] font-bold ${colors.text}`}>{status}</span>
                    </div>
                    {weight != null && weight > 0 && (
                      <p className="text-[10px] text-th-muted mt-0.5 tabular-nums">{weight} pts</p>
                    )}
                  </button>
                  {isExpanded && (
                    <div className="mt-1 max-w-[180px] bg-th-surface-overlay border border-th-border rounded-lg p-2 text-[10px] text-th-secondary leading-relaxed">
                      {step.finding || 'No details available'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Connector to next row */}
          {ri < rows.length - 1 && (
            <div className="w-px h-3 bg-th-border mt-1" />
          )}
        </div>
      ))}

      {/* MiroFish Agent Swarm verdict */}
      {miroStep && miroStep.finding_status !== 'INCONCLUSIVE' && miroStep.finding && !miroStep.finding.startsWith('MiroFish unavailable') && !miroStep.finding.startsWith('MiroFish agent validation timed out') && (() => {
        const isConfirmed = miroStep.finding_status === 'PASS';
        const cleanedFinding = (miroStep.finding || '').replace(/^MiroFish(?:\s+Agent)?\s*(?:Swarm)?\s*:\s*/i, '');
        const weight = miroStep.contribution_weight != null ? Math.round(miroStep.contribution_weight * 100) : null;
        return (
          <div className={`rounded-lg border p-3 mt-1 ${isConfirmed ? 'border-violet-500/30 bg-violet-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-sm" style={{ color: isConfirmed ? '#8b5cf6' : '#f59e0b' }}>
                {isConfirmed ? 'verified' : 'warning'}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-wider ${isConfirmed ? 'text-violet-400' : 'text-amber-400'}`}>
                MiroFish Swarm: {isConfirmed ? 'CONFIRMED' : 'DISPUTED'}
              </span>
              {weight != null && weight > 0 && (
                <span className="text-[10px] text-th-muted tabular-nums ml-auto">{weight} pts</span>
              )}
            </div>
            <p className="text-[10px] text-th-secondary leading-relaxed">{cleanedFinding}</p>
          </div>
        );
      })()}

      {/* Verdict bar */}
      <div className="rounded-lg border border-th-border bg-th-surface-overlay/50 p-3 mt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">psychology</span>
            <span className="text-xs font-black text-th-heading">Verdict:</span>
            <span className="text-xs font-bold text-primary">
              {primaryRootCause?.replace(/_/g, ' ') || 'Unknown'}
            </span>
            {confidence != null && (
              <span className="text-[10px] text-th-muted tabular-nums">({confidence}% confidence)</span>
            )}
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${groupBadge.bg} ${groupBadge.text} ${groupBadge.border}`}>
            {rootCauseGroup || 'UNKNOWN'}
          </span>
        </div>
        {resolutionPath && (
          <p className="text-[10px] text-primary mt-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">lightbulb</span>
            {resolutionPath}
          </p>
        )}
      </div>
    </div>
  );
}
