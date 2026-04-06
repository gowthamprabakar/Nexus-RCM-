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

// Per-claim AI intelligence data — matches wireframe cfNodes + rcCallout per claim
const CLAIM_DETAIL = {
  'CLM-8821': {
    dos:'2024-01-15', denied:'2024-01-22', daysOut:72, daysLeft:102,
    rcCallout:'Root cause: Prior auth PA-2024-8821 exists and is valid but was not electronically attached at submission. Highly recoverable — administrative error, not clinical.',
    rcSentiment:'warn',
    cfNodes:[
      {type:'ok',   icon:'👤', name:'Patient Access', status:'✓ Elig OK'},
      {type:'warn', icon:'🔑', name:'Prior Auth',     status:'⚠ Skipped!'},
      {type:'ok',   icon:'🔍', name:'CRS Scrub',      status:'✓ Score: 78'},
      {type:'ok',   icon:'📤', name:'Submitted',      status:'✓ Cleared'},
      {type:'fail', icon:'❌', name:'DENIED',          status:'CO-16'},
      {type:'act',  icon:'🌊', name:'MiroFish',       status:'✓ CONF 87%'},
      {type:'ok',   icon:'📄', name:'AI Appeal',      status:'87% win'},
    ],
  },
  'CLM-9041': {
    dos:'2024-01-20', denied:'2024-01-28', daysOut:65, daysLeft:107,
    rcCallout:'Root cause: CPT 99215 does not match diagnosis M54.5 under BCBS TX coding policy. This is a genuine coding error — correct before submitting.',
    rcSentiment:'danger',
    cfNodes:[
      {type:'ok',   icon:'👤', name:'Patient Access', status:'✓ Elig OK'},
      {type:'ok',   icon:'🔑', name:'Prior Auth',     status:'✓ Not needed'},
      {type:'fail', icon:'🔍', name:'CRS Scrub',      status:'⚠ Score: 54'},
      {type:'ok',   icon:'📤', name:'Submitted',      status:'✓ Cleared'},
      {type:'fail', icon:'❌', name:'DENIED',          status:'CO-4'},
      {type:'act',  icon:'🌊', name:'MiroFish',       status:'✗ DISP 61%'},
      {type:'neutral',icon:'📝',name:'Code Review',  status:'Needed'},
    ],
  },
  'CLM-7788': {
    dos:'2024-02-01', denied:'2024-02-09', daysOut:58, daysLeft:119,
    rcCallout:'Root cause: Billing system migration Jan 2024 triggered duplicate submission pathway. System error — original claim was paid. Recoverable via appeal.',
    rcSentiment:'warn',
    cfNodes:[
      {type:'ok',   icon:'👤', name:'Patient Access', status:'✓ Elig OK'},
      {type:'ok',   icon:'🔑', name:'Prior Auth',     status:'✓ Not needed'},
      {type:'ok',   icon:'🔍', name:'CRS Scrub',      status:'✓ Score: 74'},
      {type:'warn', icon:'📤', name:'Submitted',      status:'⚠ 2x sent!'},
      {type:'fail', icon:'❌', name:'DENIED',          status:'CO-97 Dup'},
      {type:'act',  icon:'🌊', name:'MiroFish',       status:'✓ CONF 74%'},
      {type:'ok',   icon:'📄', name:'AI Appeal',      status:'74% win'},
    ],
  },
  'CLM-7204': {
    dos:'2024-02-10', denied:'2024-02-20', daysOut:50, daysLeft:128,
    rcCallout:'Root cause: Modifier -GP missing from CPT 97110 under UHC policy. Coding fix + documentation may resolve. Await MiroFish for final recommendation.',
    rcSentiment:'warn',
    cfNodes:[
      {type:'ok',     icon:'👤', name:'Patient Access', status:'✓ Elig OK'},
      {type:'ok',     icon:'🔑', name:'Prior Auth',     status:'✓ On file'},
      {type:'warn',   icon:'🔍', name:'CRS Scrub',      status:'⚠ Score: 71'},
      {type:'ok',     icon:'📤', name:'Submitted',      status:'✓ Cleared'},
      {type:'fail',   icon:'❌', name:'DENIED',          status:'PR-50'},
      {type:'neutral',icon:'⏳', name:'MiroFish',       status:'Running...'},
      {type:'neutral',icon:'📝', name:'Pending',        status:'Await result'},
    ],
  },
  'CLM-6632': {
    dos:'2024-02-15', denied:'2024-02-23', daysOut:44, daysLeft:133,
    rcCallout:'Root cause: Prior auth PA-2024-0112 expired 5 days before DOS. Renewal was requested but not confirmed. Retroactive auth appeal — 81% success rate under Cigna policy.',
    rcSentiment:'warn',
    cfNodes:[
      {type:'ok',   icon:'👤', name:'Patient Access', status:'✓ Elig OK'},
      {type:'warn', icon:'🔑', name:'Prior Auth',     status:'⚠ Expired!'},
      {type:'ok',   icon:'🔍', name:'CRS Scrub',      status:'✓ Score: 74'},
      {type:'ok',   icon:'📤', name:'Submitted',      status:'✓ Cleared'},
      {type:'fail', icon:'❌', name:'DENIED',          status:'CO-16'},
      {type:'act',  icon:'🌊', name:'MiroFish',       status:'✓ CONF 81%'},
      {type:'ok',   icon:'📄', name:'AI Appeal',      status:'81% win'},
    ],
  },
  'CLM-5510': {
    dos:'2024-01-25', denied:'2024-02-01', daysOut:68, daysLeft:112,
    rcCallout:'Root cause: CPT 99215 requires 5-component exam — only 3 documented. Same provider pattern as CLM-9041. Downcode to 99214 and resubmit rather than appeal.',
    rcSentiment:'danger',
    cfNodes:[
      {type:'ok',  icon:'👤', name:'Patient Access', status:'✓ Elig OK'},
      {type:'ok',  icon:'🔑', name:'Prior Auth',     status:'✓ Not needed'},
      {type:'warn',icon:'🔍', name:'CRS Scrub',      status:'⚠ Score: 62'},
      {type:'ok',  icon:'📤', name:'Submitted',      status:'✓ Cleared'},
      {type:'fail',icon:'❌', name:'DENIED',          status:'CO-4'},
      {type:'act', icon:'🌊', name:'MiroFish',       status:'✗ DISP 68%'},
      {type:'neutral',icon:'📝',name:'Recode',       status:'99214 rec.'},
    ],
  },
  'CLM-4821': {
    dos:'2024-02-05', denied:'2024-02-14', daysOut:55, daysLeft:123,
    rcCallout:'Root cause: Modifier-25 missing from same-day E&M under BCBS TX policy. Correctable via appeal with modifier added — 71% success rate.',
    rcSentiment:'warn',
    cfNodes:[
      {type:'ok',  icon:'👤', name:'Patient Access', status:'✓ Elig OK'},
      {type:'ok',  icon:'🔑', name:'Prior Auth',     status:'✓ Not needed'},
      {type:'warn',icon:'🔍', name:'CRS Scrub',      status:'⚠ Score: 66'},
      {type:'ok',  icon:'📤', name:'Submitted',      status:'✓ Cleared'},
      {type:'fail',icon:'❌', name:'DENIED',          status:'CO-4'},
      {type:'act', icon:'🌊', name:'MiroFish',       status:'✓ CONF 71%'},
      {type:'ok',  icon:'📄', name:'Appeal',         status:'71% win'},
    ],
  },
  'CLM-3301': {
    dos:'2023-11-01', denied:'2024-02-15', daysOut:124, daysLeft:27,
    rcCallout:'Root cause: Timely filing exceeded by 17 days with no documented extension reason. Only 22% appeal success. Decide now — 27 days remaining.',
    rcSentiment:'danger',
    cfNodes:[
      {type:'ok',   icon:'👤', name:'Patient Access', status:'✓ Elig OK'},
      {type:'ok',   icon:'🔑', name:'Prior Auth',     status:'✓ On file'},
      {type:'ok',   icon:'🔍', name:'CRS Scrub',      status:'✓ Score: 74'},
      {type:'fail', icon:'📤', name:'Filed Late',     status:'107 days!'},
      {type:'fail', icon:'❌', name:'DENIED',          status:'CO-29'},
      {type:'act',  icon:'🌊', name:'MiroFish',       status:'✗ DISP 61%'},
      {type:'neutral',icon:'⚠️',name:'27d Left',     status:'Decide now'},
    ],
  },
  'CLM-2910': {
    dos:'2024-02-18', denied:'2024-02-28', daysOut:35, daysLeft:136,
    rcCallout:'Root cause: CPT 99213 does not pair with Z12.11 screening diagnosis. Resubmit with G0202 — 79% success. Quick win.',
    rcSentiment:'warn',
    cfNodes:[
      {type:'ok',  icon:'👤', name:'Patient Access', status:'✓ Elig OK'},
      {type:'ok',  icon:'🔑', name:'Prior Auth',     status:'✓ Not needed'},
      {type:'ok',  icon:'🔍', name:'CRS Scrub',      status:'✓ Score: 72'},
      {type:'ok',  icon:'📤', name:'Submitted',      status:'✓ Cleared'},
      {type:'fail',icon:'❌', name:'DENIED',          status:'CO-11'},
      {type:'act', icon:'🌊', name:'MiroFish',       status:'✓ CONF 79%'},
      {type:'ok',  icon:'📄', name:'Recode',         status:'G0202 rec.'},
    ],
  },
};

