import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../../services/api';
import { RootCauseGraph } from '../../../components/ui/RootCauseGraph';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const fmt = (n) => {
  if (n == null) return '$0';
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};

const fmtExact = (n) => {
  if (n == null) return '$0.00';
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (d) => {
  if (!d) return '---';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const fmtShortDate = (d) => {
  if (!d) return '---';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const daysBetween = (a, b) => {
  if (!a || !b) return null;
  const d1 = new Date(a);
  const d2 = new Date(b);
  if (isNaN(d1) || isNaN(d2)) return null;
  return Math.round((d2 - d1) / 86400000);
};

const daysFromNow = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return Math.ceil((dt - new Date()) / 86400000);
};

const pctFmt = (n) => {
  if (n == null) return '0%';
  return `${Number(n).toFixed(1)}%`;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const STATUS_BADGE = {
  DENIED:    'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  PAID:      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  SUBMITTED: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  PENDING:   'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  APPEALED:  'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  ADJUSTED:  'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  DRAFT:     'bg-gray-500/10 text-gray-400 border border-gray-500/20',
};

const PRIORITY_BADGE = {
  HIGH:   'bg-rose-500/10 text-rose-400 border-rose-500/20',
  MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  LOW:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const GROUP_COLORS = {
  PREVENTABLE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PROCESS:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PAYER:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  CLINICAL:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const STAGE_STATUS_COLORS = {
  complete: { node: 'bg-emerald-500 border-emerald-400 text-white', label: 'text-emerald-400', line: 'bg-emerald-500' },
  current:  { node: 'bg-blue-500 border-blue-400 text-white animate-pulse', label: 'text-blue-400', line: 'bg-blue-500' },
  alert:    { node: 'bg-rose-500 border-rose-400 text-white', label: 'text-rose-400', line: 'bg-rose-500' },
  pending:  { node: 'bg-th-surface-overlay border-th-border text-th-muted', label: 'text-th-muted', line: 'bg-th-border' },
};

const CONTRACT_STATUS_BADGE = {
  CORRECT:    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  UNDERPAID:  'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  OVERPAID:   'bg-amber-500/10 text-amber-400 border border-amber-500/20',
};

const RECON_STATUS_BADGE = {
  MATCHED:    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  VARIANCE:   'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  PENDING:    'bg-amber-500/10 text-amber-400 border border-amber-500/20',
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export function ClaimRootCauseDetail() {
  const { claimId } = useParams();
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState(null);
  const [validation, setValidation] = useState(null);
  const [validating, setValidating] = useState(false);
  const [claimDiagnostic, setClaimDiagnostic] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.graph.getClaimFullContext(claimId);
        if (!cancelled) setCtx(data || null);
      } catch {
        if (!cancelled) setCtx(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [claimId]);

  /* Fetch AI insight once we have context */
  useEffect(() => {
    if (!ctx) return;
    let cancelled = false;
    async function fetchInsight() {
      try {
        const insights = await api.ai.getInsights('denials');
        if (!cancelled && insights?.length) {
          const match = insights.find(
            (i) => ctx.denial && i.category && i.category === ctx.denial.denial_category
          );
          setAiInsight(match || insights[0]);
        }
      } catch { /* silent */ }
    }
    fetchInsight();
    return () => { cancelled = true; };
  }, [ctx]);

  /* Fetch claim-level diagnostic */
  useEffect(() => {
    if (!claimId) return;
    let cancelled = false;
    api.diagnostics.getClaimDiagnostic(claimId)
      .then(res => { if (!cancelled) setClaimDiagnostic(res); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [claimId]);

  /* --- Loading --- */
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-th-muted">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  /* --- Empty / Error --- */
  if (!ctx || !ctx.claim) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-th-muted gap-3">
        <Link to="/analytics/root-cause" className="flex items-center gap-2 text-primary text-sm font-bold hover:underline mb-4">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to Root Cause Intelligence
        </Link>
        <span className="material-symbols-outlined text-5xl">search_off</span>
        <p className="text-sm">No claim data available for <span className="font-mono font-bold">{claimId}</span>.</p>
      </div>
    );
  }

  const { claim, denial, root_cause, era_payment, claim_lines, eligibility, prior_auth, suggested_actions,
    lifecycle_stages, contract_comparison, reconciliation, payment_prediction } = ctx;

  const isDenied = claim.status === 'DENIED' || claim.status === 'APPEALED';
  const isPaid = claim.status === 'PAID' || claim.status === 'ADJUSTED' || !!era_payment;
  const isPending = claim.status === 'SUBMITTED' || claim.status === 'PENDING';
  const isDraft = claim.status === 'DRAFT';

  /* ================================================================ */
  /*  SECTION 1 -- CLAIM HEADER                                        */
  /* ================================================================ */
  const ClaimHeader = () => (
    <div className="bg-th-surface-raised border border-th-border rounded-xl p-5 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Back */}
        <Link to="/analytics/root-cause" className="flex items-center justify-center h-9 w-9 rounded-lg bg-th-surface-overlay border border-th-border hover:bg-th-surface-raised transition-colors shrink-0">
          <span className="material-symbols-outlined text-th-heading text-lg">arrow_back</span>
        </Link>

        {/* Claim ID */}
        <div className="mr-auto">
          <h1 className="text-2xl font-black text-th-heading tracking-tight tabular-nums">{claim.claim_id || claimId}</h1>
          <p className="text-xs text-th-muted mt-0.5">
            {claim.patient_name || 'Unknown Patient'}
            {claim.payer_name ? <> &middot; <span className="text-th-secondary">{claim.payer_name}</span></> : null}
          </p>
        </div>

        {/* Status badge */}
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[claim.status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
          {claim.status}
        </span>

        {/* Claim type badge */}
        {claim.claim_type && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-th-surface-overlay text-th-secondary border border-th-border">
            {claim.claim_type}
          </span>
        )}

        {/* Financials */}
        <div className="text-right">
          <p className="text-xs text-th-muted">Total Charges</p>
          <p className="text-lg font-black text-th-heading tabular-nums">{fmt(claim.total_charges)}</p>
        </div>
        {denial && (
          <div className="text-right">
            <p className="text-xs text-th-muted">Denied</p>
            <p className="text-lg font-black text-rose-400 tabular-nums">{fmt(denial.denial_amount)}</p>
          </div>
        )}
        {isPaid && era_payment && !denial && (
          <div className="text-right">
            <p className="text-xs text-th-muted">Paid</p>
            <p className="text-lg font-black text-emerald-400 tabular-nums">{fmt(era_payment.payment_amount)}</p>
          </div>
        )}
      </div>
    </div>
  );

  /* ================================================================ */
  /*  SECTION 2 -- CLAIM LIFECYCLE TIMELINE (API-driven)               */
  /* ================================================================ */
  const ClaimTimeline = () => {
    /* Use lifecycle_stages from API if available, otherwise compute client-side */
    const apiStages = lifecycle_stages && lifecycle_stages.length > 0;

    if (apiStages) {
      return (
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-6 overflow-x-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-th-muted mb-5">Claim Lifecycle</h3>
          <div className="flex items-start min-w-[700px]">
            {lifecycle_stages.map((stage, i) => {
              const colors = STAGE_STATUS_COLORS[stage.status] || STAGE_STATUS_COLORS.pending;
              const prevDate = i > 0 ? lifecycle_stages[i - 1].date : null;
              const gap = prevDate && stage.date ? daysBetween(prevDate, stage.date) : null;

              return (
                <React.Fragment key={stage.stage || i}>
                  {/* Connector line */}
                  {i > 0 && (
                    <div className="flex flex-col items-center flex-1 pt-3">
                      <div className={`h-0.5 w-full ${colors.line}`} />
                      {gap != null && (
                        <span className="text-[10px] text-th-muted tabular-nums mt-1">{gap}d</span>
                      )}
                    </div>
                  )}
                  {/* Stage node */}
                  <div className="flex flex-col items-center w-24 shrink-0">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${colors.node}`}>
                      {stage.status === 'complete' ? (
                        <span className="material-symbols-outlined text-sm">check</span>
                      ) : stage.status === 'alert' ? (
                        <span className="material-symbols-outlined text-sm">priority_high</span>
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </div>
                    <p className={`text-[10px] font-bold mt-1.5 text-center ${colors.label}`}>
                      {stage.stage}
                    </p>
                    <p className="text-[10px] text-th-muted tabular-nums mt-0.5">{fmtShortDate(stage.date)}</p>
                    {stage.score != null && (
                      <p className={`text-[10px] font-bold tabular-nums mt-0.5 ${stage.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        Score: {stage.score}
                      </p>
                    )}
                    {stage.amount != null && (
                      <p className="text-[10px] font-bold tabular-nums mt-0.5 text-th-secondary">{fmt(stage.amount)}</p>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      );
    }

    /* Fallback: client-side computed stages */
    const STAGES = [
      { key: 'dos',          label: 'DOS',          date: claim.date_of_service },
      { key: 'submitted',    label: 'Submitted',    date: claim.submission_date },
      { key: 'crs_scored',   label: 'CRS Scored',   date: claim.submission_date, extra: claim.crs_score != null ? `Score: ${claim.crs_score}` : null },
      { key: 'acknowledged', label: 'Acknowledged',  date: null },
      { key: 'adjudicated',  label: 'Adjudicated',  date: denial?.denial_date || era_payment?.payment_date },
      { key: 'denied',       label: isDenied ? 'DENIED' : 'Paid', date: denial?.denial_date || era_payment?.payment_date, extra: denial ? fmt(denial.denial_amount) : era_payment ? fmt(era_payment.payment_amount) : null },
      { key: 'appeal',       label: 'Appeal Deadline', date: denial?.appeal_deadline },
    ];

    const currentStageIndex = (() => {
      if (denial?.appeal_deadline) return 5;
      if (era_payment) return 5;
      if (denial?.denial_date) return 5;
      if (claim.submission_date) return 2;
      if (claim.date_of_service) return 0;
      return 0;
    })();

    return (
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-6 overflow-x-auto">
        <h3 className="text-xs font-bold uppercase tracking-wider text-th-muted mb-5">Claim Lifecycle</h3>
        <div className="flex items-start min-w-[700px]">
          {STAGES.map((stage, i) => {
            const isReached = i <= currentStageIndex;
            const isCurrent = i === currentStageIndex;
            const isAlerted = stage.key === 'denied' && isDenied;
            const prevDate = i > 0 ? STAGES[i - 1].date : null;
            const gap = prevDate && stage.date ? daysBetween(prevDate, stage.date) : null;

            return (
              <React.Fragment key={stage.key}>
                {i > 0 && (
                  <div className="flex flex-col items-center flex-1 pt-3">
                    <div className={`h-0.5 w-full ${isReached ? 'bg-primary' : 'bg-th-border'}`} />
                    {gap != null && (
                      <span className="text-[10px] text-th-muted tabular-nums mt-1">{gap}d</span>
                    )}
                  </div>
                )}
                <div className="flex flex-col items-center w-24 shrink-0">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                    ${isCurrent ? (isAlerted ? 'bg-rose-500 border-rose-400 text-white' : 'bg-primary border-primary text-white') :
                      isReached ? 'bg-th-surface-overlay border-primary text-primary' :
                      'bg-th-surface-overlay border-th-border text-th-muted'}`}>
                    {isReached && !isCurrent ? (
                      <span className="material-symbols-outlined text-sm">check</span>
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  <p className={`text-[10px] font-bold mt-1.5 text-center ${isCurrent ? (isAlerted ? 'text-rose-400' : 'text-primary') : isReached ? 'text-th-heading' : 'text-th-muted'}`}>
                    {stage.label}
                  </p>
                  <p className="text-[10px] text-th-muted tabular-nums mt-0.5">{fmtShortDate(stage.date)}</p>
                  {stage.extra && <p className={`text-[10px] font-bold tabular-nums mt-0.5 ${isAlerted ? 'text-rose-400' : 'text-th-secondary'}`}>{stage.extra}</p>}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  SECTION 3 -- DENIAL DETAILS (only for DENIED/APPEALED)           */
  /* ================================================================ */
  const DenialDetails = () => {
    if (!denial || !isDenied) return null;

    const daysLeft = daysFromNow(denial.appeal_deadline);
    const deadlineColor = daysLeft == null ? 'text-th-muted' :
      daysLeft > 60 ? 'text-emerald-400' :
      daysLeft > 30 ? 'text-amber-400' : 'text-rose-400';
    const deadlineBg = daysLeft == null ? 'bg-th-surface-overlay' :
      daysLeft > 60 ? 'bg-emerald-500/10' :
      daysLeft > 30 ? 'bg-amber-500/10' : 'bg-rose-500/10';

    return (
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-6 border-l-[3px] border-l-rose-500">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-rose-400">gavel</span>
          <h3 className="text-sm font-bold text-th-heading uppercase tracking-wider">Denial Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* CARC Code */}
          <div className="col-span-1 md:col-span-2 bg-th-surface-overlay/50 rounded-lg p-4">
            <p className="text-[10px] text-th-muted uppercase font-bold mb-1">CARC Code</p>
            <p className="text-lg font-black text-rose-400 tabular-nums">{denial.carc_code}</p>
            <p className="text-sm text-th-secondary mt-1">{denial.carc_description}</p>
          </div>

          {/* Denial Amount */}
          <div className="bg-th-surface-overlay/50 rounded-lg p-4">
            <p className="text-[10px] text-th-muted uppercase font-bold mb-1">Denial Amount</p>
            <p className="text-2xl font-black text-rose-400 tabular-nums">{fmt(denial.denial_amount)}</p>
            {denial.denial_category && (
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {denial.denial_category}
              </span>
            )}
          </div>

          {/* Appeal Deadline */}
          <div className={`rounded-lg p-4 ${deadlineBg}`}>
            <p className="text-[10px] text-th-muted uppercase font-bold mb-1">Appeal Deadline</p>
            <p className={`text-lg font-black tabular-nums ${deadlineColor}`}>{fmtDate(denial.appeal_deadline)}</p>
            {daysLeft != null && (
              <p className={`text-sm font-bold mt-1 tabular-nums ${deadlineColor}`}>
                {daysLeft > 0 ? `${daysLeft} days remaining` : daysLeft === 0 ? 'Today!' : `${Math.abs(daysLeft)} days overdue`}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {denial.similar_denial_30d != null && (
            <div className="flex items-center gap-2 text-sm text-th-secondary">
              <span className="material-symbols-outlined text-amber-400 text-base">warning</span>
              <span className="font-bold tabular-nums">{denial.similar_denial_30d}</span>
              <span>similar denials from this payer in the last 30 days</span>
            </div>
          )}
          {denial.recommended_action && (
            <div className="flex items-center gap-2 text-sm ml-auto">
              <span className="material-symbols-outlined text-primary text-base">lightbulb</span>
              <span className="text-th-secondary">{denial.recommended_action}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  SECTION 3b -- PAYMENT DETAILS (only for PAID claims)             */
  /* ================================================================ */
  const PaymentDetails = () => {
    if (!isPaid || !era_payment || isDenied) return null;

    return (
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-6 border-l-[3px] border-l-emerald-500">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-emerald-400">payments</span>
          <h3 className="text-sm font-bold text-th-heading uppercase tracking-wider">Payment Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Payment Amount */}
          <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10">
            <p className="text-[10px] text-th-muted uppercase font-bold mb-1">Payment Amount</p>
            <p className="text-3xl font-black text-emerald-400 tabular-nums">{fmtExact(era_payment.payment_amount)}</p>
          </div>

          {/* Payment Date */}
          <div className="bg-th-surface-overlay/50 rounded-lg p-4">
            <p className="text-[10px] text-th-muted uppercase font-bold mb-1">Payment Date</p>
            <p className="text-lg font-black text-th-heading tabular-nums">{fmtDate(era_payment.payment_date)}</p>
            {era_payment.payment_method && (
              <p className="text-xs text-th-secondary mt-1">{era_payment.payment_method}</p>
            )}
          </div>

          {/* Allowed & Adjustments */}
          <div className="bg-th-surface-overlay/50 rounded-lg p-4">
            <p className="text-[10px] text-th-muted uppercase font-bold mb-1">Allowed Amount</p>
            <p className="text-lg font-black text-th-heading tabular-nums">{fmtExact(era_payment.allowed_amount)}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {era_payment.co_amount != null && (
                <span className="text-[10px] font-bold text-amber-400 tabular-nums">CO: {fmtExact(era_payment.co_amount)}</span>
              )}
              {era_payment.pr_amount != null && (
                <span className="text-[10px] font-bold text-blue-400 tabular-nums">PR: {fmtExact(era_payment.pr_amount)}</span>
              )}
              {era_payment.oa_amount != null && (
                <span className="text-[10px] font-bold text-purple-400 tabular-nums">OA: {fmtExact(era_payment.oa_amount)}</span>
              )}
            </div>
          </div>

          {/* EFT Trace */}
          <div className="bg-th-surface-overlay/50 rounded-lg p-4">
            <p className="text-[10px] text-th-muted uppercase font-bold mb-1">EFT / Trace</p>
            <p className="text-sm font-bold text-th-heading font-mono tabular-nums">{era_payment.eft_trace_number || era_payment.check_number || '---'}</p>
            {era_payment.payment_method && (
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {era_payment.payment_method}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  SECTION 3c -- CONTRACT COMPARISON (only for PAID claims)         */
  /* ================================================================ */
  const ContractComparisonCard = () => {
    const cc = contract_comparison;
    if (!isPaid || !cc || isDenied) return null;

    const statusBadge = CONTRACT_STATUS_BADGE[cc.status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20';

    return (
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-blue-400">compare_arrows</span>
          <h3 className="text-sm font-bold text-th-heading uppercase tracking-wider">Contract Comparison</h3>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${statusBadge}`}>
            {cc.status}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-th-surface-overlay/50 rounded-lg p-4">
            <p className="text-[10px] text-th-muted uppercase font-bold mb-1">Expected Rate</p>
            <p className="text-lg font-black text-th-heading tabular-nums">{fmtExact(cc.expected_rate)}</p>
          </div>
          <div className="bg-th-surface-overlay/50 rounded-lg p-4">
            <p className="text-[10px] text-th-muted uppercase font-bold mb-1">Actual Paid</p>
            <p className="text-lg font-black text-th-heading tabular-nums">{fmtExact(cc.actual_paid)}</p>
          </div>
          <div className="bg-th-surface-overlay/50 rounded-lg p-4">
            <p className="text-[10px] text-th-muted uppercase font-bold mb-1">Variance</p>
            <p className={`text-lg font-black tabular-nums ${cc.variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {cc.variance >= 0 ? '+' : ''}{fmtExact(cc.variance)}
            </p>
          </div>
          <div className="bg-th-surface-overlay/50 rounded-lg p-4">
            <p className="text-[10px] text-th-muted uppercase font-bold mb-1">Variance %</p>
            <p className={`text-lg font-black tabular-nums ${(cc.variance_pct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(cc.variance_pct || 0) >= 0 ? '+' : ''}{pctFmt(cc.variance_pct)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  SECTION 3d -- RECONCILIATION (only for PAID claims)              */
  /* ================================================================ */
  const ReconciliationCard = () => {
    const rec = reconciliation;
    if (!isPaid || !rec || isDenied) return null;

    const statusBadge = RECON_STATUS_BADGE[rec.status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20';

    return (
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-cyan-400">balance</span>
          <h3 className="text-sm font-bold text-th-heading uppercase tracking-wider">Reconciliation</h3>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${statusBadge}`}>
            {rec.status}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-th-surface-overlay/50 rounded-lg p-4">
            <p className="text-[10px] text-th-muted uppercase font-bold mb-1">ERA Amount</p>
            <p className="text-lg font-black text-th-heading tabular-nums">{fmtExact(rec.era_amount)}</p>
          </div>
          <div className="bg-th-surface-overlay/50 rounded-lg p-4">
            <p className="text-[10px] text-th-muted uppercase font-bold mb-1">Bank Amount</p>
            <p className="text-lg font-black text-th-heading tabular-nums">{fmtExact(rec.bank_amount)}</p>
          </div>
          <div className="bg-th-surface-overlay/50 rounded-lg p-4">
            <p className="text-[10px] text-th-muted uppercase font-bold mb-1">Variance</p>
            <p className={`text-lg font-black tabular-nums ${(rec.variance || 0) === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {fmtExact(rec.variance)}
            </p>
          </div>
          <div className="bg-th-surface-overlay/50 rounded-lg p-4">
            <p className="text-[10px] text-th-muted uppercase font-bold mb-1">Variance %</p>
            <p className={`text-lg font-black tabular-nums ${(rec.variance_pct || 0) === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {pctFmt(rec.variance_pct)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  SECTION 3e -- PAYMENT PREDICTION (PENDING/SUBMITTED claims)      */
  /* ================================================================ */
  const PaymentPredictionSection = () => {
    if (!isPending) return null;
    const pp = payment_prediction;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Payment Prediction */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 border-l-[3px] border-l-blue-500">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-blue-400">schedule</span>
            <h3 className="text-sm font-bold text-th-heading uppercase tracking-wider">Payment Prediction</h3>
          </div>
          {pp ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-th-surface-overlay/50 rounded-lg p-4">
                <p className="text-[10px] text-th-muted uppercase font-bold mb-1">Expected Payment Date</p>
                <p className="text-lg font-black text-th-heading tabular-nums">{fmtDate(pp.expected_payment_date)}</p>
              </div>
              <div className="bg-th-surface-overlay/50 rounded-lg p-4">
                <p className="text-[10px] text-th-muted uppercase font-bold mb-1">ADTP Days</p>
                <p className="text-lg font-black text-th-heading tabular-nums">{pp.adtp_days ?? '---'}</p>
              </div>
              <div className="bg-th-surface-overlay/50 rounded-lg p-4">
                <p className="text-[10px] text-th-muted uppercase font-bold mb-1">Days Elapsed</p>
                <p className="text-lg font-black text-th-heading tabular-nums">{pp.days_elapsed ?? '---'}</p>
              </div>
              <div className={`rounded-lg p-4 ${pp.status === 'ON_TRACK' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                <p className="text-[10px] text-th-muted uppercase font-bold mb-1">Status</p>
                <p className={`text-lg font-black tabular-nums ${pp.status === 'ON_TRACK' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {pp.status === 'ON_TRACK' ? 'On Track' : 'Overdue'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-th-surface-overlay/50 rounded-lg p-4">
                <p className="text-[10px] text-th-muted uppercase font-bold mb-1">Expected Payment</p>
                <p className="text-lg font-black text-th-heading tabular-nums">{fmtDate(claim.expected_payment_date)}</p>
              </div>
              <div className="bg-th-surface-overlay/50 rounded-lg p-4">
                <p className="text-[10px] text-th-muted uppercase font-bold mb-1">ADTP Days</p>
                <p className="text-lg font-black text-th-heading tabular-nums">{claim.adtp_days ?? '---'}</p>
              </div>
            </div>
          )}
        </div>

        {/* CRS Score Card */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 border-l-[3px] border-l-purple-500">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-purple-400">speed</span>
            <h3 className="text-sm font-bold text-th-heading uppercase tracking-wider">CRS Score</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <p className={`text-5xl font-black tabular-nums ${(claim.crs_score || 0) >= 60 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {claim.crs_score ?? '---'}
              </p>
              <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                (claim.crs_score || 0) >= 60
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {(claim.crs_score || 0) >= 60 ? 'PASS' : 'FAIL'}
              </span>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-th-muted">Risk Level</span>
                <span className={`font-bold ${
                  (claim.crs_score || 0) >= 80 ? 'text-emerald-400' :
                  (claim.crs_score || 0) >= 60 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {(claim.crs_score || 0) >= 80 ? 'Low Risk' :
                   (claim.crs_score || 0) >= 60 ? 'Medium Risk' : 'High Risk'}
                </span>
              </div>
              <div className="w-full bg-th-surface-overlay h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (claim.crs_score || 0) >= 80 ? 'bg-emerald-500' :
                    (claim.crs_score || 0) >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(claim.crs_score || 0, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-th-muted">Claims Readiness Score threshold: 60</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  SECTION 3f -- PRE-SUBMISSION CHECKLIST (DRAFT claims)            */
  /* ================================================================ */
  const PreSubmissionChecklist = () => {
    if (!isDraft) return null;

    const eligOk = !!eligibility && eligibility.subscriber_status === 'ACTIVE';
    const authOk = !!prior_auth && prior_auth.status === 'APPROVED';
    const crsOk = (claim.crs_score || 0) >= 60;

    const items = [
      { label: 'Eligibility Verified', ok: eligOk, detail: eligOk ? `Status: ${eligibility.subscriber_status}` : 'No eligibility verification on file' },
      { label: 'Authorization Obtained', ok: authOk, detail: authOk ? `Auth #${prior_auth.auth_number}` : 'No prior authorization on file' },
      { label: 'CRS Score (Pass/Fail)', ok: crsOk, detail: `Score: ${claim.crs_score ?? 'N/A'} (threshold: 60)` },
    ];

    const missingItems = items.filter(i => !i.ok);

    return (
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-6 border-l-[3px] border-l-gray-500">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-gray-400">checklist</span>
          <h3 className="text-sm font-bold text-th-heading uppercase tracking-wider">Pre-Submission Checklist</h3>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
            missingItems.length === 0
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {missingItems.length === 0 ? 'Ready' : `${missingItems.length} Missing`}
          </span>
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
              item.ok
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-rose-500/5 border-rose-500/20'
            }`}>
              <span className={`material-symbols-outlined text-lg ${item.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                {item.ok ? 'check_circle' : 'cancel'}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${item.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{item.label}</p>
                <p className="text-xs text-th-muted mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
        {missingItems.length > 0 && (
          <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <p className="text-xs font-bold text-amber-400">
              <span className="material-symbols-outlined text-sm align-middle mr-1">warning</span>
              {missingItems.length} item{missingItems.length !== 1 ? 's' : ''} must be resolved before submission
            </p>
          </div>
        )}
      </div>
    );
  };

  /* ================================================================ */
  /*  SECTION 4 -- ROOT CAUSE GRAPH (only for denied claims)           */
  /* ================================================================ */
  const handleValidate = async () => {
    setValidating(true);
    setValidation(null);
    try {
      const result = await api.rootCause.validateClaim(claim.claim_id || claimId);
      setValidation(result);
    } catch {
      setValidation({ validated: false, reasoning: 'Validation request failed' });
    } finally {
      setValidating(false);
    }
  };

  const RootCauseSection = () => {
    if (!root_cause || !isDenied) return null;
    return (
      <div className="mb-6">
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-purple-400">auto_awesome</span>
            <h3 className="text-sm font-bold text-th-heading uppercase tracking-wider">Root Cause Analysis</h3>
            {root_cause.root_cause_group && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold border ${GROUP_COLORS[root_cause.root_cause_group] || ''}`}>
                {root_cause.root_cause_group}
              </span>
            )}
            {/* Validate with AI button */}
            <button
              onClick={handleValidate}
              disabled={validating}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validating ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  Validating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">neurology</span>
                  Validate with AI
                </>
              )}
            </button>
          </div>
          {root_cause.evidence_summary && (
            <p className="text-xs text-th-muted mb-4 max-w-2xl">{root_cause.evidence_summary}</p>
          )}

          {/* Validation result banner */}
          {validation && (
            <div className={`mb-4 p-3 rounded-lg border text-xs ${
              !validation.validated
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : validation.agrees
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1">
                {!validation.validated ? (
                  <>
                    <span className="material-symbols-outlined text-sm">warning</span>
                    AI Validation Unavailable
                  </>
                ) : validation.agrees ? (
                  <>
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    AI AGREES
                    {validation.adjustment > 0 && (
                      <span className="ml-1 text-emerald-300">(+{validation.adjustment}% confidence)</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">cancel</span>
                    AI DISAGREES
                    {validation.alternative_cause && (
                      <span className="ml-1 font-normal">
                        &mdash; suggests <span className="font-bold">{validation.alternative_cause}</span> instead
                      </span>
                    )}
                  </>
                )}
              </div>
              {validation.reasoning && (
                <p className="text-th-muted leading-relaxed">{validation.reasoning}</p>
              )}
              {validation.evidence_needed && (
                <p className="text-th-muted mt-1 italic">Evidence needed: {validation.evidence_needed}</p>
              )}
              {validation.validated && (
                <p className="text-th-muted mt-1 tabular-nums">
                  Confidence: {validation.original_confidence}%
                  <span className="mx-1">&rarr;</span>
                  <span className={validation.adjusted_confidence > validation.original_confidence ? 'text-emerald-400 font-bold' : validation.adjusted_confidence < validation.original_confidence ? 'text-rose-400 font-bold' : ''}>
                    {validation.adjusted_confidence}%
                  </span>
                  <span className="ml-2 text-th-muted">({validation.validation_source})</span>
                </p>
              )}
            </div>
          )}

          <RootCauseGraph
            steps={root_cause.steps || []}
            primaryRootCause={root_cause.primary_root_cause}
            confidence={validation?.validated ? validation.adjusted_confidence : root_cause.confidence_score}
            denialAmount={denial?.denial_amount}
            claimId={claim.claim_id || claimId}
            rootCauseGroup={root_cause.root_cause_group}
            resolutionPath={root_cause.resolution_path}
            carcCode={denial?.carc_code}
          />
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  SECTION 5 -- CLAIM LINES TABLE                                    */
  /* ================================================================ */
  const ClaimLinesTable = () => {
    if (!claim_lines || claim_lines.length === 0) return null;
    return (
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-th-secondary">receipt_long</span>
          <h3 className="text-sm font-bold text-th-heading uppercase tracking-wider">Claim Lines</h3>
          <span className="text-xs text-th-muted ml-1">({claim_lines.length} line{claim_lines.length !== 1 ? 's' : ''})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-th-muted border-b border-th-border">
                <th className="text-left pb-2 pr-4">Line</th>
                <th className="text-left pb-2 pr-4">CPT Code</th>
                <th className="text-left pb-2 pr-4">ICD-10</th>
                <th className="text-left pb-2 pr-4">Modifier</th>
                <th className="text-right pb-2 pr-4">Units</th>
                <th className="text-right pb-2">Charge</th>
              </tr>
            </thead>
            <tbody>
              {claim_lines.map((line, i) => (
                <tr key={i} className="border-b border-th-border/50 last:border-0">
                  <td className="py-2.5 pr-4 text-th-muted tabular-nums">{line.line_number || i + 1}</td>
                  <td className="py-2.5 pr-4 font-bold text-th-heading font-mono">{line.cpt_code}</td>
                  <td className="py-2.5 pr-4 text-th-secondary font-mono">{line.icd10_primary || '---'}</td>
                  <td className="py-2.5 pr-4 text-th-secondary">{line.modifier_1 || '---'}</td>
                  <td className="py-2.5 pr-4 text-right text-th-heading tabular-nums">{line.units}</td>
                  <td className="py-2.5 text-right font-bold text-th-heading tabular-nums">{fmt(line.charge_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  SECTION 6 -- CONNECTED RECORDS (3-column grid)                    */
  /* ================================================================ */
  const ConnectedRecords = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Eligibility */}
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-blue-400 text-lg">verified_user</span>
          <h4 className="text-xs font-bold uppercase tracking-wider text-th-muted">Eligibility</h4>
        </div>
        {eligibility ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-th-muted">Subscriber Status</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                eligibility.subscriber_status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {eligibility.subscriber_status}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-th-muted uppercase font-bold">Coverage Dates</p>
              <p className="text-sm text-th-heading tabular-nums">
                {fmtDate(eligibility.coverage_effective)} &mdash; {eligibility.coverage_term ? fmtDate(eligibility.coverage_term) : 'Active'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
            <span className="material-symbols-outlined text-rose-400 text-base">error</span>
            <span className="text-xs font-bold text-rose-400">No eligibility verification on file</span>
          </div>
        )}
      </div>

      {/* Prior Auth */}
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-amber-400 text-lg">key</span>
          <h4 className="text-xs font-bold uppercase tracking-wider text-th-muted">Prior Authorization</h4>
        </div>
        {prior_auth ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-th-muted">Auth #</span>
              <span className="text-sm font-bold text-th-heading font-mono">{prior_auth.auth_number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-th-muted">Status</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                prior_auth.status === 'APPROVED'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {prior_auth.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-th-muted">Requested</p>
                <p className="text-[11px] text-th-heading tabular-nums">{fmtShortDate(prior_auth.requested_date)}</p>
              </div>
              <div>
                <p className="text-[10px] text-th-muted">Approved</p>
                <p className="text-[11px] text-th-heading tabular-nums">{fmtShortDate(prior_auth.approved_date)}</p>
              </div>
              <div>
                <p className="text-[10px] text-th-muted">Expiry</p>
                <p className="text-[11px] text-th-heading tabular-nums">{fmtShortDate(prior_auth.expiry_date)}</p>
              </div>
            </div>
            {prior_auth.approved_units != null && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-th-muted">Approved Units</span>
                <span className="text-sm font-bold text-th-heading tabular-nums">{prior_auth.approved_units}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <span className="material-symbols-outlined text-amber-400 text-base">warning</span>
            <span className="text-xs font-bold text-amber-400">No prior authorization on file</span>
          </div>
        )}
      </div>

      {/* Payment */}
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-emerald-400 text-lg">payments</span>
          <h4 className="text-xs font-bold uppercase tracking-wider text-th-muted">Payment</h4>
        </div>
        {era_payment ? (
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-th-muted uppercase font-bold">ERA Payment</p>
              <p className="text-2xl font-black text-emerald-400 tabular-nums">{fmt(era_payment.payment_amount)}</p>
            </div>
            <div>
              <p className="text-[10px] text-th-muted uppercase font-bold">Payment Date</p>
              <p className="text-sm text-th-heading tabular-nums">{fmtDate(era_payment.payment_date)}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
              <span className="material-symbols-outlined text-rose-400 text-base">money_off</span>
              <span className="text-xs font-bold text-rose-400">No payment received</span>
            </div>
            {(claim.adtp_days != null || claim.expected_payment_date) && (
              <div className="bg-th-surface-overlay/50 rounded-lg p-3">
                <p className="text-[10px] text-th-muted uppercase font-bold mb-1">Expected Payment (ADTP)</p>
                {claim.expected_payment_date && (
                  <p className="text-sm text-th-heading tabular-nums">{fmtDate(claim.expected_payment_date)}</p>
                )}
                {claim.adtp_days != null && (
                  <p className="text-xs text-th-muted tabular-nums">{claim.adtp_days} days avg turnaround</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  /* ================================================================ */
  /*  SECTION 6b -- CLAIM DIAGNOSTIC (from diagnostics API)             */
  /* ================================================================ */
  const ClaimDiagnosticSection = () => {
    if (!claimDiagnostic) return null;
    const findings = claimDiagnostic.findings || claimDiagnostic.diagnostics || (claimDiagnostic.diagnostic ? [claimDiagnostic.diagnostic] : []);
    if (findings.length === 0) return null;
    return (
      <div className="bg-gradient-to-r from-purple-900/20 via-th-surface-raised to-th-surface-raised border border-purple-500/20 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-purple-400 text-lg">diagnosis</span>
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">Claim Diagnostic</h4>
          <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {findings.length} finding{findings.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="space-y-2">
          {findings.slice(0, 4).map((f, i) => {
            const sev = (f.severity || 'INFO').toUpperCase();
            const sevColor = sev === 'CRITICAL' ? 'rose' : sev === 'WARNING' ? 'amber' : 'blue';
            return (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg bg-${sevColor}-500/5 border border-${sevColor}-500/20`}>
                <span className={`material-symbols-outlined text-${sevColor}-400 text-base mt-0.5`}>
                  {sev === 'CRITICAL' ? 'error' : sev === 'WARNING' ? 'warning' : 'info'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-th-heading">{f.title || f.finding || 'Diagnostic'}</p>
                  <p className="text-[10px] text-th-muted mt-0.5">{f.description || f.detail || ''}</p>
                </div>
                {f.impact != null && <span className="text-xs font-bold text-rose-400 tabular-nums shrink-0">{fmt(f.impact)}</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  SECTION 7 -- SUGGESTED ACTIONS                                    */
  /* ================================================================ */
  const SuggestedActions = () => {
    if (!suggested_actions || suggested_actions.length === 0) return null;
    return (
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">bolt</span>
          <h3 className="text-sm font-bold text-th-heading uppercase tracking-wider">Suggested Actions</h3>
        </div>
        <div className="space-y-3">
          {suggested_actions.map((sa, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-th-surface-overlay/30 rounded-lg border border-th-border/50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-th-heading">{sa.action}</p>
                {sa.confidence != null && (
                  <p className="text-xs text-th-muted mt-0.5 tabular-nums">Confidence: {sa.confidence}%</p>
                )}
              </div>
              {sa.priority && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${PRIORITY_BADGE[sa.priority] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                  {sa.priority}
                </span>
              )}
              {sa.automation_available ? (
                <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors shrink-0">
                  Auto-execute
                </button>
              ) : (
                <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-th-surface-overlay text-th-secondary border border-th-border hover:bg-th-surface-raised transition-colors shrink-0">
                  Manual review
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  SECTION 8 -- AI DESCRIPTIVE INSIGHT                               */
  /* ================================================================ */
  const AiInsightCard = () => {
    if (!aiInsight) return null;
    return (
      <div className="bg-gradient-to-r from-purple-900/20 to-th-surface-raised border border-purple-500/30 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-purple-400">psychology</span>
          <h3 className="text-sm font-bold text-th-heading uppercase tracking-wider">AI Insight</h3>
        </div>
        {aiInsight.title && <p className="text-base font-bold text-th-heading mb-2">{aiInsight.title}</p>}
        <p className="text-sm text-th-secondary leading-relaxed">{aiInsight.body || aiInsight.summary || aiInsight.description || aiInsight.text || JSON.stringify(aiInsight)}</p>
        {aiInsight.recommendation && (
          <div className="mt-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-base mt-0.5">lightbulb</span>
            <p className="text-sm text-emerald-400">{aiInsight.recommendation}</p>
          </div>
        )}
      </div>
    );
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="flex-1 overflow-y-auto font-sans h-full">
      <div className="p-6 max-w-[1400px] mx-auto w-full">
        {/* Always shown */}
        <ClaimHeader />
        <ClaimTimeline />

        {/* Status-specific sections */}
        <DenialDetails />
        <RootCauseSection />
        <PaymentDetails />
        <ContractComparisonCard />
        <ReconciliationCard />
        <PaymentPredictionSection />
        <PreSubmissionChecklist />

        {/* Always shown */}
        <ClaimLinesTable />
        <ConnectedRecords />
        <ClaimDiagnosticSection />
        <SuggestedActions />
        <AiInsightCard />
      </div>
    </div>
  );
}
