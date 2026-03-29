import React, { useState } from 'react';
import { DateRangePicker, FilterChipGroup, ConfidenceBar } from '../../../components/ui';

// ─── Mini SVG Arc Gauge ─────────────────────────────────────────────────────
function ArcGauge({ pct, color, size = 64 }) {
  const r = 24;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-th-surface-overlay" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor" className="text-th-heading">{pct}%</text>
    </svg>
  );
}

// ─── Revenue Line Chart ──────────────────────────────────────────────────────
function RevenueLineChart() {
  const data = [8.2, 8.8, 9.1, 9.4, 10.1, 10.8, 11.2, 10.9, 11.8, 12.4, 13.1, 13.2];
  const months = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];
  const W = 540; const H = 180; const pad = { t: 24, r: 24, b: 32, l: 40 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;
  const minV = 7.5; const maxV = 14;
  const xOf = (i) => pad.l + (i / (data.length - 1)) * iW;
  const yOf = (v) => pad.t + iH - ((v - minV) / (maxV - minV)) * iH;

  // Build path
  const pts = data.map((v, i) => `${xOf(i)},${yOf(v)}`);
  const linePath = 'M ' + pts.join(' L ');
  // Filled area
  const areaPath = `M ${xOf(0)},${yOf(data[0])} ` + data.map((v, i) => `L ${xOf(i)},${yOf(v)}`).join(' ') + ` L ${xOf(data.length - 1)},${pad.t + iH} L ${xOf(0)},${pad.t + iH} Z`;

  // Annotation at index 9 (month 10 = Apr)
  const annX = xOf(9); const annY = yOf(12.4);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[8, 9, 10, 11, 12, 13].map(v => (
          <line key={v} x1={pad.l} x2={pad.l + iW} y1={yOf(v)} y2={yOf(v)}
            stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" className="text-th-secondary" />
        ))}
        {[8, 9, 10, 11, 12, 13].map(v => (
          <text key={v} x={pad.l - 6} y={yOf(v) + 4} textAnchor="end" fontSize="9" fill="currentColor" className="text-th-muted" fillOpacity="0.5">{v}M</text>
        ))}

        {/* Area fill — current quarter (last 3) slightly tinted */}
        <path d={`M ${xOf(9)},${yOf(data[9])} L ${xOf(10)},${yOf(data[10])} L ${xOf(11)},${yOf(data[11])} L ${xOf(11)},${pad.t + iH} L ${xOf(9)},${pad.t + iH} Z`}
          fill="rgba(37,99,235,0.08)" />

        {/* Main area */}
        <path d={areaPath} fill="rgba(37,99,235,0.07)" />

        {/* Main line */}
        <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* Current quarter line overlay */}
        <path d={`M ${xOf(9)},${yOf(data[9])} L ${xOf(10)},${yOf(data[10])} L ${xOf(11)},${yOf(data[11])}`}
          fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots */}
        {data.map((v, i) => (
          <circle key={i} cx={xOf(i)} cy={yOf(v)} r="3.5"
            fill={i >= 9 ? '#60a5fa' : '#2563eb'} stroke="white" strokeWidth="1.5" />
        ))}

        {/* Annotation callout at index 9 */}
        <line x1={annX} y1={annY - 4} x2={annX} y2={annY - 26} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
        <rect x={annX - 48} y={annY - 44} width="96" height="18" rx="4" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="0.8" />
        <text x={annX} y={annY - 32} textAnchor="middle" fontSize="8" fill="#f59e0b" fontWeight="600">A/R initiative +$1.2M</text>

        {/* Month labels */}
        {months.map((m, i) => (
          <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.5" className="text-th-muted">{m}</text>
        ))}

        {/* Current quarter label */}
        <text x={xOf(10)} y={pad.t + 12} textAnchor="middle" fontSize="8" fill="#60a5fa" fontWeight="600" opacity="0.8">Current Qtr</text>
      </svg>
    </div>
  );
}

// ─── AR Days Mini SVG ────────────────────────────────────────────────────────
function ARDaysTrend() {
  const pts = [[0, 60], [40, 52], [80, 44], [120, 36]];
  const path = 'M ' + pts.map(([x, y]) => `${x},${y}`).join(' L ');
  return (
    <svg viewBox="0 0 130 70" className="w-full h-12">
      <path d={path} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#10b981" />
      ))}
      {[['Now', 0, 60], ['30d', 40, 52], ['60d', 80, 44]].map(([l, x, y]) => (
        <text key={l} x={x} y={70} textAnchor="middle" fontSize="8" fill="currentColor" fillOpacity="0.5">{l}</text>
      ))}
    </svg>
  );
}

