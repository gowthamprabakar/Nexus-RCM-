import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { cn } from '../../../lib/utils';

const fmt = (n) => n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(0)}K` : `$${Math.round(n).toLocaleString()}`;

const ROOT_CAUSE_INFO = {
  CODING_MISMATCH: { label: 'Coding Mismatch', group: 'PROCESS', color: 'blue', desc: 'CPT/ICD coding errors, modifier issues, or bundling problems that caused the denial.', fix: 'Review modifier usage and CPT-ICD linkage. Consult coding team for correction and resubmission.' },
  MODIFIER_MISMATCH: { label: 'Modifier Mismatch', group: 'PROCESS', color: 'blue', desc: 'Modifier attached to the procedure code is incorrect, missing, or conflicts with payer policy.', fix: 'Verify correct modifier usage per payer guidelines. Common issues: -25, -59, -TC, -26. Resubmit with corrected modifier.' },
  BUNDLING_ERROR: { label: 'Bundling Error', group: 'PROCESS', color: 'blue', desc: 'Procedures were incorrectly bundled or unbundled per payer edit rules (CCI/NCCI).', fix: 'Review CCI edits for the procedure pair. Apply correct modifier for unbundling if clinically distinct. Resubmit.' },
  DUPLICATE_CLAIM: { label: 'Duplicate Claim', group: 'PROCESS', color: 'blue', desc: 'Claim was flagged as a duplicate submission by the payer.', fix: 'Verify if original claim was already paid. If not a true duplicate, resubmit with corrected claim frequency code.' },
  ELIGIBILITY_LAPSE: { label: 'Eligibility Lapse', group: 'PREVENTABLE', color: 'amber', desc: 'Patient coverage was inactive, terminated, or not found at the time of service.', fix: 'Re-verify eligibility via 270/271. If coverage lapsed, check for secondary insurance or patient self-pay.' },
  TIMELY_FILING_MISS: { label: 'Timely Filing Miss', group: 'PREVENTABLE', color: 'amber', desc: 'Claim was submitted after the payer\'s filing deadline.', fix: 'Escalate to billing manager. Document extenuating circumstances for appeal. Implement filing deadline alerts.' },
  AUTH_MISSING: { label: 'Authorization Missing', group: 'PREVENTABLE', color: 'amber', desc: 'Prior authorization was required but not obtained, denied, or pending at time of service.', fix: 'Obtain retrospective authorization if available. Submit appeal with clinical documentation supporting medical necessity.' },
  AUTH_EXPIRED: { label: 'Authorization Expired', group: 'PREVENTABLE', color: 'amber', desc: 'Prior authorization was obtained but expired before the date of service.', fix: 'Request auth extension or submit new authorization before re-billing the claim.' },
  PAYER_BEHAVIOR_SHIFT: { label: 'Payer Behavior Shift', group: 'PAYER', color: 'red', desc: 'Payer has changed denial patterns recently — this may indicate a policy change or audit flag.', fix: 'Escalate to payer relations. Review contract terms and recent payer policy bulletins.' },
  CONTRACT_RATE_GAP: { label: 'Contract Rate Gap', group: 'PAYER', color: 'red', desc: 'Payment received was significantly below the contracted rate for this procedure.', fix: 'Compare paid amount vs contract rate. File underpayment appeal with contract documentation.' },
  PROCESS_BREAKDOWN: { label: 'Process Breakdown', group: 'PROCESS', color: 'blue', desc: 'Multiple workflow issues contributed — no single dominant root cause identified.', fix: 'Manual review recommended. Check submission workflow, documentation, and payer requirements.' },
  COB_ORDER_ERROR: { label: 'COB Order Error', group: 'PROCESS', color: 'blue', desc: 'Coordination of Benefits order was incorrect — claim sent to wrong primary/secondary payer.', fix: 'Verify COB order with patient. Resubmit to correct primary payer with updated coordination data.' },
  DOCUMENTATION_DEFICIT: { label: 'Documentation Deficit', group: 'CLINICAL', color: 'purple', desc: 'Clinical documentation insufficient to support the billed services or medical necessity.', fix: 'Request addendum from provider. Submit appeal with complete clinical records and supporting documentation.' },
  MEDICAL_NECESSITY: { label: 'Medical Necessity', group: 'CLINICAL', color: 'purple', desc: 'Payer determined the service was not medically necessary based on submitted documentation.', fix: 'Initiate peer-to-peer review. Submit clinical evidence and guidelines supporting necessity. Consider appeal.' },
  PROVIDER_ENROLLMENT: { label: 'Provider Enrollment', group: 'CLINICAL', color: 'purple', desc: 'Provider is not enrolled or credentialed with the payer for the billed service.', fix: 'Verify provider enrollment status. Complete credentialing if needed. Resubmit after enrollment confirmed.' },
};

const GROUP_STYLES = {
  PROCESS: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  PREVENTABLE: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  PAYER: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300 border-red-500/30' },
  CLINICAL: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
};

const PAGE_SIZE = 25;

export function RootCauseClaimsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rootCause = searchParams.get('cause') || searchParams.get('root_cause') || '';
  const statusFilter = searchParams.get('status') || '';
  const payerFilter = searchParams.get('payer') || '';
  const reconContext = searchParams.get('context') === 'reconciliation';
  const reconERA = searchParams.get('era') || '';
  const reconBank = searchParams.get('bank') || '';
  const reconVariance = searchParams.get('variance') || '';

  const [claims, setClaims] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState(null);

  const info = ROOT_CAUSE_INFO[rootCause] || { label: rootCause?.replace(/_/g, ' ') || 'All Claims', group: 'PROCESS', color: 'blue', desc: '', fix: '' };
  const groupStyle = GROUP_STYLES[info.group] || GROUP_STYLES.PROCESS;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Fetch claims via graph API
        const params = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };
        if (rootCause) params.root_cause = rootCause;
        if (statusFilter) params.status = statusFilter;
        if (payerFilter) params.payer_name = payerFilter;

        const [claimsData, rcSummary] = await Promise.all([
          api.graph.getClaims(params).catch(() => ({ claims: [], total: 0 })),
          api.rootCause.getSummary().catch(() => null),
        ]);

        setClaims(claimsData?.claims || []);
        setTotal(claimsData?.total || 0);

        // Find this root cause in summary for stats
        if (rcSummary && rootCause) {
          const match = (rcSummary.by_root_cause || rcSummary.distribution || []).find(r =>
            r.root_cause === rootCause || r.cause === rootCause
          );
          setSummary(match || null);
        }
      } catch (err) {
        console.error('Failed to load claims:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [rootCause, statusFilter, payerFilter, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex-1 overflow-y-auto font-sans">
      <div className="px-8 py-6 max-w-[1600px] mx-auto">

        {/* Back navigation */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-th-muted hover:text-th-heading transition-colors mb-4">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back
        </button>

        {/* Reconciliation Context Banner */}
        {reconContext && payerFilter && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-blue-400">account_balance</span>
              <h2 className="text-lg font-bold text-th-heading">Payer Reconciliation: {payerFilter}</h2>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-bold">FROM RECON</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {reconERA && <div><p className="text-[10px] text-th-muted uppercase font-semibold">ERA Received</p><p className="text-lg font-bold text-th-heading tabular-nums">${Number(reconERA).toLocaleString()}</p></div>}
              {reconBank && <div><p className="text-[10px] text-th-muted uppercase font-semibold">Bank Deposited</p><p className="text-lg font-bold text-th-heading tabular-nums">${Number(reconBank).toLocaleString()}</p></div>}
              {reconVariance && <div><p className="text-[10px] text-th-muted uppercase font-semibold">Variance</p><p className={`text-lg font-bold tabular-nums ${Number(reconVariance) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>${Number(reconVariance).toLocaleString()}</p></div>}
            </div>
          </div>
        )}

        {/* Context Header */}
        <div className={cn('rounded-xl border p-6 mb-6', payerFilter && !rootCause ? 'bg-blue-500/5 border-blue-500/20' : groupStyle.bg, payerFilter && !rootCause ? '' : groupStyle.border)}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-black text-th-heading">{payerFilter || info.label}</h1>
                {rootCause && <span className={cn('text-[10px] px-2 py-0.5 rounded border font-bold uppercase', groupStyle.badge)}>{info.group}</span>}
                {payerFilter && !rootCause && <span className="text-[10px] px-2 py-0.5 rounded border font-bold uppercase bg-blue-500/20 text-blue-300 border-blue-500/30">PAYER CLAIMS</span>}
              </div>
              <p className="text-sm text-th-secondary mb-4 max-w-2xl">{rootCause ? info.desc : `All claims for ${payerFilter} — showing payment status, denials, and reconciliation details.`}</p>

              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] text-th-muted uppercase font-semibold">Total Claims</p>
                  <p className="text-xl font-bold text-th-heading tabular-nums">{total.toLocaleString()}</p>
                </div>
                {summary && (
                  <>
                    <div>
                      <p className="text-[10px] text-th-muted uppercase font-semibold">Financial Impact</p>
                      <p className="text-xl font-bold text-th-heading tabular-nums">{fmt(summary.impact || summary.financial_impact || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-th-muted uppercase font-semibold">% of All Denials</p>
                      <p className="text-xl font-bold text-th-heading tabular-nums">{(summary.percentage || summary.pct || 0).toFixed(1)}%</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Fix recommendation */}
            {info.fix && (
              <div className="ml-6 max-w-xs bg-th-surface-raised/50 rounded-lg border border-th-border p-4">
                <p className="text-[10px] text-th-muted uppercase font-semibold mb-1">Recommended Fix</p>
                <p className="text-xs text-th-secondary leading-relaxed">{info.fix}</p>
              </div>
            )}
          </div>
        </div>

        {/* Claims Table */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-th-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-th-heading">Claims</h2>
              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold">LIVE</span>
              <span className="text-xs text-th-muted">Page {page} of {totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1 text-xs rounded border border-th-border text-th-muted hover:text-th-heading disabled:opacity-30 transition-colors">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1 text-xs rounded border border-th-border text-th-muted hover:text-th-heading disabled:opacity-30 transition-colors">Next</button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-th-muted">Loading claims...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-th-muted mb-2">search_off</span>
              <p className="text-sm text-th-muted">No claims found for this root cause.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-th-border bg-th-surface-overlay/30">
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-th-muted uppercase">Claim ID</th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-th-muted uppercase">Patient</th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-th-muted uppercase">Payer</th>
                  <th className="text-right px-3 py-3 text-[10px] font-semibold text-th-muted uppercase">Denied Amount</th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-th-muted uppercase">Root Cause</th>
                  <th className="text-center px-3 py-3 text-[10px] font-semibold text-th-muted uppercase">Confidence</th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-th-muted uppercase">CARC</th>
                  <th className="text-center px-3 py-3 text-[10px] font-semibold text-th-muted uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c, i) => {
                  const rcInfo = ROOT_CAUSE_INFO[c.primary_root_cause] || {};
                  const gs = GROUP_STYLES[rcInfo.group] || GROUP_STYLES.PROCESS;
                  return (
                    <tr key={c.claim_id || i}
                      className="border-b border-th-border/50 hover:bg-th-surface-overlay/40 transition-colors cursor-pointer"
                      onClick={() => navigate(`/analytics/denials/root-cause/claim/${c.claim_id}`)}
                    >
                      <td className="px-5 py-3">
                        <span className="text-primary font-mono text-xs font-bold">{c.claim_id}</span>
                      </td>
                      <td className="px-3 py-3 text-th-heading text-xs">{c.patient_name || '—'}</td>
                      <td className="px-3 py-3 text-th-secondary text-xs">{c.payer_name || '—'}</td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-red-400 font-bold text-xs tabular-nums">{fmt(c.denial_amount || 0)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn('text-[9px] px-1.5 py-0.5 rounded border font-bold', gs.badge)}>
                          {(c.primary_root_cause || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-12 h-1.5 rounded-full bg-th-surface-overlay overflow-hidden">
                            <div className={cn('h-full rounded-full', c.confidence_score > 60 ? 'bg-green-500' : c.confidence_score > 30 ? 'bg-amber-500' : 'bg-red-500')}
                              style={{ width: `${c.confidence_score || 0}%` }} />
                          </div>
                          <span className="text-[10px] text-th-muted tabular-nums">{c.confidence_score || 0}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-th-muted text-xs font-mono">{c.carc_code || '—'}</td>
                      <td className="px-3 py-3 text-center">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/analytics/denials/root-cause/claim/${c.claim_id}`); }}
                          className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded font-bold hover:bg-primary/30 transition-colors">
                          Investigate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Footer */}
          <div className="px-5 py-3 border-t border-th-border flex items-center justify-between text-xs text-th-muted">
            <span>Showing {claims.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()} claims</span>
            <span>Sorted by denial amount (highest first)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
