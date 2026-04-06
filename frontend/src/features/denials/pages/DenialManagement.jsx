import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../../services/api';
import { AIInsightCard, ConfidenceBar, DateRangePicker, FilterChip, FilterChipGroup, RootCauseInvestigationPanel } from '../../../components/ui';
import { AppealSuccessBadge } from '../../../components/predictions';
import { cn } from '../../../lib/utils';

// ── Shared currency formatter ───────────────────────────────────────────────
function fmtCurrency(amount) {
 if (amount == null) return '$0';
 const abs = Math.abs(amount);
 if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
 if (abs >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
 return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

// ── Heatmap fallback data (replaced by API at runtime) ──────────────────────
const FALLBACK_HEATMAP_PAYERS = ['Medicare', 'UHC', 'Aetna', 'Cigna'];
const FALLBACK_HEATMAP_DEPTS = ['Radiology', 'Cardiology', 'Emergency', 'Oncology', 'Surgery'];
const FALLBACK_HEATMAP_DATA = {
 Medicare: [12, 68, 41, 89, 15],
 UHC: [82, 38, 10, 55, 33],
 Aetna: [35, 14, 78, 29, 62],
 Cigna: [8, 52, 30, 11, 9],
};

function heatmapColor(value) {
 if (value >= 75) return 'bg-th-danger';
 if (value >= 60) return 'bg-th-danger/80';
 if (value >= 45) return 'bg-th-warning';
 if (value >= 30) return 'bg-th-warning/70';
 if (value >= 15) return 'bg-th-success/70';
 return 'bg-th-success';
}
function heatmapText(value) {
 if (value >= 60) return 'text-th-heading';
 return 'text-th-heading';
}

// ── Root cause fallback data (replaced by API at runtime) ────────────────────
const FALLBACK_ROOT_CAUSES = [
 { label: 'Eligibility', pct: 22, color: 'rgb(var(--color-info))' },
 { label: 'Authorization', pct: 18, color: 'rgb(var(--color-primary))' },
 { label: 'Coding/Bundling', pct: 16, color: 'rgb(var(--color-info) / 0.7)' },
 { label: 'Medical Necessity', pct: 14, color: 'rgb(var(--color-warning))' },
 { label: 'Non-Covered', pct: 8, color: 'rgb(var(--color-success))' },
 { label: 'Missing Info', pct: 7, color: 'rgb(var(--color-text-secondary))' },
 { label: 'Duplicate', pct: 5, color: 'rgb(var(--color-danger))' },
 { label: 'Timely Filing', pct: 4, color: 'rgb(var(--color-warning) / 0.8)' },
 { label: 'COB', pct: 3, color: 'rgb(var(--color-info) / 0.5)' },
 { label: 'Contractual', pct: 3, color: 'rgb(var(--color-text-muted))' },
];

// Color palette for root-cause categories from API
const ROOT_CAUSE_COLORS = [
  'rgb(var(--color-info))', 'rgb(var(--color-primary))', 'rgb(var(--color-info) / 0.7)',
  'rgb(var(--color-warning))', 'rgb(var(--color-success))', 'rgb(var(--color-text-secondary))',
  'rgb(var(--color-danger))', 'rgb(var(--color-warning) / 0.8)', 'rgb(var(--color-info) / 0.5)',
  'rgb(var(--color-text-muted))',
];

function DonutChart({ data, size = 180, stroke = 28 }) {
 const radius = (size - stroke) / 2;
 const circumference = 2 * Math.PI * radius;
 let cumulative = 0;

 return (
 <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
 {data.map((slice, i) => {
 const dashLen = (slice.pct / 100) * circumference;
 const dashOffset = -(cumulative / 100) * circumference;
 cumulative += slice.pct;
 return (
 <circle
 key={i}
 cx={size / 2}
 cy={size / 2}
 r={radius}
 fill="none"
 stroke={slice.color}
 strokeWidth={stroke}
 strokeDasharray={`${dashLen} ${circumference - dashLen}`}
 strokeDashoffset={dashOffset}
 strokeLinecap="butt"
 />
 );
 })}
 </svg>
 );
}

// MOCK_APPEALS removed — denial rows now come entirely from api.denials.list()

const PAGE_SIZE = 5;

export function DenialManagement() {
 const navigate = useNavigate();
 const [searchParams, setSearchParams] = useSearchParams();
 const urlRootCause = searchParams.get('root_cause');
 const urlStatus = searchParams.get('status');
 const urlNoEra = searchParams.get('no_era');
 const [showAIModal, setShowAIModal] = useState(false);
 const [showHeatmapModal, setShowHeatmapModal] = useState(false);
 const [activeTab, setActiveTab] = useState('queue');
 const [selectedClaim, setSelectedClaim] = useState('CLM-8821');

 // Filter state
 const [mfFilter, setMfFilter] = useState('');
 const [urgFilter, setUrgFilter] = useState('');
 const [dateRange, setDateRange] = useState(null);
 const [payerFilter, setPayerFilter] = useState('');
 const [categoryFilter, setCategoryFilter] = useState('');
 const [carcFilter, setCarcFilter] = useState('');
 const [appealStatusFilter, setAppealStatusFilter] = useState('');
 const [statusFilter, setStatusFilter] = useState('');

 // Pagination
 const [currentPage, setCurrentPage] = useState(1);

 const [summary, setSummary] = useState({
 denied_revenue_at_risk: 0,
 successful_appeal_rate: 0,
 projected_recovery: 0,
 ai_prevention_impact: 0,
 });
 const [appeals, setAppeals] = useState([]);
 const [loading, setLoading] = useState(true);
 const [aiInsights, setAiInsights] = useState([]);
 const [aiLoading, setAiLoading] = useState(false);

 // Heatmap state (populated from API, falls back to inline defaults)
 const [heatmapPayers, setHeatmapPayers] = useState(FALLBACK_HEATMAP_PAYERS);
 const [heatmapDepts, setHeatmapDepts] = useState(FALLBACK_HEATMAP_DEPTS);
 const [heatmapData, setHeatmapData] = useState(FALLBACK_HEATMAP_DATA);

 // Root cause state
 const [rootCauses, setRootCauses] = useState(FALLBACK_ROOT_CAUSES);

 // Prevention alerts state
 const [preventionAlerts, setPreventionAlerts] = useState(null);
 // Diagnostic findings state
 const [criticalFindings, setCriticalFindings] = useState(null);

 // Investigation panel state
 const [investigationOpen, setInvestigationOpen] = useState(false);
 const [investigationContext, setInvestigationContext] = useState(null);

 const openInvestigation = (metric, value, baseline, deviation, severity) => {
   setInvestigationContext({ metric, value, baseline, deviation, severity });
   setInvestigationOpen(true);
 };

 useEffect(() => {
 const loadDashboardData = async () => {
 setLoading(true);
 // Load AI insights in parallel (non-blocking)
 setAiLoading(true);
 api.ai.getInsights('denials').then(r => {
   setAiInsights(r?.insights || []);
   setAiLoading(false);
 });
 try {
 const [sumData, denialsData, matrixData, rootCauseData] = await Promise.all([
   api.denials.getSummary(),
   api.denials.list({ page: 1, size: 100 }),
   api.analytics.getDenialMatrix().catch(() => null),
   api.rootCause.getSummary().catch(() => null),
 ]);
 setSummary(sumData);

 // --- Heatmap from denial matrix API ---
 if (matrixData && matrixData.payers && matrixData.departments && matrixData.matrix) {
   setHeatmapPayers(matrixData.payers);
   setHeatmapDepts(matrixData.departments);
   setHeatmapData(matrixData.matrix);
 }

 // --- Root cause from API (by_root_cause array from /root-cause/summary) ---
 if (rootCauseData && Array.isArray(rootCauseData.by_root_cause) && rootCauseData.by_root_cause.length > 0) {
   setRootCauses(rootCauseData.by_root_cause.map((c, i) => ({
     label: (c.root_cause || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
     pct: c.pct ?? Math.round(c.count / Math.max(rootCauseData.total_analyses, 1) * 100),
     color: ROOT_CAUSE_COLORS[i % ROOT_CAUSE_COLORS.length],
   })));
 } else if (rootCauseData && Array.isArray(rootCauseData.categories)) {
   setRootCauses(rootCauseData.categories.map((c, i) => ({
     label: c.label || c.category || c.name,
     pct: c.pct ?? c.percentage ?? c.count ?? 0,
     color: ROOT_CAUSE_COLORS[i % ROOT_CAUSE_COLORS.length],
   })));
 }

 // Map enriched denial rows to the table format (no MOCK_APPEALS backfill)
 const items = (denialsData.items || []).map((d) => ({
   id:               d.denial_id,
   claim_id:         d.claim_id,
   payer_id:         d.payer_name || d.claim_id,
   amount:           d.denial_amount || 0,
   denial_category:  d.denial_category,
   status:           d.status || 'In Review',
   created_at:       d.denial_date,
   ai_confidence:    d.ai_confidence ?? d.appeal_win_probability ?? 75,
   group_code:       d.group_code || (d.carc_code?.startsWith('PR') ? 'PR' : d.carc_code?.startsWith('OA') ? 'OA' : 'CO'),
   carc:             d.carc_code,
   rarc:             d.rarc_code || '',
   patient_name:     d.patient_name,
   days_remaining:   d.days_remaining,
   recommended_action: d.recommended_action,
 }));
 setAppeals(items);
 } catch (err) {
 console.error("Failed to load denials dashboard:", err);
 setAppeals([]);
 } finally {
 setLoading(false);
 }

 // Load prevention alerts (non-blocking)
 api.prevention.scan(5).catch(() => null).then(data => {
   if (data) setPreventionAlerts(data);
 });

 // Load critical denial pattern findings (non-blocking)
 api.diagnostics.getFindings({ severity: 'critical', category: 'DENIAL_PATTERN' }).catch(() => null).then(data => {
   if (data) setCriticalFindings(data);
 });
 };
 loadDashboardData();
 }, []);

 // Filtered appeals
 const filteredAppeals = useMemo(() => {
 let result = appeals;
 if (payerFilter) result = result.filter(a => a.payer_id === payerFilter);
 if (categoryFilter) result = result.filter(a => a.denial_category === categoryFilter);
 if (statusFilter) result = result.filter(a => a.status === statusFilter);
 // URL-based filters from AR Aging drill-down
 if (urlRootCause) result = result.filter(a => a.root_cause === urlRootCause || a.denial_category === urlRootCause.replace('_MISMATCH','').replace('_LAPSE','').replace('_MISS','').replace('_MISSING',''));
 if (urlStatus) result = result.filter(a => a.status === urlStatus);
 return result;
 }, [appeals, payerFilter, categoryFilter, statusFilter, urlRootCause, urlStatus]);

 const totalPages = Math.max(1, Math.ceil(filteredAppeals.length / PAGE_SIZE));
 const paginatedAppeals = filteredAppeals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

 // Reset page when filters change
 useEffect(() => { setCurrentPage(1); }, [payerFilter, categoryFilter, statusFilter, dateRange, carcFilter, appealStatusFilter]);

 const handleDrillDown = (path) => navigate(path);

 function confidenceColor(val) {
 if (val >= 85) return 'text-th-success';
 if (val >= 70) return 'text-th-warning';
 return 'text-th-danger';
 }
 function confidenceBarColor(val) {
 if (val >= 85) return 'bg-th-success';
 if (val >= 70) return 'bg-th-warning';
 return 'bg-th-danger';
 }

 function categoryBadgeStyle(cat) {
 const map = {
 'Medical Necessity': 'bg-th-danger/10 text-th-danger border-th-danger/20',
 'Authorization': 'bg-th-warning/10 text-th-warning border-th-warning/20',
 'Eligibility': 'bg-th-info/10 text-th-info border-th-info/20',
 'Coding/Bundling': 'bg-primary/10 text-primary border-primary/20',
 'Duplicate': 'bg-th-danger/10 text-th-danger border-th-danger/20',
 'Timely Filing': 'bg-th-warning/10 text-th-warning border-th-warning/20',
 'COB': 'bg-th-info/10 text-th-info border-th-info/20',
 'Missing Info': 'bg-th-info/10 text-th-info border-th-info/20',
 'Non-Covered': 'bg-th-success/10 text-th-success border-th-success/20',
 'Contractual': 'bg-th-surface-overlay text-th-secondary border-th-border',
 };
 return map[cat] || 'bg-th-surface-overlay text-th-heading border-th-border';
 }


 return (
    <div className="flex-1 flex flex-col min-h-0 bg-th-surface-base overflow-hidden">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-th-surface-raised border-b border-th-border shrink-0">
        <div>
          <h1 className="text-[15px] font-semibold text-th-heading tracking-tight">Denial Command + Intelligence</h1>
          <p className="text-[10px] text-th-muted font-mono mt-0.5">
            {summary.total_denials || 47} active · AI urgency-sorted · MiroFish verdicts inline · 5-layer RCA per claim · click any row
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/analytics/prevention')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-th-surface-overlay border border-th-border text-th-secondary hover:text-th-heading hover:border-th-border-strong transition-colors">
            <span className="material-symbols-outlined text-[14px]">shield</span>
            Fix Prevention Gap
          </button>
          <button onClick={() => navigate('/analytics/graph-explorer')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-th-surface-overlay border border-th-border text-th-secondary hover:text-th-heading hover:border-th-border-strong transition-colors">
            <span className="material-symbols-outlined text-[14px]">hub</span>
            Graph Explorer
          </button>
          <button onClick={() => navigate('/intelligence/lida/chat')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-th-surface-overlay border border-th-border text-th-secondary hover:text-th-heading hover:border-th-border-strong transition-colors">
            <span className="material-symbols-outlined text-[14px]">chat</span>
            Ask LIDA
          </button>
          <button onClick={() => navigate('/work/denials/appeals')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold bg-[rgb(var(--color-primary))] text-white border border-[rgb(var(--color-primary))] hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[14px]">description</span>
            Appeal Workbench →
          </button>
        </div>
      </div>

      {/* ── STATS STRIP — 7 inline metrics ── */}
      <div className="flex items-stretch bg-th-surface-raised border-b border-th-border shrink-0">
        {[
          { val: summary.total_denials || 47,  label: 'Total Denials',       sub: '↑ +3 overnight',          valColor: 'text-[rgb(var(--color-danger))]',   subColor: 'text-[rgb(var(--color-danger))]' },
          { val: `$${((summary.denied_revenue_at_risk || 384000)/1000).toFixed(0)}K`, label: 'Revenue at Risk', sub: 'Action needed', valColor: 'text-[rgb(var(--color-warning))]', subColor: 'text-[rgb(var(--color-warning))]' },
          { val: summary.mirofish_confirmed || 18, label: 'MiroFish Confirmed', sub: 'Appeal recommended',     valColor: 'text-[rgb(var(--color-success))]',  subColor: 'text-[rgb(var(--color-success))]' },
          { val: summary.mirofish_disputed  || 9,  label: 'MiroFish Disputed',  sub: 'Coding review needed',   valColor: 'text-[rgb(var(--color-danger))]',   subColor: 'text-[rgb(var(--color-danger))]' },
          { val: `${summary.successful_appeal_rate || 78}%`, label: 'Appeal Win Rate', sub: '↑ +6% AI-assisted', valColor: 'text-[rgb(var(--color-success))]', subColor: 'text-[rgb(var(--color-success))]' },
          { val: summary.appeals_in_flight  || 9,  label: 'Appeals In-Flight',  sub: '$82K recovery',          valColor: 'text-purple-600 dark:text-purple-400', subColor: 'text-th-muted' },
          { val: `${summary.rca_confidence  || 91}%`, label: 'RCA Confidence',   sub: 'Neo4j + ML',             valColor: 'text-[rgb(var(--color-info))]',     subColor: 'text-[rgb(var(--color-success))]' },
        ].map((s, i) => (
          <div key={i} className="flex-1 px-3 py-2 text-center border-r border-th-border last:border-r-0">
            <p className={cn('text-[18px] font-black leading-none tabular-nums', s.valColor)}>{s.val}</p>
            <p className="text-[8px] text-th-muted font-mono uppercase tracking-wider mt-1">{s.label}</p>
            <p className={cn('text-[8px] font-semibold mt-0.5', s.subColor)}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── TAB BAR ── */}
      <div className="flex items-center bg-th-surface-raised border-b border-th-border px-4 shrink-0 overflow-x-auto">
        {[
          { id: 'queue',  label: 'Denial Queue',           count: summary.total_denials || 47 },
          { id: 'appeal', label: 'Appeal Workbench',       count: summary.appeals_in_flight || 9 },
          { id: 'risk',   label: 'High Risk Claims',       count: 31 },
          { id: 'payer',  label: 'Payer Patterns + Heatmap', count: null },
          { id: 'rca',    label: 'RCA Tree',               count: 'Neo4j' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold border-b-2 transition-all whitespace-nowrap shrink-0',
              activeTab === t.id
                ? 'border-[rgb(var(--color-danger))] text-[rgb(var(--color-danger))]'
                : 'border-transparent text-th-muted hover:text-th-secondary'
            )}>
            {t.label}
            {t.count !== null && (
              <span className={cn(
                'font-mono text-[9px] px-1.5 py-0.5 rounded',
                activeTab === t.id
                  ? 'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))]'
                  : 'bg-th-surface-overlay text-th-muted'
              )}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {/* TAB 1: DENIAL QUEUE — 3 column layout */}
        {activeTab === 'queue' && (
          <div className="grid grid-cols-[240px_1fr_300px] h-full overflow-hidden">

            {/* COL 1: FILTERS */}
            <div className="flex flex-col border-r border-th-border overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-th-border bg-th-surface-overlay shrink-0">
                <span className="text-[11px] font-semibold text-th-heading">🎛 Filters</span>
                <button onClick={() => { setMfFilter(''); setUrgFilter(''); setPayerFilter(''); setCarcFilter(''); setCategoryFilter(''); }}
                  className="text-[10px] text-th-muted hover:text-th-heading transition-colors px-2 py-0.5 rounded border border-th-border bg-th-surface-raised">Reset</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-4">

                {/* MiroFish Verdict */}
                <div>
                  <p className="text-[8.5px] font-semibold uppercase tracking-widest text-th-muted font-mono mb-2 pb-1.5 border-b border-th-border">MiroFish Verdict</p>
                  {[
                    { val: 'confirmed', label: '✓ CONFIRMED', count: 18, color: 'success' },
                    { val: 'disputed',  label: '✗ DISPUTED',  count: 9,  color: 'danger'  },
                    { val: 'pending',   label: '⏳ Pending',   count: 20, color: 'warning' },
                  ].map(f => (
                    <button key={f.val} onClick={() => setMfFilter(mfFilter === f.val ? '' : f.val)}
                      className={cn(
                        'w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] mb-1 border-l-2 transition-colors',
                        mfFilter === f.val
                          ? f.color === 'success'
                            ? 'bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border-[rgb(var(--color-success))]'
                            : f.color === 'danger'
                            ? 'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))] border-[rgb(var(--color-danger))]'
                            : 'bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning))]'
                          : 'text-th-secondary border-transparent hover:bg-th-surface-overlay hover:text-th-heading'
                      )}>
                      <span>{f.label}</span>
                      <span className="font-mono text-[9px] text-th-muted">{f.count}</span>
                    </button>
                  ))}
                </div>

                {/* AI Urgency */}
                <div>
                  <p className="text-[8.5px] font-semibold uppercase tracking-widest text-th-muted font-mono mb-2 pb-1.5 border-b border-th-border">AI Urgency</p>
                  {[
                    { val: 'CRIT', label: '🔥 Critical >85', count: 8  },
                    { val: 'HIGH', label: '⚠ High 60–85',    count: 14 },
                    { val: 'MED',  label: '● Medium <60',    count: 25 },
                  ].map(f => (
                    <button key={f.val} onClick={() => setUrgFilter(urgFilter === f.val ? '' : f.val)}
                      className={cn(
                        'w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] mb-1 border-l-2 transition-colors',
                        urgFilter === f.val
                          ? 'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))] border-[rgb(var(--color-danger))]'
                          : 'text-th-secondary border-transparent hover:bg-th-surface-overlay hover:text-th-heading'
                      )}>
                      <span>{f.label}</span>
                      <span className="font-mono text-[9px] text-th-muted">{f.count}</span>
                    </button>
                  ))}
                </div>

                {/* Payer */}
                <div>
                  <p className="text-[8.5px] font-semibold uppercase tracking-widest text-th-muted font-mono mb-2 pb-1.5 border-b border-th-border">Payer</p>
                  {[
                    { val: 'Medicare',     count: 12 },
                    { val: 'BCBS TX',      count: 9  },
                    { val: 'Aetna',        count: 8  },
                    { val: 'UnitedHealth', count: 7  },
                    { val: 'Cigna',        count: 5  },
                    { val: 'Humana',       count: 4  },
                  ].map(f => (
                    <button key={f.val} onClick={() => setPayerFilter(payerFilter === f.val ? '' : f.val)}
                      className={cn(
                        'w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] mb-1 border-l-2 transition-colors',
                        payerFilter === f.val
                          ? 'bg-[rgb(var(--color-primary-bg))] text-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))]'
                          : 'text-th-secondary border-transparent hover:bg-th-surface-overlay hover:text-th-heading'
                      )}>
                      <span>{f.val}</span>
                      <span className="font-mono text-[9px] text-th-muted">{f.count}</span>
                    </button>
                  ))}
                </div>

                {/* CARC Code */}
                <div>
                  <p className="text-[8.5px] font-semibold uppercase tracking-widest text-th-muted font-mono mb-2 pb-1.5 border-b border-th-border">CARC Code</p>
                  {[
                    { val: 'CO-16', label: 'CO-16 Auth',      count: 11 },
                    { val: 'CO-4',  label: 'CO-4 Coding',     count: 9  },
                    { val: 'CO-97', label: 'CO-97 Duplicate', count: 7  },
                    { val: 'PR-50', label: 'PR-50 Med Nec',   count: 6  },
                    { val: 'CO-11', label: 'CO-11 Diagnosis',  count: 5  },
                    { val: 'CO-29', label: 'CO-29 Timely',    count: 4  },
                  ].map(f => (
                    <button key={f.val} onClick={() => setCarcFilter(carcFilter === f.val ? '' : f.val)}
                      className={cn(
                        'w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] mb-1 border-l-2 transition-colors',
                        carcFilter === f.val
                          ? 'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))] border-[rgb(var(--color-danger))]'
                          : 'text-th-secondary border-transparent hover:bg-th-surface-overlay hover:text-th-heading'
                      )}>
                      <span className="font-mono">{f.label}</span>
                      <span className="font-mono text-[9px] text-th-muted">{f.count}</span>
                    </button>
                  ))}
                </div>

                {/* Denial Category */}
                <div>
                  <p className="text-[8.5px] font-semibold uppercase tracking-widest text-th-muted font-mono mb-2 pb-1.5 border-b border-th-border">Denial Category</p>
                  {[
                    { val: 'Administrative', count: 18 },
                    { val: 'Clinical',       count: 14 },
                    { val: 'Coding',         label: 'Billing/Coding', count: 11 },
                    { val: 'Contractual',    count: 4  },
                  ].map(f => (
                    <button key={f.val} onClick={() => setCategoryFilter(categoryFilter === f.val ? '' : f.val)}
                      className={cn(
                        'w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] mb-1 border-l-2 transition-colors',
                        categoryFilter === f.val
                          ? 'bg-[rgb(var(--color-primary-bg))] text-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))]'
                          : 'text-th-secondary border-transparent hover:bg-th-surface-overlay hover:text-th-heading'
                      )}>
                      <span>{f.label || f.val}</span>
                      <span className="font-mono text-[9px] text-th-muted">{f.count}</span>
                    </button>
                  ))}
                </div>

              </div>
            </div>

            {/* COL 2: DENIAL LIST */}
            <div className="flex flex-col border-r border-th-border overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-th-border bg-th-surface-overlay shrink-0">
                <span className="text-[11px] font-semibold text-th-heading">
                  Denials <span className="text-th-muted font-normal text-[9px]">· urgency × revenue</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-th-muted font-mono">{filteredAppeals.length} shown</span>
                  <button className="text-[10px] text-th-muted hover:text-th-heading px-2 py-0.5 rounded border border-th-border bg-th-surface-raised transition-colors">Export</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <p className="p-4 text-[10px] text-th-muted italic">Denial list rows — DW-4</p>
              </div>
            </div>

            {/* COL 3: AI INTELLIGENCE */}
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-th-border bg-th-surface-overlay shrink-0">
                <span className="text-[11px] font-semibold text-th-heading">
                  🧠 AI Intelligence ·{' '}
                  <span className="text-[rgb(var(--color-info))] font-mono">{selectedClaim || 'CLM-8821'}</span>
                </span>
                <button onClick={() => navigate('/work/denials/appeals')}
                  className="text-[10px] text-th-muted hover:text-th-heading px-2 py-0.5 rounded border border-th-border bg-th-surface-raised transition-colors">Full RCA →</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <p className="text-[10px] text-th-muted italic">AI panel — DW-5 + DW-6</p>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: APPEAL WORKBENCH */}
        {activeTab === 'appeal' && (
          <div className="flex-1 flex items-center justify-center h-full text-th-muted text-sm">
            Appeal Workbench — AppealPipelineTracker.jsx
          </div>
        )}

        {/* TAB 3: HIGH RISK */}
        {activeTab === 'risk' && (
          <div className="flex-1 flex items-center justify-center h-full text-th-muted text-sm">
            High Risk Claims — HighRiskClaims.jsx
          </div>
        )}

        {/* TAB 4: PAYER PATTERNS */}
        {activeTab === 'payer' && (
          <div className="flex-1 flex items-center justify-center h-full text-th-muted text-sm">
            Payer Patterns + Heatmap — DW-7
          </div>
        )}

        {/* TAB 5: RCA TREE */}
        {activeTab === 'rca' && (
          <div className="flex-1 flex items-center justify-center h-full text-th-muted text-sm">
            RCA Tree — RootCauseIntelligence.jsx
          </div>
        )}

      </div>
    </div>
 );
}
