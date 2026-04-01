import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RootCauseTree } from '../../../components/ui/RootCauseTree';

// ─── Badge Components ───────────────────────────────────────────────────────

function AIPill({ type }) {
  const configs = {
    Descriptive: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    Diagnostic:  'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    Predictive:  'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    Prescriptive:'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${configs[type] || configs.Descriptive}`}>
      {type}
    </span>
  );
}

function StatusBadge({ label, color }) {
  const colors = {
    green:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    blue:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    amber:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
    red:    'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[color] || colors.blue}`}>
      {label}
    </span>
  );
}

// ─── Sparkline SVG ──────────────────────────────────────────────────────────

function Sparkline({ data, color = '#10b981', width = 64, height = 20 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

// ─── Confidence Bar ──────────────────────────────────────────────────────────

function ConfidenceBar({ value, color = 'bg-blue-500' }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%`, transition: 'width 1s ease' }} />
      </div>
      <span className="text-xs tabular-nums text-slate-400 w-8 text-right">{value}%</span>
    </div>
  );
}

// ─── Section 1: Hero / Intelligence Score Header ─────────────────────────────

function HeroSection() {
  const [score, setScore] = useState(0);
  const [claimsRate, setClaimsRate] = useState(2847);
  const circumference = 2 * Math.PI * 54;

  useEffect(() => {
    // Animate score gauge 0 → 94.2 over 1500ms
    const start = performance.now();
    const duration = 1500;
    const target = 94.2;
    const raf = requestAnimationFrame(function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setScore(+(target * eased).toFixed(1));
      if (progress < 1) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    // Live ticker fluctuation
    const id = setInterval(() => {
      setClaimsRate(r => {
        const delta = Math.floor(Math.random() * 60) - 30;
        return Math.max(2700, Math.min(3100, r + delta));
      });
    }, 1800);
    return () => clearInterval(id);
  }, []);

  const dashOffset = circumference - (score / 100) * circumference;

  const statPills = [
    { type: 'Descriptive',  label: 'Real-time',    stat: '14.2M data points/day' },
    { type: 'Diagnostic',   label: 'Root Cause',   stat: '847 patterns identified' },
    { type: 'Predictive',   label: 'Forecasting',  stat: '89.4% accuracy' },
    { type: 'Prescriptive', label: 'Actions',      stat: '142 auto-executions today' },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/5 mb-6"
      style={{
        background: 'linear-gradient(135deg, #080f1e 0%, #0d1730 50%, #101c3a 100%)',
        backgroundImage: `
          linear-gradient(135deg, #080f1e 0%, #0d1730 50%, #101c3a 100%),
          repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.02) 40px),
          repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.02) 40px)
        `,
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      {/* Glow blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex items-center gap-8 p-8">
        {/* LEFT: Score Gauge */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <svg width="140" height="140" viewBox="0 0 140 140">
            {/* Track */}
            <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            {/* Score arc */}
            <circle
              cx="70" cy="70" r="54"
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dashoffset 0.05s linear' }}
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            {/* Score text */}
            <text x="70" y="62" textAnchor="middle" fill="white" fontSize="26" fontWeight="800" fontFamily="system-ui" className="tabular-nums">
              {score.toFixed(1)}
            </text>
            <text x="70" y="78" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9" fontWeight="600" fontFamily="system-ui" letterSpacing="1">
              AI IQ SCORE
            </text>
          </svg>
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Enterprise Intelligence Index</p>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-semibold">LIVE</span>
            </div>
          </div>
        </div>

        {/* CENTER: Stat Pills */}
        <div className="flex-1 grid grid-cols-2 xl:grid-cols-4 gap-3">
          {statPills.map(pill => (
            <div key={pill.type} className="flex flex-col gap-2 p-4 rounded-xl border border-white/5 bg-white/3 backdrop-blur-sm">
              <AIPill type={pill.type} />
              <p className="text-sm font-semibold text-white">{pill.label}</p>
              <p className="text-xs text-slate-400 tabular-nums">{pill.stat}</p>
            </div>
          ))}
        </div>

        {/* RIGHT: Live Ticker */}
        <div className="flex-shrink-0 flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-right">
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">AI Processing</p>
              <p className="text-xl font-bold text-white tabular-nums">{claimsRate.toLocaleString()}<span className="text-sm text-slate-400 font-normal"> claims/min</span></p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-slate-500">Models Active</span>
              <span className="text-xs font-bold text-white">3 / 3</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-slate-500">Uptime</span>
              <span className="text-xs font-bold text-emerald-400">99.98%</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-slate-500">Avg Latency</span>
              <span className="text-xs font-bold text-blue-400">142ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 2: ROI Dashboard Cards ─────────────────────────────────────────

function ROICard({ title, value, sub1, sub2, borderColor, icon, sparkData, sparkColor }) {
  return (
    <div className={`card p-5 border-l-[3px] ${borderColor} hover:-translate-y-0.5 transition-all duration-200 cursor-default`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <span className="material-symbols-outlined text-base text-slate-400">{icon}</span>
          </div>
          <p className="text-xs font-semibold text-th-secondary uppercase tracking-wider">{title}</p>
        </div>
        <Sparkline data={sparkData} color={sparkColor} />
      </div>
      <p className="text-3xl font-extrabold text-th-heading tabular-nums tracking-tight mb-2">{value}</p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-th-secondary tabular-nums">{sub1}</p>
        <span className="text-xs font-semibold text-emerald-400 tabular-nums">{sub2}</span>
      </div>
    </div>
  );
}

function ROISection() {
  const cards = [
    {
      title: 'Denials Prevented',
      value: '$1.84M',
      sub1: 'This Month: $284K',
      sub2: '+23% YoY',
      borderColor: 'border-l-emerald-500',
      icon: 'shield',
      sparkData: [40, 52, 48, 61, 58, 72, 68, 84, 91, 100],
      sparkColor: '#10b981',
    },
    {
      title: 'Revenue Recovered',
      value: '$640K',
      sub1: 'Appeals Won: 847',
      sub2: '91.2% win rate',
      borderColor: 'border-l-blue-500',
      icon: 'payments',
      sparkData: [30, 42, 38, 55, 49, 62, 70, 78, 85, 92],
      sparkColor: '#3b82f6',
    },
    {
      title: 'FTE Hours Saved',
      value: '2,840 hrs',
      sub1: '≈ 17.75 FTE months',
      sub2: '$142K cost savings',
      borderColor: 'border-l-purple-500',
      icon: 'person',
      sparkData: [20, 30, 28, 45, 42, 58, 55, 68, 80, 95],
      sparkColor: '#8b5cf6',
    },
    {
      title: 'Auto-Actions Executed',
      value: '12,480',
      sub1: '0 human errors',
      sub2: '99.8% accuracy',
      borderColor: 'border-l-amber-500',
      icon: 'auto_awesome',
      sparkData: [50, 62, 58, 74, 70, 82, 88, 93, 97, 100],
      sparkColor: '#f59e0b',
    },
  ];
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {cards.map(c => <ROICard key={c.title} {...c} />)}
    </div>
  );
}

// ─── Section 3 LEFT: Root Cause Analysis ────────────────────────────────────

function RootCausePanel() {
  return (
    <div className="card p-6">
      <RootCauseTree compact={true} />
    </div>
  );
}

// ─── Section 3 RIGHT: AI Model Performance Monitor ──────────────────────────

function ModelPerformancePanel() {
  const models = [
    {
      name: 'Denial Prediction Engine',
      version: 'v3.8',
      metrics: [
        { label: 'Accuracy', value: '94.2%' },
        { label: 'Precision', value: '96.1%' },
        { label: 'Recall', value: '91.8%' },
      ],
      status: 'HEALTHY',
      statusColor: 'green',
      confidence: 94,
      barColor: 'bg-emerald-500',
      sparkData: [80, 82, 84, 86, 88, 91, 92, 94],
      sparkColor: '#10b981',
    },
    {
      name: 'Revenue Forecasting Agent',
      version: 'v2.1',
      metrics: [
        { label: 'Accuracy', value: '89.4%' },
        { label: 'MAE', value: '$12,400' },
        { label: 'RMSE', value: '0.042' },
      ],
      status: 'STABLE',
      statusColor: 'blue',
      confidence: 89,
      barColor: 'bg-blue-500',
      sparkData: [82, 85, 84, 87, 86, 88, 89, 89],
      sparkColor: '#3b82f6',
    },
    {
      name: 'Coding Optimization Engine',
      version: 'v1.9',
      metrics: [
        { label: 'Accuracy', value: '98.1%' },
        { label: 'F1', value: '0.97' },
        { label: 'AUC', value: '0.99' },
      ],
      status: 'OPTIMAL',
      statusColor: 'purple',
      confidence: 98,
      barColor: 'bg-purple-500',
      sparkData: [90, 93, 94, 96, 97, 97, 98, 98],
      sparkColor: '#8b5cf6',
    },
  ];

  const retrainSchedule = [
    { model: 'Denial Prediction v3.8',       nextDate: 'Mar 28, 2026', interval: '30 days',  status: 'Scheduled' },
    { model: 'Revenue Forecasting v2.1',      nextDate: 'Apr 04, 2026', interval: '45 days',  status: 'Scheduled' },
    { model: 'Coding Optimization v1.9',      nextDate: 'May 01, 2026', interval: '60 days',  status: 'Pending'   },
  ];

  return (
    <div className="card p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Model Monitor
            </span>
          </div>
          <h3 className="text-base font-bold text-th-heading">AI Model Performance Monitor</h3>
        </div>
        <span className="material-symbols-outlined text-blue-400 text-2xl">monitoring</span>
      </div>

      <div className="flex flex-col gap-3">
        {models.map(m => (
          <div key={m.name} className="p-4 rounded-xl border border-th-border bg-th-surface-overlay/40 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-th-heading">{m.name} <span className="text-xs font-normal text-th-muted">{m.version}</span></p>
                <div className="flex items-center gap-3 mt-1.5">
                  {m.metrics.map(met => (
                    <div key={met.label} className="flex flex-col">
                      <span className="text-[10px] text-th-muted uppercase tracking-wider">{met.label}</span>
                      <span className="text-xs font-bold text-th-heading tabular-nums">{met.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge label={m.status} color={m.statusColor} />
                <Sparkline data={m.sparkData} color={m.sparkColor} width={56} height={18} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-th-muted uppercase tracking-wider">Model Confidence</p>
              <ConfidenceBar value={m.confidence} color={m.barColor} />
            </div>
          </div>
        ))}
      </div>

      {/* Retrain Schedule */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-th-muted mb-3">Model Retraining Schedule</p>
        <div className="rounded-lg border border-th-border overflow-hidden">
          <table className="w-full th-table text-xs">
            <thead>
              <tr>
                <th className="!py-2 !px-3">Model</th>
                <th className="!py-2 !px-3">Next Retrain</th>
                <th className="!py-2 !px-3">Interval</th>
                <th className="!py-2 !px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {retrainSchedule.map(r => (
                <tr key={r.model}>
                  <td className="!py-2 !px-3 font-medium text-th-heading">{r.model}</td>
                  <td className="!py-2 !px-3 tabular-nums">{r.nextDate}</td>
                  <td className="!py-2 !px-3 tabular-nums">{r.interval}</td>
                  <td className="!py-2 !px-3">
                    <StatusBadge label={r.status} color={r.status === 'Scheduled' ? 'green' : 'amber'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Section 4: Predictive Intelligence Center ──────────────────────────────

function RevenueForecastChart() {
  const W = 400;
  const H = 200;
  const padL = 48;
  const padR = 16;
  const padT = 16;
  const padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const weeks = ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'];
  const actualValues   = [3.2, 3.4, 3.1, 3.6];
  const forecastValues = [null, null, null, null, 3.7, 3.9, 4.0, 4.1, 4.2, 4.3, 4.5, 4.6];

  const allVals = [...actualValues, 3.7, 3.9, 4.0, 4.1, 4.2, 4.3, 4.5, 4.6];
  const minV = 2.8;
  const maxV = 5.0;

  const toX = (i) => padL + (i / (weeks.length - 1)) * chartW;
  const toY = (v) => padT + chartH - ((v - minV) / (maxV - minV)) * chartH;

  // Actual line points (W1-W4 = indices 0-3)
  const actualPts = actualValues.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');

  // Forecast line points (W4-W12 = indices 3-11, bridging from last actual)
  const forecastPts = [3.6, 3.7, 3.9, 4.0, 4.1, 4.2, 4.3, 4.5, 4.6]
    .map((v, i) => `${toX(i + 3)},${toY(v)}`).join(' ');

  // Confidence band area
  const confTop = [3.6, 3.9, 4.1, 4.2, 4.3, 4.4, 4.7, 4.8, 4.9].map((v, i) => `${toX(i + 3)},${toY(v)}`).join(' ');
  const confBot = [3.6, 3.5, 3.7, 3.8, 3.9, 4.1, 4.2, 4.3, 4.4].map((v, i) => `${toX(i + 3)},${toY(v)}`).join(' ');
  const bandPath = `M${toX(3)},${toY(3.6)} ${confTop} L${toX(11)},${toY(4.4)} ${confBot.split(' ').reverse().join(' ')} Z`;

  const yTicks = [3.0, 3.5, 4.0, 4.5, 5.0];

  return (
    <div className="flex flex-col gap-3">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: W }}>
        {/* Y-axis gridlines */}
        {yTicks.map(t => (
          <g key={t}>
            <line x1={padL} y1={toY(t)} x2={W - padR} y2={toY(t)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={padL - 6} y={toY(t) + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="system-ui">${t}M</text>
          </g>
        ))}
        {/* X-axis labels */}
        {weeks.map((w, i) => (
          <text key={w} x={toX(i)} y={H - 6} textAnchor="middle" fill={i < 4 ? 'rgba(255,255,255,0.5)' : 'rgba(96,165,250,0.7)'} fontSize="8.5" fontFamily="system-ui">{w}</text>
        ))}
        {/* Confidence band */}
        <path d={bandPath} fill="rgba(59,130,246,0.08)" />
        {/* Forecast dashed line */}
        <polyline fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,3" strokeLinecap="round" strokeLinejoin="round" points={forecastPts} opacity="0.85" />
        {/* Actual solid line */}
        <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={actualPts} />
        {/* Data dots - actual */}
        {actualValues.map((v, i) => (
          <circle key={i} cx={toX(i)} cy={toY(v)} r="3.5" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="1.5" />
        ))}
        {/* Divider line at W4 */}
        <line x1={toX(3)} y1={padT} x2={toX(3)} y2={H - padB} stroke="rgba(255,255,255,0.1)" strokeDasharray="3,3" strokeWidth="1" />
        <text x={toX(3) + 3} y={padT + 10} fill="rgba(255,255,255,0.25)" fontSize="8" fontFamily="system-ui">Today</text>
      </svg>
      {/* Legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-0.5 bg-blue-500 rounded" />
          <span className="text-[10px] text-th-muted">Actual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="2"><line x1="0" y1="1" x2="20" y2="1" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,2" opacity="0.8" /></svg>
          <span className="text-[10px] text-th-muted">AI Forecast</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 bg-blue-500/15 rounded" />
          <span className="text-[10px] text-th-muted">95% Confidence Band</span>
        </div>
      </div>
      {/* Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'Peak: W12 $4.6M', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
          { label: 'Q2 Target: $12.8M', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
          { label: 'AI Confidence: 87%', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
        ].map(p => (
          <span key={p.label} className={`px-3 py-1 rounded-full text-xs font-semibold border tabular-nums ${p.color}`}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}

function PaymentMatrix() {
  const payers = ['Medicare', 'Medicaid', 'BCBS', 'Aetna', 'United', 'Cigna'];
  const data = [
    [94, 78, 42],
    [88, 71, 38],
    [91, 74, 41],
    [86, 68, 31],
    [89, 72, 39],
    [83, 64, 28],
  ];
  const trends = [
    ['↑','↑','↓'],
    ['↑','↓','↓'],
    ['↑','↑','↑'],
    ['↓','↓','↓'],
    ['↑','↑','↓'],
    ['↓','↓','↓'],
  ];

  const cellColor = (v) => {
    if (v > 85) return 'bg-emerald-500/20 text-emerald-300';
    if (v >= 65) return 'bg-amber-500/20 text-amber-300';
    return 'bg-red-500/20 text-red-300';
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left py-2 pr-3 text-th-muted font-semibold uppercase tracking-wider text-[10px] w-20">Payer</th>
              <th className="text-center py-2 px-2 text-th-muted font-semibold uppercase tracking-wider text-[10px]">&lt;30 days</th>
              <th className="text-center py-2 px-2 text-th-muted font-semibold uppercase tracking-wider text-[10px]">31–60 days</th>
              <th className="text-center py-2 px-2 text-th-muted font-semibold uppercase tracking-wider text-[10px]">61–90 days</th>
            </tr>
          </thead>
          <tbody>
            {payers.map((payer, pi) => (
              <tr key={payer}>
                <td className="py-1.5 pr-3 font-semibold text-th-heading text-xs">{payer}</td>
                {data[pi].map((val, ci) => (
                  <td key={ci} className="py-1.5 px-2 text-center">
                    <div className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-bold tabular-nums ${cellColor(val)}`}>
                      {val}%
                      <span className={`text-[9px] ${trends[pi][ci] === '↑' ? 'text-emerald-400' : 'text-red-400'}`}>{trends[pi][ci]}</span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 flex-wrap text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500/30 inline-block" /><span className="text-th-muted">&gt;85% High</span></span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500/30 inline-block" /><span className="text-th-muted">65–85% Medium</span></span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500/30 inline-block" /><span className="text-th-muted">&lt;65% Low</span></span>
      </div>
      <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/15">
        <p className="text-xs text-blue-300 leading-relaxed">
          <span className="font-bold text-blue-400">AI Insight:</span> Medicare claims have highest probability of collection within 30 days. Prioritize Medicare A/R follow-up.
        </p>
      </div>
    </div>
  );
}