// Wireframe fallback data — shown when backend is offline
const FALLBACK_CLAIMS = [
  { id:'CLM-9041', claim_id:'CLM-9041', payer_id:'BCBS TX',      payer:'BCBS TX',      amount:12400, carc:'CO-4',  mf:'disputed',  mf_verdict:'disputed',  urg:'CRIT', urg_level:'CRIT', urgScore:96, denial_category:'Coding',         cat:'Coding',         appealSuccess:34, appealDrafted:false, patient_name:'Michael Chen',    days_remaining:107 },
  { id:'CLM-8821', claim_id:'CLM-8821', payer_id:'Medicare',     payer:'Medicare',     amount:4200,  carc:'CO-16', mf:'confirmed', mf_verdict:'confirmed', urg:'HIGH', urg_level:'HIGH', urgScore:84, denial_category:'Administrative', cat:'Administrative', appealSuccess:87, appealDrafted:true,  patient_name:'Sarah Johnson',   days_remaining:102 },
  { id:'CLM-5510', claim_id:'CLM-5510', payer_id:'Medicare',     payer:'Medicare',     amount:6100,  carc:'CO-4',  mf:'disputed',  mf_verdict:'disputed',  urg:'HIGH', urg_level:'HIGH', urgScore:81, denial_category:'Coding',         cat:'Coding',         appealSuccess:28, appealDrafted:false, patient_name:'Lisa Martinez',   days_remaining:112 },
  { id:'CLM-7788', claim_id:'CLM-7788', payer_id:'Aetna',        payer:'Aetna',        amount:8400,  carc:'CO-97', mf:'confirmed', mf_verdict:'confirmed', urg:'HIGH', urg_level:'HIGH', urgScore:78, denial_category:'Administrative', cat:'Administrative', appealSuccess:74, appealDrafted:true,  patient_name:'David Park',      days_remaining:119 },
  { id:'CLM-7204', claim_id:'CLM-7204', payer_id:'UnitedHealth', payer:'UnitedHealth', amount:2800,  carc:'PR-50', mf:'pending',   mf_verdict:'pending',   urg:'HIGH', urg_level:'HIGH', urgScore:75, denial_category:'Clinical',       cat:'Clinical',       appealSuccess:52, appealDrafted:false, patient_name:'Emily Davis',     days_remaining:128 },
  { id:'CLM-6632', claim_id:'CLM-6632', payer_id:'Cigna',        payer:'Cigna',        amount:3900,  carc:'CO-16', mf:'confirmed', mf_verdict:'confirmed', urg:'MED',  urg_level:'MED',  urgScore:68, denial_category:'Administrative', cat:'Administrative', appealSuccess:81, appealDrafted:true,  patient_name:'James Wilson',    days_remaining:133 },
  { id:'CLM-4821', claim_id:'CLM-4821', payer_id:'BCBS TX',      payer:'BCBS TX',      amount:4800,  carc:'CO-4',  mf:'confirmed', mf_verdict:'confirmed', urg:'MED',  urg_level:'MED',  urgScore:62, denial_category:'Coding',         cat:'Coding',         appealSuccess:71, appealDrafted:true,  patient_name:'Dr Kim Patient',  days_remaining:123 },
  { id:'CLM-3301', claim_id:'CLM-3301', payer_id:'Humana',       payer:'Humana',       amount:9800,  carc:'CO-29', mf:'disputed',  mf_verdict:'disputed',  urg:'MED',  urg_level:'MED',  urgScore:58, denial_category:'Administrative', cat:'Administrative', appealSuccess:22, appealDrafted:false, patient_name:'Robert Kim',      days_remaining:27  },
  { id:'CLM-2910', claim_id:'CLM-2910', payer_id:'Medicare',     payer:'Medicare',     amount:1200,  carc:'CO-11', mf:'confirmed', mf_verdict:'confirmed', urg:'MED',  urg_level:'MED',  urgScore:44, denial_category:'Clinical',       cat:'Clinical',       appealSuccess:79, appealDrafted:false, patient_name:'Anna Thompson',   days_remaining:136 },
];

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
 let result = appeals.length > 0 ? appeals : FALLBACK_CLAIMS;
 // Payer filter
 if (payerFilter) result = result.filter(a => (a.payer_id || a.payer) === payerFilter);
 // Category filter
 if (categoryFilter) result = result.filter(a => (a.denial_category || a.cat) === categoryFilter);
 // Status filter
 if (statusFilter) result = result.filter(a => a.status === statusFilter);
 // MiroFish verdict filter
 if (mfFilter) result = result.filter(a => (a.mf_verdict || a.mf) === mfFilter);
 // Urgency filter
 if (urgFilter) result = result.filter(a => (a.urg_level || a.urg) === urgFilter);
 // CARC code filter
 if (carcFilter) result = result.filter(a => (a.carc || a.carc_code) === carcFilter);
 // URL-based filters from AR Aging drill-down
 if (urlRootCause) result = result.filter(a => a.root_cause === urlRootCause || (a.denial_category || a.cat) === urlRootCause.replace('_MISMATCH','').replace('_LAPSE','').replace('_MISS','').replace('_MISSING',''));
 if (urlStatus) result = result.filter(a => a.status === urlStatus);
 return result;
 }, [appeals, payerFilter, categoryFilter, statusFilter, mfFilter, urgFilter, carcFilter, urlRootCause, urlStatus]);

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
                {filteredAppeals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-th-muted">
                    <span className="material-symbols-outlined text-2xl mb-2">search_off</span>
                    <p className="text-[11px]">No denials match current filters</p>
                  </div>
                ) : (
                  filteredAppeals.map((denial) => {
                    const claimId   = denial.claim_id || denial.id;
                    const payer     = denial.payer_id || denial.payer || '—';
                    const carc      = denial.carc || denial.carc_code || '—';
                    const mf        = denial.mf_verdict || denial.mf || 'pending';
                    const urg       = denial.urg_level  || denial.urg || 'MED';
                    const urgScore  = denial.urgScore || (urg === 'CRIT' ? 90 : urg === 'HIGH' ? 75 : 50);
                    const winPct    = denial.appealSuccess || denial.ai_confidence || 0;
                    const drafted   = denial.appealDrafted || false;
                    const patient   = denial.patient_name || '—';
                    const amt       = denial.amount || 0;
                    const isSelected = selectedClaim === claimId;

                    const rowBorder =
                      mf === 'confirmed' ? 'border-l-[rgb(var(--color-success))]' :
                      mf === 'disputed'  ? 'border-l-[rgb(var(--color-danger))]'  :
                                           'border-l-transparent';
                    const rowBg = isSelected
                      ? mf === 'confirmed' ? 'bg-[rgb(var(--color-success-bg))]'
                      : mf === 'disputed'  ? 'bg-[rgb(var(--color-danger-bg))]'
                      :                      'bg-[rgb(var(--color-primary-bg))]'
                      : 'hover:bg-th-surface-overlay';

                    const mfBadge =
                      mf === 'confirmed'
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border border-[rgb(var(--color-success)/0.3)]">✓ CONFIRMED</span>
                        : mf === 'disputed'
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))] border border-[rgb(var(--color-danger)/0.3)]">✗ DISPUTED</span>
                        : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))] border border-[rgb(var(--color-warning)/0.3)]">⏳ Pending</span>;

                    const urgColor =
                      urg === 'CRIT' ? 'text-[rgb(var(--color-danger))]' :
                      urg === 'HIGH' ? 'text-[rgb(var(--color-warning))]' :
                                       'text-th-muted';

                    const winBadge = winPct > 0 && (
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border',
                        winPct >= 75 ? 'bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border-[rgb(var(--color-success)/0.3)]' :
                        winPct >= 50 ? 'bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning)/0.3)]' :
                                       'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))] border-[rgb(var(--color-danger)/0.3)]'
                      )}>{winPct}% win</span>
                    );

                    return (
                      <div
                        key={claimId}
                        onClick={() => setSelectedClaim(claimId)}
                        className={cn(
                          'relative px-3 py-2.5 border-b border-th-border cursor-pointer transition-colors border-l-2',
                          rowBorder, rowBg
                        )}
                      >
                        <span className={cn('absolute right-2.5 top-2.5 text-[8.5px] font-bold font-mono', urgColor)}>
                          {urg} {urgScore}
                        </span>

                        <div className="flex items-center justify-between mb-1 pr-14">
                          <span className="text-[10px] font-bold font-mono text-[rgb(var(--color-info))]">{claimId}</span>
                          <span className="text-[11px] font-bold font-mono text-th-heading">${amt.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          <span className="text-[10px] text-th-secondary">{payer}</span>
                          <span className="font-mono text-[8.5px] text-[rgb(var(--color-danger))] bg-[rgb(var(--color-danger-bg))] px-1.5 py-0.5 rounded border border-[rgb(var(--color-danger)/0.2)]">{carc}</span>
                          <span className="text-[9.5px] text-th-muted">{patient}</span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {mfBadge}
                          {winBadge}
                          {drafted && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[rgb(var(--color-info-bg))] text-[rgb(var(--color-info))] border border-[rgb(var(--color-info)/0.3)]">
                              AI appeal drafted
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
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
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {(() => {
                  const claimId = selectedClaim || 'CLM-8821';
                  const detail  = CLAIM_DETAIL[claimId];
                  const fallback = (appeals.length > 0 ? appeals : FALLBACK_CLAIMS).find(
                    a => (a.claim_id || a.id) === claimId
                  );
                  if (!detail && !fallback) return (
                    <p className="text-[11px] text-th-muted italic text-center pt-8">
                      Click a denial row to load AI intelligence
                    </p>
                  );

                  const dos      = detail?.dos       || fallback?.created_at  || '—';
                  const denied   = detail?.denied    || '—';
                  const daysOut  = detail?.daysOut   || fallback?.days_remaining || '—';
                  const daysLeft = detail?.daysLeft  || fallback?.days_remaining || '—';
                  const cfNodes  = detail?.cfNodes   || [];
                  const rcCallout= detail?.rcCallout || '';
                  const rcSent   = detail?.rcSentiment || 'warn';

                  const dlColor = typeof daysLeft === 'number'
                    ? daysLeft < 30 ? 'text-[rgb(var(--color-danger))]'
                    : daysLeft < 90 ? 'text-[rgb(var(--color-warning))]'
                    :                 'text-[rgb(var(--color-success))]'
                    : 'text-th-muted';

                  const tlItems = [
                    { label:'DOS',      val: dos,                 type: 'ok'   },
                    { label:'Denied',   val: denied,              type: 'fail' },
                    { label:'Days Out', val: `${daysOut}d`,       type: 'warn' },
                    { label:'Deadline', val: `${daysLeft}d left`, type: typeof daysLeft === 'number' && daysLeft < 30 ? 'fail' : typeof daysLeft === 'number' && daysLeft < 90 ? 'warn' : 'ok' },
                  ];

                  const tlDot = {
                    ok:      'bg-[rgb(var(--color-success))] border-[rgb(var(--color-success))]',
                    fail:    'bg-[rgb(var(--color-danger))] border-[rgb(var(--color-danger))]',
                    warn:    'bg-[rgb(var(--color-warning))] border-[rgb(var(--color-warning))]',
                    neutral: 'bg-th-muted border-th-muted',
                  };

                  const cfColors = {
                    ok:      { circle:'bg-[rgb(var(--color-success-bg))] border-[rgb(var(--color-success))] text-[rgb(var(--color-success))]', name:'text-[rgb(var(--color-success))]', status:'text-[rgb(var(--color-success))]' },
                    warn:    { circle:'bg-[rgb(var(--color-warning-bg))] border-[rgb(var(--color-warning))] text-[rgb(var(--color-warning))]', name:'text-[rgb(var(--color-warning))]', status:'text-[rgb(var(--color-warning))]' },
                    fail:    { circle:'bg-[rgb(var(--color-danger-bg))] border-[rgb(var(--color-danger))] text-[rgb(var(--color-danger))]',   name:'text-[rgb(var(--color-danger))]',   status:'text-[rgb(var(--color-danger))]' },
                    act:     { circle:'bg-[rgb(var(--color-primary-bg))] border-[rgb(var(--color-info))] text-[rgb(var(--color-info))]',      name:'text-[rgb(var(--color-info))]',     status:'text-[rgb(var(--color-info))]' },
                    neutral: { circle:'bg-th-surface-overlay border-th-border text-th-muted',                                                 name:'text-th-muted',                     status:'text-th-muted' },
                  };

                  return (
                    <>
                      {/* ── CLAIM TIMELINE ── */}
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-th-muted font-mono mb-2">
                          Claim Timeline
                        </p>
                        <div className="flex border border-th-border rounded-lg overflow-hidden">
                          {tlItems.map((item, i) => (
                            <div key={i} className={cn(
                              'flex-1 text-center py-2 px-1 border-r border-th-border last:border-r-0',
                              i % 2 === 0 ? 'bg-th-surface-overlay' : 'bg-th-surface-raised'
                            )}>
                              <div className={cn(
                                'size-2 rounded-full mx-auto mb-1 border-[1.5px]',
                                tlDot[item.type] || tlDot.neutral
                              )} />
                              <p className="text-[7.5px] text-th-muted font-mono uppercase tracking-wider">{item.label}</p>
                              <p className={cn(
                                'text-[8.5px] font-semibold mt-0.5',
                                item.label === 'Deadline' ? dlColor : 'text-th-heading'
                              )}>{item.val}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── CONNECTING FACTORS ── */}
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-th-muted font-mono mb-2 pt-2 border-t border-th-border">
                          ⛓ Connecting Factors
                        </p>
                        <div className="overflow-x-auto pb-1">
                          <div className="flex items-center" style={{minWidth:'max-content',gap:0}}>
                            {cfNodes.map((node, i) => {
                              const colors = cfColors[node.type] || cfColors.neutral;
                              const nodeClick =
                                node.type === 'ok' && node.icon === '📄'
                                  ? () => navigate('/work/denials/appeals')
                                  : node.type === 'act' && node.icon === '🌊'
                                  ? () => navigate('/intelligence/simulation')
                                  : (node.icon === '👤' || node.icon === '🔑' || node.icon === '🔍')
                                  ? () => navigate('/analytics/prevention')
                                  : undefined;
                              return (
                                <React.Fragment key={i}>
                                  <div
                                    onClick={nodeClick}
                                    className={cn(
                                      'flex flex-col items-center gap-1 px-1.5 py-1.5 rounded-md transition-colors',
                                      nodeClick ? 'cursor-pointer hover:bg-th-surface-overlay' : ''
                                    )}
                                    style={{minWidth:'58px'}}
                                  >
                                    <div className={cn(
                                      'size-9 rounded-full flex items-center justify-center text-[15px] border-[1.5px] transition-transform hover:scale-110',
                                      colors.circle
                                    )}>
                                      {node.icon}
                                    </div>
                                    <p className={cn('text-[8px] font-bold text-center leading-tight', colors.name)}>
                                      {node.name}
                                    </p>
                                    <p className={cn('text-[7px] font-mono text-center', colors.status)}>
                                      {node.status}
                                    </p>
                                  </div>
                                  {i < cfNodes.length - 1 && (
                                    <span className="text-th-muted text-[10px] shrink-0 mb-4 px-0.5">›</span>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>

                        {/* Root Cause Callout */}
                        {rcCallout && (
                          <div className={cn(
                            'mt-2 px-3 py-2 rounded-md text-[10px] leading-relaxed border',
                            rcSent === 'danger'
                              ? 'bg-[rgb(var(--color-danger-bg))] border-[rgb(var(--color-danger)/0.3)] text-th-secondary'
                              : 'bg-[rgb(var(--color-warning-bg))] border-[rgb(var(--color-warning)/0.3)] text-th-secondary'
                          )}>
                            {rcCallout}
                          </div>
                        )}
                      </div>

                      {/* ── 5-LAYER RCA PLACEHOLDER ── */}
                      <div className="pt-2 border-t border-th-border">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-th-muted font-mono mb-2">
                          🧠 5-Layer AI Intelligence
                        </p>
                        <p className="text-[10px] text-th-muted italic">
                          RCA accordion — DW-5
                        </p>
                      </div>
                    </>
                  );
                })()}
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
