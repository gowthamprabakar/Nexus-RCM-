import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../../services/api';

/* ── Formatters ─────────────────────────────────────────────────────────── */
const fmtMoney = (n) => {
  if (!n && n !== 0) return '$0';
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};
const fmtPct = (n) => n == null ? '—' : `${(n * 100).toFixed(0)}%`;
const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
};

/* ── Constants ──────────────────────────────────────────────────────────── */
const STATUS_CHIP = {
  DENIED:       'bg-rose-500/15 text-rose-400 border-rose-500/30',
  APPEALED:     'bg-violet-500/15 text-violet-400 border-violet-500/30',
  PAID:         'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  SUBMITTED:    'bg-blue-500/15 text-blue-400 border-blue-500/30',
  ACKNOWLEDGED: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  REJECTED:     'bg-red-500/15 text-red-400 border-red-500/30',
};

const GROUP_COLORS = {
  PREVENTABLE: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/25' },
  PROCESS:     { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/25' },
  PAYER:       { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/25' },
  CLINICAL:    { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/25' },
};

const STEP_STATUS_DOT = {
  PASS:         'bg-emerald-500',
  FAIL:         'bg-rose-500',
  WARNING:      'bg-amber-500',
  CONFIRMED:    'bg-violet-500',
  DISPUTED:     'bg-amber-500',
  INCONCLUSIVE: 'bg-gray-400',
};

/* ── Sub-components ─────────────────────────────────────────────────────── */

function LayerCard({ icon, iconColor, label, badge, badgeColor, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-th-border bg-th-surface-raised overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-th-surface-overlay/20 transition-colors text-left"
      >
        <span className={`material-symbols-outlined text-base ${iconColor}`}>{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-th-muted flex-1">{label}</span>
        {badge && (
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${badgeColor}`}>
            {badge}
          </span>
        )}
        <span className="material-symbols-outlined text-sm text-th-muted">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

function DataRow({ label, value, valueClass = 'text-th-heading' }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-th-border/30 last:border-0">
      <span className="text-xs text-th-muted">{label}</span>
      <span className={`text-xs font-semibold ${valueClass}`}>{value ?? '—'}</span>
    </div>
  );
}

function RiskBar({ value, max = 1, colorClass = 'bg-primary' }) {
  const pct = Math.min(Math.max((value || 0) / max, 0), 1) * 100;
  const color = pct >= 70 ? 'bg-rose-500' : pct >= 40 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums w-10 text-right ${pct >= 70 ? 'text-rose-400' : pct >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

/* ── Intelligence Layer 1: Descriptive ─────────────────────────────────── */
function DescriptiveLayer({ claim }) {
  const crs = claim.crs_score;
  const crsOk = crs >= 60;
  const daysSinceService = claim.date_of_service
    ? Math.round((Date.now() - new Date(claim.date_of_service)) / 86400000)
    : null;
  return (
    <div className="space-y-2">
      <DataRow label="CRS Score" value={
        <span className={`font-bold ${crsOk ? 'text-emerald-400' : 'text-rose-400'}`}>
          {crs ?? '—'} {crsOk ? '✓' : '⚠'}
        </span>
      } />
      <DataRow label="Total Charges" value={fmtMoney(claim.total_charges)} />
      <DataRow label="Claim Type" value={claim.claim_type} />
      <DataRow label="DOS" value={fmtDate(claim.date_of_service)} />
      {daysSinceService != null && (
        <DataRow
          label="Age"
          value={`${daysSinceService} days`}
          valueClass={daysSinceService > 90 ? 'text-rose-400 font-bold' : 'text-th-heading'}
        />
      )}
      <DataRow label="Submitted" value={fmtDate(claim.submission_date)} />
    </div>
  );
}

/* ── Intelligence Layer 2: Diagnostic (Neo4j) ───────────────────────────── */
function DiagnosticLayer({ steps }) {
  const graphStep = steps.find(s => s.step_name === 'GRAPH_PATTERN_SYNTHESIS');
  if (!graphStep) return (
    <p className="text-xs text-th-muted italic">Graph evidence not yet computed.</p>
  );
  const hasEvidence = graphStep.contribution_weight > 0;
  return (
    <div className="space-y-2">
      <div className={`rounded-lg p-3 border ${hasEvidence ? 'bg-blue-500/8 border-blue-500/25' : 'bg-th-surface-overlay/30 border-th-border/30'}`}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="material-symbols-outlined text-sm text-blue-400">account_tree</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Neo4j Graph</span>
          {graphStep.contribution_weight > 0 && (
            <span className="ml-auto text-[10px] font-bold text-blue-300 tabular-nums">
              +{Math.round(graphStep.contribution_weight * 100)} pts
            </span>
          )}
        </div>
        <p className="text-[11px] text-th-secondary leading-relaxed">
          {graphStep.finding || 'No graph patterns detected.'}
        </p>
      </div>
      {/* Additional evidence steps relevant to diagnostic */}
      {steps.filter(s => ['ELIGIBILITY_CHECK','AUTH_TIMELINE_CHECK','PAYER_HISTORY_MATCH'].includes(s.step_name)).map(s => (
        <div key={s.step_name} className="flex items-start gap-2 text-[10px]">
          <span className={`mt-1 size-1.5 rounded-full shrink-0 ${STEP_STATUS_DOT[s.finding_status] || 'bg-gray-400'}`} />
          <div>
            <span className="font-semibold text-th-muted uppercase tracking-wide">{s.step_name.replace(/_/g, ' ')} · </span>
            <span className="text-th-secondary">{s.finding}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Intelligence Layer 3: Predictive (ML) ──────────────────────────────── */
function PredictiveLayer({ rootCause, claim }) {
  const denialProb = rootCause?.ml_denial_probability;
  const writeOffProb = rootCause?.ml_write_off_probability;
  const predictedCarc = rootCause?.ml_predicted_carc
    ? rootCause.ml_predicted_carc.split(',').filter(Boolean)
    : [];

  if (denialProb == null && writeOffProb == null && predictedCarc.length === 0) {
    return (
      <p className="text-xs text-th-muted italic">
        ML scores not yet computed. Run RCA to generate predictions.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {denialProb != null && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-th-muted">Denial Probability</span>
            <span className={`text-xs font-bold tabular-nums ${denialProb >= 0.7 ? 'text-rose-400' : denialProb >= 0.4 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {fmtPct(denialProb)}
            </span>
          </div>
          <RiskBar value={denialProb} max={1} />
        </div>
      )}
      {writeOffProb != null && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-th-muted">Write-Off Risk</span>
            <span className={`text-xs font-bold tabular-nums ${writeOffProb >= 0.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {fmtPct(writeOffProb)}
            </span>
          </div>
          <RiskBar value={writeOffProb} max={1} />
        </div>
      )}
      {predictedCarc.length > 0 && (
        <div>
          <p className="text-xs text-th-muted mb-1.5">Predicted Denial Codes</p>
          <div className="flex flex-wrap gap-1.5">
            {predictedCarc.map((c, i) => (
              <span key={i} className="px-2 py-0.5 rounded border border-rose-500/25 bg-rose-500/10 text-[10px] font-bold text-rose-400">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Intelligence Layer 4: Prescriptive (MiroFish) ──────────────────────── */
function PrescriptiveLayer({ steps }) {
  const miroStep = steps.find(s => s.step_name === 'MIROFISH_AGENT_VALIDATION');
  if (!miroStep) return (
    <p className="text-xs text-th-muted italic">MiroFish validation not available.</p>
  );

  const isUnavailable = miroStep.finding.startsWith('MiroFish unavailable')
    || miroStep.finding.startsWith('MiroFish agent validation timed out');

  if (isUnavailable) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-500/8 border border-gray-500/20">
        <span className="material-symbols-outlined text-sm text-gray-400">precision_manufacturing</span>
        <p className="text-xs text-th-muted">Agent swarm offline — validation skipped.</p>
      </div>
    );
  }

  const isConfirmed = miroStep.finding_status === 'CONFIRMED';
  const isDisputed  = miroStep.finding_status === 'DISPUTED';

  // Extract clean reasoning text
  const cleanReasoning = miroStep.finding
    .replace(/^MiroFish agents (AGREE|DISAGREE) with analysis[^.]*\.\s*(Reasoning:\s*)?/i, '')
    .replace(/^MiroFish returned no verdict:\s*/i, '');

  // Check for alternative cause in disputed finding
  const altMatch = miroStep.finding.match(/Alternative suggested:\s*([A-Z_]+)/);
  const altCause = altMatch ? altMatch[1] : null;

  return (
    <div className="space-y-2">
      {/* Verdict header */}
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${
        isConfirmed ? 'bg-violet-500/10 border-violet-500/30'
        : isDisputed ? 'bg-amber-500/10 border-amber-500/30'
        : 'bg-gray-500/8 border-gray-500/20'
      }`}>
        <span className={`material-symbols-outlined text-base ${isConfirmed ? 'text-violet-400' : isDisputed ? 'text-amber-400' : 'text-gray-400'}`}>
          precision_manufacturing
        </span>
        <div className="flex-1">
          <p className={`text-xs font-black uppercase tracking-widest ${isConfirmed ? 'text-violet-400' : isDisputed ? 'text-amber-400' : 'text-gray-400'}`}>
            {isConfirmed ? 'Agent Swarm Validated' : isDisputed ? 'Agent Swarm Disputed' : 'Inconclusive'}
          </p>
          {miroStep.contribution_weight > 0 && (
            <p className="text-[10px] text-th-muted tabular-nums">
              Confidence adjustment: +{Math.round(miroStep.contribution_weight * 100)} pts
            </p>
          )}
        </div>
      </div>

      {/* Reasoning */}
      {cleanReasoning && (
        <div className="rounded-lg bg-th-surface-overlay/30 border border-th-border/30 p-3">
          <p className="text-[11px] text-th-secondary leading-relaxed">{cleanReasoning}</p>
        </div>
      )}

      {/* Alternative cause — show prominently when disputed */}
      {isDisputed && altCause && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/8 border border-amber-500/20">
          <span className="material-symbols-outlined text-sm text-amber-400">swap_horiz</span>
          <div>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wide">Swarm suggests alternative</p>
            <p className="text-xs font-semibold text-th-heading">{altCause.replace(/_/g, ' ')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Intelligence Layer 5: Resolution ──────────────────────────────────── */
function ResolutionLayer({ rootCause, denial, suggestedActions }) {
  const validation = null; // Qwen3 validation shown here if re-fetched
  return (
    <div className="space-y-2">
      {rootCause?.confidence_score != null && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-th-muted">RCA Confidence</span>
            <span className={`text-xs font-bold tabular-nums ${
              rootCause.confidence_score >= 80 ? 'text-emerald-400'
              : rootCause.confidence_score >= 60 ? 'text-amber-400'
              : 'text-rose-400'
            }`}>{rootCause.confidence_score}%</span>
          </div>
          <RiskBar value={rootCause.confidence_score} max={100} />
        </div>
      )}
      {rootCause?.resolution_path && (
        <div className="rounded-lg p-3 bg-emerald-500/8 border border-emerald-500/20">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">lightbulb</span>
            Resolution Path
          </p>
          <p className="text-xs text-th-secondary leading-relaxed">{rootCause.resolution_path}</p>
        </div>
      )}
      {denial?.appeal_deadline && (
        <DataRow
          label="Appeal Deadline"
          value={fmtDate(denial.appeal_deadline)}
          valueClass={
            new Date(denial.appeal_deadline) < new Date(Date.now() + 7*86400000)
              ? 'text-rose-400 font-bold'
              : 'text-th-heading'
          }
        />
      )}
      {(suggestedActions || []).slice(0, 2).map((a, i) => (
        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-th-surface-overlay/30 border border-th-border/30">
          <span className="material-symbols-outlined text-sm text-primary mt-0.5">bolt</span>
          <div>
            <p className="text-xs font-semibold text-th-heading">{a.action || a.action_name}</p>
            {a.description && <p className="text-[10px] text-th-muted mt-0.5">{a.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Evidence Timeline (tab) ────────────────────────────────────────────── */
function EvidenceTimeline({ steps }) {
  const [expanded, setExpanded] = useState(null);
  if (!steps || steps.length === 0) return (
    <p className="text-sm text-th-muted text-center py-8">No RCA steps available.</p>
  );
  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const isMiro = step.step_name === 'MIROFISH_AGENT_VALIDATION';
        const dotColor = STEP_STATUS_DOT[step.finding_status] || 'bg-gray-400';
        const isExp = expanded === i;
        return (
          <div key={i} className={`flex gap-3 ${isMiro ? 'ring-1 ring-violet-500/30 rounded-lg p-2 bg-violet-500/5' : ''}`}>
            {/* Timeline indicator */}
            <div className="flex flex-col items-center shrink-0 pt-0.5">
              <div className={`size-2.5 rounded-full ${dotColor} ${isMiro ? 'ring-2 ring-violet-400/40' : ''}`} />
              {i < steps.length - 1 && <div className="w-px flex-1 bg-th-border/40 mt-1" />}
            </div>
            {/* Step content */}
            <div className="flex-1 pb-2">
              <button
                onClick={() => setExpanded(isExp ? null : i)}
                className="w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-th-muted tabular-nums w-5">
                    {step.step_number}
                  </span>
                  <span className={`text-xs font-semibold ${isMiro ? 'text-violet-400' : 'text-th-heading'}`}>
                    {step.step_name.replace(/_/g, ' ')}
                  </span>
                  <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                    step.finding_status === 'PASS' || step.finding_status === 'CONFIRMED'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : step.finding_status === 'FAIL' || step.finding_status === 'DISPUTED'
                      ? 'bg-rose-500/15 text-rose-400'
                      : step.finding_status === 'WARNING'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-gray-500/15 text-gray-400'
                  }`}>{step.finding_status}</span>
                  {step.contribution_weight > 0 && (
                    <span className="text-[10px] text-violet-400 font-bold tabular-nums">
                      +{Math.round(step.contribution_weight * 100)}
                    </span>
                  )}
                </div>
              </button>
              {(isExp || isMiro) && step.finding && (
                <p className={`text-[11px] leading-relaxed mt-1.5 ${isMiro ? 'text-th-secondary' : 'text-th-muted'}`}>
                  {step.finding
                    .replace(/^MiroFish agents (AGREE|DISAGREE) with analysis[^.]*\.\s*(Reasoning:\s*)?/i, '')
                    .replace(/^MiroFish returned no verdict:\s*/i, '')}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export function DenialIntelligence() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('intelligence');

  useEffect(() => {
    let cancelled = false;
    api.graph.getClaimFullContext(id).then(data => {
      if (!cancelled) { setCtx(data || null); setLoading(false); }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center h-full">
      <span className="material-symbols-outlined text-4xl text-th-muted animate-spin">progress_activity</span>
    </div>
  );

  if (!ctx?.claim) return (
    <div className="flex-1 flex flex-col items-center justify-center h-full gap-3 text-th-muted">
      <span className="material-symbols-outlined text-5xl">search_off</span>
      <p className="text-sm">Claim not found.</p>
      <button onClick={() => navigate(-1)} className="text-primary text-sm font-bold hover:underline">← Back</button>
    </div>
  );

  const { claim, denial, root_cause, eligibility, prior_auth, claim_lines,
          era_payment, suggested_actions, appeal } = ctx;
  const steps = root_cause?.steps || [];
  const group = root_cause?.root_cause_group;
  const groupStyle = GROUP_COLORS[group] || GROUP_COLORS.PROCESS;
  const statusStyle = STATUS_CHIP[claim.status] || 'bg-gray-500/15 text-gray-400 border-gray-500/30';

  const miroStep = steps.find(s => s.step_name === 'MIROFISH_AGENT_VALIDATION');
  const miroAvailable = miroStep && !miroStep.finding.startsWith('MiroFish unavailable')
    && !miroStep.finding.startsWith('MiroFish agent validation timed out');

  const TABS = [
    { id: 'intelligence', label: 'Intelligence', icon: 'psychology' },
    { id: 'evidence', label: 'Evidence Trail', icon: 'timeline' },
    { id: 'documents', label: 'Documents', icon: 'description' },
  ];

  return (
    <div className="flex-1 flex h-full overflow-hidden font-sans">

      {/* ── LEFT COLUMN: Claim Context (fixed 260px) ─────────────────── */}
      <div className="w-[260px] shrink-0 flex flex-col border-r border-th-border bg-th-surface-raised overflow-y-auto">
        {/* Back */}
        <div className="px-4 pt-4 pb-2">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-th-muted hover:text-th-heading transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </button>
        </div>

        {/* Claim ID + status */}
        <div className="px-4 pb-3 border-b border-th-border">
          <h1 className="text-base font-black text-th-heading tracking-tight font-mono">{id}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle}`}>
              {claim.status}
            </span>
            {group && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${groupStyle.bg} ${groupStyle.text} ${groupStyle.border}`}>
                {group}
              </span>
            )}
          </div>
        </div>

        {/* Claim meta */}
        <div className="px-4 py-3 border-b border-th-border space-y-2">
          <div>
            <p className="text-[10px] text-th-muted uppercase font-bold tracking-wider">Patient</p>
            <p className="text-xs font-semibold text-th-heading">{claim.patient_name || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] text-th-muted uppercase font-bold tracking-wider">Payer</p>
            <p className="text-xs font-semibold text-th-heading">{claim.payer_name || '—'}</p>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-[10px] text-th-muted uppercase font-bold tracking-wider">Charges</p>
              <p className="text-sm font-black text-th-heading tabular-nums">{fmtMoney(claim.total_charges)}</p>
            </div>
            {denial?.denial_amount && (
              <div>
                <p className="text-[10px] text-th-muted uppercase font-bold tracking-wider">Denied</p>
                <p className="text-sm font-black text-rose-400 tabular-nums">{fmtMoney(denial.denial_amount)}</p>
              </div>
            )}
          </div>
          {denial?.carc_code && (
            <div>
              <p className="text-[10px] text-th-muted uppercase font-bold tracking-wider">CARC</p>
              <p className="text-xs font-bold text-rose-400 font-mono">{denial.carc_code}</p>
            </div>
          )}
        </div>

        {/* RCA verdict summary */}
        {root_cause && (
          <div className="px-4 py-3 border-b border-th-border">
            <p className="text-[10px] text-th-muted uppercase font-bold tracking-wider mb-1.5">Root Cause</p>
            <p className="text-xs font-bold text-th-heading leading-snug">
              {(root_cause.primary_root_cause || '').replace(/_/g, ' ')}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${root_cause.confidence_score >= 80 ? 'bg-emerald-500' : root_cause.confidence_score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${root_cause.confidence_score || 0}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-th-muted tabular-nums w-8 text-right">
                {root_cause.confidence_score}%
              </span>
            </div>
          </div>
        )}

        {/* MiroFish verdict summary in sidebar */}
        {miroAvailable && (
          <div className="px-4 py-3 border-b border-th-border">
            <p className="text-[10px] text-th-muted uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-violet-400">precision_manufacturing</span>
              Agent Swarm
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              miroStep.finding_status === 'CONFIRMED'
                ? 'bg-violet-500/15 text-violet-400 border-violet-500/25'
                : miroStep.finding_status === 'DISPUTED'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                : 'bg-gray-500/15 text-gray-400 border-gray-500/20'
            }`}>
              {miroStep.finding_status === 'CONFIRMED' ? '✓ Validated'
               : miroStep.finding_status === 'DISPUTED' ? '⚠ Disputed'
               : 'Inconclusive'}
            </span>
          </div>
        )}

        {/* Quick actions */}
        <div className="px-4 py-3 space-y-2">
          <p className="text-[10px] text-th-muted uppercase font-bold tracking-wider">Actions</p>
          <button
            onClick={() => navigate(`/work/denials/appeals`)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors text-xs font-bold"
          >
            <span className="material-symbols-outlined text-sm">gavel</span>
            Generate Appeal
          </button>
          <Link
            to={`/analytics/denials/root-cause/claim/${id}`}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-th-surface-overlay/50 text-th-muted border border-th-border hover:bg-th-surface-overlay transition-colors text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            Full RCA Detail
          </Link>
        </div>
      </div>

      {/* ── CENTER COLUMN: Intelligence / Evidence tabs ──────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Tab nav */}
        <div className="flex items-center gap-0 border-b border-th-border px-4 bg-th-surface-raised shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-th-muted hover:text-th-heading'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'intelligence' && (
            <div className="space-y-3 max-w-2xl">
              <LayerCard icon="bar_chart" iconColor="text-blue-400" label="1 · Descriptive" badge={`CRS ${claim.crs_score ?? '—'}`} badgeColor={claim.crs_score >= 60 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'} defaultOpen>
                <DescriptiveLayer claim={claim} />
              </LayerCard>
              <LayerCard icon="account_tree" iconColor="text-blue-400" label="2 · Diagnostic — Graph Intelligence" badge="Neo4j" badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/20" defaultOpen>
                <DiagnosticLayer steps={steps} />
              </LayerCard>
              <LayerCard icon="model_training" iconColor="text-purple-400" label="3 · Predictive — ML Scores" badge="9 Models" badgeColor="bg-purple-500/10 text-purple-400 border-purple-500/20" defaultOpen>
                <PredictiveLayer rootCause={root_cause} claim={claim} />
              </LayerCard>
              <LayerCard
                icon="precision_manufacturing"
                iconColor="text-violet-400"
                label="4 · Prescriptive — Agent Swarm"
                badge={miroAvailable ? miroStep?.finding_status : 'Offline'}
                badgeColor={
                  miroStep?.finding_status === 'CONFIRMED' ? 'bg-violet-500/15 text-violet-400 border-violet-500/25'
                  : miroStep?.finding_status === 'DISPUTED' ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                  : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }
                defaultOpen
              >
                <PrescriptiveLayer steps={steps} />
              </LayerCard>
              <LayerCard icon="task_alt" iconColor="text-emerald-400" label="5 · Resolution" badge={`${root_cause?.confidence_score ?? '—'}% confidence`} badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" defaultOpen>
                <ResolutionLayer rootCause={root_cause} denial={denial} suggestedActions={suggested_actions} />
              </LayerCard>
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="max-w-2xl">
              <p className="text-xs text-th-muted mb-4">
                {steps.length} analysis steps · each step contributed evidence points to the final root cause
              </p>
              <EvidenceTimeline steps={steps} />
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-3 max-w-2xl">
              {/* Claim Lines */}
              {claim_lines?.length > 0 && (
                <div className="rounded-xl border border-th-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-th-border bg-th-surface-raised">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-th-muted">Claim Lines ({claim_lines.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-th-border text-th-muted font-semibold uppercase text-[10px]">
                        <th className="px-4 py-2 text-left">CPT</th>
                        <th className="px-4 py-2 text-left">ICD-10</th>
                        <th className="px-4 py-2 text-left">Mod</th>
                        <th className="px-4 py-2 text-right">Units</th>
                        <th className="px-4 py-2 text-right">Charge</th>
                      </tr></thead>
                      <tbody>
                        {claim_lines.map((l, i) => (
                          <tr key={i} className="border-b border-th-border/30 last:border-0">
                            <td className="px-4 py-2.5 font-bold text-primary font-mono">{l.cpt_code}</td>
                            <td className="px-4 py-2.5 font-mono text-th-muted">{l.icd10_primary || '—'}</td>
                            <td className="px-4 py-2.5 text-th-muted">{l.modifier_1 || '—'}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-th-heading">{l.units}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-bold text-th-heading">{fmtMoney(l.charge_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* Eligibility + Auth */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-th-border p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted mb-2">Eligibility</p>
                  {eligibility
                    ? <DataRow label="Status" value={eligibility.subscriber_status} valueClass={eligibility.subscriber_status === 'ACTIVE' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'} />
                    : <p className="text-xs text-th-muted italic">Not on file</p>
                  }
                </div>
                <div className="rounded-xl border border-th-border p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted mb-2">Prior Auth</p>
                  {prior_auth
                    ? <DataRow label="Status" value={prior_auth.status} valueClass={prior_auth.status === 'APPROVED' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'} />
                    : <p className="text-xs text-th-muted italic">Not required / not found</p>
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT COLUMN: Action Panel (fixed 280px) ─────────────────── */}
      <div className="w-[280px] shrink-0 flex flex-col border-l border-th-border bg-th-surface-raised overflow-y-auto">
        <div className="px-4 py-3 border-b border-th-border">
          <h2 className="text-xs font-black uppercase tracking-widest text-th-muted">Action Panel</h2>
        </div>

        {/* Primary recommendation */}
        {root_cause?.resolution_path && (
          <div className="px-4 py-3 border-b border-th-border">
            <p className="text-[10px] text-th-muted uppercase font-bold tracking-wider mb-1.5">Recommended Action</p>
            <p className="text-xs text-th-secondary leading-relaxed">{root_cause.resolution_path}</p>
          </div>
        )}

        {/* Denial details */}
        {denial && (
          <div className="px-4 py-3 border-b border-th-border space-y-2">
            <p className="text-[10px] text-th-muted uppercase font-bold tracking-wider">Denial Info</p>
            <DataRow label="Category" value={denial.denial_category?.replace(/_/g, ' ')} />
            <DataRow label="CARC" value={denial.carc_code} valueClass="text-rose-400 font-mono font-bold" />
            <DataRow label="Denied" value={fmtMoney(denial.denial_amount)} valueClass="text-rose-400 font-bold" />
            {denial.appeal_deadline && (
              <DataRow
                label="Appeal by"
                value={fmtDate(denial.appeal_deadline)}
                valueClass={new Date(denial.appeal_deadline) < new Date(Date.now() + 7*86400000) ? 'text-rose-400 font-bold' : 'text-th-heading'}
              />
            )}
          </div>
        )}

        {/* MiroFish confidence summary */}
        {miroAvailable && (
          <div className="px-4 py-3 border-b border-th-border">
            <p className="text-[10px] text-th-muted uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-violet-400">precision_manufacturing</span>
              Swarm Assessment
            </p>
            <div className={`text-[11px] leading-relaxed p-2.5 rounded-lg ${miroStep.finding_status === 'CONFIRMED' ? 'bg-violet-500/8 text-th-secondary' : 'bg-amber-500/8 text-th-secondary'}`}>
              {miroStep.finding
                .replace(/^MiroFish agents (AGREE|DISAGREE) with analysis[^.]*\.\s*(Reasoning:\s*)?/i, '')
                .replace(/^MiroFish returned no verdict:\s*/i, '')
                .substring(0, 160)}
            </div>
          </div>
        )}

        {/* Suggested actions from pipeline */}
        {(suggested_actions || []).length > 0 && (
          <div className="px-4 py-3 space-y-2">
            <p className="text-[10px] text-th-muted uppercase font-bold tracking-wider">Pipeline Suggestions</p>
            {suggested_actions.slice(0, 3).map((a, i) => (
              <div key={i} className="rounded-lg p-2.5 bg-th-surface-overlay/30 border border-th-border/30">
                <p className="text-[11px] font-semibold text-th-heading">{a.action || a.action_name}</p>
                {a.expected_value && (
                  <p className="text-[10px] text-emerald-400 font-bold tabular-nums mt-0.5">
                    EV: {fmtMoney(a.expected_value)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DenialIntelligence;