function PredictiveSection() {
  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <AIPill type="Predictive" />
        <h3 className="text-base font-bold text-th-heading">Predictive Intelligence Center</h3>
        <span className="material-symbols-outlined text-blue-400 text-xl ml-auto">query_stats</span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div>
          <p className="text-sm font-semibold text-th-heading mb-4">90-Day Revenue Forecast</p>
          <RevenueForecastChart />
        </div>
        <div>
          <p className="text-sm font-semibold text-th-heading mb-4">Payment Probability Matrix</p>
          <PaymentMatrix />
        </div>
      </div>
    </div>
  );
}

// ─── Section 5: Prescriptive Action Intelligence ─────────────────────────────

function ActionCard({ dot, title, desc, impact, confidence, btnLabel = 'Execute Now', btnColor = 'bg-emerald-600 hover:bg-emerald-500' }) {
  return (
    <div className="p-3 rounded-xl border border-th-border bg-th-surface-overlay/30 flex flex-col gap-2 hover:border-th-border-strong transition-colors">
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
        <p className="text-xs font-bold text-th-heading leading-snug">{title}</p>
      </div>
      <p className="text-[11px] text-th-secondary leading-relaxed pl-4">{desc}</p>
      <div className="flex items-center justify-between pl-4">
        <div className="flex flex-col gap-0">
          <span className="text-sm font-extrabold text-th-heading tabular-nums">{impact}</span>
          <span className="text-[10px] text-th-muted tabular-nums">AI Confidence: {confidence}%</span>
        </div>
        <button className={`px-3 py-1.5 text-[11px] font-bold text-white rounded-lg transition-colors ${btnColor}`}>
          {btnLabel}
        </button>
      </div>
    </div>
  );
}

