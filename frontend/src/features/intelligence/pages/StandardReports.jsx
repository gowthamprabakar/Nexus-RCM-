import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-th-border rounded ${className}`} />;
}

function fmt$(n) {
  if (n == null) return '$0';
  const a = Math.abs(n);
  if (a >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

const REPORT_TEMPLATES = [
  {
    id: 'daily-flash',
    title: 'Daily Flash Report',
    description: 'End-of-day summary of denials received, payments posted, and claims submitted. Key variances highlighted.',
    icon: 'flash_on',
    frequency: 'Daily',
    color: 'border-l-primary',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    apis: ['denials', 'payments'],
  },
  {
    id: 'weekly-ar',
    title: 'Weekly A/R Aging',
    description: 'Aging bucket trends, payer-level drill-downs, and projected cash flow impact from outstanding receivables.',
    icon: 'account_balance',
    frequency: 'Weekly',
    color: 'border-l-blue-500',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    apis: ['ar', 'pipeline'],
  },
  {
    id: 'weekly-denials',
    title: 'Weekly Denial Digest',
    description: 'Top denial categories, appeal outcomes, root cause clusters, and prevention effectiveness metrics.',
    icon: 'gavel',
    frequency: 'Weekly',
    color: 'border-l-red-500',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
    apis: ['denials', 'rootCause'],
  },
  {
    id: 'monthly-exec',
    title: 'Monthly Executive Summary',
    description: 'Board-ready executive overview with revenue forecasts, operational KPIs, and AI-driven insights.',
    icon: 'monitoring',
    frequency: 'Monthly',
    color: 'border-l-purple-500',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
    apis: ['pipeline', 'ar'],
  },
  {
    id: 'monthly-payer',
    title: 'Monthly Payer Performance',
    description: 'Payer-by-payer comparison of payment velocity, underpayment trends, and contract compliance rates.',
    icon: 'groups',
    frequency: 'Monthly',
    color: 'border-l-amber-500',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    apis: ['payments', 'denials'],
  },
  {
    id: 'quarterly-trend',
    title: 'Quarterly Trend Analysis',
    description: 'Multi-quarter trend lines for all RCM KPIs with seasonal adjustments and year-over-year comparisons.',
    icon: 'trending_up',
    frequency: 'Quarterly',
    color: 'border-l-emerald-500',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    apis: ['rootCause', 'forecast'],
  },
  {
    id: 'annual-review',
    title: 'Annual Review Report',
    description: 'Comprehensive year-end analysis including financial performance, operational efficiency, and strategic recommendations.',
    icon: 'calendar_month',
    frequency: 'Annual',
    color: 'border-l-rose-500',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-500',
    apis: ['forecast', 'rootCause'],
  },
];

export function StandardReports() {
  const [loading, setLoading] = useState(true);
  const [denialData, setDenialData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [pipelineData, setPipelineData] = useState(null);
  const [arData, setArData] = useState(null);
  const [rootCauseData, setRootCauseData] = useState(null);
  const [forecastData, setForecastData] = useState(null);

  useEffect(() => {
    Promise.all([
      api.denials.getSummary(),
      api.payments.getSummary(),
      api.analytics.getPipeline(),
      api.ar.getSummary(),
      api.rootCause.getSummary(),
      api.forecast.getSummary(),
    ]).then(([denials, payments, pipeline, ar, rootCause, forecast]) => {
      if (denials) setDenialData(denials);
      if (payments) setPaymentData(payments);
      if (pipeline) setPipelineData(pipeline);
      if (ar) setArData(ar);
      if (rootCause) setRootCauseData(rootCause);
      if (forecast) setForecastData(forecast);
    }).catch(err => console.error('StandardReports load error:', err))
      .finally(() => setLoading(false));
  }, []);

  // ── Derive key metric preview per report ────────────────────────────────
  const getMetricPreview = (reportId) => {
    switch (reportId) {
      case 'daily-flash': {
        const denials = denialData?.total_denials;
        const payments = paymentData?.total_posted || paymentData?.total_payments;
        return denials != null || payments != null
          ? `${denials?.toLocaleString() ?? '---'} denials | ${fmt$(payments)} posted`
          : null;
      }
      case 'weekly-ar': {
        const totalAR = arData?.total_ar || arData?.total_outstanding;
        const pipeline = pipelineData?.total_claims || pipelineData?.total;
        return totalAR != null
          ? `${fmt$(totalAR)} outstanding | ${pipeline?.toLocaleString() ?? '---'} in pipeline`
          : null;
      }
      case 'weekly-denials': {
        const rate = denialData?.successful_appeal_rate;
        const topCat = denialData?.top_categories?.[0]?.category;
        return rate != null
          ? `${rate.toFixed(1)}% appeal win | Top: ${topCat || 'N/A'}`
          : null;
      }
      case 'monthly-exec': {
        const pipeline = pipelineData?.total_value || pipelineData?.total_amount;
        const ar = arData?.total_ar || arData?.total_outstanding;
        return pipeline != null || ar != null
          ? `Pipeline: ${fmt$(pipeline)} | AR: ${fmt$(ar)}`
          : null;
      }
      case 'monthly-payer': {
        const variance = paymentData?.total_variance || paymentData?.underpaid_total;
        const denials = denialData?.denied_revenue_at_risk;
        return variance != null || denials != null
          ? `Variance: ${fmt$(variance)} | At Risk: ${fmt$(denials)}`
          : null;
      }
      case 'quarterly-trend': {
        const causes = rootCauseData?.root_causes?.length;
        const forecast = forecastData?.projected_revenue || forecastData?.forecast_amount;
        return causes != null || forecast != null
          ? `${causes ?? 0} root causes | Forecast: ${fmt$(forecast)}`
          : null;
      }
      case 'annual-review': {
        const recovered = rootCauseData?.total_recovered;
        const forecast = forecastData?.projected_revenue || forecastData?.forecast_amount;
        return recovered != null || forecast != null
          ? `Recovered: ${fmt$(recovered)} | Projected: ${fmt$(forecast)}`
          : null;
      }
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto font-sans h-full">
      <div className="p-6 max-w-[1600px] mx-auto space-y-6 w-full">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-th-heading flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">summarize</span>
              Standard Reports
            </h1>
            <p className="text-th-secondary text-sm mt-1">Pre-built report templates with live data previews. Generate or schedule any report.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 h-10 rounded-lg bg-th-surface-raised border border-th-border text-th-heading text-sm font-bold hover:bg-th-surface-overlay transition-colors">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              <span>Schedule Reports</span>
            </button>
            <button className="flex items-center gap-2 px-6 h-10 rounded-lg bg-primary text-th-heading text-sm font-bold hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Custom Report</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            [1,2,3,4].map(i => (
              <div key={i} className="bg-th-surface-raised border border-th-border rounded-xl p-4">
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-7 w-1/2" />
              </div>
            ))
          ) : (
            [
              { label: 'Reports Available', value: '7', icon: 'description', color: 'text-primary' },
              { label: 'Data Sources Active', value: '6', icon: 'database', color: 'text-emerald-500' },
              { label: 'Last Generated', value: 'Today', icon: 'schedule', color: 'text-amber-500' },
              { label: 'Scheduled Reports', value: '3', icon: 'event_repeat', color: 'text-purple-500' },
            ].map((stat, i) => (
              <div key={i} className="bg-th-surface-raised border border-th-border rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`material-symbols-outlined text-[18px] ${stat.color}`}>{stat.icon}</span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">{stat.label}</p>
                </div>
                <p className={`text-xl font-black tabular-nums ${stat.color}`}>{stat.value}</p>
              </div>
            ))
          )}
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {REPORT_TEMPLATES.map((report) => {
            const preview = getMetricPreview(report.id);
            return (
              <div
                key={report.id}
                className={`bg-th-surface-raised border border-th-border border-l-4 ${report.color} rounded-xl p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 group`}
              >
                {/* Report Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`size-12 rounded-xl ${report.iconBg} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-2xl ${report.iconColor}`}>{report.icon}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-th-surface-overlay text-th-muted text-[10px] font-bold uppercase tracking-wider border border-th-border">
                    {report.frequency}
                  </span>
                </div>

                {/* Report Info */}
                <h3 className="text-lg font-bold text-th-heading mb-2">{report.title}</h3>
                <p className="text-xs text-th-secondary leading-relaxed mb-4">{report.description}</p>

                {/* Live Metric Preview */}
                <div className="bg-th-surface-overlay/40 rounded-lg p-3 mb-4 border border-th-border/50 min-h-[44px] flex items-center">
                  {loading ? (
                    <Skeleton className="h-4 w-3/4" />
                  ) : preview ? (
                    <div className="flex items-center gap-2 w-full">
                      <span className="material-symbols-outlined text-[14px] text-emerald-500">fiber_manual_record</span>
                      <span className="text-xs font-semibold text-th-heading tabular-nums">{preview}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-th-muted">hourglass_empty</span>
                      <span className="text-xs text-th-muted">Awaiting data...</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-th-heading rounded-lg text-xs font-bold shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all group-hover:shadow-md">
                    <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                    Generate Report
                  </button>
                  <button className="flex items-center justify-center gap-1 px-3 py-2.5 bg-th-surface-overlay border border-th-border text-th-heading rounded-lg text-xs font-bold hover:bg-th-surface-overlay transition-colors">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom: Recent Report Activity */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-th-heading flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Recent Report Activity
            </h3>
            <button className="text-primary text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-th-surface-overlay/50 border-b border-th-border">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Report</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Generated</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">By</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {[
                  { name: 'Daily Flash Report', date: 'Today, 6:00 PM', by: 'Scheduled', status: 'Complete' },
                  { name: 'Weekly A/R Aging', date: 'Mon, 8:00 AM', by: 'Scheduled', status: 'Complete' },
                  { name: 'Monthly Executive Summary', date: 'Mar 1, 9:00 AM', by: 'CFO Office', status: 'Complete' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-th-surface-overlay/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-th-heading">{row.name}</td>
                    <td className="px-4 py-3 text-th-secondary font-mono tabular-nums text-xs">{row.date}</td>
                    <td className="px-4 py-3 text-th-secondary">{row.by}</td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-500 font-bold flex items-center gap-1 text-xs">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-primary font-bold hover:underline text-xs">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
