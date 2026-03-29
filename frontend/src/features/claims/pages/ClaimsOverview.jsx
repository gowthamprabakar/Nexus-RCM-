import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import {
  AIInsightCard,
  ConfidenceBar,
  DateRangePicker,
  FilterChip,
  FilterChipGroup,
} from '../../../components/ui';

function DenialRiskBadge({ claimId, compact }) {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    api.predictions.getDenialProbability(claimId).then(r => {
      if (!cancelled) {
        setRisk(r);
        setLoading(false);
      }
    }).catch(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [claimId]);

  if (loading) return <span className="inline-block w-2 h-2 rounded-full bg-gray-500 animate-pulse" />;
  if (!risk || risk.error) return <span className="text-[10px] text-gray-500">N/A</span>;

  const prob = risk.probability ?? risk.denial_probability ?? 0;
  const pct = Math.round(prob * 100);
  const color = prob > 0.7 ? 'red' : prob > 0.4 ? 'amber' : 'emerald';
  const label = prob > 0.7 ? 'HIGH' : prob > 0.4 ? 'MED' : 'LOW';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-${color}-500/10 text-${color}-400 border-${color}-500/30`}>
      {compact ? `${pct}%` : `${label} ${pct}%`}
    </span>
  );
}

function AIBadge({ level }) {
  const styles = {
    'AI Enhanced': 'bg-primary/10 text-primary border-primary/20',
    'AI Predicted': 'bg-th-info/10 text-th-info border-th-info/20',
    'AI Monitored': 'bg-th-success/10 text-th-success border-th-success/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles[level] || styles['AI Monitored']}`}>
      <span className="material-symbols-outlined text-[10px]">auto_awesome</span>
      {level}
    </span>
  );
}

function InitialAvatar({ name, color }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const bgColors = {
    blue: 'bg-th-info',
    emerald: 'bg-th-success',
    violet: 'bg-primary',
    amber: 'bg-th-warning',
  };
  return (
    <div className={`size-8 rounded-full ${bgColors[color] || 'bg-th-surface-overlay'} flex items-center justify-center text-th-heading text-xs font-bold`}>
      {initials}
    </div>
  );
}

