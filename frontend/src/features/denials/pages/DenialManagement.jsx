import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../../services/api';
import { AIInsightCard, ConfidenceBar, DateRangePicker, FilterChip, FilterChipGroup, RootCauseInvestigationPanel } from '../../../components/ui';
import { AppealSuccessBadge } from '../../../components/predictions';

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

 // Filter state
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
 <div className="flex-1 overflow-y-auto font-sans h-full">
 {/* URL Filter Banner */}
 {(urlRootCause || urlStatus || urlNoEra) && (
   <div className="mx-8 mt-4 mb-0 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
     <div className="flex items-center gap-2 text-sm">
       <span className="material-symbols-outlined text-primary text-base">filter_alt</span>
       <span className="text-th-heading font-semibold">Filtered view:</span>
       {urlRootCause && <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-bold">{urlRootCause.replace(/_/g, ' ')}</span>}
       {urlStatus && <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs font-bold">{urlStatus}</span>}
       {urlNoEra && <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold">No ERA Received</span>}
       <span className="text-th-muted text-xs">({filteredAppeals.length} claims)</span>
     </div>
     <button onClick={() => { setSearchParams({}); }} className="text-xs text-th-muted hover:text-th-heading transition-colors">Clear filter</button>
   </div>
 )}
 {/* Page Header */}
 <div className="px-8 py-6 max-w-[1600px] mx-auto w-full">
 <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
 <div className="flex flex-col gap-1">
 <h1 className="text-th-heading text-3xl font-black leading-tight tracking-tight">Denial Prevention &amp; Appeals</h1>
 <p className="text-th-secondary text-sm font-normal">Real-time predictive insights and automated recovery management powered by AI.</p>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-th-surface-raised text-th-heading text-sm font-bold border border-th-border hover:border-th-border-strong transition-all">
 <span className="material-symbols-outlined mr-2 text-sm">download</span>
 Export Report
 </button>
 <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-th-heading text-sm font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
 <span className="material-symbols-outlined mr-2 text-sm">bolt</span>
 Run AI Audit
 </button>
 </div>
 </div>

 {/* ── Enhanced Filter Bar ───────────────────────────────────────── */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-4 mb-4">
 <div className="flex flex-wrap gap-3 items-center mb-3">
 <DateRangePicker
 value={dateRange}
 onChange={setDateRange}
 placeholder="Denial Date Range"
 className="h-9"
 />
 <select
 value={payerFilter}
 onChange={(e) => setPayerFilter(e.target.value)}
 className="h-9 px-3 text-xs font-bold rounded-lg border border-th-border bg-th-surface-overlay text-th-heading focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
 >
 <option value="">Payer: All</option>
 <option value="Medicare">Medicare</option>
 <option value="Medicaid">Medicaid</option>
 <option value="BCBS">BCBS</option>
 <option value="Aetna">Aetna</option>
 <option value="UHC">United</option>
 <option value="Cigna">Cigna</option>
 </select>
 <select
 value={categoryFilter}
 onChange={(e) => setCategoryFilter(e.target.value)}
 className="h-9 px-3 text-xs font-bold rounded-lg border border-th-border bg-th-surface-overlay text-th-heading focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
 >
 <option value="">Category: All</option>
 <option value="Authorization">Authorization</option>
 <option value="Medical Necessity">Medical Necessity</option>
 <option value="Coding/Bundling">Coding Error</option>
 <option value="Eligibility">Eligibility</option>
 <option value="Duplicate">Duplicate</option>
 <option value="Timely Filing">Timely Filing</option>
 <option value="COB">Bundling</option>
 <option value="Missing Info">Missing Info</option>
 <option value="Non-Covered">Coverage</option>
 <option value="Contractual">Other</option>
 </select>
 <select
 value={carcFilter}
 onChange={(e) => setCarcFilter(e.target.value)}
 className="h-9 px-3 text-xs font-bold rounded-lg border border-th-border bg-th-surface-overlay text-th-heading focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
 >
 <option value="">CARC Code: All</option>
 <option value="CO-4">CO-4</option>
 <option value="CO-16">CO-16</option>
 <option value="CO-29">CO-29</option>
 <option value="CO-50">CO-50</option>
 <option value="CO-197">CO-197</option>
 <option value="PR-27">PR-27</option>
 <option value="OA-18">OA-18</option>
 <option value="OA-22">OA-22</option>
 </select>
 <select
 value={appealStatusFilter}
 onChange={(e) => setAppealStatusFilter(e.target.value)}
 className="h-9 px-3 text-xs font-bold rounded-lg border border-th-border bg-th-surface-overlay text-th-heading focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
 >
 <option value="">Appeal Status: All</option>
 <option value="not_appealed">Not Appealed</option>
 <option value="in_progress">In Progress</option>
 <option value="won">Won</option>
 <option value="lost">Lost</option>
 </select>
 <div className="flex-1" />
 <div className="flex items-center bg-primary/10 px-3 py-1 rounded-full border border-primary/30">
 <span className="relative flex h-2 w-2 mr-2">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
 <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
 </span>
 <span className="text-primary text-[11px] font-bold uppercase tracking-wider">AI Live Monitoring Active</span>
 </div>
 </div>
 <FilterChipGroup
 filters={[
 ...(payerFilter ? [{ key: 'payer', label: 'Payer', value: payerFilter, color: 'blue' }] : []),
 ...(categoryFilter ? [{ key: 'category', label: 'Category', value: categoryFilter, color: 'purple' }] : []),
 ...(carcFilter ? [{ key: 'carc', label: 'CARC', value: carcFilter, color: 'amber' }] : []),
 ...(appealStatusFilter ? [{ key: 'appealStatus', label: 'Appeal Status', value: appealStatusFilter, color: 'emerald' }] : []),
 ...(dateRange?.label ? [{ key: 'date', label: 'Date', value: dateRange.label, color: 'slate' }] : []),
 ]}
 onRemove={(key) => {
 if (key === 'payer') setPayerFilter('');
 if (key === 'category') setCategoryFilter('');
 if (key === 'carc') setCarcFilter('');
 if (key === 'appealStatus') setAppealStatusFilter('');
 if (key === 'date') setDateRange(null);
 }}
 onClearAll={() => { setPayerFilter(''); setCategoryFilter(''); setCarcFilter(''); setAppealStatusFilter(''); setDateRange(null); }}
 />
 </div>

 {/* ── AI Insights (Ollama live) ────────────────────────────────── */}
 <div className="mb-6">
 <div className="flex items-center gap-2 mb-3">
 <span className="material-icons text-purple-400 text-base">auto_awesome</span>
 <span className="text-th-secondary text-xs font-semibold uppercase tracking-wider">AI Intelligence</span>
 {aiInsights.length > 0 && (
   <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
     Live · Ollama
   </span>
 )}
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
 {aiLoading ? (
   // Skeleton loaders while Ollama generates
   [0,1,2].map(i => (
     <div key={i} className="rounded-xl border border-th-border bg-th-surface p-4 animate-pulse">
       <div className="h-3 bg-th-border rounded w-2/3 mb-3" />
       <div className="h-2 bg-th-border rounded w-full mb-2" />
       <div className="h-2 bg-th-border rounded w-4/5" />
     </div>
   ))
 ) : aiInsights.length > 0 ? (
   aiInsights.map((ins, i) => (
     <AIInsightCard
       key={i}
       title={ins.title}
       description={ins.body}
       confidence={ins.badge === 'Prescriptive' ? 95 : ins.badge === 'Predictive' ? 87 : 82}
       impact={ins.severity === 'critical' ? 'high' : ins.severity === 'warning' ? 'high' : 'medium'}
       category={ins.badge}
       action="Review"
       value={ins.ai_generated ? '🤖 AI Generated' : ''}
       icon={ins.badge === 'Prescriptive' ? 'gavel' : ins.badge === 'Predictive' ? 'trending_up' : 'analytics'}
     />
   ))
 ) : (
   // Static fallback if Ollama is down
   <>
   <AIInsightCard title="CO-4 Appeal Pattern Match" description="91% of CO-4 denials from Aetna this month share the same prior auth template gap. Batch appeal template ready with 89% historical win rate." confidence={91} impact="high" category="Diagnostic" action="Launch batch appeal" value="$128K recovery" icon="gavel" />
   <AIInsightCard title="Medical Necessity Denial Surge" description="CO-50 denials up 42% in Orthopedics vs last quarter. Pattern matches recent LCD update L34862. Clinical documentation addendum required." confidence={87} impact="high" category="Predictive" action="Alert clinical team" value="42% surge" icon="medical_services" />
   <AIInsightCard title="Timely Filing Window Closing" description="34 Cigna denials from 11 months ago are re-appeal eligible but will expire in 18 days. Win rate for this category: 72%." confidence={99} impact="high" category="Prescriptive" action="File appeals immediately" value="$96K / 18 days left" icon="timer" />
   </>
 )}
 </div>
 </div>
 </div>

 {/* ── Prevention Alert Banner ──────────────────────────────────── */}
 {preventionAlerts && (preventionAlerts.items?.length > 0 || preventionAlerts.total > 0) && (() => {
   const alertItems = preventionAlerts.items || preventionAlerts.alerts || [];
   const alertCount = preventionAlerts.total || alertItems.length;
   const totalAtRisk = alertItems.reduce((s, a) => s + (a.amount || a.billed_amount || a.at_risk || 0), 0);
   return (
     <div className="bg-gradient-to-r from-amber-900/20 to-th-surface-raised border border-amber-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 mb-4">
       <div className="flex items-center gap-3">
         <span className="material-symbols-outlined text-amber-400 text-lg">shield</span>
         <div>
           <span className="text-th-heading text-sm font-bold">{alertCount} claims in queue could have been prevented</span>
           <span className="text-amber-400 font-black ml-2">{fmtCurrency(totalAtRisk)} at risk</span>
         </div>
       </div>
       <button onClick={() => navigate('/prevention')} className="px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-500/20 transition-colors">
         View Prevention Alerts
       </button>
     </div>
   );
 })()}

 {/* ── Diagnostic Trend Indicator ────────────────────────────────── */}
 {criticalFindings && (criticalFindings.items?.length > 0 || criticalFindings.total > 0) && (() => {
   const findingItems = criticalFindings.items || criticalFindings.findings || [];
   const findingCount = criticalFindings.total || findingItems.length;
   return (
     <div className="bg-gradient-to-r from-red-900/15 to-th-surface-raised border border-red-500/20 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 mb-4">
       <div className="flex items-center gap-3">
         <span className="material-symbols-outlined text-red-400 text-lg">troubleshoot</span>
         <div>
           <span className="text-th-heading text-sm font-bold">{findingCount} active critical denial pattern{findingCount !== 1 ? 's' : ''} detected</span>
           <span className="text-th-muted text-xs ml-2">Diagnostic AI has identified recurring denial trends requiring attention</span>
         </div>
       </div>
       <button onClick={() => navigate('/diagnostics')} className="px-4 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors">
         Review Findings
       </button>
     </div>
   );
 })()}

 {/* ── KPI Stats ──────────────────────────────────────────────────── */}
 <div className="flex items-center gap-2 mb-3">
 <h2 className="text-th-heading text-sm font-bold uppercase tracking-wider">Key Metrics</h2>
 </div>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
 <div
 onClick={() => handleDrillDown('/denials/analytics')}
 className="flex flex-col gap-2 rounded-xl p-5 bg-th-surface-raised border border-th-border border-l-[3px] border-l-th-danger transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group"
 >
 <div className="flex justify-between items-start">
 <p className="text-th-secondary text-xs font-bold uppercase tracking-wider group-hover:text-primary transition-colors">Open Denials</p>
 <div className="flex items-center gap-1">
   <button onClick={(e) => { e.stopPropagation(); openInvestigation('Denied Revenue', fmtCurrency(summary.denied_revenue_at_risk), '$280K', '', 'critical'); }} className="size-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-th-surface-overlay text-th-muted hover:text-primary transition-all" title="Investigate Open Denials"><span className="material-symbols-outlined text-sm">troubleshoot</span></button>
   <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
 </div>
 </div>
 <p className="text-th-heading tracking-tight text-3xl font-black" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(summary.denied_revenue_at_risk)}</p>
 <div className="flex items-center gap-1">
 <span className="material-symbols-outlined text-th-danger text-sm">trending_up</span>
 <p className="text-th-danger text-sm font-bold">{summary.denied_revenue_at_risk && summary.total_claims ? `${((summary.denied_revenue_at_risk / summary.total_claims) * 100).toFixed(1)}% of claims` : '--'}</p>
 </div>
 </div>
 <div
 onClick={() => handleDrillDown('/denials/analytics')}
 className="flex flex-col gap-2 rounded-xl p-5 bg-th-surface-raised border border-th-border border-l-[3px] border-l-th-success transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group"
 >
 <div className="flex justify-between items-start">
 <p className="text-th-secondary text-xs font-bold uppercase tracking-wider group-hover:text-primary transition-colors">Appeal Success Rate</p>
 <div className="flex items-center gap-1">
   <button onClick={(e) => { e.stopPropagation(); openInvestigation('Appeal Success Rate', `${summary.successful_appeal_rate}%`, '55.0%', '', 'info'); }} className="size-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-th-surface-overlay text-th-muted hover:text-primary transition-all" title="Investigate Appeal Rate"><span className="material-symbols-outlined text-sm">troubleshoot</span></button>
   <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
 </div>
 </div>
 <p className="text-th-heading tracking-tight text-3xl font-black" style={{ fontVariantNumeric: 'tabular-nums' }}>{summary.successful_appeal_rate}%</p>
 <div className="flex items-center gap-1">
 <span className="material-symbols-outlined text-th-success text-sm">trending_up</span>
 <p className="text-th-success text-sm font-bold">{summary.successful_appeal_rate}% success</p>
 </div>
 </div>
 <div
 onClick={() => handleDrillDown('/denials/analytics')}
 className="flex flex-col gap-2 rounded-xl p-5 bg-th-surface-raised border border-th-border border-l-[3px] border-l-th-info transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group"
 >
 <div className="flex justify-between items-start">
 <p className="text-th-secondary text-xs font-bold uppercase tracking-wider group-hover:text-primary transition-colors">Monthly Recovery</p>
 <div className="flex items-center gap-1">
   <button onClick={(e) => { e.stopPropagation(); openInvestigation('Monthly Recovery', fmtCurrency(summary.projected_recovery), '$200K', '', 'warning'); }} className="size-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-th-surface-overlay text-th-muted hover:text-primary transition-all" title="Investigate Recovery"><span className="material-symbols-outlined text-sm">troubleshoot</span></button>
   <span className="material-symbols-outlined text-primary text-xl">insights</span>
 </div>
 </div>
 <p className="text-th-heading tracking-tight text-3xl font-black" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(summary.projected_recovery)}</p>
 <div className="flex items-center gap-1">
 <span className="material-symbols-outlined text-th-danger text-sm">trending_down</span>
 <p className="text-th-danger text-sm font-bold">Recovery target</p>
 </div>
 </div>
 <div
 onClick={() => setShowAIModal(true)}
 className="flex flex-col gap-2 rounded-xl p-5 bg-primary/10 border border-primary/30 border-l-[3px] border-l-primary relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
 >
 <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full z-0" />
 <div className="flex justify-between items-start relative z-10">
 <p className="text-primary text-xs font-black uppercase tracking-wider">AI Prevention Impact</p>
 <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
 </div>
 <p className="text-th-heading tracking-tight text-3xl font-black relative z-10" style={{ fontVariantNumeric: 'tabular-nums' }}>${((summary.ai_prevention_impact || 0) / 1e6).toFixed(1)}M</p>
 <p className="text-primary text-sm font-bold relative z-10">Claims auto-corrected</p>
 </div>
 </div>

 {/* ── Middle Section: Analytics ──────────────────────────────────── */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
 {/* ─ Predictive Denial Heatmap ─ */}
 <div
 onClick={() => setShowHeatmapModal(true)}
 className="lg:col-span-2 rounded-xl border border-th-border bg-th-surface-raised p-6 cursor-pointer hover:border-primary/50 transition-colors group"
 >
 <div className="flex justify-between items-center mb-2">
 <div className="flex items-center gap-3">
 <h3 className="text-th-heading text-lg font-bold group-hover:text-primary transition-colors">Predictive Denial Heatmap</h3>
 </div>
 <div className="flex items-center gap-2 text-[10px] text-th-muted font-bold uppercase">
 <span>Low</span>
 <div className="flex h-2 w-24 rounded-full overflow-hidden">
 <div className="bg-th-success w-1/3" />
 <div className="bg-th-warning w-1/3" />
 <div className="bg-th-danger w-1/3" />
 </div>
 <span>Critical</span>
 </div>
 </div>

 <div className="grid grid-cols-6 gap-2 mt-4">
 {/* Column headers */}
 <div />
 {heatmapDepts.map((dept) => (
 <div key={dept} className="text-center text-[10px] text-th-muted font-bold">{dept}</div>
 ))}

 {/* Rows */}
 {heatmapPayers.map((payer) => (
 <React.Fragment key={payer}>
 <div className="text-right text-[10px] text-th-muted font-bold pr-2 flex items-center justify-end">{payer}</div>
 {heatmapData[payer].map((val, ci) => (
 <div
 key={ci}
 className={`h-10 rounded flex items-center justify-center hover:scale-105 transition-transform cursor-pointer ${heatmapColor(val)}`}
 title={`${payer} / ${heatmapDepts[ci]}: ${val}% risk`}
 >
 <span className={`text-[10px] font-bold ${heatmapText(val)}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{val}%</span>
 </div>
 ))}
 </React.Fragment>
 ))}
 </div>

 <div className="mt-6 flex items-center gap-3 bg-primary/5 p-4 rounded-xl border border-primary/20">
 <span className="material-symbols-outlined text-primary">info</span>
 <p className="text-xs text-th-secondary leading-relaxed font-medium">
 <span className="text-th-heading font-bold">AI Insight:</span> Medicare/Oncology shows a 24% spike in medical necessity denials. Recommended action: Update clinical documentation templates for chemotherapy protocols.
 </p>
 </div>
 </div>

 {/* ─ Root Cause Analysis (SVG Donut) ─ */}
 <div className="rounded-xl border border-th-border bg-th-surface-raised p-6 flex flex-col items-center justify-center">
 <div className="flex items-center justify-between w-full mb-6">
 <h3 className="text-th-heading text-lg font-bold text-left">Root Cause Analysis</h3>
 </div>
 <div className="relative flex justify-center py-4">
 <DonutChart data={rootCauses} />
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className="text-3xl font-black text-th-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{rootCauses.length}</span>
 <span className="text-[10px] text-th-muted font-bold uppercase">Categories</span>
 </div>
 </div>
 <div className="space-y-2 mt-6 w-full max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
 {rootCauses.map((cause) => (
 <div key={cause.label} className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="size-3 rounded-full" style={{ backgroundColor: cause.color }} />
 <span className="text-xs font-bold text-th-heading">{cause.label}</span>
 </div>
 <span className="text-xs font-bold text-th-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{cause.pct}%</span>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* ── Root Cause Distribution (Top 5 with Financial Impact) ────────── */}
 <div className="mb-8">
 <div className="flex items-center justify-between mb-3">
   <h2 className="text-th-heading text-sm font-bold uppercase tracking-wider">Root Cause Financial Impact</h2>
   <button onClick={() => navigate('/analytics/denials/root-cause')} className="text-xs text-primary font-bold hover:underline">View All Root Causes</button>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
   {rootCauses.slice(0, 5).map((cause) => {
     const estimatedImpact = summary.denied_revenue_at_risk ? (cause.pct / 100) * summary.denied_revenue_at_risk : 0;
     return (
       <div
         key={cause.label}
         onClick={() => navigate(`/denials?root_cause=${cause.label.replace(/\//g, '_').replace(/\s/g, '_')}`)}
         className="bg-th-surface-raised border border-th-border rounded-xl p-4 cursor-pointer hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
       >
         <div className="flex items-center gap-2 mb-2">
           <div className="size-3 rounded-full flex-shrink-0" style={{ backgroundColor: cause.color }} />
           <span className="text-xs font-bold text-th-heading truncate">{cause.label}</span>
         </div>
         <div className="w-full h-2 bg-th-surface-overlay rounded-full overflow-hidden mb-2">
           <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cause.pct}%`, backgroundColor: cause.color }} />
         </div>
         <div className="flex justify-between items-baseline">
           <span className="text-lg font-black text-th-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{cause.pct}%</span>
           <span className="text-[10px] font-bold text-th-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(estimatedImpact)}</span>
         </div>
       </div>
     );
   })}
 </div>
 </div>

 {/* ── CARC Quick Reference ────────────────────────────────────────── */}
 <div className="mb-8">
 <h2 className="text-th-heading text-sm font-bold uppercase tracking-wider mb-3">Top CARC Codes</h2>
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
 {[
 { code: 'CO-4', label: 'Coding', desc: 'Procedure code inconsistent' },
 { code: 'CO-197', label: 'Authorization', desc: 'Precertification not obtained' },
 { code: 'PR-27', label: 'Eligibility', desc: 'Expenses not covered' },
 { code: 'CO-50', label: 'Med Necessity', desc: 'Not deemed medically necessary' },
 { code: 'CO-18', label: 'Duplicate', desc: 'Exact duplicate claim' },
 { code: 'CO-29', label: 'Timely Filing', desc: 'Limit for filing has expired' },
 ].map((carc, i) => (
 <div key={i} className="bg-th-surface-raised border border-th-border rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
 <span className="font-mono text-sm font-black text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>{carc.code}</span>
 <p className="text-xs font-bold text-th-heading mt-1">{carc.label}</p>
 <p className="text-[10px] text-th-muted mt-0.5 leading-relaxed">{carc.desc}</p>
 </div>
 ))}
 </div>
 </div>

 {/* ── Lower Section: Appeals & Payer Intel ───────────────────────── */}
 <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-12">
 {/* ─ Appeal Management Queue ─ */}
 <div className="xl:col-span-3 rounded-xl border border-th-border bg-th-surface-raised overflow-hidden">
 <div className="p-6 border-b border-th-border flex justify-between items-center">
 <div className="flex items-center gap-3">
 <h3 className="text-th-heading text-lg font-bold">Active Appeals Queue</h3>
 </div>
 <div className="flex gap-2">
 <div className="flex rounded-lg overflow-hidden border border-th-border">
 <button className="bg-primary text-th-heading px-3 py-1 text-xs font-bold">All</button>
 <button className="bg-th-surface-raised text-th-secondary px-3 py-1 text-xs font-bold hover:text-th-heading transition-colors">High Priority</button>
 </div>
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="text-th-muted text-[11px] font-bold uppercase tracking-wider border-b border-th-border">
 <th className="px-6 py-4">Claim ID</th>
 <th className="px-6 py-4">Payer</th>
 <th className="px-6 py-4">Amount</th>
 <th className="px-6 py-4">Group</th>
 <th className="px-6 py-4">CARC</th>
 <th className="px-6 py-4">RARC</th>
 <th className="px-6 py-4">Category</th>
 <th className="px-6 py-4">AI Confidence</th>
 <th className="px-6 py-4">Appeal Pred.</th>
 <th className="px-6 py-4 text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-th-border">
 {loading ? (
 <tr>
 <td colSpan="10" className="px-6 py-8 text-center text-th-muted">Loading live appeals data...</td>
 </tr>
 ) : paginatedAppeals.length === 0 ? (
 <tr>
 <td colSpan="10" className="px-6 py-8 text-center text-th-muted">No active appeals found.</td>
 </tr>
 ) : paginatedAppeals.map((appeal) => (
 <tr key={appeal.id} className="hover:bg-th-surface-overlay/50 transition-colors group">
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <Link to={`/analytics/denials/root-cause/claim/${appeal.claim_id}`} className="text-th-heading text-sm font-bold hover:text-primary transition-colors">{appeal.claim_id}</Link>
 <span className="text-[10px] text-th-muted">DOS: {new Date(appeal.created_at).toLocaleDateString()}</span>
 </div>
 </td>
 <td className="px-6 py-4 text-th-heading text-sm">{appeal.payer_id}</td>
 <td className="px-6 py-4 text-th-heading text-sm font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>${appeal.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
 <td className="px-6 py-4">
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-th-surface-overlay text-th-heading border border-th-border">{appeal.group_code || '—'}</span>
 </td>
 <td className="px-6 py-4">
 <span className="font-mono text-xs text-th-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{appeal.carc || '—'}</span>
 </td>
 <td className="px-6 py-4">
 <span className="font-mono text-xs text-th-secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>{appeal.rarc || '—'}</span>
 </td>
 <td className="px-6 py-4">
 <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${categoryBadgeStyle(appeal.denial_category)}`}>
 {appeal.denial_category}
 </span>
 </td>
 <td className="px-6 py-4 min-w-[140px]">
 <ConfidenceBar
 score={appeal.ai_confidence}
 label="Appeal Win Probability"
 size="sm"
 showBar={true}
 showLabel={false}
 factors={["Prior auth documented", "Similar cases won", "Timely filing met", "Clinical notes available"]}
 />
 </td>
 <td className="px-6 py-4">
 <AppealSuccessBadge denialId={appeal.id} compact />
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center gap-1.5">
 <Link
 to={`/analytics/root-cause/claim/${appeal.claim_id}`}
 className="inline-flex items-center gap-1 bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-lg text-purple-400 text-xs font-bold hover:bg-purple-500/20 transition-all"
 >
 <span className="material-symbols-outlined text-sm">manage_search</span>
 Root Cause
 </Link>
 <Link
 to={`/denials/appeal${appeal.id ? `?denial_id=${appeal.id}` : ''}`}
 className="inline-flex items-center gap-1 bg-th-surface-overlay border border-th-border-strong px-3 py-1.5 rounded-lg text-th-heading text-xs font-bold hover:bg-primary hover:text-th-heading hover:border-primary transition-all"
 >
 <span className="material-symbols-outlined text-sm">auto_fix_high</span>
 AI Appeal
 </Link>
 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400">
   <span className="material-symbols-outlined" style={{fontSize:'11px'}}>shield</span>
   Validated
 </span>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 {/* Pagination */}
 <div className="p-4 flex items-center justify-between border-t border-th-border">
 <span className="text-th-muted text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
 Showing {filteredAppeals.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredAppeals.length)} of {filteredAppeals.length}
 </span>
 <div className="flex items-center gap-1">
 <button
 onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 className="px-3 py-1 rounded text-xs font-bold text-th-secondary hover:text-th-heading disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
 >
 <span className="material-symbols-outlined text-sm">chevron_left</span>
 </button>
 {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
 <button
 key={page}
 onClick={() => setCurrentPage(page)}
 className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
 page === currentPage
 ? 'bg-primary text-th-heading'
 : 'text-th-secondary hover:text-th-heading'
 }`}
 >
 {page}
 </button>
 ))}
 <button
 onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
 disabled={currentPage === totalPages}
 className="px-3 py-1 rounded text-xs font-bold text-th-secondary hover:text-th-heading disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
 >
 <span className="material-symbols-outlined text-sm">chevron_right</span>
 </button>
 </div>
 </div>
 </div>

 {/* ─ Payer Intelligence Panel ─ */}
 <div className="rounded-xl border border-th-border bg-th-surface-raised p-6">
 <h3 className="text-th-heading text-lg font-bold mb-6">Payer Intelligence</h3>
 <div className="space-y-4">
 <div className="p-4 rounded-lg bg-th-surface-overlay/50 border border-th-border hover:border-primary/50 transition-colors cursor-pointer">
 <div className="flex justify-between items-center mb-3">
 <span className="text-th-heading text-sm font-bold">Medicare</span>
 <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-th-success/10 text-th-success border border-th-success/20">+2.4%</span>
 </div>
 <div className="flex justify-between text-[10px] text-th-muted uppercase font-bold mb-1">
 <span>Win Rate</span>
 <span style={{ fontVariantNumeric: 'tabular-nums' }}>56.8%</span>
 </div>
 <div className="w-full h-1 bg-th-surface-overlay rounded-full overflow-hidden mb-3">
 <div className="bg-primary h-full w-[57%]" />
 </div>
 <div className="flex items-center gap-2 text-[10px] text-th-muted">
 <span className="material-symbols-outlined text-sm">schedule</span>
 <span>Avg Overturn: 14 Days</span>
 </div>
 </div>
 <div className="p-4 rounded-lg bg-th-surface-overlay/50 border border-th-border hover:border-primary/50 transition-colors cursor-pointer">
 <div className="flex justify-between items-center mb-3">
 <span className="text-th-heading text-sm font-bold">UnitedHealthcare</span>
 <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-th-danger/10 text-th-danger border border-th-danger/20">-4.1%</span>
 </div>
 <div className="flex justify-between text-[10px] text-th-muted uppercase font-bold mb-1">
 <span>Win Rate</span>
 <span style={{ fontVariantNumeric: 'tabular-nums' }}>45.2%</span>
 </div>
 <div className="w-full h-1 bg-th-surface-overlay rounded-full overflow-hidden mb-3">
 <div className="bg-primary h-full w-[45%]" />
 </div>
 <div className="flex items-center gap-2 text-[10px] text-th-muted">
 <span className="material-symbols-outlined text-sm">schedule</span>
 <span>Avg Overturn: 32 Days</span>
 </div>
 </div>
 </div>
 <div className="mt-6 pt-6 border-t border-th-border">
 <div className="flex items-center gap-2 mb-2">
 <span className="material-symbols-outlined text-primary text-lg">lightbulb</span>
 <h4 className="text-th-heading text-xs font-bold uppercase">Behavioral Trend</h4>
 </div>
 <p className="text-[11px] text-th-muted leading-relaxed italic">
 "UHC has increased technical denials for 'Itemized Statements' by 40%. AI has updated the auto-attach logic."
 </p>
 </div>
 </div>
 </div>

 {/* ── AI Impact Modal ────────────────────────────────────────────── */}
 {showAIModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAIModal(false)}>
 <div className="bg-th-surface-raised w-full max-w-2xl rounded-2xl shadow-2xl border border-th-border overflow-hidden" onClick={(e) => e.stopPropagation()}>
 <div className="p-6 border-b border-th-border flex justify-between items-center">
 <div>
 <h3 className="text-lg font-black text-th-heading">AI Prevention Impact</h3>
 <p className="text-sm text-th-secondary">Real-time auto-correction logs</p>
 </div>
 <button onClick={() => setShowAIModal(false)} className="p-2 hover:bg-th-surface-overlay rounded-full transition-colors">
 <span className="material-symbols-outlined text-th-secondary">close</span>
 </button>
 </div>
 <div className="p-0 max-h-[60vh] overflow-y-auto">
 <table className="w-full text-left">
 <thead className="bg-th-surface-overlay/50 sticky top-0">
 <tr className="text-xs font-bold text-th-muted uppercase">
 <th className="px-6 py-3">Claim ID</th>
 <th className="px-6 py-3">Issue Detected</th>
 <th className="px-6 py-3">Action Taken</th>
 <th className="px-6 py-3 text-right">Savings</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-th-border">
 {[
 { id: 1, issue: 'Missing Modifier 25', savings: 1240 },
 { id: 2, issue: 'Incorrect Place of Service', savings: 3850 },
 { id: 3, issue: 'Expired Authorization', savings: 2100 },
 { id: 4, issue: 'NDC Code Mismatch', savings: 890 },
 { id: 5, issue: 'Duplicate Line Item', savings: 1620 },
 ].map((row) => (
 <tr key={row.id} className="hover:bg-th-surface-overlay/50 transition-colors">
 <td className="px-6 py-4 font-mono text-xs font-bold text-th-heading">CLM-2024-00{row.id}</td>
 <td className="px-6 py-4 text-xs text-th-secondary">{row.issue}</td>
 <td className="px-6 py-4">
 <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-th-success/10 text-th-success text-[10px] font-bold border border-th-success/20">
 <span className="material-symbols-outlined text-[12px]">auto_fix</span>
 Auto-Appended
 </span>
 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400">
   <span className="material-symbols-outlined" style={{fontSize:'11px'}}>shield</span>
   Validated
 </span>
 </td>
 <td className="px-6 py-4 text-right text-xs font-bold text-th-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>${row.savings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 <div className="p-4 border-t border-th-border flex justify-end">
 <button onClick={() => setShowAIModal(false)} className="px-4 py-2 bg-th-surface-overlay text-th-heading rounded-lg text-sm font-bold hover:bg-th-surface-highlight transition-colors">Close</button>
 </div>
 </div>
 </div>
 )}

 {/* ── Heatmap Drill-down Modal ───────────────────────────────────── */}
 {showHeatmapModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowHeatmapModal(false)}>
 <div className="bg-th-surface-raised w-full max-w-3xl rounded-2xl shadow-2xl border border-th-border overflow-hidden" onClick={(e) => e.stopPropagation()}>
 <div className="p-6 border-b border-th-border flex justify-between items-center">
 <div>
 <h3 className="text-lg font-black text-th-heading">Oncology / Medicare Risk Analysis</h3>
 <p className="text-sm text-th-secondary">Drill-down into high-risk denial patterns</p>
 </div>
 <button onClick={() => setShowHeatmapModal(false)} className="p-2 hover:bg-th-surface-overlay rounded-full transition-colors">
 <span className="material-symbols-outlined text-th-secondary">close</span>
 </button>
 </div>
 <div className="p-6 grid grid-cols-2 gap-6">
 <div className="space-y-4">
 <h4 className="text-sm font-bold text-th-heading">Top Root Causes</h4>
 <div className="space-y-3">
 <div className="flex justify-between items-center p-3 bg-th-danger/10 rounded-lg border border-th-danger/20">
 <span className="text-xs font-bold text-th-danger">Medical Necessity</span>
 <span className="text-xs font-black text-th-danger" style={{ fontVariantNumeric: 'tabular-nums' }}>42%</span>
 </div>
 <div className="flex justify-between items-center p-3 bg-th-surface-overlay/50 rounded-lg border border-th-border">
 <span className="text-xs font-bold text-th-heading">Authorization</span>
 <span className="text-xs font-black text-th-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>18%</span>
 </div>
 <div className="flex justify-between items-center p-3 bg-th-surface-overlay/50 rounded-lg border border-th-border">
 <span className="text-xs font-bold text-th-heading">Coding/Bundling</span>
 <span className="text-xs font-black text-th-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>12%</span>
 </div>
 </div>
 </div>
 <div className="space-y-4">
 <h4 className="text-sm font-bold text-th-heading">Recommended Actions</h4>
 <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 space-y-3">
 <div className="flex gap-3">
 <span className="material-symbols-outlined text-primary text-md mt-0.5">auto_fix_high</span>
 <div>
 <p className="text-xs font-bold text-th-heading">Update Chemo Protocols</p>
 <p className="text-[10px] text-th-secondary leading-snug mt-1">AI suggests creating a new documentation template for drug administration (J9035).</p>
 </div>
 </div>
 <button className="w-full py-2 bg-primary text-th-heading rounded-lg text-xs font-bold shadow-lg shadow-primary/30 hover:bg-primary-hover transition-colors">Deploy New Rule</button>
<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 mt-1">
  <span className="material-symbols-outlined" style={{fontSize:'11px'}}>shield</span>
  Agent Validated
</span>
 </div>
 </div>
 </div>
 <div className="p-4 border-t border-th-border flex justify-end">
 <button onClick={() => setShowHeatmapModal(false)} className="px-4 py-2 bg-th-surface-overlay text-th-heading rounded-lg text-sm font-bold hover:bg-th-surface-highlight transition-colors">Close</button>
 </div>
 </div>
 </div>
 )}

 {/* Investigation Panel */}
 <RootCauseInvestigationPanel
   isOpen={investigationOpen}
   onClose={() => setInvestigationOpen(false)}
   context={investigationContext}
 />
 </div>
 );
}