// ─── Denial Rate Mini SVG arc ────────────────────────────────────────────────
function DenialTrend() {
  return (
    <svg viewBox="0 0 130 50" className="w-full h-10">
      <path d="M 0,40 Q 65,0 130,30" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="0" cy="40" r="3" fill="#f59e0b" />
      <circle cx="65" cy="12" r="3" fill="#f59e0b" opacity="0.6" />
      <circle cx="130" cy="30" r="3" fill="#10b981" />
      <text x="0" y="50" textAnchor="middle" fontSize="8" fill="currentColor" fillOpacity="0.5">Now</text>
      <text x="65" y="50" textAnchor="middle" fontSize="8" fill="currentColor" fillOpacity="0.5">30d</text>
      <text x="130" y="50" textAnchor="middle" fontSize="8" fill="currentColor" fillOpacity="0.5">60d</text>
    </svg>
  );
}

// ─── NLQ Denial Mini Bar Chart ───────────────────────────────────────────────
function DenialMiniBar() {
  const items = [
    { label: 'Prior Auth', pct: 34, color: '#ef4444' },
    { label: 'Med. Necessity', pct: 28, color: '#f59e0b' },
    { label: 'Coding', pct: 19, color: '#3b82f6' },
    { label: 'Eligibility', pct: 12, color: '#8b5cf6' },
    { label: 'Other', pct: 7, color: '#6b7280' },
  ];
  return (
    <div className="space-y-2 mt-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-[10px] text-th-muted w-24 shrink-0">{item.label}</span>
          <div className="flex-1 h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.pct * 2.8}%`, backgroundColor: item.color }} />
          </div>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: item.color }}>{item.pct}%</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function LidaAnalytics() {
  const [nlqValue, setNlqValue] = useState('');
  const [activeLevel, setActiveLevel] = useState('All');
  const levels = ['All', 'Descriptive', 'Diagnostic', 'Predictive', 'Prescriptive'];

  const gaugeData = [
    { label: 'Descriptive', pct: 98, color: '#3b82f6', sub: '14.2M events analyzed', badge: 'ai-descriptive' },
    { label: 'Diagnostic', pct: 94, color: '#f59e0b', sub: '847 root causes identified', badge: 'ai-diagnostic' },
    { label: 'Predictive', pct: 89, color: '#8b5cf6', sub: '90-day horizon', badge: 'ai-predictive' },
    { label: 'Prescriptive', pct: 84, color: '#10b981', sub: '142 recommendations executed', badge: 'ai-prescriptive' },
  ];

  const actions = [
    { priority: 'red', title: 'Implement Pre-Scrub AI Rules', impact: '+3.6% first-pass rate', timeline: 'This Week', conf: 92, cta: 'Execute' },
    { priority: 'red', title: 'Batch Appeal: 47 Aetna CO-4', impact: '$128K recovery', timeline: 'Immediate', conf: 89, cta: 'Execute' },
    { priority: 'amber', title: 'Coding Audit: E&M Complexity', impact: '$420K revenue', timeline: 'This Month', conf: 87, cta: 'Review' },
    { priority: 'blue', title: 'Payment Plan Campaign: 284 accts', impact: '$1.2M recovery', timeline: 'This Week', conf: 83, cta: 'Execute' },
    { priority: 'amber', title: 'Contract Renegotiation: Aetna', impact: '$180K/yr increase', timeline: 'This Month', conf: 79, cta: 'Review' },
    { priority: 'red', title: 'Evening Outreach: 127 hot accts', impact: '2.4× conversion', timeline: 'Immediate', conf: 92, cta: 'Execute' },
  ];

  const timelineColors = { 'Immediate': 'bg-red-500/10 text-red-500', 'This Week': 'bg-amber-500/10 text-amber-500', 'This Month': 'bg-blue-500/10 text-blue-500' };
  const priorityDot = { red: 'bg-red-500', amber: 'bg-amber-500', blue: 'bg-blue-500' };

  const exampleQueries = [
    'Top denial drivers this month?',
    'Compare payer performance vs last quarter',
    'Predict A/R days next 60 days',
    'Which claims are at risk of timely filing?',
    'Aetna vs BCBS collection rate',
    'Show prescriptive actions by ROI',
  ];

  const payerCompare = [
    { payer: 'Aetna', q1: '82.4%', q2: '87.1%', delta: '+4.7%', up: true },
    { payer: 'BCBS', q1: '88.1%', q2: '89.4%', delta: '+1.3%', up: true },
    { payer: 'UHC', q1: '76.5%', q2: '74.2%', delta: '-2.3%', up: false },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto font-sans">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-th-heading text-3xl font-black leading-tight tracking-tight">
              Revenue Intelligence Analytics
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              LIDA AI-Powered
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
              NLQ + 4 Analytics Levels
            </span>
          </div>
          <p className="text-th-secondary text-sm">
            Full-spectrum analytics: Descriptive · Diagnostic · Predictive · Prescriptive — powered by LIDA AI
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg h-9 px-3 bg-th-surface-raised text-th-heading text-sm font-semibold border border-th-border hover:bg-th-surface-overlay transition-colors">
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Live
          </button>
          <button className="flex items-center gap-2 rounded-lg h-9 px-3 bg-primary text-white text-sm font-semibold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all">
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export
          </button>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-th-surface-raised border border-th-border rounded-xl">
        <DateRangePicker />
        <select className="bg-th-surface-overlay border border-th-border rounded-lg text-xs font-medium text-th-heading py-2 pl-3 pr-7 focus:ring-primary focus:border-primary outline-none">
          <option>All Payers</option>
          <option>Aetna</option>
          <option>UnitedHealth</option>
          <option>BlueCross</option>
          <option>Medicare</option>
          <option>Humana</option>
        </select>
        <select className="bg-th-surface-overlay border border-th-border rounded-lg text-xs font-medium text-th-heading py-2 pl-3 pr-7 focus:ring-primary focus:border-primary outline-none">
          <option>All Departments</option>
          <option>Cardiology</option>
          <option>Orthopedics</option>
          <option>Emergency</option>
          <option>Radiology</option>
        </select>
        <div className="flex items-center gap-1 bg-th-surface-overlay rounded-lg p-1 border border-th-border">
          {levels.map((l) => (
            <button key={l}
              onClick={() => setActiveLevel(l)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${activeLevel === l ? 'bg-primary text-white shadow-sm' : 'text-th-secondary hover:text-th-heading'}`}>
              {l}
            </button>
          ))}
        </div>
        <FilterChipGroup chips={[
          { label: 'High Priority', color: 'red' },
          { label: 'Preventable', color: 'amber' },
          { label: 'AI Flagged', color: 'blue' },
        ]} />
      </div>

      {/* ── Section A: Analytics Intelligence Score ──────────────────── */}
      <div className="bg-gradient-to-r from-primary/5 via-th-surface-raised to-purple-500/5 border border-th-border rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary text-[20px]">insights</span>
          <h2 className="text-th-heading text-base font-bold">Analytics Intelligence Score</h2>
          <span className="text-xs text-th-muted">— Live coverage across all 4 analytic levels</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {gaugeData.map((g) => (
            <div key={g.label} className="flex items-center gap-4 bg-th-surface-raised border border-th-border rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
              <ArcGauge pct={g.pct} color={g.color} size={56} />
              <div className="flex flex-col gap-1 min-w-0">
                <span className={g.badge}>{g.label}</span>
                <p className="text-th-heading text-sm font-bold tabular-nums">{g.pct}% coverage</p>
                <p className="text-th-muted text-[10px] leading-tight">{g.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section B: Revenue Analytics Grid ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Left: Revenue Trend */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-th-heading text-base font-bold">Revenue Trend Analysis</h3>
              <span className="ai-descriptive">Descriptive</span>
            </div>
            <button className="text-th-secondary hover:text-primary">
              <span className="material-symbols-outlined text-[18px]">open_in_full</span>
            </button>
          </div>
          <RevenueLineChart />
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
              <span className="material-symbols-outlined text-[12px]">arrow_upward</span>
              YoY +21.4%
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
              <span className="material-symbols-outlined text-[12px]">trending_up</span>
              QoQ +6.5%
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20">
              <span className="material-symbols-outlined text-[12px]">check_circle</span>
              vs Budget +2.1%
            </span>
          </div>
        </div>

        {/* Right: Denial Impact */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-th-heading text-base font-bold">Denial Impact Analysis</h3>
            <span className="ai-diagnostic">Diagnostic</span>
          </div>

          {/* Stacked bar chart */}
          <div className="space-y-3 mb-5">
            {[
              { label: 'All Claims', pct: 100, count: '14,284', color: 'bg-blue-500' },
              { label: 'Clean Claims', pct: 94.2, count: '13,455', color: 'bg-emerald-500' },
              { label: 'Denied', pct: 4.8, count: '686', color: 'bg-red-500' },
              { label: 'Pending', pct: 1.0, count: '143', color: 'bg-amber-500' },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="text-[11px] text-th-secondary w-24 shrink-0 font-medium">{row.label}</span>
                <div className="flex-1 h-5 bg-th-surface-overlay rounded-md overflow-hidden relative">
                  <div className={`h-full rounded-md ${row.color} transition-all duration-700`} style={{ width: `${row.pct}%` }} />
                  <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-bold text-white mix-blend-overlay tabular-nums">{row.pct}%</span>
                </div>
                <span className="text-[11px] font-bold text-th-heading tabular-nums w-14 text-right">{row.count}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-th-border pt-4 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted mb-2">Denial by Category</p>
            <div className="flex flex-wrap gap-2">
              {[['Prior Auth','34%','red'],['Medical Necessity','28%','amber'],['Coding','19%','blue'],['Eligibility','12%','purple'],['Other','7%','gray']].map(([label, pct, c]) => (
                <span key={label} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border
                  ${c === 'red' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    c === 'amber' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    c === 'blue' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    c === 'purple' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    'bg-th-surface-overlay text-th-muted border-th-border'}`}>
                  {label}: {pct}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[16px] mt-0.5 shrink-0">psychology</span>
              <p className="text-xs text-th-heading leading-relaxed">
                <span className="font-bold text-amber-500">AI Diagnostic: </span>
                62% of denials (428 claims) are preventable with coding &amp; auth workflow fixes. Estimated recovery: <span className="font-bold text-emerald-500">$384K</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section C: Predictive Analytics ─────────────────────────── */}
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-purple-400 text-[20px]">show_chart</span>
          <h2 className="text-th-heading text-base font-bold">Predictive Analytics</h2>
          <span className="ai-predictive">Predictive AI</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Panel 1: A/R Days */}
          <div className="bg-th-surface-overlay/40 border border-th-border rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-th-heading text-sm font-bold">A/R Days Prediction</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">On Track</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[['Current', '38d', 'text-amber-500'], ['30-Day', '35.2d', 'text-blue-400'], ['60-Day', '33.8d', 'text-emerald-500']].map(([l, v, c]) => (
                <div key={l} className="text-center">
                  <p className={`text-lg font-black tabular-nums ${c}`}>{v}</p>
                  <p className="text-[10px] text-th-muted">{l}</p>
                </div>
              ))}
            </div>
            <ARDaysTrend />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-th-muted">Target: &lt;35 days</span>
              <ConfidenceBar score={87} size="sm" label="Confidence" className="w-32" />
            </div>
          </div>

          {/* Panel 2: Revenue Forecast */}
          <div className="bg-th-surface-overlay/40 border border-th-border rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-th-heading text-sm font-bold">Revenue Forecast Q2</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Q2 Forecast</span>
            </div>
            <p className="text-th-muted text-[10px] mb-1">Run Rate: <span className="font-bold text-th-heading tabular-nums">$13.2M/mo</span></p>
            <div className="space-y-2 mt-3">
              {[['Best Case', '$44.2M', 'bg-emerald-500', 100], ['Base', '$41.8M', 'bg-primary', 94], ['Downside', '$38.4M', 'bg-red-400', 87]].map(([label, val, color, w]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-[10px] text-th-muted w-16 shrink-0">{label}</span>
                  <div className="flex-1 h-5 bg-th-surface-overlay rounded-md overflow-hidden">
                    <div className={`h-full rounded-md ${color} transition-all duration-700`} style={{ width: `${w}%` }} />
                  </div>
                  <span className="text-xs font-bold tabular-nums text-th-heading w-14 text-right">{val}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-th-border">
              <ConfidenceBar score={84} size="sm" label="Confidence" />
            </div>
          </div>

          {/* Panel 3: Denial Rate */}
          <div className="bg-th-surface-overlay/40 border border-th-border rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-th-heading text-sm font-bold">Denial Rate Prediction</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Improving</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[['Current', '4.8%', 'text-red-400'], ['30-Day', '4.2%', 'text-amber-500'], ['60-Day', '3.8%', 'text-emerald-500']].map(([l, v, c]) => (
                <div key={l} className="text-center">
                  <p className={`text-lg font-black tabular-nums ${c}`}>{v}</p>
                  <p className="text-[10px] text-th-muted">{l}</p>
                </div>
              ))}
            </div>
            <DenialTrend />
            <p className="text-[10px] text-th-muted mt-1 italic">If current initiatives continue</p>
            <div className="mt-2">
              <ConfidenceBar score={82} size="sm" label="Confidence" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section D: Prescriptive Intelligence ────────────────────── */}
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-emerald-500 text-[20px]">bolt</span>
          <h2 className="text-th-heading text-base font-bold">AI Prescriptive Recommendations</h2>
          <span className="ai-prescriptive">Prescriptive AI</span>
          <span className="ml-auto px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20">
            142 actions executed this month
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, i) => (
            <div key={i} className="bg-th-surface-overlay/40 border border-th-border rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${priorityDot[action.priority]}`} />
                <p className="text-th-heading text-sm font-bold leading-snug flex-1">{action.title}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-500 text-sm font-bold tabular-nums">{action.impact}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${timelineColors[action.timeline]}`}>
                  {action.timeline}
                </span>
              </div>
              <ConfidenceBar score={action.conf} size="sm" label="AI Confidence" />
              <button className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                action.cta === 'Execute'
                  ? 'bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/20'
                  : 'bg-th-surface-overlay text-th-heading border border-th-border hover:bg-th-surface-overlay/80'}`}>
                {action.cta === 'Execute' ? (
                  <span className="flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                    Execute
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                    Review
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section E: AI Natural Language Query ────────────────────── */}
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary text-[20px]">chat</span>
          <h2 className="text-th-heading text-base font-bold">AI Natural Language Query</h2>
          <span className="ai-predictive">LIDA NLQ</span>
        </div>

        {/* Input */}
        <div className="relative group mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-[20px]">bolt</span>
          <input
            type="text"
            value={nlqValue}
            onChange={(e) => setNlqValue(e.target.value)}
            placeholder="Ask LIDA Analytics anything about your revenue cycle..."
            className="w-full pl-10 pr-24 py-3.5 bg-th-surface-overlay border-2 border-th-border focus:border-primary rounded-xl text-sm text-th-heading placeholder:text-th-muted outline-none transition-all"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-[14px]">search</span>
            Query
          </button>
        </div>

        {/* Example chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="text-[11px] text-th-muted font-medium self-center">Try:</span>
          {exampleQueries.map((q, i) => (
            <button key={i} onClick={() => setNlqValue(q)}
              className="text-[11px] px-3 py-1.5 rounded-full bg-th-surface-overlay text-th-secondary hover:bg-primary/10 hover:text-primary transition-colors border border-th-border">
              {q}
            </button>
          ))}
        </div>

        {/* Example results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Result 1 */}
          <div className="bg-th-surface-overlay/50 border border-th-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-[16px]">query_stats</span>
              <p className="text-xs font-bold text-th-heading">"What are the top denial drivers this month?"</p>
            </div>
            <div className="bg-th-surface-raised rounded-lg p-3">
              <p className="text-[10px] font-bold text-th-muted uppercase tracking-wider mb-2">LIDA Response — Denial Drivers (Mar 2026)</p>
              <DenialMiniBar />
              <p className="text-[10px] text-th-secondary mt-3 italic leading-relaxed">
                Prior authorization is the #1 driver at 34%, up 8% from last month. LIDA recommends implementing real-time auth verification to reduce by est. 18%.
              </p>
            </div>
          </div>

          {/* Result 2 */}
          <div className="bg-th-surface-overlay/50 border border-th-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-[16px]">compare_arrows</span>
              <p className="text-xs font-bold text-th-heading">"Compare payer performance vs last quarter"</p>
            </div>
            <div className="bg-th-surface-raised rounded-lg p-3">
              <p className="text-[10px] font-bold text-th-muted uppercase tracking-wider mb-2">LIDA Response — Q1 vs Q2 Collection Rate</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-th-border">
                    <th className="text-left py-1.5 text-[10px] text-th-muted font-semibold uppercase tracking-wider">Payer</th>
                    <th className="text-right py-1.5 text-[10px] text-th-muted font-semibold uppercase tracking-wider">Q1</th>
                    <th className="text-right py-1.5 text-[10px] text-th-muted font-semibold uppercase tracking-wider">Q2</th>
                    <th className="text-right py-1.5 text-[10px] text-th-muted font-semibold uppercase tracking-wider">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-th-border/50">
                  {payerCompare.map((row) => (
                    <tr key={row.payer} className="hover:bg-th-surface-overlay/30 transition-colors">
                      <td className="py-2 font-medium text-th-heading">{row.payer}</td>
                      <td className="py-2 text-right tabular-nums text-th-secondary">{row.q1}</td>
                      <td className="py-2 text-right tabular-nums font-bold text-th-heading">{row.q2}</td>
                      <td className={`py-2 text-right tabular-nums font-bold ${row.up ? 'text-emerald-500' : 'text-red-400'}`}>{row.delta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-th-secondary mt-3 italic leading-relaxed">
                Aetna and BCBS show strong improvement. UHC declining — LIDA suggests reviewing contract terms and appeal workflows.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