function StatusBadge({ label, variant }) {
  const variants = {
    success: 'bg-th-success/10 text-th-success border-th-success/20',
    warning: 'bg-th-warning/10 text-th-warning border-th-warning/20',
    danger: 'bg-th-danger/10 text-th-danger border-th-danger/20',
    info: 'bg-th-info/10 text-th-info border-th-info/20',
    neutral: 'bg-th-surface-overlay text-th-secondary border-th-border',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${variants[variant] || variants.neutral}`}>
      {label}
    </span>
  );
}

const STATIC_FALLBACK_INSIGHTS = [
  {
    title: 'Clean Claim Rate Declining',
    description: 'Clean claim rate dropped 1.8% in past 14 days. Primary cause: new ICD-10 codes for telehealth services missing from mappings.',
    confidence: 94,
    impact: 'high',
    category: 'Diagnostic',
    action: 'Update ICD-10 mappings',
    value: '1.8% rate impact',
    icon: 'bug_report',
  },
  {
    title: 'Medicare Batch Submission Optimal Time',
    description: 'Medicare claims submitted Mon–Tue process 38% faster. Current Tuesday batch: 1,240 claims ready.',
    confidence: 88,
    impact: 'medium',
    category: 'Prescriptive',
    action: 'Schedule batch now',
    value: '38% faster processing',
    icon: 'schedule',
  },
  {
    title: 'High-Value Claims at Risk',
    description: '28 claims >$8K have exceeded 35-day threshold without follow-up. Automated escalation recommended.',
    confidence: 91,
    impact: 'high',
    category: 'Predictive',
    action: 'Escalate to senior team',
    value: '$342K at risk',
    icon: 'priority_high',
  },
];

// claimRows removed — now loaded from API

export function ClaimsOverview() {
  const navigate = useNavigate();
  const [aiInsights, setAiInsights] = useState(STATIC_FALLBACK_INSIGHTS);
  const [aiLoading, setAiLoading] = useState(false);
  const [dateRange, setDateRange] = useState('This Month');
  const [claimRows, setClaimRows] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(true);

  /* Audit-driven: prevention + root cause */
  const [preventionRisk, setPreventionRisk] = useState(null);
  const [rootCauseSummary, setRootCauseSummary] = useState(null);

  useEffect(() => {
    setAiLoading(true);
    api.ai.getInsights('claims').then(r => {
      if (r?.insights?.length) setAiInsights(r.insights);
      setAiLoading(false);
    }).catch(() => setAiLoading(false));

    api.prevention.scan(5).catch(() => null).then(r => r && setPreventionRisk(r));
    api.rootCause.getSummary().catch(() => null).then(r => r && setRootCauseSummary(r));

    // Load recent claims from API
    setClaimsLoading(true);
    api.graph.getClaims({ limit: 10 }).then(r => {
      if (r?.claims?.length) {
        setClaimRows(r.claims.map(c => ({
          id: c.claim_id,
          patient: c.patient_name || `Patient ${c.patient_id?.slice(-4) || ''}`,
          payer: c.payer_name || c.payer_id || '--',
          amount: c.total_charges || 0,
          status: c.status || 'Unknown',
          aiScore: c.crs_score || 0,
        })));
      }
      setClaimsLoading(false);
    }).catch(() => setClaimsLoading(false));
  }, []);
  const [payer, setPayer] = useState('all');
  const [claimType, setClaimType] = useState('all');
  const [status, setStatus] = useState('all');
  const [provider, setProvider] = useState('all');

  // Build active filter chips
  const activeFilters = [
    payer !== 'all' && { key: 'payer', label: 'Payer', value: payer, color: 'blue' },
    claimType !== 'all' && { key: 'claimType', label: 'Claim Type', value: claimType, color: 'emerald' },
    status !== 'all' && { key: 'status', label: 'Status', value: status, color: 'amber' },
    provider !== 'all' && { key: 'provider', label: 'Provider', value: provider, color: 'purple' },
  ].filter(Boolean);

  const handleRemoveFilter = (key) => {
    if (key === 'payer') setPayer('all');
    if (key === 'claimType') setClaimType('all');
    if (key === 'status') setStatus('all');
    if (key === 'provider') setProvider('all');
  };

  const handleClearAll = () => {
    setPayer('all');
    setClaimType('all');
    setStatus('all');
    setProvider('all');
  };

  const selectClass =
    'h-9 px-3 rounded-lg bg-th-surface-raised border border-th-border text-th-secondary text-sm font-medium ' +
    'hover:bg-th-surface-overlay hover:text-th-heading focus:outline-none focus:ring-1 focus:ring-blue-500 ' +
    'transition-all duration-200 cursor-pointer';

  return (
    <div className="flex h-full font-sans text-th-heading overflow-auto p-6 custom-scrollbar">
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">

        {/* ── Prevention Alert Banner ── */}
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-400">warning</span>
          <span className="text-sm font-bold text-amber-300">
            {preventionRisk?.at_risk_count ?? 5} claims at risk before submission
          </span>
          <span className="text-th-muted text-sm mx-1">&mdash;</span>
          <button onClick={() => navigate('/claims/prevention')} className="text-xs font-bold text-primary hover:underline">
            Review in Prevention Dashboard
          </button>
        </div>

        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              Claims Pipeline Overview
              <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full uppercase tracking-wider border border-primary/20">Executive View</span>
            </h1>
            <p className="text-th-secondary text-sm mt-1">End-to-end visualization of claim lifecycle and throughput velocity.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 h-10 rounded-lg bg-primary text-th-inverted text-sm font-bold hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* ── Enhanced Filter Bar ── */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <DateRangePicker
              value={dateRange}
              onChange={(preset) => setDateRange(preset.label)}
            />

            <select value={payer} onChange={(e) => setPayer(e.target.value)} className={selectClass}>
              <option value="all">All Payers</option>
              <option value="Medicare">Medicare</option>
              <option value="Medicaid">Medicaid</option>
              <option value="BCBS">BCBS</option>
              <option value="Aetna">Aetna</option>
              <option value="United">United</option>
              <option value="Cigna">Cigna</option>
            </select>

            <select value={claimType} onChange={(e) => setClaimType(e.target.value)} className={selectClass}>
              <option value="all">All Claim Types</option>
              <option value="Professional">Professional</option>
              <option value="Institutional">Institutional</option>
              <option value="Dental">Dental</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="Clean">Clean</option>
              <option value="Error">Error</option>
              <option value="Pending">Pending</option>
              <option value="Denied">Denied</option>
            </select>

            <select value={provider} onChange={(e) => setProvider(e.target.value)} className={selectClass}>
              <option value="all">All Providers</option>
              <option value="Dr. Smith">Dr. Smith</option>
              <option value="Dr. Chen">Dr. Chen</option>
              <option value="Dr. Patel">Dr. Patel</option>
              <option value="Dr. Rodriguez">Dr. Rodriguez</option>
            </select>
          </div>

          {activeFilters.length > 0 && (
            <FilterChipGroup
              filters={activeFilters}
              onRemove={handleRemoveFilter}
              onClearAll={handleClearAll}
            />
          )}
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'Total Claims', val: '3,142', sub: 'This Month', color: 'border-l-primary', ai: 'AI Monitored' },
            { title: 'Clean Claim Rate', val: '94.2%', sub: 'AI Enhanced', color: 'border-l-th-success', ai: 'AI Enhanced' },
            { title: 'Avg. Days in A/R', val: '38', sub: '-2.5 Days Improvement', color: 'border-l-th-info', ai: 'AI Predicted' },
            { title: 'Denial Rate', val: '4.2%', sub: 'Within Target (<7%)', color: 'border-l-th-danger', ai: 'AI Monitored' },
          ].map((stat, i) => (
            <div key={i} className={`bg-th-surface-raised border border-th-border ${stat.color} border-l-[3px] p-5 rounded-xl relative overflow-hidden group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}>
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-bold uppercase tracking-wider text-th-secondary">{stat.title}</p>
                <AIBadge level={stat.ai} />
              </div>
              <h3 className="text-3xl font-black text-th-heading mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>{stat.val}</h3>
              <p className="text-[10px] font-medium text-th-secondary">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Submission Mix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'Electronic', val: '85%', count: '2,671 claims', variant: 'success' },
            { title: 'Paper', val: '8%', count: '251 claims', variant: 'warning' },
            { title: 'Portal', val: '7%', count: '220 claims', variant: 'info' },
            { title: 'Claims/FTE/Day', val: '42', count: 'Staff Avg.', variant: 'neutral' },
          ].map((item, i) => (
            <div key={i} className="bg-th-surface-raised border border-th-border p-5 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-th-secondary">{item.title}</p>
                <StatusBadge label={item.title === 'Claims/FTE/Day' ? 'Productivity' : 'Submission'} variant={item.variant} />
              </div>
              <h3 className="text-2xl font-black text-th-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.val}</h3>
              <p className="text-[10px] font-medium text-th-muted mt-0.5">{item.count}</p>
            </div>
          ))}
        </div>

        {/* Main Funnel Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
          <div className="lg:col-span-2 bg-th-surface-raised border border-th-border rounded-xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold">Claims Conversion Funnel</h3>
                <AIBadge level="AI Enhanced" />
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-th-secondary">
                  <span className="size-2 rounded-full bg-th-surface-overlay"></span> Received
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-th-secondary">
                  <span className="size-2 rounded-full bg-th-success"></span> Paid
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center relative px-10">
              {[
                { label: 'Intake / Received', val: '3,142 Claims', width: '100%', color: 'from-th-surface-overlay to-th-surface-highlight' },
                { label: 'Scrubbed Clean', val: '2,960 (94.2%)', width: '90%', color: 'from-th-info to-th-info/80' },
                { label: 'Submitted to Payer', val: '2,948 (99.6%)', width: '82%', color: 'from-primary to-primary/80' },
                { label: 'Accepted (EDI 277)', val: '2,912 (98.8%)', width: '72%', color: 'from-th-primary to-th-primary/80' },
                { label: 'Paid (Net of Denials)', val: '3,010 (95.8%)', width: '62%', color: 'from-th-success to-th-success/80' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-4 mb-3 relative group">
                  <div className="w-32 text-right text-xs font-bold text-th-secondary uppercase">{step.label}</div>
                  <div className="flex-1 h-12 bg-th-surface-overlay rounded relative overflow-hidden flex items-center">
                    <div className={`h-full bg-gradient-to-r ${step.color} rounded relative z-10 flex items-center px-4 transition-all duration-500 group-hover:brightness-110`} style={{ width: step.width }}>
                      <span className="text-th-heading font-bold text-sm drop-shadow-md" style={{ fontVariantNumeric: 'tabular-nums' }}>{step.val}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Productivity & Alerts */}
          <div className="flex flex-col gap-6">
            {/* Team Productivity */}
            <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Staff Productivity</h3>
                <AIBadge level="AI Monitored" />
              </div>
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {[
                  { name: 'Sarah J.', claimsPerDay: 45, speed: '2m 14s', eff: 98, color: 'blue' },
                  { name: 'Mike R.', claimsPerDay: 41, speed: '2m 30s', eff: 95, color: 'emerald' },
                  { name: 'Emily W.', claimsPerDay: 39, speed: '2m 45s', eff: 94, color: 'violet' },
                  { name: 'David L.', claimsPerDay: 35, speed: '3m 10s', eff: 91, color: 'amber' },
                ].map((user, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-th-surface-overlay/50 border border-th-border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                    <InitialAvatar name={user.name} color={user.color} />
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-bold text-th-heading">{user.name}</span>
                        <span className="text-xs font-mono text-primary font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>{user.claimsPerDay} claims/day</span>
                      </div>
                      <div className="w-full bg-th-surface-base h-1.5 rounded-full">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${user.eff}%` }}></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-th-muted">Avg. {user.speed}/claim</span>
                        <span className="text-[10px] text-th-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{user.eff}% efficiency</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Alert */}
            <div className="bg-th-danger/10 border border-th-danger/20 rounded-xl p-5">
              <div className="flex gap-3">
                <div className="p-2 bg-th-danger rounded-lg text-th-heading h-fit">
                  <span className="material-symbols-outlined">warning</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-th-heading mb-1">Untimely Filing Risk</h4>
                  <p className="text-xs text-th-danger leading-relaxed mb-3">
                    142 claims are approaching the 90-day filing deadline. Immediate action recommended to avoid write-offs.
                  </p>
                  <button className="text-xs bg-th-danger hover:opacity-90 text-th-heading font-bold px-3 py-1.5 rounded-full transition-opacity uppercase">
                    View At-Risk Queue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Claims Table with AI Score column ── */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-th-border flex items-center justify-between">
            <h3 className="text-base font-bold text-th-heading">Recent Claims</h3>
            <span className="text-xs text-th-muted tabular-nums">{claimRows.length} claims shown</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-th-surface-overlay/80 border-b border-th-border">
                <tr>
                  {['Claim ID', 'Patient', 'Payer', 'Amount', 'Status', 'AI Score', 'Denial Risk'].map((col) => (
                    <th key={col} className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-th-secondary whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border/50">
                {claimRows.map((row) => {
                  const scoreColor =
                    row.aiScore >= 85
                      ? 'text-th-success'
                      : row.aiScore >= 65
                      ? 'text-th-warning'
                      : 'text-th-danger';
                  return (
                    <tr key={row.id} className="hover:bg-th-surface-overlay/40 transition-colors cursor-pointer" onClick={() => navigate(`/analytics/denials/root-cause/claim/${row.id}`)}>
                      <td className="px-5 py-3 font-mono text-xs font-bold text-primary tabular-nums">{row.id}</td>
                      <td className="px-5 py-3 text-sm font-medium text-th-heading">{row.patient}</td>
                      <td className="px-5 py-3 text-sm text-th-secondary">{row.payer}</td>
                      <td className="px-5 py-3 text-sm font-bold text-th-heading tabular-nums">
                        ${row.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          ['PAID', 'ACKNOWLEDGED', 'Clean'].includes(row.status)
                            ? 'bg-th-success/10 text-th-success border-th-success/20'
                            : ['SUBMITTED', 'DRAFT', 'Pending'].includes(row.status)
                            ? 'bg-th-warning/10 text-th-warning border-th-warning/20'
                            : 'bg-th-danger/10 text-th-danger border-th-danger/20'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 w-36">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold tabular-nums ${scoreColor}`}>
                            {row.aiScore}%
                          </span>
                          <div className="flex-1">
                            <ConfidenceBar
                              score={row.aiScore}
                              size="sm"
                              showLabel={false}
                              showBar={true}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <DenialRiskBadge claimId={row.id} compact />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Root Cause Distribution Mini ── */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-amber-400 text-sm">troubleshoot</span>
            <span className="text-xs font-bold uppercase tracking-wider text-th-muted">Root Cause Distribution</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {(rootCauseSummary?.top_causes || [
              { code: 'ELIGIBILITY', percentage: 22 },
              { code: 'MODIFIER', percentage: 18 },
              { code: 'TIMELY_FILING', percentage: 14 },
              { code: 'AUTH_MISSING', percentage: 12 },
              { code: 'CODING', percentage: 10 },
            ]).map((c) => (
              <div key={c.code} className="flex items-center gap-2">
                <span className="text-xs font-bold text-th-heading">{c.code}</span>
                <div className="w-20 bg-th-surface-overlay rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${c.percentage}%` }} />
                </div>
                <span className="text-[10px] font-bold text-th-secondary tabular-nums">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI Insights ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-icons text-primary text-base">auto_awesome</span>
            <span className="text-th-secondary text-xs font-semibold uppercase tracking-wider">AI Intelligence</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {aiLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-th-surface-raised border border-th-border rounded-xl p-5 space-y-3 animate-pulse">
                  <div className="h-4 w-3/4 bg-th-surface-overlay rounded" />
                  <div className="h-3 w-full bg-th-surface-overlay rounded" />
                  <div className="h-3 w-1/2 bg-th-surface-overlay rounded" />
                </div>
              ))
            ) : (
              aiInsights.map((insight, i) => (
                <AIInsightCard key={i} {...insight} onClick={() => {}} />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
