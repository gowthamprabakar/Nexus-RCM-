import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

/* ─── helpers ─────────────────────────────────────────────────────────── */

function fcaColor(score) {
  if (score < 30) return 'text-emerald-400';
  if (score <= 70) return 'text-amber-400';
  return 'text-red-400';
}

function fcaBg(score) {
  if (score < 30) return 'bg-emerald-400';
  if (score <= 70) return 'bg-amber-400';
  return 'bg-red-400';
}

function auditLevelColor(level) {
  const l = (level || '').toUpperCase();
  if (l === 'LOW') return 'text-emerald-400';
  if (l === 'MEDIUM') return 'text-amber-400';
  return 'text-red-400';
}

function rowSeverityClass(score) {
  if (score >= 70) return 'bg-red-500/10 border-l-4 border-red-500';
  if (score >= 40) return 'bg-amber-500/10 border-l-4 border-amber-500';
  return 'bg-emerald-500/5 border-l-4 border-emerald-500';
}

function complianceGrade(summary) {
  if (!summary) return { grade: '--', color: 'text-th-muted' };
  const composite =
    (summary.fca_score ?? summary.fcaScore ?? 50) * 0.4 +
    (summary.overcoding_score ?? summary.overcodingScore ?? 50) * 0.3 +
    (summary.audit_score ?? summary.auditScore ?? 50) * 0.3;
  // Lower composite = better compliance
  const inverted = 100 - composite;
  if (inverted >= 90) return { grade: 'A', color: 'text-emerald-400' };
  if (inverted >= 80) return { grade: 'B', color: 'text-emerald-300' };
  if (inverted >= 70) return { grade: 'C', color: 'text-amber-400' };
  if (inverted >= 60) return { grade: 'D', color: 'text-orange-400' };
  return { grade: 'F', color: 'text-red-400' };
}

/* ─── skeleton shimmer blocks ─────────────────────────────────────────── */

function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-th-border bg-th-surface p-5 animate-pulse">
      <div className="h-3 w-20 bg-th-surface-overlay rounded mb-3" />
      <div className="h-7 w-24 bg-th-surface-overlay rounded" />
    </div>
  );
}

function PanelSkeleton({ rows = 4 }) {
  return (
    <div className="rounded-xl border border-th-border bg-th-surface p-5 animate-pulse">
      <div className="h-4 w-40 bg-th-surface-overlay rounded mb-4" />
      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="h-8 bg-th-surface-overlay rounded" />
        ))}
      </div>
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────────── */

