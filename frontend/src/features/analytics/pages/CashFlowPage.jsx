import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { cn } from '../../../lib/utils';
import { AIInsightCard } from '../../../components/ui';

const fmt = (n) => n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(0)}K` : `$${Math.round(n).toLocaleString()}`;

function SkeletonPulse({ className }) {
  return <div className={cn('animate-pulse bg-th-surface-overlay rounded', className)} />;
}

export function CashFlowPage() {
  const [triangulation, setTriangulation] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [reconSummary, setReconSummary] = useState(null);
  const [paymentsSummary, setPaymentsSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState([]);
  const [rootCauseSummary, setRootCauseSummary] = useState(null);
  const [preventionData, setPreventionData] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [tri, fc, recon, payments] = await Promise.all([
        api.payments.getTriangulationSummary().catch(() => null),
        api.forecast.getSummary().catch(() => null),
        api.reconciliation.getSummary().catch(() => null),
        api.payments.getSummary().catch(() => null),
      ]);
      if (tri) setTriangulation(tri);
      if (fc) setForecast(fc);
      if (recon) setReconSummary(recon);
      if (payments) setPaymentsSummary(payments);
      setLoading(false);
      // Load AI insights (non-blocking)
      api.ai.getInsights('payments').then(res => {
        if (res?.insights?.length) setAiInsights(res.insights);
      }).catch(() => {});
      // Non-blocking: root cause + prevention
      api.rootCause.getSummary().then(d => setRootCauseSummary(d)).catch(() => null);
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

  const totalBank = triangulation?.total_bank_deposited || 0;
  const totalERA = triangulation?.total_era_received || 0;
  const totalForecasted = triangulation?.total_forecasted || 0;
  const eraGap = triangulation?.era_bank_gap || 0;
  const eraGapPct = triangulation?.era_bank_gap_pct || 0;
  const payerBreakdown = triangulation?.payer_breakdown || [];

  // Float days: rough estimate from payment summary
  const floatDays = paymentsSummary?.avg_payment_rate
    ? Math.round(100 / paymentsSummary.avg_payment_rate * 3)
    : 0;

  // Forecast weekly data
  const forecastWeeks = forecast?.by_week || {};
  const forecastGrandTotal = forecast?.grand_total_forecasted || 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total Cash Received"
            value={fmt(totalBank)}
            icon="account_balance"
            iconColor="text-emerald-400"
            accentColor="border-l-emerald-500"
            sub="Bank deposits confirmed"
          />
          <KPICard
            label="ERA Expected"
            value={fmt(totalERA)}
            icon="receipt_long"
            iconColor="text-blue-400"
            accentColor="border-l-blue-500"
            sub="Total ERA/835 received"
          />
          <KPICard
            label="ERA vs Bank Variance"
            value={fmt(Math.abs(eraGap))}
            icon="compare_arrows"
            iconColor={eraGap >= 0 ? 'text-emerald-400' : 'text-rose-400'}
            accentColor={eraGap >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500'}
            sub={`${eraGapPct >= 0 ? '+' : ''}${eraGapPct.toFixed(2)}% variance`}
          />
          <KPICard
            label="Est. Float Days"
            value={`${floatDays}`}
            suffix=" days"
            icon="hourglass_top"
            iconColor="text-amber-400"
            accentColor="border-l-amber-500"
            sub="Avg ERA to bank deposit"
          />
        </div>

        {/* Root Cause Revenue Risk + Prevention */}
        {rootCauseSummary?.top_causes?.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-th-surface-raised border border-th-border text-xs">
            <span className="material-symbols-outlined text-amber-400 text-sm">troubleshoot</span>
            <span className="font-bold text-th-muted uppercase tracking-wider text-[10px]">Revenue at Risk by Root Cause:</span>
            {rootCauseSummary.top_causes.slice(0, 3).map((c, i) => (
              <span key={i} className="text-th-heading font-semibold">
                {c.cause?.replace(/_/g, ' ')} <span className="text-amber-400 font-bold tabular-nums">{c.pct || Math.round(c.count / (rootCauseSummary.total || 1) * 100)}%</span>
                {i < 2 && rootCauseSummary.top_causes.length > i + 1 && <span className="text-th-muted mx-1">|</span>}
              </span>
            ))}
          </div>
        )}
        {preventionData && (preventionData.total > 0 || preventionData.alerts?.length > 0) && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs">
            <span className="material-symbols-outlined text-rose-400 text-sm">shield</span>
            <span className="font-bold text-rose-400 tabular-nums">{preventionData.total || preventionData.alerts?.length || 0}</span>
            <span className="text-th-secondary">preventable risks may impact cash flow</span>
          </div>
        )}

        {/* Cash Flow Chart + Forecast */}
        <div className="grid grid-cols-12 gap-6">
          {/* Cash Flow Comparison */}
          <div className="col-span-12 lg:col-span-7 bg-th-surface-raised border border-th-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-th-heading">Cash Flow: ERA vs Bank Deposits</h3>
                <p className="text-[10px] text-th-muted mt-1">Per-payer comparison of expected vs received cash</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-semibold text-th-secondary">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-blue-500" /> ERA Received
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-emerald-500" /> Bank Deposited
                </div>
              </div>
            </div>
            <CashFlowBarChart payers={payerBreakdown} />
          </div>

          {/* Forecast Forward View */}
          <div className="col-span-12 lg:col-span-5 bg-th-surface-raised border border-th-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-th-heading">4-Week Forecast</h3>
                <p className="text-[10px] text-th-muted mt-1">Predicted cash inflow by week</p>
              </div>
              <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border bg-violet-500/10 text-violet-400 border-violet-500/20">
                Predictive
              </span>
            </div>
            <div className="space-y-3">
              {Object.entries(forecastWeeks).length > 0 ? (
                Object.entries(forecastWeeks).map(([weekStart, amount], i) => {
                  const pct = forecastGrandTotal > 0 ? (amount / forecastGrandTotal * 100) : 0;
                  return (
                    <div key={weekStart} className="rounded-lg border border-th-border bg-th-surface-overlay/30 p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-semibold text-th-heading">
                          {i === 0 ? 'This Week' : i === 1 ? 'Next Week' : `Week ${i + 1}`}
                        </span>
                        <span className="text-sm font-bold text-th-heading tabular-nums">{fmt(amount)}</span>
                      </div>
                      <div className="w-full bg-th-surface-overlay h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] text-th-muted">w/o {weekStart}</span>
                        <span className="text-[9px] text-th-muted tabular-nums">{pct.toFixed(1)}% of total</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-th-muted">No forecast data available</div>
              )}
              <div className="border-t border-th-border pt-3 flex justify-between items-center">
                <span className="text-[11px] font-bold text-th-muted uppercase tracking-wider">Total Forecast</span>
                <span className="text-lg font-bold text-th-heading tabular-nums">{fmt(forecastGrandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payer Cash Flow Table */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-th-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-th-heading">Payer Cash Flow Detail</h3>
              <p className="text-[10px] text-th-muted mt-1">Three-way reconciliation: Forecast vs ERA vs Bank</p>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border bg-sky-500/10 text-sky-400 border-sky-500/20">
              Triangulation
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#0f1623] text-th-muted text-[10px] font-bold uppercase tracking-widest border-b border-th-border">
                <tr>
                  <th className="p-3">Payer</th>
                  <th className="p-3 text-right">Forecasted</th>
                  <th className="p-3 text-right">ERA Received</th>
                  <th className="p-3 text-right">Bank Deposited</th>
                  <th className="p-3 text-right">Variance</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {payerBreakdown.map((p, i) => {
                  const varianceAbs = Math.abs(p.variance || 0);
                  const isPositive = (p.variance || 0) >= 0;
                  const variancePct = p.forecasted > 0 ? Math.abs(p.variance / p.forecasted * 100) : 0;
                  return (
                    <tr key={i} className={cn(
                      'hover:bg-th-surface-overlay/50 transition-colors',
                      variancePct > 10 ? 'bg-rose-900/5' : ''
                    )}>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-th-heading">{p.payer_name}</div>
                        <div className="text-[10px] text-th-muted font-mono">{p.payer_id}</div>
                      </td>
                      <td className="p-3 text-right text-xs font-mono font-medium text-th-heading tabular-nums">{fmt(p.forecasted)}</td>
                      <td className="p-3 text-right text-xs font-mono font-medium text-th-heading tabular-nums">{fmt(p.era_received)}</td>
                      <td className="p-3 text-right text-xs font-mono font-medium text-th-heading tabular-nums">{fmt(p.bank_deposited)}</td>
                      <td className="p-3 text-right">
                        <span className={cn('text-xs font-mono font-bold tabular-nums', isPositive ? 'text-emerald-400' : 'text-rose-400')}>
                          {isPositive ? '+' : '-'}{fmt(varianceAbs)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold',
                          variancePct <= 2 ? 'bg-emerald-900/40 text-emerald-400' :
                          variancePct <= 10 ? 'bg-amber-900/40 text-amber-400' :
                          'bg-rose-900/40 text-rose-400'
                        )}>
                          {variancePct <= 2 ? 'Matched' : variancePct <= 10 ? 'Review' : 'Escalate'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {payerBreakdown.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-xs text-th-muted">No payer cash flow data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Totals Footer */}
          <div className="border-t border-th-border bg-[#0f1623] px-3 py-3 flex items-center gap-8">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-th-muted font-bold uppercase tracking-wider">Totals</span>
              <span className="text-th-heading font-bold tabular-nums">Forecast: {fmt(totalForecasted)}</span>
              <span className="text-th-heading font-bold tabular-nums">ERA: {fmt(totalERA)}</span>
              <span className="text-th-heading font-bold tabular-nums">Bank: {fmt(totalBank)}</span>
              <span className={cn('font-bold tabular-nums', eraGap >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                Var: {eraGap >= 0 ? '+' : '-'}{fmt(Math.abs(eraGap))}
              </span>
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

// --- Cash Flow Bar Chart (ERA vs Bank per payer) ---
function CashFlowBarChart({ payers }) {
  if (!payers || payers.length === 0) {
    return <div className="h-48 flex items-center justify-center text-xs text-th-muted">No payer data available</div>;
  }

  const topPayers = payers.slice(0, 8);
  const maxVal = Math.max(...topPayers.flatMap(p => [p.era_received || 0, p.bank_deposited || 0]));

  const svgW = 600;
  const svgH = 220;
  const padL = 55;
  const padR = 20;
  const padT = 10;
  const padB = 50;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  const barGroupWidth = chartW / topPayers.length;
  const barWidth = barGroupWidth * 0.3;
  const gap = barGroupWidth * 0.1;

  const yMax = Math.ceil(maxVal / 1e6) * 1e6 || 1;
  const toY = (v) => padT + chartH - (v / yMax) * chartH;

  const ySteps = 4;
  const yLabels = [];
  for (let i = 0; i <= ySteps; i++) {
    const v = (yMax / ySteps) * i;
    yLabels.push({ value: `$${(v / 1e6).toFixed(0)}M`, y: toY(v) });
  }

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-52">
      {yLabels.map((l, i) => (
        <g key={i}>
          <line x1={padL} y1={l.y} x2={svgW - padR} y2={l.y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
          <text x={padL - 6} y={l.y + 3} textAnchor="end" className="fill-th-muted" fontSize="9" fontWeight="600">{l.value}</text>
        </g>
      ))}
      {topPayers.map((p, i) => {
        const x = padL + i * barGroupWidth + gap;
        const eraH = ((p.era_received || 0) / yMax) * chartH;
        const bankH = ((p.bank_deposited || 0) / yMax) * chartH;
        // Truncate payer name
        const name = (p.payer_name || '').length > 10 ? (p.payer_name || '').slice(0, 10) + '...' : (p.payer_name || '');
        return (
          <g key={i}>
            <rect x={x} y={padT + chartH - eraH} width={barWidth} height={eraH} fill="#3b82f6" rx="2" opacity="0.85" />
            <rect x={x + barWidth + 2} y={padT + chartH - bankH} width={barWidth} height={bankH} fill="#10b981" rx="2" opacity="0.85" />
            <text x={x + barWidth} y={svgH - padB + 14} textAnchor="middle" className="fill-th-muted" fontSize="8" fontWeight="600" transform={`rotate(-25, ${x + barWidth}, ${svgH - padB + 14})`}>
              {name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