function LiveActionFeed() {
  const initial = [
    { text: 'Auto-appealing Claim #88291 (CO-50)', ts: 'Just now',  icon: 'gavel' },
    { text: 'Auto-routing Claim #88847 to senior coder', ts: '2 min ago', icon: 'route' },
    { text: 'Pre-auth submitted for Patient ID 40821', ts: '4 min ago', icon: 'assignment_turned_in' },
    { text: 'Flagging duplicate submission: Claims #77120 & #77183', ts: '7 min ago', icon: 'flag' },
  ];
  const [items, setItems] = useState(initial);

  const pool = [
    { text: 'Auto-posting ERA from Aetna — 142 claims matched', icon: 'receipt_long' },
    { text: 'Appeal packet generated for Claim #90124 (CO-4)', icon: 'description' },
    { text: 'Eligibility re-verified for Patient ID 52019', icon: 'verified_user' },
    { text: 'ICD-10 upgrade suggested: E11.9 → E11.65 for Enc #5212', icon: 'upgrade' },
    { text: 'Prior auth expiry alert sent for Patient 40291', icon: 'notifications_active' },
    { text: 'Duplicate claim #77901 suppressed automatically', icon: 'block' },
  ];

  useEffect(() => {
    let poolIdx = 0;
    const id = setInterval(() => {
      const next = pool[poolIdx % pool.length];
      poolIdx++;
      setItems(prev => [
        { text: next.text, ts: 'Just now', icon: next.icon },
        ...prev.slice(0, 3).map((it, i) => ({ ...it, ts: ['2 min ago','4 min ago','7 min ago'][i] })),
      ]);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-emerald-500/15 bg-emerald-500/5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="material-symbols-outlined text-base text-emerald-400 flex-shrink-0">{item.icon}</span>
          <p className="text-xs text-th-heading flex-1 leading-snug">{item.text}</p>
          <span className="text-[10px] text-th-muted tabular-nums flex-shrink-0">{item.ts}</span>
        </div>
      ))}
      <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors text-left mt-1">
        View all 12,480 auto-executions →
      </button>
    </div>
  );
}

