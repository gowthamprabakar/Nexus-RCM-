import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

const STATUS_COLORS = {
  on_track: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'On Track' },
  delayed: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Delayed' },
  anomaly: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', label: 'Anomaly' },
};

export function ADTPMonitor() {
  const [adtpData, setAdtpData] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [adtp, anom] = await Promise.all([
          api.payments.getADTP(),
          api.payments.getADTPAnomalies(),
        ]);
        setAdtpData(adtp || null);
        setAnomalies(anom?.length ? anom : []);
      } catch {
        setAdtpData(null);
        setAnomalies([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-th-muted">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!adtpData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-th-muted gap-2">
        <span className="material-symbols-outlined text-4xl">info</span>
        <p className="text-sm">No ADTP data available.</p>
      </div>
    );
  }

  const data = adtpData;
  const summary = data.summary || { monitored: 0, on_track: 0, delayed: 0, anomalies: 0 };
  const payers = data.payers || [];

  return (
    <div className="flex-1 overflow-y-auto font-sans h-full">
      <div className="p-6 max-w-[1600px] mx-auto w-full">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-black text-th-heading tracking-tight">ADTP Monitor</h1>
            <p className="text-sm text-th-secondary">Average Days to Payment &mdash; Payment Cadence Intelligence</p>
          </div>
          <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-th-heading text-sm font-bold shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-sm">ios_share</span>
            <span>Export</span>
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Payers Monitored', value: summary.monitored, color: 'border-l-blue-500', textColor: 'text-th-heading' },
            { label: 'On-Track', value: summary.on_track, color: 'border-l-emerald-500', textColor: 'text-emerald-400' },
            { label: 'Delayed', value: summary.delayed, color: 'border-l-amber-500', textColor: 'text-amber-400' },
            { label: 'Anomalies', value: summary.anomalies, color: 'border-l-rose-500', textColor: 'text-rose-400' },
          ].map((kpi) => (
            <div key={kpi.label} className={`flex flex-col gap-1 rounded-xl p-4 bg-th-surface-raised border border-th-border border-l-[3px] ${kpi.color} hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">{kpi.label}</p>
              <p className={`text-3xl font-black tabular-nums ${kpi.textColor}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Payer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {payers.map((p) => {
            const sc = STATUS_COLORS[p.status] || STATUS_COLORS.on_track;
            return (
              <div key={p.payer} className={`rounded-xl p-4 border ${sc.border} ${sc.bg} hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200`}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-sm font-bold text-th-heading">{p.payer}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.text}`}>{sc.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-th-muted uppercase font-bold">Expected</p>
                    <p className="text-lg font-black text-th-heading tabular-nums">{p.expected_adtp}d</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-th-muted uppercase font-bold">Actual</p>
                    <p className={`text-lg font-black tabular-nums ${sc.text}`}>{p.actual_adtp}d</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <span className={`material-symbols-outlined text-sm ${p.trend > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {p.trend > 0 ? 'trending_up' : 'trending_down'}
                  </span>
                  <span className={`text-xs font-bold tabular-nums ${p.trend > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {p.trend > 0 ? '+' : ''}{p.trend} days
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Anomaly Alerts */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-rose-400 text-lg">warning</span>
            <h3 className="text-sm font-bold text-th-heading uppercase tracking-wider">Anomaly Alerts</h3>
          </div>
          <div className="space-y-3">
            {anomalies.map((alert, i) => (
              <div key={i} className={`p-4 rounded-lg border-l-[3px] ${alert.severity === 'critical' ? 'border-l-rose-500 bg-rose-900/10' : 'border-l-amber-500 bg-amber-900/10'}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-bold text-th-heading">{alert.payer}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase ${alert.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'}`}>{alert.severity}</span>
                    <span className="text-[10px] text-th-muted">{alert.detected_at}</span>
                  </div>
                </div>
                <p className="text-xs text-th-secondary leading-relaxed">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ADTP Trend Placeholder */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
          <h3 className="text-sm font-bold text-th-heading mb-4">ADTP Trend (12-Week Rolling)</h3>
          <div className="h-48 flex items-center justify-center text-th-muted text-sm border border-dashed border-th-border rounded-lg">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">show_chart</span>
              <span>Trend visualization renders with chart library</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
