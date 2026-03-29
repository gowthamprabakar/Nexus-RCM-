import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePreBatch } from '../context/PreBatchContext';
import { ValidationStatusBadge } from '../components/ValidationStatusBadge';
import { api } from '../../../services/api';

// CRS component score bar
function CrsComponentBar({ label, pts, max, passed }) {
  const pct = max > 0 ? Math.round((pts / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs text-th-secondary font-medium shrink-0">{label}</div>
      <div className="flex-1 h-2 bg-th-surface-overlay rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${passed ? 'bg-emerald-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={`text-xs font-bold w-14 text-right tabular-nums ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
        {pts}/{max} pts
      </div>
      <span className={`material-symbols-outlined text-sm ${passed ? 'text-emerald-500' : 'text-red-500'}`}>
        {passed ? 'check_circle' : 'cancel'}
      </span>
    </div>
  );
}

export function ClaimValidationDetail() {
  const { claimId } = useParams();
  const navigate    = useNavigate();
  const { applyAutoFix } = usePreBatch();

  const [claim,    setClaim]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [applied,  setApplied]  = useState({});   // issueId → true

  useEffect(() => {
    if (!claimId) return;
    setLoading(true);
    api.crs.getClaimDetail(claimId).then(data => {
      setClaim(data);
      setLoading(false);
    });
  }, [claimId]);

  const handleApplyFix = (issue) => {
    setApplied(prev => ({ ...prev, [issue.id]: true }));
    applyAutoFix(claimId, issue.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-th-secondary">
          <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
          <span className="text-sm">Loading claim details…</span>
        </div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="p-10 text-center text-th-muted">
        <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
        Claim not found
      </div>
    );
  }

  const components = claim.components || {};

  return (
    <div className="flex flex-col h-full bg-th-surface-overlay/30 animate-in fade-in slide-in-from-right-4 duration-300">

      {/* ── Header ── */}
      <div className="bg-th-surface-raised border-b border-th-border p-6 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <nav className="flex items-center gap-2 text-xs font-medium text-th-secondary mb-1">
              <button onClick={() => navigate('/claims/pre-batch-scrub/queue')} className="hover:text-primary">
                Validation Queue
              </button>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-th-heading font-mono">{claim.id}</span>
            </nav>
            <h2 className="text-2xl font-extrabold tracking-tight text-th-heading flex items-center gap-3">
              Claim Validation Detail
              <ValidationStatusBadge status={claim.status} />
            </h2>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end">
            {/* CRS Score */}
            <div className="flex items-center gap-6 pr-6 border-r border-th-border">
              <div className="text-center">
                <div className="text-xs font-bold text-th-secondary uppercase mb-1">CRS Score</div>
                <div className={`text-3xl font-black tabular-nums ${
                  claim.crsScore >= 80 ? 'text-emerald-400' :
                  claim.crsScore >= 60 ? 'text-amber-400' : 'text-red-400'
                }`}>{claim.crsScore}</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-th-secondary uppercase mb-1">Confidence</div>
                <div className="text-3xl font-black text-th-heading tabular-nums">
                  {Math.round(claim.confidenceScore * 100)}%
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate('/claims/pre-batch-scrub/queue')}
                className="h-9 px-4 bg-th-surface-overlay text-th-heading rounded-lg font-bold text-xs hover:bg-th-surface-overlay/80 transition-colors"
              >
                Close
              </button>
              <button className="h-9 px-6 bg-primary text-th-heading rounded-lg font-bold text-xs shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 active:scale-95">
                <span className="material-symbols-outlined text-sm">save</span>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left — Claim data + CRS scorecard */}
        <section className="w-[55%] border-r border-th-border overflow-y-auto bg-th-surface-raised/30 p-6 space-y-6">

          {/* Patient & Encounter */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold flex items-center gap-2 text-th-heading">
              <span className="material-symbols-outlined text-primary text-lg">person</span>
              Patient &amp; Encounter
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Patient',        claim.patient],
                ['Date of Service', claim.dos],
                ['Payer',          claim.payer],
                ['Claim Type',     claim.claimType],
                ['Place of Service', claim.placeOfService || '—'],
                ['Total Charges',  `$${(claim.totalCharges || 0).toLocaleString()}`],
              ].map(([label, val]) => (
                <div key={label} className="space-y-1">
                  <label className="text-xs font-semibold text-th-muted">{label}</label>
                  <div className="w-full h-9 rounded bg-th-surface-overlay/40 border border-th-border text-sm px-3 flex items-center text-th-heading">
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CRS Component Scorecard */}
          <div className="bg-th-surface-raised border border-th-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-th-heading">CRS Component Breakdown</h4>
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                claim.crsPassed ? 'bg-emerald-900/20 text-emerald-400' : 'bg-red-900/20 text-red-400'
              }`}>
                {claim.crsPassed ? 'CLEAN — Ready to submit' : 'FLAGGED — Review required'}
              </span>
            </div>
            <div className="space-y-3">
              {components.eligibility   && <CrsComponentBar label="Eligibility"    {...components.eligibility}   />}
              {components.authorization && <CrsComponentBar label="Authorization"  {...components.authorization} />}
              {components.coding        && <CrsComponentBar label="Coding"         {...components.coding}        />}
              {components.cob           && <CrsComponentBar label="COB"            {...components.cob}           />}
              {components.documentation && <CrsComponentBar label="Documentation"  {...components.documentation} />}
              {components.evv           && <CrsComponentBar label="EVV"            {...components.evv}           />}
            </div>
          </div>

          {/* ADTP Forecast */}
          {claim.expectedPaymentDate && (
            <div className="bg-th-surface-raised border border-th-border rounded-xl p-5">
              <h4 className="text-sm font-bold text-th-heading mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400 text-lg">calendar_month</span>
                ADTP Payment Forecast
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-th-muted mb-1">ADTP Days</div>
                  <div className="text-xl font-black text-th-heading tabular-nums">{claim.adtpDays}d</div>
                </div>
                <div>
                  <div className="text-xs text-th-muted mb-1">Expected Payment</div>
                  <div className="text-lg font-black text-blue-400">{claim.expectedPaymentDate}</div>
                </div>
                <div>
                  <div className="text-xs text-th-muted mb-1">Payment Week</div>
                  <div className="text-lg font-black text-blue-400">{claim.expectedPaymentWeek}</div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right — Issues panel */}
        <section className="flex-1 overflow-y-auto bg-th-surface-overlay/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-th-secondary">
              Validation Issues
            </h3>
            {claim.issues?.length > 0 && (
              <span className="text-xs font-bold px-2 py-1 rounded bg-red-900/10 text-red-400">
                {claim.issues.length} issue{claim.issues.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {claim.issues?.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl text-emerald-500 mb-3 block">thumb_up</span>
                <p className="font-bold text-th-heading text-lg">Clean Claim</p>
                <p className="text-sm text-th-muted mt-1">No validation issues found — ready to submit.</p>
              </div>
            ) : (
              claim.issues.map(issue => {
                const isFixed = applied[issue.id];
                return (
                  <div
                    key={issue.id}
                    className={`rounded-xl border p-4 shadow-sm transition-all duration-300 ${
                      isFixed
                        ? 'bg-emerald-900/10 border-emerald-800/40'
                        : 'bg-th-surface-raised border-red-900/40 border-l-4 border-l-red-500'
                    }`}
                  >
                    <div className="flex gap-3">
                      <span className={`material-symbols-outlined text-lg ${isFixed ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isFixed ? 'check_circle' : 'error'}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className={`text-sm font-bold ${isFixed ? 'text-emerald-400' : 'text-th-heading'}`}>
                            {isFixed ? `Fixed: ${issue.type}` : `${issue.type} Issue`}
                          </h5>
                          <span className="text-[10px] font-mono text-th-muted">{issue.ruleId}</span>
                        </div>
                        <p className="text-xs text-th-muted">{issue.message}</p>

                        {!isFixed && (
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded flex-1">
                              <span className="material-symbols-outlined text-[12px]">auto_fix_high</span>
                              {issue.suggestedFix}
                            </div>
                            {issue.autoFixAvailable && (
                              <button
                                onClick={() => handleApplyFix(issue)}
                                className="shrink-0 text-xs font-bold text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded transition-all border border-primary active:scale-95"
                              >
                                Apply Fix
                              </button>
                            )}
                          </div>
                        )}

                        {/* Confidence */}
                        <div className="mt-2 flex items-center gap-1.5">
                          <div className="h-1 flex-1 bg-th-surface-overlay rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.round(issue.confidenceScore * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-th-muted tabular-nums">
                            {Math.round(issue.confidenceScore * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
