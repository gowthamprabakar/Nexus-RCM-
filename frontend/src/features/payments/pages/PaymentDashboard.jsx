import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';

const fmt = (n) => {
  if (n == null) return '$0';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};

export function PaymentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [triangulation, setTriangulation] = useState(null);
  const [underpayments, setUnderpayments] = useState(null);
  const [adtpData, setAdtpData] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [eraBankMatch, setEraBankMatch] = useState(null);
  const [rootCauseSummary, setRootCauseSummary] = useState(null);
  const [preventionCount, setPreventionCount] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [sum, tri, under, adtp, insights, eraBank] = await Promise.all([
          api.payments.getSummary(),
          api.payments.getTriangulationSummary(),
          api.payments.getSilentUnderpayments(),
          api.payments.getADTP(),
          api.ai.getInsights('payments'),
          api.payments.getERABankMatch(),
        ]);
        setSummary(sum);
        setTriangulation(tri);
        setUnderpayments(under);
        setAdtpData(adtp);
        setAiInsights(insights);
        setEraBankMatch(eraBank);
      } catch (err) {
        console.error('PaymentDashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
    // Non-blocking: root cause + prevention
    api.rootCause.getSummary().then(d => setRootCauseSummary(d)).catch(() => null);
    api.prevention.scan(3).then(d => setPreventionCount(d)).catch(() => null);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-th-muted">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  // Compute KPIs
  const totalERA = summary?.total_posted || 0;
  const totalBank = triangulation?.total_bank_deposited || eraBankMatch?.total_bank_deposited || 0;
  const eraReceived = triangulation?.total_era_received || eraBankMatch?.total_era_received || 0;
  const variance = eraReceived - totalBank;
  const underpaymentCount = underpayments?.total || underpayments?.items?.length || 0;

  // ADTP average
  const adtpPayers = adtpData?.payers || [];
  const avgADTP = adtpPayers.length > 0
    ? (adtpPayers.reduce((s, p) => s + (p.current_adtp || p.adtp || 0), 0) / adtpPayers.length).toFixed(1)
    : '—';

  // Payer ranking from triangulation
  const payerRows = triangulation?.payers || [];

  // Payment method breakdown from ERA-bank
  const byStatus = eraBankMatch?.by_status || [];

  // AI insights
  const insights = aiInsights?.insights || [];
  const narrative = aiInsights?.narrative || aiInsights?.summary || null;

  const kpis = [
    { label: 'Total ERA Received', value: fmt(eraReceived), icon: 'receipt_long', color: 'border-l-emerald-500', textColor: 'text-emerald-400' },
    { label: 'Total Bank Deposited', value: fmt(totalBank), icon: 'account_balance', color: 'border-l-blue-500', textColor: 'text-blue-400' },
    { label: 'ERA-Bank Variance', value: fmt(Math.abs(variance)), icon: 'trending_down', color: variance > 0 ? 'border-l-amber-500' : 'border-l-rose-500', textColor: variance > 0 ? 'text-amber-400' : 'text-rose-400' },
    { label: 'Underpayment Count', value: underpaymentCount, icon: 'warning', color: 'border-l-rose-500', textColor: 'text-rose-400' },
    { label: 'Avg ADTP (All Payers)', value: `${avgADTP} days`, icon: 'schedule', color: 'border-l-purple-500', textColor: 'text-purple-400' },
  ];

  return (
    <div className="flex-1 overflow-y-auto font-sans h-full">
      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* AI Executive Summary */}
        {narrative && (
          <div className="bg-th-surface-raised border border-th-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-lg text-primary">auto_awesome</span>
              <h3 className="text-sm font-bold text-th-heading">AI Executive Summary</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-sm text-th-secondary leading-relaxed">{narrative}</p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className={`flex flex-col gap-1 rounded-xl p-4 bg-th-surface-raised border border-th-border border-l-[3px] ${kpi.color} hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200`}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-th-muted">{kpi.label}</p>
                <span className="material-symbols-outlined text-base text-th-muted">{kpi.icon}</span>
              </div>
              <p className={`text-2xl font-black tabular-nums ${kpi.textColor}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Root Cause & Prevention Strips */}
        {rootCauseSummary?.top_causes?.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-th-surface-raised border border-th-border text-xs">
            <span className="material-symbols-outlined text-amber-400 text-sm">troubleshoot</span>
            <span className="font-bold text-th-muted uppercase tracking-wider text-[10px]">Top Denial Root Causes:</span>
            {rootCauseSummary.top_causes.slice(0, 3).map((c, i) => (
              <span key={i} className="text-th-heading font-semibold">
                {c.cause?.replace(/_/g, ' ')} <span className="text-amber-400 font-bold tabular-nums">{c.pct || Math.round(c.count / (rootCauseSummary.total || 1) * 100)}%</span>
                {i < 2 && rootCauseSummary.top_causes.length > i + 1 && <span className="text-th-muted mx-1">|</span>}
              </span>
            ))}
          </div>
        )}
        {preventionCount && (preventionCount.total > 0 || preventionCount.alerts?.length > 0) && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs">
            <span className="material-symbols-outlined text-amber-400 text-sm">shield</span>
            <span className="font-bold text-amber-400 tabular-nums">{preventionCount.total || preventionCount.alerts?.length || 0}</span>
            <span className="text-th-secondary">prevention alerts may affect payment timelines</span>
          </div>
        )}

        {/* Payer Payment Ranking Table */}
        {payerRows.length > 0 && (
          <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-th-border">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-th-heading">Payer Payment Ranking</h3>
                <span className="text-[10px] font-bold text-th-muted bg-th-surface-overlay px-2 py-0.5 rounded-full">{payerRows.length} payers</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-th-border text-xs font-bold uppercase tracking-wider text-th-muted">
                    <th className="px-4 py-3 w-8">#</th>
                    <th className="px-4 py-3">Payer Name</th>
                    <th className="px-4 py-3 text-right">Total Paid</th>
                    <th className="px-4 py-3 text-right">ERA Amount</th>
                    <th className="px-4 py-3 text-right">Bank Deposit</th>
                    <th className="px-4 py-3 text-right">Gap %</th>
                  </tr>
                </thead>
                <tbody>
                  {payerRows
                    .sort((a, b) => (b.era || 0) - (a.era || 0))
                    .map((row, i) => (
                      <tr
                        key={row.payer_id || row.payer || i}
                        onClick={() => navigate(`/analytics/payments/payer-profiles?payer=${encodeURIComponent(row.payer_id || row.payer)}`)}
                        className="border-b border-th-border/30 hover:bg-th-surface-overlay/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-xs font-bold text-th-muted">{i + 1}</td>
                        <td className="px-4 py-3 text-sm font-bold text-th-heading">{row.payer || row.payer_name}</td>
                        <td className="px-4 py-3 text-sm text-right text-th-heading font-bold tabular-nums">{fmt(row.era || row.total_paid || 0)}</td>
                        <td className="px-4 py-3 text-sm text-right text-th-heading tabular-nums">{fmt(row.era || 0)}</td>
                        <td className="px-4 py-3 text-sm text-right text-th-heading tabular-nums">{fmt(row.bank || 0)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold tabular-nums ${(row.gap_pct || 0) > 10 ? 'text-rose-400 bg-rose-500/10' : (row.gap_pct || 0) > 5 ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                            {row.gap_pct || 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bottom Row: ERA-Bank Status + ADTP Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ERA-Bank Status Breakdown */}
          {byStatus.length > 0 && (
            <div className="bg-th-surface-raised border border-th-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-th-heading mb-4">ERA-Bank Reconciliation Status</h3>
              <div className="space-y-3">
                {byStatus.map((s) => {
                  const total = byStatus.reduce((acc, r) => acc + (r.count || 0), 0);
                  const pct = total > 0 ? ((s.count / total) * 100).toFixed(1) : 0;
                  const color = s.status === 'Matched' ? 'bg-emerald-500' : s.status === 'Unmatched' ? 'bg-rose-500' : s.status === 'Partial' ? 'bg-amber-500' : 'bg-purple-500';
                  return (
                    <div key={s.status} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-th-heading w-28 truncate">{s.status}</span>
                      <div className="flex-1 h-3 bg-th-surface-overlay rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-th-heading tabular-nums w-16 text-right">{s.count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ADTP Top Payers */}
          {adtpPayers.length > 0 && (
            <div className="bg-th-surface-raised border border-th-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-th-heading mb-4">ADTP by Payer (Avg Days to Pay)</h3>
              <div className="space-y-3">
                {adtpPayers
                  .sort((a, b) => (b.current_adtp || b.adtp || 0) - (a.current_adtp || a.adtp || 0))
                  .slice(0, 10)
                  .map((p) => {
                    const days = p.current_adtp || p.adtp || 0;
                    const maxDays = Math.max(...adtpPayers.map(x => x.current_adtp || x.adtp || 0), 1);
                    const color = days > 30 ? 'bg-rose-500' : days > 20 ? 'bg-amber-500' : 'bg-emerald-500';
                    return (
                      <div key={p.payer_id || p.payer_name} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-th-heading w-36 truncate">{p.payer_name || p.payer_id}</span>
                        <div className="flex-1 h-3 bg-th-surface-overlay rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${(days / maxDays) * 100}%` }} />
                        </div>
                        <span className={`text-xs font-bold tabular-nums w-16 text-right ${days > 30 ? 'text-rose-400' : days > 20 ? 'text-amber-400' : 'text-emerald-400'}`}>{days.toFixed(1)}d</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* AI Insight Cards */}
        {insights.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-lg text-primary">psychology</span>
              <h3 className="text-sm font-bold text-th-heading">AI Payment Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.slice(0, 3).map((insight, i) => (
                <div key={i} className="bg-th-surface-raised border border-th-border rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <span className={`material-symbols-outlined text-lg mt-0.5 ${insight.severity === 'critical' ? 'text-rose-400' : insight.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'}`}>
                      {insight.severity === 'critical' ? 'error' : insight.severity === 'warning' ? 'warning' : 'lightbulb'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-th-heading mb-1">{insight.title || insight.type || 'Insight'}</h4>
                      <p className="text-xs text-th-secondary leading-relaxed">{insight.message || insight.detail || insight.description || ''}</p>
                      {insight.metric && (
                        <p className="text-xs font-bold text-primary mt-2 tabular-nums">{insight.metric}: {insight.value}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!summary && !triangulation && (
          <div className="flex flex-col items-center justify-center py-16 text-th-muted gap-2">
            <span className="material-symbols-outlined text-4xl">info</span>
            <p className="text-sm">No payment data available. Ensure backend is running.</p>
          </div>
        )}

      </div>
    </div>
  );
}
