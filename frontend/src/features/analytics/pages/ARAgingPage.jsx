import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { cn } from '../../../lib/utils';
import { AIInsightCard } from '../../../components/ui';

const fmt = (n) => n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(0)}K` : `$${Math.round(n).toLocaleString()}`;
const fmtFull = (n) => `$${Math.round(n).toLocaleString()}`;

const BUCKET_COLORS = {
  '0-30': { bg: 'bg-emerald-500', text: 'text-emerald-400', bar: '#10b981' },
  '31-60': { bg: 'bg-blue-500', text: 'text-blue-400', bar: '#3b82f6' },
  '61-90': { bg: 'bg-amber-500', text: 'text-amber-400', bar: '#f59e0b' },
  '91-120': { bg: 'bg-orange-500', text: 'text-orange-400', bar: '#f97316' },
  '120+': { bg: 'bg-red-500', text: 'text-red-400', bar: '#ef4444' },
};

function SkeletonPulse({ className }) {
  return <div className={cn('animate-pulse bg-th-surface-overlay rounded', className)} />;
}

export function ARAgingPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [agingRootCause, setAgingRootCause] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState([]);
  const [preventionData, setPreventionData] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [arSummary, arTrend, arRootCause] = await Promise.all([
        api.ar.getSummary().catch(() => null),
        api.ar.getTrend().catch(() => ({ trend: [] })),
        api.ar.getAgingRootCause().catch(() => null),
      ]);
      if (arSummary) setSummary(arSummary);
      if (arTrend?.trend) setTrend(arTrend.trend);
      if (arRootCause) setAgingRootCause(arRootCause);
      setLoading(false);
      // Load AI insights (non-blocking)
      api.ai.getInsights('ar').then(res => {
        if (res?.insights?.length) setAiInsights(res.insights);
      }).catch(() => {});
      // Non-blocking: prevention
      api.prevention.scan(3).then(d => setPreventionData(d)).catch(() => null);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-th-surface-raised border border-th-border rounded-xl p-5 space-y-3">
                <SkeletonPulse className="h-3 w-24" />
                <SkeletonPulse className="h-8 w-20" />
                <SkeletonPulse className="h-3 w-32" />
              </div>
            ))}
          </div>
          <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
            <SkeletonPulse className="h-4 w-48 mb-6" />
            <SkeletonPulse className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const buckets = summary?.buckets || [];
  const totalAR = summary?.total_ar || 0;
  const avgDays = summary?.avg_days || 0;
  const totalClaims = summary?.total_claims || 0;
  const payerBreakdown = summary?.payer_breakdown || [];

  // Recovery rate: claims in 0-30 bucket as percentage of total
  const bucket030 = buckets.find(b => b.bucket === '0-30');
  const recoveryRate = totalAR > 0 && bucket030 ? ((bucket030.balance / totalAR) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex-1 overflow-y-auto p-6 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total A/R Outstanding"
            value={fmt(totalAR)}
            icon="account_balance"
            iconColor="text-blue-400"
            accentColor="border-l-blue-500"
            sub={`${totalClaims.toLocaleString()} claims`}
          />
          <KPICard
            label="Avg Days Outstanding"
            value={`${Math.round(avgDays)}`}
            suffix=" days"
            icon="schedule"
            iconColor="text-amber-400"
            accentColor="border-l-amber-500"
            sub="Across all payers"
          />
          <KPICard
            label="Claims in A/R"
            value={totalClaims.toLocaleString()}
            icon="description"
            iconColor="text-emerald-400"
            accentColor="border-l-emerald-500"
            sub="Active unpaid claims"
          />
          <KPICard
            label="Current Bucket Rate"
            value={`${recoveryRate}%`}
            icon="trending_up"
            iconColor="text-violet-400"
            accentColor="border-l-violet-500"
            sub="Claims in 0-30 day bucket"
          />
        </div>

        {/* Prevention Alert Banner */}
        {preventionData && (preventionData.total > 0 || preventionData.alerts?.length > 0) && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs">
            <span className="material-symbols-outlined text-amber-400 text-sm">shield</span>
            <span className="font-bold text-amber-400 tabular-nums">{preventionData.total || preventionData.alerts?.length || 0}</span>
            <span className="text-th-secondary">preventable claims may be contributing to A/R aging</span>
          </div>
        )}

        {/* AR Aging Buckets */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-th-heading">A/R Aging Distribution</h3>
              <p className="text-[10px] text-th-muted mt-1">Dollar amount and claim count by aging bucket</p>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border bg-sky-500/10 text-sky-400 border-sky-500/20">
              Live Data
            </span>
          </div>

          {/* Stacked Bar */}
          <div className="w-full h-10 rounded-lg overflow-hidden flex mb-6">
            {buckets.map(b => (
              <div
                key={b.bucket}
                className={cn('h-full relative group transition-opacity hover:opacity-90', BUCKET_COLORS[b.bucket]?.bg || 'bg-gray-500')}
                style={{ width: `${b.pct}%`, minWidth: b.pct > 0 ? '2%' : '0' }}
                title={`${b.bucket}: ${fmt(b.balance)} (${b.pct}%)`}
              >
                {b.pct >= 8 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/90">
                    {b.pct}%
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Bucket Detail Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {buckets.map(b => {
              const colors = BUCKET_COLORS[b.bucket] || { bg: 'bg-gray-500', text: 'text-gray-400' };
              return (
                <div key={b.bucket} className="rounded-xl border border-th-border bg-th-surface-overlay/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('size-2.5 rounded-full shrink-0', colors.bg)} />
                    <span className="text-[11px] font-bold text-th-muted uppercase">{b.bucket} Days</span>
                  </div>
                  <p className="text-lg font-bold text-th-heading tabular-nums">{fmt(b.balance)}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-th-secondary tabular-nums">{b.count.toLocaleString()} claims</span>
                    <span className={cn('text-[10px] font-bold tabular-nums', colors.text)}>{b.pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Why Is AR Aging? ─────────────────────────────────────── */}
        {agingRootCause && <AgingRootCauseSection data={agingRootCause} navigate={navigate} />}

        {/* AR Trend Chart + Payer Table */}
        <div className="grid grid-cols-12 gap-6">
          {/* AR Trend Line Chart */}
          <div className="col-span-12 lg:col-span-7 bg-th-surface-raised border border-th-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-th-heading">12-Month A/R Trend</h3>
                <p className="text-[10px] text-th-muted mt-1">Total accounts receivable over time</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-semibold text-th-secondary">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-blue-500" /> Total A/R
                </div>
              </div>
            </div>
            <ARTrendChart trend={trend} />
          </div>

          {/* Top Payers by AR */}
          <div className="col-span-12 lg:col-span-5 bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-th-border">
              <h3 className="text-sm font-bold text-th-heading">Top Payers by A/R Balance</h3>
              <p className="text-[10px] text-th-muted mt-1">Sorted by outstanding balance, descending</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0f1623] text-th-muted text-[10px] font-bold uppercase tracking-widest border-b border-th-border">
                  <tr>
                    <th className="p-3">Payer</th>
                    <th className="p-3 text-right">A/R Balance</th>
                    <th className="p-3 text-right">Claims</th>
                    <th className="p-3 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-th-border">
                  {payerBreakdown.map((p, i) => (
                    <tr key={i} className="hover:bg-th-surface-overlay/50 transition-colors cursor-pointer" onClick={() => navigate(`/analytics/payments/payer-profiles?payer=${encodeURIComponent(p.payer)}`)}>
                      <td className="p-3 text-xs font-semibold text-th-heading">{p.payer}</td>
                      <td className="p-3 text-right text-xs font-mono font-medium text-th-heading tabular-nums">{fmt(p.balance)}</td>
                      <td className="p-3 text-right text-xs text-th-secondary tabular-nums">{p.count?.toLocaleString()}</td>
                      <td className="p-3 text-right text-xs tabular-nums">
                        <span className={cn('font-bold', (p.balance / totalAR * 100) > 20 ? 'text-amber-400' : 'text-th-secondary')}>
                          {totalAR > 0 ? (p.balance / totalAR * 100).toFixed(1) : '0.0'}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {payerBreakdown.length === 0 && (
                    <tr><td colSpan={4} className="p-6 text-center text-xs text-th-muted">No payer data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-purple-400 text-base">auto_awesome</span>
              <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">AI Insights</span>
              <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1">
                Live
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {aiInsights.slice(0, 3).map((ins, i) => (
                <AIInsightCard
                  key={i}
                  title={ins.title}
                  description={ins.body || ins.description}
                  confidence={ins.confidence || (ins.badge === 'Prescriptive' ? 92 : ins.badge === 'Predictive' ? 85 : 78)}
                  impact={ins.severity === 'critical' ? 'high' : ins.severity === 'warning' ? 'high' : 'medium'}
                  category={ins.badge || ins.category || 'Diagnostic'}
                  action="Review"
                  value={ins.value || ''}
                  icon={ins.icon || (ins.badge === 'Prescriptive' ? 'gavel' : 'trending_up')}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Aging Root Cause Section ---
const ROOT_CAUSE_GROUP_COLORS = {
  PROCESS: { bar: '#3b82f6', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  PREVENTABLE: { bar: '#f59e0b', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  PAYER: { bar: '#ef4444', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  CLINICAL: { bar: '#8b5cf6', bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
};

const STATUS_DESCRIPTIONS = {
  DRAFT: 'Never submitted properly',
  DENIED: 'Denied but not appealed/resolved',
  SUBMITTED: 'Submitted but no response',
  ACKNOWLEDGED: 'Acknowledged but not adjudicated',
  APPEALED: 'Under appeal',
};

const STATUS_COLORS = {
  DRAFT: { bg: 'bg-slate-500', accent: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  DENIED: { bg: 'bg-red-500', accent: 'bg-red-500/15 text-red-400 border-red-500/30' },
  SUBMITTED: { bg: 'bg-blue-500', accent: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  ACKNOWLEDGED: { bg: 'bg-amber-500', accent: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  APPEALED: { bg: 'bg-violet-500', accent: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
};

function AgingRootCauseSection({ data }) {
  const navigate = useNavigate();
  const { aging_by_status = [], aging_by_root_cause = [], aging_by_payer = [], no_era_received, summary: rcSummary } = data;
  const maxRcImpact = Math.max(...aging_by_root_cause.map(r => r.impact), 1);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-bold text-th-heading tracking-tight">Why Is A/R Aging?</h2>
        <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse">
          Live
        </span>
        {rcSummary && (
          <span className="ml-auto text-[11px] text-th-muted">
            {rcSummary.preventable_pct}% of root causes are <span className="text-amber-400 font-semibold">preventable</span>
          </span>
        )}
      </div>

      {/* Aging by Status — Cards */}
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-th-heading">Aging by Claim Status</h3>
            <p className="text-[10px] text-th-muted mt-1">Claims stuck in each lifecycle stage</p>
          </div>
          <span className="material-symbols-outlined text-th-muted text-lg">assignment_late</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {aging_by_status.slice(0, 4).map(s => {
            const colors = STATUS_COLORS[s.status] || STATUS_COLORS.DRAFT;
            return (
              <div key={s.status} className="rounded-xl border border-th-border bg-th-surface-overlay/30 p-4 cursor-pointer hover:border-primary/50 hover:bg-th-surface-overlay/60 transition-all" onClick={() => navigate(`/analytics/denials/root-cause/claims?status=${s.status}`)}>

                <div className="flex items-center gap-2 mb-2">
                  <span className={cn('size-2.5 rounded-full shrink-0', colors.bg)} />
                  <span className="text-[11px] font-bold text-th-muted uppercase">{s.status}</span>
                </div>
                <p className="text-lg font-bold text-th-heading tabular-nums">{fmt(s.total_amount)}</p>
                <p className="text-[10px] text-th-secondary tabular-nums mt-1">{s.count.toLocaleString()} claims &middot; avg {s.avg_age_days}d</p>
                <p className="text-[10px] text-th-muted mt-1.5 italic">{STATUS_DESCRIPTIONS[s.status] || ''}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Root Cause + No ERA — Two Column Layout */}
      <div className="grid grid-cols-12 gap-6">

        {/* Root Cause of Aging — Horizontal Bars */}
        <div className="col-span-12 lg:col-span-7 bg-th-surface-raised border border-th-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-th-heading">Root Cause of Aging</h3>
              <p className="text-[10px] text-th-muted mt-1">Why claims remain unpaid — by dollar impact</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-blue-500" /> Process</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-500" /> Preventable</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-500" /> Payer</span>
            </div>
          </div>
          <div className="space-y-3">
            {aging_by_root_cause.map(rc => {
              const groupColors = ROOT_CAUSE_GROUP_COLORS[rc.group] || ROOT_CAUSE_GROUP_COLORS.PROCESS;
              const barPct = Math.max((rc.impact / maxRcImpact) * 100, 4);
              return (
                <div key={rc.root_cause} className="group cursor-pointer hover:bg-th-surface-overlay/30 rounded-lg p-1 -m-1 transition-all" onClick={() => navigate(`/analytics/denials/root-cause/claims?cause=${rc.root_cause}`)}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[11px] font-bold', groupColors.text)}>
                        {rc.root_cause.replace(/_/g, ' ')}
                      </span>
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded border font-semibold', groupColors.bg, groupColors.border)}>
                        {rc.group}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-th-heading tabular-nums">{fmt(rc.impact)}</span>
                  </div>
                  <div className="w-full h-5 rounded-md bg-th-surface-overlay/50 overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all duration-500 flex items-center pl-2"
                      style={{ width: `${barPct}%`, backgroundColor: groupColors.bar }}
                    >
                      <span className="text-[9px] font-bold text-white/90 whitespace-nowrap">{rc.count.toLocaleString()} claims</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* No ERA + Top Slow Payers */}
        <div className="col-span-12 lg:col-span-5 space-y-6">

          {/* No ERA Alert */}
          {no_era_received && no_era_received.count > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 cursor-pointer hover:border-red-500/40 transition-all" onClick={() => navigate('/analytics/denials/root-cause/claims?no_era=true')}>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-red-400 text-xl mt-0.5">warning</span>
                <div>
                  <h4 className="text-sm font-bold text-red-400 mb-1">No ERA Received</h4>
                  <p className="text-xs text-th-secondary leading-relaxed">
                    <span className="font-bold text-th-heading">{no_era_received.count.toLocaleString()}</span> claims worth{' '}
                    <span className="font-bold text-red-400">{fmt(no_era_received.total_amount)}</span> have been submitted but received{' '}
                    <span className="font-bold text-red-400">no payment response</span> from payers.
                  </p>
                  <p className="text-[10px] text-th-muted mt-2 italic">These need ERA follow-up or resubmission</p>
                </div>
              </div>
            </div>
          )}

          {/* Top Slow Payers */}
          <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-th-border">
              <h3 className="text-sm font-bold text-th-heading">Top Slow Payers</h3>
              <p className="text-[10px] text-th-muted mt-1">Payers contributing most to aging AR</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0f1623] text-th-muted text-[10px] font-bold uppercase tracking-widest border-b border-th-border">
                  <tr>
                    <th className="p-3">Payer</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-right">Avg Days</th>
                    <th className="p-3 text-right">Claims</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-th-border">
                  {aging_by_payer.slice(0, 8).map((p, i) => (
                    <tr key={i} className="hover:bg-th-surface-overlay/50 transition-colors">
                      <td className="p-3 text-xs font-semibold text-th-heading">{p.payer_name}</td>
                      <td className="p-3 text-right text-xs font-mono font-medium text-th-heading tabular-nums">{fmt(p.total_amount)}</td>
                      <td className="p-3 text-right text-xs tabular-nums">
                        <span className={cn('font-bold', p.avg_age_days > 500 ? 'text-red-400' : p.avg_age_days > 300 ? 'text-amber-400' : 'text-th-secondary')}>
                          {p.avg_age_days}d
                        </span>
                      </td>
                      <td className="p-3 text-right text-xs text-th-secondary tabular-nums">{p.count.toLocaleString()}</td>
                    </tr>
                  ))}
                  {aging_by_payer.length === 0 && (
                    <tr><td colSpan={4} className="p-6 text-center text-xs text-th-muted">No payer data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- KPI Card ---
function KPICard({ label, value, suffix, icon, iconColor, accentColor, sub }) {
  return (
    <div className={cn(
      'bg-th-surface-raised border border-th-border border-l-[3px] p-5 rounded-xl flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
      accentColor || 'border-l-blue-500'
    )}>
      <div className="flex justify-between items-start">
        <p className="text-th-muted text-xs font-semibold uppercase tracking-wider">{label}</p>
        {icon && <span className={cn('material-symbols-outlined', iconColor || 'text-th-muted')}>{icon}</span>}
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-bold text-th-heading tabular-nums">
          {value}{suffix || ''}
        </h3>
        {sub && <p className="text-[10px] text-th-muted mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}

// --- AR Trend SVG Chart ---
function ARTrendChart({ trend }) {
  if (!trend || trend.length === 0) {
    return <div className="h-48 flex items-center justify-center text-xs text-th-muted">No trend data available</div>;
  }

  const data = trend;
  const maxVal = Math.max(...data.map(d => d.total_ar || 0));
  const minVal = Math.min(...data.map(d => d.total_ar || 0));
  const yMax = Math.ceil(maxVal / 1e6) * 1e6;
  const yMin = Math.floor(minVal / 1e6) * 1e6;
  const yRange = yMax - yMin || 1;

  const svgW = 600;
  const svgH = 220;
  const padL = 55;
  const padR = 20;
  const padT = 10;
  const padB = 30;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  const toX = (i) => padL + (i / (data.length - 1)) * chartW;
  const toY = (v) => padT + chartH - ((v - yMin) / yRange) * chartH;

  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.total_ar || 0) }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const fillPath = linePath + ` L${points[points.length - 1].x},${toY(yMin)} L${points[0].x},${toY(yMin)} Z`;

  const ySteps = 5;
  const yLabels = [];
  for (let i = 0; i <= ySteps; i++) {
    const v = yMin + (yRange / ySteps) * i;
    yLabels.push({ value: `$${(v / 1e6).toFixed(0)}M`, y: toY(v) });
  }

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-56">
      <defs>
        <linearGradient id="arTrendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yLabels.map((l, i) => (
        <g key={i}>
          <line x1={padL} y1={l.y} x2={svgW - padR} y2={l.y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
          <text x={padL - 6} y={l.y + 3} textAnchor="end" className="fill-th-muted" fontSize="9" fontWeight="600">{l.value}</text>
        </g>
      ))}
      <path d={fillPath} fill="url(#arTrendGrad)" />
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" stroke="#1e293b" strokeWidth="2" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={toX(i)} y={svgH - 6} textAnchor="middle" className="fill-th-muted" fontSize="9" fontWeight="700">
          {d.month}
        </text>
      ))}
    </svg>
  );
}