function PrescriptiveSection() {
  const critical = [
    { title: 'Batch Appeal: 47 CO-4 Denials',       desc: 'Mass appeal submission ready — prior auth documentation attached',   impact: '$128K',  confidence: 89 },
    { title: 'Escalate: 12 High-Value A/R >90 days', desc: 'Accounts totaling $840K risk write-off — assign senior collector',   impact: '$840K',  confidence: 94 },
    { title: 'Prior Auth Alert: 8 expiring today',   desc: '8 authorizations expire today — renewal requests needed immediately', impact: 'Prevent $64K', confidence: 99 },
    { title: 'Underpayment Dispute: Aetna CPT 99213–15', desc: 'Contractual rate discrepancy detected across 847 claims',         impact: '$124K',  confidence: 91 },
  ];
  const high = [
    { title: 'Optimize Claim Submission Timing',  desc: 'Submit Mon–Wed AM for 4.2-day faster payment cycle',              impact: '+4.2 days', confidence: 84 },
    { title: 'ICD-10 Complexity Audit: Cardiology',desc: 'E&M undercoding pattern — 247 encounters need review',           impact: '$420K',    confidence: 87 },
    { title: 'Payment Plan Outreach: 284 accounts',desc: 'Propensity model suggests 68% conversion rate on outreach',      impact: '$1.2M',    confidence: 83 },
    { title: 'BCBS Contract Renegotiation Prep',  desc: 'Rate benchmark analysis shows 9–12% below market — arm negotiator', impact: '+9–12% rate', confidence: 79 },
  ];

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <AIPill type="Prescriptive" />
        <h3 className="text-base font-bold text-th-heading">Prescriptive Action Engine</h3>
        <span className="flex items-center gap-1.5 ml-auto px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-xs font-semibold text-purple-400 tabular-nums">142 actions auto-executed today</span>
        </span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Critical */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-red-400">Critical</p>
          </div>
          <div className="flex flex-col gap-2">
            {critical.map(c => (
              <ActionCard key={c.title} dot="bg-red-500 animate-pulse" {...c} btnColor="bg-red-600 hover:bg-red-500" />
            ))}
          </div>
        </div>
        {/* High Priority */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400">High Priority</p>
          </div>
          <div className="flex flex-col gap-2">
            {high.map(c => (
              <ActionCard key={c.title} dot="bg-amber-500" {...c} btnColor="bg-amber-600 hover:bg-amber-500" btnLabel="Schedule" />
            ))}
          </div>
        </div>
        {/* AI Auto-Executing */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">AI Auto-Executing</p>
            <span className="ml-auto text-[10px] text-emerald-400/70 font-semibold">LIVE</span>
          </div>
          <LiveActionFeed />
        </div>
      </div>
    </div>
  );
}

// ─── Section 6: Live AI Activity Feed ───────────────────────────────────────

const FEED_EVENTS_POOL = [
  { type: 'claim_check',   color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', text: 'Claim #89021 → 94% clean ✓',                           ts: '0s' },
  { type: 'denial_risk',   color: 'bg-red-500/20 text-red-300 border-red-500/30',             text: 'Claim #88930 → HIGH RISK 87% → Escalated',             ts: '3s' },
  { type: 'code_suggest',  color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',    text: 'Encounter #4821 → CPT upgrade suggested +$142',         ts: '6s' },
  { type: 'revenue_alert', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',       text: 'A/R bucket 91-120 days → $280K → Attention',            ts: '9s' },
  { type: 'auth_check',    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',    text: 'Patient 40291 → Prior auth gap detected → Alert sent',   ts: '12s' },
  { type: 'payment_pred',  color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',          text: 'Aetna batch → 68% collection within 30 days',           ts: '15s' },
  { type: 'claim_check',   color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', text: 'Claim #91204 → 97% clean ✓',                            ts: '18s' },
  { type: 'code_suggest',  color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',    text: 'Encounter #5031 → ICD-10 complexity upgrade +E11.65',   ts: '21s' },
  { type: 'denial_risk',   color: 'bg-red-500/20 text-red-300 border-red-500/30',             text: 'Claim #90471 → CO-50 risk detected → Queued for review', ts: '24s' },
  { type: 'revenue_alert', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',       text: 'Medicare batch → 12 claims approaching timely filing',  ts: '27s' },
];

function LiveFeed() {
  const [events, setEvents] = useState(FEED_EVENTS_POOL.slice(0, 6));
  const poolRef = useRef(6);

  useEffect(() => {
    const id = setInterval(() => {
      const next = FEED_EVENTS_POOL[poolRef.current % FEED_EVENTS_POOL.length];
      poolRef.current++;
      setEvents(prev => [{ ...next, ts: 'now' }, ...prev.slice(0, 9)]);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <h3 className="text-base font-bold text-th-heading">Live AI Activity Feed</h3>
        <span className="text-[10px] text-th-muted ml-1">Real-time stream • Updates every 3s</span>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[10px] font-bold text-emerald-400 tabular-nums">14.2M</span>
          <span className="text-[10px] text-emerald-400/70">events/day</span>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {events.map((ev, i) => (
          <div
            key={i}
            className={`flex-shrink-0 flex flex-col gap-1 px-3 py-2.5 rounded-xl border ${ev.color} min-w-[220px] max-w-[260px] transition-all duration-300`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${ev.color}`}>
                {ev.type}
              </span>
              <span className="text-[9px] text-th-muted tabular-nums">{ev.ts}</span>
            </div>
            <p className="text-[11px] font-medium leading-snug">{ev.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function AIPerformanceEngine() {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-blue-400 text-xl">psychology</span>
              <h1 className="text-xl font-extrabold text-th-heading tracking-tight">AI Intelligence Command Center</h1>
            </div>
            <p className="text-sm text-th-secondary">Real-time AI performance, impact analytics, and prescriptive actions</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-th-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All systems nominal
            </span>
            <button className="btn-secondary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">download</span>
              Export Report
            </button>
          </div>
        </div>

        {/* Section 1: Hero */}
        <HeroSection />

        {/* Section 2: ROI Dashboard */}
        <ROISection />

        {/* Section 3: Root Cause + Model Monitor */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <RootCausePanel />
          <ModelPerformancePanel />
        </div>

        {/* Section 4: Predictive Intelligence */}
        <PredictiveSection />

        {/* Section 5: Prescriptive Actions */}
        <PrescriptiveSection />

        {/* Section 6: Live Feed */}
        <LiveFeed />
      </div>
    </div>
  );
}