function ComplianceRiskDashboard() {
  const [summary, setSummary] = useState(null);
  const [overcoding, setOvercoding] = useState(null);
  const [fca, setFca] = useState(null);
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.allSettled([
      api.compliance.getSummary(),
      api.compliance.getOvercodingRisk(),
      api.compliance.getFcaRisk(),
      api.compliance.getAuditRisk(),
    ]).then(([sumRes, ocRes, fcaRes, auditRes]) => {
      const sumVal = sumRes.status === 'fulfilled' ? sumRes.value : null;
      const ocVal = ocRes.status === 'fulfilled' ? ocRes.value : null;
      const fcaVal = fcaRes.status === 'fulfilled' ? fcaRes.value : null;
      const auditVal = auditRes.status === 'fulfilled' ? auditRes.value : null;

      if (!sumVal && !ocVal && !fcaVal && !auditVal) {
        setError('Failed to load compliance data');
      } else {
        setSummary(sumVal);
        setOvercoding(ocVal);
        setFca(fcaVal);
        setAudit(auditVal);
      }
      setLoading(false);
    });
  }, []);

  /* ── loading state ── */
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-th-primary">
          Compliance Risk Dashboard
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PanelSkeleton rows={5} />
          <PanelSkeleton rows={5} />
        </div>
        <PanelSkeleton rows={6} />
      </div>
    );
  }

  /* ── error state ── */
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-th-primary">
          Compliance Risk Dashboard
        </h1>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-400 text-sm">
          {error}. Please try again later.
        </div>
      </div>
    );
  }

  /* ── derived values ── */
  const fcaScore = fca?.score ?? fca?.risk_score ?? 0;
  const fcaFactors = fca?.risk_factors ?? fca?.factors ?? [];
  const fcaTrend = fca?.trend ?? fca?.trend_direction ?? 'stable';
  const fcaActions = fca?.recommended_actions ?? fca?.actions ?? [];

  const auditLevel = audit?.risk_level ?? audit?.level ?? 'UNKNOWN';
  const auditFocusAreas = audit?.focus_areas ?? audit?.focusAreas ?? [];
  const highRiskClaims = audit?.high_risk_claims ?? audit?.highRiskClaims ?? 0;
  const auditRecs =
    audit?.recommendations ?? audit?.preparation_recommendations ?? [];

  const overcodingProviders = overcoding?.providers ?? overcoding?.data ?? [];
  const alertCount =
    overcoding?.alert_count ??
    overcoding?.alerts ??
    overcodingProviders.length;

  const sortedProviders = [...overcodingProviders].sort(
    (a, b) => (b.risk_score ?? b.score ?? 0) - (a.risk_score ?? a.score ?? 0)
  );

  const { grade, color: gradeColor } = complianceGrade(summary);

  /* ── render ── */
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-th-primary">
        Compliance Risk Dashboard
      </h1>

      {/* ── KPI Cards Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* FCA Risk Score */}
        <div className="rounded-xl border border-th-border bg-th-surface p-5">
          <p className="text-xs text-th-muted uppercase tracking-wide mb-1">
            FCA Risk Score
          </p>
          <p className={`text-2xl font-bold tabular-nums ${fcaColor(fcaScore)}`}>
            {fcaScore}
            <span className="text-sm font-normal text-th-muted"> / 100</span>
          </p>
        </div>

        {/* Audit Risk Level */}
        <div className="rounded-xl border border-th-border bg-th-surface p-5">
          <p className="text-xs text-th-muted uppercase tracking-wide mb-1">
            Audit Risk Level
          </p>
          <p className={`text-2xl font-bold ${auditLevelColor(auditLevel)}`}>
            {auditLevel.toUpperCase()}
          </p>
        </div>

        {/* Over-coding Alerts */}
        <div className="rounded-xl border border-th-border bg-th-surface p-5">
          <p className="text-xs text-th-muted uppercase tracking-wide mb-1">
            Over-coding Alerts
          </p>
          <p className="text-2xl font-bold tabular-nums text-th-primary">
            {alertCount}
          </p>
        </div>

        {/* Compliance Grade */}
        <div className="rounded-xl border border-th-border bg-th-surface p-5">
          <p className="text-xs text-th-muted uppercase tracking-wide mb-1">
            Compliance Grade
          </p>
          <p className={`text-2xl font-bold ${gradeColor}`}>{grade}</p>
        </div>
      </div>

      {/* ── Two-column: FCA Panel + OIG/RAC Audit ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FCA Risk Panel */}
        <div className="rounded-xl border border-th-border bg-th-surface p-5 space-y-5">
          <h2 className="text-lg font-semibold text-th-primary">
            FCA Risk Analysis
          </h2>

          {/* Score gauge bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-th-muted mb-1">
              <span>Risk Score</span>
              <span className={fcaColor(fcaScore)}>{fcaScore}/100</span>
            </div>
            <div className="w-full h-4 bg-th-surface-overlay rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${fcaBg(fcaScore)}`}
                style={{ width: `${Math.min(fcaScore, 100)}%` }}
              />
            </div>
          </div>

          {/* Trend */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-th-muted">Trend:</span>
            <span
              className={
                fcaTrend === 'increasing' || fcaTrend === 'up'
                  ? 'text-red-400'
                  : fcaTrend === 'decreasing' || fcaTrend === 'down'
                    ? 'text-emerald-400'
                    : 'text-th-muted'
              }
            >
              {fcaTrend === 'increasing' || fcaTrend === 'up'
                ? 'Increasing'
                : fcaTrend === 'decreasing' || fcaTrend === 'down'
                  ? 'Decreasing'
                  : 'Stable'}
            </span>
          </div>

          {/* Risk Factors */}
          {fcaFactors.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-th-primary mb-2">
                Risk Factors
              </h3>
              <ul className="space-y-2">
                {fcaFactors.map((f, idx) => {
                  const name = f.name ?? f.factor ?? f.label ?? `Factor ${idx + 1}`;
                  const score = f.score ?? f.risk_score ?? f.value ?? 0;
                  return (
                    <li
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-th-secondary truncate mr-2">
                        {name}
                      </span>
                      <span
                        className={`font-medium tabular-nums ${fcaColor(score)}`}
                      >
                        {score}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Recommended Actions */}
          {fcaActions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-th-primary mb-2">
                Recommended Actions
              </h3>
              <ul className="space-y-1.5">
                {fcaActions.map((action, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-th-secondary"
                  >
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                    {typeof action === 'string' ? action : action.text ?? action.description ?? ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* OIG / RAC Audit Targets */}
        <div className="rounded-xl border border-th-border bg-th-surface p-5 space-y-5">
          <h2 className="text-lg font-semibold text-th-primary">
            OIG / RAC Audit Targets
          </h2>

          {/* High-risk claims count */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/15 flex items-center justify-center">
              <span className="text-red-400 text-lg font-bold tabular-nums">
                {highRiskClaims}
              </span>
            </div>
            <span className="text-sm text-th-secondary">
              High-risk claims flagged
            </span>
          </div>

          {/* Focus Areas */}
          {auditFocusAreas.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-th-primary mb-2">
                Focus Areas
              </h3>
              <div className="flex flex-wrap gap-2">
                {auditFocusAreas.map((area, idx) => {
                  const label =
                    typeof area === 'string' ? area : area.name ?? area.area ?? '';
                  return (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-th-surface-overlay text-th-secondary border border-th-border"
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preparation Recommendations */}
          {auditRecs.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-th-primary mb-2">
                Preparation Recommendations
              </h3>
              <ul className="space-y-1.5">
                {auditRecs.map((rec, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-th-secondary"
                  >
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                    {typeof rec === 'string' ? rec : rec.text ?? rec.description ?? ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {auditFocusAreas.length === 0 && auditRecs.length === 0 && (
            <p className="text-sm text-th-muted">
              No audit risk data available.
            </p>
          )}
        </div>
      </div>

      {/* ── Over-coding Risk Table ────────────────────────────────── */}
      <div className="rounded-xl border border-th-border bg-th-surface p-5">
        <h2 className="text-lg font-semibold text-th-primary mb-4">
          Over-coding Risk by Provider
        </h2>

        {sortedProviders.length === 0 ? (
          <p className="text-sm text-th-muted">
            No over-coding risk data available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-th-muted uppercase tracking-wide border-b border-th-border">
                  <th className="text-left py-2 pr-4">Provider ID</th>
                  <th className="text-left py-2 pr-4">Risk Score</th>
                  <th className="text-left py-2 pr-4">
                    Deviation from Benchmark
                  </th>
                  <th className="text-left py-2">Flagged Codes</th>
                </tr>
              </thead>
              <tbody>
                {sortedProviders.map((p, idx) => {
                  const providerId =
                    p.provider_id ?? p.providerId ?? p.id ?? `P-${idx + 1}`;
                  const riskScore = p.risk_score ?? p.score ?? 0;
                  const deviation =
                    p.deviation ?? p.benchmark_deviation ?? p.deviation_pct ?? 0;
                  const flaggedCodes =
                    p.flagged_codes ?? p.flaggedCodes ?? p.codes ?? [];

                  return (
                    <tr
                      key={idx}
                      className={`${rowSeverityClass(riskScore)} transition-colors`}
                    >
                      <td className="py-2.5 pr-4 font-medium text-th-primary pl-2">
                        {providerId}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`font-semibold tabular-nums ${fcaColor(riskScore)}`}
                        >
                          {riskScore}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums text-th-secondary">
                        {typeof deviation === 'number'
                          ? `${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}%`
                          : deviation}
                      </td>
                      <td className="py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(flaggedCodes)
                            ? flaggedCodes
                            : [flaggedCodes]
                          ).map((code, ci) => (
                            <span
                              key={ci}
                              className="px-1.5 py-0.5 rounded text-xs font-mono bg-th-surface-overlay text-th-secondary border border-th-border"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComplianceRiskDashboard;
